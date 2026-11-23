export interface DispatchTeam {
  id: number;
  company_id?: number;
  name: string;
  city: string;
  zone_coverage: string;
  store_code: string;
  max_trip_capacity: number;
  is_active: boolean;
  created_at?: string;
}

export interface DispatchProvider {
  id: number;
  company_id?: number;
  name: string;
  contact_phone: string;
  commission_rate: number;
  is_active: boolean;
  created_at?: string;
}

export interface DispatchRider {
  id: number;
  company_id?: number;
  enroll_id: string;
  name: string;
  team_id?: number | null;
  team_name: string;
  provider_name: string;
  mobile_number: string;
  acc_number: string;
  payroll_method?: string;
  payroll_method_number?: string;
  status: 'On Duty' | 'Off Duty' | 'Break' | 'In Zone' | 'No GPS' | 'Hold' | string;
  logged_in: boolean;
  on_demand: boolean;
  rating: number;
  app_version: string;
  device_type: string;
  bundle_name: string;
  national_id: string;
  vehicle_type: string;
  zone_coverage: string;
  hiring_date?: string | null;
  expiration_iqama_date?: string | null;
  lat: number;
  lng: number;
  last_location_at?: string;
  active_orders_count: number;
  is_archived: boolean;
  archive_reason?: string;
  archived_at?: string | null;
  created_at?: string;
}

export interface DispatchOrderFile {
  id: string;
  name: string;
  storedName: string;
  size: number;
  mimeType: string;
  category: 'general' | 'operational';
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface DispatchServiceUnit {
  id: string;
  name: string;
  status: 'New' | 'In Progress' | 'Pending Documents' | 'Completed' | 'Cancelled' | string;
  notes?: string;
}

export interface DispatchOperationExecution {
  id: string;
  vendor: string;
  currency: 'EGP' | 'SAR' | 'USD' | 'AED' | 'EUR' | string;
  execution_amount: number;
  execution_cost: number;
  execution_status: 'New' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled' | string;
  accounting_confirmation: 'Pending' | 'Confirmed' | 'Rejected' | string;
  confirmed_by: string;
  confirmation_date: string;
}

export interface DispatchRepresentativeEntry {
  id: string;
  riderId?: number | null;
  name: string;
  mobile: string;
  role: string;
  status: 'Assigned' | 'On Way' | 'Completed' | 'Cancelled' | string;
  assignedAt: string;
  notes?: string;
}

export interface DispatchChangeLogItem {
  field: string;
  oldValue: string;
  newValue: string;
}

export interface DispatchChangeLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  queue: string;
  action: 'Created' | 'Updated' | string;
  changes: DispatchChangeLogItem[];
}

export interface DispatchOrder {
  id: number;
  company_id?: number;
  order_number: string;
  service_number?: string;
  trip_id?: number | null;
  trip_number?: string;
  team_id?: number | null;
  team_name: string;
  store_name: string;
  store_code: string;
  brand: string;
  city: string;
  governorate?: string;
  customer_name: string;
  customer_mobile: string;
  customer_zone: string;
  address: string;
  lat: number;
  lng: number;
  rider_id?: number | null;
  rider_name: string;
  rider_mobile: string;
  provider_name: string;
  status:
    | 'Ready'
    | 'In Progress'
    | 'On Trip'
    | 'Picked-up'
    | 'Way To Customer'
    | 'Delivered'
    | 'Scheduled'
    | 'Paused'
    | 'Canceled'
    | 'Returned'
    | string;
  performance: 'EXCELLENT' | 'GOOD' | 'LATE' | 'NOT_RATED' | string;
  amount: number;
  balance_due: number;
  payment_type: 'Cash' | 'Paid' | 'Card' | string;
  is_manual: boolean;
  is_abused: boolean;
  abuse_reason?: string;
  remove_abuse_requested: boolean;
  is_transferred: boolean;
  in_zone: boolean;
  vehicle_type: string;
  note?: string;
  description?: string;
  created_by: string;
  set_as_ready_by: string;
  shift_date?: string | null;
  order_date?: string | null;
  order_category?: string;
  order_type?: string;
  service_urgency?: string;
  document_receipt?: string;
  operations_status?: string;
  hold_reason?: string;
  operations_officer?: string;
  current_queue?: string;
  current_stage?: string;
  case_priority?: string;
  payment_status?: string;
  ready_to_close_sale?: boolean;
  sales_status?: string;
  individuals_completed?: number;
  individuals_total?: number;
  files?: DispatchOrderFile[];
  operational_files?: DispatchOrderFile[];
  service_units?: DispatchServiceUnit[];
  operations_executions?: DispatchOperationExecution[];
  representatives?: DispatchRepresentativeEntry[];
  change_history?: DispatchChangeLogEntry[];
  order_duration_min: number;
  distance_km: number;
  map_distance_km: number;
  created_at: string;
  updated_at?: string;
}

