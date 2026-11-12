import express, { Request, Response } from "express";
import net from "net";
import { pool } from "../../db/schema.js";

export interface RawBiometricPunch {
  user_pin: string;
  timestamp: string | Date;
  status?: number | string; // 0: Check-In, 1: Check-Out, 2: Break-Out, 3: Break-In, 4: OT-In, 5: OT-Out
  verify_type?: number | string; // 1: Fingerprint, 2: PIN, 3: Card, 15: Face
  work_code?: string;
  raw_line?: string;
}

/**
 * Checks if an IP address belongs to RFC 1918 private subnets
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  const clean = ip.trim().replace(/^::ffff:/, "");
  if (clean === "localhost" || clean === "127.0.0.1" || clean === "::1") return true;
  if (/^10\./.test(clean)) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  if (/^192\.168\./.test(clean)) return true;
  return false;
}

/**
 * Real TCP Socket connection test
 */
export function testTcpSocket(host: string, port: number, timeoutMs = 4000): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      if (!resolved) {
        resolved = true;
        const latencyMs = Date.now() - startTime;
        socket.destroy();
        resolve({ success: true, latencyMs });
      }
    });

    socket.on("error", (err) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, latencyMs: Date.now() - startTime, error: err.message });
      }
    });

    socket.on("timeout", () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, latencyMs: Date.now() - startTime, error: `Connection timed out after ${timeoutMs}ms` });
      }
    });
  });
}

/**
 * Parses ZKTeco attlog.dat / text content.
 * Standard ZKTeco ATTLOG format:
 * PIN \t YYYY-MM-DD HH:mm:ss \t Status \t Verify \t WorkCode \t Reserved1 \t Reserved2
 * or space-separated variant.
 */
