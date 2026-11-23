import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Store,
  MapPin,
  Route as RouteIcon,
  SlidersHorizontal,
  Settings,
  ArrowUpRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Copy,
  Crosshair,
  Search,
  RotateCcw,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MinusCircle,
  Radio,
  ShieldAlert,
  Navigation,
  Clock,
  Truck,
  Radar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';
import {
  DispatchStore,
  DispatchStoreConfig,
  DispatchCustomerZone,
  DispatchSmartRoute,
  DispatchSmartRouteZoneRef,
  getDispatchAuthHeaders,
  escapeHtml
} from './types';

type StoreTabId = 'info' | 'zones' | 'routes' | 'config';
type ConfigSectionKey =
  | 'dispatchingQueue'
  | 'dispatchingSettings'
  | 'riderOrderJourney'
  | 'ordersAbuse'
  | 'gpsLocations'
  | 'sla';

const VEHICLE_TYPES = ['Motorcycle', 'Scooter', 'Car', 'Van', 'Bicycle'];
const QUEUE_PARAMETERS = ['Rider Queue only', 'Hybrid Queue', 'Auto Dispatch'];
const ORDER_START_STATUSES = ['In Progress', 'Ready', 'On Trip'];
const OUT_OF_ZONE_ACTIONS = [
  'Disable the deliver button',
  'Show warning and allow',
  'Require supervisor approval',
  'Allow without restriction'
];
const FAILED_DELIVER_ACTIONS = [
  'Enable to deliver again',
  'Return to store immediately',
  'Hold for operations review'
];

const FALLBACK_CONFIG: DispatchStoreConfig = {
  dispatchingQueue: {
    queueParameter: 'Rider Queue only',
    closeToPickupEnabled: false,
    closeToPickupMeters: 100,
    inRangeOfPickupEnabled: false,
    inRangeOfPickupMeters: 300,
    farFromPickupEnabled: false,
    farFromPickupMeters: 1000
  },
  dispatchingSettings: {
    defaultTripCapacity: 2,
    orderStartStatus: 'In Progress',
    tripCapacitySmartAutoComplete: true,
    maxTimeLimitEnabled: true,
    maxTimeLimitMin: 6,
    minimumTimeBetweenTripsMin: 5
  },
  riderOrderJourney: {
    riderOnMyWayToPickup: false,
    arrivedToPickup: false,
    pickedUpDistanceRestriction: true,
    pickedUpDistanceMeters: 100,
    wayToDropOffAction: true,
    smartOnMyWay: false,
    customerServingTimeMin: 5,
    arrivedToCustomerAction: false,
    orderDeliveryGpsRestriction: true,
    orderDeliveryGpsMeters: 200,
    orderDeliveryGpsOutOfZoneAction: 'Disable the deliver button',
    orderDeliveryGeofenceRestriction: true,
    orderDeliveryGeofenceOutOfZoneAction: 'Disable the deliver button',
    failedToDeliverTripRunningAction: 'Enable to deliver again'
  },
  ordersAbuse: {
    distancePickupToDropoffEnabled: true,
    distancePickupToDropoffMinMeters: 50,
    distancePickupToDropoffMaxEnabled: false,
    distancePickupToDropoffMaxMeters: 15000,
    timePickupToDropoffEnabled: true,
    timePickupToDropoffMinMinutes: 3,
    timeBetweenTwoOrdersEnabled: true,
    timeBetweenTwoOrdersMinMinutes: 2,
    fromOrderCreationEnabled: false,
    fromOrderCreationMinMinutes: 5
  },
  gpsLocations: {
    closeToFirstOrderEnabled: false,
    closeToFirstOrderMeters: 150,
    withinRangeOfFirstOrderEnabled: false,
    withinRangeOfFirstOrderMeters: 500
  },
  sla: {
    deliveryExcellentUnderMin: 25,
    deliveryGoodUnderMin: 35,
    deliveryLateOverMin: 35,
    orderPreparationMin: 20,
    orderFetchingMin: 5,
    riderWaitingInStoreMin: 3,
    customerAvgServingTimeMin: 5
  }
};

function mergeConfig(cfg?: Partial<DispatchStoreConfig> | null): DispatchStoreConfig {
  return {
    dispatchingQueue: { ...FALLBACK_CONFIG.dispatchingQueue, ...(cfg?.dispatchingQueue || {}) },
    dispatchingSettings: { ...FALLBACK_CONFIG.dispatchingSettings, ...(cfg?.dispatchingSettings || {}) },
    riderOrderJourney: { ...FALLBACK_CONFIG.riderOrderJourney, ...(cfg?.riderOrderJourney || {}) },
    ordersAbuse: { ...FALLBACK_CONFIG.ordersAbuse, ...(cfg?.ordersAbuse || {}) },
    gpsLocations: { ...FALLBACK_CONFIG.gpsLocations, ...(cfg?.gpsLocations || {}) },
    sla: { ...FALLBACK_CONFIG.sla, ...(cfg?.sla || {}) }
  };
}

