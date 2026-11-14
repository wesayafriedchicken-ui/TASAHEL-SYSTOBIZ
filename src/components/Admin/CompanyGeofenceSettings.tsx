import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Fingerprint,
  Plus,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Database,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit2,
  RefreshCw,
  Compass,
  Radio,
  Sliders,
  Code2,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Building,
  Crosshair
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface GeofenceLocation {
  id: number;
  company_id: number;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  allowed_radius_meters: number;
  is_active: boolean;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function computeClientHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function CompanyGeofenceSettings() {
  const [locations, setLocations] = useState<GeofenceLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state for adding/editing a branch
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('HQ-01');
  const [formLatitude, setFormLatitude] = useState('30.044400');
  const [formLongitude, setFormLongitude] = useState('31.235700');
  const [formRadius, setFormRadius] = useState<number>(100);
  const [formAddress, setFormAddress] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState('');

  // Interactive Simulator State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [simLat, setSimLat] = useState('30.044500');
  const [simLon, setSimLon] = useState('31.235800');
  const [selectedBranchForTest, setSelectedBranchForTest] = useState<number | 'nearest'>('nearest');
  const [simResult, setSimResult] = useState<{
    canClockIn: boolean;
    distanceMeters: number;
    allowedRadius: number;
    branchName: string;
    branchCode: string;
    messageEn: string;
    messageAr: string;
  } | null>(null);
  const [isEvaluatingSim, setIsEvaluatingSim] = useState(false);

  // Mobile Architecture Guide state
  const [isCodeGuideOpen, setIsCodeGuideOpen] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<'typescript' | 'dart' | 'sql'>('typescript');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  // Radius presets
  const radiusPresets = [
    { label: '50m (Office Suite)', value: 50 },
    { label: '100m (Standard Building)', value: 100 },
    { label: '200m (Campus & Parking)', value: 200 },
    { label: '500m (Industrial / Complex)', value: 500 },
  ];

  // Fetch geofences from backend
  const fetchGeofences = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch('/api/admin/geofences', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      console.warn('Could not fetch geofences from server:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, []);

  // Detect current GPS position for the form
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your current browser.');
      return;
    }
    setIsDetectingGps(true);
    setGpsError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormLatitude(pos.coords.latitude.toFixed(6));
        setFormLongitude(pos.coords.longitude.toFixed(6));
        setIsDetectingGps(false);
      },
      (err) => {
        setIsDetectingGps(false);
        setGpsError(`GPS Access Denied: ${err.message}. Please allow location permissions in your browser.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Open Edit Form
  const handleOpenEdit = (loc: GeofenceLocation) => {
    setEditingId(loc.id);
    setFormName(loc.name);
    setFormCode(loc.code);
    setFormLatitude(loc.latitude.toString());
    setFormLongitude(loc.longitude.toString());
    setFormRadius(loc.allowed_radius_meters);
    setFormAddress(loc.address || '');
    setFormIsActive(loc.is_active);
    setIsFormOpen(true);
    setGpsError('');
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormName('');
    setFormCode(`BR-0${locations.length + 1}`);
    setFormLatitude('30.044400');
    setFormLongitude('31.235700');
    setFormRadius(100);
    setFormAddress('');
    setFormIsActive(true);
    setIsFormOpen(true);
    setGpsError('');
  };

  // Save Branch Geofence to Database
  const handleSaveGeofence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid branch/facility name.' });
      return;
    }

    const lat = parseFloat(formLatitude);
    const lon = parseFloat(formLongitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setStatusMessage({ type: 'error', text: 'Invalid GPS coordinates. Latitude must be -90 to 90, Longitude -180 to 180.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const payload = {
        name: formName.trim(),
        code: formCode.trim() || 'BR-01',
        latitude: lat,
        longitude: lon,
        allowed_radius_meters: formRadius,
        address: formAddress.trim() || null,
        is_active: formIsActive,
      };

      const url = editingId ? `/api/admin/geofences/${editingId}` : '/api/admin/geofences';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save geofence location to database.');
      }

      await fetchGeofences();
      setIsFormOpen(false);
      setEditingId(null);
      setStatusMessage({
        type: 'success',
        text: `Geofence perimeter for "${payload.name}" successfully stored in database table (company_geofence_locations).`,
      });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving geofence.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (loc: GeofenceLocation) => {
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/admin/geofences/${loc.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: !loc.is_active }),
      });

      if (res.ok) {
        setLocations((prev) =>
          prev.map((item) => (item.id === loc.id ? { ...item, is_active: !item.is_active } : item))
        );
      }
    } catch (err) {
      console.error('Failed to toggle branch active state:', err);
    }
  };

  // Delete Branch
  const handleDeleteGeofence = async (id: number, name: string) => {
    if (locations.length <= 1) {
      alert('You must have at least one headquarters or branch location configured for biometric attendance.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the geofence perimeter for "${name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id');
      const res = await fetch(`/api/admin/geofences/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId || '1',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setLocations((prev) => prev.filter((item) => item.id !== id));
        setStatusMessage({ type: 'success', text: `Branch "${name}" perimeter removed.` });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete geofence.' });
    }
  };

  // Test Simulator
  const handleRunSimulator = async () => {
    setIsEvaluatingSim(true);
    try {
      const lat = parseFloat(simLat);
      const lon = parseFloat(simLon);

      if (isNaN(lat) || isNaN(lon)) {
        alert('Please enter valid test coordinates.');
        setIsEvaluatingSim(false);
        return;
      }

      // We can also call the server verify endpoint or compute locally
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/geofences/verify-attendance-perimeter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          branch_id: selectedBranchForTest === 'nearest' ? undefined : selectedBranchForTest,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimResult({
          canClockIn: data.can_clock_in,
          distanceMeters: data.distance_meters,
          allowedRadius: data.allowed_radius_meters,
          branchName: data.nearest_branch?.name || 'Nearest Branch',
          branchCode: data.nearest_branch?.code || 'HQ',
          messageEn: data.message_en,
          messageAr: data.message_ar,
        });
      } else {
        // Fallback to local Haversine computation
        let targetList = locations.filter((l) => l.is_active);
        if (selectedBranchForTest !== 'nearest') {
          targetList = targetList.filter((l) => l.id === selectedBranchForTest);
        }

        if (targetList.length === 0) {
          alert('No active branches to test against.');
          setIsEvaluatingSim(false);
          return;
        }

        let minDistance = Infinity;
        let matchedBranch = targetList[0];

        for (const loc of targetList) {
          const d = computeClientHaversine(lat, lon, loc.latitude, loc.longitude);
          if (d < minDistance) {
            minDistance = d;
            matchedBranch = loc;
          }
        }

        const isWithin = minDistance <= matchedBranch.allowed_radius_meters;
        setSimResult({
          canClockIn: isWithin,
          distanceMeters: minDistance,
          allowedRadius: matchedBranch.allowed_radius_meters,
          branchName: matchedBranch.name,
          branchCode: matchedBranch.code,
          messageEn: isWithin
            ? `Within perimeter (${minDistance}m from ${matchedBranch.name}). Fingerprint enabled.`
            : `You are outside the authorized attendance perimeter (${minDistance}m away, allowed: ${matchedBranch.allowed_radius_meters}m).`,
          messageAr: isWithin
            ? `داخل النطاق المسموح (${minDistance} متر عن ${matchedBranch.name}). تم تفعيل البصمة.`
            : `أنت خارج نطاق المقر المسموح للبصمة (${minDistance} متر، المسموح: ${matchedBranch.allowed_radius_meters} متر).`,
        });
      }
    } catch (e) {
      console.error('Simulator error:', e);
    } finally {
      setIsEvaluatingSim(false);
    }
  };

  // Grab device GPS for the simulator
  const handleDetectGPSForSimulator = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSimLat(pos.coords.latitude.toFixed(6));
        setSimLon(pos.coords.longitude.toFixed(6));
      },
      (err) => {
        alert(`Location permission error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const copyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  // Code snippets for developers
  const snippets = {
    typescript: `// 1. Fetch active company geofences dynamically via Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchCompanyGeofences() {
  const { data, error } = await supabase
    .from('company_geofence_locations')
    .select('id, name, code, latitude, longitude, allowed_radius_meters, is_active')
    .eq('is_active', true);

  if (error) throw error;
  return data;
}

// 2. Haversine distance formula (in meters)
export function getHaversineDistanceMeters(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// 3. AttendanceScreen Biometric Fingerprint Validation
export async function validateAttendanceClockIn(currentLocation: { latitude: number; longitude: number }) {
  const branches = await fetchCompanyGeofences();
  
  for (const branch of branches) {
    const distance = getHaversineDistanceMeters(
      currentLocation.latitude,
      currentLocation.longitude,
      Number(branch.latitude),
      Number(branch.longitude)
    );
    
    if (distance <= branch.allowed_radius_meters) {
      return {
        allowed: true,
        branch: branch.name,
        distanceMeters: distance
      };
    }
  }

  throw new Error("You are outside the authorized attendance perimeter / أنت خارج نطاق المقر المسموح للبصمة");
}`,
    dart: `// Flutter / Dart Supabase Geofence Verification
import 'dart:math' as math;
import 'package:supabase_flutter/supabase_flutter.dart';

class GeofenceService {
  final supabase = Supabase.instance.client;

  Future<List<Map<String, dynamic>>> fetchActivePerimeters() async {
    final response = await supabase
        .from('company_geofence_locations')
        .select()
        .eq('is_active', true);
    return List<Map<String, dynamic>>.from(response);
  }

  double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371000; // in meters
    final double dLat = (lat2 - lat1) * (math.pi / 180);
    final double dLon = (lon2 - lon1) * (math.pi / 180);
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * (math.pi / 180)) *
        math.cos(lat2 * (math.pi / 180)) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }
}`,
    sql: `-- Supabase Table Schema & May 2026 RLS Setup