export function parseAttlogText(rawText: string): RawBiometricPunch[] {
  if (!rawText || typeof rawText !== "string") return [];
  const lines = rawText.split(/\r?\n/);
  const punches: RawBiometricPunch[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    // Check tab-separated first, then whitespace-separated
    let parts = trimmed.split("\t").map((p) => p.trim()).filter(Boolean);
    if (parts.length < 2) {
      parts = trimmed.split(/\s+/).map((p) => p.trim()).filter(Boolean);
    }

    if (parts.length >= 2) {
      const pin = parts[0];
      // Parts[1] and parts[2] might be Date and Time
      let datePart = parts[1];
      let timePart = parts[2] || "";
      let timestampStr = "";

      if (datePart.match(/^\d{4}-\d{2}-\d{2}$/) && timePart.match(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
        timestampStr = `${datePart} ${timePart}`;
      } else if (datePart.includes(" ") || datePart.includes("T")) {
        timestampStr = datePart;
      } else if (parts.length >= 3 && parts[1].includes("-") && parts[2].includes(":")) {
        timestampStr = `${parts[1]} ${parts[2]}`;
      } else {
        timestampStr = datePart;
      }

      // Validate date
      const d = new Date(timestampStr.replace(" ", "T"));
      if (!isNaN(d.getTime())) {
        const statusIdx = parts.length > 3 && !isNaN(parseInt(parts[3], 10)) ? 3 : 2;
        const verifyIdx = parts.length > 4 && !isNaN(parseInt(parts[4], 10)) ? 4 : 3;

        punches.push({
          user_pin: pin,
          timestamp: timestampStr,
          status: parts[statusIdx] ? parseInt(parts[statusIdx], 10) : 0,
          verify_type: parts[verifyIdx] ? parseInt(parts[verifyIdx], 10) : 1,
          raw_line: trimmed
        });
      }
    }
  }

  return punches;
}

/**
 * Real Biometric Punches Processor:
 * Matches user pins, groups punches by (employee, date), calculates clock-in, clock-out,
 * worked hours, late minutes, and upserts into hr_attendance.
 */
export async function processBiometricPunches(
  dbPool: any,
  companyId: number,
  punches: RawBiometricPunch[],
  deviceSn?: string,
  deviceModel?: string
): Promise<{
  success: boolean;
  total_received: number;
  synced_records: number;
  matched_employees: number;
  unmatched_pins: string[];
  processed_dates: string[];
  message: string;
}> {
  if (!punches || punches.length === 0) {
    return {
      success: true,
      total_received: 0,
      synced_records: 0,
      matched_employees: 0,
      unmatched_pins: [],
      processed_dates: [],
      message: "لا توجد بصمات في الحزمة المرسلة."
    };
  }

  // Ensure biometric tables exist
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS hr_biometric_devices (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      device_name TEXT NOT NULL,
      serial_number TEXT,
      model TEXT,
      mac_address TEXT,
      ip_address TEXT,
      port INTEGER DEFAULT 4370,
      comm_key TEXT DEFAULT '0',
      firmware_platform TEXT,
      fingerprint_algorithm TEXT,
      manufacturer TEXT,
      connection_mode TEXT DEFAULT 'lan_bridge',
      status TEXT DEFAULT 'offline',
      last_seen_at TIMESTAMP WITH TIME ZONE,
      last_sync_at TIMESTAMP WITH TIME ZONE,
      punches_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hr_biometric_punches (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
      device_sn TEXT,
      device_id INTEGER REFERENCES hr_biometric_devices(id) ON DELETE SET NULL,
      user_pin TEXT NOT NULL,
      punch_time TIMESTAMP WITH TIME ZONE NOT NULL,
      punch_type INTEGER DEFAULT 0,
      verify_type INTEGER DEFAULT 1,
      matched_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      sync_status TEXT DEFAULT 'processed',
      raw_line TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `).catch((e: any) => console.error("Error creating biometric tables:", e));

  // Update or register device in hr_biometric_devices
  let deviceDbId: number | null = null;
  if (deviceSn) {
    const devRes = await dbPool.query(`
      INSERT INTO hr_biometric_devices (company_id, device_name, serial_number, model, status, last_seen_at, last_sync_at, punches_count)
      VALUES ($1, $2, $3, $4, 'online', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $5)
      ON CONFLICT (id) DO UPDATE SET
        status = 'online',
        last_seen_at = CURRENT_TIMESTAMP,
        last_sync_at = CURRENT_TIMESTAMP,
        punches_count = hr_biometric_devices.punches_count + $5
      RETURNING id
    `, [companyId, deviceModel || `ZKTeco (${deviceSn})`, deviceSn, deviceModel || "ZKTeco Hardware", punches.length]).catch(() => null);

    if (devRes?.rows?.[0]) {
      deviceDbId = devRes.rows[0].id;
    }
  }

  // Pre-fetch all active employees for fast matching
  const empRes = await dbPool.query(`
    SELECT u.id AS user_id, u.name, u.email, u.company_id,
           COALESCE(h.employee_id, h.id_number, u.employee_id, CAST(u.id AS TEXT)) AS employee_id,
           h.id_number
    FROM users u
    LEFT JOIN hr_employees h ON u.id = h.user_id
    WHERE u.company_id = $1 AND u.status = 'active'
  `, [companyId]);

  const employees = empRes.rows;
  const findEmployee = (pin: string) => {
    const cleanPin = pin.trim().toLowerCase();
    return employees.find((e: any) => {
      const eId = (e.employee_id || "").toLowerCase();
      const idNum = (e.id_number || "").toLowerCase();
      const uId = String(e.user_id);
      return eId === cleanPin || idNum === cleanPin || uId === cleanPin;
    });
  };

  // Group punches by (user_id, dateStr)
  const groupedByUserDate = new Map<string, { user: any; date: string; timestamps: Date[] }>();
  const unmatchedPins = new Set<string>();

  for (const punch of punches) {
    const rawDate = typeof punch.timestamp === "string" ? new Date(punch.timestamp.replace(" ", "T")) : punch.timestamp;
    if (isNaN(rawDate.getTime())) continue;

    const dateStr = rawDate.toISOString().slice(0, 10);
    const emp = findEmployee(punch.user_pin);

    // Save individual raw punch
    await dbPool.query(`
      INSERT INTO hr_biometric_punches (company_id, device_sn, device_id, user_pin, punch_time, punch_type, verify_type, matched_user_id, sync_status, raw_line)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      companyId,
      deviceSn || "ZKTECO",
      deviceDbId,
      punch.user_pin,
      rawDate,
      typeof punch.status === "number" ? punch.status : 0,
      typeof punch.verify_type === "number" ? punch.verify_type : 1,
      emp ? emp.user_id : null,
      emp ? "processed" : "unmatched_pin",
      punch.raw_line || `${punch.user_pin}\t${rawDate.toISOString()}`
    ]).catch(() => {});

    if (!emp) {
      unmatchedPins.add(punch.user_pin);
      continue;
    }

    const key = `${emp.user_id}_${dateStr}`;
    if (!groupedByUserDate.has(key)) {
      groupedByUserDate.set(key, { user: emp, date: dateStr, timestamps: [] });
    }
    groupedByUserDate.get(key)!.timestamps.push(rawDate);
  }

  let syncedRecords = 0;
  const matchedUsers = new Set<number>();
  const processedDates = new Set<string>();

  // Process grouped punches
  for (const [, group] of groupedByUserDate.entries()) {
    const { user, date, timestamps } = group;
    timestamps.sort((a, b) => a.getTime() - b.getTime());

    matchedUsers.add(user.user_id);
    processedDates.add(date);

    const firstPunch = timestamps[0];
    const lastPunch = timestamps.length > 1 ? timestamps[timestamps.length - 1] : firstPunch;

    const clockInStr = firstPunch.toISOString();
    const clockOutStr = timestamps.length > 1 ? lastPunch.toISOString() : null;

    let workedHours = 0;
    if (clockOutStr && firstPunch.getTime() !== lastPunch.getTime()) {
      workedHours = Math.round(((lastPunch.getTime() - firstPunch.getTime()) / (1000 * 60 * 60)) * 100) / 100;
    }

    // Determine shift & late minutes
    const dateObj = new Date(date);
    const dayOfWeek = isNaN(dateObj.getTime()) ? 0 : dateObj.getDay();

    const shiftRes = await dbPool.query(`
      SELECT s.name as shift_name, s.start_time, s.end_time, s.grace_period_mins
      FROM hr_shift_assignments sa
      JOIN hr_shifts s ON sa.shift_id = s.id
      WHERE sa.user_id = $1 AND sa.day_of_week = $2
      ORDER BY sa.id DESC
      LIMIT 1
    `, [user.user_id, dayOfWeek]).catch(() => ({ rows: [] }));

    const shift = shiftRes.rows[0];
    const shiftName = shift?.shift_name || "الدوام الأساسي (Standard)";
    const shiftStart = shift?.start_time || "09:00";
    const gracePeriod = shift?.grace_period_mins || 15;

    // Calculate late minutes
    let lateMins = 0;
    const [sH, sM] = shiftStart.split(":").map((v: string) => parseInt(v, 10));
    if (!isNaN(sH) && !isNaN(sM)) {
      const punchHours = firstPunch.getHours();
      const punchMins = firstPunch.getMinutes();
      const punchTotalMinutes = punchHours * 60 + punchMins;
      const shiftTotalMinutes = sH * 60 + sM;
      if (punchTotalMinutes > shiftTotalMinutes + gracePeriod) {
        lateMins = punchTotalMinutes - shiftTotalMinutes;
      }
    }

    const attStatus = lateMins > 0 ? "Late" : "Present";

    // Upsert into hr_attendance
    await dbPool.query(`
      INSERT INTO hr_attendance (
        company_id, user_id, employee_id, date, clock_in, clock_out,
        status, shift_name, late_minutes, worked_hours, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, date) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        clock_in = COALESCE(hr_attendance.clock_in, EXCLUDED.clock_in),
        clock_out = COALESCE(EXCLUDED.clock_out, hr_attendance.clock_out),
        status = EXCLUDED.status,
        shift_name = EXCLUDED.shift_name,
        late_minutes = EXCLUDED.late_minutes,
        worked_hours = CASE
          WHEN EXCLUDED.worked_hours > 0 THEN EXCLUDED.worked_hours
          ELSE hr_attendance.worked_hours
        END,
        updated_at = CURRENT_TIMESTAMP
    `, [
      companyId,
      user.user_id,
      user.employee_id || String(user.user_id),
      date,
      clockInStr,
      clockOutStr,
      attStatus,
      shiftName,
      lateMins,
      workedHours
    ]);

    syncedRecords++;
  }

  const unmatchedArr = Array.from(unmatchedPins);
  const datesArr = Array.from(processedDates);

  let message = `تمت معالجة ${punches.length} بصمة حقيقية بنجاح! تم تحديث سجلات الحضور لـ ${matchedUsers.size} موظف عبر ${syncedRecords} يوم عمل.`;
  if (unmatchedArr.length > 0) {
    message += ` (تنبيه: وُجدت بصمات لأرقام غير مسجلة في شجرة الموظفين: ${unmatchedArr.slice(0, 5).join(", ")}${unmatchedArr.length > 5 ? "..." : ""})`;
  }

  return {
    success: true,
    total_received: punches.length,
    synced_records: syncedRecords,
    matched_employees: matchedUsers.size,
    unmatched_pins: unmatchedArr,
    processed_dates: datesArr,
    message
  };
}