export interface DispatchTrip {
  id: number;
  company_id?: number;
  trip_number: string;
  trip_type?: string;
  team_id?: number | null;
  team_name: string;
  rider_id?: number | null;
  rider_name: string;
  status: 'Running' | 'Returning' | 'Completed' | 'Canceled' | string;
  performance: 'EXCELLENT' | 'GOOD' | 'LATE' | 'NOT_RATED' | string;
  is_manual: boolean;
  orders_count: number;
  expecting_duration_min: number;
  trip_duration_min: number;
  trip_distance_km: number;
  returning_duration_min: number;
  estimate_returning_min: number;
  planned_return_distance_km: number;
  total_amount: number;
  delivery_zone_extra_fees: number;
  live_location_percentage: number;
  started_at?: string;
  completed_at?: string | null;
  created_at: string;
  orders?: DispatchOrder[];
}

export interface DispatchShift {
  id: number;
  rider_id?: number | null;
  rider_name: string;
  team_name: string;
  shift_date?: string;
  started_at: string;
  ended_at?: string | null;
  status: 'Active' | 'Completed' | 'Break' | string;
  orders_completed: number;
  cash_collected: number;
  revenue_total: number;
  notes?: string;
}

export interface DispatchKpis {
  avgDeliveryMin: number;
  excellentTasksPct: number;
  ridersPerformancePct: number;
  avgWaitingMin: number;
  avgPendingMin: number;
  totalOrders: number;
  abusedOrders: number;
  abusedPct: number;
  automationPct: number;
  scheduledCount: number;
  pendingCount: number;
  pausedCount: number;
  onTripsCount: number;
  deliveredCount: number;
  cancelledCount: number;
  cancelledPct: number;
  lateCount: number;
  totalTrips: number;
  activeTripsCount: number;
  pickedCount: number;
  wayToCustomerCount: number;
  onTripOnlyCount: number;
  ridersTotal: number;
  ridersOnDuty: number;
  ridersAvailable: number;
  ridersBreak: number;
  ridersInZone: number;
  ridersNoGps: number;
}

export interface DispatchScheduledCapacitySlot {
  id: string;
  days: string;
  fromTime: string;
  toTime: string;
  maxCapacity: number;
}

export interface DispatchStoreConfig {
  dispatchingQueue: {
    queueParameter: string;
    closeToPickupEnabled: boolean;
    closeToPickupMeters: number;
    inRangeOfPickupEnabled: boolean;
    inRangeOfPickupMeters: number;
    farFromPickupEnabled: boolean;
    farFromPickupMeters: number;
  };
  dispatchingSettings: {
    limitMaxTripCapacity?: number;
    defaultTripCapacity: number;
    scheduledMaxCapacities?: DispatchScheduledCapacitySlot[];
    orderStartStatus: string;
    maximumGroupingTimeMin?: number;
    tripCapacitySmartAutoComplete: boolean;
    maxTimeLimitEnabled: boolean;
    maxTimeLimitMin: number;
    preventManualAssignOrderToTrip?: boolean;
    customerZoneOption?: 'Area' | 'Street' | string;
    expirationTimeEnabled?: boolean;
    expirationTimeMin?: number;
    minimumTimeBetweenTripsEnabled?: boolean;
    minimumTimeBetweenTripsMin: number;
  };
  riderOrderJourney: {
    riderOnMyWayToPickup: boolean;
    arrivedToPickup: boolean;
    arrivedToPickupDistanceRestriction?: boolean;
    arrivedToPickupDistanceMeters?: number;
    automaticArriveToPickup?: boolean;
    smartPickupEnabled?: boolean;
    smartPickupSeconds?: number;
    pickedUpDistanceRestriction: boolean;
    pickedUpDistanceMeters: number;
    wayToDropOffAction: boolean;
    smartOnMyWay: boolean;
    customerServingTimeMin: number;
    dropOffImageCaptureEnabled?: boolean;
    arrivedToCustomerAction: boolean;
    arrivedToCustomerDistanceRestriction?: boolean;
    arrivedToCustomerDistanceMeters?: number;
    automaticArriveToCustomer?: boolean;
    orderDeliveryGpsRestriction: boolean;
    orderDeliveryGpsMeters: number;
    orderDeliveryGpsOutOfZoneAction: string;
    orderDeliveryGeofenceRestriction: boolean;
    orderDeliveryGeofenceOutOfZoneAction: string;
    failedToDeliverTripRunningAction: string;
    cantDeliverShippingAddressRadiusEnabled?: boolean;
    cantDeliverShippingAddressRadiusMeters?: number;
    cantDeliverStoreRadiusEnabled?: boolean;
    cantDeliverStoreRadiusMeters?: number;
  };
  ordersAbuse: {
    enabled?: boolean;
    distancePickupToDropoffEnabled: boolean;
    distancePickupToDropoffMinMeters: number;
    distancePickupToDropoffMaxEnabled: boolean;
    distancePickupToDropoffMaxMeters: number;
    distancePickupToDropoffMaxKm?: number;
    timePickupToDropoffEnabled: boolean;
    timePickupToDropoffMinMinutes: number;
    timeBetweenTwoOrdersEnabled: boolean;
    timeBetweenTwoOrdersMinMinutes: number;
    fromOrderCreationEnabled: boolean;
    fromOrderCreationMinMinutes: number;
  };
  gpsLocations: {
    closeToFirstOrderEnabled: boolean;
    closeToFirstOrderMeters: number;
    withinRangeOfFirstOrderEnabled: boolean;
    withinRangeOfFirstOrderMeters: number;
  };
  sla: {
    deliveryExcellentUnderMin: number;
    deliveryGoodUnderMin: number;
    deliveryLateOverMin: number;
    orderPreparationMin: number;
    orderFetchingMin: number;
    onMyWayToPickupMin?: number;
    arriveToPickupMin?: number;
    riderWaitingInStoreMin: number;
    pickedUpTimeMin?: number;
    arriveToCustomerMin?: number;
    customerAvgServingTimeMin: number;
  };
}

