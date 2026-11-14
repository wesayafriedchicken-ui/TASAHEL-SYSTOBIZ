import React, { useState, useEffect, useMemo } from 'react';
import { 
  Smartphone, Clock, ClipboardList, MessageSquare, Bell, Truck, 
  CheckCircle2, RefreshCw, AlertCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MobileDockScreenConfig {
  id: string;
  route: string;
  title: string;
  arabicTitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  iconBorder: string;
}

export const DOCK_SCREENS_LIST: MobileDockScreenConfig[] = [
  {
    id: 'attendance',
    route: '/Attendance',
    title: 'Attendance',
    arabicTitle: '(الحضور والانصراف)',
    description: 'تسجيل الحضور والانصراف، الورديات، والطلبات الشخصية',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    iconBorder: 'border-amber-200/80'
  },
  {
    id: 'tasks',
    route: '/Tasks',
    title: 'Tasks',
    arabicTitle: '(المهام)',
    description: 'قوائم المهام، المتابعة اليومية، وحالات الإنجاز',
    icon: ClipboardList,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    iconBorder: 'border-emerald-200/80'
  },
  {
    id: 'chat',
    route: '/Chat',
    title: 'Chat',
    arabicTitle: '(المحادثات)',
    description: 'المحادثات المباشرة بين فرق العمل والقنوات الخاصة',
    icon: MessageSquare,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    iconBorder: 'border-indigo-200/80'
  },
  {
    id: 'notifications',
    route: '/Alerts',
    title: 'Notifications',
    arabicTitle: '(الإشعارات)',
    description: 'تنبيهات النظام اللحظية، الإعلانات، وتحديثات العمليات',
    icon: Bell,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    iconBorder: 'border-amber-200/80'
  },
  {
    id: 'delivery',
    route: '/Delivery',
    title: 'Delivery Tracking',
    arabicTitle: '(تتبع التوصيل)',
    description: 'متابعة مسارات المناديب، الطلبيات، والشحنات الحية',
    icon: Truck,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-600',
    iconBorder: 'border-orange-200/80'
  }
];

interface MobileAppPermissionsCardProps {
  roleId: number;
  roleName: string;
  initialMobilePermissions?: Record<string, boolean>;
  onPermissionsUpdated?: (roleId: number, mobilePerms: Record<string, boolean>, updatedFullPerms?: any) => void;
}

export const MobileAppPermissionsCard: React.FC<MobileAppPermissionsCardProps> = ({
  roleId,
  roleName,
  initialMobilePermissions,
  onPermissionsUpdated
}) => {
  const defaultState = useMemo<Record<string, boolean>>(() => ({
    '/Attendance': true,
    '/Tasks': true,
    '/Chat': true,
    '/Alerts': true,
    '/Delivery': true
  }), []);

  const [permissions, setPermissions] = useState<Record<string, boolean>>(() => {
    return { ...defaultState, ...(initialMobilePermissions || {}) };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync when initialMobilePermissions or roleId changes
  useEffect(() => {
    if (initialMobilePermissions && Object.keys(initialMobilePermissions).length > 0) {
      setPermissions({ ...defaultState, ...initialMobilePermissions });
    } else {
      // Fetch latest from API if not pre-populated
      let isMounted = true;
      fetch(`/api/admin/roles/${roleId}/mobile-permissions`)
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.success && data.mobile_permissions) {
            setPermissions({ ...defaultState, ...data.mobile_permissions });
          }
        })
        .catch(() => {
          // Keep defaults if fetch fails
        });

      return () => { isMounted = false; };
    }
  }, [roleId, initialMobilePermissions, defaultState]);

  // Persist changes immediately to PostgreSQL and notify parent
  const savePermissionsImmediately = async (newPerms: Record<string, boolean>) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const res = await fetch(`/api/admin/roles/${roleId}/mobile-permissions`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mobile_permissions: newPerms
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save mobile permissions');
      }

      setSaveSuccessMessage('تم الحفظ في قاعدة البيانات فوراً');
      setTimeout(() => setSaveSuccessMessage(null), 3000);

      if (onPermissionsUpdated) {
        onPermissionsUpdated(roleId, newPerms, data.permissions);
      }
    } catch (err: any) {
      console.error('Error saving mobile permissions:', err);
      setErrorMessage(err.message || 'حدث خطأ أثناء حفظ الصلاحيات');
      // Revert will happen if user reloads, but notify them
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRoute = (route: string) => {
    const nextVal = permissions[route] === false ? true : false;
    const updated = {
      ...permissions,
      [route]: nextVal
    };
    setPermissions(updated);
    savePermissionsImmediately(updated);
  };

  const handleEnableAll = () => {
    const updated: Record<string, boolean> = {
      '/Attendance': true,
      '/Tasks': true,
      '/Chat': true,
      '/Alerts': true,
      '/Delivery': true
    };
    setPermissions(updated);
    savePermissionsImmediately(updated);
  };

  const handleDisableAll = () => {
    const updated: Record<string, boolean> = {
      '/Attendance': false,
      '/Tasks': false,
      '/Chat': false,
      '/Alerts': false,
      '/Delivery': false
    };
    setPermissions(updated);
    savePermissionsImmediately(updated);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-7 relative overflow-hidden mb-6 transition-all">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        {/* Left Side: Icon, Title & Floating Dock Metadata */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="font-black text-slate-900 text-lg md:text-xl tracking-tight">
                Mobile App Permissions / صلاحيات تطبيق الجوال
              </h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-black bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                FLOATING DOCK
              </span>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                {roleName || 'Admin'}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
              تحكم بشاشات الشريط السفلي الـ 5 (Floating Dock) لتطبيق الهاتف — التغييرات تحفظ في قاعدة البيانات فوراً
            </p>
          </div>
        </div>

        {/* Right Side: Database Status & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            {isSaving ? (
              <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{isSaving ? 'جارٍ الحفظ في قاعدة البيانات...' : saveSuccessMessage || 'قاعدة البيانات متصلة وتستجيب فوراً'}</span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDisableAll}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              تعطيل الكل
            </button>
            <button
              type="button"
              onClick={handleEnableAll}
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
            >
              تفعيل الكل
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 5 Screen Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
        {DOCK_SCREENS_LIST.map((item) => {
          const isEnabled = permissions[item.route] !== false;
          const IconComp = item.icon;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border transition-all duration-200 p-5 flex flex-col justify-between group",
                isEnabled
                  ? "bg-white border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-300"
                  : "bg-slate-50/50 border-slate-200/60 opacity-85 hover:opacity-100"
              )}
            >
              {/* Card Header: Icon & Allowed/Disabled Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs", item.iconBg, item.iconColor, item.iconBorder)}>
                    <IconComp className="w-5 h-5" />
                  </div>

                  {isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      مسموح
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-500 border border-slate-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      معطل
                    </span>
                  )}
                </div>

                {/* Title & Arabic Subtitle */}
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-tight">
                    {item.title}
                  </h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    {item.arabicTitle}
                  </span>
                </div>

                {/* Route Pill Badge */}
                <div className="my-2.5">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-bold font-mono bg-indigo-50/80 text-indigo-700 border border-indigo-100/70 shadow-2xs">
                    {item.route}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-slate-500 leading-relaxed min-h-[34px]">
                  {item.description}
                </p>
              </div>

              {/* Bottom Row: Label & Toggle Switch */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">
                  شريط الموبايل
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  disabled={isSaving}
                  onClick={() => handleToggleRoute(item.route)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50",
                    isEnabled ? "bg-emerald-600" : "bg-slate-300"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MobileAppPermissionsCard;