/**
 * Returns a ready-to-run Python script for local LAN ZKTeco synchronization
 */
export function generatePythonBridgeScript(options: {
  deviceIp: string;
  devicePort: number;
  deviceSn: string;
  serverUrl: string;
  apiToken?: string;
}): string {
  const { deviceIp, devicePort, deviceSn, serverUrl, apiToken } = options;
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
========================================================================
Systo Biz - ZKTeco K14 Pro Smart LAN Bridge Agent (Incremental Sync)
========================================================================
- Target Device : ${deviceIp}:${devicePort} (K14 Pro)
- Device Serial : ${deviceSn}
- Cloud Target  : ${serverUrl}/api/hr/integrations/fingerprint/push
------------------------------------------------------------------------
Features:
  1. Initial Sync: Pulls punches from the LAST 30 DAYS ONLY (ignoring old years).
  2. Incremental Sync: Saves latest punch timestamp in 'zk_sync_state.json'
     so future syncs ONLY upload NEW punches added after that moment!
  3. Batch Streaming: Splits punches into chunks of 200 to prevent timeouts.
------------------------------------------------------------------------
Usage Commands:
  1. python zk_sync_agent.py test   -> Test device and cloud connection
  2. python zk_sync_agent.py        -> Sync new punches once
  3. python zk_sync_agent.py loop   -> Run in background syncing every 60s
  4. python zk_sync_agent.py reset  -> Reset sync state to re-sync last 30 days
========================================================================
"""

import sys
import os
import json
import time
from datetime import datetime, timedelta
import requests
from zk import ZK

# Configuration
DEVICE_IP = "${deviceIp}"
DEVICE_PORT = ${devicePort}
DEVICE_SN = "${deviceSn}"
SERVER_PUSH_URL = "${serverUrl}/api/hr/integrations/fingerprint/push"
API_TOKEN = "${apiToken || "systo_bridge_token_2026"}"

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "zk_sync_state.json")
DAYS_LOOKBACK = 30
BATCH_SIZE = 200

def load_sync_state():
    """Load the last synced punch timestamp from disk."""
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                last_time_str = data.get("last_synced_timestamp")
                if last_time_str:
                    return datetime.strptime(last_time_str, "%Y-%m-%d %H:%M:%S")
        except Exception as e:
            print(f"[!] Warning reading state file: {e}")
    return None

def save_sync_state(last_timestamp, count_synced=0):
    """Save the latest synced punch timestamp to disk."""
    try:
        data = {
            "last_synced_timestamp": last_timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "last_sync_run": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "last_batch_count": count_synced,
            "device_sn": DEVICE_SN,
            "device_ip": DEVICE_IP
        }
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"[!] Error saving sync state: {e}")

def test_connection():
    print("=" * 65)
    print(" [1/2] جارٍ فحص الاتصال بجهاز البصمة K14 Pro...")
    print(f"       الهدف: {DEVICE_IP}:{DEVICE_PORT} (سيريال: {DEVICE_SN})")
    print("=" * 65)
    
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=8, password=0, force_udp=False, ommit_ping=False)
    conn = None
    try:
        conn = zk.connect()
        conn.disable_device()
        
        firmware = conn.get_firmware_version()
        serial = conn.get_serialnumber() or DEVICE_SN
        platform = conn.get_platform()
        device_name = conn.get_device_name() or "K14 Pro"
        users = conn.get_users()
        attendances = conn.get_attendance()
        
        # Calculate last 30 days punches
        cutoff_30d = datetime.now() - timedelta(days=DAYS_LOOKBACK)
        recent_30d_count = sum(1 for a in attendances if a.timestamp >= cutoff_30d)
        
        last_state = load_sync_state()
        state_str = last_state.strftime('%Y-%m-%d %H:%M:%S') if last_state else "لم تتم مزامنة سابقة (سيبدأ من آخر 30 يوماً)"
        
        print("\n[SUCCESS] تم الاتصال بجهاز البصمة بنجاح تام!")
        print(f"  + اسم الجهاز        : {device_name}")
        print(f"  + الرقم التسلسلي    : {serial}")
        print(f"  + إصدار الفيرموير   : {firmware}")
        print(f"  + الموظفين بالذاكرة : {len(users)} موظف")
        print(f"  + إجمالي البصمات    : {len(attendances)} حركة (تاريخية منذ تشغيل الجهاز)")
        print(f"  + حركات آخر {DAYS_LOOKBACK} يوماً : {recent_30d_count} حركة فقط")
        print(f"  + آخر نقطة مزامنة   : {state_str}")
        
    except Exception as e:
        print(f"\n[FAIL] تعذر الاتصال بجهاز البصمة: {e}")
        return False
    finally:
        if conn:
            conn.enable_device()
            conn.disconnect()

    print("\n" + "=" * 65)
    print(" [2/2] جارٍ فحص الاتصال بالسيرفر السحابي...")
    print(f"       الرابط: {SERVER_PUSH_URL}")
    print("=" * 65)
    try:
        res = requests.post(SERVER_PUSH_URL, json={
            "device_sn": DEVICE_SN,
            "device_ip": DEVICE_IP,
            "device_model": "K14 Pro",
            "punches": []
        }, headers={
            "Content-Type": "application/json",
            "x-bridge-token": API_TOKEN
        }, timeout=10)
        
        if res.status_code in [200, 400]:
            print("[SUCCESS] السيرفر السحابي متاح وجاهز لاستقبال دفعات البصمات!")
        else:
            print(f"[WARN] السيرفر استجاب بالكود {res.status_code}")
    except Exception as e:
        print(f"[FAIL] تعذر الاتصال بالسيرفر: {e}")
        return False

    print("\n" + "=" * 65)
    print(" [جاهز للتشغيل]")
    print(" - لمزامنة الحركات الجديدة فقط: python zk_sync_agent.py")
    print(" - للمزامنة المستمرة في الخلفية: python zk_sync_agent.py loop")
    print("=" * 65 + "\n")
    return True

def sync_punches():
    last_synced_dt = load_sync_state()
    now = datetime.now()
    
    if last_synced_dt:
        cutoff_dt = last_synced_dt
        filter_label = f"الحركات الجديدة فقط المسجلة بعد [{cutoff_dt.strftime('%Y-%m-%d %H:%M:%S')}]"
    else:
        cutoff_dt = now - timedelta(days=DAYS_LOOKBACK)
        filter_label = f"حركات آخر {DAYS_LOOKBACK} يوماً فقط (منذ {cutoff_dt.strftime('%Y-%m-%d')})"

    print(f"[*] [{time.strftime('%Y-%m-%d %H:%M:%S')}] جارٍ الاتصال بجهاز K14 Pro ({DEVICE_IP}:{DEVICE_PORT})...")
    zk = ZK(DEVICE_IP, port=DEVICE_PORT, timeout=12, password=0, force_udp=False, ommit_ping=False)
    conn = None
    try:
        conn = zk.connect()
        conn.disable_device()
        
        serial = conn.get_serialnumber() or DEVICE_SN
        raw_attendances = conn.get_attendance()
        total_in_device = len(raw_attendances)
        
        # 1. Filter: Last 30 days or strictly newer than last_synced_dt
        new_attendances = [a for a in raw_attendances if a.timestamp > cutoff_dt]
        
        # Sort chronologically ascending
        new_attendances.sort(key=lambda x: x.timestamp)
        
        count_to_sync = len(new_attendances)
        print(f"[+] إجمالي الذاكرة: {total_in_device} حركة | المطلوب مزامنته ({filter_label}): {count_to_sync} حركة.")
        
        if count_to_sync == 0:
            print(f"[i] لا توجد أي بصمات جديدة. جميع السجلات متزامنة بالكامل حتى آخر بصمة.")
            return True

        # 2. Format Punches
        formatted_punches = []
        for att in new_attendances:
            formatted_punches.append({
                "user_pin": str(att.user_id),
                "timestamp": att.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "status": att.status,
                "punch_type": att.punch
            })

        # 3. Stream in Batches (e.g. 200 per chunk) to avoid timeouts
        total_batches = (count_to_sync + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"[*] جارٍ إرسال {count_to_sync} بصمة جديدة على {total_batches} دفعات سريعة لتفادي أي ضغط...")

        synced_total = 0
        latest_success_dt = last_synced_dt

        for i in range(total_batches):
            chunk = formatted_punches[i * BATCH_SIZE : (i + 1) * BATCH_SIZE]
            batch_num = i + 1
            print(f"    -> إرسال الدفعة [{batch_num}/{total_batches}] بعدد {len(chunk)} بصمة...")

            resp = requests.post(SERVER_PUSH_URL, json={
                "device_sn": serial,
                "device_ip": DEVICE_IP,
                "device_model": "K14 Pro",
                "punches": chunk
            }, headers={
                "Content-Type": "application/json",
                "x-bridge-token": API_TOKEN
            }, timeout=30)

            if resp.status_code == 200:
                try:
                    res_data = resp.json()
                    chunk_synced = res_data.get('synced_records', len(chunk))
                    synced_total += chunk_synced
                except Exception:
                    synced_total += len(chunk)
                
                # Track the highest timestamp in this successful chunk
                chunk_last_time_str = chunk[-1]["timestamp"]
                chunk_last_dt = datetime.strptime(chunk_last_time_str, "%Y-%m-%d %H:%M:%S")
                if latest_success_dt is None or chunk_last_dt > latest_success_dt:
                    latest_success_dt = chunk_last_dt

                # Immediately save progress
                save_sync_state(latest_success_dt, synced_total)
            else:
                print(f"[!] خطأ في إرسال الدفعة [{batch_num}]: كود {resp.status_code} - {resp.text[:120]}")
                return False

        print(f"\n[SUCCESS] تم إتمام المزامنة بنجاح تام!")
        print(f"          تم تحديث: {synced_total} سجل حضور في النظام.")
        print(f"          تم حفظ نقطة التوقف: [{latest_success_dt.strftime('%Y-%m-%d %H:%M:%S')}].")
        print(f"          في المرة القادمة، سيتم سحب البصمات الجديدة فقط التي تأتي بعد هذا التوقيت.\n")
        return True

    except Exception as e:
        print(f"[FAIL] خطأ أثناء المزامنة: {e}")
        return False
    finally:
        if conn:
            try:
                conn.enable_device()
                conn.disconnect()
            except Exception:
                pass

def reset_state():
    """Reset the sync state to start over from the last 30 days."""
    if os.path.exists(STATE_FILE):
        os.remove(STATE_FILE)
        print(f"[+] تم مسح ملف الحالة بنجاح ({STATE_FILE}).")
        print(f"[+] عند التشغيل القادم، سيبدأ بسحب آخر {DAYS_LOOKBACK} يوماً فقط.")
    else:
        print("[i] لا يوجد ملف حالة سابق.")

def main():
    mode = "once"
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower().strip("-")
        if arg in ["test", "t", "check"]:
            mode = "test"
        elif arg in ["loop", "l", "daemon", "service"]:
            mode = "loop"
        elif arg in ["reset", "clear"]:
            mode = "reset"

    if mode == "test":
        test_connection()
    elif mode == "reset":
        reset_state()
    elif mode == "loop":
        print("=" * 65)
        print(" Systo Biz - المزامنة الذكية المستمرة بالخلفية")
        print(f" الهدف: {DEVICE_IP}:{DEVICE_PORT} (سحب البصمات الجديدة فقط كل 60 ثانية)")
        print(" اضغط Ctrl + C في أي وقت للإيقاف.")
        print("=" * 65 + "\n")
        try:
            while True:
                sync_punches()
                print("[*] في انتظار البصمات الجديدة (الدورة القادمة بعد 60 ثانية)...\n")
                time.sleep(60)
        except KeyboardInterrupt:
            print("\n[*] تم إيقاف المزامنة.")
    else:
        sync_punches()

if __name__ == "__main__":
    main()
`;
}

/**
 * ZKTeco ADMS (Push Protocol) Router for Express
 * Mounted at /iclock
 */
export function createZktecoAdmsRouter(): express.Router {
  const router = express.Router();

  // 1. Handshake & Options (GET /iclock/cdata)
  router.get("/cdata", async (req: Request, res: Response) => {
    try {
      const sn = (req.query.SN || req.query.sn || "ZK_DEVICE").toString();
      const options = (req.query.options || "all").toString();

      console.log(`[ZKTeco ADMS] Handshake from SN: ${sn}, options: ${options}`);

      // Register / update device status in db
      await pool.query(`
        INSERT INTO hr_biometric_devices (company_id, device_name, serial_number, model, connection_mode, status, last_seen_at)
        VALUES (1, 'K14 Pro (Cloud ADMS)', $1, 'K14 Pro', 'adms_cloud', 'online', CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
          status = 'online',
          last_seen_at = CURRENT_TIMESTAMP
      `, [sn]).catch(() => {});

      // Standard ZKTeco configuration response
      res.setHeader("Content-Type", "text/plain");
      res.send(`GET OPTION FROM: ${sn}\nStamp=0\nOpStamp=0\nErrorDelay=60\nDelay=30\nTransTimes=00:00;14:00\nTransInterval=1\nTransFlag=1111000000\nRealtime=1\nEncrypt=0\n`);
    } catch (e: any) {
      console.error("[ZKTeco ADMS] GET /cdata error:", e);
      res.status(200).send("OK\n");
    }
  });

  // 2. Real-time Attendance Data Push (POST /iclock/cdata)
  router.post("/cdata", async (req: Request, res: Response) => {
    try {
      const sn = (req.query.SN || req.query.sn || "ZK_DEVICE").toString();
      const table = (req.query.table || "ATTLOG").toString().toUpperCase();

      console.log(`[ZKTeco ADMS] Data push from SN: ${sn}, table: ${table}`);

      const bodyText = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
      const punches = parseAttlogText(bodyText);

      console.log(`[ZKTeco ADMS] Parsed ${punches.length} punches from device ${sn}`);

      if (punches.length > 0) {
        await processBiometricPunches(pool, 1, punches, sn, "K14 Pro");
      }

      // ZKTeco protocol demands 'OK: <count>' or 'OK'
      res.setHeader("Content-Type", "text/plain");
      res.send(`OK: ${punches.length}\n`);
    } catch (e: any) {
      console.error("[ZKTeco ADMS] POST /cdata error:", e);
      res.status(200).send("OK\n");
    }
  });

  // 3. Command Polling (GET /iclock/getrequest)
  router.get("/getrequest", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain");
    res.send("OK\n");
  });

  // 4. Command Acknowledgment (POST /iclock/devicecmd)
  router.post("/devicecmd", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain");
    res.send("OK\n");
  });

  // 5. Device Registry (GET/POST /iclock/registry)
  router.all("/registry", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/plain");
    res.send("RegistryCode=OK\n");
  });

  // 6. Test ping endpoint
  router.get("/ping", (req: Request, res: Response) => {
    res.json({
      status: "online",
      service: "Systo Biz ZKTeco ADMS Cloud Receiver",
      server_time: new Date().toISOString()
    });
  });

  return router;
}