function StatusTag({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[34px] px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
        on
          ? 'bg-emerald-600 text-white'
          : 'bg-slate-200 text-slate-600'
      }`}
    >
      {on ? 'ON' : 'OFF'}
    </span>
  );
}

function ValueChip({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium tabular-nums border ${
        muted
          ? 'bg-slate-50 text-slate-400 border-slate-200/80'
          : 'bg-slate-100 text-slate-800 border-slate-200'
      }`}
    >
      {children}
    </span>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-teal-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-1'
          }`}
        />
      </button>
      {label && <span className="text-xs font-medium text-slate-700">{label}</span>}
    </label>
  );
}

export function LiveDispatchStorePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab') as StoreTabId | null;
  const initialStoreIdParam = Number(searchParams.get('storeId') || 0) || null;

  const [stores, setStores] = useState<DispatchStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(initialStoreIdParam);
  const [zones, setZones] = useState<DispatchCustomerZone[]>([]);
  const [routes, setRoutes] = useState<DispatchSmartRoute[]>([]);
  const [activeTab, setActiveTab] = useState<StoreTabId>(
    initialTabParam && ['info', 'zones', 'routes', 'config'].includes(initialTabParam)
      ? initialTabParam
      : 'info'
  );
  const [smartRoutesExpanded, setSmartRoutesExpanded] = useState(
    initialTabParam === 'routes'
  );

  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingSubData, setLoadingSubData] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Map state for Store Info tab
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const geofenceLayerRef = useRef<L.LayerGroup | null>(null);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showZoneGeofences, setShowZoneGeofences] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Store modal state
  const [storeModalMode, setStoreModalMode] = useState<'create' | 'edit' | null>(null);
  const [storeForm, setStoreForm] = useState({
    name: '',
    brand: 'Wesaya',
    code: '',
    city: 'Cairo',
    address: '',
    lat: '29.99884',
    lng: '31.159592'
  });

  // Customer Zones filters & inline edits
  const [zoneSearch, setZoneSearch] = useState('');
  const [zoneCityFilter, setZoneCityFilter] = useState('all');
  const [zoneGeofenceFilter, setZoneGeofenceFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [assignedZonesOnly, setAssignedZonesOnly] = useState(false);
  const [extraFeeDrafts, setExtraFeeDrafts] = useState<Record<number, string>>({});
  const [savingZoneId, setSavingZoneId] = useState<number | null>(null);

  // Customer Zone modal state
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DispatchCustomerZone | null>(null);
  const [zoneForm, setZoneForm] = useState({
    name: '',
    city: 'Cairo',
    has_geofence: true,
    geofence_radius_m: '1000',
    lat: '29.99884',
    lng: '31.159592',
    default_vehicle_type: 'Motorcycle',
    extra_fees: '0',
    is_active: true
  });

  // Smart Route modal state
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DispatchSmartRoute | null>(null);
  const [routeFormName, setRouteFormName] = useState('');
  const [routeFormZones, setRouteFormZones] = useState<DispatchSmartRouteZoneRef[]>([]);
  const [routeZonePickerId, setRouteZonePickerId] = useState('');
  const [customRouteZoneName, setCustomRouteZoneName] = useState('');

  // Configuration modal state
  const [editingConfigSection, setEditingConfigSection] = useState<ConfigSectionKey | null>(null);
  const [configDraft, setConfigDraft] = useState<DispatchStoreConfig>(FALLBACK_CONFIG);

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'store'; id: number; name: string }
    | { type: 'zone'; id: number; name: string }
    | { type: 'route'; id: number; name: string }
    | null
  >(null);

  const notify = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  const selectedStore = useMemo(
    () => stores.find((s) => s.id === selectedStoreId) || stores[0] || null,
    [stores, selectedStoreId]
  );

  const activeConfig = useMemo(
    () => mergeConfig(selectedStore?.config),
    [selectedStore]
  );

  // Load all stores
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
      notify('error', err?.message || 'Unable to load stores from database.');
    } finally {
      setLoadingStores(false);
    }
  }, [notify]);

  // Load zones & routes for selected store
  const fetchStoreSubData = useCallback(async (storeId: number) => {
    setLoadingSubData(true);
    try {
      const [zRes, rRes] = await Promise.all([
        fetch(`/api/operations/live-dispatch/stores/${storeId}/zones`, {
          headers: getDispatchAuthHeaders(false)
        }),
        fetch(`/api/operations/live-dispatch/stores/${storeId}/routes`, {
          headers: getDispatchAuthHeaders(false)
        })
      ]);
      const zData: DispatchCustomerZone[] = zRes.ok ? await zRes.json() : [];
      const rData: DispatchSmartRoute[] = rRes.ok ? await rRes.json() : [];
      setZones(Array.isArray(zData) ? zData : []);
      setRoutes(Array.isArray(rData) ? rData : []);
      const drafts: Record<number, string> = {};
      (Array.isArray(zData) ? zData : []).forEach((z) => {
        drafts[z.id] = String(z.extra_fees ?? 0);
      });
      setExtraFeeDrafts(drafts);
    } catch {
      notify('error', 'Failed to load store zones and routes.');
    } finally {
      setLoadingSubData(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore?.id) {
      setIsPickingLocation(false);
      setPendingCoords(null);
      fetchStoreSubData(selectedStore.id);
    }
  }, [selectedStore?.id, fetchStoreSubData]);

  // Compute route count per zone
  const zoneRouteCountMap = useMemo(() => {
    const counts = new Map<number, number>();
    const nameCounts = new Map<string, number>();
    routes.forEach((rt) => {
      (rt.zones || []).forEach((ref) => {
        if (ref.id) counts.set(ref.id, (counts.get(ref.id) || 0) + 1);
        if (ref.name) {
          const key = ref.name.trim().toLowerCase();
          nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
        }
      });
    });
    return { counts, nameCounts };
  }, [routes]);

  const getZoneRouteCount = useCallback(
    (z: DispatchCustomerZone) => {
      const byId = zoneRouteCountMap.counts.get(z.id) || 0;
      if (byId > 0) return byId;
      return zoneRouteCountMap.nameCounts.get(z.name.trim().toLowerCase()) || 0;
    },
    [zoneRouteCountMap]
  );

  // Filtered Customer Zones
  const cityOptions = useMemo(() => {
    const set = new Set<string>(['Cairo', 'Giza', 'Alexandria']);
    zones.forEach((z) => {
      if (z.city?.trim()) set.add(z.city.trim());
    });
    if (selectedStore?.city?.trim()) set.add(selectedStore.city.trim());
    return Array.from(set).sort();
  }, [zones, selectedStore?.city]);

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      if (assignedZonesOnly && getZoneRouteCount(z) === 0) return false;
      if (zoneSearch.trim()) {
        const q = zoneSearch.trim().toLowerCase();
        const matchName = z.name.toLowerCase().includes(q);
        const matchCity = (z.city || '').toLowerCase().includes(q);
        if (!matchName && !matchCity) return false;
      }
      if (zoneCityFilter !== 'all' && (z.city || '').trim() !== zoneCityFilter) {
        return false;
      }
      if (zoneGeofenceFilter === 'yes' && !z.has_geofence) return false;
      if (zoneGeofenceFilter === 'no' && z.has_geofence) return false;
      return true;
    });
  }, [zones, assignedZonesOnly, zoneSearch, zoneCityFilter, zoneGeofenceFilter, getZoneRouteCount]);

  // Interactive Leaflet Map lifecycle for Store Info tab
  const isPickingRef = useRef(isPickingLocation);
  isPickingRef.current = isPickingLocation;

  useEffect(() => {
    if (activeTab !== 'info' || !selectedStore || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        geofenceLayerRef.current = null;
      }
      return;
    }

    const lat = Number(pendingCoords?.lat ?? selectedStore.lat ?? 29.99884);
    const lng = Number(pendingCoords?.lng ?? selectedStore.lng ?? 31.159592);

    let resizeTimer: number | null = null;

    if (mapRef.current && mapRef.current.getContainer() !== mapContainerRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      markerRef.current = null;
      geofenceLayerRef.current = null;
    }

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      map.on('click', (e: L.LeafletMouseEvent) => {
        if (!isPickingRef.current) return;
        const nextLat = Number(e.latlng.lat.toFixed(6));
        const nextLng = Number(e.latlng.lng.toFixed(6));
        setPendingCoords({ lat: nextLat, lng: nextLng });
      });

      mapRef.current = map;
      geofenceLayerRef.current = L.layerGroup().addTo(map);
      resizeTimer = window.setTimeout(() => {
        if (
          mapRef.current === map &&
          (map as any)._mapPane &&
          map.getContainer()?.isConnected
        ) {
          map.invalidateSize();
        }
      }, 120);
    } else if ((mapRef.current as any)._mapPane) {
      mapRef.current.setView([lat, lng], mapRef.current.getZoom(), { animate: true });
    }

    const map = mapRef.current;

    // Store pin marker
    const storeIcon = L.divIcon({
      className: 'dispatch-store-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:12px;background:#0f766e;color:#fff;border:3px solid #fff;box-shadow:0 6px 16px rgba(15,118,110,0.35);font-weight:700;font-size:13px;">S</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { icon: storeIcon }).addTo(map);
    }

    const safeName = escapeHtml(selectedStore.name);
    const safeBrand = escapeHtml(selectedStore.brand);
    const safeCode = escapeHtml(selectedStore.code);
    const safeAddress = escapeHtml(selectedStore.address || selectedStore.city);
    markerRef.current.bindPopup(
      `<div style="font-family:system-ui,sans-serif;min-width:170px;">
        <div style="font-weight:700;font-size:13px;color:#0f172a;">${safeName}</div>
        <div style="font-size:11px;color:#475569;margin-top:2px;">${safeBrand} · ${safeCode}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;">${safeAddress}</div>
        <div style="font-size:11px;color:#0f766e;margin-top:4px;font-variant-numeric:tabular-nums;">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
      </div>`
    );

    // Optional Zone Geofences overlay
    if (geofenceLayerRef.current) {
      geofenceLayerRef.current.clearLayers();
      if (showZoneGeofences) {
        zones
          .filter((z) => z.has_geofence && z.is_active)
          .forEach((z) => {
            const circle = L.circle([Number(z.lat), Number(z.lng)], {
              radius: Math.max(100, Number(z.geofence_radius_m || 1000)),
              color: '#0d9488',
              weight: 1.5,
              fillColor: '#14b8a6',
              fillOpacity: 0.12
            });
            circle.bindTooltip(
              `${escapeHtml(z.name)} (${Number(z.geofence_radius_m || 1000)} m)`,
              { sticky: true }
            );
            circle.addTo(geofenceLayerRef.current!);
          });
      }
    }

    return () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
    };
  }, [activeTab, selectedStore, pendingCoords, showZoneGeofences, zones]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        geofenceLayerRef.current = null;
      }
    };
  }, []);

  // =========================================================================
  // Store Actions
  // =========================================================================
  const openCreateStoreModal = () => {
    setStoreForm({
      name: '',
      brand: selectedStore?.brand || 'Wesaya',
      code: `RBST-${String(stores.length + 1).padStart(3, '0')}`,
      city: 'Cairo',
      address: '',
      lat: '29.99884',
      lng: '31.159592'
    });
    setStoreModalMode('create');
  };

  const openEditStoreModal = () => {
    if (!selectedStore) return;
    setStoreForm({
      name: selectedStore.name || '',
      brand: selectedStore.brand || '',
      code: selectedStore.code || '',
      city: selectedStore.city || 'Cairo',
      address: selectedStore.address || '',
      lat: String(selectedStore.lat ?? 29.99884),
      lng: String(selectedStore.lng ?? 31.159592)
    });
    setStoreModalMode('edit');
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeForm.name.trim()) {
      notify('error', 'Store name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: storeForm.name.trim(),
        brand: storeForm.brand.trim() || 'Wesaya',
        code: storeForm.code.trim(),
        city: storeForm.city.trim() || 'Cairo',
        address: storeForm.address.trim() || storeForm.city.trim() || 'Cairo',
        lat: Number(storeForm.lat) || 29.99884,
        lng: Number(storeForm.lng) || 31.159592
      };

      const isEdit = storeModalMode === 'edit' && selectedStore;
      const url = isEdit
        ? `/api/operations/live-dispatch/stores/${selectedStore.id}`
        : '/api/operations/live-dispatch/stores';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save store');
      }
      const saved: DispatchStore = await res.json();
      if (isEdit) {
        setStores((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
        notify('success', 'Store details updated.');
      } else {
        setStores((prev) => [...prev, saved]);
        setSelectedStoreId(saved.id);
        notify('success', `Store "${saved.name}" created.`);
      }
      setStoreModalMode(null);
      setPendingCoords(null);
      setIsPickingLocation(false);
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save store.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePickedCoords = async () => {
    if (!selectedStore || !pendingCoords) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/stores/${selectedStore.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ lat: pendingCoords.lat, lng: pendingCoords.lng })
      });
      if (!res.ok) throw new Error('Failed to update store coordinates');
      const saved: DispatchStore = await res.json();
      setStores((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      setPendingCoords(null);
      setIsPickingLocation(false);
      notify('success', 'Store map coordinates updated.');
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save coordinates.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCoords = () => {
    if (!selectedStore) return;
    const text = `${Number(selectedStore.lat).toFixed(6)},${Number(selectedStore.lng).toFixed(6)}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedCoords(true);
      window.setTimeout(() => setCopiedCoords(false), 1800);
    });
  };

  // =========================================================================
  // Customer Zone Actions
  // =========================================================================
  const openAddZoneModal = () => {
    setEditingZone(null);
    setZoneForm({
      name: '',
      city: selectedStore?.city || 'Cairo',
      has_geofence: true,
      geofence_radius_m: '1000',
      lat: String(selectedStore?.lat ?? 29.99884),
      lng: String(selectedStore?.lng ?? 31.159592),
      default_vehicle_type: 'Motorcycle',
      extra_fees: '0',
      is_active: true
    });
    setZoneModalOpen(true);
  };

  const openEditZoneModal = (zone: DispatchCustomerZone) => {
    setEditingZone(zone);
    setZoneForm({
      name: zone.name || '',
      city: zone.city || 'Cairo',
      has_geofence: Boolean(zone.has_geofence),
      geofence_radius_m: String(zone.geofence_radius_m ?? 1000),
      lat: String(zone.lat ?? selectedStore?.lat ?? 29.99884),
      lng: String(zone.lng ?? selectedStore?.lng ?? 31.159592),
      default_vehicle_type: zone.default_vehicle_type || 'Motorcycle',
      extra_fees: String(zone.extra_fees ?? 0),
      is_active: Boolean(zone.is_active)
    });
    setZoneModalOpen(true);
  };

  const handleSaveZoneModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !zoneForm.name.trim()) {
      notify('error', 'Customer zone name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: zoneForm.name.trim(),
        city: zoneForm.city.trim() || 'Cairo',
        has_geofence: Boolean(zoneForm.has_geofence),
        geofence_radius_m: Math.max(50, Number(zoneForm.geofence_radius_m) || 1000),
        lat: Number(zoneForm.lat) || selectedStore.lat,
        lng: Number(zoneForm.lng) || selectedStore.lng,
        default_vehicle_type: zoneForm.default_vehicle_type,
        extra_fees: Math.max(0, Number(zoneForm.extra_fees) || 0),
        is_active: Boolean(zoneForm.is_active)
      };

      const url = editingZone
        ? `/api/operations/live-dispatch/zones/${editingZone.id}`
        : `/api/operations/live-dispatch/stores/${selectedStore.id}/zones`;
      const res = await fetch(url, {
        method: editingZone ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save customer zone');
      }
      const saved: DispatchCustomerZone = await res.json();
      if (editingZone) {
        setZones((prev) => prev.map((z) => (z.id === saved.id ? saved : z)));
        notify('success', 'Customer zone updated.');
      } else {
        setZones((prev) => [...prev, saved]);
        notify('success', `Customer zone "${saved.name}" added.`);
      }
      setExtraFeeDrafts((prev) => ({ ...prev, [saved.id]: String(saved.extra_fees ?? 0) }));
      setZoneModalOpen(false);
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save customer zone.');
    } finally {
      setSaving(false);
    }
  };

  const handleInlineZonePatch = async (
    zone: DispatchCustomerZone,
    patch: Partial<DispatchCustomerZone>,
    successMsg: string
  ) => {
    setSavingZoneId(zone.id);
    try {
      const res = await fetch(`/api/operations/live-dispatch/zones/${zone.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(patch)
      });
      if (!res.ok) throw new Error('Update failed');
      const saved: DispatchCustomerZone = await res.json();
      setZones((prev) => prev.map((z) => (z.id === saved.id ? saved : z)));
      setExtraFeeDrafts((prev) => ({ ...prev, [saved.id]: String(saved.extra_fees ?? 0) }));
      notify('success', successMsg);
    } catch {
      notify('error', 'Failed to update customer zone.');
    } finally {
      setSavingZoneId(null);
    }
  };

  // =========================================================================
  // Smart Route Actions
  // =========================================================================
  const openCreateRouteModal = () => {
    setEditingRoute(null);
    setRouteFormName('');
    setRouteFormZones([]);
    setRouteZonePickerId('');
    setCustomRouteZoneName('');
    setRouteModalOpen(true);
  };

  const openEditRouteModal = (route: DispatchSmartRoute) => {
    setEditingRoute(route);
    setRouteFormName(route.name || '');
    setRouteFormZones(Array.isArray(route.zones) ? [...route.zones] : []);
    setRouteZonePickerId('');
    setCustomRouteZoneName('');
    setRouteModalOpen(true);
  };

  const handleAddZoneToRouteForm = () => {
    if (routeZonePickerId) {
      const z = zones.find((item) => String(item.id) === routeZonePickerId);
      if (z && !routeFormZones.some((rz) => rz.id === z.id && rz.name === z.name)) {
        setRouteFormZones((prev) => [...prev, { id: z.id, name: z.name }]);
      }
      setRouteZonePickerId('');
      return;
    }
    if (customRouteZoneName.trim()) {
      const trimmed = customRouteZoneName.trim();
      setRouteFormZones((prev) => [...prev, { id: Date.now(), name: trimmed }]);
      setCustomRouteZoneName('');
    }
  };

  const handleMoveRouteZone = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= routeFormZones.length) return;
    setRouteFormZones((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleSaveRouteModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !routeFormName.trim()) {
      notify('error', 'Route name is required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: routeFormName.trim(),
        zones: routeFormZones,
        is_active: true
      };
      const url = editingRoute
        ? `/api/operations/live-dispatch/routes/${editingRoute.id}`
        : `/api/operations/live-dispatch/stores/${selectedStore.id}/routes`;
      const res = await fetch(url, {
        method: editingRoute ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save smart route');
      }
      const saved: DispatchSmartRoute = await res.json();
      if (editingRoute) {
        setRoutes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        notify('success', 'Smart route updated.');
      } else {
        setRoutes((prev) => [...prev, saved]);
        notify('success', `Route "${saved.name}" created.`);
      }
      setRouteModalOpen(false);
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save smart route.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveZoneFromRoute = async (route: DispatchSmartRoute, zoneIndex: number) => {
    const nextZones = (route.zones || []).filter((_, i) => i !== zoneIndex);
    try {
      const res = await fetch(`/api/operations/live-dispatch/routes/${route.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ zones: nextZones })
      });
      if (!res.ok) throw new Error('Failed to remove zone');
      const saved: DispatchSmartRoute = await res.json();
      setRoutes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      notify('success', 'Zone removed from route.');
    } catch {
      notify('error', 'Failed to update route.');
    }
  };

  const handleQuickAddZoneToRoute = async (route: DispatchSmartRoute, zoneIdStr: string) => {
    const z = zones.find((item) => String(item.id) === zoneIdStr);
    if (!z) return;
    const current = Array.isArray(route.zones) ? route.zones : [];
    if (current.some((c) => c.id === z.id)) return;
    const nextZones = [...current, { id: z.id, name: z.name }];
    try {
      const res = await fetch(`/api/operations/live-dispatch/routes/${route.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ zones: nextZones })
      });
      if (!res.ok) throw new Error('Failed to add zone');
      const saved: DispatchSmartRoute = await res.json();
      setRoutes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      notify('success', `Added "${z.name}" to ${route.name}.`);
    } catch {
      notify('error', 'Failed to update route.');
    }
  };

  // =========================================================================
  // Configuration Actions
  // =========================================================================
  const openEditConfigSection = (section: ConfigSectionKey) => {
    setConfigDraft(mergeConfig(selectedStore?.config));
    setEditingConfigSection(section);
  };

  const handleSaveConfigSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !editingConfigSection) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/stores/${selectedStore.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          config: {
            [editingConfigSection]: configDraft[editingConfigSection]
          }
        })
      });
      if (!res.ok) throw new Error('Failed to save configuration');
      const saved: DispatchStore = await res.json();
      setStores((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
      setEditingConfigSection(null);
      notify('success', 'Store configuration saved.');
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  // =========================================================================
  // Confirmed Delete Handler
  // =========================================================================
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      let url = '';
      if (deleteTarget.type === 'store') {
        url = `/api/operations/live-dispatch/stores/${deleteTarget.id}`;
      } else if (deleteTarget.type === 'zone') {
        url = `/api/operations/live-dispatch/zones/${deleteTarget.id}`;
      } else {
        url = `/api/operations/live-dispatch/routes/${deleteTarget.id}`;
      }

      const res = await fetch(url, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Delete failed');

      if (deleteTarget.type === 'store') {
        const remaining = stores.filter((s) => s.id !== deleteTarget.id);
        setStores(remaining);
        setSelectedStoreId(remaining[0]?.id ?? null);
        notify('success', `Store "${deleteTarget.name}" deleted.`);
      } else if (deleteTarget.type === 'zone') {
        setZones((prev) => prev.filter((z) => z.id !== deleteTarget.id));
        notify('success', `Customer zone "${deleteTarget.name}" deleted.`);
      } else {
        setRoutes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        notify('success', `Smart route "${deleteTarget.name}" deleted.`);
      }
      setDeleteTarget(null);
    } catch {
      notify('error', 'Failed to delete record.');
    } finally {
      setSaving(false);
    }
  };

  const sidebarTabs: Array<{
    id: StoreTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'info', label: 'Store Info', icon: Store },
    { id: 'zones', label: 'Customer Zones', icon: MapPin, count: zones.length },
    { id: 'routes', label: 'Smart Routes', icon: RouteIcon, count: routes.length },
    { id: 'config', label: 'Configuration', icon: SlidersHorizontal }
  ];

  const assignedZonesCount = useMemo(
    () => zones.filter((z) => getZoneRouteCount(z) > 0).length,
    [zones, getZoneRouteCount]
  );

  return (
    <div className="space-y-4">
      {/* Subtle floating toast */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[120] flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold transition-all ${
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

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Store Panel */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Store Header Banner */}
          <div className="bg-teal-700 px-4 py-4 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <button
                type="button"
                onClick={openCreateStoreModal}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Store</span>
              </button>
            </div>
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wider text-teal-100 font-semibold">
                Dispatch Branch
              </div>
              <div className="text-sm font-bold truncate mt-0.5">
                {selectedStore?.name || (loadingStores ? 'Loading...' : 'No Store Selected')}
              </div>
              {selectedStore?.code && (
                <div className="text-[11px] text-teal-100/90 tabular-nums mt-0.5">
                  {selectedStore.brand} · {selectedStore.code}
                </div>
              )}
            </div>
          </div>

          {/* Store Selector */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/70">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Select Store / Branch
            </label>
            <select
              value={selectedStore?.id ?? ''}
              onChange={(e) => setSelectedStoreId(Number(e.target.value))}
              disabled={loadingStores || stores.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
            >
              {stores.length === 0 ? (
                <option value="">No stores available</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* 4 Sub-section Navigation + Nested Settings under Configuration */}
          <nav className="p-2 space-y-1">
            {sidebarTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isRoutesTab = tab.id === 'routes';
              return (
                <div key={tab.id} className="space-y-1">
                  <div
                    className={`w-full flex items-center justify-between gap-1 rounded-xl text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (isRoutesTab) {
                          setSmartRoutesExpanded((prev) => !prev);
                        }
                      }}
                      className="flex-1 flex items-center justify-between gap-2 px-3 py-2.5 text-left min-w-0 cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{tab.label}</span>
                      </span>
                      {tab.count !== undefined && (
                        <span
                          className={`text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded-md shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>

                    {isRoutesTab ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSmartRoutesExpanded((prev) => !prev);
                        }}
                        aria-label="Toggle Smart Routes sub-items"
                        title={smartRoutesExpanded ? 'Collapse Smart Routes' : 'Expand Smart Routes'}
                        className={`p-2 mr-1 rounded-lg transition-colors shrink-0 cursor-pointer ${
                          isActive
                            ? 'text-teal-100 hover:bg-white/15 hover:text-white'
                            : 'text-slate-400 hover:bg-slate-200/70 hover:text-slate-700'
                        }`}
                      >
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform duration-150 ${
                            smartRoutesExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="pr-2.5 shrink-0 pointer-events-none">
                        <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-teal-100' : 'text-slate-300'}`} />
                      </span>
                    )}
                  </div>

                  {isRoutesTab && smartRoutesExpanded && (
                    <div className="pl-4 ml-3 border-l border-slate-200 pt-0.5 space-y-1">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/operations-hub/LiveDispatchSystem/Store/Smart Routes/DeliveryzonesGeoFence${
                              selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                            }`
                          )
                        }
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Layers className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                          <span className="truncate">Deliveryzones GeoFence</span>
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/operations-hub/LiveDispatchSystem/Store/Smart Routes/Routes${
                              selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                            }`
                          )
                        }
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <RouteIcon className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                          <span className="truncate">Routes</span>
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      </button>
                    </div>
                  )}

                  {tab.id === 'config' && (
                    <div className="pl-4 ml-3 border-l border-slate-200 pt-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/operations-hub/LiveDispatchSystem/Store/settings${
                              selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                            }`
                          )
                        }
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-teal-700 bg-teal-50/70 hover:bg-teal-100/80 border border-teal-100 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <Settings className="w-3.5 h-3.5 shrink-0 text-teal-600" />
                          <span className="truncate">Settings</span>
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 min-w-0 w-full space-y-4">
          {loadingStores ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
              Loading store data...
            </div>
          ) : !selectedStore ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <Store className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Dispatch Store Configured</div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Add your first branch or store location so riders have a defined pickup origin, customer zones, smart routes, and dispatch SLA rules.
              </p>
              <button
                type="button"
                onClick={openCreateStoreModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Store</span>
              </button>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* TAB 1: STORE INFO & INTERACTIVE MAP                       */}
              {/* ========================================================= */}
              {activeTab === 'info' && (
                <div className="space-y-4">
                  {/* Store Info Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">Store Info</h2>
                          <p className="text-xs text-slate-500">
                            Branch dispatch origin details and pickup GPS coordinates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stores.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                type: 'store',
                                id: selectedStore.id,
                                name: selectedStore.name
                              })
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openEditStoreModal}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Store className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-slate-400">Store Name</div>
                          <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                            {selectedStore.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Truck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-slate-400">Brand</div>
                          <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                            {selectedStore.brand || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <Radio className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-slate-400">Code</div>
                          <div className="text-sm font-bold text-slate-900 tabular-nums truncate mt-0.5">
                            {selectedStore.code || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-medium text-slate-400">Address</div>
                          <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                            {selectedStore.address || selectedStore.city || '—'}
                          </div>
                          {selectedStore.city &&
                            selectedStore.address &&
                            selectedStore.address.toLowerCase() !== selectedStore.city.toLowerCase() && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{selectedStore.city}</div>
                            )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <Crosshair className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-400">Location Coordinates</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-slate-900 tabular-nums">
                              {Number(selectedStore.lat).toFixed(6)}, {Number(selectedStore.lng).toFixed(6)}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyCoords}
                              title="Copy coordinates"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 hover:bg-slate-50 text-[11px] font-medium text-slate-600 cursor-pointer"
                            >
                              {copiedCoords ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-700">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 tabular-nums">
                        <span>
                          <strong className="text-slate-800">{zones.length}</strong> Customer Zones
                        </span>
                        <span>
                          <strong className="text-slate-800">{routes.length}</strong> Smart Routes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Address / Map Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        <h3 className="text-sm font-bold text-slate-900">Address &amp; Pickup Pin</h3>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showZoneGeofences}
                            onChange={(e) => setShowZoneGeofences(e.target.checked)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span>Show Zone Geofences</span>
                        </label>

                        {!isPickingLocation ? (
                          <button
                            type="button"
                            onClick={() => setIsPickingLocation(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>Pick Location on Map</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-teal-700 font-medium">
                              Click map to place pin
                            </span>
                            {pendingCoords && (
                              <button
                                type="button"
                                onClick={handleSavePickedCoords}
                                disabled={saving}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Save Pin</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setIsPickingLocation(false);
                                setPendingCoords(null);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {isPickingLocation && pendingCoords && (
                      <div className="px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center justify-between">
                        <span>
                          New pin preview:{' '}
                          <strong className="tabular-nums">
                            {pendingCoords.lat.toFixed(6)}, {pendingCoords.lng.toFixed(6)}
                          </strong>
                        </span>
                        <span className="text-teal-700">Click &ldquo;Save Pin&rdquo; to apply to database</span>
                      </div>
                    )}

                    <div
                      ref={mapContainerRef}
                      className={`w-full h-[420px] rounded-xl border border-slate-200 overflow-hidden z-0 ${
                        isPickingLocation ? 'cursor-crosshair ring-2 ring-teal-500/40' : ''
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 2: CUSTOMER ZONES                                     */}
              {/* ========================================================= */}
              {activeTab === 'zones' && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                  {/* Top Bar */}
                  <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Customer Zones</h2>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {zones.length} total zones · {assignedZonesCount} assigned to smart routes
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAssignedZonesOnly((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          assignedZonesOnly
                            ? 'bg-teal-600 border-teal-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <RouteIcon className="w-3.5 h-3.5" />
                        <span>Assigned Customer Zones</span>
                      </button>
                      <button
                        type="button"
                        onClick={openAddZoneModal}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Customer Zone</span>
                      </button>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Customer Zone Name
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={zoneSearch}
                          onChange={(e) => setZoneSearch(e.target.value)}
                          placeholder="Enter name..."
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        City
                      </label>
                      <select
                        value={zoneCityFilter}
                        onChange={(e) => setZoneCityFilter(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                      >
                        <option value="all">All Cities</option>
                        {cityOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Geofence
                      </label>
                      <select
                        value={zoneGeofenceFilter}
                        onChange={(e) => setZoneGeofenceFilter(e.target.value as 'all' | 'yes' | 'no')}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                      >
                        <option value="all">All Geofence States</option>
                        <option value="yes">With Geofence</option>
                        <option value="no">Without Geofence</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {(zoneSearch || zoneCityFilter !== 'all' || zoneGeofenceFilter !== 'all' || assignedZonesOnly) && (
                        <button
                          type="button"
                          onClick={() => {
                            setZoneSearch('');
                            setZoneCityFilter('all');
                            setZoneGeofenceFilter('all');
                            setAssignedZonesOnly(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                      <span className="text-[11px] text-slate-400 tabular-nums ml-auto">
                        Showing {filteredZones.length} of {zones.length}
                      </span>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          <th className="py-3 px-4 w-12">#</th>
                          <th className="py-3 px-4">Customer Zone Name</th>
                          <th className="py-3 px-4">Geofence</th>
                          <th className="py-3 px-4">Routes</th>
                          <th className="py-3 px-4">City</th>
                          <th className="py-3 px-4">Default Vehicle Type</th>
                          <th className="py-3 px-4">Extra Fees</th>
                          <th className="py-3 px-4">Active</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {loadingSubData ? (
                          <tr>
                            <td colSpan={9} className="py-10 text-center text-slate-400">
                              Loading customer zones...
                            </td>
                          </tr>
                        ) : filteredZones.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-10 text-center text-slate-500">
                              <div className="space-y-2">
                                <p className="font-medium text-slate-700">No customer zones found</p>
                                <p className="text-[11px] text-slate-400">
                                  Add delivery neighborhoods served by {selectedStore.name} to configure geofences, vehicle types, and smart routes.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredZones.map((zone, index) => {
                            const routeCount = getZoneRouteCount(zone);
                            const feeDraft = extraFeeDrafts[zone.id] ?? String(zone.extra_fees ?? 0);
                            const isFeeDirty = Number(feeDraft) !== Number(zone.extra_fees ?? 0);
                            return (
                              <tr key={zone.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 text-slate-400 font-medium tabular-nums">
                                  {index + 1}
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    onClick={() => openEditZoneModal(zone)}
                                    className="font-semibold text-teal-700 hover:text-teal-900 hover:underline text-left cursor-pointer"
                                  >
                                    {zone.name}
                                  </button>
                                </td>
                                <td className="py-3 px-4">
                                  {zone.has_geofence ? (
                                    <button
                                      type="button"
                                      onClick={() => openEditZoneModal(zone)}
                                      title={`Geofence radius: ${zone.geofence_radius_m} m`}
                                      className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-900 font-medium tabular-nums cursor-pointer"
                                    >
                                      <Radar className="w-4 h-4 text-teal-600" />
                                      <span>{Number(zone.geofence_radius_m || 1000).toLocaleString()} m</span>
                                    </button>
                                  ) : (
                                    <span className="text-slate-300">—</span>
                                  )}
                                </td>
                                <td className="py-3 px-4 font-semibold text-slate-700 tabular-nums">
                                  {routeCount}
                                </td>
                                <td className="py-3 px-4 text-slate-600">
                                  {zone.city || '—'}
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={zone.default_vehicle_type || 'Motorcycle'}
                                    disabled={savingZoneId === zone.id}
                                    onChange={(e) =>
                                      handleInlineZonePatch(
                                        zone,
                                        { default_vehicle_type: e.target.value },
                                        `Vehicle type saved for "${zone.name}".`
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                                  >
                                    {VEHICLE_TYPES.map((vt) => (
                                      <option key={vt} value={vt}>
                                        {vt}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="inline-flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      min={0}
                                      step="0.5"
                                      value={feeDraft}
                                      onChange={(e) =>
                                        setExtraFeeDrafts((prev) => ({
                                          ...prev,
                                          [zone.id]: e.target.value
                                        }))
                                      }
                                      className="w-20 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                                    />
                                    <button
                                      type="button"
                                      disabled={savingZoneId === zone.id}
                                      onClick={() =>
                                        handleInlineZonePatch(
                                          zone,
                                          { extra_fees: Math.max(0, Number(feeDraft) || 0) },
                                          `Extra fees updated for "${zone.name}".`
                                        )
                                      }
                                      title="Save Extra Fees"
                                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center transition-colors cursor-pointer ${
                                        isFeeDirty
                                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                      }`}
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    disabled={savingZoneId === zone.id}
                                    onClick={() =>
                                      handleInlineZonePatch(
                                        zone,
                                        { is_active: !zone.is_active },
                                        `Zone "${zone.name}" marked as ${!zone.is_active ? 'Active' : 'Inactive'}.`
                                      )
                                    }
                                    className={`font-semibold text-xs cursor-pointer transition-colors ${
                                      zone.is_active
                                        ? 'text-emerald-700 hover:text-emerald-900'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                  >
                                    {zone.is_active ? 'Active' : 'Inactive'}
                                  </button>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="inline-flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEditZoneModal(zone)}
                                      title="Edit Zone Settings"
                                      className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                                    >
                                      <SlidersHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setDeleteTarget({ type: 'zone', id: zone.id, name: zone.name })
                                      }
                                      title="Delete Zone"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 3: SMART ROUTES                                       */}
              {/* ========================================================= */}
              {activeTab === 'routes' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Smart Routes</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Group sequential customer zones for efficient multi-order batching from {selectedStore.name}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/operations-hub/LiveDispatchSystem/Store/Smart Routes/DeliveryzonesGeoFence${
                              selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                            }`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-teal-600" />
                        <span>Deliveryzones GeoFence</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/operations-hub/LiveDispatchSystem/Store/Smart Routes/Routes${
                              selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                            }`
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <RouteIcon className="w-3.5 h-3.5" />
                        <span>Open Routes</span>
                      </button>
                      <button
                        type="button"
                        onClick={openCreateRouteModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Route</span>
                      </button>
                    </div>
                  </div>

                  {loadingSubData ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-400">
                      Loading smart routes...
                    </div>
                  ) : routes.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
                      <RouteIcon className="w-8 h-8 text-slate-300 mx-auto" />
                      <div className="text-sm font-bold text-slate-800">No Smart Routes Yet</div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Create your first smart route to group nearby customer zones in delivery sequence.
                      </p>
                      <button
                        type="button"
                        onClick={openCreateRouteModal}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create First Route</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                      {routes.map((route) => {
                        const routeZones = Array.isArray(route.zones) ? route.zones : [];
                        const availableToAdd = zones.filter(
                          (z) => !routeZones.some((rz) => rz.id === z.id)
                        );
                        return (
                          <div
                            key={route.id}
                            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
                          >
                            <div>
                              {/* Card Header */}
                              <div className="bg-teal-50/70 border-b border-teal-100 px-3.5 py-2.5 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-6 h-6 rounded-lg bg-white text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                                    <RouteIcon className="w-3.5 h-3.5" />
                                  </div>
                                  <h3 className="text-xs font-bold text-slate-900 truncate">
                                    {route.name}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditRouteModal(route)}
                                    title="Edit Route"
                                    className="p-1 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDeleteTarget({ type: 'route', id: route.id, name: route.name })
                                    }
                                    title="Delete Route"
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Zones Count Subheader */}
                              <div className="px-3.5 pt-3 pb-2 flex items-center gap-2 text-[11px] font-semibold text-teal-700">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Customer Zones</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold tabular-nums">
                                  {routeZones.length}
                                </span>
                              </div>

                              {/* Ordered Zone List */}
                              <div className="px-3.5 pb-3 divide-y divide-slate-100 min-h-[96px]">
                                {routeZones.length === 0 ? (
                                  <div className="py-5 text-center text-[11px] text-slate-400">
                                    No zones assigned yet
                                  </div>
                                ) : (
                                  routeZones.map((rz, idx) => (
                                    <div
                                      key={`${rz.id}-${idx}`}
                                      className="py-2 flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0 tabular-nums">
                                          {idx + 1}
                                        </span>
                                        <span className="text-xs font-medium text-slate-800 truncate">
                                          {rz.name}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveZoneFromRoute(route, idx)}
                                        title="Remove zone from route"
                                        className="text-rose-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                                      >
                                        <MinusCircle className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Quick Add Zone Footer */}
                            {availableToAdd.length > 0 && (
                              <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-100">
                                <select
                                  defaultValue=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleQuickAddZoneToRoute(route, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                                >
                                  <option value="">+ Add zone to route...</option>
                                  {availableToAdd.map((z) => (
                                    <option key={z.id} value={z.id}>
                                      {z.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* TAB 4: CONFIGURATION (6 EDITABLE SECTIONS)                */}
              {/* ========================================================= */}
              {activeTab === 'config' && (
                <div className="space-y-4">
                  <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Store Configuration Summary</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Review quick rules below or open Advanced Settings for radial maps, scheduled capacities, journey controls, and full SLA timers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/operations-hub/LiveDispatchSystem/Store/settings${
                            selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
                          }`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Open Settings</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1. Dispatching Queue */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                          <Radio className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Dispatching Queue</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditConfigSection('dispatchingQueue')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="pt-3.5 space-y-2.5 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">Dispatching Queue Parameters</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {activeConfig.dispatchingQueue.queueParameter}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-bold text-slate-900">Rider GPS Location</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Close to Pickup</span>
                          <ValueChip muted={!activeConfig.dispatchingQueue.closeToPickupEnabled}>
                            {activeConfig.dispatchingQueue.closeToPickupEnabled
                              ? `${activeConfig.dispatchingQueue.closeToPickupMeters} Meter`
                              : 'disabled'}
                          </ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">In Range of Pickup</span>
                          <ValueChip muted={!activeConfig.dispatchingQueue.inRangeOfPickupEnabled}>
                            {activeConfig.dispatchingQueue.inRangeOfPickupEnabled
                              ? `${activeConfig.dispatchingQueue.inRangeOfPickupMeters} Meter`
                              : 'disabled'}
                          </ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Far from Pickup</span>
                          <ValueChip muted={!activeConfig.dispatchingQueue.farFromPickupEnabled}>
                            {activeConfig.dispatchingQueue.farFromPickupEnabled
                              ? `${activeConfig.dispatchingQueue.farFromPickupMeters} Meter`
                              : 'disabled'}
                          </ValueChip>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Dispatching Settings */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Dispatching Settings</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditConfigSection('dispatchingSettings')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="pt-3.5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                      <div className="space-y-2.5 md:border-r md:border-slate-100 md:pr-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">Default Trip Capacity</span>
                          <ValueChip>{activeConfig.dispatchingSettings.defaultTripCapacity} Orders</ValueChip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusTag on={activeConfig.dispatchingSettings.tripCapacitySmartAutoComplete} />
                          <span className="font-bold text-slate-900">Trip Capacity Smart Auto-Complete</span>
                          <span className="text-slate-300">·</span>
                          <StatusTag on={activeConfig.dispatchingSettings.maxTimeLimitEnabled} />
                          <span className="text-slate-600">Max Time Limit</span>
                          <ValueChip muted={!activeConfig.dispatchingSettings.maxTimeLimitEnabled}>
                            {activeConfig.dispatchingSettings.maxTimeLimitEnabled
                              ? `${activeConfig.dispatchingSettings.maxTimeLimitMin} min`
                              : 'disabled'}
                          </ValueChip>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">Order Start Status</span>
                          <ValueChip>{activeConfig.dispatchingSettings.orderStartStatus}</ValueChip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">Minimum Time Between Trips</span>
                          <ValueChip>{activeConfig.dispatchingSettings.minimumTimeBetweenTripsMin} min</ValueChip>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Rider Order Journey */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                          <Navigation className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Rider Order Journey</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditConfigSection('riderOrderJourney')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="pt-3.5 grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs text-slate-700">
                      <div className="space-y-2.5 lg:border-r lg:border-slate-100 lg:pr-4">
                        <div className="flex items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.riderOnMyWayToPickup} />
                          <span className="font-bold text-slate-900">Rider on my Way to Pickup Action</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.arrivedToPickup} />
                          <span className="font-bold text-slate-900">Arrived to Pickup Action</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.pickedUpDistanceRestriction} />
                          <span className="font-bold text-slate-900">Picked-up Distance Restrictions</span>
                          <span className="text-slate-500">Distance</span>
                          <ValueChip muted={!activeConfig.riderOrderJourney.pickedUpDistanceRestriction}>
                            {activeConfig.riderOrderJourney.pickedUpDistanceMeters} Meter
                          </ValueChip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.wayToDropOffAction} />
                          <span className="font-bold text-slate-900">Way to Drop off Action</span>
                          <span className="text-slate-300">·</span>
                          <StatusTag on={activeConfig.riderOrderJourney.smartOnMyWay} />
                          <span className="text-slate-600">Smart on my way</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Customer Serving Time</span>
                          <ValueChip>{activeConfig.riderOrderJourney.customerServingTimeMin} min</ValueChip>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.arrivedToCustomerAction} />
                          <span className="font-bold text-slate-900">Arrived to Customer Action</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.orderDeliveryGpsRestriction} />
                          <span className="font-bold text-slate-900">Order Delivery GPS Restriction</span>
                          <span className="text-slate-500">Distance</span>
                          <ValueChip muted={!activeConfig.riderOrderJourney.orderDeliveryGpsRestriction}>
                            {activeConfig.riderOrderJourney.orderDeliveryGpsMeters} Meter
                          </ValueChip>
                          <span className="text-slate-500">Out of zone:</span>
                          <ValueChip>{activeConfig.riderOrderJourney.orderDeliveryGpsOutOfZoneAction}</ValueChip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusTag on={activeConfig.riderOrderJourney.orderDeliveryGeofenceRestriction} />
                          <span className="font-bold text-slate-900">Order Delivery Geofence Restriction</span>
                          <span className="text-slate-500">Out of zone:</span>
                          <ValueChip>{activeConfig.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction}</ValueChip>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900">Failed to Deliver Order</span>
                          <span className="text-slate-500">Trip Running:</span>
                          <ValueChip>{activeConfig.riderOrderJourney.failedToDeliverTripRunningAction}</ValueChip>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Orders Abuse */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">Orders Abuse</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditConfigSection('ordersAbuse')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="pt-3.5 space-y-2.5 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag on={activeConfig.ordersAbuse.distancePickupToDropoffEnabled} />
                        <span className="font-bold text-slate-900">Distance from Pickup to Drop off</span>
                        <span className="text-slate-500">Minimum Distance</span>
                        <ValueChip muted={!activeConfig.ordersAbuse.distancePickupToDropoffEnabled}>
                          {activeConfig.ordersAbuse.distancePickupToDropoffMinMeters} Meter
                        </ValueChip>
                        <span className="text-slate-500">Maximum Distance</span>
                        <ValueChip muted={!activeConfig.ordersAbuse.distancePickupToDropoffMaxEnabled}>
                          {activeConfig.ordersAbuse.distancePickupToDropoffMaxEnabled
                            ? `${activeConfig.ordersAbuse.distancePickupToDropoffMaxMeters} Meter`
                            : 'disabled'}
                        </ValueChip>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag on={activeConfig.ordersAbuse.timePickupToDropoffEnabled} />
                        <span className="font-bold text-slate-900">Time from Pickup to Drop off</span>
                        <span className="text-slate-500">Minimum Time</span>
                        <ValueChip muted={!activeConfig.ordersAbuse.timePickupToDropoffEnabled}>
                          {activeConfig.ordersAbuse.timePickupToDropoffMinMinutes} min
                        </ValueChip>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag on={activeConfig.ordersAbuse.timeBetweenTwoOrdersEnabled} />
                        <span className="font-bold text-slate-900">Time between two Orders</span>
                        <span className="text-slate-500">Minimum Time</span>
                        <ValueChip muted={!activeConfig.ordersAbuse.timeBetweenTwoOrdersEnabled}>
                          {activeConfig.ordersAbuse.timeBetweenTwoOrdersMinMinutes} min
                        </ValueChip>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusTag on={activeConfig.ordersAbuse.fromOrderCreationEnabled} />
                        <span className="font-bold text-slate-900">From Order Creation</span>
                        <span className="text-slate-500">Minimum Time</span>
                        <ValueChip muted={!activeConfig.ordersAbuse.fromOrderCreationEnabled}>
                          {activeConfig.ordersAbuse.fromOrderCreationEnabled
                            ? `${activeConfig.ordersAbuse.fromOrderCreationMinMinutes} min`
                            : 'disabled'}
                        </ValueChip>
                      </div>
                    </div>
                  </div>

                  {/* 5. GPS Locations */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">GPS Locations</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditConfigSection('gpsLocations')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="pt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-700">
                      <span className="font-bold text-slate-900">GPS Locations</span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-slate-500">Close to the first order</span>
                        <ValueChip muted={!activeConfig.gpsLocations.closeToFirstOrderEnabled}>
                          {activeConfig.gpsLocations.closeToFirstOrderEnabled
                            ? `${activeConfig.gpsLocations.closeToFirstOrderMeters} Meter`
                            : 'disabled'}
                        </ValueChip>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="text-slate-500">Within Range of the First Order</span>
                        <ValueChip muted={!activeConfig.gpsLocations.withinRangeOfFirstOrderEnabled}>
                          {activeConfig.gpsLocations.withinRangeOfFirstOrderEnabled
                            ? `${activeConfig.gpsLocations.withinRangeOfFirstOrderMeters} Meter`
                            : 'disabled'}
                        </ValueChip>
                      </span>
                    </div>
                  </div>

                  {/* 6. SLA */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">SLA</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditConfigSection('sla')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                    <div className="pt-3.5 space-y-2.5 text-xs text-slate-700">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-bold text-slate-900">Delivery Target Time</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Excellent</span>
                          <ValueChip>&lt; {activeConfig.sla.deliveryExcellentUnderMin} min</ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Good</span>
                          <ValueChip>&lt; {activeConfig.sla.deliveryGoodUnderMin} min</ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Late</span>
                          <ValueChip>&gt; {activeConfig.sla.deliveryLateOverMin} min</ValueChip>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <span className="font-bold text-slate-900">Order SLA</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Order Preparation</span>
                          <ValueChip>{activeConfig.sla.orderPreparationMin} min</ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Order Fetching</span>
                          <ValueChip>{activeConfig.sla.orderFetchingMin} min</ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Rider Waiting in Store</span>
                          <ValueChip>{activeConfig.sla.riderWaitingInStoreMin} min</ValueChip>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-slate-500">Customer Avg Serving Time</span>
                          <ValueChip>{activeConfig.sla.customerAvgServingTimeMin} min</ValueChip>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ================================================================= */}
      {/* MODAL: CREATE / EDIT STORE                                        */}
      {/* ================================================================= */}
      {storeModalMode && (
        <div className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {storeModalMode === 'edit' ? 'Edit Store Info' : 'Add New Store'}
              </h3>
              <button
                type="button"
                onClick={() => setStoreModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveStore} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Store Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    placeholder="e.g. Faisal Branch"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={storeForm.brand}
                    onChange={(e) => setStoreForm({ ...storeForm, brand: e.target.value })}
                    placeholder="e.g. Wesaya"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Store Code</label>
                  <input
                    type="text"
                    value={storeForm.code}
                    onChange={(e) => setStoreForm({ ...storeForm, code: e.target.value })}
                    placeholder="e.g. RBST-002"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    placeholder="e.g. Cairo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    placeholder="Street / District"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={storeForm.lat}
                    onChange={(e) => setStoreForm({ ...storeForm, lat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={storeForm.lng}
                    onChange={(e) => setStoreForm({ ...storeForm, lng: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStoreModalMode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : storeModalMode === 'edit' ? 'Save Changes' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ADD / EDIT CUSTOMER ZONE                                   */}
      {/* ================================================================= */}
      {zoneModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingZone ? 'Edit Customer Zone' : 'Add Customer Zone'}
              </h3>
              <button
                type="button"
                onClick={() => setZoneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveZoneModal} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Customer Zone Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                    placeholder="e.g. New Giza / Al Haram / Dokki"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={zoneForm.city}
                    onChange={(e) => setZoneForm({ ...zoneForm, city: e.target.value })}
                    placeholder="Cairo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Vehicle Type
                  </label>
                  <select
                    value={zoneForm.default_vehicle_type}
                    onChange={(e) => setZoneForm({ ...zoneForm, default_vehicle_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    {VEHICLE_TYPES.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Extra Fees
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={zoneForm.extra_fees}
                    onChange={(e) => setZoneForm({ ...zoneForm, extra_fees: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <ToggleSwitch
                    checked={zoneForm.is_active}
                    onChange={(v) => setZoneForm({ ...zoneForm, is_active: v })}
                    label={zoneForm.is_active ? 'Active Zone' : 'Inactive Zone'}
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <ToggleSwitch
                  checked={zoneForm.has_geofence}
                  onChange={(v) => setZoneForm({ ...zoneForm, has_geofence: v })}
                  label="Enable Geofence Boundary"
                />
                {zoneForm.has_geofence && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Radius (Meters)
                      </label>
                      <input
                        type="number"
                        min={50}
                        value={zoneForm.geofence_radius_m}
                        onChange={(e) => setZoneForm({ ...zoneForm, geofence_radius_m: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Center Lat
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={zoneForm.lat}
                        onChange={(e) => setZoneForm({ ...zoneForm, lat: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Center Lng
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={zoneForm.lng}
                        onChange={(e) => setZoneForm({ ...zoneForm, lng: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingZone ? 'Update Zone' : 'Add Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE / EDIT SMART ROUTE                                  */}
      {/* ================================================================= */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingRoute ? 'Edit Smart Route' : 'Create Smart Route'}
              </h3>
              <button
                type="button"
                onClick={() => setRouteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveRouteModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Route Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={routeFormName}
                  onChange={(e) => setRouteFormName(e.target.value)}
                  placeholder="e.g. Route 1 - Haram Corridor"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Add Customer Zones to Route
                </label>
                <div className="flex gap-2">
                  {zones.length > 0 ? (
                    <select
                      value={routeZonePickerId}
                      onChange={(e) => setRouteZonePickerId(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    >
                      <option value="">Select customer zone...</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({z.city || 'No city'})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={customRouteZoneName}
                      onChange={(e) => setCustomRouteZoneName(e.target.value)}
                      placeholder="Enter zone stop name..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800"
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleAddZoneToRouteForm}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    + Add Stop
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                {routeFormZones.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No stops added yet. Select customer zones above in delivery order.
                  </div>
                ) : (
                  routeFormZones.map((rz, idx) => (
                    <div
                      key={`${rz.id}-${idx}`}
                      className="px-3 py-2 flex items-center justify-between gap-2 bg-white"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold flex items-center justify-center tabular-nums shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-slate-800 truncate">{rz.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveRouteZone(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRouteZone(idx, 1)}
                          disabled={idx === routeFormZones.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setRouteFormZones((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1 rounded text-rose-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingRoute ? 'Save Route' : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: EDIT CONFIGURATION SECTION                                 */}
      {/* ================================================================= */}
      {editingConfigSection && (
        <div className="fixed inset-0 z-[100] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl max-h-[88vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-slate-900">
                Edit{' '}
                {editingConfigSection === 'dispatchingQueue'
                  ? 'Dispatching Queue'
                  : editingConfigSection === 'dispatchingSettings'
                  ? 'Dispatching Settings'
                  : editingConfigSection === 'riderOrderJourney'
                  ? 'Rider Order Journey'
                  : editingConfigSection === 'ordersAbuse'
                  ? 'Orders Abuse Rules'
                  : editingConfigSection === 'gpsLocations'
                  ? 'GPS Locations'
                  : 'SLA Targets'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingConfigSection(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfigSection} className="p-5 space-y-4 overflow-y-auto">
              {/* Section 1: Dispatching Queue */}
              {editingConfigSection === 'dispatchingQueue' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Dispatching Queue Parameters
                    </label>
                    <select
                      value={configDraft.dispatchingQueue.queueParameter}
                      onChange={(e) =>
                        setConfigDraft({
                          ...configDraft,
                          dispatchingQueue: {
                            ...configDraft.dispatchingQueue,
                            queueParameter: e.target.value
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800"
                    >
                      {QUEUE_PARAMETERS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(
                    [
                      ['Close to Pickup', 'closeToPickupEnabled', 'closeToPickupMeters'],
                      ['In Range of Pickup', 'inRangeOfPickupEnabled', 'inRangeOfPickupMeters'],
                      ['Far from Pickup', 'farFromPickupEnabled', 'farFromPickupMeters']
                    ] as const
                  ).map(([label, enKey, mKey]) => (
                    <div
                      key={enKey}
                      className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <ToggleSwitch
                        checked={configDraft.dispatchingQueue[enKey]}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            dispatchingQueue: { ...configDraft.dispatchingQueue, [enKey]: v }
                          })
                        }
                        label={label}
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          disabled={!configDraft.dispatchingQueue[enKey]}
                          value={configDraft.dispatchingQueue[mKey]}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              dispatchingQueue: {
                                ...configDraft.dispatchingQueue,
                                [mKey]: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100 disabled:text-slate-400"
                        />
                        <span className="text-xs text-slate-500">Meter</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 2: Dispatching Settings */}
              {editingConfigSection === 'dispatchingSettings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Trip Capacity (Orders)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={configDraft.dispatchingSettings.defaultTripCapacity}
                        onChange={(e) =>
                          setConfigDraft({
                            ...configDraft,
                            dispatchingSettings: {
                              ...configDraft.dispatchingSettings,
                              defaultTripCapacity: Math.max(1, Number(e.target.value) || 1)
                            }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Order Start Status
                      </label>
                      <select
                        value={configDraft.dispatchingSettings.orderStartStatus}
                        onChange={(e) =>
                          setConfigDraft({
                            ...configDraft,
                            dispatchingSettings: {
                              ...configDraft.dispatchingSettings,
                              orderStartStatus: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                      >
                        {ORDER_START_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <ToggleSwitch
                      checked={configDraft.dispatchingSettings.tripCapacitySmartAutoComplete}
                      onChange={(v) =>
                        setConfigDraft({
                          ...configDraft,
                          dispatchingSettings: {
                            ...configDraft.dispatchingSettings,
                            tripCapacitySmartAutoComplete: v
                          }
                        })
                      }
                      label="Trip Capacity Smart Auto-Complete"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <ToggleSwitch
                        checked={configDraft.dispatchingSettings.maxTimeLimitEnabled}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            dispatchingSettings: {
                              ...configDraft.dispatchingSettings,
                              maxTimeLimitEnabled: v
                            }
                          })
                        }
                        label="Max Time Limit"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          disabled={!configDraft.dispatchingSettings.maxTimeLimitEnabled}
                          value={configDraft.dispatchingSettings.maxTimeLimitMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              dispatchingSettings: {
                                ...configDraft.dispatchingSettings,
                                maxTimeLimitMin: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100"
                        />
                        <span className="text-xs text-slate-500">min</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Minimum Time Between Trips (Minutes)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={configDraft.dispatchingSettings.minimumTimeBetweenTripsMin}
                      onChange={(e) =>
                        setConfigDraft({
                          ...configDraft,
                          dispatchingSettings: {
                            ...configDraft.dispatchingSettings,
                            minimumTimeBetweenTripsMin: Math.max(0, Number(e.target.value) || 0)
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                    />
                  </div>
                </div>
              )}

              {/* Section 3: Rider Order Journey */}
              {editingConfigSection === 'riderOrderJourney' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <ToggleSwitch
                        checked={configDraft.riderOrderJourney.riderOnMyWayToPickup}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: { ...configDraft.riderOrderJourney, riderOnMyWayToPickup: v }
                          })
                        }
                        label="Rider on my Way to Pickup Action"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <ToggleSwitch
                        checked={configDraft.riderOrderJourney.arrivedToPickup}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: { ...configDraft.riderOrderJourney, arrivedToPickup: v }
                          })
                        }
                        label="Arrived to Pickup Action"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <ToggleSwitch
                        checked={configDraft.riderOrderJourney.wayToDropOffAction}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: { ...configDraft.riderOrderJourney, wayToDropOffAction: v }
                          })
                        }
                        label="Way to Drop off Action"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <ToggleSwitch
                        checked={configDraft.riderOrderJourney.smartOnMyWay}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: { ...configDraft.riderOrderJourney, smartOnMyWay: v }
                          })
                        }
                        label="Smart on my way"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <ToggleSwitch
                        checked={configDraft.riderOrderJourney.arrivedToCustomerAction}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: { ...configDraft.riderOrderJourney, arrivedToCustomerAction: v }
                          })
                        }
                        label="Arrived to Customer Action"
                      />
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700">Customer Serving Time</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          value={configDraft.riderOrderJourney.customerServingTimeMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              riderOrderJourney: {
                                ...configDraft.riderOrderJourney,
                                customerServingTimeMin: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-16 px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                        />
                        <span className="text-xs text-slate-500">min</span>
                      </div>
                    </div>
                  </div>

                  {/* Picked-up Distance */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                    <ToggleSwitch
                      checked={configDraft.riderOrderJourney.pickedUpDistanceRestriction}
                      onChange={(v) =>
                        setConfigDraft({
                          ...configDraft,
                          riderOrderJourney: { ...configDraft.riderOrderJourney, pickedUpDistanceRestriction: v }
                        })
                      }
                      label="Picked-up Distance Restrictions"
                    />
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        disabled={!configDraft.riderOrderJourney.pickedUpDistanceRestriction}
                        value={configDraft.riderOrderJourney.pickedUpDistanceMeters}
                        onChange={(e) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: {
                              ...configDraft.riderOrderJourney,
                              pickedUpDistanceMeters: Number(e.target.value) || 0
                            }
                          })
                        }
                        className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100"
                      />
                      <span className="text-xs text-slate-500">Meter</span>
                    </div>
                  </div>

                  {/* Delivery GPS Restriction */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <ToggleSwitch
                        checked={configDraft.riderOrderJourney.orderDeliveryGpsRestriction}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: { ...configDraft.riderOrderJourney, orderDeliveryGpsRestriction: v }
                          })
                        }
                        label="Order Delivery GPS Restriction"
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          disabled={!configDraft.riderOrderJourney.orderDeliveryGpsRestriction}
                          value={configDraft.riderOrderJourney.orderDeliveryGpsMeters}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              riderOrderJourney: {
                                ...configDraft.riderOrderJourney,
                                orderDeliveryGpsMeters: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100"
                        />
                        <span className="text-xs text-slate-500">Meter</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Delivering Out of Zone Action (GPS)
                      </label>
                      <select
                        value={configDraft.riderOrderJourney.orderDeliveryGpsOutOfZoneAction}
                        onChange={(e) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: {
                              ...configDraft.riderOrderJourney,
                              orderDeliveryGpsOutOfZoneAction: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      >
                        {OUT_OF_ZONE_ACTIONS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delivery Geofence Restriction */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <ToggleSwitch
                      checked={configDraft.riderOrderJourney.orderDeliveryGeofenceRestriction}
                      onChange={(v) =>
                        setConfigDraft({
                          ...configDraft,
                          riderOrderJourney: {
                            ...configDraft.riderOrderJourney,
                            orderDeliveryGeofenceRestriction: v
                          }
                        })
                      }
                      label="Order Delivery Geofence Restriction"
                    />
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Delivering Out of Zone Action (Geofence)
                      </label>
                      <select
                        value={configDraft.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction}
                        onChange={(e) =>
                          setConfigDraft({
                            ...configDraft,
                            riderOrderJourney: {
                              ...configDraft.riderOrderJourney,
                              orderDeliveryGeofenceOutOfZoneAction: e.target.value
                            }
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      >
                        {OUT_OF_ZONE_ACTIONS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Failed to Deliver Order */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Failed to Deliver Order (Trip Running Action)
                    </label>
                    <select
                      value={configDraft.riderOrderJourney.failedToDeliverTripRunningAction}
                      onChange={(e) =>
                        setConfigDraft({
                          ...configDraft,
                          riderOrderJourney: {
                            ...configDraft.riderOrderJourney,
                            failedToDeliverTripRunningAction: e.target.value
                          }
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
                    >
                      {FAILED_DELIVER_ACTIONS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Section 4: Orders Abuse */}
              {editingConfigSection === 'ordersAbuse' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <ToggleSwitch
                      checked={configDraft.ordersAbuse.distancePickupToDropoffEnabled}
                      onChange={(v) =>
                        setConfigDraft({
                          ...configDraft,
                          ordersAbuse: { ...configDraft.ordersAbuse, distancePickupToDropoffEnabled: v }
                        })
                      }
                      label="Distance from Pickup to Drop off"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Minimum Distance (Meter)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={configDraft.ordersAbuse.distancePickupToDropoffMinMeters}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              ordersAbuse: {
                                ...configDraft.ordersAbuse,
                                distancePickupToDropoffMinMeters: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                        />
                      </div>
                      <div className="space-y-1">
                        <ToggleSwitch
                          checked={configDraft.ordersAbuse.distancePickupToDropoffMaxEnabled}
                          onChange={(v) =>
                            setConfigDraft({
                              ...configDraft,
                              ordersAbuse: { ...configDraft.ordersAbuse, distancePickupToDropoffMaxEnabled: v }
                            })
                          }
                          label="Max Distance (Meter)"
                        />
                        <input
                          type="number"
                          min={0}
                          disabled={!configDraft.ordersAbuse.distancePickupToDropoffMaxEnabled}
                          value={configDraft.ordersAbuse.distancePickupToDropoffMaxMeters}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              ordersAbuse: {
                                ...configDraft.ordersAbuse,
                                distancePickupToDropoffMaxMeters: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>

                  {(
                    [
                      ['Time from Pickup to Drop off', 'timePickupToDropoffEnabled', 'timePickupToDropoffMinMinutes'],
                      ['Time between two Orders', 'timeBetweenTwoOrdersEnabled', 'timeBetweenTwoOrdersMinMinutes'],
                      ['From Order Creation', 'fromOrderCreationEnabled', 'fromOrderCreationMinMinutes']
                    ] as const
                  ).map(([label, enKey, minKey]) => (
                    <div
                      key={enKey}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                    >
                      <ToggleSwitch
                        checked={configDraft.ordersAbuse[enKey]}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            ordersAbuse: { ...configDraft.ordersAbuse, [enKey]: v }
                          })
                        }
                        label={label}
                      />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Min</span>
                        <input
                          type="number"
                          min={0}
                          disabled={!configDraft.ordersAbuse[enKey]}
                          value={configDraft.ordersAbuse[minKey]}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              ordersAbuse: {
                                ...configDraft.ordersAbuse,
                                [minKey]: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-20 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100"
                        />
                        <span className="text-xs text-slate-500">min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 5: GPS Locations */}
              {editingConfigSection === 'gpsLocations' && (
                <div className="space-y-3.5">
                  {(
                    [
                      ['Close to the first order', 'closeToFirstOrderEnabled', 'closeToFirstOrderMeters'],
                      ['Within Range of the First Order', 'withinRangeOfFirstOrderEnabled', 'withinRangeOfFirstOrderMeters']
                    ] as const
                  ).map(([label, enKey, mKey]) => (
                    <div
                      key={enKey}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                    >
                      <ToggleSwitch
                        checked={configDraft.gpsLocations[enKey]}
                        onChange={(v) =>
                          setConfigDraft({
                            ...configDraft,
                            gpsLocations: { ...configDraft.gpsLocations, [enKey]: v }
                          })
                        }
                        label={label}
                      />
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          disabled={!configDraft.gpsLocations[enKey]}
                          value={configDraft.gpsLocations[mKey]}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              gpsLocations: {
                                ...configDraft.gpsLocations,
                                [mKey]: Number(e.target.value) || 0
                              }
                            })
                          }
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums disabled:bg-slate-100"
                        />
                        <span className="text-xs text-slate-500">Meter</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Section 6: SLA */}
              {editingConfigSection === 'sla' && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">Delivery Target Time (Minutes)</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Excellent (&lt; min)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={configDraft.sla.deliveryExcellentUnderMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, deliveryExcellentUnderMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Good (&lt; min)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={configDraft.sla.deliveryGoodUnderMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, deliveryGoodUnderMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Late (&gt; min)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={configDraft.sla.deliveryLateOverMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, deliveryLateOverMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-800 mb-2">Order SLA Breakdown (Minutes)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Order Preparation (min)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={configDraft.sla.orderPreparationMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, orderPreparationMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Order Fetching (min)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={configDraft.sla.orderFetchingMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, orderFetchingMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Rider Waiting in Store (min)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={configDraft.sla.riderWaitingInStoreMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, riderWaitingInStoreMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                          Customer Avg Serving Time (min)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={configDraft.sla.customerAvgServingTimeMin}
                          onChange={(e) =>
                            setConfigDraft({
                              ...configDraft,
                              sla: { ...configDraft.sla, customerAvgServingTimeMin: Number(e.target.value) || 0 }
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs tabular-nums"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingConfigSection(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CONFIRM DELETE                                             */}
      {/* ================================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Delete{' '}
                  {deleteTarget.type === 'store'
                    ? 'Store'
                    : deleteTarget.type === 'zone'
                    ? 'Customer Zone'
                    : 'Smart Route'}
                  ?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently remove <strong>{deleteTarget.name}</strong>?
                  {deleteTarget.type === 'store' &&
                    ' All zones and routes linked to this store will also be removed.'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDelete}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
