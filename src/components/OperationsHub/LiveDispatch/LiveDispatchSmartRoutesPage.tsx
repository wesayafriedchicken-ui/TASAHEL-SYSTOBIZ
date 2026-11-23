import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Route as RouteIcon,
  Plus,
  Search,
  MoreHorizontal,
  MapPin,
  ArrowLeftRight,
  MinusCircle,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Layers,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import {
  DispatchStore,
  DispatchCustomerZone,
  DispatchSmartRoute,
  DispatchSmartRouteZoneRef,
  getDispatchAuthHeaders
} from './types';

interface LiveDispatchSmartRoutesPageProps {
  initialMode?: 'list' | 'create';
}

export function LiveDispatchSmartRoutesPage({
  initialMode = 'list'
}: LiveDispatchSmartRoutesPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStoreIdParam = Number(searchParams.get('storeId') || 0) || null;

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>(initialMode);
  const [stores, setStores] = useState<DispatchStore[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(initialStoreIdParam);
  const [filterStoreId, setFilterStoreId] = useState<number | null>(initialStoreIdParam);

  const [routes, setRoutes] = useState<DispatchSmartRoute[]>([]);
  const [zones, setZones] = useState<DispatchCustomerZone[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  // List card dropdown menu & modals
  const [openMenuRouteId, setOpenMenuRouteId] = useState<number | null>(null);
  const [deleteRouteTarget, setDeleteRouteTarget] = useState<DispatchSmartRoute | null>(null);
  const [transferModal, setTransferModal] = useState<{
    sourceRoute: DispatchSmartRoute;
    zoneRef: DispatchSmartRouteZoneRef;
    zoneIndex: number;
  } | null>(null);
  const [transferTargetRouteId, setTransferTargetRouteId] = useState<number | ''>('');

  // Create / Edit Form state
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);
  const [formRouteName, setFormRouteName] = useState('');
  const [formStoreId, setFormStoreId] = useState<number | null>(initialStoreIdParam);
  const [formZones, setFormZones] = useState<DispatchCustomerZone[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>([]);
  const [zoneSearchFilter, setZoneSearchFilter] = useState('');

  // Inline Quick Add New Zone in Create/Edit mode
  const [showQuickAddZone, setShowQuickAddZone] = useState(false);
  const [quickZoneName, setQuickZoneName] = useState('');
  const [quickZoneCity, setQuickZoneCity] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

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

  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    try {
      const res = await fetch('/api/operations/live-dispatch/stores', {
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to load stores');
      const data: DispatchStore[] = await res.json();
      setStores(Array.isArray(data) ? data : []);
      const defaultId =
        initialStoreIdParam && data.some((s) => s.id === initialStoreIdParam)
          ? initialStoreIdParam
          : data[0]?.id ?? null;
      setSelectedStoreId((prev) => (prev && data.some((s) => s.id === prev) ? prev : defaultId));
      setFilterStoreId((prev) => (prev && data.some((s) => s.id === prev) ? prev : defaultId));
      setFormStoreId((prev) => (prev && data.some((s) => s.id === prev) ? prev : defaultId));
    } catch (err: any) {
      showToast('error', err.message || 'Could not load dispatch stores');
    } finally {
      setLoadingStores(false);
    }
  }, [initialStoreIdParam, showToast]);

  const fetchStoreRoutesAndZones = useCallback(
    async (storeId: number) => {
      setLoadingData(true);
      try {
        const [routesRes, zonesRes] = await Promise.all([
          fetch(`/api/operations/live-dispatch/stores/${storeId}/routes`, {
            headers: getDispatchAuthHeaders(false)
          }),
          fetch(`/api/operations/live-dispatch/stores/${storeId}/zones`, {
            headers: getDispatchAuthHeaders(false)
          })
        ]);
        if (!routesRes.ok || !zonesRes.ok) {
          throw new Error('Failed to load smart routes data');
        }
        const [routesData, zonesData] = await Promise.all([routesRes.json(), zonesRes.json()]);
        setRoutes(Array.isArray(routesData) ? routesData : []);
        const normalizedZones = Array.isArray(zonesData) ? zonesData : [];
        setZones(normalizedZones);
        setFormZones(normalizedZones);
      } catch (err: any) {
        showToast('error', err.message || 'Could not load smart routes');
      } finally {
        setLoadingData(false);
      }
    },
    [showToast]
  );

  const fetchZonesForFormStore = useCallback(
    async (storeId: number) => {
      try {
        const res = await fetch(`/api/operations/live-dispatch/stores/${storeId}/zones`, {
          headers: getDispatchAuthHeaders(false)
        });
        if (!res.ok) throw new Error('Failed to load store zones');
        const data: DispatchCustomerZone[] = await res.json();
        setFormZones(Array.isArray(data) ? data : []);
      } catch (err: any) {
        showToast('error', err.message || 'Could not load customer zones for store');
      }
    },
    [showToast]
  );

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    if (selectedStore?.id) {
      fetchStoreRoutesAndZones(selectedStore.id);
    }
  }, [selectedStore?.id, fetchStoreRoutesAndZones]);

  // Close card action menu on outside click
  useEffect(() => {
    const closeMenu = () => setOpenMenuRouteId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleApplySearch = () => {
    if (!filterStoreId) return;
    setSelectedStoreId(filterStoreId);
    const next = new URLSearchParams(searchParams);
    next.set('storeId', String(filterStoreId));
    setSearchParams(next, { replace: true });
    fetchStoreRoutesAndZones(filterStoreId);
  };

  const openCreateView = () => {
    const activeStoreId = selectedStore?.id ?? stores[0]?.id ?? null;
    setEditingRouteId(null);
    setFormRouteName('');
    setFormStoreId(activeStoreId);
    setFormZones(zones);
    setSelectedZoneIds([]);
    setZoneSearchFilter('');
    setShowQuickAddZone(false);
    setMode('create');
  };

  const openEditView = (route: DispatchSmartRoute) => {
    setEditingRouteId(route.id);
    setFormRouteName(route.name);
    setFormStoreId(route.store_id || selectedStore?.id || null);
    setFormZones(zones);
    setSelectedZoneIds(
      Array.isArray(route.zones) ? route.zones.map((z) => Number(z.id)).filter(Boolean) : []
    );
    setZoneSearchFilter('');
    setShowQuickAddZone(false);
    setMode('edit');
  };

  const handleBackToList = () => {
    setMode('list');
    setEditingRouteId(null);
    setShowQuickAddZone(false);
    if (window.location.pathname.toLowerCase().endsWith('/create')) {
      navigate(
        `/operations-hub/LiveDispatchSystem/Store/Smart Routes/Routes${
          selectedStore?.id ? `?storeId=${selectedStore.id}` : ''
        }`,
        { replace: true }
      );
    }
  };

  const handleFormStoreChange = async (nextStoreId: number) => {
    setFormStoreId(nextStoreId);
    setSelectedZoneIds([]);
    await fetchZonesForFormStore(nextStoreId);
  };

  const toggleZoneAssignment = (zoneId: number) => {
    setSelectedZoneIds((prev) =>
      prev.includes(zoneId) ? prev.filter((id) => id !== zoneId) : [...prev, zoneId]
    );
  };

  const moveSelectedZoneOrder = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selectedZoneIds.length) return;
    setSelectedZoneIds((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleQuickCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStoreId = formStoreId || selectedStore?.id;
    if (!targetStoreId) return;
    if (!quickZoneName.trim()) {
      showToast('error', 'Enter a customer zone name');
      return;
    }

    const storeObj = stores.find((s) => s.id === targetStoreId);
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/stores/${targetStoreId}/zones`, {
        method: 'POST',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          name: quickZoneName.trim(),
          city: quickZoneCity.trim() || storeObj?.city || 'Cairo',
          lat: storeObj?.lat || 30.0131,
          lng: storeObj?.lng || 31.2089,
          has_geofence: false,
          default_vehicle_type: 'Motorcycle',
          extra_fees: 0
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add zone');
      }
      const created: DispatchCustomerZone = await res.json();
      setFormZones((prev) => [created, ...prev]);
      if (targetStoreId === selectedStore?.id) {
        setZones((prev) => [created, ...prev]);
      }
      setSelectedZoneIds((prev) => [...prev, created.id]);
      setQuickZoneName('');
      setQuickZoneCity('');
      setShowQuickAddZone(false);
      showToast('success', `Zone "${created.name}" created and assigned to route`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not create customer zone');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoute = async () => {
    const targetStoreId = formStoreId || selectedStore?.id;
    if (!targetStoreId) {
      showToast('error', 'Please select a store');
      return;
    }
    if (!formRouteName.trim()) {
      showToast('error', 'Route Name is required');
      return;
    }

    const zoneRefs: DispatchSmartRouteZoneRef[] = selectedZoneIds
      .map((id) => {
        const found = formZones.find((z) => z.id === id) || zones.find((z) => z.id === id);
        return found ? { id: found.id, name: found.name } : null;
      })
      .filter((x): x is DispatchSmartRouteZoneRef => x !== null);

    setSaving(true);
    try {
      const isEdit = mode === 'edit' && editingRouteId !== null;
      const url = isEdit
        ? `/api/operations/live-dispatch/routes/${editingRouteId}`
        : `/api/operations/live-dispatch/stores/${targetStoreId}/routes`;
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          name: formRouteName.trim(),
          zones: zoneRefs
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save smart route');
      }

      setSelectedStoreId(targetStoreId);
      setFilterStoreId(targetStoreId);
      await fetchStoreRoutesAndZones(targetStoreId);
      showToast('success', isEdit ? 'Smart route updated' : 'Smart route created');
      handleBackToList();
    } catch (err: any) {
      showToast('error', err.message || 'Could not save smart route');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveZoneFromRoute = async (route: DispatchSmartRoute, zoneId: number) => {
    const updatedZones = (route.zones || []).filter((z) => z.id !== zoneId);
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/routes/${route.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({
          name: route.name,
          zones: updatedZones
        })
      });
      if (!res.ok) throw new Error('Failed to remove zone from route');
      const saved: DispatchSmartRoute = await res.json();
      setRoutes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      showToast('success', 'Customer zone removed from route');
    } catch (err: any) {
      showToast('error', err.message || 'Could not update route');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoute = async (route: DispatchSmartRoute) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/routes/${route.id}`, {
        method: 'DELETE',
        headers: getDispatchAuthHeaders(false)
      });
      if (!res.ok) throw new Error('Failed to delete route');
      setRoutes((prev) => prev.filter((r) => r.id !== route.id));
      setDeleteRouteTarget(null);
      showToast('success', `Deleted route "${route.name}"`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not delete route');
    } finally {
      setSaving(false);
    }
  };

  const handleReorderZoneInsideRoute = async (
    route: DispatchSmartRoute,
    fromIndex: number,
    direction: -1 | 1
  ) => {
    const list = [...(route.zones || [])];
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= list.length) return;
    const temp = list[fromIndex];
    list[fromIndex] = list[toIndex];
    list[toIndex] = temp;

    setSaving(true);
    try {
      const res = await fetch(`/api/operations/live-dispatch/routes/${route.id}`, {
        method: 'PATCH',
        headers: getDispatchAuthHeaders(true),
        body: JSON.stringify({ name: route.name, zones: list })
      });
      if (!res.ok) throw new Error('Failed to reorder stop');
      const saved: DispatchSmartRoute = await res.json();
      setRoutes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      setTransferModal(null);
      showToast('success', `Updated stop sequence in "${route.name}"`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not reorder stop');
    } finally {
      setSaving(false);
    }
  };

  const handleTransferZoneToRoute = async () => {
    if (!transferModal || !transferTargetRouteId) return;
    const targetRoute = routes.find((r) => r.id === Number(transferTargetRouteId));
    if (!targetRoute) return;

    const { sourceRoute, zoneRef } = transferModal;
    const nextSourceZones = (sourceRoute.zones || []).filter((z) => z.id !== zoneRef.id);
    const alreadyInTarget = (targetRoute.zones || []).some((z) => z.id === zoneRef.id);
    const nextTargetZones = alreadyInTarget
      ? targetRoute.zones
      : [...(targetRoute.zones || []), zoneRef];

    setSaving(true);
    try {
      const [srcRes, dstRes] = await Promise.all([
        fetch(`/api/operations/live-dispatch/routes/${sourceRoute.id}`, {
          method: 'PATCH',
          headers: getDispatchAuthHeaders(true),
          body: JSON.stringify({ name: sourceRoute.name, zones: nextSourceZones })
        }),
        fetch(`/api/operations/live-dispatch/routes/${targetRoute.id}`, {
          method: 'PATCH',
          headers: getDispatchAuthHeaders(true),
          body: JSON.stringify({ name: targetRoute.name, zones: nextTargetZones })
        })
      ]);
      if (!srcRes.ok || !dstRes.ok) {
        throw new Error('Failed to transfer zone between routes');
      }
      const [updatedSrc, updatedDst]: DispatchSmartRoute[] = await Promise.all([
        srcRes.json(),
        dstRes.json()
      ]);
      setRoutes((prev) =>
        prev.map((r) =>
          r.id === updatedSrc.id ? updatedSrc : r.id === updatedDst.id ? updatedDst : r
        )
      );
      setTransferModal(null);
      setTransferTargetRouteId('');
      showToast('success', `Moved "${zoneRef.name}" to "${targetRoute.name}"`);
    } catch (err: any) {
      showToast('error', err.message || 'Could not transfer zone');
    } finally {
      setSaving(false);
    }
  };

  // Zones mapped for Create / Edit view
  const assignedZonesList = useMemo(
    () =>
      selectedZoneIds
        .map((id) => formZones.find((z) => z.id === id))
        .filter((z): z is DispatchCustomerZone => Boolean(z)),
    [selectedZoneIds, formZones]
  );

  const availableZonesList = useMemo(() => {
    const q = zoneSearchFilter.trim().toLowerCase();
    return formZones.filter((z) => {
      if (selectedZoneIds.includes(z.id)) return false;
      if (!q) return true;
      return z.name.toLowerCase().includes(q) || (z.city || '').toLowerCase().includes(q);
    });
  }, [formZones, selectedZoneIds, zoneSearchFilter]);

  const zoneRouteMembershipMap = useMemo(() => {
    const map: Record<number, string> = {};
    routes.forEach((r) => {
      if (editingRouteId && r.id === editingRouteId) return;
      (r.zones || []).forEach((z) => {
        map[z.id] = r.name;
      });
    });
    return map;
  }, [routes, editingRouteId]);

  return (
    <div className="space-y-4">
      {/* Floating Toast */}
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

      {/* ================================================================= */}
      {/* VIEW 1: SMART ROUTES / ROUTES LIST (matching reference screenshot) */}
      {/* ================================================================= */}
      {mode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Header Row */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <RouteIcon className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-900">Smart Routes / Routes</h1>
                <p className="text-xs text-slate-500">
                  Sequence customer zones into delivery routes for automated multi-order dispatch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
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
                onClick={openCreateView}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </button>
            </div>
          </div>

          {/* Filter Bar: Stores + Apply Search */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Stores</label>
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={filterStoreId ?? selectedStore?.id ?? ''}
                onChange={(e) => setFilterStoreId(Number(e.target.value))}
                disabled={loadingStores || stores.length === 0}
                className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
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

              <button
                type="button"
                onClick={handleApplySearch}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-teal-200 bg-teal-50/70 hover:bg-teal-100/80 text-teal-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Apply Search</span>
              </button>
            </div>
          </div>

          {/* Route Cards Grid */}
          <div className="p-5">
            {loadingData ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
                Loading smart routes...
              </div>
            ) : routes.length === 0 ? (
              <div className="py-12 text-center space-y-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40">
                <RouteIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-bold text-slate-800">No Smart Routes Found</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Create your first smart route for {selectedStore?.name || 'this store'} and assign
                  customer zones in delivery sequence.
                </p>
                <button
                  type="button"
                  onClick={openCreateView}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Route</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {routes.map((route) => {
                  const routeZones = Array.isArray(route.zones) ? route.zones : [];
                  const isMenuOpen = openMenuRouteId === route.id;

                  return (
                    <div
                      key={route.id}
                      className="bg-white border border-slate-200 hover:border-teal-300 rounded-2xl overflow-hidden flex flex-col transition-colors min-h-[260px]"
                    >
                      {/* Soft Tinted Card Header */}
                      <div className="m-2 mb-0 px-3 py-2.5 rounded-xl bg-teal-50/80 border border-teal-100/80 flex items-center justify-between gap-2 relative">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-white text-teal-700 border border-teal-100 flex items-center justify-center shrink-0">
                            <RouteIcon className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 truncate">
                            {route.name}
                          </h3>
                        </div>

                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuRouteId(isMenuOpen ? null : route.id);
                            }}
                            className="p-1 rounded-lg text-teal-700 hover:bg-white transition-colors cursor-pointer"
                            title="Route Options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuRouteId(null);
                                  openEditView(route);
                                }}
                                className="w-full px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5 text-teal-600" />
                                <span>Edit Route</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuRouteId(null);
                                  setDeleteRouteTarget(route);
                                }}
                                className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Route</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Customer Zones Count Subheader */}
                      <div className="px-4 pt-3 pb-2 flex items-center gap-2 text-[11px] font-semibold text-teal-700">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span>Customer Zones</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold tabular-nums">
                          {routeZones.length}
                        </span>
                      </div>

                      {/* Ordered Stops List */}
                      <div className="px-3.5 pb-3.5 flex-1 divide-y divide-slate-100">
                        {routeZones.length === 0 ? (
                          <div className="py-8 text-center">
                            <p className="text-[11px] text-slate-400">No customer zones assigned</p>
                            <button
                              type="button"
                              onClick={() => openEditView(route)}
                              className="mt-2 text-[11px] font-semibold text-teal-700 hover:underline cursor-pointer"
                            >
                              + Assign Zones
                            </button>
                          </div>
                        ) : (
                          routeZones.map((zoneRef, idx) => (
                            <div
                              key={`${route.id}-${zoneRef.id}-${idx}`}
                              className="py-2.5 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold tabular-nums flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 truncate">
                                  {zoneRef.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferModal({
                                      sourceRoute: route,
                                      zoneRef,
                                      zoneIndex: idx
                                    });
                                    const otherRoute = routes.find((r) => r.id !== route.id);
                                    setTransferTargetRouteId(otherRoute ? otherRoute.id : '');
                                  }}
                                  title="Move / Reorder Customer Zone"
                                  className="p-1 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                                >
                                  <ArrowLeftRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={saving}
                                  onClick={() => handleRemoveZoneFromRoute(route, zoneRef.id)}
                                  title="Remove Zone from Route"
                                  className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 2: ROUTES / CREATE & EDIT (matching reference screenshot)    */}
      {/* ================================================================= */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {/* Header Row */}
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleBackToList}
                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Back to Smart Routes"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-base font-bold text-slate-900">
                {mode === 'edit' ? 'Routes / Edit' : 'Routes / Create'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveRoute}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-5 space-y-6">
            {/* Route Name & Store Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Route Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formRouteName}
                  onChange={(e) => setFormRouteName(e.target.value)}
                  placeholder="Enter route name (e.g. Route 1 - Haram)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Store <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formStoreId ?? ''}
                  onChange={(e) => handleFormStoreChange(Number(e.target.value))}
                  disabled={mode === 'edit' || stores.length === 0}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-800 disabled:bg-slate-50 disabled:text-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Assign Customer Zones Section */}
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-teal-700">Assign Customer Zones</h2>
                <p className="text-xs text-slate-500 mt-1">
                  To assign Customer Zones to a route, select them by clicking on the corresponding
                  card. Once you click on a card, it will be highlighted with a teal outline.
                </p>
              </div>

              {/* Active Route Preview Banner matching reference */}
              <div className="rounded-xl bg-teal-50/80 border border-teal-100 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-white border border-teal-200 text-teal-700 text-xs font-bold tabular-nums flex items-center justify-center shrink-0">
                    {assignedZonesList.length}
                  </span>
                  <RouteIcon className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {formRouteName.trim() || 'New Smart Route'}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-teal-700 shrink-0">
                  {assignedZonesList.length} zone{assignedZonesList.length === 1 ? '' : 's'} assigned
                </span>
              </div>

              {/* + Add new zone to route Button */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowQuickAddZone((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add new zone to route</span>
                </button>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={zoneSearchFilter}
                    onChange={(e) => setZoneSearchFilter(e.target.value)}
                    placeholder="Filter available zones..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Inline Quick Create Customer Zone Drawer */}
              {showQuickAddZone && (
                <form
                  onSubmit={handleQuickCreateZone}
                  className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 flex flex-wrap items-end gap-3"
                >
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      New Customer Zone Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={quickZoneName}
                      onChange={(e) => setQuickZoneName(e.target.value)}
                      placeholder="e.g. Al-Haram Hospital, Al-Mansouriya..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    />
                  </div>
                  <div className="w-full sm:w-44">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={quickZoneCity}
                      onChange={(e) => setQuickZoneCity(e.target.value)}
                      placeholder={selectedStore?.city || 'Cairo'}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold cursor-pointer"
                    >
                      {saving ? 'Adding...' : 'Create & Assign'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddZone(false)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Assigned Customer Zone Cards (matching reference outlined cards with red minus icon) */}
              {assignedZonesList.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Assigned Zones ({assignedZonesList.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {assignedZonesList.map((zone, idx) => (
                      <div
                        key={zone.id}
                        className="group rounded-xl border-2 border-teal-500 bg-teal-50/20 px-3.5 py-3 flex items-center justify-between gap-2.5 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleZoneAssignment(zone.id)}
                            title="Remove zone from this route"
                            className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          >
                            <span className="w-2.5 h-0.5 bg-white rounded-full" />
                          </button>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {zone.name}
                            </div>
                            <div className="text-[11px] font-semibold text-teal-700 truncate mt-0.5">
                              {formRouteName.trim() || 'Current Route'} · Stop #{idx + 1}
                            </div>
                          </div>
                        </div>

                        {/* Reorder controls */}
                        <div className="flex flex-col gap-0.5 shrink-0 opacity-70 group-hover:opacity-100">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveSelectedZoneOrder(idx, -1)}
                            title="Move Earlier"
                            className="p-0.5 rounded hover:bg-white disabled:opacity-25 text-slate-600 cursor-pointer"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === assignedZonesList.length - 1}
                            onClick={() => moveSelectedZoneOrder(idx, 1)}
                            title="Move Later"
                            className="p-0.5 rounded hover:bg-white disabled:opacity-25 text-slate-600 cursor-pointer"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Store Customer Zones Grid (click card to assign) */}
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Available Customer Zones ({availableZonesList.length})
                </div>
                {availableZonesList.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                    {formZones.length === 0
                      ? 'This store has no customer zones yet. Click "+ Add new zone to route" to create one.'
                      : 'All matching customer zones are already assigned to this route.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {availableZonesList.map((zone) => {
                      const otherRouteName = zoneRouteMembershipMap[zone.id];
                      return (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => toggleZoneAssignment(zone.id)}
                          className="text-left rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/30 bg-white px-3.5 py-3 flex items-center justify-between gap-2.5 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                              <Plus className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 truncate">
                                {zone.name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5">
                                {otherRouteName ? `In ${otherRouteName}` : zone.city || 'Unassigned'}
                              </div>
                            </div>
                          </div>
                          {zone.has_geofence && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="GeoFenced" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer / Reorder Stop Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Move or Reorder Zone</h3>
              </div>
              <button
                type="button"
                onClick={() => setTransferModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs">
                <span className="text-slate-500">Customer Zone:</span>{' '}
                <strong className="text-slate-900">{transferModal.zoneRef.name}</strong>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Current Route: <strong>{transferModal.sourceRoute.name}</strong> (Stop #
                  {transferModal.zoneIndex + 1})
                </div>
              </div>

              {/* Reorder within current route */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-700">
                  Reorder within {transferModal.sourceRoute.name}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={saving || transferModal.zoneIndex === 0}
                    onClick={() =>
                      handleReorderZoneInsideRoute(
                        transferModal.sourceRoute,
                        transferModal.zoneIndex,
                        -1
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Move Up</span>
                  </button>
                  <button
                    type="button"
                    disabled={
                      saving ||
                      transferModal.zoneIndex >= (transferModal.sourceRoute.zones?.length || 1) - 1
                    }
                    onClick={() =>
                      handleReorderZoneInsideRoute(
                        transferModal.sourceRoute,
                        transferModal.zoneIndex,
                        1
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Move Down</span>
                  </button>
                </div>
              </div>

              {/* Transfer to another route */}
              {routes.filter((r) => r.id !== transferModal.sourceRoute.id).length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700">
                    Transfer to Another Route
                  </label>
                  <select
                    value={transferTargetRouteId}
                    onChange={(e) => setTransferTargetRouteId(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500"
                  >
                    {routes
                      .filter((r) => r.id !== transferModal.sourceRoute.id)
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.zones?.length || 0} zones)
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={saving || !transferTargetRouteId}
                    onClick={handleTransferZoneToRoute}
                    className="w-full px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer"
                  >
                    {saving ? 'Transferring...' : 'Transfer Customer Zone'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Route Confirmation Modal */}
      {deleteRouteTarget && (
        <div className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Delete Smart Route</h3>
              <button
                type="button"
                onClick={() => setDeleteRouteTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete smart route{' '}
                <strong className="text-slate-900">{deleteRouteTarget.name}</strong>? Customer zones
                themselves will remain intact.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteRouteTarget(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleDeleteRoute(deleteRouteTarget)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {saving ? 'Deleting...' : 'Delete Route'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
