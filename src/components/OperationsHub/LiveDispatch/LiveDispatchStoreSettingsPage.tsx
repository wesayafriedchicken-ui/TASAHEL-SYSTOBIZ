import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Store,
  Radio,
  SlidersHorizontal,
  PackageCheck,
  ShieldAlert,
  Route as RouteIcon,
  MapPin,
  Crosshair,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Info,
  MessageSquareText,
  Coins,
  Tags
} from 'lucide-react';
import {
  DispatchStore,
  DispatchStoreConfig,
  DispatchScheduledCapacitySlot,
  DispatchCustomerZone,
  DispatchSmartRoute,
  DispatchSmartRouteZoneRef,
  getDispatchAuthHeaders,
  escapeHtml
} from './types';
import {
  ReasonsSettingsSection,
  RiderRevenueSettingsSection,
  TripsTypeSettingsSection
} from './StoreSettingsExtraTabs';

type SettingsSectionId =
  | 'store-info'
  | 'dispatching-queue'
  | 'dispatching-settings'
  | 'rider-journey'
  | 'order-abuse'
  | 'smart-routes'
  | 'customer-zones'
  | 'gps-location'
  | 'order-status-sla'
  | 'reasons'
  | 'rider-revenue'
  | 'trips-type';

const JOURNEY_ANCHORS = [
  { id: 'journey-way-to-pickup', label: 'Way to Pickup' },
  { id: 'journey-arrived-pickup', label: 'Arrived to Pickup' },
  { id: 'journey-picking-up', label: 'Picking-up Orders' },
  { id: 'journey-way-dropoff', label: 'Way to drop off' },
  { id: 'journey-arrived-dropoff', label: 'Arrived to drop off' },
  { id: 'journey-serving-time', label: 'Customer Serving Time' },
  { id: 'journey-order-delivery', label: 'Order Delivery' },
  { id: 'journey-dropoff-image', label: 'Drop-off Image Capture' },
  { id: 'journey-cant-deliver', label: "Can't Deliver Radius (Meters)" }
];

const DEFAULT_SETTINGS_CONFIG: DispatchStoreConfig = {
  dispatchingQueue: {
    queueParameter: 'Based on Rider Queue only',
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
    scheduledMaxCapacities: [],
    orderStartStatus: 'In Progress',
    maximumGroupingTimeMin: 10,
    tripCapacitySmartAutoComplete: true,
    maxTimeLimitEnabled: true,
    maxTimeLimitMin: 6,
    preventManualAssignOrderToTrip: false,
    customerZoneOption: 'Area',
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
    orderDeliveryGpsOutOfZoneAction: 'Disable the deliver button',
    orderDeliveryGeofenceRestriction: true,
    orderDeliveryGeofenceOutOfZoneAction: 'Disable the deliver button',
    failedToDeliverTripRunningAction: 'Ability to deliver it again',
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

function mergeFullConfig(cfg?: Partial<DispatchStoreConfig> | null): DispatchStoreConfig {
  const dq = { ...DEFAULT_SETTINGS_CONFIG.dispatchingQueue, ...(cfg?.dispatchingQueue || {}) };
  if (dq.queueParameter === 'Rider Queue only') {
    dq.queueParameter = 'Based on Rider Queue only';
  }
  const ds = { ...DEFAULT_SETTINGS_CONFIG.dispatchingSettings, ...(cfg?.dispatchingSettings || {}) };
  if (!Array.isArray(ds.scheduledMaxCapacities)) ds.scheduledMaxCapacities = [];
  const rj = { ...DEFAULT_SETTINGS_CONFIG.riderOrderJourney, ...(cfg?.riderOrderJourney || {}) };
  if (rj.failedToDeliverTripRunningAction === 'Enable to deliver again') {
    rj.failedToDeliverTripRunningAction = 'Ability to deliver it again';
  }
  const oa = { ...DEFAULT_SETTINGS_CONFIG.ordersAbuse, ...(cfg?.ordersAbuse || {}) };
  if (oa.distancePickupToDropoffMaxKm === undefined && oa.distancePickupToDropoffMaxMeters) {
    oa.distancePickupToDropoffMaxKm = Number((oa.distancePickupToDropoffMaxMeters / 1000).toFixed(2));
  }
  const gl = { ...DEFAULT_SETTINGS_CONFIG.gpsLocations, ...(cfg?.gpsLocations || {}) };
  const sla = { ...DEFAULT_SETTINGS_CONFIG.sla, ...(cfg?.sla || {}) };
  return {
    dispatchingQueue: dq,
    dispatchingSettings: ds,
    riderOrderJourney: rj,
    ordersAbuse: oa,
    gpsLocations: gl,
    sla
  };
}

function Switch({
  checked,
  onChange,
  disabled = false
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-emerald-600' : 'bg-slate-300'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function UnitInput({
  value,
  onChange,
  unit,
  disabled = false,
  min = 0,
  step = '1',
  prefix
}: {
  value: number;
  onChange: (v: number) => void;
  unit: string;
  disabled?: boolean;
  min?: number;
  step?: string;
  prefix?: string;
}) {
  return (
    <div
      className={`inline-flex items-center rounded-xl border overflow-hidden transition-colors ${
        disabled
          ? 'border-slate-200 bg-slate-100 text-slate-400'
          : 'border-slate-200 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
      }`}
    >
      {prefix && (
        <span className="pl-3 pr-1 text-xs font-semibold text-slate-400 select-none">
          {prefix}
        </span>
      )}
      <input
        type="number"
        min={min}
        step={step}
        disabled={disabled}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-24 px-3 py-1.5 text-xs font-semibold text-slate-800 tabular-nums bg-transparent focus:outline-none disabled:text-slate-400"
      />
      <span className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 border-l border-slate-200 select-none">
        {unit}
      </span>
    </div>
  );
}

function RadioOptionButton({
  selected,
  onClick,
  label
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
        selected
          ? 'border-teal-600 bg-teal-50/70 text-teal-900'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
          selected ? 'border-teal-600' : 'border-slate-300'
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-teal-600" />}
      </span>
      <span>{label}</span>
    </button>
  );
}

function CardFooter({
  dirty,
  saving,
  onCancel,
  onApply,
  applyLabel = 'Apply changes'
}: {
  dirty: boolean;
  saving: boolean;
  onCancel: () => void;
  onApply: () => void;
  applyLabel?: string;
}) {
  return (
    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-end gap-2">
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onCancel}
        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onApply}
        className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
      >
        {saving ? 'Saving...' : applyLabel}
      </button>
    </div>
  );
}

export function LiveDispatchStoreSettingsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSection = (searchParams.get('section') as SettingsSectionId | null) || 'dispatching-queue';
  const initialStoreId = Number(searchParams.get('storeId') || 0) || null;

  const [stores, setStores] = useState<DispatchStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(initialStoreId);
  const [zones, setZones] = useState<DispatchCustomerZone[]>([]);
  const [routes, setRoutes] = useState<DispatchSmartRoute[]>([]);

  const [activeSection, setActiveSection] = useState<SettingsSectionId>(initialSection);
  const [journeyExpanded, setJourneyExpanded] = useState<boolean>(initialSection === 'rider-journey');
  const [activeJourneyAnchor, setActiveJourneyAnchor] = useState<string>(JOURNEY_ANCHORS[0].id);

  const [draft, setDraft] = useState<DispatchStoreConfig>(DEFAULT_SETTINGS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dispatching Queue radial map refs
  const queueMapContainerRef = useRef<HTMLDivElement | null>(null);
  const queueMapRef = useRef<L.Map | null>(null);
  const queueLayersRef = useRef<L.LayerGroup | null>(null);

  // Smart Routes split-pane builder state
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [routeName, setRouteName] = useState('');
  const [selectedRouteZones, setSelectedRouteZones] = useState<DispatchSmartRouteZoneRef[]>([]);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [availableZoneFilter, setAvailableZoneFilter] = useState('');

  // Store Info inline edit state
  const [storeInfoForm, setStoreInfoForm] = useState({
    name: '',
    brand: '',
    code: '',
    city: '',
    address: '',
    lat: '',
    lng: ''
  });

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

  const savedConfig = useMemo(() => mergeFullConfig(selectedStore?.config), [selectedStore]);

  // Fetch stores
  const fetchStores = useCallback(async () => {
    setLoading(true);
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
      notify('error', err?.message || 'Unable to load store settings.');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchStoreSubData = useCallback(async (storeId: number) => {
    try {
      const [zRes, rRes] = await Promise.all([
        fetch(`/api/operations/live-dispatch/stores/${storeId}/zones`, {
          headers: getDispatchAuthHeaders(false)
        }),
        fetch(`/api/operations/live-dispatch/stores/${storeId}/routes`, {
          headers: getDispatchAuthHeaders(false)
        })
      ]);
      const zData = zRes.ok ? await zRes.json() : [];
      const rData = rRes.ok ? await rRes.json() : [];
      setZones(Array.isArray(zData) ? zData : []);
      setRoutes(Array.isArray(rData) ? rData : []);
    } catch {
      notify('error', 'Failed to load store zones and routes.');
    }
  }, [notify]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore) {
      setDraft(mergeFullConfig(selectedStore.config));
      setStoreInfoForm({
        name: selectedStore.name || '',
        brand: selectedStore.brand || '',
        code: selectedStore.code || '',
        city: selectedStore.city || '',
        address: selectedStore.address || '',
        lat: String(selectedStore.lat ?? 29.99884),
        lng: String(selectedStore.lng ?? 31.159592)
      });
      fetchStoreSubData(selectedStore.id);
    }
  }, [selectedStore, fetchStoreSubData]);

  // Keep URL query synced subtly
  const switchSection = (sec: SettingsSectionId) => {
    setActiveSection(sec);
    if (sec === 'rider-journey') setJourneyExpanded(true);
    const next = new URLSearchParams(searchParams);
    next.set('section', sec);
    if (selectedStore?.id) next.set('storeId', String(selectedStore.id));
    setSearchParams(next, { replace: true });
  };

  // Dispatching Queue Leaflet Map with live concentric radial circles
  useEffect(() => {
    if (activeSection !== 'dispatching-queue' || !selectedStore || !queueMapContainerRef.current) {
      if (queueMapRef.current) {
        queueMapRef.current.remove();
        queueMapRef.current = null;
        queueLayersRef.current = null;
      }
      return;
    }

    const lat = Number(selectedStore.lat ?? 29.99884);
    const lng = Number(selectedStore.lng ?? 31.159592);

    let resizeTimer: number | null = null;

    if (queueMapRef.current && queueMapRef.current.getContainer() !== queueMapContainerRef.current) {
      queueMapRef.current.remove();
      queueMapRef.current = null;
      queueLayersRef.current = null;
    }

    if (!queueMapRef.current) {
      const map = L.map(queueMapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: true
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);
      queueMapRef.current = map;
      queueLayersRef.current = L.layerGroup().addTo(map);
      resizeTimer = window.setTimeout(() => {
        if (
          queueMapRef.current === map &&
          (map as any)._mapPane &&
          map.getContainer()?.isConnected
        ) {
          map.invalidateSize();
        }
      }, 120);
    } else if ((queueMapRef.current as any)._mapPane) {
      queueMapRef.current.setView([lat, lng], queueMapRef.current.getZoom(), { animate: true });
    }

    const layerGroup = queueLayersRef.current!;
    layerGroup.clearLayers();

    // Draw radial circles from largest to smallest so tooltips stay readable
    const rings: Array<{ meters: number; label: string; color: string }> = [
      {
        meters: Number(draft.dispatchingQueue.farFromPickupMeters || 0),
        label: 'Far from Pickup',
        color: '#d97706'
      },
      {
        meters: Number(draft.dispatchingQueue.inRangeOfPickupMeters || 0),
        label: 'In Range of Pickup',
        color: '#0284c7'
      },
      {
        meters: Number(draft.dispatchingQueue.closeToPickupMeters || 0),
        label: 'Close to Pickup',
        color: '#0d9488'
      }
    ];

    rings.forEach((r) => {
      if (r.meters > 0) {
        L.circle([lat, lng], {
          radius: r.meters,
          color: r.color,
          weight: 2,
          fillColor: r.color,
          fillOpacity: 0.08
        })
          .bindTooltip(`${r.label}: ${r.meters.toLocaleString()} m`, { sticky: true })
          .addTo(layerGroup);
      }
    });

    const storeIcon = L.divIcon({
      className: 'store-queue-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:12px;background:#e11d48;color:#fff;border:3px solid #fff;box-shadow:0 6px 14px rgba(225,29,72,0.35);font-weight:700;font-size:13px;">S</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    });

    L.marker([lat, lng], { icon: storeIcon })
      .bindPopup(
        `<div style="font-family:system-ui,sans-serif;">
          <div style="font-weight:700;font-size:13px;color:#0f172a;">${escapeHtml(selectedStore.name)}</div>
          <div style="font-size:11px;color:#64748b;">${escapeHtml(selectedStore.address || selectedStore.city)}</div>
        </div>`
      )
      .addTo(layerGroup);

    return () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
      }
    };
  }, [
    activeSection,
    selectedStore,
    draft.dispatchingQueue.closeToPickupMeters,
    draft.dispatchingQueue.inRangeOfPickupMeters,
    draft.dispatchingQueue.farFromPickupMeters
  ]);

  useEffect(() => {
    return () => {
      if (queueMapRef.current) {
        queueMapRef.current.remove();
        queueMapRef.current = null;
        queueLayersRef.current = null;
      }
    };
  }, []);

  // Save a config subsection to MySQL
  const saveConfigPatch = async (
    sectionKey: keyof DispatchStoreConfig,
    partialData: Record<string, any>,
    saveId: string,
    successMessage: string
  ) => {
    if (!selectedStore) return;
    setSavingKey(saveId);
    try {
      const res = await fetch(`/api/operations/live-dispatch/stores/${selectedStore.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          config: {
            [sectionKey]: partialData
          }
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save changes');
      }
      const updated: DispatchStore = await res.json();
      setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      notify('success', successMessage);
    } catch (err: any) {
      notify('error', err?.message || 'Unable to save settings.');
    } finally {
      setSavingKey(null);
    }
  };

  // Save Store Info inline
  const handleSaveStoreInfo = async () => {
    if (!selectedStore || !storeInfoForm.name.trim()) {
      notify('error', 'Store name is required.');
      return;
    }
    setSavingKey('store-info');
    try {
      const res = await fetch(`/api/operations/live-dispatch/stores/${selectedStore.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          name: storeInfoForm.name.trim(),
          brand: storeInfoForm.brand.trim(),
          code: storeInfoForm.code.trim(),
          city: storeInfoForm.city.trim(),
          address: storeInfoForm.address.trim(),
          lat: Number(storeInfoForm.lat) || selectedStore.lat,
          lng: Number(storeInfoForm.lng) || selectedStore.lng
        })
      });
      if (!res.ok) throw new Error('Failed to save store info');
      const updated: DispatchStore = await res.json();
      setStores((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      notify('success', 'Store info updated.');
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save store info.');
    } finally {
      setSavingKey(null);
    }
  };

  // Save Smart Route from split-pane builder
  const handleSaveSmartRoute = async () => {
    if (!selectedStore || !routeName.trim()) {
      notify('error', 'Please enter a route name.');
      return;
    }
    setSavingKey('smart-route');
    try {
      const isEdit = editingRouteId !== null;
      const url = isEdit
        ? `/api/operations/live-dispatch/routes/${editingRouteId}`
        : `/api/operations/live-dispatch/stores/${selectedStore.id}/routes`;
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          name: routeName.trim(),
          zones: selectedRouteZones,
          is_active: true
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save smart route');
      }
      const saved: DispatchSmartRoute = await res.json();
      if (isEdit) {
        setRoutes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
        notify('success', `Route "${saved.name}" updated.`);
      } else {
        setRoutes((prev) => [...prev, saved]);
        setRouteName('');
        setSelectedRouteZones([]);
        notify('success', `Route "${saved.name}" created.`);
      }
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save route.');
    } finally {
      setSavingKey(null);
    }
  };

  const resetRouteBuilder = () => {
    setEditingRouteId(null);
    setRouteName('');
    setSelectedRouteZones([]);
  };

  const loadRouteIntoBuilder = (route: DispatchSmartRoute) => {
    setEditingRouteId(route.id);
    setRouteName(route.name || '');
    setSelectedRouteZones(Array.isArray(route.zones) ? [...route.zones] : []);
  };

  const scrollToJourneyCard = (anchorId: string) => {
    setActiveJourneyAnchor(anchorId);
    if (activeSection !== 'rider-journey') {
      switchSection('rider-journey');
      window.setTimeout(() => {
        document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dirty helpers for clean Apply/Cancel state
  const isQueueDirty =
    JSON.stringify(draft.dispatchingQueue) !== JSON.stringify(savedConfig.dispatchingQueue);
  const isCapacityDirty =
    draft.dispatchingSettings.limitMaxTripCapacity !== savedConfig.dispatchingSettings.limitMaxTripCapacity ||
    draft.dispatchingSettings.defaultTripCapacity !== savedConfig.dispatchingSettings.defaultTripCapacity ||
    JSON.stringify(draft.dispatchingSettings.scheduledMaxCapacities || []) !==
      JSON.stringify(savedConfig.dispatchingSettings.scheduledMaxCapacities || []);
  const isSmartAutoDirty =
    draft.dispatchingSettings.tripCapacitySmartAutoComplete !==
      savedConfig.dispatchingSettings.tripCapacitySmartAutoComplete ||
    draft.dispatchingSettings.maxTimeLimitEnabled !== savedConfig.dispatchingSettings.maxTimeLimitEnabled ||
    draft.dispatchingSettings.maxTimeLimitMin !== savedConfig.dispatchingSettings.maxTimeLimitMin ||
    draft.dispatchingSettings.preventManualAssignOrderToTrip !==
      savedConfig.dispatchingSettings.preventManualAssignOrderToTrip;
  const isStartStatusDirty =
    draft.dispatchingSettings.orderStartStatus !== savedConfig.dispatchingSettings.orderStartStatus ||
    draft.dispatchingSettings.maximumGroupingTimeMin !==
      savedConfig.dispatchingSettings.maximumGroupingTimeMin;
  const isZoneOptionDirty =
    draft.dispatchingSettings.customerZoneOption !== savedConfig.dispatchingSettings.customerZoneOption;
  const isExpirationDirty =
    draft.dispatchingSettings.expirationTimeEnabled !== savedConfig.dispatchingSettings.expirationTimeEnabled ||
    draft.dispatchingSettings.expirationTimeMin !== savedConfig.dispatchingSettings.expirationTimeMin;
  const isMinBetweenTripsDirty =
    draft.dispatchingSettings.minimumTimeBetweenTripsEnabled !==
      savedConfig.dispatchingSettings.minimumTimeBetweenTripsEnabled ||
    draft.dispatchingSettings.minimumTimeBetweenTripsMin !==
      savedConfig.dispatchingSettings.minimumTimeBetweenTripsMin;
  const isAbuseDirty =
    JSON.stringify(draft.ordersAbuse) !== JSON.stringify(savedConfig.ordersAbuse);
  const isGpsLocDirty =
    draft.gpsLocations.closeToFirstOrderMeters !== savedConfig.gpsLocations.closeToFirstOrderMeters ||
    draft.gpsLocations.withinRangeOfFirstOrderMeters !==
      savedConfig.gpsLocations.withinRangeOfFirstOrderMeters;
  const isDeliveryTargetDirty =
    draft.sla.deliveryExcellentUnderMin !== savedConfig.sla.deliveryExcellentUnderMin ||
    draft.sla.deliveryGoodUnderMin !== savedConfig.sla.deliveryGoodUnderMin ||
    draft.sla.deliveryLateOverMin !== savedConfig.sla.deliveryLateOverMin;
  const isOrderStatusSlaDirty =
    draft.sla.orderPreparationMin !== savedConfig.sla.orderPreparationMin ||
    draft.sla.orderFetchingMin !== savedConfig.sla.orderFetchingMin ||
    draft.sla.onMyWayToPickupMin !== savedConfig.sla.onMyWayToPickupMin ||
    draft.sla.arriveToPickupMin !== savedConfig.sla.arriveToPickupMin ||
    draft.sla.riderWaitingInStoreMin !== savedConfig.sla.riderWaitingInStoreMin ||
    draft.sla.pickedUpTimeMin !== savedConfig.sla.pickedUpTimeMin ||
    draft.sla.arriveToCustomerMin !== savedConfig.sla.arriveToCustomerMin ||
    draft.sla.customerAvgServingTimeMin !== savedConfig.sla.customerAvgServingTimeMin;

  const isStoreInfoDirty =
    selectedStore &&
    (storeInfoForm.name !== (selectedStore.name || '') ||
      storeInfoForm.brand !== (selectedStore.brand || '') ||
      storeInfoForm.code !== (selectedStore.code || '') ||
      storeInfoForm.city !== (selectedStore.city || '') ||
      storeInfoForm.address !== (selectedStore.address || '') ||
      storeInfoForm.lat !== String(selectedStore.lat ?? 29.99884) ||
      storeInfoForm.lng !== String(selectedStore.lng ?? 31.159592));

  // Add Scheduled Capacity Time Slot
  const handleAddTimeSlot = () => {
    const nextSlot: DispatchScheduledCapacitySlot = {
      id: `slot-${Date.now()}`,
      days: 'Daily',
      fromTime: '12:00',
      toTime: '16:00',
      maxCapacity: draft.dispatchingSettings.limitMaxTripCapacity || 3
    };
    setDraft((prev) => ({
      ...prev,
      dispatchingSettings: {
        ...prev.dispatchingSettings,
        scheduledMaxCapacities: [...(prev.dispatchingSettings.scheduledMaxCapacities || []), nextSlot]
      }
    }));
  };

  // Filtered zones for Smart Routes split-pane
  const filteredAvailableZones = useMemo(() => {
    const q = availableZoneFilter.trim().toLowerCase();
    return zones.filter((z) => (!q ? true : z.name.toLowerCase().includes(q)));
  }, [zones, availableZoneFilter]);

  const filteredSelectedZones = useMemo(() => {
    const q = selectedZoneFilter.trim().toLowerCase();
    return selectedRouteZones
      .map((rz, idx) => ({ ...rz, originalIndex: idx }))
      .filter((rz) => (!q ? true : rz.name.toLowerCase().includes(q)));
  }, [selectedRouteZones, selectedZoneFilter]);

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[120] flex items-center gap-2.5 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-semibold ${
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
        {/* Left Structured Settings Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-hidden lg:sticky lg:top-20">
          {/* Header & Store Selector */}
          <div className="bg-teal-700 px-4 py-3.5 text-white space-y-2.5">
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/operations-hub/LiveDispatchSystem/Store${
                    selectedStore?.id ? `?storeId=${selectedStore.id}&tab=config` : ''
                  }`
                )
              }
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-100 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
            <div>
              <div className="text-sm font-bold leading-tight">Store Settings</div>
              <div className="text-[11px] text-teal-100/90 mt-0.5 truncate">
                {selectedStore?.name || 'Loading...'}
              </div>
            </div>
            <select
              value={selectedStore?.id ?? ''}
              onChange={(e) => setSelectedStoreId(Number(e.target.value))}
              disabled={loading || stores.length === 0}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:bg-teal-800"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id} className="text-slate-900">
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Grouped Settings Navigation */}
          <nav className="p-2.5 space-y-3 text-xs">
            {/* Store Info */}
            <button
              type="button"
              onClick={() => switchSection('store-info')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                activeSection === 'store-info'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Store className={`w-4 h-4 shrink-0 ${activeSection === 'store-info' ? 'text-white' : 'text-slate-400'}`} />
              <span>Store Info</span>
            </button>

            {/* Automated Orders Group */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Automated Orders
              </div>
              <button
                type="button"
                onClick={() => switchSection('dispatching-queue')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'dispatching-queue'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Radio className={`w-4 h-4 shrink-0 ${activeSection === 'dispatching-queue' ? 'text-white' : 'text-slate-400'}`} />
                <span>Dispatching Queue</span>
              </button>
              <button
                type="button"
                onClick={() => switchSection('dispatching-settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'dispatching-settings'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className={`w-4 h-4 shrink-0 ${activeSection === 'dispatching-settings' ? 'text-white' : 'text-slate-400'}`} />
                <span>Dispatching Settings</span>
              </button>
            </div>

            {/* Rider & Orders Group */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Rider &amp; Orders
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (activeSection === 'rider-journey') {
                      setJourneyExpanded((p) => !p);
                    } else {
                      switchSection('rider-journey');
                      setJourneyExpanded(true);
                    }
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                    activeSection === 'rider-journey'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <PackageCheck className={`w-4 h-4 shrink-0 ${activeSection === 'rider-journey' ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">Orders Rider Journey</span>
                  </span>
                  {journeyExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
                {journeyExpanded && (
                  <div className="mt-1 ml-3 pl-3 border-l border-slate-200 space-y-0.5">
                    {JOURNEY_ANCHORS.map((anchor) => (
                      <button
                        key={anchor.id}
                        type="button"
                        onClick={() => scrollToJourneyCard(anchor.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                          activeSection === 'rider-journey' && activeJourneyAnchor === anchor.id
                            ? 'bg-teal-50 text-teal-800 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            activeSection === 'rider-journey' && activeJourneyAnchor === anchor.id
                              ? 'bg-teal-600'
                              : 'bg-slate-300'
                          }`}
                        />
                        <span className="truncate">{anchor.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => switchSection('order-abuse')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'order-abuse'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <ShieldAlert className={`w-4 h-4 shrink-0 ${activeSection === 'order-abuse' ? 'text-white' : 'text-slate-400'}`} />
                <span>Order Abuse</span>
              </button>
            </div>

            {/* Route Optimization Group */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Route Optimization
              </div>
              <button
                type="button"
                onClick={() => switchSection('smart-routes')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'smart-routes'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <RouteIcon className={`w-4 h-4 shrink-0 ${activeSection === 'smart-routes' ? 'text-white' : 'text-slate-400'}`} />
                  <span>Smart Routes</span>
                </span>
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    activeSection === 'smart-routes' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {routes.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => switchSection('customer-zones')}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'customer-zones'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className={`w-4 h-4 shrink-0 ${activeSection === 'customer-zones' ? 'text-white' : 'text-slate-400'}`} />
                  <span>Customer Zones</span>
                </span>
                <span
                  className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded ${
                    activeSection === 'customer-zones' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {zones.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => switchSection('gps-location')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'gps-location'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Crosshair className={`w-4 h-4 shrink-0 ${activeSection === 'gps-location' ? 'text-white' : 'text-slate-400'}`} />
                <span>GPS Location</span>
              </button>
            </div>

            {/* Order Status SLA & Operations Rules */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <button
                type="button"
                onClick={() => switchSection('order-status-sla')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'order-status-sla'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock className={`w-4 h-4 shrink-0 ${activeSection === 'order-status-sla' ? 'text-white' : 'text-slate-400'}`} />
                <span>Order Status SLA</span>
              </button>

              <button
                type="button"
                onClick={() => switchSection('reasons')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'reasons'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MessageSquareText className={`w-4 h-4 shrink-0 ${activeSection === 'reasons' ? 'text-white' : 'text-slate-400'}`} />
                <span>Reasons</span>
              </button>

              <button
                type="button"
                onClick={() => switchSection('rider-revenue')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'rider-revenue'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Coins className={`w-4 h-4 shrink-0 ${activeSection === 'rider-revenue' ? 'text-white' : 'text-slate-400'}`} />
                <span>Rider Revenue</span>
              </button>

              <button
                type="button"
                onClick={() => switchSection('trips-type')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition-colors cursor-pointer ${
                  activeSection === 'trips-type'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Tags className={`w-4 h-4 shrink-0 ${activeSection === 'trips-type' ? 'text-white' : 'text-slate-400'}`} />
                <span>Trips Type</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Settings Content Viewport */}
        <main className="flex-1 min-w-0 w-full space-y-4">
          {activeSection === 'reasons' ? (
            <ReasonsSettingsSection onNotify={notify} />
          ) : activeSection === 'rider-revenue' ? (
            <RiderRevenueSettingsSection onNotify={notify} />
          ) : activeSection === 'trips-type' ? (
            <TripsTypeSettingsSection onNotify={notify} />
          ) : loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
              Loading store settings...
            </div>
          ) : !selectedStore ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
              No store selected. Return to Store management to create a store first.
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* 1. STORE INFO                                             */}
              {/* ========================================================= */}
              {activeSection === 'store-info' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Store Info</h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Edit store identity and pickup coordinates
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/operations-hub/LiveDispatchSystem/Store?storeId=${selectedStore.id}&tab=info`)
                      }
                      className="text-xs font-semibold text-teal-700 hover:underline cursor-pointer"
                    >
                      Open Map View
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Store Name *</label>
                      <input
                        type="text"
                        value={storeInfoForm.name}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
                      <input
                        type="text"
                        value={storeInfoForm.brand}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, brand: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Store Code</label>
                      <input
                        type="text"
                        value={storeInfoForm.code}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, code: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                      <input
                        type="text"
                        value={storeInfoForm.city}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={storeInfoForm.address}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, address: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={storeInfoForm.lat}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, lat: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={storeInfoForm.lng}
                        onChange={(e) => setStoreInfoForm({ ...storeInfoForm, lng: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <CardFooter
                    dirty={Boolean(isStoreInfoDirty)}
                    saving={savingKey === 'store-info'}
                    onCancel={() =>
                      setStoreInfoForm({
                        name: selectedStore.name || '',
                        brand: selectedStore.brand || '',
                        code: selectedStore.code || '',
                        city: selectedStore.city || '',
                        address: selectedStore.address || '',
                        lat: String(selectedStore.lat ?? 29.99884),
                        lng: String(selectedStore.lng ?? 31.159592)
                      })
                    }
                    onApply={handleSaveStoreInfo}
                  />
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. DISPATCHING QUEUE (WITH LIVE RADIAL MAP)               */}
              {/* ========================================================= */}
              {activeSection === 'dispatching-queue' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">Dispatching Queue</h2>
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-5">
                    {/* Left controls */}
                    <div className="xl:col-span-6 space-y-5">
                      <div className="space-y-2.5">
                        <div className="text-xs font-bold text-slate-800">Dispatching Queue</div>
                        <div className="flex flex-wrap gap-2.5">
                          <RadioOptionButton
                            selected={draft.dispatchingQueue.queueParameter === 'Based on Rider Queue only'}
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingQueue: {
                                  ...p.dispatchingQueue,
                                  queueParameter: 'Based on Rider Queue only'
                                }
                              }))
                            }
                            label="Based on Rider Queue only"
                          />
                          <RadioOptionButton
                            selected={
                              draft.dispatchingQueue.queueParameter ===
                              'Based on Rider Queue and Rider Location Together'
                            }
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingQueue: {
                                  ...p.dispatchingQueue,
                                  queueParameter: 'Based on Rider Queue and Rider Location Together'
                                }
                              }))
                            }
                            label="Based on Rider Queue and Rider Location Together"
                          />
                        </div>
                      </div>

                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-teal-700">Rider GPS Location</div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                            <span className="text-xs font-bold text-slate-800">Close to Pickup</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            The Radial Distance around the store (set 0 to disable)
                          </p>
                          <UnitInput
                            value={draft.dispatchingQueue.closeToPickupMeters}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingQueue: {
                                  ...p.dispatchingQueue,
                                  closeToPickupMeters: v,
                                  closeToPickupEnabled: v > 0
                                }
                              }))
                            }
                            unit="Meter."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                            <span className="text-xs font-bold text-slate-800">In Range of Pickup</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            The Next Radial Distance around the store
                          </p>
                          <UnitInput
                            value={draft.dispatchingQueue.inRangeOfPickupMeters}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingQueue: {
                                  ...p.dispatchingQueue,
                                  inRangeOfPickupMeters: v,
                                  inRangeOfPickupEnabled: v > 0
                                }
                              }))
                            }
                            unit="Meter."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                            <span className="text-xs font-bold text-slate-800">Far from Pickup</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            The Third Radial Distance around the store
                          </p>
                          <UnitInput
                            value={draft.dispatchingQueue.farFromPickupMeters}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingQueue: {
                                  ...p.dispatchingQueue,
                                  farFromPickupMeters: v,
                                  farFromPickupEnabled: v > 0
                                }
                              }))
                            }
                            unit="Meter."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right live Leaflet map */}
                    <div className="xl:col-span-6">
                      <div
                        ref={queueMapContainerRef}
                        className="w-full h-[380px] rounded-xl border border-slate-200 overflow-hidden z-0"
                      />
                    </div>
                  </div>

                  <CardFooter
                    dirty={isQueueDirty}
                    saving={savingKey === 'queue'}
                    onCancel={() =>
                      setDraft((p) => ({ ...p, dispatchingQueue: savedConfig.dispatchingQueue }))
                    }
                    onApply={() =>
                      saveConfigPatch(
                        'dispatchingQueue',
                        draft.dispatchingQueue,
                        'queue',
                        'Dispatching Queue settings saved.'
                      )
                    }
                  />
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. DISPATCHING SETTINGS (6 CARDS)                         */}
              {/* ========================================================= */}
              {activeSection === 'dispatching-settings' && (
                <div className="space-y-4">
                  {/* Card 1: Trip Capacity */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-teal-700">Trip Capacity</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {/* Limit Max Trip Capacity */}
                      <div className="py-4 space-y-2">
                        <div className="text-xs font-bold text-slate-900">Limit Max Trip Capacity</div>
                        <p className="text-[11px] text-slate-500">
                          The maximum limit that the default trip capacity can be adjusted to.
                        </p>
                        <div className="inline-flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => {
                                const nextMax = Math.max(1, (p.dispatchingSettings.limitMaxTripCapacity || 3) - 1);
                                return {
                                  ...p,
                                  dispatchingSettings: {
                                    ...p.dispatchingSettings,
                                    limitMaxTripCapacity: nextMax,
                                    defaultTripCapacity: Math.min(p.dispatchingSettings.defaultTripCapacity, nextMax)
                                  }
                                };
                              })
                            }
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 py-1.5 text-xs font-bold text-slate-900 tabular-nums border-x border-slate-200">
                            {draft.dispatchingSettings.limitMaxTripCapacity ?? 3}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingSettings: {
                                  ...p.dispatchingSettings,
                                  limitMaxTripCapacity: (p.dispatchingSettings.limitMaxTripCapacity || 3) + 1
                                }
                              }))
                            }
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Default Trip Capacity */}
                      <div className="py-4 space-y-2">
                        <div className="text-xs font-bold text-slate-900">Default Trip Capacity</div>
                        <p className="text-[11px] text-slate-500">
                          The maximum number of orders that can be assigned to a trip.
                        </p>
                        <div className="inline-flex items-center rounded-xl border border-slate-200 overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingSettings: {
                                  ...p.dispatchingSettings,
                                  defaultTripCapacity: Math.max(1, p.dispatchingSettings.defaultTripCapacity - 1)
                                }
                              }))
                            }
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 py-1.5 text-xs font-bold text-slate-900 tabular-nums border-x border-slate-200">
                            {draft.dispatchingSettings.defaultTripCapacity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingSettings: {
                                  ...p.dispatchingSettings,
                                  defaultTripCapacity: Math.min(
                                    p.dispatchingSettings.limitMaxTripCapacity || 10,
                                    p.dispatchingSettings.defaultTripCapacity + 1
                                  )
                                }
                              }))
                            }
                            className="px-3 py-1.5 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Scheduled Maximum Capacity */}
                      <div className="py-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-slate-900">Scheduled Maximum Capacity</div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Alter the maximum trip capacity according to specific time slots. Outside these time slots the trip capacity will revert back to above default maximum capacity.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddTimeSlot}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Time Slot</span>
                          </button>
                        </div>

                        {(draft.dispatchingSettings.scheduledMaxCapacities || []).length > 0 && (
                          <div className="space-y-2">
                            {(draft.dispatchingSettings.scheduledMaxCapacities || []).map((slot, idx) => (
                              <div
                                key={slot.id}
                                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center gap-3"
                              >
                                <select
                                  value={slot.days}
                                  onChange={(e) =>
                                    setDraft((p) => {
                                      const next = [...(p.dispatchingSettings.scheduledMaxCapacities || [])];
                                      next[idx] = { ...next[idx], days: e.target.value };
                                      return {
                                        ...p,
                                        dispatchingSettings: { ...p.dispatchingSettings, scheduledMaxCapacities: next }
                                      };
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                                >
                                  <option value="Daily">Daily</option>
                                  <option value="Weekdays">Weekdays (Sun - Thu)</option>
                                  <option value="Weekends">Weekends (Fri - Sat)</option>
                                </select>
                                <input
                                  type="time"
                                  value={slot.fromTime}
                                  onChange={(e) =>
                                    setDraft((p) => {
                                      const next = [...(p.dispatchingSettings.scheduledMaxCapacities || [])];
                                      next[idx] = { ...next[idx], fromTime: e.target.value };
                                      return {
                                        ...p,
                                        dispatchingSettings: { ...p.dispatchingSettings, scheduledMaxCapacities: next }
                                      };
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                                />
                                <span className="text-xs text-slate-400">to</span>
                                <input
                                  type="time"
                                  value={slot.toTime}
                                  onChange={(e) =>
                                    setDraft((p) => {
                                      const next = [...(p.dispatchingSettings.scheduledMaxCapacities || [])];
                                      next[idx] = { ...next[idx], toTime: e.target.value };
                                      return {
                                        ...p,
                                        dispatchingSettings: { ...p.dispatchingSettings, scheduledMaxCapacities: next }
                                      };
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs tabular-nums"
                                />
                                <UnitInput
                                  value={slot.maxCapacity}
                                  min={1}
                                  onChange={(v) =>
                                    setDraft((p) => {
                                      const next = [...(p.dispatchingSettings.scheduledMaxCapacities || [])];
                                      next[idx] = { ...next[idx], maxCapacity: Math.max(1, v) };
                                      return {
                                        ...p,
                                        dispatchingSettings: { ...p.dispatchingSettings, scheduledMaxCapacities: next }
                                      };
                                    })
                                  }
                                  unit="Orders"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setDraft((p) => ({
                                      ...p,
                                      dispatchingSettings: {
                                        ...p.dispatchingSettings,
                                        scheduledMaxCapacities: (
                                          p.dispatchingSettings.scheduledMaxCapacities || []
                                        ).filter((_, i) => i !== idx)
                                      }
                                    }))
                                  }
                                  className="ml-auto p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <CardFooter
                      dirty={isCapacityDirty}
                      saving={savingKey === 'ds-capacity'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          dispatchingSettings: {
                            ...p.dispatchingSettings,
                            limitMaxTripCapacity: savedConfig.dispatchingSettings.limitMaxTripCapacity,
                            defaultTripCapacity: savedConfig.dispatchingSettings.defaultTripCapacity,
                            scheduledMaxCapacities: savedConfig.dispatchingSettings.scheduledMaxCapacities
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'dispatchingSettings',
                          {
                            limitMaxTripCapacity: draft.dispatchingSettings.limitMaxTripCapacity,
                            defaultTripCapacity: draft.dispatchingSettings.defaultTripCapacity,
                            scheduledMaxCapacities: draft.dispatchingSettings.scheduledMaxCapacities
                          },
                          'ds-capacity',
                          'Trip Capacity saved.'
                        )
                      }
                    />
                  </div>

                  {/* Card 2: Trip Capacity Smart Auto-Complete */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.dispatchingSettings.tripCapacitySmartAutoComplete}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dispatchingSettings: {
                              ...p.dispatchingSettings,
                              tripCapacitySmartAutoComplete: v
                            }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Trip Capacity Smart Auto-Complete</h3>
                    </div>
                    <div className="pt-4 space-y-4">
                      <p className="text-xs text-slate-500">
                        Enable smart auto-complete to add to non-pickup trip until reaching the maximum capacity.
                      </p>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={draft.dispatchingSettings.maxTimeLimitEnabled}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingSettings: { ...p.dispatchingSettings, maxTimeLimitEnabled: v }
                              }))
                            }
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            Limit smart auto complete with max duration
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-600">Max Duration *</div>
                          <UnitInput
                            value={draft.dispatchingSettings.maxTimeLimitMin}
                            disabled={!draft.dispatchingSettings.maxTimeLimitEnabled}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                dispatchingSettings: { ...p.dispatchingSettings, maxTimeLimitMin: v }
                              }))
                            }
                            unit="min."
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 pt-1">
                        <Switch
                          checked={Boolean(draft.dispatchingSettings.preventManualAssignOrderToTrip)}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              dispatchingSettings: {
                                ...p.dispatchingSettings,
                                preventManualAssignOrderToTrip: v
                              }
                            }))
                          }
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          Prevent Manual Assign Order To Trip
                        </span>
                      </div>
                    </div>
                    <CardFooter
                      dirty={isSmartAutoDirty}
                      saving={savingKey === 'ds-smart'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          dispatchingSettings: {
                            ...p.dispatchingSettings,
                            tripCapacitySmartAutoComplete:
                              savedConfig.dispatchingSettings.tripCapacitySmartAutoComplete,
                            maxTimeLimitEnabled: savedConfig.dispatchingSettings.maxTimeLimitEnabled,
                            maxTimeLimitMin: savedConfig.dispatchingSettings.maxTimeLimitMin,
                            preventManualAssignOrderToTrip:
                              savedConfig.dispatchingSettings.preventManualAssignOrderToTrip
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'dispatchingSettings',
                          {
                            tripCapacitySmartAutoComplete:
                              draft.dispatchingSettings.tripCapacitySmartAutoComplete,
                            maxTimeLimitEnabled: draft.dispatchingSettings.maxTimeLimitEnabled,
                            maxTimeLimitMin: draft.dispatchingSettings.maxTimeLimitMin,
                            preventManualAssignOrderToTrip:
                              draft.dispatchingSettings.preventManualAssignOrderToTrip
                          },
                          'ds-smart',
                          'Smart Auto-Complete settings saved.'
                        )
                      }
                    />
                  </div>

                  {/* Card 3: Start Status & Maximum Grouping Time */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-teal-700">
                        Start Status &amp; Maximum Grouping Time
                      </h3>
                    </div>
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">Order Start Status</label>
                        <select
                          value={draft.dispatchingSettings.orderStartStatus}
                          onChange={(e) =>
                            setDraft((p) => ({
                              ...p,
                              dispatchingSettings: {
                                ...p.dispatchingSettings,
                                orderStartStatus: e.target.value
                              }
                            }))
                          }
                          className="w-full max-w-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Ready">Ready</option>
                          <option value="On Trip">On Trip</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-800">
                          Maximum Grouping Time
                        </label>
                        <UnitInput
                          value={draft.dispatchingSettings.maximumGroupingTimeMin ?? 10}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              dispatchingSettings: {
                                ...p.dispatchingSettings,
                                maximumGroupingTimeMin: v
                              }
                            }))
                          }
                          unit="min."
                        />
                      </div>
                    </div>
                    <CardFooter
                      dirty={isStartStatusDirty}
                      saving={savingKey === 'ds-start'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          dispatchingSettings: {
                            ...p.dispatchingSettings,
                            orderStartStatus: savedConfig.dispatchingSettings.orderStartStatus,
                            maximumGroupingTimeMin: savedConfig.dispatchingSettings.maximumGroupingTimeMin
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'dispatchingSettings',
                          {
                            orderStartStatus: draft.dispatchingSettings.orderStartStatus,
                            maximumGroupingTimeMin: draft.dispatchingSettings.maximumGroupingTimeMin
                          },
                          'ds-start',
                          'Start Status & Grouping Time saved.'
                        )
                      }
                    />
                  </div>

                  {/* Card 4: Customer Zone Options */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-teal-700">Customer Zone Options</h3>
                    </div>
                    <div className="pt-4 flex flex-wrap gap-2.5">
                      {(['Area', 'Street'] as const).map((opt) => (
                        <RadioOptionButton
                          key={opt}
                          selected={(draft.dispatchingSettings.customerZoneOption || 'Area') === opt}
                          onClick={() =>
                            setDraft((p) => ({
                              ...p,
                              dispatchingSettings: {
                                ...p.dispatchingSettings,
                                customerZoneOption: opt
                              }
                            }))
                          }
                          label={opt}
                        />
                      ))}
                    </div>
                    <CardFooter
                      dirty={isZoneOptionDirty}
                      saving={savingKey === 'ds-zone-opt'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          dispatchingSettings: {
                            ...p.dispatchingSettings,
                            customerZoneOption: savedConfig.dispatchingSettings.customerZoneOption
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'dispatchingSettings',
                          { customerZoneOption: draft.dispatchingSettings.customerZoneOption },
                          'ds-zone-opt',
                          'Customer Zone Option saved.'
                        )
                      }
                    />
                  </div>

                  {/* Card 5: Expiration time */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={Boolean(draft.dispatchingSettings.expirationTimeEnabled)}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dispatchingSettings: { ...p.dispatchingSettings, expirationTimeEnabled: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Expiration time</h3>
                    </div>
                    <div className="pt-4 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">Expiration time</div>
                      <UnitInput
                        value={draft.dispatchingSettings.expirationTimeMin ?? 0}
                        disabled={!draft.dispatchingSettings.expirationTimeEnabled}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dispatchingSettings: { ...p.dispatchingSettings, expirationTimeMin: v }
                          }))
                        }
                        unit="min."
                      />
                    </div>
                    <CardFooter
                      dirty={isExpirationDirty}
                      saving={savingKey === 'ds-exp'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          dispatchingSettings: {
                            ...p.dispatchingSettings,
                            expirationTimeEnabled: savedConfig.dispatchingSettings.expirationTimeEnabled,
                            expirationTimeMin: savedConfig.dispatchingSettings.expirationTimeMin
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'dispatchingSettings',
                          {
                            expirationTimeEnabled: draft.dispatchingSettings.expirationTimeEnabled,
                            expirationTimeMin: draft.dispatchingSettings.expirationTimeMin
                          },
                          'ds-exp',
                          'Expiration time saved.'
                        )
                      }
                    />
                  </div>

                  {/* Card 6: Minimum Time Between Rider Trips */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.dispatchingSettings.minimumTimeBetweenTripsEnabled !== false}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dispatchingSettings: {
                              ...p.dispatchingSettings,
                              minimumTimeBetweenTripsEnabled: v
                            }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Minimum Time Between Rider Trips</h3>
                    </div>
                    <div className="pt-4 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">
                        Minimum Time Between Rider Trips *
                      </div>
                      <UnitInput
                        value={draft.dispatchingSettings.minimumTimeBetweenTripsMin}
                        disabled={draft.dispatchingSettings.minimumTimeBetweenTripsEnabled === false}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            dispatchingSettings: {
                              ...p.dispatchingSettings,
                              minimumTimeBetweenTripsMin: v
                            }
                          }))
                        }
                        unit="min."
                      />
                    </div>
                    <CardFooter
                      dirty={isMinBetweenTripsDirty}
                      saving={savingKey === 'ds-min-trips'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          dispatchingSettings: {
                            ...p.dispatchingSettings,
                            minimumTimeBetweenTripsEnabled:
                              savedConfig.dispatchingSettings.minimumTimeBetweenTripsEnabled,
                            minimumTimeBetweenTripsMin:
                              savedConfig.dispatchingSettings.minimumTimeBetweenTripsMin
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'dispatchingSettings',
                          {
                            minimumTimeBetweenTripsEnabled:
                              draft.dispatchingSettings.minimumTimeBetweenTripsEnabled,
                            minimumTimeBetweenTripsMin: draft.dispatchingSettings.minimumTimeBetweenTripsMin
                          },
                          'ds-min-trips',
                          'Minimum time between rider trips saved.'
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. ORDERS RIDER JOURNEY (11 CARDS WITH ANCHOR NAVIGATION) */}
              {/* ========================================================= */}
              {activeSection === 'rider-journey' && (
                <div className="space-y-4">
                  {/* 1. Show on my way to pickup button */}
                  <div id="journey-way-to-pickup" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.riderOrderJourney.riderOnMyWayToPickup}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, riderOnMyWayToPickup: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Show on my way to pickup button</h3>
                    </div>
                    <p className="pt-3.5 text-xs text-slate-500">
                      Show on my way to pickup button for the rider on the mobile app.
                    </p>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.riderOnMyWayToPickup !==
                        savedConfig.riderOrderJourney.riderOnMyWayToPickup
                      }
                      saving={savingKey === 'rj-1'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            riderOnMyWayToPickup: savedConfig.riderOrderJourney.riderOnMyWayToPickup
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          { riderOnMyWayToPickup: draft.riderOrderJourney.riderOnMyWayToPickup },
                          'rj-1',
                          'Way to Pickup setting saved.'
                        )
                      }
                    />
                  </div>

                  {/* 2. Show Arrive to pickup button */}
                  <div id="journey-arrived-pickup" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.riderOrderJourney.arrivedToPickup}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, arrivedToPickup: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Show Arrive to pickup button</h3>
                    </div>
                    <div className="pt-4 space-y-3.5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={Boolean(draft.riderOrderJourney.arrivedToPickupDistanceRestriction)}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  arrivedToPickupDistanceRestriction: v
                                }
                              }))
                            }
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            Arrived to Pickup Distance Restriction
                          </span>
                        </div>
                        <UnitInput
                          value={draft.riderOrderJourney.arrivedToPickupDistanceMeters ?? 0}
                          disabled={!draft.riderOrderJourney.arrivedToPickupDistanceRestriction}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              riderOrderJourney: {
                                ...p.riderOrderJourney,
                                arrivedToPickupDistanceMeters: v
                              }
                            }))
                          }
                          unit="Meter."
                        />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={Boolean(draft.riderOrderJourney.automaticArriveToPickup)}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              riderOrderJourney: { ...p.riderOrderJourney, automaticArriveToPickup: v }
                            }))
                          }
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          Automatic Arrive to Pickup
                        </span>
                      </div>
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.arrivedToPickup !==
                          savedConfig.riderOrderJourney.arrivedToPickup ||
                        draft.riderOrderJourney.arrivedToPickupDistanceRestriction !==
                          savedConfig.riderOrderJourney.arrivedToPickupDistanceRestriction ||
                        draft.riderOrderJourney.arrivedToPickupDistanceMeters !==
                          savedConfig.riderOrderJourney.arrivedToPickupDistanceMeters ||
                        draft.riderOrderJourney.automaticArriveToPickup !==
                          savedConfig.riderOrderJourney.automaticArriveToPickup
                      }
                      saving={savingKey === 'rj-2'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            arrivedToPickup: savedConfig.riderOrderJourney.arrivedToPickup,
                            arrivedToPickupDistanceRestriction:
                              savedConfig.riderOrderJourney.arrivedToPickupDistanceRestriction,
                            arrivedToPickupDistanceMeters:
                              savedConfig.riderOrderJourney.arrivedToPickupDistanceMeters,
                            automaticArriveToPickup: savedConfig.riderOrderJourney.automaticArriveToPickup
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            arrivedToPickup: draft.riderOrderJourney.arrivedToPickup,
                            arrivedToPickupDistanceRestriction:
                              draft.riderOrderJourney.arrivedToPickupDistanceRestriction,
                            arrivedToPickupDistanceMeters:
                              draft.riderOrderJourney.arrivedToPickupDistanceMeters,
                            automaticArriveToPickup: draft.riderOrderJourney.automaticArriveToPickup
                          },
                          'rj-2',
                          'Arrive to Pickup settings saved.'
                        )
                      }
                    />
                  </div>

                  {/* 3. Enable Smart Pickup */}
                  <div id="journey-picking-up" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={Boolean(draft.riderOrderJourney.smartPickupEnabled)}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, smartPickupEnabled: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Enable Smart Pickup</h3>
                    </div>
                    <div className="pt-4 space-y-2">
                      <p className="text-xs text-slate-500">
                        After this time, the order will be automatically picked up.
                      </p>
                      <div className="text-[11px] font-semibold text-slate-600">Time</div>
                      <UnitInput
                        value={draft.riderOrderJourney.smartPickupSeconds ?? 0}
                        disabled={!draft.riderOrderJourney.smartPickupEnabled}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, smartPickupSeconds: v }
                          }))
                        }
                        unit="Sec."
                      />
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.smartPickupEnabled !==
                          savedConfig.riderOrderJourney.smartPickupEnabled ||
                        draft.riderOrderJourney.smartPickupSeconds !==
                          savedConfig.riderOrderJourney.smartPickupSeconds
                      }
                      saving={savingKey === 'rj-3'}
                      applyLabel="Apply as default"
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            smartPickupEnabled: savedConfig.riderOrderJourney.smartPickupEnabled,
                            smartPickupSeconds: savedConfig.riderOrderJourney.smartPickupSeconds
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            smartPickupEnabled: draft.riderOrderJourney.smartPickupEnabled,
                            smartPickupSeconds: draft.riderOrderJourney.smartPickupSeconds
                          },
                          'rj-3',
                          'Smart Pickup settings saved.'
                        )
                      }
                    />
                  </div>

                  {/* 4. Picked up Distance Restriction */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.riderOrderJourney.pickedUpDistanceRestriction}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, pickedUpDistanceRestriction: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Picked up Distance Restriction</h3>
                    </div>
                    <div className="pt-4 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">Distance *</div>
                      <UnitInput
                        value={draft.riderOrderJourney.pickedUpDistanceMeters}
                        disabled={!draft.riderOrderJourney.pickedUpDistanceRestriction}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, pickedUpDistanceMeters: v }
                          }))
                        }
                        unit="Meter."
                      />
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.pickedUpDistanceRestriction !==
                          savedConfig.riderOrderJourney.pickedUpDistanceRestriction ||
                        draft.riderOrderJourney.pickedUpDistanceMeters !==
                          savedConfig.riderOrderJourney.pickedUpDistanceMeters
                      }
                      saving={savingKey === 'rj-4'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            pickedUpDistanceRestriction:
                              savedConfig.riderOrderJourney.pickedUpDistanceRestriction,
                            pickedUpDistanceMeters: savedConfig.riderOrderJourney.pickedUpDistanceMeters
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            pickedUpDistanceRestriction:
                              draft.riderOrderJourney.pickedUpDistanceRestriction,
                            pickedUpDistanceMeters: draft.riderOrderJourney.pickedUpDistanceMeters
                          },
                          'rj-4',
                          'Picked up Distance Restriction saved.'
                        )
                      }
                    />
                  </div>

                  {/* 5. Enable On my way to customer */}
                  <div id="journey-way-dropoff" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.riderOrderJourney.wayToDropOffAction}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, wayToDropOffAction: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Enable On my way to customer</h3>
                    </div>
                    <div className="pt-4">
                      <RadioOptionButton
                        selected={draft.riderOrderJourney.smartOnMyWay}
                        onClick={() =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: {
                              ...p.riderOrderJourney,
                              smartOnMyWay: !p.riderOrderJourney.smartOnMyWay
                            }
                          }))
                        }
                        label="Enable Smart On My Way"
                      />
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.wayToDropOffAction !==
                          savedConfig.riderOrderJourney.wayToDropOffAction ||
                        draft.riderOrderJourney.smartOnMyWay !== savedConfig.riderOrderJourney.smartOnMyWay
                      }
                      saving={savingKey === 'rj-5'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            wayToDropOffAction: savedConfig.riderOrderJourney.wayToDropOffAction,
                            smartOnMyWay: savedConfig.riderOrderJourney.smartOnMyWay
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            wayToDropOffAction: draft.riderOrderJourney.wayToDropOffAction,
                            smartOnMyWay: draft.riderOrderJourney.smartOnMyWay
                          },
                          'rj-5',
                          'On my way to customer settings saved.'
                        )
                      }
                    />
                  </div>

                  {/* 6. Show Arrived to Customer Button */}
                  <div id="journey-arrived-dropoff" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={draft.riderOrderJourney.arrivedToCustomerAction}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, arrivedToCustomerAction: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Show Arrived to Customer Button</h3>
                    </div>
                    <div className="pt-4 space-y-3.5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={Boolean(draft.riderOrderJourney.arrivedToCustomerDistanceRestriction)}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  arrivedToCustomerDistanceRestriction: v
                                }
                              }))
                            }
                          />
                          <span className="text-xs font-semibold text-slate-800">
                            Enable Distance Restriction from customer
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Distance Restriction from Customer Verified Location
                        </div>
                        <UnitInput
                          value={draft.riderOrderJourney.arrivedToCustomerDistanceMeters ?? 0}
                          disabled={!draft.riderOrderJourney.arrivedToCustomerDistanceRestriction}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              riderOrderJourney: {
                                ...p.riderOrderJourney,
                                arrivedToCustomerDistanceMeters: v
                              }
                            }))
                          }
                          unit="Meter."
                        />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={Boolean(draft.riderOrderJourney.automaticArriveToCustomer)}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              riderOrderJourney: { ...p.riderOrderJourney, automaticArriveToCustomer: v }
                            }))
                          }
                        />
                        <span className="text-xs font-semibold text-slate-800">
                          Automatic Arrive to Customer
                        </span>
                      </div>
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.arrivedToCustomerAction !==
                          savedConfig.riderOrderJourney.arrivedToCustomerAction ||
                        draft.riderOrderJourney.arrivedToCustomerDistanceRestriction !==
                          savedConfig.riderOrderJourney.arrivedToCustomerDistanceRestriction ||
                        draft.riderOrderJourney.arrivedToCustomerDistanceMeters !==
                          savedConfig.riderOrderJourney.arrivedToCustomerDistanceMeters ||
                        draft.riderOrderJourney.automaticArriveToCustomer !==
                          savedConfig.riderOrderJourney.automaticArriveToCustomer
                      }
                      saving={savingKey === 'rj-6'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            arrivedToCustomerAction: savedConfig.riderOrderJourney.arrivedToCustomerAction,
                            arrivedToCustomerDistanceRestriction:
                              savedConfig.riderOrderJourney.arrivedToCustomerDistanceRestriction,
                            arrivedToCustomerDistanceMeters:
                              savedConfig.riderOrderJourney.arrivedToCustomerDistanceMeters,
                            automaticArriveToCustomer:
                              savedConfig.riderOrderJourney.automaticArriveToCustomer
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            arrivedToCustomerAction: draft.riderOrderJourney.arrivedToCustomerAction,
                            arrivedToCustomerDistanceRestriction:
                              draft.riderOrderJourney.arrivedToCustomerDistanceRestriction,
                            arrivedToCustomerDistanceMeters:
                              draft.riderOrderJourney.arrivedToCustomerDistanceMeters,
                            automaticArriveToCustomer: draft.riderOrderJourney.automaticArriveToCustomer
                          },
                          'rj-6',
                          'Arrived to Customer settings saved.'
                        )
                      }
                    />
                  </div>

                  {/* 7. Customer Avg Serving Time */}
                  <div id="journey-serving-time" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-teal-700">Customer Avg Serving Time</h3>
                    </div>
                    <div className="pt-4 space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-600">Time *</div>
                      <UnitInput
                        value={draft.riderOrderJourney.customerServingTimeMin}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, customerServingTimeMin: v }
                          }))
                        }
                        unit="min."
                      />
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.customerServingTimeMin !==
                        savedConfig.riderOrderJourney.customerServingTimeMin
                      }
                      saving={savingKey === 'rj-7'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            customerServingTimeMin: savedConfig.riderOrderJourney.customerServingTimeMin
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          { customerServingTimeMin: draft.riderOrderJourney.customerServingTimeMin },
                          'rj-7',
                          'Customer Avg Serving Time saved.'
                        )
                      }
                    />
                  </div>

                  {/* 8. Enable Drop-off Image Capture */}
                  <div id="journey-dropoff-image" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100 flex items-center gap-3">
                      <Switch
                        checked={Boolean(draft.riderOrderJourney.dropOffImageCaptureEnabled)}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            riderOrderJourney: { ...p.riderOrderJourney, dropOffImageCaptureEnabled: v }
                          }))
                        }
                      />
                      <h3 className="text-sm font-bold text-teal-700">Enable Drop-off Image Capture</h3>
                    </div>
                    <p className="pt-3.5 text-xs text-slate-500">
                      Require riders to capture photo proof upon completing customer drop-off.
                    </p>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.dropOffImageCaptureEnabled !==
                        savedConfig.riderOrderJourney.dropOffImageCaptureEnabled
                      }
                      saving={savingKey === 'rj-8'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            dropOffImageCaptureEnabled:
                              savedConfig.riderOrderJourney.dropOffImageCaptureEnabled
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          { dropOffImageCaptureEnabled: draft.riderOrderJourney.dropOffImageCaptureEnabled },
                          'rj-8',
                          'Drop-off Image Capture setting saved.'
                        )
                      }
                    />
                  </div>

                  {/* 9. Order Delivery (Geographic Restriction) */}
                  <div id="journey-order-delivery" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Order Delivery</h3>
                    </div>
                    <div className="pt-4 space-y-5">
                      <div>
                        <div className="text-xs font-bold text-slate-800">Geographic Restriction</div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Restrict Task Delivery at incorrect locations by GPS locations and/or assigned geofences.
                        </p>
                      </div>

                      {/* Customer verified GPS location */}
                      <div className="space-y-3 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={draft.riderOrderJourney.orderDeliveryGpsRestriction}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  orderDeliveryGpsRestriction: v
                                }
                              }))
                            }
                          />
                          <span className="text-xs font-bold text-slate-800">
                            Customer verified GPS location
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-600">Radial Distance *</div>
                          <UnitInput
                            value={draft.riderOrderJourney.orderDeliveryGpsMeters}
                            disabled={!draft.riderOrderJourney.orderDeliveryGpsRestriction}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: { ...p.riderOrderJourney, orderDeliveryGpsMeters: v }
                              }))
                            }
                            unit="Meter."
                          />
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-600">
                            Delivering outside of the customer verified zone.
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {['Consider it abuse', 'Disable the deliver button'].map((opt) => (
                              <RadioOptionButton
                                key={opt}
                                selected={draft.riderOrderJourney.orderDeliveryGpsOutOfZoneAction === opt}
                                onClick={() =>
                                  setDraft((p) => ({
                                    ...p,
                                    riderOrderJourney: {
                                      ...p.riderOrderJourney,
                                      orderDeliveryGpsOutOfZoneAction: opt
                                    }
                                  }))
                                }
                                label={opt}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Customer Zone Geofence */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={draft.riderOrderJourney.orderDeliveryGeofenceRestriction}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  orderDeliveryGeofenceRestriction: v
                                }
                              }))
                            }
                          />
                          <span className="text-xs font-bold text-slate-800">Customer Zone Geofence</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-600">
                            Delivering outside the customer Zone geofence.
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {['Consider it abuse', 'Disable the deliver button'].map((opt) => (
                              <RadioOptionButton
                                key={opt}
                                selected={draft.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction === opt}
                                onClick={() =>
                                  setDraft((p) => ({
                                    ...p,
                                    riderOrderJourney: {
                                      ...p.riderOrderJourney,
                                      orderDeliveryGeofenceOutOfZoneAction: opt
                                    }
                                  }))
                                }
                                label={opt}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.orderDeliveryGpsRestriction !==
                          savedConfig.riderOrderJourney.orderDeliveryGpsRestriction ||
                        draft.riderOrderJourney.orderDeliveryGpsMeters !==
                          savedConfig.riderOrderJourney.orderDeliveryGpsMeters ||
                        draft.riderOrderJourney.orderDeliveryGpsOutOfZoneAction !==
                          savedConfig.riderOrderJourney.orderDeliveryGpsOutOfZoneAction ||
                        draft.riderOrderJourney.orderDeliveryGeofenceRestriction !==
                          savedConfig.riderOrderJourney.orderDeliveryGeofenceRestriction ||
                        draft.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction !==
                          savedConfig.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction
                      }
                      saving={savingKey === 'rj-9'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            orderDeliveryGpsRestriction:
                              savedConfig.riderOrderJourney.orderDeliveryGpsRestriction,
                            orderDeliveryGpsMeters: savedConfig.riderOrderJourney.orderDeliveryGpsMeters,
                            orderDeliveryGpsOutOfZoneAction:
                              savedConfig.riderOrderJourney.orderDeliveryGpsOutOfZoneAction,
                            orderDeliveryGeofenceRestriction:
                              savedConfig.riderOrderJourney.orderDeliveryGeofenceRestriction,
                            orderDeliveryGeofenceOutOfZoneAction:
                              savedConfig.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            orderDeliveryGpsRestriction:
                              draft.riderOrderJourney.orderDeliveryGpsRestriction,
                            orderDeliveryGpsMeters: draft.riderOrderJourney.orderDeliveryGpsMeters,
                            orderDeliveryGpsOutOfZoneAction:
                              draft.riderOrderJourney.orderDeliveryGpsOutOfZoneAction,
                            orderDeliveryGeofenceRestriction:
                              draft.riderOrderJourney.orderDeliveryGeofenceRestriction,
                            orderDeliveryGeofenceOutOfZoneAction:
                              draft.riderOrderJourney.orderDeliveryGeofenceOutOfZoneAction
                          },
                          'rj-9',
                          'Order Delivery geographic restrictions saved.'
                        )
                      }
                    />
                  </div>

                  {/* 10. Failed to Deliver Orders Consequences */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">
                        Failed to Deliver Orders Consequences
                      </h3>
                    </div>
                    <div className="pt-4 space-y-2">
                      <div className="text-xs font-bold text-slate-800">
                        Failed to Deliver Order on a Running Trip
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {['Ability to deliver it again', 'Disable to deliver it again'].map((opt) => (
                          <RadioOptionButton
                            key={opt}
                            selected={draft.riderOrderJourney.failedToDeliverTripRunningAction === opt}
                            onClick={() =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  failedToDeliverTripRunningAction: opt
                                }
                              }))
                            }
                            label={opt}
                          />
                        ))}
                      </div>
                    </div>
                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.failedToDeliverTripRunningAction !==
                        savedConfig.riderOrderJourney.failedToDeliverTripRunningAction
                      }
                      saving={savingKey === 'rj-10'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            failedToDeliverTripRunningAction:
                              savedConfig.riderOrderJourney.failedToDeliverTripRunningAction
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            failedToDeliverTripRunningAction:
                              draft.riderOrderJourney.failedToDeliverTripRunningAction
                          },
                          'rj-10',
                          'Failed delivery consequences saved.'
                        )
                      }
                    />
                  </div>

                  {/* 11. Can't Deliver Radius (Meters) */}
                  <div id="journey-cant-deliver" className="bg-white border border-slate-200 rounded-2xl p-5 scroll-mt-24">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-900">Can&apos;t Deliver Radius (Meters)</h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="py-4 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={Boolean(draft.riderOrderJourney.cantDeliverShippingAddressRadiusEnabled)}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  cantDeliverShippingAddressRadiusEnabled: v
                                }
                              }))
                            }
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">Shipping Address Radius</div>
                            <div className="text-[11px] text-slate-400">Verified Location</div>
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600">Radial Distance</div>
                        <UnitInput
                          value={draft.riderOrderJourney.cantDeliverShippingAddressRadiusMeters ?? 0}
                          disabled={!draft.riderOrderJourney.cantDeliverShippingAddressRadiusEnabled}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              riderOrderJourney: {
                                ...p.riderOrderJourney,
                                cantDeliverShippingAddressRadiusMeters: v
                              }
                            }))
                          }
                          unit="Meter."
                        />
                      </div>

                      <div className="py-4 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={Boolean(draft.riderOrderJourney.cantDeliverStoreRadiusEnabled)}
                            onChange={(v) =>
                              setDraft((p) => ({
                                ...p,
                                riderOrderJourney: {
                                  ...p.riderOrderJourney,
                                  cantDeliverStoreRadiusEnabled: v
                                }
                              }))
                            }
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-800">Store Radius</div>
                            <div className="text-[11px] text-slate-400">Not Verified Location</div>
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600">Radial Distance</div>
                        <UnitInput
                          value={draft.riderOrderJourney.cantDeliverStoreRadiusMeters ?? 0}
                          disabled={!draft.riderOrderJourney.cantDeliverStoreRadiusEnabled}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              riderOrderJourney: {
                                ...p.riderOrderJourney,
                                cantDeliverStoreRadiusMeters: v
                              }
                            }))
                          }
                          unit="Meter."
                        />
                      </div>
                    </div>

                    <CardFooter
                      dirty={
                        draft.riderOrderJourney.cantDeliverShippingAddressRadiusEnabled !==
                          savedConfig.riderOrderJourney.cantDeliverShippingAddressRadiusEnabled ||
                        draft.riderOrderJourney.cantDeliverShippingAddressRadiusMeters !==
                          savedConfig.riderOrderJourney.cantDeliverShippingAddressRadiusMeters ||
                        draft.riderOrderJourney.cantDeliverStoreRadiusEnabled !==
                          savedConfig.riderOrderJourney.cantDeliverStoreRadiusEnabled ||
                        draft.riderOrderJourney.cantDeliverStoreRadiusMeters !==
                          savedConfig.riderOrderJourney.cantDeliverStoreRadiusMeters
                      }
                      saving={savingKey === 'rj-11'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          riderOrderJourney: {
                            ...p.riderOrderJourney,
                            cantDeliverShippingAddressRadiusEnabled:
                              savedConfig.riderOrderJourney.cantDeliverShippingAddressRadiusEnabled,
                            cantDeliverShippingAddressRadiusMeters:
                              savedConfig.riderOrderJourney.cantDeliverShippingAddressRadiusMeters,
                            cantDeliverStoreRadiusEnabled:
                              savedConfig.riderOrderJourney.cantDeliverStoreRadiusEnabled,
                            cantDeliverStoreRadiusMeters:
                              savedConfig.riderOrderJourney.cantDeliverStoreRadiusMeters
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'riderOrderJourney',
                          {
                            cantDeliverShippingAddressRadiusEnabled:
                              draft.riderOrderJourney.cantDeliverShippingAddressRadiusEnabled,
                            cantDeliverShippingAddressRadiusMeters:
                              draft.riderOrderJourney.cantDeliverShippingAddressRadiusMeters,
                            cantDeliverStoreRadiusEnabled:
                              draft.riderOrderJourney.cantDeliverStoreRadiusEnabled,
                            cantDeliverStoreRadiusMeters:
                              draft.riderOrderJourney.cantDeliverStoreRadiusMeters
                          },
                          'rj-11',
                          "Can't Deliver Radius settings saved."
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 5. ORDER ABUSE                                            */}
              {/* ========================================================= */}
              {activeSection === 'order-abuse' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="pb-4 border-b border-slate-100 flex items-center gap-3">
                    <Switch
                      checked={draft.ordersAbuse.enabled !== false}
                      onChange={(v) =>
                        setDraft((p) => ({
                          ...p,
                          ordersAbuse: { ...p.ordersAbuse, enabled: v }
                        }))
                      }
                    />
                    <h2 className="text-sm font-bold text-slate-900">Orders Abuse</h2>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {/* Min distance */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={draft.ordersAbuse.distancePickupToDropoffEnabled}
                          disabled={draft.ordersAbuse.enabled === false}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              ordersAbuse: { ...p.ordersAbuse, distancePickupToDropoffEnabled: v }
                            }))
                          }
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Minimum distance between pickup &amp; customer
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">Distance *</div>
                      <UnitInput
                        value={draft.ordersAbuse.distancePickupToDropoffMinMeters}
                        disabled={
                          draft.ordersAbuse.enabled === false ||
                          !draft.ordersAbuse.distancePickupToDropoffEnabled
                        }
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            ordersAbuse: { ...p.ordersAbuse, distancePickupToDropoffMinMeters: v }
                          }))
                        }
                        unit="Meter."
                      />
                    </div>

                    {/* Max distance */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={draft.ordersAbuse.distancePickupToDropoffMaxEnabled}
                          disabled={draft.ordersAbuse.enabled === false}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              ordersAbuse: { ...p.ordersAbuse, distancePickupToDropoffMaxEnabled: v }
                            }))
                          }
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Maximum distance between pickup &amp; customer
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">Distance</div>
                      <UnitInput
                        value={draft.ordersAbuse.distancePickupToDropoffMaxKm ?? 0}
                        step="0.1"
                        disabled={
                          draft.ordersAbuse.enabled === false ||
                          !draft.ordersAbuse.distancePickupToDropoffMaxEnabled
                        }
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            ordersAbuse: {
                              ...p.ordersAbuse,
                              distancePickupToDropoffMaxKm: v,
                              distancePickupToDropoffMaxMeters: Math.round(v * 1000)
                            }
                          }))
                        }
                        unit="KM."
                      />
                    </div>

                    {/* Min Time From Pickup to order delivery */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={draft.ordersAbuse.timePickupToDropoffEnabled}
                          disabled={draft.ordersAbuse.enabled === false}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              ordersAbuse: { ...p.ordersAbuse, timePickupToDropoffEnabled: v }
                            }))
                          }
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Minimum Time From Pickup to order delivery
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">Time *</div>
                      <UnitInput
                        value={draft.ordersAbuse.timePickupToDropoffMinMinutes}
                        disabled={
                          draft.ordersAbuse.enabled === false ||
                          !draft.ordersAbuse.timePickupToDropoffEnabled
                        }
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            ordersAbuse: { ...p.ordersAbuse, timePickupToDropoffMinMinutes: v }
                          }))
                        }
                        unit="Min."
                      />
                    </div>

                    {/* Min Time Between delivering 2 Orders */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={draft.ordersAbuse.timeBetweenTwoOrdersEnabled}
                          disabled={draft.ordersAbuse.enabled === false}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              ordersAbuse: { ...p.ordersAbuse, timeBetweenTwoOrdersEnabled: v }
                            }))
                          }
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Minimum Time Between delivering 2 Orders
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">Time *</div>
                      <UnitInput
                        value={draft.ordersAbuse.timeBetweenTwoOrdersMinMinutes}
                        disabled={
                          draft.ordersAbuse.enabled === false ||
                          !draft.ordersAbuse.timeBetweenTwoOrdersEnabled
                        }
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            ordersAbuse: { ...p.ordersAbuse, timeBetweenTwoOrdersMinMinutes: v }
                          }))
                        }
                        unit="Min."
                      />
                    </div>

                    {/* Min Time From Creation to order delivery */}
                    <div className="py-4 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={draft.ordersAbuse.fromOrderCreationEnabled}
                          disabled={draft.ordersAbuse.enabled === false}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              ordersAbuse: { ...p.ordersAbuse, fromOrderCreationEnabled: v }
                            }))
                          }
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Minimum Time From Creation to order delivery
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600">Time</div>
                      <UnitInput
                        value={draft.ordersAbuse.fromOrderCreationMinMinutes}
                        disabled={
                          draft.ordersAbuse.enabled === false ||
                          !draft.ordersAbuse.fromOrderCreationEnabled
                        }
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            ordersAbuse: { ...p.ordersAbuse, fromOrderCreationMinMinutes: v }
                          }))
                        }
                        unit="Min."
                      />
                    </div>
                  </div>

                  <CardFooter
                    dirty={isAbuseDirty}
                    saving={savingKey === 'abuse'}
                    applyLabel="Apply as default"
                    onCancel={() => setDraft((p) => ({ ...p, ordersAbuse: savedConfig.ordersAbuse }))}
                    onApply={() =>
                      saveConfigPatch(
                        'ordersAbuse',
                        draft.ordersAbuse,
                        'abuse',
                        'Orders Abuse rules saved.'
                      )
                    }
                  />
                </div>
              )}

              {/* ========================================================= */}
              {/* 6. SMART ROUTES (SPLIT-PANE BUILDER)                      */}
              {/* ========================================================= */}
              {activeSection === 'smart-routes' && (
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/operations-hub/LiveDispatchSystem/Store?storeId=${selectedStore.id}&tab=routes`
                          )
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-teal-700 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Routes</span>
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="text-xs font-bold text-teal-700">
                        {editingRouteId ? 'Edit Route' : 'Create'}
                      </span>

                      {routes.length > 0 && (
                        <select
                          value={editingRouteId ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              resetRouteBuilder();
                            } else {
                              const found = routes.find((r) => r.id === Number(e.target.value));
                              if (found) loadRouteIntoBuilder(found);
                            }
                          }}
                          className="ml-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700"
                        >
                          <option value="">+ Create New Route</option>
                          {routes.map((r) => (
                            <option key={r.id} value={r.id}>
                              Edit: {r.name} ({r.zones?.length || 0})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={resetRouteBuilder}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!routeName.trim() || savingKey === 'smart-route'}
                        onClick={handleSaveSmartRoute}
                        className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold disabled:opacity-40 cursor-pointer"
                      >
                        {savingKey === 'smart-route'
                          ? 'Saving...'
                          : editingRouteId
                          ? 'Save Changes'
                          : 'Create'}
                      </button>
                    </div>
                  </div>

                  {/* Route Name Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <RouteIcon className="w-4 h-4 text-teal-600" />
                      <span>Create Route Name</span>
                    </div>
                    <input
                      type="text"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Enter Route Name"
                      className="w-full max-w-lg px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  {/* Split Customer Zone Picker Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800 pb-3 border-b border-slate-100">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      <span>Customer Zone</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left: Selected Customer Zones for the Route */}
                      <div className="lg:col-span-6 flex flex-col border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-teal-50/80 border-b border-teal-100 px-3.5 py-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Selected Customer Zones for the Route</span>
                          </span>
                          <span className="text-[11px] font-bold text-teal-700 tabular-nums">
                            {selectedRouteZones.length}
                          </span>
                        </div>
                        <div className="p-3 border-b border-slate-100">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Name</label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={selectedZoneFilter}
                              onChange={(e) => setSelectedZoneFilter(e.target.value)}
                              placeholder="Enter Name"
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>
                        </div>
                        <div className="p-3 flex-1 min-h-[280px] max-h-[380px] overflow-y-auto space-y-2">
                          {filteredSelectedZones.length === 0 ? (
                            <div className="h-full min-h-[220px] flex items-center justify-center text-xs text-slate-400 text-center px-4">
                              Select Customer Zones to add to this Route
                            </div>
                          ) : (
                            filteredSelectedZones.map((rz) => (
                              <div
                                key={`${rz.id}-${rz.originalIndex}`}
                                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/70"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums shrink-0">
                                    {rz.originalIndex + 1}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-800 truncate">
                                    {rz.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={rz.originalIndex === 0}
                                    onClick={() =>
                                      setSelectedRouteZones((prev) => {
                                        const next = [...prev];
                                        const i = rz.originalIndex;
                                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                                        return next;
                                      })
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={rz.originalIndex === selectedRouteZones.length - 1}
                                    onClick={() =>
                                      setSelectedRouteZones((prev) => {
                                        const next = [...prev];
                                        const i = rz.originalIndex;
                                        [next[i], next[i + 1]] = [next[i + 1], next[i]];
                                        return next;
                                      })
                                    }
                                    className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedRouteZones((prev) =>
                                        prev.filter((_, i) => i !== rz.originalIndex)
                                      )
                                    }
                                    className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Select Customer Zones (2-column grid with + buttons) */}
                      <div className="lg:col-span-6 flex flex-col border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-sky-50/80 border-b border-sky-100 px-3.5 py-2.5 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Select Customer Zones</span>
                          </span>
                          <span className="text-[11px] font-bold text-sky-700 tabular-nums">
                            {zones.length}
                          </span>
                        </div>
                        <div className="p-3 border-b border-slate-100">
                          <label className="block text-[11px] font-semibold text-slate-500 mb-1">Name</label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={availableZoneFilter}
                              onChange={(e) => setAvailableZoneFilter(e.target.value)}
                              placeholder="Enter Name"
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                            />
                          </div>
                        </div>
                        <div className="p-3 flex-1 min-h-[280px] max-h-[380px] overflow-y-auto">
                          {filteredAvailableZones.length === 0 ? (
                            <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-xs text-slate-400 text-center gap-2">
                              <span>No customer zones found for this store.</span>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/operations-hub/LiveDispatchSystem/Store?storeId=${selectedStore.id}&tab=zones`
                                  )
                                }
                                className="text-teal-700 font-semibold hover:underline cursor-pointer"
                              >
                                Add Customer Zones first
                              </button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {filteredAvailableZones.map((z) => {
                                const alreadyAdded = selectedRouteZones.some((rz) => rz.id === z.id);
                                return (
                                  <div
                                    key={z.id}
                                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-colors ${
                                      alreadyAdded
                                        ? 'border-teal-200 bg-teal-50/50'
                                        : 'border-slate-200 bg-white hover:border-teal-300'
                                    }`}
                                  >
                                    <span className="text-xs font-semibold text-slate-800 truncate">
                                      {z.name}
                                    </span>
                                    <button
                                      type="button"
                                      disabled={alreadyAdded}
                                      onClick={() =>
                                        setSelectedRouteZones((prev) => [
                                          ...prev,
                                          { id: z.id, name: z.name }
                                        ])
                                      }
                                      className={`w-6 h-6 rounded-lg inline-flex items-center justify-center shrink-0 transition-colors ${
                                        alreadyAdded
                                          ? 'bg-emerald-100 text-emerald-700 cursor-default'
                                          : 'bg-teal-600 hover:bg-teal-700 text-white cursor-pointer'
                                      }`}
                                    >
                                      {alreadyAdded ? (
                                        <Check className="w-3.5 h-3.5" />
                                      ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 7. CUSTOMER ZONES QUICK SUMMARY                           */}
              {/* ========================================================= */}
              {activeSection === 'customer-zones' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Customer Zones</h2>
                      <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                        {zones.length} customer zones configured for {selectedStore.name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/operations-hub/LiveDispatchSystem/Store?storeId=${selectedStore.id}&tab=zones`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Manage Customer Zones</span>
                    </button>
                  </div>

                  {zones.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No customer zones added yet for this store.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {zones.map((z) => (
                        <div
                          key={z.id}
                          className="p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{z.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                              {z.city || 'No city'} · {z.default_vehicle_type} · Fees {z.extra_fees}
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold shrink-0 ${
                              z.is_active ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {z.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================= */}
              {/* 8. GPS LOCATIONS (ROUTE OPTIMIZATION)                     */}
              {/* ========================================================= */}
              {activeSection === 'gps-location' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5">
                  <div className="pb-4 border-b border-slate-100 flex items-center gap-2.5">
                    <h2 className="text-sm font-bold text-teal-700">GPS Locations</h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600">
                      Route Optimization
                    </span>
                  </div>

                  <div className="pt-4 space-y-5">
                    <p className="text-xs text-slate-500">
                      Within this distance, the task is close to the branch and can be dispatched with the 1st task irrespective of its distance from the task itself.
                    </p>

                    <div className="space-y-2 pb-4 border-b border-slate-100">
                      <div className="text-xs font-bold text-slate-900">Close to the first order *</div>
                      <p className="text-[11px] text-slate-500">
                        Within the set meters, the task is considered very close to the 1st task being dispatched (e.g. within the same apartment complex).
                      </p>
                      <UnitInput
                        value={draft.gpsLocations.closeToFirstOrderMeters}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            gpsLocations: {
                              ...p.gpsLocations,
                              closeToFirstOrderMeters: v,
                              closeToFirstOrderEnabled: v > 0
                            }
                          }))
                        }
                        unit="Meter."
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900">Order within Range Distance *</div>
                      <p className="text-[11px] text-slate-500">
                        Within the set meters, the task is considered within range of the 1st task being dispatched.
                      </p>
                      <UnitInput
                        value={draft.gpsLocations.withinRangeOfFirstOrderMeters}
                        onChange={(v) =>
                          setDraft((p) => ({
                            ...p,
                            gpsLocations: {
                              ...p.gpsLocations,
                              withinRangeOfFirstOrderMeters: v,
                              withinRangeOfFirstOrderEnabled: v > 0
                            }
                          }))
                        }
                        unit="Meter."
                      />
                    </div>
                  </div>

                  <CardFooter
                    dirty={isGpsLocDirty}
                    saving={savingKey === 'gps-loc'}
                    onCancel={() =>
                      setDraft((p) => ({ ...p, gpsLocations: savedConfig.gpsLocations }))
                    }
                    onApply={() =>
                      saveConfigPatch(
                        'gpsLocations',
                        draft.gpsLocations,
                        'gps-loc',
                        'GPS Location optimization settings saved.'
                      )
                    }
                  />
                </div>
              )}

              {/* ========================================================= */}
              {/* 9. ORDER STATUS SLA (DELIVERY TARGET TIME + 8 SLA TIMERS) */}
              {/* ========================================================= */}
              {activeSection === 'order-status-sla' && (
                <div className="space-y-4">
                  {/* Card 1: Delivery Target Time */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-teal-700">Delivery Target Time</h2>
                    </div>
                    <p className="pt-3.5 text-xs text-slate-500">
                      Optimization of orders according to the target time you want to deliver orders in.
                    </p>

                    <div className="divide-y divide-slate-100 mt-2">
                      <div className="py-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Order Excellent Duration *</span>
                        </div>
                        <UnitInput
                          prefix="<"
                          value={draft.sla.deliveryExcellentUnderMin}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              sla: { ...p.sla, deliveryExcellentUnderMin: v }
                            }))
                          }
                          unit="min"
                        />
                      </div>

                      <div className="py-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                          <span>Order good Duration *</span>
                        </div>
                        <UnitInput
                          prefix="<"
                          value={draft.sla.deliveryGoodUnderMin}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              sla: { ...p.sla, deliveryGoodUnderMin: v }
                            }))
                          }
                          unit="min"
                        />
                      </div>

                      <div className="py-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>Order late Duration</span>
                        </div>
                        <UnitInput
                          prefix=">"
                          value={draft.sla.deliveryLateOverMin}
                          onChange={(v) =>
                            setDraft((p) => ({
                              ...p,
                              sla: { ...p.sla, deliveryLateOverMin: v }
                            }))
                          }
                          unit="min"
                        />
                      </div>
                    </div>

                    <CardFooter
                      dirty={isDeliveryTargetDirty}
                      saving={savingKey === 'sla-target'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          sla: {
                            ...p.sla,
                            deliveryExcellentUnderMin: savedConfig.sla.deliveryExcellentUnderMin,
                            deliveryGoodUnderMin: savedConfig.sla.deliveryGoodUnderMin,
                            deliveryLateOverMin: savedConfig.sla.deliveryLateOverMin
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'sla',
                          {
                            deliveryExcellentUnderMin: draft.sla.deliveryExcellentUnderMin,
                            deliveryGoodUnderMin: draft.sla.deliveryGoodUnderMin,
                            deliveryLateOverMin: draft.sla.deliveryLateOverMin
                          },
                          'sla-target',
                          'Delivery Target Time saved.'
                        )
                      }
                    />
                  </div>

                  {/* Card 2: Order status SLA (8 Timers) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="pb-3.5 border-b border-slate-100">
                      <h2 className="text-sm font-bold text-teal-700">Order status SLA</h2>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {(
                        [
                          {
                            key: 'orderPreparationMin' as const,
                            title: 'Order preparation time',
                            desc: 'Set the maximum time for a task to be prepared. After this duration the timer will turn red.'
                          },
                          {
                            key: 'orderFetchingMin' as const,
                            title: 'Order Fetching Time',
                            desc: 'Set the maximum time to search for an available rider (fetching time). After this duration the timer will turn red.'
                          },
                          {
                            key: 'onMyWayToPickupMin' as const,
                            title: 'On my way to pickup time',
                            desc: 'Set the maximum time for a rider to start heading to the store after the order is added to a trip. After this duration the timer will turn red.'
                          },
                          {
                            key: 'arriveToPickupMin' as const,
                            title: 'Arrive to pickup time',
                            desc: 'Set the maximum time for a rider to arrive at the store after starting on the way to pickup. After this duration the timer will turn red.'
                          },
                          {
                            key: 'riderWaitingInStoreMin' as const,
                            title: 'Rider waiting in store Time',
                            desc: 'Set the maximum time a rider should wait inside the store to pickup the tasks assigned. After this duration the timer will turn red.'
                          },
                          {
                            key: 'pickedUpTimeMin' as const,
                            title: 'Picked up time',
                            desc: 'Set the maximum time for an order to stay in the Picked up status before the rider starts delivering it. After this duration the timer will turn red.'
                          },
                          {
                            key: 'arriveToCustomerMin' as const,
                            title: 'Arrive to customer time',
                            desc: 'Set the maximum time for a rider to arrive at the customer after picking up the order. After this duration the timer will turn red.'
                          },
                          {
                            key: 'customerAvgServingTimeMin' as const,
                            title: 'Customer Serving Time',
                            desc: 'This duration is the maximum time set for a rider to serve the customer; synced with Rider Journey. After this duration the timer will turn red.'
                          }
                        ] as const
                      ).map((item) => (
                        <div key={item.key} className="py-4 space-y-1.5">
                          <div className="text-xs font-bold text-slate-900">{item.title}</div>
                          <p className="text-[11px] text-slate-500">{item.desc}</p>
                          <div className="pt-1">
                            <div className="text-[11px] font-semibold text-slate-600 mb-1">Duration *</div>
                            <UnitInput
                              value={Number(draft.sla[item.key] ?? 0)}
                              onChange={(v) =>
                                setDraft((p) => ({
                                  ...p,
                                  sla: { ...p.sla, [item.key]: v }
                                }))
                              }
                              unit="min"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <CardFooter
                      dirty={isOrderStatusSlaDirty}
                      saving={savingKey === 'sla-status'}
                      onCancel={() =>
                        setDraft((p) => ({
                          ...p,
                          sla: {
                            ...p.sla,
                            orderPreparationMin: savedConfig.sla.orderPreparationMin,
                            orderFetchingMin: savedConfig.sla.orderFetchingMin,
                            onMyWayToPickupMin: savedConfig.sla.onMyWayToPickupMin,
                            arriveToPickupMin: savedConfig.sla.arriveToPickupMin,
                            riderWaitingInStoreMin: savedConfig.sla.riderWaitingInStoreMin,
                            pickedUpTimeMin: savedConfig.sla.pickedUpTimeMin,
                            arriveToCustomerMin: savedConfig.sla.arriveToCustomerMin,
                            customerAvgServingTimeMin: savedConfig.sla.customerAvgServingTimeMin
                          }
                        }))
                      }
                      onApply={() =>
                        saveConfigPatch(
                          'sla',
                          {
                            orderPreparationMin: draft.sla.orderPreparationMin,
                            orderFetchingMin: draft.sla.orderFetchingMin,
                            onMyWayToPickupMin: draft.sla.onMyWayToPickupMin,
                            arriveToPickupMin: draft.sla.arriveToPickupMin,
                            riderWaitingInStoreMin: draft.sla.riderWaitingInStoreMin,
                            pickedUpTimeMin: draft.sla.pickedUpTimeMin,
                            arriveToCustomerMin: draft.sla.arriveToCustomerMin,
                            customerAvgServingTimeMin: draft.sla.customerAvgServingTimeMin
                          },
                          'sla-status',
                          'Order status SLA timers saved.'
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
