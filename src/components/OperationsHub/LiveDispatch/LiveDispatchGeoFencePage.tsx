import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Search,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  Maximize2,
  Minimize2,
  MapPin,
  Route as RouteIcon,
  Check,
  X,
  Undo2,
  Eraser,
  Square,
  Crosshair,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';
import {
  DispatchStore,
  DispatchCustomerZone,
  getDispatchAuthHeaders,
  escapeHtml
} from './types';

const GEOFENCE_COLORS = [
  '#0d9488', // Teal
  '#2563eb', // Blue
  '#16a34a', // Green
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Violet
  '#0891b2', // Cyan
  '#c026d3', // Fuchsia
  '#4f46e5', // Indigo
  '#65a30d'  // Lime
];

const VEHICLE_TYPES = ['Motorcycle', 'Scooter', 'Car', 'Van', 'Bicycle'];

function pickZoneColor(zone: DispatchCustomerZone, index: number): string {
  if (zone.geofence_color && /^#[0-9a-fA-F]{3,8}$/.test(zone.geofence_color)) {
    return zone.geofence_color;
  }
  return GEOFENCE_COLORS[index % GEOFENCE_COLORS.length];
}

function computePolygonCentroid(points: [number, number][]): [number, number] | null {
  if (!points || points.length === 0) return null;
  let latSum = 0;
  let lngSum = 0;
  for (const [lat, lng] of points) {
    latSum += lat;
    lngSum += lng;
  }
  return [
    Number((latSum / points.length).toFixed(6)),
    Number((lngSum / points.length).toFixed(6))
  ];
}