export interface DispatchStore {
  id: number;
  company_id?: number;
  name: string;
  brand: string;
  code: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  is_active: boolean;
  config: DispatchStoreConfig;
  created_at?: string;
}

export interface DispatchCustomerZone {
  id: number;
  company_id?: number;
  store_id: number;
  name: string;
  city: string;
  has_geofence: boolean;
  geofence_radius_m: number;
  geofence_polygon?: [number, number][];
  geofence_color?: string;
  lat: number;
  lng: number;
  default_vehicle_type: string;
  extra_fees: number;
  is_active: boolean;
  created_at?: string;
}

export interface DispatchSmartRouteZoneRef {
  id: number;
  name: string;
}

export interface DispatchSmartRoute {
  id: number;
  company_id?: number;
  store_id: number;
  name: string;
  zones: DispatchSmartRouteZoneRef[];
  is_active: boolean;
  created_at?: string;
}

export interface DispatchWalletStoreRow {
  team_name: string;
  total_amount: number;
  transactions_count: number;
  riders_count: number;
  collections_total: number;
  commissions_total: number;
  currency: string;
}

export interface DispatchWalletAgentRow {
  rider_id: number;
  team_name: string;
  provider_name: string;
  rider_name: string;
  enroll_id: string;
  total_amount: number;
  transactions_count: number;
  payroll_method: string;
  payroll_method_number: string;
  currency: string;
}

export interface DispatchWalletTransaction {
  id: number;
  company_id?: number;
  team_id?: number | null;
  team_name: string;
  provider_name: string;
  rider_id?: number | null;
  rider_name: string;
  enroll_id: string;
  trip_id?: number | null;
  trip_number: string;
  transaction_type:
    | 'COMPLETE_TRIP'
    | 'COLLECTION'
    | 'COMMISSION'
    | 'BONUS'
    | 'DEDUCTION'
    | 'MANUAL_ADJUSTMENT'
    | 'SETTLEMENT'
    | string;
  is_award: boolean;
  amount: number;
  currency: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}

export type DispatchReasonCategory =
  | 'cancellation'
  | 'schedule'
  | 'pause'
  | 'cancel_shift'
  | 'end_shift'
  | 'remove_from_trip'
  | 'break';

export interface DispatchReason {
  id: number;
  company_id?: number;
  category: DispatchReasonCategory;
  name: string;
  reason_type?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DispatchRiderRevenueRule {
  id: number | null;
  company_id?: number;
  scope: 'company' | 'team' | string;
  team_id: number | null;
  team_name: string;
  has_override?: boolean;
  online_shift_hours_enabled: boolean;
  online_shift_hour_price: number;
  excellent_trip_revenue: number;
  good_trip_revenue: number;
  late_trip_revenue: number;
  abuse_trip_deduction: number;
  order_rev_excellent: number;
  order_rev_good: number;
  order_rev_late: number;
  order_rev_abuse: number;
  trip_ignoring_enabled: boolean;
  trip_ignoring_deduction: number;
  trip_ignoring_penalization_enabled: boolean;
  trip_ignoring_penalization_deduction: number;
  rider_abuse_penalization_enabled: boolean;
  rider_abuse_penalization_deduction: number;
  currency: string;
}

export interface DispatchTripType {
  id: number;
  company_id?: number;
  name: string;
  code: string;
  description: string;
  base_fee: number;
  max_orders: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export function getDispatchAuthHeaders(isJson = true): Record<string, string> {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id') || '1';
  const headers: Record<string, string> = {
    'x-user-id': userId
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function formatDurationMMSS(minutes: number | string | null | undefined): string {
  const m = Number(minutes || 0);
  if (!Number.isFinite(m) || m <= 0) return '00:00';
  const mins = Math.floor(m);
  const secs = Math.round((m - mins) * 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatElapsedFromIso(iso?: string | null): string {
  if (!iso) return '00:00';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '00:00';
  const diffSec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  const mins = Math.floor(diffSec / 60);
  const secs = diffSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatShortDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${dd}-${mm}-${yyyy} ${time}`;
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return '—';
  const s = String(iso);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