CREATE TABLE IF NOT EXISTS public.company_geofence_locations (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) DEFAULT 'HQ-01',
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    allowed_radius_meters INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.company_geofence_locations TO postgres;
GRANT ALL ON TABLE public.company_geofence_locations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_geofence_locations TO authenticated;
ALTER TABLE public.company_geofence_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read geofence locations"
    ON public.company_geofence_locations
    FOR SELECT
    TO authenticated
    USING (true);`,
  };

  return (
    <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm space-y-6">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h4 className="text-base font-black text-slate-900">
                Branch Geofencing & Biometric Attendance Perimeter
              </h4>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <Database className="w-3 h-3" /> company_geofence_locations
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Set GPS coordinates (latitude, longitude) and allowed fingerprint radius (meters) for your physical headquarters and branches.
              The mobile app queries these dynamically via Supabase to enable biometric clock-in via the Haversine formula without hardcoded coordinates.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCodeGuideOpen(!isCodeGuideOpen)}
            className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Code2 className="w-4 h-4 text-indigo-600" />
            <span>Mobile Developer API</span>
            {isCodeGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Branch Geofence</span>
          </button>
        </div>
      </div>

      {/* STATUS NOTIFICATIONS */}
      {statusMessage && (
        <div
          className={cn(
            'p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in duration-200',
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          )}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* METRIC CARDS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Branches</div>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>{locations.filter((l) => l.is_active).length}</span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              GPS Synchronized
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Primary Coordinates</div>
          <div className="text-xs font-mono font-bold text-indigo-700 truncate pt-1">
            {locations[0] ? `${Number(locations[0].latitude).toFixed(4)}°, ${Number(locations[0].longitude).toFixed(4)}°` : '30.0444°, 31.2357°'}
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Default Allowed Radius</div>
          <div className="text-2xl font-black text-slate-900 flex items-center gap-1.5">
            <span>{locations[0]?.allowed_radius_meters || 100}</span>
            <span className="text-xs font-bold text-slate-500">Meters</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-1">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mobile Verification</div>
          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex items-center gap-1 mt-1">
            <Fingerprint className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Haversine Verified</span>
          </div>
        </div>
      </div>

      {/* ADD / EDIT FORM MODAL / INLINE DRAWER */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveGeofence}
          className="bg-indigo-50/40 border border-indigo-200 rounded-3xl p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <Compass className="w-4 h-4" />
              </div>
              <h5 className="text-sm font-black text-indigo-950">
                {editingId ? 'Edit Branch Geofence & Perimeter' : 'Configure New Branch Geofence Location'}
              </h5>
            </div>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Branch / Facility Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Main Headquarters (Systo Biz Tower)"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Branch Code / Identifier
              </label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g. HQ-01, NASR-02, ALX-03"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Coordinates & GPS Detection */}
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                  <span>GPS Coordinates (Latitude & Longitude)</span>
                </span>
                <p className="text-[11px] text-slate-500 font-medium">
                  Enter exact decimal coordinates or click below to detect automatically via device GPS.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDetectingGps ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Crosshair className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Use My Current Device GPS</span>
                  </>
                )}
              </button>
            </div>

            {gpsError && (
              <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                {gpsError}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Latitude (e.g. 30.0444)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Longitude (e.g. 31.2357)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formLongitude}
                  onChange={(e) => setFormLongitude(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Allowed Radius Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-600" />
                <span>Allowed Fingerprint Radius (Perimeter):</span>
                <span className="text-sm font-black text-emerald-700 font-mono">{formRadius} meters</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  max="2000"
                  value={formRadius}
                  onChange={(e) => setFormRadius(Math.max(20, parseInt(e.target.value) || 20))}
                  className="w-20 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center"
                />
                <span className="text-xs font-bold text-slate-500">meters</span>
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="20"
              max="1000"
              step="10"
              value={formRadius}
              onChange={(e) => setFormRadius(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />

            {/* Radius Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {radiusPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormRadius(preset.value)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all text-center cursor-pointer',
                    formRadius === preset.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Address & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Friendly Address / Landmark (Optional)
              </label>
              <input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="e.g. 5th Settlement, North 90th Street, Building 4"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Active Status</label>
              <div className="p-2 bg-white border border-slate-300 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">{formIsActive ? 'Active' : 'Disabled'}</span>
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-indigo-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving to DB...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingId ? 'Update Perimeter' : 'Save Geofence to Database'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* CONFIGURED GEOFENCE LOCATIONS LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-500" />
            <span>Configured Branch & Headquarters Geofences ({locations.length})</span>
          </h5>
          <span className="text-[11px] text-slate-500 font-medium">
            Queried dynamically by Mobile App via Supabase
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading geofence locations from database...
          </div>
        ) : locations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p>No branch geofences configured yet.</p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold"
            >
              Add First Branch Perimeter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((loc) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
              return (
                <div
                  key={loc.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all space-y-3',
                    loc.is_active
                      ? 'bg-slate-50/70 border-slate-200 hover:border-emerald-300'
                      : 'bg-slate-100/50 border-slate-200 opacity-60'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'p-2.5 rounded-xl border mt-0.5',
                          loc.is_active
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-200 border-slate-300 text-slate-500'
                        )}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h6 className="text-sm font-black text-slate-900">{loc.name}</h6>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono font-bold rounded-md">
                            {loc.code}
                          </span>
                        </div>
                        {loc.address && (
                          <p className="text-[11px] text-slate-500 font-medium truncate max-w-xs">{loc.address}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(loc)}
                        title="Edit Geofence"
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGeofence(loc.id, loc.name)}
                        title="Delete Geofence"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Coordinates & Radius Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coordinates</div>
                      <div className="font-mono text-[11px] font-bold text-slate-800 truncate">
                        {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                      </div>
                    </div>

                    <div className="bg-white p-2 rounded-xl border border-slate-200 space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perimeter Radius</div>
                      <div className="font-mono text-[11px] font-black text-emerald-700 flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-600" />
                        <span>{loc.allowed_radius_meters} meters</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer status & Google Maps link */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(loc)}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors',
                          loc.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        )}
                      >
                        <span
                          className={cn('w-1.5 h-1.5 rounded-full', loc.is_active ? 'bg-emerald-500' : 'bg-slate-400')}
                        />
                        {loc.is_active ? 'Active' : 'Disabled'}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {loc.id}</span>
                    </div>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LIVE GEOFENCE SIMULATOR (MOBILE ATTENDANCE TESTER) */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Live Geofence Simulator (Haversine Attendance Tester)
              </h5>
              <p className="text-[11px] text-slate-400 font-medium">
                Test employee check-in verification in real-time using current GPS or simulated coordinates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDetectGPSForSimulator}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>Use My GPS</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Test Latitude</label>
            <input
              type="text"
              value={simLat}
              onChange={(e) => setSimLat(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Test Longitude</label>
            <input
              type="text"
              value={simLon}
              onChange={(e) => setSimLon(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Facility</label>
            <div className="flex gap-2">
              <select
                value={selectedBranchForTest}
                onChange={(e) =>
                  setSelectedBranchForTest(e.target.value === 'nearest' ? 'nearest' : Number(e.target.value))
                }
                className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="nearest">Auto-detect Nearest Branch</option>
                {locations
                  .filter((l) => l.is_active)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </option>
                  ))}
              </select>

              <button
                type="button"
                onClick={handleRunSimulator}
                disabled={isEvaluatingSim}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1 shrink-0"
              >
                {isEvaluatingSim ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                <span>Test</span>
              </button>
            </div>
          </div>
        </div>

        {/* Simulator Results Output */}
        {simResult && (
          <div
            className={cn(
              'p-4 rounded-2xl border animate-in fade-in slide-in-from-top-1 duration-200 space-y-2',
              simResult.canClockIn
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                {simResult.canClockIn ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <div>
                  <span className="text-xs font-black">
                    {simResult.canClockIn
                      ? 'Attendance Authorized (Within Perimeter)'
                      : 'Attendance Blocked (Outside Perimeter)'}
                  </span>
                  <div className="text-[11px] text-slate-300">
                    Target Branch: <span className="font-bold text-white">{simResult.branchName}</span> (
                    {simResult.branchCode})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <div>
                  Distance: <span className="font-black text-white">{simResult.distanceMeters} m</span>
                </div>
                <div>
                  Allowed: <span className="font-black text-white">{simResult.allowedRadius} m</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className="bg-black/20 p-2.5 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Mobile English Response</span>
                <p className="font-medium text-slate-200">{simResult.messageEn}</p>
              </div>

              <div className="bg-black/20 p-2.5 rounded-xl text-right" dir="rtl">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">رسالة تطبيق الموبايل بالعربية</span>
                <p className="font-medium text-slate-200">{simResult.messageAr}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE ARCHITECTURE & SUPABASE CODE DRAWER */}
      {isCodeGuideOpen && (
        <div className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-200">
                Mobile App Architecture & Supabase Integration Code
              </h5>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setCodeLanguage('typescript')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                    codeLanguage === 'typescript' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  React Native / TS
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLanguage('dart')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                    codeLanguage === 'dart' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  Flutter / Dart
                </button>
                <button
                  type="button"
                  onClick={() => setCodeLanguage('sql')}
                  className={cn(
                    'px-2.5 py-1 rounded-lg transition-colors cursor-pointer',
                    codeLanguage === 'sql' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  )}
                >
                  PostgreSQL / Supabase Schema
                </button>
              </div>

              <button
                type="button"
                onClick={() => copyCode(snippets[codeLanguage])}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSnippet ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed max-h-96">
              {snippets[codeLanguage]}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