function parseGoogleMapsCoords(raw: string): { lat: number; lng: number } | null {
  const input = raw.trim();
  if (!input) return null;

  // Match @lat,lng (standard Google Maps URL)
  const atMatch = input.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Match !3dlat!4dlng (Google Maps place data parameter)
  const bangMatch = input.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (bangMatch) {
    const lat = Number(bangMatch[1]);
    const lng = Number(bangMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Match q=lat,lng or ll=lat,lng or destination=lat,lng or /search/lat,lng
  const queryMatch = input.match(/(?:[?&](?:q|ll|query|destination|center)=|\/search\/)(-?\d+(?:\.\d+)?)[,\s+]+(-?\d+(?:\.\d+)?)/i);
  if (queryMatch) {
    const lat = Number(queryMatch[1]);
    const lng = Number(queryMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  // Match plain "lat, lng" or "lat lng"
  const plainMatch = input.match(/(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)/);
  if (plainMatch) {
    const lat = Number(plainMatch[1]);
    const lng = Number(plainMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

export function LiveDispatchGeoFencePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStoreIdParam = Number(searchParams.get('storeId') || 0) || null;

  const [stores, setStores] = useState<DispatchStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(initialStoreIdParam);
  const [zones, setZones] = useState<DispatchCustomerZone[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingZones, setLoadingZones] = useState(false);
  const [saving, setSaving] = useState(false);

  const [zoneSearch, setZoneSearch] = useState('');
  const [placeSearch, setPlaceSearch] = useState('');
  const [gmapsInput, setGmapsInput] = useState('');
  const [detectedPin, setDetectedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Visibility per zone ID (defaults to visible)
  const [hiddenZoneIds, setHiddenZoneIds] = useState<Record<number, boolean>>({});
  const [focusedZoneId, setFocusedZoneId] = useState<number | null>(null);

  // Interactive Polygon Draw/Edit mode
  const [drawingZoneId, setDrawingZoneId] = useState<number | null>(null);
  const [draftPoints, setDraftPoints] = useState<[number, number][]>([]);
  const [draftColor, setDraftColor] = useState<string>(GEOFENCE_COLORS[0]);

  // Zone Create/Edit Modal
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZoneDetails, setEditingZoneDetails] = useState<DispatchCustomerZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    city: 'Cairo',
    geofence_radius_m: 1000,
    geofence_color: GEOFENCE_COLORS[0],
    lat: '30.0131',
    lng: '31.2089',
    default_vehicle_type: 'Motorcycle',
    extra_fees: 0
  });

  // Delete / Clear Geofence confirmation modal
  const [confirmTarget, setConfirmTarget] = useState<DispatchCustomerZone | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Leaflet Refs
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);
  const drawingLayerRef = useRef<L.LayerGroup | null>(null);
  const detectedLayerRef = useRef<L.LayerGroup | null>(null);
  const drawingZoneIdRef = useRef<number | null>(null);

  useEffect(() => {
    drawingZoneIdRef.current = drawingZoneId;
  }, [drawingZoneId]);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3400);
  }, []);

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) || stores[0] || null,
    [stores, selectedStoreId]
  );

  const drawingZone = useMemo(
    () => zones.find((z) => z.id === drawingZoneId) || null,
    [zones, drawingZoneId]
  );

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const res = await fetch('/api/operations/live-dispatch/stores', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load stores');
      const data: DispatchStore[] = await res.json();
      setStores(Array.isArray(data) ? data : []);
      setSelectedStoreId((prev) => {
        if (prev && data.some((s) => s.id === prev)) return prev;
        return data[0]?.id ?? null;
      });
    } catch (err: any) {
      showToast('error', err.message || 'Could not load dispatch stores');
    } finally {
      setLoadingStores(false);
    }
  }, [showToast]);

  const fetchZones = useCallback(
    async (storeId: number) => {
      setLoadingZones(true);
      try {
        const res = await fetch(`/api/operations/live-dispatch/stores/${storeId}/zones`, {
          headers: getDispatchAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to load customer zones');
        const data: DispatchCustomerZone[] = await res.json();
        setZones(Array.isArray(data) ? data : []);
      } catch (err: any) {
        showToast('error', err.message || 'Could not load customer zones');
      } finally {
        setLoadingZones(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore?.id) {
      setDrawingZoneId(null);
      setDraftPoints([]);
      setDetectedPin(null);
      setHiddenZoneIds({});
      fetchZones(selectedStore.id);
    }
  }, [selectedStore?.id, fetchZones]);

  const handleStoreChange = (nextStoreId: number) => {
    setSelectedStoreId(nextStoreId);
    const next = new URLSearchParams(searchParams);
    next.set('storeId', String(nextStoreId));
    setSearchParams(next, { replace: true });
  };

  // Initialize Leaflet Map safely
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapRef.current && mapRef.current.getContainer() !== container) {
      try {
        mapRef.current.remove();
      } catch {
        // ignore stale map cleanup
      }
      mapRef.current = null;
      layersRef.current = null;
      drawingLayerRef.current = null;
      detectedLayerRef.current = null;
    }

    if (!mapRef.current) {
      const centerLat = Number(selectedStore?.lat) || 30.0131;
      const centerLng = Number(selectedStore?.lng) || 31.2089;
      const map = L.map(container, {
        center: [centerLat, centerLng],
        zoom: 12,
        zoomControl: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      layersRef.current = L.layerGroup().addTo(map);
      drawingLayerRef.current = L.layerGroup().addTo(map);
      detectedLayerRef.current = L.layerGroup().addTo(map);

      map.on('click', (ev: L.LeafletMouseEvent) => {
        if (drawingZoneIdRef.current !== null) {
          const lat = Number(ev.latlng.lat.toFixed(6));
          const lng = Number(ev.latlng.lng.toFixed(6));
          setDraftPoints((prev) => [...prev, [lat, lng]]);
        }
      });

      mapRef.current = map;
    }

    const activeMap = mapRef.current;
    const resizeTimer = window.setTimeout(() => {
      if (
        mapRef.current === activeMap &&
        (activeMap as any)._mapPane &&
        activeMap.getContainer()?.isConnected
      ) {
        try {
          activeMap.invalidateSize();
        } catch {
          // ignore if unmounting
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(resizeTimer);
    };
  }, [selectedStore?.id]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          // ignore cleanup error
        }
        mapRef.current = null;
        layersRef.current = null;
        drawingLayerRef.current = null;
        detectedLayerRef.current = null;
      }
    };
  }, []);

  // Re-invalidate map size cleanly on fullscreen toggle
  useEffect(() => {
    const activeMap = mapRef.current;
    if (!activeMap) return;
    const timer = window.setTimeout(() => {
      if (
        mapRef.current === activeMap &&
        (activeMap as any)._mapPane &&
        activeMap.getContainer()?.isConnected
      ) {
        try {
          activeMap.invalidateSize();
        } catch {
          // ignore
        }
      }
    }, 140);
    return () => window.clearTimeout(timer);
  }, [isFullscreen]);

  // Center map when selected store changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedStore) return;
    const lat = Number(selectedStore.lat) || 30.0131;
    const lng = Number(selectedStore.lng) || 31.2089;
    if ((map as any)._mapPane && map.getContainer()?.isConnected) {
      map.setView([lat, lng], 12, { animate: true });
    }
  }, [selectedStore?.id, selectedStore?.lat, selectedStore?.lng]);

  // Render Store Pin & All Visible Zone Polygons
  useEffect(() => {
    const group = layersRef.current;
    const map = mapRef.current;
    if (!group || !map || !selectedStore) return;
    group.clearLayers();

    // Store marker (dark circular badge matching reference screenshot)
    const storeLat = Number(selectedStore.lat) || 30.0131;
    const storeLng = Number(selectedStore.lng) || 31.2089;
    const storeIcon = L.divIcon({
      className: 'dispatch-geofence-store-pin',
      html: `<div style="width:36px;height:36px;border-radius:9999px;background:#0f172a;border:3px solid #ffffff;box-shadow:0 4px 12px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:700;font-size:14px;">S</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });
    L.marker([storeLat, storeLng], { icon: storeIcon, zIndexOffset: 500 })
      .bindPopup(
        `<div style="font-size:12px;line-height:1.4;"><strong>${escapeHtml(selectedStore.name)}</strong><br/><span style="color:#64748b;">${escapeHtml(selectedStore.address || selectedStore.city || 'Dispatch Store')}</span></div>`
      )
      .addTo(group);

    zones.forEach((zone, idx) => {
      if (hiddenZoneIds[zone.id]) return;
      if (drawingZoneId === zone.id) return; // Rendered in active drawing layer

      const color = pickZoneColor(zone, idx);
      const isFocused = focusedZoneId === zone.id;
      const poly = Array.isArray(zone.geofence_polygon) ? zone.geofence_polygon : [];

      if (poly.length >= 3) {
        const polygonLayer = L.polygon(poly, {
          color,
          fillColor: color,
          fillOpacity: isFocused ? 0.34 : 0.2,
          weight: isFocused ? 3 : 2
        });
        polygonLayer.bindPopup(
          `<div style="font-size:12px;line-height:1.45;">
            <strong style="color:#0f172a;">${escapeHtml(zone.name)}</strong><br/>
            <span style="color:#64748b;">${escapeHtml(zone.city || '')} · ${poly.length} vertices</span><br/>
            <span style="color:#0d9488;font-weight:600;">Extra Fee: ${Number(zone.extra_fees || 0).toFixed(2)}</span>
          </div>`
        );
        polygonLayer.on('click', () => {
          if (drawingZoneIdRef.current === null) {
            setFocusedZoneId(zone.id);
          }
        });
        polygonLayer.addTo(group);

        const centroid = computePolygonCentroid(poly);
        if (centroid) {
          const shortName = zone.name.length > 7 ? `${zone.name.slice(0, 6)}…` : zone.name;
          const labelIcon = L.divIcon({
            className: 'dispatch-zone-centroid-label',
            html: `<div style="width:36px;height:36px;border-radius:9999px;background:${escapeHtml(color)};color:#ffffff;border:2px solid #ffffff;box-shadow:0 2px 8px rgba(15,23,42,0.28);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;text-align:center;line-height:1.05;padding:2px;overflow:hidden;">${escapeHtml(shortName)}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });
          L.marker(centroid, { icon: labelIcon, interactive: true })
            .bindTooltip(escapeHtml(zone.name), { direction: 'top', offset: [0, -16] })
            .on('click', () => {
              if (drawingZoneIdRef.current === null) {
                setFocusedZoneId(zone.id);
              }
            })
            .addTo(group);
        }
      } else if (zone.has_geofence && Number(zone.lat) && Number(zone.lng)) {
        const radius = Number(zone.geofence_radius_m) > 50 ? Number(zone.geofence_radius_m) : 800;
        const circle = L.circle([Number(zone.lat), Number(zone.lng)], {
          radius,
          color,
          fillColor: color,
          fillOpacity: isFocused ? 0.24 : 0.12,
          weight: isFocused ? 2.5 : 1.5,
          dashArray: '5 5'
        });
        circle.bindTooltip(`${escapeHtml(zone.name)} (Radius ${radius}m)`, { direction: 'top' });
        circle.addTo(group);
      }
    });
  }, [zones, hiddenZoneIds, drawingZoneId, focusedZoneId, selectedStore]);

  // Render Active Polygon Drawing Layer (with draggable vertices)
  useEffect(() => {
    const group = drawingLayerRef.current;
    if (!group) return;
    group.clearLayers();

    if (drawingZoneId === null || draftPoints.length === 0) return;

    if (draftPoints.length >= 3) {
      L.polygon(draftPoints, {
        color: draftColor,
        fillColor: draftColor,
        fillOpacity: 0.28,
        weight: 3,
        dashArray: '6 4'
      }).addTo(group);
    } else if (draftPoints.length === 2) {
      L.polyline(draftPoints, {
        color: draftColor,
        weight: 3,
        dashArray: '6 4'
      }).addTo(group);
    }

    draftPoints.forEach((pt, idx) => {
      const handleIcon = L.divIcon({
        className: 'dispatch-vertex-handle',
        html: `<div style="width:16px;height:16px;border-radius:9999px;background:#ffffff;border:3px solid ${escapeHtml(draftColor)};box-shadow:0 1px 6px rgba(15,23,42,0.35);cursor:grab;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#0f172a;">${idx + 1}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      const marker = L.marker(pt, { icon: handleIcon, draggable: true, zIndexOffset: 900 });
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setDraftPoints((prev) =>
          prev.map((p, i) =>
            i === idx ? [Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6))] : p
          )
        );
      });
      marker.bindTooltip(`Vertex #${idx + 1} (drag to reshape)`, { direction: 'top', offset: [0, -8] });
      marker.addTo(group);
    });
  }, [drawingZoneId, draftPoints, draftColor]);

  // Render Detected Google Maps Pin
  useEffect(() => {
    const group = detectedLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!detectedPin) return;

    const pinIcon = L.divIcon({
      className: 'dispatch-detected-pin',
      html: `<div style="width:28px;height:28px;border-radius:9999px;background:#0d9488;border:3px solid #ffffff;box-shadow:0 4px 14px rgba(13,148,136,0.45);display:flex;align-items:center;justify-content:center;color:#ffffff;font-size:12px;font-weight:700;">+</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    L.marker([detectedPin.lat, detectedPin.lng], { icon: pinIcon, zIndexOffset: 950 })
      .bindPopup(
        `<div style="font-size:11px;"><strong>Detected Location</strong><br/>${escapeHtml(detectedPin.lat.toFixed(6))}, ${escapeHtml(detectedPin.lng.toFixed(6))}</div>`
      )
      .addTo(group);
  }, [detectedPin]);

  const filteredZones = useMemo(() => {
    const q = zoneSearch.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        (z.city || '').toLowerCase().includes(q)
    );
  }, [zones, zoneSearch]);

  const placeSearchMatches = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    if (!q) return [];
    return zones
      .filter(
        (z) =>
          z.name.toLowerCase().includes(q) ||
          (z.city || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [zones, placeSearch]);

  const flyToZone = useCallback((zone: DispatchCustomerZone) => {
    setFocusedZoneId(zone.id);
    const map = mapRef.current;
    if (!map || !(map as any)._mapPane || !map.getContainer()?.isConnected) return;

    const poly = Array.isArray(zone.geofence_polygon) ? zone.geofence_polygon : [];
    if (poly.length >= 3) {
      const bounds = L.latLngBounds(poly);
      map.fitBounds(bounds.pad(0.25), { maxZoom: 15, animate: true });
    } else if (Number(zone.lat) && Number(zone.lng)) {
      map.setView([Number(zone.lat), Number(zone.lng)], 14, { animate: true });
    }
  }, []);

  const startDrawingZone = (zone: DispatchCustomerZone, index: number) => {
    setDrawingZoneId(zone.id);
    setFocusedZoneId(zone.id);
    setHiddenZoneIds((prev) => ({ ...prev, [zone.id]: false }));
    const existing = Array.isArray(zone.geofence_polygon) ? zone.geofence_polygon : [];
    setDraftPoints(existing.map((p) => [p[0], p[1]]));
    setDraftColor(pickZoneColor(zone, index));
    flyToZone(zone);
  };

  const handleGenerateStarterPolygon = () => {
    const map = mapRef.current;
    const center = map
      ? map.getCenter()
      : L.latLng(Number(selectedStore?.lat) || 30.0131, Number(selectedStore?.lng) || 31.2089);
    const dLat = 0.008;
    const dLng = 0.01;
    setDraftPoints([
      [Number((center.lat + dLat).toFixed(6)), Number((center.lng - dLng).toFixed(6))],
      [Number((center.lat + dLat).toFixed(6)), Number((center.lng + dLng).toFixed(6))],
      [Number((center.lat - dLat).toFixed(6)), Number((center.lng + dLng).toFixed(6))],
      [Number((center.lat - dLat).toFixed(6)), Number((center.lng - dLng).toFixed(6))]
    ]);
  };

  const handleSavePolygon = async () => {
    if (!drawingZone) return;
    if (draftPoints.length < 3) {
      showToast('error', 'Click at least 3 points on the map to form a GeoFence polygon');
      return;
    }

    setSaving(true);
    try {
      const centroid = computePolygonCentroid(draftPoints);
      const res = await fetch(`/api/operations/live-dispatch/zones/${drawingZone.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          has_geofence: true,
          geofence_polygon: draftPoints,
          geofence_color: draftColor,
          lat: centroid ? centroid[0] : drawingZone.lat,
          lng: centroid ? centroid[1] : drawingZone.lng
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save geofence polygon');
      }
      const updated: DispatchCustomerZone = await res.json();
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      setDrawingZoneId(null);
      setDraftPoints([]);
      showToast('success', `GeoFence saved for ${updated.name}`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not save geofence polygon');
    } finally {
      setSaving(false);
    }
  };

  const handleClearGeofenceOnly = async (zone: DispatchCustomerZone) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/zones/${zone.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          has_geofence: false,
          geofence_polygon: []
        })
      });
      if (!res.ok) throw new Error('Failed to clear geofence');
      const updated: DispatchCustomerZone = await res.json();
      setZones((prev) => prev.map((z) => (z.id === updated.id ? updated : z)));
      if (drawingZoneId === zone.id) {
        setDrawingZoneId(null);
        setDraftPoints([]);
      }
      setConfirmTarget(null);
      showToast('success', `GeoFence cleared for ${zone.name}`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to clear geofence');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZonePermanently = async (zone: DispatchCustomerZone) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/zones/${zone.id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to delete customer zone');
      setZones((prev) => prev.filter((z) => z.id !== zone.id));
      if (drawingZoneId === zone.id) {
        setDrawingZoneId(null);
        setDraftPoints([]);
      }
      setConfirmTarget(null);
      showToast('success', `Deleted customer zone "${zone.name}"`);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete customer zone');
    } finally {
      setSaving(false);
    }
  };

  const handleDetectGoogleMaps = () => {
    const parsed = parseGoogleMapsCoords(gmapsInput);
    if (!parsed) {
      showToast('error', 'Paste a valid Google Maps link or coordinates (e.g. 30.0131, 31.2089)');
      return;
    }
    setDetectedPin(parsed);
    const map = mapRef.current;
    if (map && (map as any)._mapPane && map.getContainer()?.isConnected) {
      map.setView([parsed.lat, parsed.lng], 15, { animate: true });
    }
    showToast('success', `Detected coordinates: ${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`);
  };

  const openCreateZoneModal = (prefillCoords?: { lat: number; lng: number } | null) => {
    setEditingZoneDetails(null);
    const lat = prefillCoords?.lat ?? Number(selectedStore?.lat) ?? 30.0131;
    const lng = prefillCoords?.lng ?? Number(selectedStore?.lng) ?? 31.2089;
    setZoneForm({
      name: '',
      city: selectedStore?.city || 'Cairo',
      geofence_radius_m: 1000,
      geofence_color: GEOFENCE_COLORS[zones.length % GEOFENCE_COLORS.length],
      lat: String(lat),
      lng: String(lng),
      default_vehicle_type: 'Motorcycle',
      extra_fees: 0
    });
    setZoneModalOpen(true);
  };

  const openEditZoneModal = (zone: DispatchCustomerZone, idx: number) => {
    setEditingZoneDetails(zone);
    setZoneForm({
      name: zone.name,
      city: zone.city || selectedStore?.city || 'Cairo',
      geofence_radius_m: Number(zone.geofence_radius_m) || 1000,
      geofence_color: pickZoneColor(zone, idx),
      lat: String(zone.lat ?? selectedStore?.lat ?? 30.0131),
      lng: String(zone.lng ?? selectedStore?.lng ?? 31.2089),
      default_vehicle_type: zone.default_vehicle_type || 'Motorcycle',
      extra_fees: Number(zone.extra_fees || 0)
    });
    setZoneModalOpen(true);
  };

  const handleSaveZoneModal = async (e: React.FormEvent, startDrawAfter = false) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (!zoneForm.name.trim()) {
      showToast('error', 'Zone name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: zoneForm.name.trim(),
        city: zoneForm.city.trim() || selectedStore.city || 'Cairo',
        geofence_radius_m: Number(zoneForm.geofence_radius_m) || 1000,
        geofence_color: zoneForm.geofence_color,
        lat: Number(zoneForm.lat) || selectedStore.lat || 30.0131,
        lng: Number(zoneForm.lng) || selectedStore.lng || 31.2089,
        default_vehicle_type: zoneForm.default_vehicle_type || 'Motorcycle',
        extra_fees: Number(zoneForm.extra_fees) || 0,
        has_geofence: editingZoneDetails ? editingZoneDetails.has_geofence : false
      };

      const url = editingZoneDetails
        ? `/api/operations/live-dispatch/zones/${editingZoneDetails.id}`
        : `/api/operations/live-dispatch/stores/${selectedStore.id}/zones`;
      const method = editingZoneDetails ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save customer zone');
      }
      const saved: DispatchCustomerZone = await res.json();
      setZones((prev) =>
        editingZoneDetails ? prev.map((z) => (z.id === saved.id ? saved : z)) : [saved, ...prev]
      );
      setZoneModalOpen(false);
      showToast('success', editingZoneDetails ? `Updated "${saved.name}"` : `Created "${saved.name}"`);

      if (startDrawAfter) {
        startDrawingZone(saved, 0);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Could not save customer zone');
    } finally {
      setSaving(false);
    }
  };

  const allVisible = useMemo(
    () => zones.every((z) => !hiddenZoneIds[z.id]),
    [zones, hiddenZoneIds]
  );

  const toggleAllVisibility = () => {
    if (allVisible) {
      const next: Record<number, boolean> = {};
      zones.forEach((z) => {
        next[z.id] = true;
      });
      setHiddenZoneIds(next);
    } else {
      setHiddenZoneIds({});
    }
  };

  const geofencedCount = useMemo(
    () =>
      zones.filter(
        (z) => z.has_geofence || (Array.isArray(z.geofence_polygon) && z.geofence_polygon.length >= 3)
      ).length,
    [zones]
  );

  return (
    <div className="space-y-4">
      {/* Subtle floating toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[140] flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-emerald-800'
              : 'bg-white border-rose-200 text-rose-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <div
        className={`flex flex-col lg:flex-row gap-4 items-stretch ${
          isFullscreen ? 'fixed inset-3 z-[110] bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xl' : ''
        }`}
      >
        {/* Left Sidebar: Store Selector + Search + Customer Zones GeoFence List */}
        <aside className="w-full lg:w-72 shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-100 space-y-2.5">
            <select
              value={selectedStore?.id ?? ''}
              onChange={(e) => handleStoreChange(Number(e.target.value))}
              disabled={loadingStores || stores.length === 0}
              aria-label="Select Store"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
            >
              {stores.length === 0 ? (
                <option value="">No stores available</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={zoneSearch}
                onChange={(e) => setZoneSearch(e.target.value)}
                placeholder="Search Customer zone name ..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span className="tabular-nums font-medium">
                <strong className="text-slate-800">{geofencedCount}</strong>/{zones.length} geofenced
              </span>
              <button
                type="button"
                onClick={toggleAllVisibility}
                className="inline-flex items-center gap-1 text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
              >
                {allVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{allVisible ? 'Hide All' : 'Show All'}</span>
              </button>
            </div>
          </div>

          {/* Scrollable Zones List */}
          <div className="flex-1 overflow-y-auto max-h-[560px] divide-y divide-slate-100">
            {loadingZones ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-teal-600" />
                Loading customer zones...
              </div>
            ) : filteredZones.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <MapPin className="w-6 h-6 text-slate-300 mx-auto" />
                <div className="text-xs font-semibold text-slate-600">No customer zones found</div>
                <p className="text-[11px] text-slate-400">
                  Add a new zone to start drawing its delivery geofence polygon.
                </p>
              </div>
            ) : (
              filteredZones.map((zone, idx) => {
                const polyLen = Array.isArray(zone.geofence_polygon)
                  ? zone.geofence_polygon.length
                  : 0;
                const hasFence = polyLen >= 3 || zone.has_geofence;
                const color = hasFence ? pickZoneColor(zone, idx) : '#94a3b8';
                const isHidden = !!hiddenZoneIds[zone.id];
                const isDrawing = drawingZoneId === zone.id;
                const isFocused = focusedZoneId === zone.id;

                return (
                  <div
                    key={zone.id}
                    className={`px-3.5 py-2.5 flex items-center justify-between gap-2 transition-colors ${
                      isDrawing
                        ? 'bg-teal-50/90 border-l-2 border-l-teal-600'
                        : isFocused
                        ? 'bg-slate-50'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => flyToZone(zone)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                        style={{ backgroundColor: color }}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-slate-800 truncate">
                          {zone.name}
                        </span>
                        {polyLen >= 3 ? (
                          <span className="block text-[10px] text-slate-400 tabular-nums">
                            {polyLen} polygon points
                          </span>
                        ) : zone.has_geofence ? (
                          <span className="block text-[10px] text-slate-400 tabular-nums">
                            Radius {zone.geofence_radius_m || 800}m
                          </span>
                        ) : (
                          <span className="block text-[10px] text-slate-400">No geofence</span>
                        )}
                      </span>
                    </button>

                    {/* 4 inline action icons matching reference */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {hasFence && (
                        <button
                          type="button"
                          onClick={() =>
                            setHiddenZoneIds((prev) => ({ ...prev, [zone.id]: !prev[zone.id] }))
                          }
                          title={isHidden ? 'Show GeoFence on map' : 'Hide GeoFence on map'}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isHidden
                              ? 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                              : 'text-sky-600 hover:bg-sky-50'
                          }`}
                        >
                          {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startDrawingZone(zone, idx)}
                        title={polyLen >= 3 ? 'Edit GeoFence Polygon' : 'Draw GeoFence Polygon'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isDrawing
                            ? 'bg-teal-600 text-white'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {hasFence && (
                        <button
                          type="button"
                          onClick={() => setConfirmTarget(zone)}
                          title="Clear GeoFence or Delete Zone"
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditZoneModal(zone, idx)}
                        title="Edit Customer Zone Details"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50/70">
            <button
              type="button"
              onClick={() => openCreateZoneModal(null)}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Customer Zone</span>
            </button>
          </div>
        </aside>

        {/* Right Main Panel: Customer Zones Header + Search/Google Maps Detect + Map */}
        <section className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          {/* Top Header */}
          <div className="px-5 py-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/operations-hub/LiveDispatchSystem/Store${
                      selectedStore?.id ? `?storeId=${selectedStore.id}&tab=zones` : ''
                    }`
                  )
                }
                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Back to Store"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900 truncate">Customer Zones</h1>
                <p className="text-[11px] text-slate-500 truncate">
                  Deliveryzones GeoFence · Draw and manage delivery zone polygons for {selectedStore?.name || 'store'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/operations-hub/LiveDispatchSystem/Store/Smart Routes/Routes${
                      selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                    }`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <RouteIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Smart Routes</span>
              </button>
            </div>
          </div>

          {/* Place Search + Google Maps Link Detector */}
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 grid grid-cols-1 xl:grid-cols-12 gap-3 items-center">
            {/* Search for a place */}
            <div className="xl:col-span-6 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={placeSearch}
                onChange={(e) => setPlaceSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && placeSearchMatches.length > 0) {
                    flyToZone(placeSearchMatches[0]);
                    setPlaceSearch('');
                  }
                }}
                placeholder="Search for a place or customer zone..."
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
              />
              {placeSearchMatches.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[60] overflow-hidden divide-y divide-slate-100">
                  {placeSearchMatches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        flyToZone(m);
                        setPlaceSearch('');
                      }}
                      className="w-full px-3 py-2 text-left text-xs hover:bg-teal-50 flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-800 truncate">{m.name}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">{m.city}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Copy and paste from Google Maps + Detect */}
            <div className="xl:col-span-6 flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Crosshair className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={gmapsInput}
                  onChange={(e) => setGmapsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDetectGoogleMaps();
                  }}
                  placeholder="Copy and paste from Google Maps"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>
              <button
                type="button"
                onClick={handleDetectGoogleMaps}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Detect
              </button>
            </div>
          </div>

          {/* Detected Coordinates Quick Bar */}
          {detectedPin && (
            <div className="px-5 py-2 bg-teal-50/70 border-b border-teal-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-teal-900">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="font-semibold">Detected Pin:</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {detectedPin.lat.toFixed(6)}, {detectedPin.lng.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {drawingZoneId !== null ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDraftPoints((prev) => [...prev, [detectedPin.lat, detectedPin.lng]])
                    }
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    + Add Vertex Here
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCreateZoneModal(detectedPin)}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    + Create Zone Here
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetectedPin(null)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white cursor-pointer"
                  title="Dismiss pin"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Active Polygon Draw / Edit Toolbar */}
          {drawingZone && (
            <div className="px-5 py-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/40"
                  style={{ backgroundColor: draftColor }}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    Drawing GeoFence: {drawingZone.name}
                  </div>
                  <div className="text-[11px] text-slate-300 tabular-nums">
                    Click map to place vertices · Drag numbered pins to reshape · {draftPoints.length} point{draftPoints.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Color Swatches */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg">
                  {GEOFENCE_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setDraftColor(hex)}
                      className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                        draftColor === hex ? 'ring-2 ring-white scale-110' : 'opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                      title={`Select color ${hex}`}
                    />
                  ))}
                </div>

                {draftPoints.length === 0 && (
                  <button
                    type="button"
                    onClick={handleGenerateStarterPolygon}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Auto Box</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDraftPoints((prev) => prev.slice(0, -1))}
                  disabled={draftPoints.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDraftPoints([])}
                  disabled={draftPoints.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold cursor-pointer"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDrawingZoneId(null);
                    setDraftPoints([]);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                <button
                  type="button"
                  onClick={handleSavePolygon}
                  disabled={saving || draftPoints.length < 3}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving...' : 'Save GeoFence'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Leaflet Map Canvas */}
          <div className="relative flex-1 min-h-[540px]">
            <div ref={mapContainerRef} className="w-full h-full min-h-[540px] z-10" />

            {/* Fullscreen Toggle Button (top right matching reference) */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
              className="absolute top-3 right-3 z-[40] w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </section>
      </div>

      {/* Create / Edit Customer Zone Details Modal */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingZoneDetails ? 'Edit Customer Zone' : 'New Customer Zone'}
              </h3>
              <button
                type="button"
                onClick={() => setZoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveZoneModal(e, false)} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Zone Name *
                </label>
                <input
                  type="text"
                  required
                  value={zoneForm.name}
                  onChange={(e) => setZoneForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Mohandessin, Maadi, Faisal..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm((p) => ({ ...p, city: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Vehicle
                  </label>
                  <select
                    value={zoneForm.default_vehicle_type}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, default_vehicle_type: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Extra Delivery Fees
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={zoneForm.extra_fees}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, extra_fees: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fallback Radius (m)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={zoneForm.geofence_radius_m}
                    onChange={(e) =>
                      setZoneForm((p) => ({ ...p, geofence_radius_m: Number(e.target.value) }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  GeoFence Color
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {GEOFENCE_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setZoneForm((p) => ({ ...p, geofence_color: hex }))}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                        zoneForm.geofence_color === hex
                          ? 'ring-2 ring-offset-2 ring-slate-900 scale-110'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="text"
                    value={zoneForm.lat}
                    onChange={(e) => setZoneForm((p) => ({ ...p, lat: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={zoneForm.lng}
                    onChange={(e) => setZoneForm((p) => ({ ...p, lng: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                {!editingZoneDetails && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={(e) => handleSaveZoneModal(e as any, true)}
                    className="px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold cursor-pointer"
                  >
                    Save & Draw GeoFence
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear GeoFence / Delete Zone Confirmation Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Remove GeoFence</h3>
              <button
                type="button"
                onClick={() => setConfirmTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose whether to clear only the GeoFence boundary for{' '}
                <strong className="text-slate-900">{confirmTarget.name}</strong> (keeping the zone
                record) or permanently delete the customer zone.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleClearGeofenceOnly(confirmTarget)}
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold cursor-pointer"
                >
                  Clear GeoFence Polygon Only
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeleteZonePermanently(confirmTarget)}
                  className="w-full px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  Delete Customer Zone Permanently
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmTarget(null)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
