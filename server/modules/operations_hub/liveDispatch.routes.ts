import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import ExcelJS from "exceljs";
import { pool } from "../../db/schema.js";
import { dbType } from "../../db/dbAdapter.js";
import { authenticate, AuthRequest } from "../../middleware/auth.js";

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "dispatch");
const ALLOWED_UPLOAD_EXTS = new Set([
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

let tablesInitialized = false;
let initPromise: Promise<void> | null = null;

async function ensureLiveDispatchTables(): Promise<void> {
  if (tablesInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const isMysql = dbType === "mysql";

      if (isMysql) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_teams (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            city VARCHAR(120) DEFAULT 'الجيزة',
            zone_coverage VARCHAR(255) DEFAULT '',
            store_code VARCHAR(80) DEFAULT '',
            max_trip_capacity INT DEFAULT 4,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_providers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            contact_phone VARCHAR(60) DEFAULT '',
            commission_rate DOUBLE DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_riders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            enroll_id VARCHAR(60) DEFAULT '',
            name VARCHAR(191) NOT NULL,
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            provider_name VARCHAR(191) DEFAULT '',
            mobile_number VARCHAR(60) DEFAULT '',
            acc_number VARCHAR(80) DEFAULT '',
            status VARCHAR(40) DEFAULT 'Off Duty',
            logged_in TINYINT(1) DEFAULT 1,
            on_demand TINYINT(1) DEFAULT 0,
            rating DOUBLE DEFAULT 0,
            app_version VARCHAR(40) DEFAULT '2026.10.03',
            device_type VARCHAR(40) DEFAULT 'android',
            bundle_name VARCHAR(120) DEFAULT '',
            national_id VARCHAR(80) DEFAULT '',
            vehicle_type VARCHAR(60) DEFAULT 'Motorcycle',
            zone_coverage VARCHAR(255) DEFAULT '',
            hiring_date DATE NULL,
            expiration_iqama_date DATE NULL,
            lat DOUBLE DEFAULT 30.0085,
            lng DOUBLE DEFAULT 31.1895,
            last_location_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active_orders_count INT DEFAULT 0,
            is_archived TINYINT(1) DEFAULT 0,
            archive_reason VARCHAR(255) DEFAULT '',
            archived_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_trips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            trip_number VARCHAR(80) NOT NULL,
            trip_type VARCHAR(120) DEFAULT '',
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            rider_id INT NULL,
            rider_name VARCHAR(191) DEFAULT '',
            status VARCHAR(40) DEFAULT 'Running',
            performance VARCHAR(40) DEFAULT 'NOT_RATED',
            is_manual TINYINT(1) DEFAULT 0,
            orders_count INT DEFAULT 0,
            expecting_duration_min DOUBLE DEFAULT 0,
            trip_duration_min DOUBLE DEFAULT 0,
            trip_distance_km DOUBLE DEFAULT 0,
            returning_duration_min DOUBLE DEFAULT 0,
            estimate_returning_min DOUBLE DEFAULT 0,
            planned_return_distance_km DOUBLE DEFAULT 0,
            total_amount DOUBLE DEFAULT 0,
            delivery_zone_extra_fees DOUBLE DEFAULT 0,
            live_location_percentage DOUBLE DEFAULT 100,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            order_number VARCHAR(80) NOT NULL,
            trip_id INT NULL,
            trip_number VARCHAR(80) DEFAULT '',
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            store_name VARCHAR(191) DEFAULT '',
            store_code VARCHAR(80) DEFAULT '',
            brand VARCHAR(120) DEFAULT '',
            city VARCHAR(120) DEFAULT 'الجيزة',
            customer_name VARCHAR(191) NOT NULL,
            customer_mobile VARCHAR(60) DEFAULT '',
            customer_zone VARCHAR(191) DEFAULT '',
            address TEXT,
            lat DOUBLE DEFAULT 30.0112,
            lng DOUBLE DEFAULT 31.1924,
            rider_id INT NULL,
            rider_name VARCHAR(191) DEFAULT '',
            rider_mobile VARCHAR(60) DEFAULT '',
            provider_name VARCHAR(191) DEFAULT '',
            status VARCHAR(40) DEFAULT 'Ready',
            performance VARCHAR(40) DEFAULT 'NOT_RATED',
            amount DOUBLE DEFAULT 0,
            balance_due DOUBLE DEFAULT 0,
            payment_type VARCHAR(30) DEFAULT 'Cash',
            is_manual TINYINT(1) DEFAULT 0,
            is_abused TINYINT(1) DEFAULT 0,
            abuse_reason VARCHAR(255) DEFAULT '',
            remove_abuse_requested TINYINT(1) DEFAULT 0,
            is_transferred TINYINT(1) DEFAULT 0,
            in_zone TINYINT(1) DEFAULT 1,
            vehicle_type VARCHAR(60) DEFAULT 'Motorcycle',
            note TEXT,
            created_by VARCHAR(120) DEFAULT 'System',
            set_as_ready_by VARCHAR(120) DEFAULT '',
            shift_date DATE NULL,
            scheduled_for DATETIME NULL,
            order_duration_min DOUBLE DEFAULT 0,
            distance_km DOUBLE DEFAULT 0,
            map_distance_km DOUBLE DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_shifts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            rider_id INT NULL,
            rider_name VARCHAR(191) NOT NULL,
            team_name VARCHAR(191) DEFAULT '',
            shift_date DATE NULL,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ended_at DATETIME NULL,
            status VARCHAR(30) DEFAULT 'Active',
            orders_completed INT DEFAULT 0,
            cash_collected DOUBLE DEFAULT 0,
            revenue_total DOUBLE DEFAULT 0,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_teams (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            city VARCHAR(120) DEFAULT 'الجيزة',
            zone_coverage VARCHAR(255) DEFAULT '',
            store_code VARCHAR(80) DEFAULT '',
            max_trip_capacity INT DEFAULT 4,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_providers (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            contact_phone VARCHAR(60) DEFAULT '',
            commission_rate DOUBLE PRECISION DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_riders (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            enroll_id VARCHAR(60) DEFAULT '',
            name VARCHAR(191) NOT NULL,
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            provider_name VARCHAR(191) DEFAULT '',
            mobile_number VARCHAR(60) DEFAULT '',
            acc_number VARCHAR(80) DEFAULT '',
            status VARCHAR(40) DEFAULT 'Off Duty',
            logged_in BOOLEAN DEFAULT TRUE,
            on_demand BOOLEAN DEFAULT FALSE,
            rating DOUBLE PRECISION DEFAULT 0,
            app_version VARCHAR(40) DEFAULT '2026.10.03',
            device_type VARCHAR(40) DEFAULT 'android',
            bundle_name VARCHAR(120) DEFAULT '',
            national_id VARCHAR(80) DEFAULT '',
            vehicle_type VARCHAR(60) DEFAULT 'Motorcycle',
            zone_coverage VARCHAR(255) DEFAULT '',
            hiring_date DATE NULL,
            expiration_iqama_date DATE NULL,
            lat DOUBLE PRECISION DEFAULT 30.0085,
            lng DOUBLE PRECISION DEFAULT 31.1895,
            last_location_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            active_orders_count INT DEFAULT 0,
            is_archived BOOLEAN DEFAULT FALSE,
            archive_reason VARCHAR(255) DEFAULT '',
            archived_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_trips (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            trip_number VARCHAR(80) NOT NULL,
            trip_type VARCHAR(120) DEFAULT '',
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            rider_id INT NULL,
            rider_name VARCHAR(191) DEFAULT '',
            status VARCHAR(40) DEFAULT 'Running',
            performance VARCHAR(40) DEFAULT 'NOT_RATED',
            is_manual BOOLEAN DEFAULT FALSE,
            orders_count INT DEFAULT 0,
            expecting_duration_min DOUBLE PRECISION DEFAULT 0,
            trip_duration_min DOUBLE PRECISION DEFAULT 0,
            trip_distance_km DOUBLE PRECISION DEFAULT 0,
            returning_duration_min DOUBLE PRECISION DEFAULT 0,
            estimate_returning_min DOUBLE PRECISION DEFAULT 0,
            planned_return_distance_km DOUBLE PRECISION DEFAULT 0,
            total_amount DOUBLE PRECISION DEFAULT 0,
            delivery_zone_extra_fees DOUBLE PRECISION DEFAULT 0,
            live_location_percentage DOUBLE PRECISION DEFAULT 100,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_orders (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            order_number VARCHAR(80) NOT NULL,
            trip_id INT NULL,
            trip_number VARCHAR(80) DEFAULT '',
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            store_name VARCHAR(191) DEFAULT '',
            store_code VARCHAR(80) DEFAULT '',
            brand VARCHAR(120) DEFAULT '',
            city VARCHAR(120) DEFAULT 'الجيزة',
            customer_name VARCHAR(191) NOT NULL,
            customer_mobile VARCHAR(60) DEFAULT '',
            customer_zone VARCHAR(191) DEFAULT '',
            address TEXT,
            lat DOUBLE PRECISION DEFAULT 30.0112,
            lng DOUBLE PRECISION DEFAULT 31.1924,
            rider_id INT NULL,
            rider_name VARCHAR(191) DEFAULT '',
            rider_mobile VARCHAR(60) DEFAULT '',
            provider_name VARCHAR(191) DEFAULT '',
            status VARCHAR(40) DEFAULT 'Ready',
            performance VARCHAR(40) DEFAULT 'NOT_RATED',
            amount DOUBLE PRECISION DEFAULT 0,
            balance_due DOUBLE PRECISION DEFAULT 0,
            payment_type VARCHAR(30) DEFAULT 'Cash',
            is_manual BOOLEAN DEFAULT FALSE,
            is_abused BOOLEAN DEFAULT FALSE,
            abuse_reason VARCHAR(255) DEFAULT '',
            remove_abuse_requested BOOLEAN DEFAULT FALSE,
            is_transferred BOOLEAN DEFAULT FALSE,
            in_zone BOOLEAN DEFAULT TRUE,
            vehicle_type VARCHAR(60) DEFAULT 'Motorcycle',
            note TEXT,
            created_by VARCHAR(120) DEFAULT 'System',
            set_as_ready_by VARCHAR(120) DEFAULT '',
            shift_date DATE NULL,
            scheduled_for TIMESTAMP NULL,
            order_duration_min DOUBLE PRECISION DEFAULT 0,
            distance_km DOUBLE PRECISION DEFAULT 0,
            map_distance_km DOUBLE PRECISION DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_shifts (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            rider_id INT NULL,
            rider_name VARCHAR(191) NOT NULL,
            team_name VARCHAR(191) DEFAULT '',
            shift_date DATE NULL,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ended_at TIMESTAMP NULL,
            status VARCHAR(30) DEFAULT 'Active',
            orders_completed INT DEFAULT 0,
            cash_collected DOUBLE PRECISION DEFAULT 0,
            revenue_total DOUBLE PRECISION DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      // Idempotently add extended Operations Order columns to dispatch_orders on existing databases
      const extraOrderCols: { name: string; mysqlDef: string; pgDef: string }[] = [
        { name: "service_number", mysqlDef: "VARCHAR(80) DEFAULT ''", pgDef: "VARCHAR(80) DEFAULT ''" },
        { name: "order_date", mysqlDef: "DATE NULL", pgDef: "DATE NULL" },
        { name: "order_category", mysqlDef: "VARCHAR(120) DEFAULT ''", pgDef: "VARCHAR(120) DEFAULT ''" },
        { name: "order_type", mysqlDef: "VARCHAR(120) DEFAULT ''", pgDef: "VARCHAR(120) DEFAULT ''" },
        { name: "service_urgency", mysqlDef: "VARCHAR(60) DEFAULT 'Standard'", pgDef: "VARCHAR(60) DEFAULT 'Standard'" },
        { name: "governorate", mysqlDef: "VARCHAR(120) DEFAULT ''", pgDef: "VARCHAR(120) DEFAULT ''" },
        { name: "description", mysqlDef: "TEXT", pgDef: "TEXT" },
        { name: "document_receipt", mysqlDef: "VARCHAR(80) DEFAULT 'Not Applicable'", pgDef: "VARCHAR(80) DEFAULT 'Not Applicable'" },
        { name: "operations_status", mysqlDef: "VARCHAR(60) DEFAULT 'New'", pgDef: "VARCHAR(60) DEFAULT 'New'" },
        { name: "hold_reason", mysqlDef: "VARCHAR(255) DEFAULT ''", pgDef: "VARCHAR(255) DEFAULT ''" },
        { name: "operations_officer", mysqlDef: "VARCHAR(191) DEFAULT ''", pgDef: "VARCHAR(191) DEFAULT ''" },
        { name: "current_queue", mysqlDef: "VARCHAR(100) DEFAULT 'Government'", pgDef: "VARCHAR(100) DEFAULT 'Government'" },
        { name: "current_stage", mysqlDef: "VARCHAR(191) DEFAULT ''", pgDef: "VARCHAR(191) DEFAULT ''" },
        { name: "case_priority", mysqlDef: "VARCHAR(40) DEFAULT 'Normal'", pgDef: "VARCHAR(40) DEFAULT 'Normal'" },
        { name: "payment_status", mysqlDef: "VARCHAR(60) DEFAULT 'Unpaid'", pgDef: "VARCHAR(60) DEFAULT 'Unpaid'" },
        { name: "ready_to_close_sale", mysqlDef: "TINYINT(1) DEFAULT 0", pgDef: "BOOLEAN DEFAULT FALSE" },
        { name: "sales_status", mysqlDef: "VARCHAR(60) DEFAULT 'Open'", pgDef: "VARCHAR(60) DEFAULT 'Open'" },
        { name: "individuals_completed", mysqlDef: "INT DEFAULT 0", pgDef: "INT DEFAULT 0" },
        { name: "individuals_total", mysqlDef: "INT DEFAULT 1", pgDef: "INT DEFAULT 1" },
        { name: "files_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" },
        { name: "operational_files_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" },
        { name: "service_units_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" },
        { name: "operations_executions_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" },
        { name: "representatives_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" },
        { name: "change_history_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" }
      ];

      for (const col of extraOrderCols) {
        try {
          if (isMysql) {
            await pool.query(`ALTER TABLE dispatch_orders ADD COLUMN ${col.name} ${col.mysqlDef}`);
          } else {
            await pool.query(`ALTER TABLE dispatch_orders ADD COLUMN IF NOT EXISTS ${col.name} ${col.pgDef}`);
          }
        } catch (alterErr: any) {
          const code = alterErr?.code || "";
          const msg = String(alterErr?.message || "").toLowerCase();
          if (code !== "ER_DUP_FIELDNAME" && code !== "42701" && !msg.includes("duplicate column")) {
            console.warn(`ensureLiveDispatchTables column ${col.name} warning:`, alterErr?.message);
          }
        }
      }

      // Create Store, Customer Zones & Smart Routes tables (MySQL / PostgreSQL dual-compatible)
      if (isMysql) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_stores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            brand VARCHAR(120) DEFAULT '',
            code VARCHAR(80) DEFAULT '',
            city VARCHAR(120) DEFAULT 'Cairo',
            address TEXT,
            lat DOUBLE DEFAULT 29.99884,
            lng DOUBLE DEFAULT 31.159592,
            is_active TINYINT(1) DEFAULT 1,
            config_json LONGTEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_customer_zones (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            store_id INT NOT NULL,
            name VARCHAR(191) NOT NULL,
            city VARCHAR(120) DEFAULT 'Cairo',
            has_geofence TINYINT(1) DEFAULT 0,
            geofence_radius_m INT DEFAULT 1000,
            geofence_polygon_json LONGTEXT,
            geofence_color VARCHAR(32) DEFAULT '#0d9488',
            lat DOUBLE DEFAULT 29.99884,
            lng DOUBLE DEFAULT 31.159592,
            default_vehicle_type VARCHAR(60) DEFAULT 'Motorcycle',
            extra_fees DOUBLE DEFAULT 0,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_smart_routes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            store_id INT NOT NULL,
            name VARCHAR(191) NOT NULL,
            zone_ids_json LONGTEXT,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_stores (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            brand VARCHAR(120) DEFAULT '',
            code VARCHAR(80) DEFAULT '',
            city VARCHAR(120) DEFAULT 'Cairo',
            address TEXT,
            lat DOUBLE PRECISION DEFAULT 29.99884,
            lng DOUBLE PRECISION DEFAULT 31.159592,
            is_active BOOLEAN DEFAULT TRUE,
            config_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_customer_zones (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            store_id INT NOT NULL,
            name VARCHAR(191) NOT NULL,
            city VARCHAR(120) DEFAULT 'Cairo',
            has_geofence BOOLEAN DEFAULT FALSE,
            geofence_radius_m INT DEFAULT 1000,
            geofence_polygon_json TEXT,
            geofence_color VARCHAR(32) DEFAULT '#0d9488',
            lat DOUBLE PRECISION DEFAULT 29.99884,
            lng DOUBLE PRECISION DEFAULT 31.159592,
            default_vehicle_type VARCHAR(60) DEFAULT 'Motorcycle',
            extra_fees DOUBLE PRECISION DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_smart_routes (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            store_id INT NOT NULL,
            name VARCHAR(191) NOT NULL,
            zone_ids_json TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      // Create dispatch_wallet_transactions table for Rider & Store Accounting / Wallets
      if (isMysql) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_wallet_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            provider_name VARCHAR(191) DEFAULT '',
            rider_id INT NULL,
            rider_name VARCHAR(191) NOT NULL,
            enroll_id VARCHAR(60) DEFAULT '',
            trip_id INT NULL,
            trip_number VARCHAR(80) DEFAULT '',
            transaction_type VARCHAR(60) DEFAULT 'COMPLETE_TRIP',
            is_award TINYINT(1) DEFAULT 1,
            amount DOUBLE DEFAULT 0,
            currency VARCHAR(16) DEFAULT 'EGP',
            notes TEXT,
            created_by VARCHAR(120) DEFAULT 'System',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_wallet_transactions (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            provider_name VARCHAR(191) DEFAULT '',
            rider_id INT NULL,
            rider_name VARCHAR(191) NOT NULL,
            enroll_id VARCHAR(60) DEFAULT '',
            trip_id INT NULL,
            trip_number VARCHAR(80) DEFAULT '',
            transaction_type VARCHAR(60) DEFAULT 'COMPLETE_TRIP',
            is_award BOOLEAN DEFAULT TRUE,
            amount DOUBLE PRECISION DEFAULT 0,
            currency VARCHAR(16) DEFAULT 'EGP',
            notes TEXT,
            created_by VARCHAR(120) DEFAULT 'System',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      // Idempotently add GeoFence polygon & color columns to dispatch_customer_zones on existing DBs
      const extraZoneCols: { name: string; mysqlDef: string; pgDef: string }[] = [
        { name: "geofence_polygon_json", mysqlDef: "LONGTEXT", pgDef: "TEXT" },
        { name: "geofence_color", mysqlDef: "VARCHAR(32) DEFAULT '#0d9488'", pgDef: "VARCHAR(32) DEFAULT '#0d9488'" }
      ];
      for (const col of extraZoneCols) {
        try {
          if (isMysql) {
            await pool.query(`ALTER TABLE dispatch_customer_zones ADD COLUMN ${col.name} ${col.mysqlDef}`);
          } else {
            await pool.query(`ALTER TABLE dispatch_customer_zones ADD COLUMN IF NOT EXISTS ${col.name} ${col.pgDef}`);
          }
        } catch (alterErr: any) {
          const code = alterErr?.code || "";
          const msg = String(alterErr?.message || "").toLowerCase();
          if (code !== "ER_DUP_FIELDNAME" && code !== "42701" && !msg.includes("duplicate column")) {
            console.warn(`ensureLiveDispatchTables zone column ${col.name} warning:`, alterErr?.message);
          }
        }
      }

      // Idempotently add payroll_method & payroll_method_number to dispatch_riders
      const extraRiderCols: { name: string; mysqlDef: string; pgDef: string }[] = [
        { name: "payroll_method", mysqlDef: "VARCHAR(80) DEFAULT ''", pgDef: "VARCHAR(80) DEFAULT ''" },
        { name: "payroll_method_number", mysqlDef: "VARCHAR(120) DEFAULT ''", pgDef: "VARCHAR(120) DEFAULT ''" }
      ];
      for (const col of extraRiderCols) {
        try {
          if (isMysql) {
            await pool.query(`ALTER TABLE dispatch_riders ADD COLUMN ${col.name} ${col.mysqlDef}`);
          } else {
            await pool.query(`ALTER TABLE dispatch_riders ADD COLUMN IF NOT EXISTS ${col.name} ${col.pgDef}`);
          }
        } catch (alterErr: any) {
          const code = alterErr?.code || "";
          const msg = String(alterErr?.message || "").toLowerCase();
          if (code !== "ER_DUP_FIELDNAME" && code !== "42701" && !msg.includes("duplicate column")) {
            console.warn(`ensureLiveDispatchTables rider column ${col.name} warning:`, alterErr?.message);
          }
        }
      }

      // Idempotently add trip_type to dispatch_trips on existing DBs
      try {
        if (isMysql) {
          await pool.query("ALTER TABLE dispatch_trips ADD COLUMN trip_type VARCHAR(120) DEFAULT ''");
        } else {
          await pool.query("ALTER TABLE dispatch_trips ADD COLUMN IF NOT EXISTS trip_type VARCHAR(120) DEFAULT ''");
        }
      } catch (alterErr: any) {
        const code = alterErr?.code || "";
        const msg = String(alterErr?.message || "").toLowerCase();
        if (code !== "ER_DUP_FIELDNAME" && code !== "42701" && !msg.includes("duplicate column")) {
          console.warn("ensureLiveDispatchTables trip_type column warning:", alterErr?.message);
        }
      }

      // Create Reasons, Rider Revenue Rules & Trip Types tables (MySQL / PostgreSQL dual-compatible)
      if (isMysql) {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_reasons (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            category VARCHAR(60) NOT NULL,
            name VARCHAR(191) NOT NULL,
            reason_type VARCHAR(80) DEFAULT '',
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_rider_revenue_rules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            scope VARCHAR(20) NOT NULL DEFAULT 'company',
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            online_shift_hours_enabled TINYINT(1) DEFAULT 0,
            online_shift_hour_price DOUBLE DEFAULT 0,
            excellent_trip_revenue DOUBLE DEFAULT 2,
            good_trip_revenue DOUBLE DEFAULT 1,
            late_trip_revenue DOUBLE DEFAULT 0,
            abuse_trip_deduction DOUBLE DEFAULT 12,
            order_rev_excellent DOUBLE DEFAULT 0,
            order_rev_good DOUBLE DEFAULT 0,
            order_rev_late DOUBLE DEFAULT 0,
            order_rev_abuse DOUBLE DEFAULT 0,
            trip_ignoring_enabled TINYINT(1) DEFAULT 0,
            trip_ignoring_deduction DOUBLE DEFAULT 0,
            trip_ignoring_penalization_enabled TINYINT(1) DEFAULT 0,
            trip_ignoring_penalization_deduction DOUBLE DEFAULT 0,
            rider_abuse_penalization_enabled TINYINT(1) DEFAULT 0,
            rider_abuse_penalization_deduction DOUBLE DEFAULT 0,
            currency VARCHAR(16) DEFAULT 'EGP',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_trip_types (
            id INT AUTO_INCREMENT PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            code VARCHAR(60) DEFAULT '',
            description TEXT,
            base_fee DOUBLE DEFAULT 0,
            max_orders INT DEFAULT 4,
            is_active TINYINT(1) DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      } else {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_reasons (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            category VARCHAR(60) NOT NULL,
            name VARCHAR(191) NOT NULL,
            reason_type VARCHAR(80) DEFAULT '',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_rider_revenue_rules (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            scope VARCHAR(20) NOT NULL DEFAULT 'company',
            team_id INT NULL,
            team_name VARCHAR(191) DEFAULT '',
            online_shift_hours_enabled BOOLEAN DEFAULT FALSE,
            online_shift_hour_price DOUBLE PRECISION DEFAULT 0,
            excellent_trip_revenue DOUBLE PRECISION DEFAULT 2,
            good_trip_revenue DOUBLE PRECISION DEFAULT 1,
            late_trip_revenue DOUBLE PRECISION DEFAULT 0,
            abuse_trip_deduction DOUBLE PRECISION DEFAULT 12,
            order_rev_excellent DOUBLE PRECISION DEFAULT 0,
            order_rev_good DOUBLE PRECISION DEFAULT 0,
            order_rev_late DOUBLE PRECISION DEFAULT 0,
            order_rev_abuse DOUBLE PRECISION DEFAULT 0,
            trip_ignoring_enabled BOOLEAN DEFAULT FALSE,
            trip_ignoring_deduction DOUBLE PRECISION DEFAULT 0,
            trip_ignoring_penalization_enabled BOOLEAN DEFAULT FALSE,
            trip_ignoring_penalization_deduction DOUBLE PRECISION DEFAULT 0,
            rider_abuse_penalization_enabled BOOLEAN DEFAULT FALSE,
            rider_abuse_penalization_deduction DOUBLE PRECISION DEFAULT 0,
            currency VARCHAR(16) DEFAULT 'EGP',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        await pool.query(`
          CREATE TABLE IF NOT EXISTS dispatch_trip_types (
            id SERIAL PRIMARY KEY,
            company_id INT DEFAULT 1,
            name VARCHAR(191) NOT NULL,
            code VARCHAR(60) DEFAULT '',
            description TEXT,
            base_fee DOUBLE PRECISION DEFAULT 0,
            max_orders INT DEFAULT 4,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      // Seed default trip types only if empty so Create New Trip immediately has options
      const tripTypeCheck = await pool.query("SELECT id FROM dispatch_trip_types LIMIT 1");
      if (!tripTypeCheck.rows || tripTypeCheck.rows.length === 0) {
        const defaultTripTypes = [
          ["Standard Delivery", "STD", "Regular dispatch trip for standard orders", 0, 4],
          ["Express Trip", "EXP", "High-priority direct trip with accelerated SLA", 15, 2],
          ["Scheduled Trip", "SCH", "Pre-booked trip assigned to a time window", 0, 6]
        ];
        for (const [tName, tCode, tDesc, tFee, tMax] of defaultTripTypes) {
          await pool.query(
            `INSERT INTO dispatch_trip_types (company_id, name, code, description, base_fee, max_orders, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [1, tName, tCode, tDesc, tFee, tMax, true]
          );
        }
      }

      // Ensure at least 1 default team, provider & store exist so dropdowns are ready on first launch
      const teamCheck = await pool.query("SELECT id FROM dispatch_teams LIMIT 1");
      if (!teamCheck.rows || teamCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO dispatch_teams (company_id, name, city, zone_coverage, store_code, max_trip_capacity, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [1, "Faisal Branch", "Cairo", "Faisal - Haram - Talbiya", "RBST-002", 4, true]
        );
      }

      const provCheck = await pool.query("SELECT id FROM dispatch_providers LIMIT 1");
      if (!provCheck.rows || provCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO dispatch_providers (company_id, name, contact_phone, commission_rate, is_active)
           VALUES ($1, $2, $3, $4, $5)`,
          [1, "Wesaya", "01000000000", 0, true]
        );
      }

      const storeCheck = await pool.query("SELECT id FROM dispatch_stores LIMIT 1");
      if (!storeCheck.rows || storeCheck.rows.length === 0) {
        await pool.query(
          `INSERT INTO dispatch_stores (company_id, name, brand, code, city, address, lat, lng, is_active, config_json)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            1,
            "Faisal Branch",
            "Wesaya",
            "RBST-002",
            "Cairo",
            "Cairo",
            29.99884,
            31.159592,
            true,
            JSON.stringify(DEFAULT_STORE_CONFIG)
          ]
        );
      }

      tablesInitialized = true;
    } catch (err) {
      console.error("ensureLiveDispatchTables error:", err);
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

function getCompanyId(req: express.Request): number {
  const cId = Number((req as any).user?.company_id);
  return Number.isFinite(cId) && cId > 0 ? cId : 1;
}

function toNum(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
}

function toNullableDate(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (!s) return null;
  const m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function generateTripCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  let prefix = "";
  for (let i = 0; i < 4; i++) {
    prefix += chars[Math.floor(Math.random() * chars.length)];
  }
  const num = Math.floor(100 + Math.random() * 899);
  return `${prefix}-${num}`;
}

function generateOrderNumber(): string {
  return crypto.randomBytes(4).toString("hex");
}

function generateServiceNumber(): string {
  return crypto.randomBytes(4).toString("hex");
}

const DEFAULT_STORE_CONFIG = {
  dispatchingQueue: {
    queueParameter: "Based on Rider Queue only",
    closeToPickupEnabled: false,
    closeToPickupMeters: 0,
    inRangeOfPickupEnabled: false,
    inRangeOfPickupMeters: 0,
    farFromPickupEnabled: false,
    farFromPickupMeters: 0
  },
  dispatchingSettings: {
    limitMaxTripCapacity: 3,
    defaultTripCapacity: 2,
    scheduledMaxCapacities: [] as Array<{
      id: string;
      days: string;
      fromTime: string;
      toTime: string;
      maxCapacity: number;
    }>,
    orderStartStatus: "In Progress",
    maximumGroupingTimeMin: 10,
    tripCapacitySmartAutoComplete: true,
    maxTimeLimitEnabled: true,
    maxTimeLimitMin: 6,
    preventManualAssignOrderToTrip: false,
    customerZoneOption: "Area",
    expirationTimeEnabled: false,
    expirationTimeMin: 0,
    minimumTimeBetweenTripsEnabled: true,
    minimumTimeBetweenTripsMin: 5
  },
  riderOrderJourney: {
    riderOnMyWayToPickup: false,
    arrivedToPickup: false,
    arrivedToPickupDistanceRestriction: false,
    arrivedToPickupDistanceMeters: 0,
    automaticArriveToPickup: false,
    smartPickupEnabled: false,
    smartPickupSeconds: 0,
    pickedUpDistanceRestriction: true,
    pickedUpDistanceMeters: 100,
    wayToDropOffAction: true,
    smartOnMyWay: false,
    customerServingTimeMin: 5,
    dropOffImageCaptureEnabled: false,
    arrivedToCustomerAction: false,
    arrivedToCustomerDistanceRestriction: false,
    arrivedToCustomerDistanceMeters: 0,
    automaticArriveToCustomer: false,
    orderDeliveryGpsRestriction: true,
    orderDeliveryGpsMeters: 200,
    orderDeliveryGpsOutOfZoneAction: "Disable the deliver button",
    orderDeliveryGeofenceRestriction: true,
    orderDeliveryGeofenceOutOfZoneAction: "Disable the deliver button",
    failedToDeliverTripRunningAction: "Ability to deliver it again",
    cantDeliverShippingAddressRadiusEnabled: false,
    cantDeliverShippingAddressRadiusMeters: 0,
    cantDeliverStoreRadiusEnabled: false,
    cantDeliverStoreRadiusMeters: 0
  },
  ordersAbuse: {
    enabled: true,
    distancePickupToDropoffEnabled: true,
    distancePickupToDropoffMinMeters: 50,
    distancePickupToDropoffMaxEnabled: false,
    distancePickupToDropoffMaxMeters: 0,
    distancePickupToDropoffMaxKm: 0,
    timePickupToDropoffEnabled: true,
    timePickupToDropoffMinMinutes: 3,
    timeBetweenTwoOrdersEnabled: true,
    timeBetweenTwoOrdersMinMinutes: 2,
    fromOrderCreationEnabled: false,
    fromOrderCreationMinMinutes: 0
  },
  gpsLocations: {
    closeToFirstOrderEnabled: false,
    closeToFirstOrderMeters: 0,
    withinRangeOfFirstOrderEnabled: false,
    withinRangeOfFirstOrderMeters: 0
  },
  sla: {
    deliveryExcellentUnderMin: 25,
    deliveryGoodUnderMin: 35,
    deliveryLateOverMin: 35,
    orderPreparationMin: 20,
    orderFetchingMin: 5,
    onMyWayToPickupMin: 10,
    arriveToPickupMin: 0,
    riderWaitingInStoreMin: 3,
    pickedUpTimeMin: 0,
    arriveToCustomerMin: 10,
    customerAvgServingTimeMin: 5
  }
};

function normalizeStoreRow(row: any) {
  if (!row) return row;
  let parsedConfig: any = {};
  if (typeof row.config_json === "string" && row.config_json.trim()) {
    try {
      parsedConfig = JSON.parse(row.config_json);
    } catch {
      parsedConfig = {};
    }
  } else if (row.config_json && typeof row.config_json === "object") {
    parsedConfig = row.config_json;
  }

  return {
    ...row,
    is_active: row.is_active === undefined ? true : Boolean(row.is_active),
    lat: toNum(row.lat, 29.99884),
    lng: toNum(row.lng, 31.159592),
    config: {
      dispatchingQueue: { ...DEFAULT_STORE_CONFIG.dispatchingQueue, ...(parsedConfig.dispatchingQueue || {}) },
      dispatchingSettings: { ...DEFAULT_STORE_CONFIG.dispatchingSettings, ...(parsedConfig.dispatchingSettings || {}) },
      riderOrderJourney: { ...DEFAULT_STORE_CONFIG.riderOrderJourney, ...(parsedConfig.riderOrderJourney || {}) },
      ordersAbuse: { ...DEFAULT_STORE_CONFIG.ordersAbuse, ...(parsedConfig.ordersAbuse || {}) },
      gpsLocations: { ...DEFAULT_STORE_CONFIG.gpsLocations, ...(parsedConfig.gpsLocations || {}) },
      sla: { ...DEFAULT_STORE_CONFIG.sla, ...(parsedConfig.sla || {}) }
    }
  };
}

function normalizeRouteRow(row: any) {
  if (!row) return row;
  return {
    ...row,
    is_active: row.is_active === undefined ? true : Boolean(row.is_active),
    zones: safeParseJsonArray(row.zone_ids_json)
  };
}

function safeParseJsonArray<T = any>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeOrderRow(row: any) {
  if (!row) return row;
  const serviceUnits = safeParseJsonArray(row.service_units_json);
  const completedFromUnits = serviceUnits.filter(
    (u: any) => String(u?.status || "").toLowerCase() === "completed"
  ).length;
  const totalFromUnits = serviceUnits.length;

  return {
    ...row,
    service_number: row.service_number || "",
    order_date: toNullableDate(row.order_date || row.shift_date),
    order_category: row.order_category || "",
    order_type: row.order_type || "",
    service_urgency: row.service_urgency || "Standard",
    governorate: row.governorate || row.city || "",
    description: row.description || row.note || "",
    document_receipt: row.document_receipt || "Not Applicable",
    operations_status: row.operations_status || "New",
    hold_reason: row.hold_reason || "",
    operations_officer: row.operations_officer || "",
    current_queue: row.current_queue || "Government",
    current_stage: row.current_stage || "",
    case_priority: row.case_priority || "Normal",
    payment_status: row.payment_status || (row.payment_type === "Paid" ? "Paid" : "Unpaid"),
    ready_to_close_sale: Boolean(row.ready_to_close_sale),
    sales_status: row.sales_status || "Open",
    individuals_completed:
      totalFromUnits > 0 ? completedFromUnits : toNum(row.individuals_completed, 0),
    individuals_total:
      totalFromUnits > 0 ? totalFromUnits : Math.max(1, toNum(row.individuals_total, 1)),
    files: safeParseJsonArray(row.files_json),
    operational_files: safeParseJsonArray(row.operational_files_json),
    service_units: serviceUnits,
    operations_executions: safeParseJsonArray(row.operations_executions_json),
    representatives: safeParseJsonArray(row.representatives_json),
    change_history: safeParseJsonArray(row.change_history_json)
  };
}

function buildChangeDiffs(
  prev: Record<string, any>,
  next: Record<string, any>
): { field: string; oldValue: string; newValue: string }[] {
  const tracked: [string, string][] = [
    ["service_number", "Service Number"],
    ["order_number", "Order Number"],
    ["customer_name", "Customer Name"],
    ["customer_mobile", "Customer Mobile"],
    ["order_date", "Order Date"],
    ["order_category", "Order Category"],
    ["order_type", "Order Type"],
    ["service_urgency", "Urgency Type"],
    ["governorate", "Governorate"],
    ["address", "Address"],
    ["description", "Description"],
    ["document_receipt", "Document Receipt"],
    ["operations_status", "Operations Status"],
    ["hold_reason", "Operations Hold Reason"],
    ["operations_officer", "Operations Officer"],
    ["current_queue", "Current Queue"],
    ["current_stage", "Current Stage"],
    ["case_priority", "Case Priority"],
    ["payment_status", "Payment Status"],
    ["ready_to_close_sale", "Ready to Close Sale"],
    ["sales_status", "Sales Status"],
    ["status", "Dispatch Status"],
    ["amount", "Total Amount"],
    ["balance_due", "Balance Due"]
  ];

  const formatVal = (v: any): string => {
    if (v === true) return "Yes";
    if (v === false) return "No";
    if (v === null || v === undefined || String(v).trim() === "") return "—";
    return String(v).trim();
  };

  const diffs: { field: string; oldValue: string; newValue: string }[] = [];
  for (const [key, label] of tracked) {
    const oldStr = formatVal(prev[key]);
    const newStr = formatVal(next[key]);
    if (oldStr !== newStr) {
      diffs.push({ field: label, oldValue: oldStr, newValue: newStr });
    }
  }
  return diffs;
}

function computeKpis(orders: any[], trips: any[], riders: any[]) {
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const cancelledOrders = orders.filter((o) => o.status === "Canceled" || o.status === "Returned");
  const scheduledOrders = orders.filter((o) => o.status === "Scheduled");
  const pendingOrders = orders.filter((o) => o.status === "Ready" || o.status === "In Progress");
  const pausedOrders = orders.filter((o) => o.status === "Paused");
  const onTripOrders = orders.filter((o) =>
    ["On Trip", "Picked-up", "Way To Customer"].includes(o.status)
  );
  const abusedOrders = orders.filter((o) => Boolean(o.is_abused));
  const lateOrders = orders.filter((o) => o.performance === "LATE");
  const excellentOrders = orders.filter((o) => o.performance === "EXCELLENT");
  const autoOrders = orders.filter((o) => !o.is_manual);

  const avgDeliveryMin =
    deliveredOrders.length > 0
      ? Number(
          (
            deliveredOrders.reduce((s, o) => s + toNum(o.order_duration_min, 0), 0) /
            deliveredOrders.length
          ).toFixed(1)
        )
      : 0;

  const ratedOrdersCount = orders.filter((o) => o.performance && o.performance !== "NOT_RATED").length;
  const excellentTasksPct =
    ratedOrdersCount > 0
      ? Number(((excellentOrders.length / ratedOrdersCount) * 100).toFixed(1))
      : 0;

  const completedTrips = trips.filter((t) => t.status === "Completed");
  const activeTrips = trips.filter((t) => t.status === "Running" || t.status === "Returning");
  const ridersPerformancePct =
    completedTrips.length > 0
      ? Number(
          (
            (completedTrips.filter((t) => t.performance !== "LATE").length /
              completedTrips.length) *
            100
          ).toFixed(1)
        )
      : 0;

  const activeRiders = riders.filter((r) => !r.is_archived);
  const onDutyRiders = activeRiders.filter((r) => r.status === "On Duty").length;
  const availableRiders = activeRiders.filter(
    (r) => r.status === "On Duty" && toNum(r.active_orders_count, 0) === 0
  ).length;
  const breakRiders = activeRiders.filter((r) => r.status === "Break").length;
  const inZoneRiders = activeRiders.filter((r) => r.status === "On Duty" || r.status === "In Zone").length;
  const noGpsRiders = activeRiders.filter((r) => r.status === "No GPS" || (!r.lat && !r.lng)).length;

  return {
    avgDeliveryMin,
    excellentTasksPct,
    ridersPerformancePct,
    avgWaitingMin: 0,
    avgPendingMin: 0,
    totalOrders,
    abusedOrders: abusedOrders.length,
    abusedPct: totalOrders > 0 ? Number(((abusedOrders.length / totalOrders) * 100).toFixed(1)) : 0,
    automationPct: totalOrders > 0 ? Number(((autoOrders.length / totalOrders) * 100).toFixed(1)) : 100,
    scheduledCount: scheduledOrders.length,
    pendingCount: pendingOrders.length,
    pausedCount: pausedOrders.length,
    onTripsCount: onTripOrders.length,
    deliveredCount: deliveredOrders.length,
    cancelledCount: cancelledOrders.length,
    cancelledPct: totalOrders > 0 ? Number(((cancelledOrders.length / totalOrders) * 100).toFixed(1)) : 0,
    lateCount: lateOrders.length,
    totalTrips: trips.length,
    activeTripsCount: activeTrips.length,
    pickedCount: orders.filter((o) => o.status === "Picked-up").length,
    wayToCustomerCount: orders.filter((o) => o.status === "Way To Customer").length,
    onTripOnlyCount: orders.filter((o) => o.status === "On Trip").length,
    ridersTotal: activeRiders.length,
    ridersOnDuty: onDutyRiders,
    ridersAvailable: availableRiders,
    ridersBreak: breakRiders,
    ridersInZone: inZoneRiders,
    ridersNoGps: noGpsRiders
  };
}

export default function liveDispatchRoutes(wss?: any) {
  const router = express.Router();

  // Require authentication & ensure tables exist on every request
  router.use(authenticate);
  router.use((req, res, next) => {
    if (!(req as AuthRequest).user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  });
  router.use(async (_req, res, next) => {
    try {
      await ensureLiveDispatchTables();
      next();
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to initialize Live Dispatch tables" });
    }
  });

  const broadcastUpdate = () => {
    if (!wss?.clients) return;
    try {
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "live_dispatch" }));
        }
      });
    } catch {
      // ignore ws errors
    }
  };

  // =========================================================================
  // 1. HUB SUMMARY & LIVE DISPATCH BOARD
  // =========================================================================
  router.get("/summary", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const [ordersRes, tripsRes, ridersRes, teamsRes, providersRes, shiftsRes, storesRes, zonesRes, routesRes, walletRes] = await Promise.all([
        pool.query("SELECT * FROM dispatch_orders WHERE company_id = $1 ORDER BY created_at DESC", [companyId]),
        pool.query("SELECT * FROM dispatch_trips WHERE company_id = $1 ORDER BY created_at DESC", [companyId]),
        pool.query("SELECT * FROM dispatch_riders WHERE company_id = $1 ORDER BY id DESC", [companyId]),
        pool.query("SELECT * FROM dispatch_teams WHERE company_id = $1 ORDER BY id ASC", [companyId]),
        pool.query("SELECT * FROM dispatch_providers WHERE company_id = $1 ORDER BY id ASC", [companyId]),
        pool.query("SELECT * FROM dispatch_shifts WHERE company_id = $1 AND status = 'Active'", [companyId]),
        pool.query("SELECT id FROM dispatch_stores WHERE company_id = $1", [companyId]),
        pool.query("SELECT id FROM dispatch_customer_zones WHERE company_id = $1", [companyId]),
        pool.query("SELECT id FROM dispatch_smart_routes WHERE company_id = $1", [companyId]),
        pool.query("SELECT amount FROM dispatch_wallet_transactions WHERE company_id = $1", [companyId])
      ]);

      const walletRows = walletRes.rows || [];
      const walletTotalAmount = Number(
        walletRows.reduce((sum: number, row: any) => sum + toNum(row.amount, 0), 0).toFixed(2)
      );

      const kpis = computeKpis(ordersRes.rows, tripsRes.rows, ridersRes.rows);
      res.json({
        kpis,
        activeShiftsCount: shiftsRes.rows.length,
        storesCount: storesRes.rows.length,
        zonesCount: zonesRes.rows.length,
        routesCount: routesRes.rows.length,
        walletTotalAmount,
        walletTransactionsCount: walletRows.length,
        teams: teamsRes.rows,
        providers: providersRes.rows
      });
    } catch (err: any) {
      console.error("GET /live-dispatch/summary error:", err);
      res.status(500).json({ error: err?.message || "Failed to fetch live dispatch summary" });
    }
  });

  router.get("/board", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const teamName = typeof req.query.team === "string" ? req.query.team.trim() : "";
      const search = typeof req.query.search === "string" ? req.query.search.trim().toLowerCase() : "";

      const [ordersRes, tripsRes, ridersRes, teamsRes, providersRes] = await Promise.all([
        pool.query("SELECT * FROM dispatch_orders WHERE company_id = $1 ORDER BY created_at DESC", [companyId]),
        pool.query("SELECT * FROM dispatch_trips WHERE company_id = $1 ORDER BY created_at DESC", [companyId]),
        pool.query("SELECT * FROM dispatch_riders WHERE company_id = $1 AND is_archived = $2 ORDER BY id DESC", [companyId, false]),
        pool.query("SELECT * FROM dispatch_teams WHERE company_id = $1 ORDER BY id ASC", [companyId]),
        pool.query("SELECT * FROM dispatch_providers WHERE company_id = $1 ORDER BY id ASC", [companyId])
      ]);

      let orders = ordersRes.rows || [];
      let trips = tripsRes.rows || [];
      let riders = ridersRes.rows || [];

      if (teamName && teamName !== "all") {
        orders = orders.filter((o) => (o.team_name || "").trim() === teamName);
        trips = trips.filter((t) => (t.team_name || "").trim() === teamName);
        riders = riders.filter((r) => (r.team_name || "").trim() === teamName);
      }

      if (search) {
        orders = orders.filter(
          (o) =>
            String(o.order_number || "").toLowerCase().includes(search) ||
            String(o.customer_name || "").toLowerCase().includes(search) ||
            String(o.rider_name || "").toLowerCase().includes(search) ||
            String(o.trip_number || "").toLowerCase().includes(search) ||
            String(o.customer_zone || "").toLowerCase().includes(search)
        );
        trips = trips.filter(
          (t) =>
            String(t.trip_number || "").toLowerCase().includes(search) ||
            String(t.rider_name || "").toLowerCase().includes(search) ||
            String(t.team_name || "").toLowerCase().includes(search)
        );
        riders = riders.filter(
          (r) =>
            String(r.name || "").toLowerCase().includes(search) ||
            String(r.mobile_number || "").toLowerCase().includes(search) ||
            String(r.team_name || "").toLowerCase().includes(search)
        );
      }

      const ongoingTrips = trips
        .filter((t) => t.status === "Running" || t.status === "Returning")
        .map((trip) => ({
          ...trip,
          orders: orders.filter(
            (o) => Number(o.trip_id) === Number(trip.id) || (trip.trip_number && o.trip_number === trip.trip_number)
          )
        }));

      const kpis = computeKpis(orders, trips, riders);

      res.json({
        kpis,
        teams: teamsRes.rows || [],
        providers: providersRes.rows || [],
        riders,
        ongoingTrips,
        orders
      });
    } catch (err: any) {
      console.error("GET /live-dispatch/board error:", err);
      res.status(500).json({ error: err?.message || "Failed to load dispatch board" });
    }
  });

  // =========================================================================
  // 2. ORDERS CRUD + ASSIGN + STATUS + EXCEL EXPORT
  // =========================================================================
  router.get("/orders", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const { tab, city, team, store, zone, rider, orderNumber, provider, shiftDate } = req.query;

      const conditions: string[] = ["company_id = $1"];
      const params: any[] = [companyId];
      let pIdx = 2;

      if (tab === "uncompleted") {
        conditions.push("status IN ('Canceled', 'Returned')");
      } else if (tab === "scheduled") {
        conditions.push("status = 'Scheduled'");
      } else if (tab === "transfers") {
        conditions.push(`is_transferred = $${pIdx++}`);
        params.push(true);
      } else if (tab === "abused") {
        conditions.push(`is_abused = $${pIdx++}`);
        params.push(true);
      } else if (tab === "remove_abuse") {
        conditions.push(`remove_abuse_requested = $${pIdx++}`);
        params.push(true);
      }

      if (typeof city === "string" && city.trim() && city !== "all") {
        conditions.push(`city = $${pIdx++}`);
        params.push(city.trim());
      }
      if (typeof team === "string" && team.trim() && team !== "all") {
        conditions.push(`team_name = $${pIdx++}`);
        params.push(team.trim());
      }
      if (typeof store === "string" && store.trim() && store !== "all") {
        conditions.push(`store_name = $${pIdx++}`);
        params.push(store.trim());
      }
      if (typeof zone === "string" && zone.trim() && zone !== "all") {
        conditions.push(`customer_zone = $${pIdx++}`);
        params.push(zone.trim());
      }
      if (typeof rider === "string" && rider.trim() && rider !== "all") {
        conditions.push(`rider_name = $${pIdx++}`);
        params.push(rider.trim());
      }
      if (typeof provider === "string" && provider.trim() && provider !== "all") {
        conditions.push(`provider_name = $${pIdx++}`);
        params.push(provider.trim());
      }
      if (typeof shiftDate === "string" && shiftDate.trim()) {
        conditions.push(`shift_date = $${pIdx++}`);
        params.push(shiftDate.trim());
      }
      if (typeof orderNumber === "string" && orderNumber.trim()) {
        conditions.push(`(LOWER(order_number) LIKE LOWER($${pIdx}) OR LOWER(customer_name) LIKE LOWER($${pIdx}) OR LOWER(customer_mobile) LIKE LOWER($${pIdx}))`);
        params.push(`%${orderNumber.trim()}%`);
        pIdx++;
      }

      const sql = `SELECT * FROM dispatch_orders WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
      const result = await pool.query(sql, params);
      res.json((result.rows || []).map(normalizeOrderRow));
    } catch (err: any) {
      console.error("GET /live-dispatch/orders error:", err);
      res.status(500).json({ error: err?.message || "Failed to load orders" });
    }
  });

  // Lightweight company staff list for Operations Officer selector
  router.get("/staff", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT id, name, email FROM users WHERE company_id = $1 ORDER BY name ASC LIMIT 300",
        [companyId]
      );
      res.json(result.rows || []);
    } catch (err: any) {
      console.error("GET /live-dispatch/staff error:", err);
      res.json([]);
    }
  });

  // Secure attachment upload for Dispatch Order Files & Operational Files
  router.post("/upload", upload.single("file"), async (req, res) => {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded." });
      }
      const origName = path.basename(file.originalname || "document");
      const ext = path.extname(origName).toLowerCase();
      if (!ALLOWED_UPLOAD_EXTS.has(ext)) {
        return res.status(400).json({
          error: `Unsupported file format (${ext || "unknown"}). Allowed: PDF, Images, Office documents, CSV, TXT.`
        });
      }

      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const storedName = `${crypto.randomUUID()}${ext}`;
      const targetPath = path.resolve(UPLOAD_DIR, storedName);
      if (!targetPath.startsWith(UPLOAD_DIR + path.sep)) {
        return res.status(400).json({ error: "Invalid file path." });
      }
      fs.writeFileSync(targetPath, file.buffer);

      const userName = (req as any).user?.name || (req as any).user?.email || "Operations";
      const category = req.body?.category === "operational" ? "operational" : "general";
      res.status(201).json({
        id: crypto.randomUUID(),
        name: origName,
        storedName,
        size: file.size,
        mimeType: file.mimetype || "application/octet-stream",
        category,
        uploadedBy: userName,
        uploadedAt: new Date().toISOString(),
        url: `/api/operations/live-dispatch/files/${storedName}`
      });
    } catch (err: any) {
      console.error("POST /live-dispatch/upload error:", err);
      res.status(500).json({ error: err?.message || "Failed to upload file" });
    }
  });

  // Secure authenticated attachment download
  router.get("/files/:storedName", async (req, res) => {
    try {
      const storedName = String(req.params.storedName || "").trim();
      if (!/^[a-f0-9-]+\.[a-z0-9]{1,8}$/i.test(storedName)) {
        return res.status(400).json({ error: "Invalid file identifier." });
      }
      const targetPath = path.resolve(UPLOAD_DIR, storedName);
      if (!targetPath.startsWith(UPLOAD_DIR + path.sep)) {
        return res.status(403).json({ error: "Access denied." });
      }
      if (!fs.existsSync(targetPath)) {
        return res.status(404).json({ error: "File not found." });
      }
      res.download(targetPath, storedName);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to download file" });
    }
  });

  // Fetch single dispatch order by ID (must be placed after static /orders/* routes or guard numeric id)
  router.get("/orders/:id", async (req, res, next) => {
    if (req.params.id === "export") return next();
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid order ID." });

      const result = await pool.query(
        "SELECT * FROM dispatch_orders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: "Order not found." });
      }
      res.json(normalizeOrderRow(result.rows[0]));
    } catch (err: any) {
      console.error("GET /live-dispatch/orders/:id error:", err);
      res.status(500).json({ error: err?.message || "Failed to load order" });
    }
  });

  router.post("/orders", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const userName = (req as any).user?.name || (req as any).user?.email || "Operations";
      const b = req.body || {};

      const customerName = String(b.customer_name || "").trim();
      if (!customerName) {
        return res.status(400).json({ error: "Customer name is required." });
      }

      const orderNumber = String(b.order_number || "").trim() || generateOrderNumber();
      const serviceNumber = String(b.service_number || "").trim() || generateServiceNumber();
      const amount = toNum(b.amount, 0);
      const paymentStatus = String(b.payment_status || (b.payment_type === "Paid" ? "Paid" : "Unpaid")).trim();
      const paymentType = String(b.payment_type || (paymentStatus === "Paid" ? "Paid" : "Cash")).trim();
      const balanceDue =
        b.balance_due !== undefined && b.balance_due !== ""
          ? toNum(b.balance_due, 0)
          : paymentType === "Paid" || paymentStatus === "Paid"
          ? 0
          : amount;

      const todayStr = new Date().toISOString().slice(0, 10);
      const shiftDate = toNullableDate(b.shift_date || b.order_date) || todayStr;
      const orderDate = toNullableDate(b.order_date || b.shift_date) || todayStr;
      const governorate = String(b.governorate || b.city || "Giza").trim();
      const city = String(b.city || governorate || "Giza").trim();
      const description = String(b.description ?? b.note ?? "").trim();

      const files = safeParseJsonArray(b.files);
      const operationalFiles = safeParseJsonArray(b.operational_files);
      const serviceUnits = safeParseJsonArray(b.service_units);
      const operationsExecutions = safeParseJsonArray(b.operations_executions);
      const representatives = safeParseJsonArray(b.representatives);

      const primaryRep = representatives[0];
      const riderId = b.rider_id ? toNum(b.rider_id, 0) || null : primaryRep?.riderId ? toNum(primaryRep.riderId, 0) || null : null;
      const riderName = String(b.rider_name || primaryRep?.name || "").trim();
      const riderMobile = String(b.rider_mobile || primaryRep?.mobile || "").trim();

      const completedUnits = serviceUnits.filter((u: any) => String(u?.status || "").toLowerCase() === "completed").length;
      const individualsTotal = serviceUnits.length > 0 ? serviceUnits.length : Math.max(1, toNum(b.individuals_total, 1));
      const individualsCompleted = serviceUnits.length > 0 ? completedUnits : toNum(b.individuals_completed, 0);

      const currentQueue = String(b.current_queue || "Government").trim();
      const initialHistory = [
        {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          actor: String(b.operations_officer || userName).trim() || userName,
          queue: currentQueue,
          action: "Created",
          changes: [
            { field: "Order Number", oldValue: "—", newValue: orderNumber },
            { field: "Service Number", oldValue: "—", newValue: serviceNumber },
            { field: "Operations Status", oldValue: "—", newValue: String(b.operations_status || "New") }
          ]
        }
      ];

      const result = await pool.query(
        `INSERT INTO dispatch_orders (
          company_id, order_number, service_number, trip_id, trip_number, team_id, team_name,
          store_name, store_code, brand, city, governorate, customer_name, customer_mobile,
          customer_zone, address, lat, lng, rider_id, rider_name, rider_mobile,
          provider_name, status, performance, amount, balance_due, payment_type,
          is_manual, is_abused, abuse_reason, remove_abuse_requested, is_transferred,
          in_zone, vehicle_type, note, description, created_by, set_as_ready_by, shift_date,
          order_date, order_category, order_type, service_urgency, document_receipt,
          operations_status, hold_reason, operations_officer, current_queue, current_stage,
          case_priority, payment_status, ready_to_close_sale, sales_status,
          individuals_completed, individuals_total,
          files_json, operational_files_json, service_units_json,
          operations_executions_json, representatives_json, change_history_json,
          order_duration_min, distance_km, map_distance_km
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26, $27,
          $28, $29, $30, $31, $32,
          $33, $34, $35, $36, $37, $38, $39,
          $40, $41, $42, $43, $44,
          $45, $46, $47, $48, $49,
          $50, $51, $52, $53,
          $54, $55,
          $56, $57, $58,
          $59, $60, $61,
          $62, $63, $64
        ) RETURNING *`,
        [
          companyId,
          orderNumber,
          serviceNumber,
          b.trip_id ? toNum(b.trip_id, 0) || null : null,
          String(b.trip_number || "").trim(),
          b.team_id ? toNum(b.team_id, 0) || null : null,
          String(b.team_name || b.store_name || "فرع فيصل").trim(),
          String(b.store_name || b.team_name || "فرع فيصل").trim(),
          String(b.store_code || "RBST-002").trim(),
          String(b.brand || "Wesaya").trim(),
          city,
          governorate,
          customerName,
          String(b.customer_mobile || "").trim(),
          String(b.customer_zone || "").trim(),
          String(b.address || "").trim(),
          toNum(b.lat, 30.0085 + (Math.random() - 0.5) * 0.025),
          toNum(b.lng, 31.1895 + (Math.random() - 0.5) * 0.025),
          riderId,
          riderName,
          riderMobile,
          String(b.provider_name || "Wesaya").trim(),
          String(b.status || "Ready").trim(),
          String(b.performance || "NOT_RATED").trim(),
          amount,
          balanceDue,
          paymentType,
          b.is_manual !== undefined ? Boolean(b.is_manual) : true,
          Boolean(b.is_abused),
          String(b.abuse_reason || "").trim(),
          Boolean(b.remove_abuse_requested),
          Boolean(b.is_transferred),
          b.in_zone !== undefined ? Boolean(b.in_zone) : true,
          String(b.vehicle_type || "Motorcycle").trim(),
          description,
          description,
          String(b.created_by || userName).trim(),
          String(b.set_as_ready_by || userName).trim(),
          shiftDate,
          orderDate,
          String(b.order_category || "Government Services").trim(),
          String(b.order_type || "").trim(),
          String(b.service_urgency || "Standard").trim(),
          String(b.document_receipt || "Not Applicable").trim(),
          String(b.operations_status || "New").trim(),
          String(b.hold_reason || "").trim(),
          String(b.operations_officer || "").trim(),
          currentQueue,
          String(b.current_stage || "").trim(),
          String(b.case_priority || "Normal").trim(),
          paymentStatus,
          Boolean(b.ready_to_close_sale),
          String(b.sales_status || "Open").trim(),
          individualsCompleted,
          individualsTotal,
          JSON.stringify(files),
          JSON.stringify(operationalFiles),
          JSON.stringify(serviceUnits),
          JSON.stringify(operationsExecutions),
          JSON.stringify(representatives),
          JSON.stringify(initialHistory),
          toNum(b.order_duration_min, 0),
          toNum(b.distance_km, 0),
          toNum(b.map_distance_km, 0)
        ]
      );

      broadcastUpdate();
      res.status(201).json(normalizeOrderRow(result.rows[0]));
    } catch (err: any) {
      console.error("POST /live-dispatch/orders error:", err);
      res.status(500).json({ error: err?.message || "Failed to create order" });
    }
  });

  router.patch("/orders/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const userName = (req as any).user?.name || (req as any).user?.email || "Operations";
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid order id" });

      const existingRes = await pool.query(
        "SELECT * FROM dispatch_orders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!existingRes.rows.length) {
        return res.status(404).json({ error: "Order not found" });
      }
      const ex = normalizeOrderRow(existingRes.rows[0]);
      const b = req.body || {};

      const nextStatus = b.status !== undefined ? String(b.status) : ex.status;
      const nextPerf = b.performance !== undefined ? String(b.performance) : ex.performance;

      const nextFiles = b.files !== undefined ? safeParseJsonArray(b.files) : ex.files;
      const nextOperationalFiles =
        b.operational_files !== undefined ? safeParseJsonArray(b.operational_files) : ex.operational_files;
      const nextServiceUnits =
        b.service_units !== undefined ? safeParseJsonArray(b.service_units) : ex.service_units;
      const nextExecutions =
        b.operations_executions !== undefined
          ? safeParseJsonArray(b.operations_executions)
          : ex.operations_executions;
      const nextRepresentatives =
        b.representatives !== undefined ? safeParseJsonArray(b.representatives) : ex.representatives;

      const completedUnits = nextServiceUnits.filter(
        (u: any) => String(u?.status || "").toLowerCase() === "completed"
      ).length;
      const nextIndividualsTotal =
        nextServiceUnits.length > 0
          ? nextServiceUnits.length
          : b.individuals_total !== undefined
          ? Math.max(1, toNum(b.individuals_total, 1))
          : ex.individuals_total;
      const nextIndividualsCompleted =
        nextServiceUnits.length > 0
          ? completedUnits
          : b.individuals_completed !== undefined
          ? toNum(b.individuals_completed, 0)
          : ex.individuals_completed;

      const primaryRep = nextRepresentatives[0];
      const nextRiderId =
        b.rider_id !== undefined
          ? b.rider_id
            ? toNum(b.rider_id, 0)
            : null
          : primaryRep?.riderId
          ? toNum(primaryRep.riderId, 0) || null
          : ex.rider_id;
      const nextRiderName =
        b.rider_name !== undefined
          ? String(b.rider_name)
          : primaryRep?.name
          ? String(primaryRep.name)
          : ex.rider_name;
      const nextRiderMobile =
        b.rider_mobile !== undefined
          ? String(b.rider_mobile)
          : primaryRep?.mobile
          ? String(primaryRep.mobile)
          : ex.rider_mobile;

      const nextValues = {
        order_number: b.order_number !== undefined ? String(b.order_number) : ex.order_number,
        service_number: b.service_number !== undefined ? String(b.service_number) : ex.service_number,
        team_name: b.team_name !== undefined ? String(b.team_name) : ex.team_name,
        store_name: b.store_name !== undefined ? String(b.store_name) : ex.store_name,
        store_code: b.store_code !== undefined ? String(b.store_code) : ex.store_code,
        brand: b.brand !== undefined ? String(b.brand) : ex.brand,
        city: b.city !== undefined ? String(b.city) : b.governorate !== undefined ? String(b.governorate) : ex.city,
        governorate:
          b.governorate !== undefined ? String(b.governorate) : b.city !== undefined ? String(b.city) : ex.governorate,
        customer_name: b.customer_name !== undefined ? String(b.customer_name) : ex.customer_name,
        customer_mobile: b.customer_mobile !== undefined ? String(b.customer_mobile) : ex.customer_mobile,
        customer_zone: b.customer_zone !== undefined ? String(b.customer_zone) : ex.customer_zone,
        address: b.address !== undefined ? String(b.address) : ex.address,
        lat: b.lat !== undefined ? toNum(b.lat, ex.lat) : ex.lat,
        lng: b.lng !== undefined ? toNum(b.lng, ex.lng) : ex.lng,
        rider_id: nextRiderId,
        rider_name: nextRiderName,
        rider_mobile: nextRiderMobile,
        provider_name: b.provider_name !== undefined ? String(b.provider_name) : ex.provider_name,
        status: nextStatus,
        performance: nextPerf,
        amount: b.amount !== undefined ? toNum(b.amount, ex.amount) : ex.amount,
        balance_due: b.balance_due !== undefined ? toNum(b.balance_due, ex.balance_due) : ex.balance_due,
        payment_type: b.payment_type !== undefined ? String(b.payment_type) : ex.payment_type,
        is_abused: b.is_abused !== undefined ? Boolean(b.is_abused) : Boolean(ex.is_abused),
        abuse_reason: b.abuse_reason !== undefined ? String(b.abuse_reason) : ex.abuse_reason,
        remove_abuse_requested:
          b.remove_abuse_requested !== undefined
            ? Boolean(b.remove_abuse_requested)
            : Boolean(ex.remove_abuse_requested),
        is_transferred: b.is_transferred !== undefined ? Boolean(b.is_transferred) : Boolean(ex.is_transferred),
        in_zone: b.in_zone !== undefined ? Boolean(b.in_zone) : Boolean(ex.in_zone),
        vehicle_type: b.vehicle_type !== undefined ? String(b.vehicle_type) : ex.vehicle_type,
        note: b.description !== undefined ? String(b.description) : b.note !== undefined ? String(b.note) : ex.note,
        description:
          b.description !== undefined ? String(b.description) : b.note !== undefined ? String(b.note) : ex.description,
        order_date: b.order_date !== undefined ? toNullableDate(b.order_date) : toNullableDate(ex.order_date),
        order_category: b.order_category !== undefined ? String(b.order_category) : ex.order_category,
        order_type: b.order_type !== undefined ? String(b.order_type) : ex.order_type,
        service_urgency: b.service_urgency !== undefined ? String(b.service_urgency) : ex.service_urgency,
        document_receipt: b.document_receipt !== undefined ? String(b.document_receipt) : ex.document_receipt,
        operations_status: b.operations_status !== undefined ? String(b.operations_status) : ex.operations_status,
        hold_reason: b.hold_reason !== undefined ? String(b.hold_reason) : ex.hold_reason,
        operations_officer: b.operations_officer !== undefined ? String(b.operations_officer) : ex.operations_officer,
        current_queue: b.current_queue !== undefined ? String(b.current_queue) : ex.current_queue,
        current_stage: b.current_stage !== undefined ? String(b.current_stage) : ex.current_stage,
        case_priority: b.case_priority !== undefined ? String(b.case_priority) : ex.case_priority,
        payment_status: b.payment_status !== undefined ? String(b.payment_status) : ex.payment_status,
        ready_to_close_sale:
          b.ready_to_close_sale !== undefined ? Boolean(b.ready_to_close_sale) : Boolean(ex.ready_to_close_sale),
        sales_status: b.sales_status !== undefined ? String(b.sales_status) : ex.sales_status,
        individuals_completed: nextIndividualsCompleted,
        individuals_total: nextIndividualsTotal,
        order_duration_min:
          b.order_duration_min !== undefined ? toNum(b.order_duration_min, ex.order_duration_min) : ex.order_duration_min,
        distance_km: b.distance_km !== undefined ? toNum(b.distance_km, ex.distance_km) : ex.distance_km,
        map_distance_km:
          b.map_distance_km !== undefined ? toNum(b.map_distance_km, ex.map_distance_km) : ex.map_distance_km
      };

      const diffs = buildChangeDiffs(ex, nextValues);
      let nextHistory = Array.isArray(ex.change_history) ? [...ex.change_history] : [];
      if (diffs.length > 0) {
        nextHistory.unshift({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          actor: userName,
          queue: nextValues.current_queue || "Government",
          action: "Updated",
          changes: diffs
        });
      }

      await pool.query(
        `UPDATE dispatch_orders SET
          order_number = $1,
          service_number = $2,
          team_name = $3,
          store_name = $4,
          store_code = $5,
          brand = $6,
          city = $7,
          governorate = $8,
          customer_name = $9,
          customer_mobile = $10,
          customer_zone = $11,
          address = $12,
          lat = $13,
          lng = $14,
          rider_id = $15,
          rider_name = $16,
          rider_mobile = $17,
          provider_name = $18,
          status = $19,
          performance = $20,
          amount = $21,
          balance_due = $22,
          payment_type = $23,
          is_abused = $24,
          abuse_reason = $25,
          remove_abuse_requested = $26,
          is_transferred = $27,
          in_zone = $28,
          vehicle_type = $29,
          note = $30,
          description = $31,
          order_date = $32,
          order_category = $33,
          order_type = $34,
          service_urgency = $35,
          document_receipt = $36,
          operations_status = $37,
          hold_reason = $38,
          operations_officer = $39,
          current_queue = $40,
          current_stage = $41,
          case_priority = $42,
          payment_status = $43,
          ready_to_close_sale = $44,
          sales_status = $45,
          individuals_completed = $46,
          individuals_total = $47,
          files_json = $48,
          operational_files_json = $49,
          service_units_json = $50,
          operations_executions_json = $51,
          representatives_json = $52,
          change_history_json = $53,
          order_duration_min = $54,
          distance_km = $55,
          map_distance_km = $56,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $57 AND company_id = $58`,
        [
          nextValues.order_number,
          nextValues.service_number,
          nextValues.team_name,
          nextValues.store_name,
          nextValues.store_code,
          nextValues.brand,
          nextValues.city,
          nextValues.governorate,
          nextValues.customer_name,
          nextValues.customer_mobile,
          nextValues.customer_zone,
          nextValues.address,
          nextValues.lat,
          nextValues.lng,
          nextValues.rider_id,
          nextValues.rider_name,
          nextValues.rider_mobile,
          nextValues.provider_name,
          nextValues.status,
          nextValues.performance,
          nextValues.amount,
          nextValues.balance_due,
          nextValues.payment_type,
          nextValues.is_abused,
          nextValues.abuse_reason,
          nextValues.remove_abuse_requested,
          nextValues.is_transferred,
          nextValues.in_zone,
          nextValues.vehicle_type,
          nextValues.note,
          nextValues.description,
          nextValues.order_date,
          nextValues.order_category,
          nextValues.order_type,
          nextValues.service_urgency,
          nextValues.document_receipt,
          nextValues.operations_status,
          nextValues.hold_reason,
          nextValues.operations_officer,
          nextValues.current_queue,
          nextValues.current_stage,
          nextValues.case_priority,
          nextValues.payment_status,
          nextValues.ready_to_close_sale,
          nextValues.sales_status,
          nextValues.individuals_completed,
          nextValues.individuals_total,
          JSON.stringify(nextFiles),
          JSON.stringify(nextOperationalFiles),
          JSON.stringify(nextServiceUnits),
          JSON.stringify(nextExecutions),
          JSON.stringify(nextRepresentatives),
          JSON.stringify(nextHistory),
          nextValues.order_duration_min,
          nextValues.distance_km,
          nextValues.map_distance_km,
          id,
          companyId
        ]
      );

      // Sync trip & rider active counts if order belongs to a trip
      if (ex.trip_id) {
        const tripOrdersRes = await pool.query(
          "SELECT status FROM dispatch_orders WHERE trip_id = $1 AND company_id = $2",
          [ex.trip_id, companyId]
        );
        const statuses = tripOrdersRes.rows.map((r) => r.status);
        const allFinished =
          statuses.length > 0 &&
          statuses.every((s) => s === "Delivered" || s === "Canceled" || s === "Returned");

        if (allFinished) {
          await pool.query(
            "UPDATE dispatch_trips SET status = 'Returning', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'Running'",
            [ex.trip_id]
          );
        }
      }

      if (ex.rider_id) {
        const activeCountRes = await pool.query(
          "SELECT COUNT(*) as cnt FROM dispatch_orders WHERE rider_id = $1 AND company_id = $2 AND status IN ('On Trip', 'Picked-up', 'Way To Customer', 'In Progress')",
          [ex.rider_id, companyId]
        );
        const cnt = toNum(activeCountRes.rows[0]?.cnt, 0);
        await pool.query(
          "UPDATE dispatch_riders SET active_orders_count = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [cnt, ex.rider_id]
        );
      }

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_orders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(normalizeOrderRow(refreshed.rows[0]) || { id });
    } catch (err: any) {
      console.error("PATCH /live-dispatch/orders/:id error:", err);
      res.status(500).json({ error: err?.message || "Failed to update order" });
    }
  });

  router.delete("/orders/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_orders WHERE id = $1 AND company_id = $2", [id, companyId]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete order" });
    }
  });

  // Assign selected orders to a rider (creates or appends to an active Running Trip)
  router.post("/orders/assign", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const orderIds: number[] = Array.isArray(req.body?.order_ids)
        ? req.body.order_ids.map((x: any) => toNum(x, 0)).filter((n: number) => n > 0)
        : [];
      const riderId = toNum(req.body?.rider_id, 0);

      if (!orderIds.length || !riderId) {
        return res.status(400).json({ error: "Select at least one order and a rider." });
      }

      const riderRes = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [riderId, companyId]
      );
      if (!riderRes.rows.length) {
        return res.status(404).json({ error: "Rider not found." });
      }
      const rider = riderRes.rows[0];

      // Check if rider already has a Running trip; if not, create one
      let tripRes = await pool.query(
        "SELECT * FROM dispatch_trips WHERE rider_id = $1 AND company_id = $2 AND status = 'Running' ORDER BY id DESC LIMIT 1",
        [riderId, companyId]
      );

      let trip = tripRes.rows[0];
      if (!trip) {
        const newTripNum = generateTripCode();
        const insTrip = await pool.query(
          `INSERT INTO dispatch_trips (
            company_id, trip_number, team_id, team_name, rider_id, rider_name,
            status, performance, is_manual, orders_count, expecting_duration_min,
            trip_duration_min, total_amount, live_location_percentage
          ) VALUES ($1, $2, $3, $4, $5, $6, 'Running', 'NOT_RATED', $7, 0, 30, 0, 0, 100)
          RETURNING *`,
          [companyId, newTripNum, rider.team_id || null, rider.team_name || "فرع فيصل", rider.id, rider.name, Boolean(req.body?.is_manual)]
        );
        trip = insTrip.rows[0];
      }

      // Assign each order to this trip & rider
      for (const oid of orderIds) {
        await pool.query(
          `UPDATE dispatch_orders
           SET trip_id = $1, trip_number = $2, rider_id = $3, rider_name = $4,
               rider_mobile = $5, status = 'On Trip', updated_at = CURRENT_TIMESTAMP
           WHERE id = $6 AND company_id = $7`,
          [trip.id, trip.trip_number, rider.id, rider.name, rider.mobile_number || "", oid, companyId]
        );
      }

      // Recalculate trip totals and rider active orders count
      const tripOrders = await pool.query(
        "SELECT amount FROM dispatch_orders WHERE trip_id = $1 AND company_id = $2",
        [trip.id, companyId]
      );
      const count = tripOrders.rows.length;
      const totalAmount = tripOrders.rows.reduce((s, r) => s + toNum(r.amount, 0), 0);

      await pool.query(
        `UPDATE dispatch_trips
         SET orders_count = $1, total_amount = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [count, totalAmount, trip.id]
      );

      const riderActiveRes = await pool.query(
        "SELECT COUNT(*) as cnt FROM dispatch_orders WHERE rider_id = $1 AND company_id = $2 AND status IN ('On Trip', 'Picked-up', 'Way To Customer', 'In Progress')",
        [rider.id, companyId]
      );
      await pool.query(
        `UPDATE dispatch_riders
         SET status = 'On Duty', active_orders_count = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [toNum(riderActiveRes.rows[0]?.cnt, count), rider.id]
      );

      const updatedTrip = await pool.query(
        "SELECT * FROM dispatch_trips WHERE id = $1 AND company_id = $2",
        [trip.id, companyId]
      );

      broadcastUpdate();
      res.json({ success: true, trip: updatedTrip.rows[0] || trip, assignedCount: orderIds.length });
    } catch (err: any) {
      console.error("POST /live-dispatch/orders/assign error:", err);
      res.status(500).json({ error: err?.message || "Failed to assign orders" });
    }
  });

  router.get("/orders/export", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_orders WHERE company_id = $1 ORDER BY created_at DESC",
        [companyId]
      );

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Orders");
      ws.columns = [
        { header: "Order Number", key: "order_number", width: 16 },
        { header: "Created Date", key: "created_at", width: 20 },
        { header: "Shift Date", key: "shift_date", width: 14 },
        { header: "Trip Number", key: "trip_number", width: 16 },
        { header: "Performance", key: "performance", width: 14 },
        { header: "Balance Due", key: "balance_due", width: 14 },
        { header: "Amount", key: "amount", width: 14 },
        { header: "Payment Type", key: "payment_type", width: 14 },
        { header: "Customer Name", key: "customer_name", width: 22 },
        { header: "Customer Mobile", key: "customer_mobile", width: 16 },
        { header: "Customer Zone", key: "customer_zone", width: 20 },
        { header: "Address", key: "address", width: 32 },
        { header: "Rider Name", key: "rider_name", width: 20 },
        { header: "Rider Mobile", key: "rider_mobile", width: 16 },
        { header: "Status", key: "status", width: 16 },
        { header: "Store", key: "store_name", width: 18 },
        { header: "Store Code", key: "store_code", width: 14 },
        { header: "Brand", key: "brand", width: 14 },
        { header: "Team", key: "team_name", width: 18 },
        { header: "Duration (min)", key: "order_duration_min", width: 14 },
        { header: "Distance (km)", key: "distance_km", width: 14 }
      ];
      ws.getRow(1).font = { bold: true };
      (result.rows || []).forEach((row) => ws.addRow(row));

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="dispatch-orders-${Date.now()}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to export orders" });
    }
  });

  // =========================================================================
  // 3. TRIPS CRUD + EXCEL EXPORT
  // =========================================================================
  router.get("/trips", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const { tab, team, tripNumber, rider, status, manual } = req.query;

      const conditions: string[] = ["company_id = $1"];
      const params: any[] = [companyId];
      let pIdx = 2;

      if (tab === "uncompleted") {
        conditions.push("status IN ('Canceled', 'Running', 'Returning')");
      }
      if (typeof team === "string" && team.trim() && team !== "all") {
        conditions.push(`team_name = $${pIdx++}`);
        params.push(team.trim());
      }
      if (typeof rider === "string" && rider.trim() && rider !== "all") {
        conditions.push(`rider_name = $${pIdx++}`);
        params.push(rider.trim());
      }
      if (typeof status === "string" && status.trim() && status !== "all") {
        conditions.push(`status = $${pIdx++}`);
        params.push(status.trim());
      }
      if (manual === "yes" || manual === "true") {
        conditions.push(`is_manual = $${pIdx++}`);
        params.push(true);
      } else if (manual === "no" || manual === "false") {
        conditions.push(`is_manual = $${pIdx++}`);
        params.push(false);
      }
      if (typeof tripNumber === "string" && tripNumber.trim()) {
        conditions.push(`LOWER(trip_number) LIKE LOWER($${pIdx++})`);
        params.push(`%${tripNumber.trim()}%`);
      }
      const tripTypeQuery = req.query.tripType;
      if (typeof tripTypeQuery === "string" && tripTypeQuery.trim() && tripTypeQuery !== "all") {
        conditions.push(`trip_type = $${pIdx++}`);
        params.push(tripTypeQuery.trim());
      }

      const result = await pool.query(
        `SELECT * FROM dispatch_trips WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`,
        params
      );
      res.json(result.rows || []);
    } catch (err: any) {
      console.error("GET /live-dispatch/trips error:", err);
      res.status(500).json({ error: err?.message || "Failed to fetch trips" });
    }
  });

  router.post("/trips", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const tripNumber = String(b.trip_number || "").trim() || generateTripCode();
      const tripType = String(b.trip_type || "").trim().slice(0, 120);

      const result = await pool.query(
        `INSERT INTO dispatch_trips (
          company_id, trip_number, trip_type, team_id, team_name, rider_id, rider_name,
          status, performance, is_manual, orders_count, expecting_duration_min,
          trip_duration_min, trip_distance_km, returning_duration_min,
          estimate_returning_min, planned_return_distance_km, total_amount,
          delivery_zone_extra_fees, live_location_percentage
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15,
          $16, $17, $18,
          $19, $20
        ) RETURNING *`,
        [
          companyId,
          tripNumber,
          tripType,
          b.team_id ? toNum(b.team_id, 0) || null : null,
          String(b.team_name || "فرع فيصل").trim(),
          b.rider_id ? toNum(b.rider_id, 0) || null : null,
          String(b.rider_name || "").trim(),
          String(b.status || "Running").trim(),
          String(b.performance || "NOT_RATED").trim(),
          b.is_manual !== undefined ? Boolean(b.is_manual) : true,
          toNum(b.orders_count, 0),
          toNum(b.expecting_duration_min, 25),
          toNum(b.trip_duration_min, 0),
          toNum(b.trip_distance_km, 0),
          toNum(b.returning_duration_min, 0),
          toNum(b.estimate_returning_min, 5),
          toNum(b.planned_return_distance_km, 0),
          toNum(b.total_amount, 0),
          toNum(b.delivery_zone_extra_fees, 0),
          toNum(b.live_location_percentage, 100)
        ]
      );

      broadcastUpdate();
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create trip" });
    }
  });

  router.patch("/trips/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const exRes = await pool.query(
        "SELECT * FROM dispatch_trips WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Trip not found" });
      const ex = exRes.rows[0];
      const b = req.body || {};

      const nextStatus = b.status !== undefined ? String(b.status) : ex.status;
      const shouldSetCompleted = nextStatus === "Completed" && !ex.completed_at;
      const nextTripType =
        b.trip_type !== undefined ? String(b.trip_type).trim().slice(0, 120) : String(ex.trip_type || "");

      const updated = await pool.query(
        `UPDATE dispatch_trips SET
          team_name = $1,
          trip_type = $2,
          rider_id = $3,
          rider_name = $4,
          status = $5,
          performance = $6,
          is_manual = $7,
          orders_count = $8,
          expecting_duration_min = $9,
          trip_duration_min = $10,
          trip_distance_km = $11,
          returning_duration_min = $12,
          estimate_returning_min = $13,
          planned_return_distance_km = $14,
          total_amount = $15,
          delivery_zone_extra_fees = $16,
          live_location_percentage = $17,
          completed_at = COALESCE(completed_at, ${shouldSetCompleted ? "CURRENT_TIMESTAMP" : "NULL"}),
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $18 AND company_id = $19`,
        [
          b.team_name !== undefined ? String(b.team_name) : ex.team_name,
          nextTripType,
          b.rider_id !== undefined ? (b.rider_id ? toNum(b.rider_id, 0) : null) : ex.rider_id,
          b.rider_name !== undefined ? String(b.rider_name) : ex.rider_name,
          nextStatus,
          b.performance !== undefined ? String(b.performance) : ex.performance,
          b.is_manual !== undefined ? Boolean(b.is_manual) : Boolean(ex.is_manual),
          b.orders_count !== undefined ? toNum(b.orders_count, ex.orders_count) : ex.orders_count,
          b.expecting_duration_min !== undefined ? toNum(b.expecting_duration_min, ex.expecting_duration_min) : ex.expecting_duration_min,
          b.trip_duration_min !== undefined ? toNum(b.trip_duration_min, ex.trip_duration_min) : ex.trip_duration_min,
          b.trip_distance_km !== undefined ? toNum(b.trip_distance_km, ex.trip_distance_km) : ex.trip_distance_km,
          b.returning_duration_min !== undefined ? toNum(b.returning_duration_min, ex.returning_duration_min) : ex.returning_duration_min,
          b.estimate_returning_min !== undefined ? toNum(b.estimate_returning_min, ex.estimate_returning_min) : ex.estimate_returning_min,
          b.planned_return_distance_km !== undefined ? toNum(b.planned_return_distance_km, ex.planned_return_distance_km) : ex.planned_return_distance_km,
          b.total_amount !== undefined ? toNum(b.total_amount, ex.total_amount) : ex.total_amount,
          b.delivery_zone_extra_fees !== undefined ? toNum(b.delivery_zone_extra_fees, ex.delivery_zone_extra_fees) : ex.delivery_zone_extra_fees,
          b.live_location_percentage !== undefined ? toNum(b.live_location_percentage, ex.live_location_percentage) : ex.live_location_percentage,
          id,
          companyId
        ]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_trips WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(refreshed.rows[0] || updated.rows[0] || { id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update trip" });
    }
  });

  router.delete("/trips/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_trips WHERE id = $1 AND company_id = $2", [id, companyId]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete trip" });
    }
  });

  router.get("/trips/export", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_trips WHERE company_id = $1 ORDER BY created_at DESC",
        [companyId]
      );
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Trips");
      ws.columns = [
        { header: "Trip Number", key: "trip_number", width: 16 },
        { header: "Trip Type", key: "trip_type", width: 18 },
        { header: "Team Name", key: "team_name", width: 18 },
        { header: "Rider Name", key: "rider_name", width: 20 },
        { header: "Orders Count", key: "orders_count", width: 14 },
        { header: "Status", key: "status", width: 14 },
        { header: "Trip Performance", key: "performance", width: 16 },
        { header: "Manual Trip", key: "is_manual", width: 12 },
        { header: "Expecting Duration (min)", key: "expecting_duration_min", width: 20 },
        { header: "Trip Duration (min)", key: "trip_duration_min", width: 18 },
        { header: "Trip Distance (km)", key: "trip_distance_km", width: 16 },
        { header: "Returning Duration (min)", key: "returning_duration_min", width: 20 },
        { header: "Planned Return Distance", key: "planned_return_distance_km", width: 20 },
        { header: "Trip Total Amount", key: "total_amount", width: 18 },
        { header: "Delivery Zone Extra Fees", key: "delivery_zone_extra_fees", width: 20 },
        { header: "Live Location %", key: "live_location_percentage", width: 16 },
        { header: "Create Date", key: "created_at", width: 22 },
        { header: "Complete Date", key: "completed_at", width: 22 }
      ];
      ws.getRow(1).font = { bold: true };
      (result.rows || []).forEach((r) => ws.addRow(r));
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="dispatch-trips-${Date.now()}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to export trips" });
    }
  });

  // =========================================================================
  // 4. RIDERS CRUD + ARCHIVE + LOCATION + EXCEL IMPORT/EXPORT
  // =========================================================================
  router.get("/riders", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const { archived, team, zone, rider, accNumber } = req.query;

      const conditions: string[] = ["company_id = $1"];
      const params: any[] = [companyId];
      let pIdx = 2;

      if (archived === "true") {
        conditions.push(`is_archived = $${pIdx++}`);
        params.push(true);
      } else if (archived !== "all") {
        conditions.push(`is_archived = $${pIdx++}`);
        params.push(false);
      }

      if (typeof team === "string" && team.trim() && team !== "all") {
        conditions.push(`team_name = $${pIdx++}`);
        params.push(team.trim());
      }
      if (typeof zone === "string" && zone.trim() && zone !== "all") {
        conditions.push(`LOWER(zone_coverage) LIKE LOWER($${pIdx++})`);
        params.push(`%${zone.trim()}%`);
      }
      if (typeof rider === "string" && rider.trim() && rider !== "all") {
        conditions.push(`LOWER(name) LIKE LOWER($${pIdx++})`);
        params.push(`%${rider.trim()}%`);
      }
      if (typeof accNumber === "string" && accNumber.trim()) {
        conditions.push(`(LOWER(acc_number) LIKE LOWER($${pIdx}) OR LOWER(enroll_id) LIKE LOWER($${pIdx}) OR LOWER(mobile_number) LIKE LOWER($${pIdx}))`);
        params.push(`%${accNumber.trim()}%`);
        pIdx++;
      }

      const result = await pool.query(
        `SELECT * FROM dispatch_riders WHERE ${conditions.join(" AND ")} ORDER BY id DESC`,
        params
      );
      res.json(result.rows || []);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch riders" });
    }
  });

  router.post("/riders", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const name = String(b.name || "").trim();
      if (!name) return res.status(400).json({ error: "Rider name is required." });

      const result = await pool.query(
        `INSERT INTO dispatch_riders (
          company_id, enroll_id, name, team_id, team_name, provider_name,
          mobile_number, acc_number, status, logged_in, on_demand, rating,
          app_version, device_type, bundle_name, national_id, vehicle_type,
          zone_coverage, hiring_date, expiration_iqama_date, lat, lng
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22
        ) RETURNING *`,
        [
          companyId,
          String(b.enroll_id || Math.floor(100 + Math.random() * 899)).trim(),
          name,
          b.team_id ? toNum(b.team_id, 0) || null : null,
          String(b.team_name || "فرع فيصل").trim(),
          String(b.provider_name || "Wesaya").trim(),
          String(b.mobile_number || "").trim(),
          String(b.acc_number || Math.floor(10000 + Math.random() * 89999)).trim(),
          String(b.status || "Off Duty").trim(),
          b.logged_in !== undefined ? Boolean(b.logged_in) : true,
          Boolean(b.on_demand),
          toNum(b.rating, 0),
          String(b.app_version || "2026.10.03").trim(),
          String(b.device_type || "android").trim(),
          String(b.bundle_name || "").trim(),
          String(b.national_id || "").trim(),
          String(b.vehicle_type || "Motorcycle").trim(),
          String(b.zone_coverage || "فيصل - الهرم").trim(),
          toNullableDate(b.hiring_date),
          toNullableDate(b.expiration_iqama_date),
          toNum(b.lat, 30.0085 + (Math.random() - 0.5) * 0.018),
          toNum(b.lng, 31.1895 + (Math.random() - 0.5) * 0.018)
        ]
      );

      broadcastUpdate();
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create rider" });
    }
  });

  router.patch("/riders/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const exRes = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Rider not found" });
      const ex = exRes.rows[0];
      const b = req.body || {};

      const updated = await pool.query(
        `UPDATE dispatch_riders SET
          enroll_id = $1,
          name = $2,
          team_name = $3,
          provider_name = $4,
          mobile_number = $5,
          acc_number = $6,
          status = $7,
          logged_in = $8,
          on_demand = $9,
          rating = $10,
          app_version = $11,
          device_type = $12,
          bundle_name = $13,
          national_id = $14,
          vehicle_type = $15,
          zone_coverage = $16,
          hiring_date = $17,
          expiration_iqama_date = $18,
          lat = $19,
          lng = $20,
          is_archived = $21,
          archive_reason = $22,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = $23 AND company_id = $24`,
        [
          b.enroll_id !== undefined ? String(b.enroll_id) : ex.enroll_id,
          b.name !== undefined ? String(b.name).trim() : ex.name,
          b.team_name !== undefined ? String(b.team_name) : ex.team_name,
          b.provider_name !== undefined ? String(b.provider_name) : ex.provider_name,
          b.mobile_number !== undefined ? String(b.mobile_number) : ex.mobile_number,
          b.acc_number !== undefined ? String(b.acc_number) : ex.acc_number,
          b.status !== undefined ? String(b.status) : ex.status,
          b.logged_in !== undefined ? Boolean(b.logged_in) : Boolean(ex.logged_in),
          b.on_demand !== undefined ? Boolean(b.on_demand) : Boolean(ex.on_demand),
          b.rating !== undefined ? toNum(b.rating, ex.rating) : ex.rating,
          b.app_version !== undefined ? String(b.app_version) : ex.app_version,
          b.device_type !== undefined ? String(b.device_type) : ex.device_type,
          b.bundle_name !== undefined ? String(b.bundle_name) : ex.bundle_name,
          b.national_id !== undefined ? String(b.national_id) : ex.national_id,
          b.vehicle_type !== undefined ? String(b.vehicle_type) : ex.vehicle_type,
          b.zone_coverage !== undefined ? String(b.zone_coverage) : ex.zone_coverage,
          b.hiring_date !== undefined ? toNullableDate(b.hiring_date) : toNullableDate(ex.hiring_date),
          b.expiration_iqama_date !== undefined ? toNullableDate(b.expiration_iqama_date) : toNullableDate(ex.expiration_iqama_date),
          b.lat !== undefined ? toNum(b.lat, ex.lat) : ex.lat,
          b.lng !== undefined ? toNum(b.lng, ex.lng) : ex.lng,
          b.is_archived !== undefined ? Boolean(b.is_archived) : Boolean(ex.is_archived),
          b.archive_reason !== undefined ? String(b.archive_reason) : ex.archive_reason,
          id,
          companyId
        ]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(refreshed.rows[0] || updated.rows[0] || { id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update rider" });
    }
  });

  router.patch("/riders/:id/location", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const lat = toNum(req.body?.lat, NaN);
      const lng = toNum(req.body?.lng, NaN);
      if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Valid lat and lng are required." });
      }
      const exRes = await pool.query(
        "SELECT id FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Rider not found" });

      await pool.query(
        `UPDATE dispatch_riders
         SET lat = $1, lng = $2, last_location_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND company_id = $4`,
        [lat, lng, id, companyId]
      );
      const refreshed = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(refreshed.rows[0] || { id, lat, lng });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update rider GPS location" });
    }
  });

  router.post("/riders/:id/archive", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const reason = String(req.body?.archive_reason || "Archived by operations").trim();
      await pool.query(
        `UPDATE dispatch_riders
         SET is_archived = $1, archive_reason = $2, status = 'Off Duty', archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND company_id = $4`,
        [true, reason, id, companyId]
      );
      const refreshed = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(refreshed.rows[0] || { success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to archive rider" });
    }
  });

  router.post("/riders/:id/restore", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query(
        `UPDATE dispatch_riders
         SET is_archived = $1, archive_reason = '', archived_at = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND company_id = $3`,
        [false, id, companyId]
      );
      const refreshed = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(refreshed.rows[0] || { success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to restore rider" });
    }
  });

  router.delete("/riders/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_riders WHERE id = $1 AND company_id = $2", [id, companyId]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete rider" });
    }
  });

  router.get("/riders/export", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_riders WHERE company_id = $1 ORDER BY id DESC",
        [companyId]
      );
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Riders");
      ws.columns = [
        { header: "Enroll ID", key: "enroll_id", width: 12 },
        { header: "Name", key: "name", width: 22 },
        { header: "Team", key: "team_name", width: 18 },
        { header: "Status", key: "status", width: 14 },
        { header: "Mobile Number", key: "mobile_number", width: 18 },
        { header: "Acc Number", key: "acc_number", width: 14 },
        { header: "Provider", key: "provider_name", width: 16 },
        { header: "Device Type", key: "device_type", width: 14 },
        { header: "App Version", key: "app_version", width: 14 },
        { header: "National ID / SSN", key: "national_id", width: 22 },
        { header: "Vehicle Type", key: "vehicle_type", width: 16 },
        { header: "Zone Coverage", key: "zone_coverage", width: 22 },
        { header: "Hiring Date", key: "hiring_date", width: 14 },
        { header: "Expiration Iqama Date", key: "expiration_iqama_date", width: 20 }
      ];
      ws.getRow(1).font = { bold: true };
      (result.rows || []).forEach((r) => ws.addRow(r));
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="dispatch-riders-${Date.now()}.xlsx"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to export riders" });
    }
  });

  router.post("/riders/import", upload.single("file"), async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      if (!req.file) return res.status(400).json({ error: "Excel file is required." });

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(req.file.buffer as any);
      const ws = wb.worksheets[0];
      if (!ws) return res.status(400).json({ error: "No worksheet found in uploaded file." });

      const headers: string[] = [];
      ws.getRow(1).eachCell((cell, col) => {
        headers[col] = String(cell.value || "").trim().toLowerCase();
      });

      let inserted = 0;
      for (let r = 2; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const obj: Record<string, any> = {};
        row.eachCell((cell, col) => {
          const h = headers[col];
          if (h) obj[h] = cell.value;
        });

        const name = String(obj["name"] || obj["rider name"] || obj["الاسم"] || "").trim();
        if (!name) continue;

        await pool.query(
          `INSERT INTO dispatch_riders (
            company_id, enroll_id, name, team_name, provider_name, mobile_number,
            acc_number, status, device_type, app_version, national_id, vehicle_type,
            zone_coverage, hiring_date, expiration_iqama_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [
            companyId,
            String(obj["enroll id"] || obj["enroll_id"] || "").trim(),
            name,
            String(obj["team"] || obj["team_name"] || "فرع فيصل").trim(),
            String(obj["provider"] || obj["provider_name"] || "Wesaya").trim(),
            String(obj["mobile number"] || obj["mobile_number"] || obj["mobile"] || "").trim(),
            String(obj["acc number"] || obj["acc_number"] || "").trim(),
            String(obj["status"] || "Off Duty").trim(),
            String(obj["device type"] || obj["device_type"] || "android").trim(),
            String(obj["app version"] || obj["app_version"] || "2026.10.03").trim(),
            String(obj["national id / ssn"] || obj["national_id"] || "").trim(),
            String(obj["vehicle type"] || obj["vehicle_type"] || "Motorcycle").trim(),
            String(obj["zone coverage"] || obj["zone_coverage"] || "").trim(),
            toNullableDate(obj["hiring date"] || obj["hiring_date"]),
            toNullableDate(obj["expiration iqama date"] || obj["expiration_iqama_date"])
          ]
        );
        inserted++;
      }

      broadcastUpdate();
      res.json({ success: true, inserted });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to import riders Excel file" });
    }
  });

  // =========================================================================
  // 5. LIVE TRACKING ENDPOINT
  // =========================================================================
  router.get("/tracking", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const teamName = typeof req.query.team === "string" ? req.query.team.trim() : "";

      const [ridersRes, ordersRes, teamsRes] = await Promise.all([
        pool.query(
          "SELECT * FROM dispatch_riders WHERE company_id = $1 AND is_archived = $2 ORDER BY id DESC",
          [companyId, false]
        ),
        pool.query(
          "SELECT * FROM dispatch_orders WHERE company_id = $1 ORDER BY created_at DESC LIMIT 200",
          [companyId]
        ),
        pool.query(
          "SELECT * FROM dispatch_teams WHERE company_id = $1 ORDER BY id ASC",
          [companyId]
        )
      ]);

      let riders = ridersRes.rows || [];
      let orders = ordersRes.rows || [];
      if (teamName && teamName !== "all") {
        riders = riders.filter((r) => (r.team_name || "").trim() === teamName);
        orders = orders.filter((o) => (o.team_name || "").trim() === teamName);
      }

      res.json({
        riders,
        orders,
        teams: teamsRes.rows || []
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch live tracking data" });
    }
  });

  // =========================================================================
  // 6. TEAMS, PROVIDERS & SHIFTS
  // =========================================================================
  router.get("/teams", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_teams WHERE company_id = $1 ORDER BY id ASC",
        [companyId]
      );
      res.json(result.rows || []);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch teams" });
    }
  });

  router.post("/teams", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const name = String(b.name || "").trim();
      if (!name) return res.status(400).json({ error: "Team name is required." });

      const result = await pool.query(
        `INSERT INTO dispatch_teams (company_id, name, city, zone_coverage, store_code, max_trip_capacity, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          companyId,
          name,
          String(b.city || "الجيزة").trim(),
          String(b.zone_coverage || "").trim(),
          String(b.store_code || "").trim(),
          toNum(b.max_trip_capacity, 4),
          b.is_active !== undefined ? Boolean(b.is_active) : true
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create team" });
    }
  });

  router.patch("/teams/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const exRes = await pool.query(
        "SELECT * FROM dispatch_teams WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Team not found" });
      const ex = exRes.rows[0];
      const b = req.body || {};

      await pool.query(
        `UPDATE dispatch_teams
         SET name = $1, city = $2, zone_coverage = $3, store_code = $4, max_trip_capacity = $5, is_active = $6
         WHERE id = $7 AND company_id = $8`,
        [
          b.name !== undefined ? String(b.name).trim() : ex.name,
          b.city !== undefined ? String(b.city).trim() : ex.city,
          b.zone_coverage !== undefined ? String(b.zone_coverage).trim() : ex.zone_coverage,
          b.store_code !== undefined ? String(b.store_code).trim() : ex.store_code,
          b.max_trip_capacity !== undefined ? toNum(b.max_trip_capacity, ex.max_trip_capacity) : ex.max_trip_capacity,
          b.is_active !== undefined ? Boolean(b.is_active) : Boolean(ex.is_active),
          id,
          companyId
        ]
      );
      const refreshed = await pool.query(
        "SELECT * FROM dispatch_teams WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      res.json(refreshed.rows[0] || { id });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update team" });
    }
  });

  router.delete("/teams/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_teams WHERE id = $1 AND company_id = $2", [id, companyId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete team" });
    }
  });

  router.get("/providers", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_providers WHERE company_id = $1 ORDER BY id ASC",
        [companyId]
      );
      res.json(result.rows || []);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch providers" });
    }
  });

  router.post("/providers", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const name = String(b.name || "").trim();
      if (!name) return res.status(400).json({ error: "Provider name is required." });

      const result = await pool.query(
        `INSERT INTO dispatch_providers (company_id, name, contact_phone, commission_rate, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [companyId, name, String(b.contact_phone || "").trim(), toNum(b.commission_rate, 0), true]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create provider" });
    }
  });

  router.delete("/providers/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_providers WHERE id = $1 AND company_id = $2", [id, companyId]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete provider" });
    }
  });

  router.get("/shifts", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_shifts WHERE company_id = $1 ORDER BY started_at DESC LIMIT 200",
        [companyId]
      );
      res.json(result.rows || []);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to fetch shifts" });
    }
  });

  router.post("/shifts/start", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const riderId = toNum(req.body?.rider_id, 0);
      if (!riderId) return res.status(400).json({ error: "Rider is required to start shift." });

      const riderRes = await pool.query(
        "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [riderId, companyId]
      );
      if (!riderRes.rows.length) return res.status(404).json({ error: "Rider not found." });
      const rider = riderRes.rows[0];

      const todayStr = new Date().toISOString().slice(0, 10);
      const shiftRes = await pool.query(
        `INSERT INTO dispatch_shifts (company_id, rider_id, rider_name, team_name, shift_date, status, notes)
         VALUES ($1, $2, $3, $4, $5, 'Active', $6) RETURNING *`,
        [companyId, rider.id, rider.name, rider.team_name || "فرع فيصل", todayStr, String(req.body?.notes || "").trim()]
      );

      await pool.query(
        "UPDATE dispatch_riders SET status = 'On Duty', logged_in = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [true, rider.id]
      );

      broadcastUpdate();
      res.status(201).json(shiftRes.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to start shift" });
    }
  });

  router.patch("/shifts/:id/end", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const exRes = await pool.query(
        "SELECT * FROM dispatch_shifts WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Shift not found" });
      const shift = exRes.rows[0];

      await pool.query(
        `UPDATE dispatch_shifts
         SET status = 'Completed', ended_at = CURRENT_TIMESTAMP,
             orders_completed = $1, cash_collected = $2, revenue_total = $3
         WHERE id = $4 AND company_id = $5`,
        [
          toNum(req.body?.orders_completed, shift.orders_completed),
          toNum(req.body?.cash_collected, shift.cash_collected),
          toNum(req.body?.revenue_total, shift.revenue_total),
          id,
          companyId
        ]
      );

      if (shift.rider_id) {
        await pool.query(
          "UPDATE dispatch_riders SET status = 'Off Duty', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [shift.rider_id]
        );
      }

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_shifts WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(refreshed.rows[0] || { id, status: "Completed" });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to end shift" });
    }
  });

  // =========================================================================
  // 7. STORES, CUSTOMER ZONES, SMART ROUTES & STORE CONFIGURATION
  // =========================================================================
  router.get("/stores", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const result = await pool.query(
        "SELECT * FROM dispatch_stores WHERE company_id = $1 ORDER BY id ASC",
        [companyId]
      );
      res.json((result.rows || []).map(normalizeStoreRow));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load stores" });
    }
  });

  router.post("/stores", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const name = String(b.name || "").trim();
      if (!name) return res.status(400).json({ error: "Store name is required." });

      const config = b.config ? { ...DEFAULT_STORE_CONFIG, ...b.config } : DEFAULT_STORE_CONFIG;
      const result = await pool.query(
        `INSERT INTO dispatch_stores (company_id, name, brand, code, city, address, lat, lng, is_active, config_json)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
          companyId,
          name,
          String(b.brand || "Wesaya").trim(),
          String(b.code || `STR-${Math.floor(100 + Math.random() * 899)}`).trim(),
          String(b.city || "Cairo").trim(),
          String(b.address || "Cairo").trim(),
          toNum(b.lat, 29.99884),
          toNum(b.lng, 31.159592),
          b.is_active !== undefined ? Boolean(b.is_active) : true,
          JSON.stringify(config)
        ]
      );
      broadcastUpdate();
      res.status(201).json(normalizeStoreRow(result.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create store" });
    }
  });

  router.patch("/stores/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid store id" });

      const exRes = await pool.query(
        "SELECT * FROM dispatch_stores WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Store not found" });
      const ex = normalizeStoreRow(exRes.rows[0]);
      const b = req.body || {};

      const nextConfig = b.config
        ? {
            dispatchingQueue: { ...ex.config.dispatchingQueue, ...(b.config.dispatchingQueue || {}) },
            dispatchingSettings: { ...ex.config.dispatchingSettings, ...(b.config.dispatchingSettings || {}) },
            riderOrderJourney: { ...ex.config.riderOrderJourney, ...(b.config.riderOrderJourney || {}) },
            ordersAbuse: { ...ex.config.ordersAbuse, ...(b.config.ordersAbuse || {}) },
            gpsLocations: { ...ex.config.gpsLocations, ...(b.config.gpsLocations || {}) },
            sla: { ...ex.config.sla, ...(b.config.sla || {}) }
          }
        : ex.config;

      await pool.query(
        `UPDATE dispatch_stores
         SET name = $1, brand = $2, code = $3, city = $4, address = $5,
             lat = $6, lng = $7, is_active = $8, config_json = $9, updated_at = CURRENT_TIMESTAMP
         WHERE id = $10 AND company_id = $11`,
        [
          b.name !== undefined ? String(b.name).trim() : ex.name,
          b.brand !== undefined ? String(b.brand).trim() : ex.brand,
          b.code !== undefined ? String(b.code).trim() : ex.code,
          b.city !== undefined ? String(b.city).trim() : ex.city,
          b.address !== undefined ? String(b.address).trim() : ex.address,
          b.lat !== undefined ? toNum(b.lat, ex.lat) : ex.lat,
          b.lng !== undefined ? toNum(b.lng, ex.lng) : ex.lng,
          b.is_active !== undefined ? Boolean(b.is_active) : Boolean(ex.is_active),
          JSON.stringify(nextConfig),
          id,
          companyId
        ]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_stores WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(normalizeStoreRow(refreshed.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update store" });
    }
  });

  router.delete("/stores/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_smart_routes WHERE store_id = $1 AND company_id = $2", [id, companyId]);
      await pool.query("DELETE FROM dispatch_customer_zones WHERE store_id = $1 AND company_id = $2", [id, companyId]);
      await pool.query("DELETE FROM dispatch_stores WHERE id = $1 AND company_id = $2", [id, companyId]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete store" });
    }
  });

  const normalizeZoneRow = (z: any) => {
    if (!z) return z;
    const rawPoly = safeParseJsonArray(z.geofence_polygon_json ?? z.geofence_polygon);
    const polygon = rawPoly
      .filter((pt: any) => Array.isArray(pt) && pt.length >= 2 && Number.isFinite(Number(pt[0])) && Number.isFinite(Number(pt[1])))
      .map((pt: any) => [Number(pt[0]), Number(pt[1])]);
    return {
      ...z,
      has_geofence: Boolean(z.has_geofence) || polygon.length >= 3,
      is_active: z.is_active === undefined ? true : Boolean(z.is_active),
      extra_fees: toNum(z.extra_fees, 0),
      geofence_radius_m: toNum(z.geofence_radius_m, 1000),
      geofence_polygon: polygon,
      geofence_color: String(z.geofence_color || "#0d9488").trim() || "#0d9488",
      lat: toNum(z.lat, 29.99884),
      lng: toNum(z.lng, 31.159592)
    };
  };

  // Customer Zones per Store
  router.get("/stores/:storeId/zones", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const storeId = toNum(req.params.storeId, 0);
      const result = await pool.query(
        "SELECT * FROM dispatch_customer_zones WHERE company_id = $1 AND store_id = $2 ORDER BY id ASC",
        [companyId, storeId]
      );
      res.json((result.rows || []).map(normalizeZoneRow));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load customer zones" });
    }
  });

  router.post("/stores/:storeId/zones", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const storeId = toNum(req.params.storeId, 0);
      const b = req.body || {};
      const name = String(b.name || "").trim();
      if (!storeId || !name) return res.status(400).json({ error: "Store ID and zone name are required." });

      const polygon = safeParseJsonArray(b.geofence_polygon);
      const color = String(b.geofence_color || "#0d9488").trim().slice(0, 32) || "#0d9488";

      const result = await pool.query(
        `INSERT INTO dispatch_customer_zones (
          company_id, store_id, name, city, has_geofence, geofence_radius_m,
          geofence_polygon_json, geofence_color,
          lat, lng, default_vehicle_type, extra_fees, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [
          companyId,
          storeId,
          name,
          String(b.city || "Cairo").trim(),
          Boolean(b.has_geofence) || polygon.length >= 3,
          toNum(b.geofence_radius_m, 1000),
          JSON.stringify(polygon),
          color,
          toNum(b.lat, 29.99884),
          toNum(b.lng, 31.159592),
          String(b.default_vehicle_type || "Motorcycle").trim(),
          toNum(b.extra_fees, 0),
          b.is_active !== undefined ? Boolean(b.is_active) : true
        ]
      );
      broadcastUpdate();
      res.status(201).json(normalizeZoneRow(result.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create customer zone" });
    }
  });

  router.patch("/zones/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const exRes = await pool.query(
        "SELECT * FROM dispatch_customer_zones WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Customer zone not found" });
      const ex = normalizeZoneRow(exRes.rows[0]);
      const b = req.body || {};

      const nextPolygon =
        b.geofence_polygon !== undefined ? safeParseJsonArray(b.geofence_polygon) : ex.geofence_polygon;
      const nextColor =
        b.geofence_color !== undefined
          ? String(b.geofence_color || "#0d9488").trim().slice(0, 32)
          : ex.geofence_color;
      const nextHasGeofence =
        b.has_geofence !== undefined ? Boolean(b.has_geofence) : Boolean(ex.has_geofence);

      await pool.query(
        `UPDATE dispatch_customer_zones
         SET name = $1, city = $2, has_geofence = $3, geofence_radius_m = $4,
             geofence_polygon_json = $5, geofence_color = $6,
             lat = $7, lng = $8, default_vehicle_type = $9, extra_fees = $10,
             is_active = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 AND company_id = $13`,
        [
          b.name !== undefined ? String(b.name).trim() : ex.name,
          b.city !== undefined ? String(b.city).trim() : ex.city,
          nextHasGeofence,
          b.geofence_radius_m !== undefined ? toNum(b.geofence_radius_m, ex.geofence_radius_m) : ex.geofence_radius_m,
          JSON.stringify(nextPolygon),
          nextColor,
          b.lat !== undefined ? toNum(b.lat, ex.lat) : ex.lat,
          b.lng !== undefined ? toNum(b.lng, ex.lng) : ex.lng,
          b.default_vehicle_type !== undefined ? String(b.default_vehicle_type).trim() : ex.default_vehicle_type,
          b.extra_fees !== undefined ? toNum(b.extra_fees, ex.extra_fees) : ex.extra_fees,
          b.is_active !== undefined ? Boolean(b.is_active) : Boolean(ex.is_active),
          id,
          companyId
        ]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_customer_zones WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(normalizeZoneRow(refreshed.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update customer zone" });
    }
  });

  router.delete("/zones/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_customer_zones WHERE id = $1 AND company_id = $2", [id, companyId]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete customer zone" });
    }
  });

  // Smart Routes per Store
  router.get("/stores/:storeId/routes", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const storeId = toNum(req.params.storeId, 0);
      const result = await pool.query(
        "SELECT * FROM dispatch_smart_routes WHERE company_id = $1 AND store_id = $2 ORDER BY id ASC",
        [companyId, storeId]
      );
      res.json((result.rows || []).map(normalizeRouteRow));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load smart routes" });
    }
  });

  router.post("/stores/:storeId/routes", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const storeId = toNum(req.params.storeId, 0);
      const b = req.body || {};
      const name = String(b.name || "").trim();
      if (!storeId || !name) return res.status(400).json({ error: "Store ID and route name are required." });

      const zones = safeParseJsonArray(b.zones);
      const result = await pool.query(
        `INSERT INTO dispatch_smart_routes (company_id, store_id, name, zone_ids_json, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [companyId, storeId, name, JSON.stringify(zones), b.is_active !== undefined ? Boolean(b.is_active) : true]
      );
      broadcastUpdate();
      res.status(201).json(normalizeRouteRow(result.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create smart route" });
    }
  });

  router.patch("/routes/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      const exRes = await pool.query(
        "SELECT * FROM dispatch_smart_routes WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Smart route not found" });
      const ex = normalizeRouteRow(exRes.rows[0]);
      const b = req.body || {};

      const nextZones = b.zones !== undefined ? safeParseJsonArray(b.zones) : ex.zones;
      await pool.query(
        `UPDATE dispatch_smart_routes
         SET name = $1, zone_ids_json = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND company_id = $5`,
        [
          b.name !== undefined ? String(b.name).trim() : ex.name,
          JSON.stringify(nextZones),
          b.is_active !== undefined ? Boolean(b.is_active) : Boolean(ex.is_active),
          id,
          companyId
        ]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_smart_routes WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(normalizeRouteRow(refreshed.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update smart route" });
    }
  });

  router.delete("/routes/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      await pool.query("DELETE FROM dispatch_smart_routes WHERE id = $1 AND company_id = $2", [id, companyId]);
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete smart route" });
    }
  });

  // =========================================================================
  // 8. ACCOUNTING & RIDER WALLETS (STORE / AGENT / TRANSACTION + EXPORTS)
  // =========================================================================
  const ALLOWED_WALLET_TYPES = new Set([
    "COMPLETE_TRIP",
    "COLLECTION",
    "COMMISSION",
    "BONUS",
    "DEDUCTION",
    "MANUAL_ADJUSTMENT",
    "SETTLEMENT"
  ]);

  function normalizeWalletTx(row: any) {
    return {
      ...row,
      id: Number(row.id),
      company_id: Number(row.company_id || 1),
      team_id: row.team_id ? Number(row.team_id) : null,
      rider_id: row.rider_id ? Number(row.rider_id) : null,
      trip_id: row.trip_id ? Number(row.trip_id) : null,
      is_award: Boolean(row.is_award === true || row.is_award === 1 || row.is_award === "1"),
      amount: toNum(row.amount, 0),
      currency: String(row.currency || "EGP")
    };
  }

  function filterTxByDateRange(rows: any[], fromDate?: string | null, toDate?: string | null) {
    if (!fromDate && !toDate) return rows;
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00.000Z`).getTime() : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59.999Z`).getTime() : null;
    return rows.filter((row) => {
      if (!row.created_at) return true;
      const t = new Date(row.created_at).getTime();
      if (isNaN(t)) return true;
      if (fromMs !== null && !isNaN(fromMs) && t < fromMs) return false;
      if (toMs !== null && !isNaN(toMs) && t > toMs) return false;
      return true;
    });
  }

  function sanitizeSpreadsheetCell(value: unknown): string {
    const str = String(value ?? "");
    if (/^[=+\-@\t\r]/.test(str)) {
      return `'${str}`;
    }
    return str;
  }

  async function buildAccountingData(companyId: number, query: Record<string, any>) {
    const teamFilter = typeof query.team === "string" ? query.team.trim() : "";
    const providerFilter = typeof query.provider === "string" ? query.provider.trim() : "";
    const riderIdFilter = toNum(query.riderId, 0);
    const tripNumberFilter = typeof query.tripNumber === "string" ? query.tripNumber.trim().toLowerCase() : "";
    const typeFilter = typeof query.type === "string" ? query.type.trim().toUpperCase() : "";
    const awardFilter = typeof query.award === "string" ? query.award.trim().toLowerCase() : "";
    const fromDate = toNullableDate(query.fromDate);
    const toDate = toNullableDate(query.toDate);
    const minAmount = query.minAmount !== undefined && query.minAmount !== "" ? Number(query.minAmount) : null;
    const maxAmount = query.maxAmount !== undefined && query.maxAmount !== "" ? Number(query.maxAmount) : null;

    const [txRes, ridersRes, teamsRes, providersRes, storesRes] = await Promise.all([
      pool.query(
        "SELECT * FROM dispatch_wallet_transactions WHERE company_id = $1 ORDER BY created_at DESC, id DESC",
        [companyId]
      ),
      pool.query(
        "SELECT * FROM dispatch_riders WHERE company_id = $1 AND is_archived = $2 ORDER BY name ASC",
        [companyId, false]
      ),
      pool.query("SELECT * FROM dispatch_teams WHERE company_id = $1 ORDER BY name ASC", [companyId]),
      pool.query("SELECT * FROM dispatch_providers WHERE company_id = $1 ORDER BY name ASC", [companyId]),
      pool.query("SELECT id, name FROM dispatch_stores WHERE company_id = $1 ORDER BY name ASC", [companyId])
    ]);

    const allTx = (txRes.rows || []).map(normalizeWalletTx);
    const allRiders = ridersRes.rows || [];
    const allTeams = teamsRes.rows || [];
    const allProviders = providersRes.rows || [];
    const allStores = storesRes.rows || [];

    // Date-filtered transactions
    let filteredTx = filterTxByDateRange(allTx, fromDate, toDate);
    if (providerFilter && providerFilter !== "all") {
      filteredTx = filteredTx.filter(
        (t) => String(t.provider_name || "").trim().toLowerCase() === providerFilter.toLowerCase()
      );
    }

    // Store / Team aggregation
    const teamTotalsMap = new Map<
      string,
      {
        team_name: string;
        total_amount: number;
        transactions_count: number;
        riders_set: Set<string>;
        collections_total: number;
        commissions_total: number;
      }
    >();

    // Seed map with known teams/stores so active branches appear cleanly
    for (const tm of allTeams) {
      const tName = String(tm.name || "").trim();
      if (tName && !teamTotalsMap.has(tName)) {
        teamTotalsMap.set(tName, {
          team_name: tName,
          total_amount: 0,
          transactions_count: 0,
          riders_set: new Set<string>(),
          collections_total: 0,
          commissions_total: 0
        });
      }
    }
    if (teamTotalsMap.size === 0) {
      for (const st of allStores) {
        const sName = String(st.name || "").trim();
        if (sName && !teamTotalsMap.has(sName)) {
          teamTotalsMap.set(sName, {
            team_name: sName,
            total_amount: 0,
            transactions_count: 0,
            riders_set: new Set<string>(),
            collections_total: 0,
            commissions_total: 0
          });
        }
      }
    }

    for (const tx of filteredTx) {
      const tName = String(tx.team_name || "Unassigned Branch").trim() || "Unassigned Branch";
      if (!teamTotalsMap.has(tName)) {
        teamTotalsMap.set(tName, {
          team_name: tName,
          total_amount: 0,
          transactions_count: 0,
          riders_set: new Set<string>(),
          collections_total: 0,
          commissions_total: 0
        });
      }
      const bucket = teamTotalsMap.get(tName)!;
      bucket.total_amount = Number((bucket.total_amount + tx.amount).toFixed(2));
      bucket.transactions_count += 1;
      if (tx.rider_name) bucket.riders_set.add(tx.rider_name);
      if (tx.transaction_type === "COLLECTION") {
        bucket.collections_total = Number((bucket.collections_total + tx.amount).toFixed(2));
      } else {
        bucket.commissions_total = Number((bucket.commissions_total + tx.amount).toFixed(2));
      }
    }

    const storeRows = Array.from(teamTotalsMap.values()).map((b) => ({
      team_name: b.team_name,
      total_amount: b.total_amount,
      transactions_count: b.transactions_count,
      riders_count: b.riders_set.size,
      collections_total: b.collections_total,
      commissions_total: b.commissions_total,
      currency: "EGP"
    }));
    const storeGrandTotal = Number(
      storeRows.reduce((s, r) => s + r.total_amount, 0).toFixed(2)
    );

    // Agent / Rider aggregation
    let filteredRiders = [...allRiders];
    if (teamFilter && teamFilter !== "all") {
      filteredRiders = filteredRiders.filter(
        (r) => String(r.team_name || "").trim().toLowerCase() === teamFilter.toLowerCase()
      );
    }
    if (providerFilter && providerFilter !== "all") {
      filteredRiders = filteredRiders.filter(
        (r) => String(r.provider_name || "").trim().toLowerCase() === providerFilter.toLowerCase()
      );
    }
    if (riderIdFilter > 0) {
      filteredRiders = filteredRiders.filter((r) => Number(r.id) === riderIdFilter);
    }

    const agentRows = filteredRiders.map((rider) => {
      const rId = Number(rider.id);
      const rNameLower = String(rider.name || "").trim().toLowerCase();
      const riderTx = filteredTx.filter(
        (tx) =>
          (tx.rider_id && tx.rider_id === rId) ||
          (!tx.rider_id && String(tx.rider_name || "").trim().toLowerCase() === rNameLower)
      );
      const total = Number(
        riderTx.reduce((sum: number, tx: any) => sum + toNum(tx.amount, 0), 0).toFixed(2)
      );
      return {
        rider_id: rId,
        team_name: String(rider.team_name || ""),
        provider_name: String(rider.provider_name || ""),
        rider_name: String(rider.name || ""),
        enroll_id: String(rider.enroll_id || ""),
        total_amount: total,
        transactions_count: riderTx.length,
        payroll_method: String(rider.payroll_method || ""),
        payroll_method_number: String(rider.payroll_method_number || rider.acc_number || ""),
        currency: "EGP"
      };
    });

    // Transaction detailed rows (apply additional filters)
    let txRows = [...filteredTx];
    if (teamFilter && teamFilter !== "all") {
      txRows = txRows.filter(
        (t) => String(t.team_name || "").trim().toLowerCase() === teamFilter.toLowerCase()
      );
    }
    if (riderIdFilter > 0) {
      const matchedRider = allRiders.find((r) => Number(r.id) === riderIdFilter);
      const rNameLower = matchedRider ? String(matchedRider.name || "").trim().toLowerCase() : "";
      txRows = txRows.filter(
        (t) =>
          t.rider_id === riderIdFilter ||
          (rNameLower && String(t.rider_name || "").trim().toLowerCase() === rNameLower)
      );
    }
    if (tripNumberFilter) {
      txRows = txRows.filter((t) =>
        String(t.trip_number || "").toLowerCase().includes(tripNumberFilter)
      );
    }
    if (typeFilter && typeFilter !== "ALL") {
      txRows = txRows.filter(
        (t) => String(t.transaction_type || "").toUpperCase() === typeFilter
      );
    }
    if (awardFilter === "yes" || awardFilter === "true") {
      txRows = txRows.filter((t) => t.is_award === true);
    } else if (awardFilter === "no" || awardFilter === "false") {
      txRows = txRows.filter((t) => t.is_award === false);
    }
    if (minAmount !== null && Number.isFinite(minAmount)) {
      txRows = txRows.filter((t) => t.amount >= minAmount);
    }
    if (maxAmount !== null && Number.isFinite(maxAmount)) {
      txRows = txRows.filter((t) => t.amount <= maxAmount);
    }

    const txTotalAmount = Number(
      txRows.reduce((s, r) => s + r.amount, 0).toFixed(2)
    );

    // Distinct team names list for dropdowns
    const teamNamesSet = new Set<string>();
    allTeams.forEach((t: any) => t.name && teamNamesSet.add(String(t.name)));
    allStores.forEach((s: any) => s.name && teamNamesSet.add(String(s.name)));
    allRiders.forEach((r: any) => r.team_name && teamNamesSet.add(String(r.team_name)));
    allTx.forEach((tx: any) => tx.team_name && teamNamesSet.add(String(tx.team_name)));

    return {
      storeRows,
      storeGrandTotal,
      agentRows,
      agentTotalAmount: Number(agentRows.reduce((s, a) => s + a.total_amount, 0).toFixed(2)),
      txRows,
      txTotalAmount,
      counts: {
        stores: storeRows.length,
        agents: allRiders.length,
        transactions: allTx.length
      },
      filters: {
        teams: Array.from(teamNamesSet).sort(),
        providers: allProviders.map((p: any) => String(p.name)).filter(Boolean),
        riders: allRiders.map((r: any) => ({
          id: Number(r.id),
          name: String(r.name || ""),
          enroll_id: String(r.enroll_id || ""),
          team_name: String(r.team_name || ""),
          provider_name: String(r.provider_name || ""),
          payroll_method: String(r.payroll_method || ""),
          payroll_method_number: String(r.payroll_method_number || r.acc_number || "")
        })),
        types: Array.from(ALLOWED_WALLET_TYPES)
      }
    };
  }

  router.get("/accounting/wallet/store", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await buildAccountingData(companyId, req.query);
      res.json({
        grandTotal: data.storeGrandTotal,
        currency: "EGP",
        rows: data.storeRows,
        counts: data.counts,
        filters: data.filters
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load store wallet summary" });
    }
  });

  router.get("/accounting/wallet/agent", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await buildAccountingData(companyId, req.query);
      res.json({
        totalAmount: data.agentTotalAmount,
        count: data.agentRows.length,
        currency: "EGP",
        rows: data.agentRows,
        counts: data.counts,
        filters: data.filters
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load agent wallets" });
    }
  });

  router.get("/accounting/wallet/transactions", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const data = await buildAccountingData(companyId, req.query);
      res.json({
        totalAmount: data.txTotalAmount,
        count: data.txRows.length,
        currency: "EGP",
        rows: data.txRows,
        counts: data.counts,
        filters: data.filters
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load wallet transactions" });
    }
  });

  router.post("/accounting/transactions", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const riderId = b.rider_id ? toNum(b.rider_id, 0) : null;
      let riderName = String(b.rider_name || "").trim();
      let teamId = b.team_id ? toNum(b.team_id, 0) : null;
      let teamName = String(b.team_name || "").trim();
      let providerName = String(b.provider_name || "").trim();
      let enrollId = String(b.enroll_id || "").trim();

      if (riderId) {
        const riderRes = await pool.query(
          "SELECT * FROM dispatch_riders WHERE id = $1 AND company_id = $2",
          [riderId, companyId]
        );
        if (riderRes.rows.length > 0) {
          const r = riderRes.rows[0];
          riderName = riderName || String(r.name || "");
          teamId = teamId || (r.team_id ? Number(r.team_id) : null);
          teamName = teamName || String(r.team_name || "");
          providerName = providerName || String(r.provider_name || "");
          enrollId = enrollId || String(r.enroll_id || "");

          // Optionally persist updated payroll method & number onto rider profile
          if (b.payroll_method !== undefined || b.payroll_method_number !== undefined) {
            await pool.query(
              `UPDATE dispatch_riders
               SET payroll_method = $1, payroll_method_number = $2, updated_at = CURRENT_TIMESTAMP
               WHERE id = $3 AND company_id = $4`,
              [
                b.payroll_method !== undefined ? String(b.payroll_method).trim().slice(0, 80) : String(r.payroll_method || ""),
                b.payroll_method_number !== undefined
                  ? String(b.payroll_method_number).trim().slice(0, 120)
                  : String(r.payroll_method_number || ""),
                riderId,
                companyId
              ]
            );
          }
        }
      }

      if (!riderName) {
        return res.status(400).json({ error: "Rider is required to record a wallet transaction." });
      }

      const amount = Number(b.amount);
      if (!Number.isFinite(amount)) {
        return res.status(400).json({ error: "A valid numeric amount is required." });
      }

      const rawType = String(b.transaction_type || "COMPLETE_TRIP").trim().toUpperCase();
      const txType = ALLOWED_WALLET_TYPES.has(rawType) ? rawType : "MANUAL_ADJUSTMENT";
      const isAward = b.is_award !== undefined ? Boolean(b.is_award) : amount >= 0;
      const tripId = b.trip_id ? toNum(b.trip_id, 0) : null;
      const tripNumber = String(b.trip_number || "").trim().slice(0, 80);
      const currency = String(b.currency || "EGP").trim().slice(0, 16) || "EGP";
      const notes = String(b.notes || "").trim();
      const createdBy = String((req as AuthRequest).user?.name || (req as AuthRequest).user?.email || "Operations").slice(0, 120);

      const insertRes = await pool.query(
        `INSERT INTO dispatch_wallet_transactions
          (company_id, team_id, team_name, provider_name, rider_id, rider_name, enroll_id,
           trip_id, trip_number, transaction_type, is_award, amount, currency, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING *`,
        [
          companyId,
          teamId,
          teamName,
          providerName,
          riderId,
          riderName,
          enrollId,
          tripId,
          tripNumber,
          txType,
          isAward,
          Number(amount.toFixed(2)),
          currency,
          notes,
          createdBy
        ]
      );

      broadcastUpdate();
      res.status(201).json(normalizeWalletTx(insertRes.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to record wallet transaction" });
    }
  });

  router.patch("/accounting/riders/:riderId/payroll", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const riderId = toNum(req.params.riderId, 0);
      if (!riderId) return res.status(400).json({ error: "Invalid rider ID" });

      const exRes = await pool.query(
        "SELECT id FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [riderId, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Rider not found" });

      const b = req.body || {};
      const method = String(b.payroll_method || "").trim().slice(0, 80);
      const number = String(b.payroll_method_number || "").trim().slice(0, 120);

      await pool.query(
        `UPDATE dispatch_riders
         SET payroll_method = $1, payroll_method_number = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND company_id = $4`,
        [method, number, riderId, companyId]
      );

      const updated = await pool.query(
        "SELECT id, name, enroll_id, team_name, payroll_method, payroll_method_number FROM dispatch_riders WHERE id = $1 AND company_id = $2",
        [riderId, companyId]
      );
      broadcastUpdate();
      res.json(updated.rows[0]);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update rider payroll method" });
    }
  });

  router.delete("/accounting/transactions/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid transaction ID" });

      const exRes = await pool.query(
        "SELECT id FROM dispatch_wallet_transactions WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Transaction not found" });

      await pool.query(
        "DELETE FROM dispatch_wallet_transactions WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete transaction" });
    }
  });

  router.get("/accounting/export", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const tab = String(req.query.tab || "store").toLowerCase();
      const format = String(req.query.format || "xlsx").toLowerCase();
      const data = await buildAccountingData(companyId, req.query);

      let headers: string[] = [];
      let rows: (string | number)[][] = [];
      let sheetTitle = "Accounting";

      if (tab === "agent") {
        sheetTitle = "Agent Wallets";
        headers = [
          "Team",
          "Rider Name",
          "Enroll ID",
          "Total Amount (EGP)",
          "Transactions",
          "Payroll Method",
          "Payroll Method Number"
        ];
        rows = data.agentRows.map((a) => [
          sanitizeSpreadsheetCell(a.team_name),
          sanitizeSpreadsheetCell(a.rider_name),
          sanitizeSpreadsheetCell(a.enroll_id),
          a.total_amount,
          a.transactions_count,
          sanitizeSpreadsheetCell(a.payroll_method),
          sanitizeSpreadsheetCell(a.payroll_method_number)
        ]);
      } else if (tab === "transaction") {
        sheetTitle = "Wallet Transactions";
        headers = [
          "#",
          "Team",
          "Created Date",
          "Rider Name",
          "Trip",
          "Type",
          "Award",
          "Amount (EGP)",
          "Notes"
        ];
        rows = data.txRows.map((tx, idx) => [
          idx + 1,
          sanitizeSpreadsheetCell(tx.team_name),
          sanitizeSpreadsheetCell(tx.created_at ? new Date(tx.created_at).toISOString().replace("T", " ").slice(0, 19) : ""),
          sanitizeSpreadsheetCell(tx.rider_name),
          sanitizeSpreadsheetCell(tx.trip_number || ""),
          sanitizeSpreadsheetCell(tx.transaction_type),
          tx.is_award ? "Yes" : "No",
          tx.amount,
          sanitizeSpreadsheetCell(tx.notes || "N/A")
        ]);
      } else {
        sheetTitle = "Store Accounting";
        headers = ["Team", "Total Amount (EGP)", "Transactions", "Collections (EGP)", "Commissions & Awards (EGP)"];
        rows = [
          ["All Stores Total", data.storeGrandTotal, data.txRows.length, "", ""],
          ...data.storeRows.map((s) => [
            sanitizeSpreadsheetCell(s.team_name),
            s.total_amount,
            s.transactions_count,
            s.collections_total,
            s.commissions_total
          ])
        ];
      }

      const fileStamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        const csvLines = [
          headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(","),
          ...rows.map((r) =>
            r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
          )
        ];
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="dispatch-accounting-${tab}-${fileStamp}.csv"`
        );
        return res.send(`\uFEFF${csvLines.join("\n")}`);
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(sheetTitle);
      ws.addRow(headers);
      ws.getRow(1).font = { bold: true };
      rows.forEach((r) => ws.addRow(r));
      ws.columns.forEach((col) => {
        col.width = 20;
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="dispatch-accounting-${tab}-${fileStamp}.xlsx"`
      );
      await wb.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to export accounting report" });
    }
  });

  // =========================================================================
  // 9. STORE SETTINGS: REASONS, RIDER REVENUE & TRIPS TYPE
  // =========================================================================
  const ALLOWED_REASON_CATEGORIES = new Set([
    "cancellation",
    "schedule",
    "pause",
    "cancel_shift",
    "end_shift",
    "remove_from_trip",
    "break"
  ]);

  function normalizeReasonRow(r: any) {
    return {
      ...r,
      id: Number(r.id),
      company_id: Number(r.company_id || 1),
      category: String(r.category || ""),
      name: String(r.name || ""),
      reason_type: String(r.reason_type || ""),
      is_active: Boolean(r.is_active === true || r.is_active === 1 || r.is_active === "1")
    };
  }

  function buildDefaultRevenueRule(companyId: number, scope: "company" | "team" = "company", teamId: number | null = null, teamName = "") {
    return {
      id: null as number | null,
      company_id: companyId,
      scope,
      team_id: teamId,
      team_name: teamName,
      has_override: false,
      online_shift_hours_enabled: false,
      online_shift_hour_price: 0,
      excellent_trip_revenue: 2,
      good_trip_revenue: 1,
      late_trip_revenue: 0,
      abuse_trip_deduction: 12,
      order_rev_excellent: 0,
      order_rev_good: 0,
      order_rev_late: 0,
      order_rev_abuse: 0,
      trip_ignoring_enabled: false,
      trip_ignoring_deduction: 0,
      trip_ignoring_penalization_enabled: false,
      trip_ignoring_penalization_deduction: 0,
      rider_abuse_penalization_enabled: false,
      rider_abuse_penalization_deduction: 0,
      currency: "EGP"
    };
  }

  function normalizeRevenueRule(row: any, hasOverride = true) {
    return {
      id: row.id ? Number(row.id) : null,
      company_id: Number(row.company_id || 1),
      scope: String(row.scope || "company"),
      team_id: row.team_id ? Number(row.team_id) : null,
      team_name: String(row.team_name || ""),
      has_override: hasOverride,
      online_shift_hours_enabled: Boolean(row.online_shift_hours_enabled === true || row.online_shift_hours_enabled === 1 || row.online_shift_hours_enabled === "1"),
      online_shift_hour_price: toNum(row.online_shift_hour_price, 0),
      excellent_trip_revenue: toNum(row.excellent_trip_revenue, 0),
      good_trip_revenue: toNum(row.good_trip_revenue, 0),
      late_trip_revenue: toNum(row.late_trip_revenue, 0),
      abuse_trip_deduction: toNum(row.abuse_trip_deduction, 0),
      order_rev_excellent: toNum(row.order_rev_excellent, 0),
      order_rev_good: toNum(row.order_rev_good, 0),
      order_rev_late: toNum(row.order_rev_late, 0),
      order_rev_abuse: toNum(row.order_rev_abuse, 0),
      trip_ignoring_enabled: Boolean(row.trip_ignoring_enabled === true || row.trip_ignoring_enabled === 1 || row.trip_ignoring_enabled === "1"),
      trip_ignoring_deduction: toNum(row.trip_ignoring_deduction, 0),
      trip_ignoring_penalization_enabled: Boolean(row.trip_ignoring_penalization_enabled === true || row.trip_ignoring_penalization_enabled === 1 || row.trip_ignoring_penalization_enabled === "1"),
      trip_ignoring_penalization_deduction: toNum(row.trip_ignoring_penalization_deduction, 0),
      rider_abuse_penalization_enabled: Boolean(row.rider_abuse_penalization_enabled === true || row.rider_abuse_penalization_enabled === 1 || row.rider_abuse_penalization_enabled === "1"),
      rider_abuse_penalization_deduction: toNum(row.rider_abuse_penalization_deduction, 0),
      currency: String(row.currency || "EGP")
    };
  }

  function normalizeTripTypeRow(r: any) {
    return {
      ...r,
      id: Number(r.id),
      company_id: Number(r.company_id || 1),
      name: String(r.name || ""),
      code: String(r.code || ""),
      description: String(r.description || ""),
      base_fee: toNum(r.base_fee, 0),
      max_orders: toNum(r.max_orders, 4),
      is_active: Boolean(r.is_active === true || r.is_active === 1 || r.is_active === "1")
    };
  }

  // --- REASONS CRUD ---
  router.get("/settings/reasons", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const { category, status } = req.query;
      const conditions: string[] = ["company_id = $1"];
      const params: any[] = [companyId];
      let pIdx = 2;

      if (typeof category === "string" && category.trim() && ALLOWED_REASON_CATEGORIES.has(category.trim())) {
        conditions.push(`category = $${pIdx++}`);
        params.push(category.trim());
      }
      if (status === "active") {
        conditions.push(`is_active = $${pIdx++}`);
        params.push(true);
      } else if (status === "inactive") {
        conditions.push(`is_active = $${pIdx++}`);
        params.push(false);
      }

      const result = await pool.query(
        `SELECT * FROM dispatch_reasons WHERE ${conditions.join(" AND ")} ORDER BY id DESC`,
        params
      );
      res.json((result.rows || []).map(normalizeReasonRow));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load reasons" });
    }
  });

  router.post("/settings/reasons", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const category = String(b.category || "").trim();
      const name = String(b.name || "").trim().slice(0, 191);
      const reasonType = String(b.reason_type || "").trim().slice(0, 80);

      if (!ALLOWED_REASON_CATEGORIES.has(category)) {
        return res.status(400).json({ error: "Invalid reason category." });
      }
      if (!name) {
        return res.status(400).json({ error: "Reason name is required." });
      }

      const result = await pool.query(
        `INSERT INTO dispatch_reasons (company_id, category, name, reason_type, is_active)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [companyId, category, name, reasonType, b.is_active !== undefined ? Boolean(b.is_active) : true]
      );
      broadcastUpdate();
      res.status(201).json(normalizeReasonRow(result.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create reason" });
    }
  });

  router.patch("/settings/reasons/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid reason ID" });

      const exRes = await pool.query(
        "SELECT * FROM dispatch_reasons WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Reason not found" });
      const ex = normalizeReasonRow(exRes.rows[0]);
      const b = req.body || {};

      const nextName = b.name !== undefined ? String(b.name).trim().slice(0, 191) : ex.name;
      if (!nextName) return res.status(400).json({ error: "Reason name is required." });
      const nextType = b.reason_type !== undefined ? String(b.reason_type).trim().slice(0, 80) : ex.reason_type;
      const nextActive = b.is_active !== undefined ? Boolean(b.is_active) : ex.is_active;

      await pool.query(
        `UPDATE dispatch_reasons
         SET name = $1, reason_type = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $4 AND company_id = $5`,
        [nextName, nextType, nextActive, id, companyId]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_reasons WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(normalizeReasonRow(refreshed.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update reason" });
    }
  });

  router.delete("/settings/reasons/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid reason ID" });

      await pool.query(
        "DELETE FROM dispatch_reasons WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete reason" });
    }
  });

  // --- RIDER REVENUE RULES (COMPANY DEFAULTS + PER-TEAM OVERRIDES) ---
  router.get("/settings/rider-revenue", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const [rulesRes, teamsRes] = await Promise.all([
        pool.query(
          "SELECT * FROM dispatch_rider_revenue_rules WHERE company_id = $1 ORDER BY id ASC",
          [companyId]
        ),
        pool.query(
          "SELECT * FROM dispatch_teams WHERE company_id = $1 ORDER BY id ASC",
          [companyId]
        )
      ]);

      const rules = rulesRes.rows || [];
      const companyRow = rules.find((r: any) => String(r.scope) === "company");
      const companyDefaults = companyRow
        ? normalizeRevenueRule(companyRow, false)
        : buildDefaultRevenueRule(companyId, "company", null, "");

      const teamRulesById = new Map<number, any>();
      const teamRulesByName = new Map<string, any>();
      for (const r of rules) {
        if (String(r.scope) === "team") {
          if (r.team_id) teamRulesById.set(Number(r.team_id), r);
          if (r.team_name) teamRulesByName.set(String(r.team_name).trim().toLowerCase(), r);
        }
      }

      const teams = (teamsRes.rows || []).map((tm: any) => {
        const tId = Number(tm.id);
        const tName = String(tm.name || "");
        const matched = teamRulesById.get(tId) || teamRulesByName.get(tName.trim().toLowerCase());
        if (matched) {
          return {
            ...normalizeRevenueRule(matched, true),
            team_id: tId,
            team_name: tName
          };
        }
        return {
          ...companyDefaults,
          id: null,
          scope: "team",
          team_id: tId,
          team_name: tName,
          has_override: false
        };
      });

      res.json({ companyDefaults, teams });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load rider revenue rules" });
    }
  });

  function extractRevenueFields(b: any) {
    return {
      online_shift_hours_enabled: Boolean(b.online_shift_hours_enabled),
      online_shift_hour_price: Math.max(0, toNum(b.online_shift_hour_price, 0)),
      excellent_trip_revenue: Math.max(0, toNum(b.excellent_trip_revenue, 0)),
      good_trip_revenue: Math.max(0, toNum(b.good_trip_revenue, 0)),
      late_trip_revenue: Math.max(0, toNum(b.late_trip_revenue, 0)),
      abuse_trip_deduction: Math.max(0, toNum(b.abuse_trip_deduction, 0)),
      order_rev_excellent: Math.max(0, toNum(b.order_rev_excellent, 0)),
      order_rev_good: Math.max(0, toNum(b.order_rev_good, 0)),
      order_rev_late: Math.max(0, toNum(b.order_rev_late, 0)),
      order_rev_abuse: Math.max(0, toNum(b.order_rev_abuse, 0)),
      trip_ignoring_enabled: Boolean(b.trip_ignoring_enabled),
      trip_ignoring_deduction: Math.max(0, toNum(b.trip_ignoring_deduction, 0)),
      trip_ignoring_penalization_enabled: Boolean(b.trip_ignoring_penalization_enabled),
      trip_ignoring_penalization_deduction: Math.max(0, toNum(b.trip_ignoring_penalization_deduction, 0)),
      rider_abuse_penalization_enabled: Boolean(b.rider_abuse_penalization_enabled),
      rider_abuse_penalization_deduction: Math.max(0, toNum(b.rider_abuse_penalization_deduction, 0)),
      currency: String(b.currency || "EGP").trim().slice(0, 16) || "EGP"
    };
  }

  router.put("/settings/rider-revenue/company", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const f = extractRevenueFields(req.body || {});
      const exRes = await pool.query(
        "SELECT id FROM dispatch_rider_revenue_rules WHERE company_id = $1 AND scope = $2 LIMIT 1",
        [companyId, "company"]
      );

      let savedId: number;
      if (exRes.rows.length > 0) {
        savedId = Number(exRes.rows[0].id);
        await pool.query(
          `UPDATE dispatch_rider_revenue_rules SET
            online_shift_hours_enabled = $1,
            online_shift_hour_price = $2,
            excellent_trip_revenue = $3,
            good_trip_revenue = $4,
            late_trip_revenue = $5,
            abuse_trip_deduction = $6,
            order_rev_excellent = $7,
            order_rev_good = $8,
            order_rev_late = $9,
            order_rev_abuse = $10,
            trip_ignoring_enabled = $11,
            trip_ignoring_deduction = $12,
            trip_ignoring_penalization_enabled = $13,
            trip_ignoring_penalization_deduction = $14,
            rider_abuse_penalization_enabled = $15,
            rider_abuse_penalization_deduction = $16,
            currency = $17,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $18 AND company_id = $19`,
          [
            f.online_shift_hours_enabled,
            f.online_shift_hour_price,
            f.excellent_trip_revenue,
            f.good_trip_revenue,
            f.late_trip_revenue,
            f.abuse_trip_deduction,
            f.order_rev_excellent,
            f.order_rev_good,
            f.order_rev_late,
            f.order_rev_abuse,
            f.trip_ignoring_enabled,
            f.trip_ignoring_deduction,
            f.trip_ignoring_penalization_enabled,
            f.trip_ignoring_penalization_deduction,
            f.rider_abuse_penalization_enabled,
            f.rider_abuse_penalization_deduction,
            f.currency,
            savedId,
            companyId
          ]
        );
      } else {
        const ins = await pool.query(
          `INSERT INTO dispatch_rider_revenue_rules (
            company_id, scope, team_id, team_name,
            online_shift_hours_enabled, online_shift_hour_price,
            excellent_trip_revenue, good_trip_revenue, late_trip_revenue, abuse_trip_deduction,
            order_rev_excellent, order_rev_good, order_rev_late, order_rev_abuse,
            trip_ignoring_enabled, trip_ignoring_deduction,
            trip_ignoring_penalization_enabled, trip_ignoring_penalization_deduction,
            rider_abuse_penalization_enabled, rider_abuse_penalization_deduction, currency
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16,
            $17, $18,
            $19, $20, $21
          ) RETURNING *`,
          [
            companyId,
            "company",
            null,
            "",
            f.online_shift_hours_enabled,
            f.online_shift_hour_price,
            f.excellent_trip_revenue,
            f.good_trip_revenue,
            f.late_trip_revenue,
            f.abuse_trip_deduction,
            f.order_rev_excellent,
            f.order_rev_good,
            f.order_rev_late,
            f.order_rev_abuse,
            f.trip_ignoring_enabled,
            f.trip_ignoring_deduction,
            f.trip_ignoring_penalization_enabled,
            f.trip_ignoring_penalization_deduction,
            f.rider_abuse_penalization_enabled,
            f.rider_abuse_penalization_deduction,
            f.currency
          ]
        );
        savedId = Number(ins.rows[0].id);
      }

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_rider_revenue_rules WHERE id = $1 AND company_id = $2",
        [savedId, companyId]
      );
      broadcastUpdate();
      res.json(normalizeRevenueRule(refreshed.rows[0], false));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save company rider revenue defaults" });
    }
  });

  router.put("/settings/rider-revenue/team/:teamId", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const teamId = toNum(req.params.teamId, 0);
      if (!teamId) return res.status(400).json({ error: "Invalid team ID" });

      const teamRes = await pool.query(
        "SELECT id, name FROM dispatch_teams WHERE id = $1 AND company_id = $2",
        [teamId, companyId]
      );
      if (!teamRes.rows.length) return res.status(404).json({ error: "Team not found" });
      const teamName = String(teamRes.rows[0].name || "");

      const f = extractRevenueFields(req.body || {});
      const exRes = await pool.query(
        "SELECT id FROM dispatch_rider_revenue_rules WHERE company_id = $1 AND scope = $2 AND team_id = $3 LIMIT 1",
        [companyId, "team", teamId]
      );

      let savedId: number;
      if (exRes.rows.length > 0) {
        savedId = Number(exRes.rows[0].id);
        await pool.query(
          `UPDATE dispatch_rider_revenue_rules SET
            team_name = $1,
            online_shift_hours_enabled = $2,
            online_shift_hour_price = $3,
            excellent_trip_revenue = $4,
            good_trip_revenue = $5,
            late_trip_revenue = $6,
            abuse_trip_deduction = $7,
            order_rev_excellent = $8,
            order_rev_good = $9,
            order_rev_late = $10,
            order_rev_abuse = $11,
            trip_ignoring_enabled = $12,
            trip_ignoring_deduction = $13,
            trip_ignoring_penalization_enabled = $14,
            trip_ignoring_penalization_deduction = $15,
            rider_abuse_penalization_enabled = $16,
            rider_abuse_penalization_deduction = $17,
            currency = $18,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = $19 AND company_id = $20`,
          [
            teamName,
            f.online_shift_hours_enabled,
            f.online_shift_hour_price,
            f.excellent_trip_revenue,
            f.good_trip_revenue,
            f.late_trip_revenue,
            f.abuse_trip_deduction,
            f.order_rev_excellent,
            f.order_rev_good,
            f.order_rev_late,
            f.order_rev_abuse,
            f.trip_ignoring_enabled,
            f.trip_ignoring_deduction,
            f.trip_ignoring_penalization_enabled,
            f.trip_ignoring_penalization_deduction,
            f.rider_abuse_penalization_enabled,
            f.rider_abuse_penalization_deduction,
            f.currency,
            savedId,
            companyId
          ]
        );
      } else {
        const ins = await pool.query(
          `INSERT INTO dispatch_rider_revenue_rules (
            company_id, scope, team_id, team_name,
            online_shift_hours_enabled, online_shift_hour_price,
            excellent_trip_revenue, good_trip_revenue, late_trip_revenue, abuse_trip_deduction,
            order_rev_excellent, order_rev_good, order_rev_late, order_rev_abuse,
            trip_ignoring_enabled, trip_ignoring_deduction,
            trip_ignoring_penalization_enabled, trip_ignoring_penalization_deduction,
            rider_abuse_penalization_enabled, rider_abuse_penalization_deduction, currency
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6,
            $7, $8, $9, $10,
            $11, $12, $13, $14,
            $15, $16,
            $17, $18,
            $19, $20, $21
          ) RETURNING *`,
          [
            companyId,
            "team",
            teamId,
            teamName,
            f.online_shift_hours_enabled,
            f.online_shift_hour_price,
            f.excellent_trip_revenue,
            f.good_trip_revenue,
            f.late_trip_revenue,
            f.abuse_trip_deduction,
            f.order_rev_excellent,
            f.order_rev_good,
            f.order_rev_late,
            f.order_rev_abuse,
            f.trip_ignoring_enabled,
            f.trip_ignoring_deduction,
            f.trip_ignoring_penalization_enabled,
            f.trip_ignoring_penalization_deduction,
            f.rider_abuse_penalization_enabled,
            f.rider_abuse_penalization_deduction,
            f.currency
          ]
        );
        savedId = Number(ins.rows[0].id);
      }

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_rider_revenue_rules WHERE id = $1 AND company_id = $2",
        [savedId, companyId]
      );
      broadcastUpdate();
      res.json(normalizeRevenueRule(refreshed.rows[0], true));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to save team rider revenue rules" });
    }
  });

  router.delete("/settings/rider-revenue/team/:teamId", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const teamId = toNum(req.params.teamId, 0);
      if (!teamId) return res.status(400).json({ error: "Invalid team ID" });

      await pool.query(
        "DELETE FROM dispatch_rider_revenue_rules WHERE company_id = $1 AND scope = $2 AND team_id = $3",
        [companyId, "team", teamId]
      );
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to reset team revenue rules" });
    }
  });

  // --- TRIPS TYPE CRUD ---
  router.get("/settings/trip-types", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const { status, search } = req.query;
      const conditions: string[] = ["company_id = $1"];
      const params: any[] = [companyId];
      let pIdx = 2;

      if (status === "active") {
        conditions.push(`is_active = $${pIdx++}`);
        params.push(true);
      } else if (status === "inactive") {
        conditions.push(`is_active = $${pIdx++}`);
        params.push(false);
      }
      if (typeof search === "string" && search.trim()) {
        conditions.push(`(LOWER(name) LIKE LOWER($${pIdx}) OR LOWER(code) LIKE LOWER($${pIdx}))`);
        params.push(`%${search.trim()}%`);
        pIdx++;
      }

      const result = await pool.query(
        `SELECT * FROM dispatch_trip_types WHERE ${conditions.join(" AND ")} ORDER BY id ASC`,
        params
      );
      res.json((result.rows || []).map(normalizeTripTypeRow));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to load trip types" });
    }
  });

  router.post("/settings/trip-types", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const b = req.body || {};
      const name = String(b.name || "").trim().slice(0, 191);
      if (!name) return res.status(400).json({ error: "Trip type name is required." });

      const code = String(b.code || "").trim().toUpperCase().slice(0, 60);
      const description = String(b.description || "").trim();
      const baseFee = Math.max(0, toNum(b.base_fee, 0));
      const maxOrders = Math.max(1, Math.round(toNum(b.max_orders, 4)));
      const isActive = b.is_active !== undefined ? Boolean(b.is_active) : true;

      const result = await pool.query(
        `INSERT INTO dispatch_trip_types (company_id, name, code, description, base_fee, max_orders, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [companyId, name, code, description, baseFee, maxOrders, isActive]
      );
      broadcastUpdate();
      res.status(201).json(normalizeTripTypeRow(result.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to create trip type" });
    }
  });

  router.patch("/settings/trip-types/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid trip type ID" });

      const exRes = await pool.query(
        "SELECT * FROM dispatch_trip_types WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      if (!exRes.rows.length) return res.status(404).json({ error: "Trip type not found" });
      const ex = normalizeTripTypeRow(exRes.rows[0]);
      const b = req.body || {};

      const nextName = b.name !== undefined ? String(b.name).trim().slice(0, 191) : ex.name;
      if (!nextName) return res.status(400).json({ error: "Trip type name is required." });

      await pool.query(
        `UPDATE dispatch_trip_types
         SET name = $1, code = $2, description = $3, base_fee = $4, max_orders = $5, is_active = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7 AND company_id = $8`,
        [
          nextName,
          b.code !== undefined ? String(b.code).trim().toUpperCase().slice(0, 60) : ex.code,
          b.description !== undefined ? String(b.description).trim() : ex.description,
          b.base_fee !== undefined ? Math.max(0, toNum(b.base_fee, ex.base_fee)) : ex.base_fee,
          b.max_orders !== undefined ? Math.max(1, Math.round(toNum(b.max_orders, ex.max_orders))) : ex.max_orders,
          b.is_active !== undefined ? Boolean(b.is_active) : ex.is_active,
          id,
          companyId
        ]
      );

      const refreshed = await pool.query(
        "SELECT * FROM dispatch_trip_types WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json(normalizeTripTypeRow(refreshed.rows[0]));
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to update trip type" });
    }
  });

  router.delete("/settings/trip-types/:id", async (req, res) => {
    try {
      const companyId = getCompanyId(req);
      const id = toNum(req.params.id, 0);
      if (!id) return res.status(400).json({ error: "Invalid trip type ID" });

      await pool.query(
        "DELETE FROM dispatch_trip_types WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      broadcastUpdate();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Failed to delete trip type" });
    }
  });

  return router;
}
