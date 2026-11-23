import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  RefreshCw,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Navigation,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  DispatchOrder,
  DispatchRider,
  DispatchTeam,
  getDispatchAuthHeaders,
  escapeHtml,
  formatShortDateTime
} from './types';

export function LiveTrackingPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [riders, setRiders] = useState<DispatchRider[]>([]);
  const [orders, setOrders] = useState<DispatchOrder[]>([]);
  const [teams, setTeams] = useState<DispatchTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [riderSearch, setRiderSearch] = useState('');
  const [riderStatusFilter, setRiderStatusFilter] = useState('all');
  const [showAssignedOrders, setShowAssignedOrders] = useState(true);
  const [showUnassignedOrders, setShowUnassignedOrders] = useState(true);
  const [checkedRiderIds, setCheckedRiderIds] = useState<number[]>([]);
  const [ordersDrawerOpen, setOrdersDrawerOpen] = useState(false);
  const [selectedRiderForGps, setSelectedRiderForGps] = useState<DispatchRider | null>(null);
  const [gpsLat, setGpsLat] = useState('');
  const [gpsLng, setGpsLng] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedTeam !== 'all') params.set('team', selectedTeam);
      const res = await fetch(`/api/operations/live-dispatch/tracking?${params.toString()}`, {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to fetch live tracking data');
      const data = await res.json();
      const loadedRiders: DispatchRider[] = Array.isArray(data.riders) ? data.riders : [];
      setRiders(loadedRiders);
      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setTeams(Array.isArray(data.teams) ? data.teams : []);
      setCheckedRiderIds((prev) => (prev.length === 0 ? loadedRiders.map((r) => r.id) : prev));
    } catch (err: any) {
      showToast(err?.message || 'Error loading live tracking', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedTeam]);

  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30.0085, 31.1895], // King Faisal St, Giza
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  const filteredRiders = useMemo(() => {
    return riders.filter((r) => {
      if (riderStatusFilter === 'on_duty' && r.status !== 'On Duty') return false;
      if (riderStatusFilter === 'available' && (r.status !== 'On Duty' || (r.active_orders_count || 0) > 0)) return false;
      if (riderStatusFilter === 'off_duty' && r.status !== 'Off Duty') return false;
      if (riderSearch.trim()) {
        const q = riderSearch.toLowerCase();
        return (
          r.name.toLowerCase().includes(q) ||
          (r.mobile_number || '').toLowerCase().includes(q) ||
          (r.team_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [riders, riderStatusFilter, riderSearch]);

  const visibleOrders = useMemo(() => {
    return orders.filter((o) => {
      const isAssigned = Boolean(o.rider_id || o.rider_name);
      if (isAssigned && !showAssignedOrders) return false;
      if (!isAssigned && !showUnassignedOrders) return false;
      return true;
    });
  }, [orders, showAssignedOrders, showUnassignedOrders]);

  // Sync markers & route lines onto Leaflet map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const activeRiders = filteredRiders.filter(
      (r) => checkedRiderIds.includes(r.id) && Number.isFinite(Number(r.lat)) && Number.isFinite(Number(r.lng))
    );

    // Draw rider pins
    activeRiders.forEach((rider) => {
      const isOnline = rider.status === 'On Duty' || rider.status === 'In Zone';
      const dotColor = isOnline ? '#16a34a' : rider.status === 'Break' ? '#d97706' : '#dc2626';
      const initials = escapeHtml(rider.name.slice(0, 2).toUpperCase());
      const safeName = escapeHtml(rider.name);
      const safeTeam = escapeHtml(rider.team_name || '');
      const safeStatus = escapeHtml(rider.status || '');
      const safeMobile = escapeHtml(rider.mobile_number || '—');

      const icon = L.divIcon({
        className: 'dispatch-rider-marker',
        html: `
          <div style="display:flex;align-items:center;gap:4px;background:#ffffff;border:2px solid ${dotColor};border-radius:9999px;padding:2px 8px 2px 3px;box-shadow:0 2px 8px rgba(15,23,42,0.22);white-space:nowrap;">
            <span style="width:22px;height:22px;border-radius:9999px;background:#0f766e;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;">${initials}</span>
            <span style="font-size:11px;font-weight:700;color:#0f172a;">${safeName}</span>
          </div>
        `,
        iconSize: [120, 30],
        iconAnchor: [20, 15]
      });

      const marker = L.marker([Number(rider.lat), Number(rider.lng)], { icon }).addTo(layer);
      marker.bindPopup(`
        <div style="min-width:170px;font-family:sans-serif;font-size:12px;">
          <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${safeName}</div>
          <div style="color:#475569;">Team: ${safeTeam}</div>
          <div style="color:#475569;">Status: <strong>${safeStatus}</strong></div>
          <div style="color:#475569;">Mobile: ${safeMobile}</div>
          <div style="color:#475569;">Active Orders: <strong>${Number(rider.active_orders_count || 0)}</strong></div>
        </div>
      `);
    });

    // Draw order pins & polyline to assigned rider
    visibleOrders.forEach((order) => {
      const lat = Number(order.lat);
      const lng = Number(order.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const isDelivered = order.status === 'Delivered';
      const isFailed = order.status === 'Canceled' || order.status === 'Returned';
      const isAssigned = Boolean(order.rider_id || order.rider_name);

      const pinColor = isDelivered
        ? '#16a34a'
        : isFailed
        ? '#dc2626'
        : isAssigned
        ? '#0284c7'
        : '#64748b';

      const safeOrderNum = escapeHtml(order.order_number);
      const safeCustomer = escapeHtml(order.customer_name);
      const safeStatus = escapeHtml(order.status);
      const safeZone = escapeHtml(order.customer_zone || order.address || '—');

      const orderIcon = L.divIcon({
        className: 'dispatch-order-marker',
        html: `
          <div style="background:${pinColor};color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;border:1.5px solid #fff;box-shadow:0 2px 6px rgba(15,23,42,0.25);white-space:nowrap;">
            #${safeOrderNum}
          </div>
        `,
        iconSize: [54, 22],
        iconAnchor: [27, 11]
      });

      const marker = L.marker([lat, lng], { icon: orderIcon }).addTo(layer);
      marker.bindPopup(`
        <div style="min-width:180px;font-family:sans-serif;font-size:12px;">
          <div style="font-weight:700;color:#0f172a;">Order #${safeOrderNum}</div>
          <div style="color:#475569;margin-top:3px;">Customer: ${safeCustomer}</div>
          <div style="color:#475569;">Zone: ${safeZone}</div>
          <div style="color:#475569;">Status: <strong>${safeStatus}</strong></div>
          <div style="color:#475569;">Amount: <strong>${Number(order.amount || 0)} EGP</strong></div>
        </div>
      `);

      // Draw dashed polyline from rider to active assigned order
      if (isAssigned && !isDelivered && !isFailed && order.rider_id) {
        const rider = activeRiders.find((r) => Number(r.id) === Number(order.rider_id));
        if (rider) {
          L.polyline(
            [
              [Number(rider.lat), Number(rider.lng)],
              [lat, lng]
            ],
            { color: '#0284c7', weight: 2, dashArray: '5, 6', opacity: 0.7 }
          ).addTo(layer);
        }
      }
    });
  }, [filteredRiders, visibleOrders, checkedRiderIds]);

  const flyToPoint = (lat: number, lng: number) => {
    if (mapInstanceRef.current && Number.isFinite(lat) && Number.isFinite(lng)) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { duration: 0.7 });
    }
  };

  const handleUpdateRiderGps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiderForGps) return;
    try {
      const res = await fetch(`/api/operations/live-dispatch/riders/${selectedRiderForGps.id}/location`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ lat: Number(gpsLat), lng: Number(gpsLng) })
      });
      if (!res.ok) throw new Error('Failed to update rider GPS');
      setSelectedRiderForGps(null);
      showToast('Rider GPS coordinates saved to MySQL');
      fetchTracking();
      flyToPoint(Number(gpsLat), Number(gpsLng));
    } catch (err: any) {
      showToast(err?.message || 'GPS update failed', 'error');
    }
  };

  const toggleRiderChecked = (id: number) => {
    setCheckedRiderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-190px)] min-h-[600px] relative">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Left Live Riders Panel (matches screenshot #2) */}
      <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col bg-white z-10">
        <div className="p-3 border-b border-slate-100 space-y-2">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-800"
          >
            <option value="all">All Teams ({teams.length})</option>
            {teams.map((t) => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={riderSearch}
              onChange={(e) => setRiderSearch(e.target.value)}
              placeholder="Find a rider..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-teal-500"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <label className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filteredRiders.length > 0 && checkedRiderIds.length >= filteredRiders.length}
                onChange={(e) =>
                  setCheckedRiderIds(e.target.checked ? filteredRiders.map((r) => r.id) : [])
                }
                className="accent-blue-600"
              />
              <span>Visible Riders ({filteredRiders.length})</span>
            </label>
            <button
              type="button"
              onClick={fetchTracking}
              className="text-teal-700 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredRiders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No riders found. Add riders in the Riders section to track them live here.
            </div>
          ) : (
            filteredRiders.map((r) => {
              const isOnline = r.status === 'On Duty' || r.status === 'In Zone';
              return (
                <div
                  key={r.id}
                  className="px-3 py-2.5 hover:bg-slate-50 flex items-start gap-2.5 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checkedRiderIds.includes(r.id)}
                    onChange={() => toggleRiderChecked(r.id)}
                    className="mt-1.5 accent-blue-600 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => flyToPoint(Number(r.lat), Number(r.lng))}
                    className="flex-1 min-w-0 text-left flex items-start gap-2 cursor-pointer"
                  >
                    <div className="relative shrink-0">
                      <div className="w-8 h-8 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {r.name.slice(0, 2).toUpperCase()}
                      </div>
                      {/* Live GPS telemetry indicator */}
                      <span
                        className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute -bottom-0.5 -right-0.5 ${
                          isOnline ? 'bg-emerald-500' : r.status === 'Break' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{r.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Last GPS: {formatShortDateTime(r.last_location_at)}
                      </div>
                      <div className="text-[10px] font-semibold text-blue-700 tabular-nums mt-0.5">
                        {r.active_orders_count || 0} Active Orders · {r.status}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRiderForGps(r);
                      setGpsLat(String(r.lat || 30.0085));
                      setGpsLng(String(r.lng || 31.1895));
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 shrink-0 cursor-pointer"
                    title="Update GPS Location"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Interactive Map Viewport */}
      <div className="flex-1 relative bg-slate-100">
        {/* Top Floating Controls */}
        <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm flex items-center gap-3 text-xs font-semibold text-slate-700">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAssignedOrders}
                  onChange={(e) => setShowAssignedOrders(e.target.checked)}
                  className="accent-blue-600"
                />
                <span>Assigned Orders</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnassignedOrders}
                  onChange={(e) => setShowUnassignedOrders(e.target.checked)}
                  className="accent-slate-600"
                />
                <span>Unassigned Orders</span>
              </label>
            </div>

            <select
              value={riderStatusFilter}
              onChange={(e) => setRiderStatusFilter(e.target.value)}
              className="bg-white/95 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-semibold text-slate-700"
            >
              <option value="all">All Riders</option>
              <option value="on_duty">On Duty Riders</option>
              <option value="available">Available Riders</option>
              <option value="off_duty">Off Duty Riders</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setOrdersDrawerOpen((v) => !v)}
            className="pointer-events-auto bg-white/95 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm text-xs font-bold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <span>All Orders ({visibleOrders.length})</span>
            {ordersDrawerOpen ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Floating Map Legend (matches screenshot #2) */}
        <div className="absolute top-16 right-3 z-[400] bg-white/95 backdrop-blur border border-slate-200 rounded-xl p-3 shadow-sm text-[11px] space-y-1.5 pointer-events-auto">
          <div className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-xs bg-orange-500 inline-block" /> Group of Orders</div>
          <div className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-xs bg-purple-600 inline-block" /> Group of Riders</div>
          <div className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-xs bg-slate-500 inline-block" /> Unassigned Orders</div>
          <div className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-xs bg-sky-600 inline-block" /> Assigned Orders</div>
          <div className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Delivered Tasks Successfully</div>
          <div className="flex items-center gap-2 text-slate-700"><span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block" /> Delivered Tasks Failed</div>
        </div>

        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Collapsible Right Orders Drawer */}
        {ordersDrawerOpen && (
          <div className="absolute top-14 right-3 bottom-3 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-[450] flex flex-col overflow-hidden">
            <div className="px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Active & Recent Orders</span>
              <button
                type="button"
                onClick={() => setOrdersDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {visibleOrders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No orders to display</div>
              ) : (
                visibleOrders.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => flyToPoint(Number(o.lat), Number(o.lng))}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-700">#{o.order_number}</span>
                      <span className="text-[11px] font-semibold text-slate-600">{o.status}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 mt-0.5 truncate">{o.customer_name}</div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span>{o.customer_zone || o.address || 'No zone'}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Update Rider GPS Modal */}
      {selectedRiderForGps && (
        <div className="fixed inset-0 z-[500] bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm shadow-xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Update GPS: {selectedRiderForGps.name}</h3>
              <button type="button" onClick={() => setSelectedRiderForGps(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateRiderGps} className="p-5 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={gpsLat}
                  onChange={(e) => setGpsLat(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={gpsLng}
                  onChange={(e) => setGpsLng(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl tabular-nums"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedRiderForGps(null)} className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-semibold bg-teal-600 text-white rounded-xl hover:bg-teal-700 cursor-pointer">
                  Save GPS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
