import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings2, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Loader2, 
  AlertTriangle, 
  Database, 
  RefreshCw, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export interface ManageableSelectProps {
  id?: string;
  fieldKey: string;
  label?: string;
  value: string;
  onChange: (val: string) => void;
  defaultOptions?: string[];
  placeholder?: string;
  className?: string;
  selectClassName?: string;
  required?: boolean;
  disabled?: boolean;
}

interface PendingDeleteInfo {
  option: string;
  count: number;
  inUse: boolean;
  replaceWith: string;
}

export const ManageableSelect: React.FC<ManageableSelectProps> = ({
  id,
  fieldKey,
  label,
  value,
  onChange,
  defaultOptions = [],
  placeholder = 'Select option...',
  className = '',
  selectClassName = '',
  required = false,
  disabled = false,
}) => {
  const { checkPermission, previewRole, user } = useAuth();
  const isSuperAdmin = !previewRole && (user?.role_id === 1 || (user as any)?.is_super_admin || user?.role === 'Admin' || user?.role_name === 'Admin');
  const canManageOptions = isSuperAdmin || 
    checkPermission('QA', 'custom:qa_manage_options') || 
    checkPermission('QA', 'custom:manage_options') || 
    checkPermission('QA', 'action:Transactions Audit:write') ||
    checkPermission('QA', 'write');

  // Initialize from cache or defaults
  const [options, setOptions] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem(`qa_opts_${fieldKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return defaultOptions;
  });

  const [isManaging, setIsManaging] = useState(false);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [checkingUsageVal, setCheckingUsageVal] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteInfo | null>(null);
  const [replacementChoice, setReplacementChoice] = useState<string>('');
  const [isExecutingDelete, setIsExecutingDelete] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);

  // Load authoritative options from DB
  const fetchOptions = async () => {
    try {
      const res = await fetch(`/api/qa/field-options?field_key=${encodeURIComponent(fieldKey)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (data.length > 0) {
            // DB has options - this is the single source of truth
            const apiOptions = data
              .map((item: any) => item.option_value || item.option_label)
              .filter(Boolean);
            setOptions(apiOptions);
            try {
              localStorage.setItem(`qa_opts_${fieldKey}`, JSON.stringify(apiOptions));
            } catch (e) {
              console.error(e);
            }
          } else if (defaultOptions && defaultOptions.length > 0) {
            // DB is empty for this fieldKey, auto-seed defaults so they become manageable
            try {
              const seedRes = await fetch('/api/qa/field-options/seed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  field_key: fieldKey,
                  options: defaultOptions,
                }),
              });
              if (seedRes.ok) {
                const seeded = await seedRes.json();
                const seededOptions = seeded
                  .map((item: any) => item.option_value || item.option_label)
                  .filter(Boolean);
                if (seededOptions.length > 0) {
                  setOptions(seededOptions);
                  localStorage.setItem(`qa_opts_${fieldKey}`, JSON.stringify(seededOptions));
                }
              }
            } catch (seedErr) {
              console.warn('Could not auto-seed default options:', seedErr);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Could not load options for ${fieldKey}:`, err);
    }
  };

  useEffect(() => {
    fetchOptions();

    // Listen for options changes from other instances of ManageableSelect
    const handleSync = (e: any) => {
      if (e?.detail?.fieldKey === fieldKey) {
        fetchOptions();
      }
    };
    window.addEventListener('qa_options_updated', handleSync);
    return () => {
      window.removeEventListener('qa_options_updated', handleSync);
    };
  }, [fieldKey]);

  // Handle Add Option
  const handleAddOption = async () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;

    if (options.includes(trimmed)) {
      onChange(trimmed);
      setNewOptionInput('');
      setNotification({ type: 'success', message: `Option "${trimmed}" already exists.` });
      setTimeout(() => setNotification(null), 2500);
      return;
    }

    setAdding(true);
    const updated = [...options, trimmed];
    setOptions(updated);
    try {
      localStorage.setItem(`qa_opts_${fieldKey}`, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Save to DB
    try {
      await fetch('/api/qa/field-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_key: fieldKey,
          option_value: trimmed,
          option_label: trimmed,
        }),
      });

      // Broadcast update
      window.dispatchEvent(new CustomEvent('qa_options_updated', { detail: { fieldKey } }));
      setNotification({ type: 'success', message: `Added "${trimmed}" successfully!` });
      setTimeout(() => setNotification(null), 2500);
    } catch (err) {
      console.error('Failed to sync added option to server:', err);
    } finally {
      setAdding(false);
      onChange(trimmed);
      setNewOptionInput('');
    }
  };

  // Step 1 of Delete: Check if option is used by old records in the database
  const initiateDelete = async (optToDelete: string) => {
    setCheckingUsageVal(optToDelete);
    setNotification(null);

    try {
      const res = await fetch(
        `/api/qa/field-options/usage?field_key=${encodeURIComponent(fieldKey)}&option_value=${encodeURIComponent(optToDelete)}`
      );
      let count = 0;
      let inUse = false;

      if (res.ok) {
        const data = await res.json();
        count = data.count || 0;
        inUse = count > 0;
      }

      const otherOptions = options.filter((o) => o !== optToDelete);
      const defaultReplacement = otherOptions[0] || '';

      setReplacementChoice(defaultReplacement);
      setPendingDelete({
        option: optToDelete,
        count,
        inUse,
        replaceWith: defaultReplacement,
      });
    } catch (err) {
      console.error('Failed to check option usage:', err);
      // Fallback: allow deletion with 0 count
      const otherOptions = options.filter((o) => o !== optToDelete);
      setPendingDelete({
        option: optToDelete,
        count: 0,
        inUse: false,
        replaceWith: otherOptions[0] || '',
      });
    } finally {
      setCheckingUsageVal(null);
    }
  };

  // Step 2 of Delete: Confirm and execute deletion (with or without DB record replacement)
  const executeDelete = async (shouldReplace: boolean) => {
    if (!pendingDelete) return;

    const optToDelete = pendingDelete.option;
    const replaceWithVal = shouldReplace ? replacementChoice : null;

    setIsExecutingDelete(true);

    try {
      const res = await fetch('/api/qa/field-options', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_key: fieldKey,
          option_value: optToDelete,
          replace_with: replaceWithVal,
          keep_existing: !shouldReplace,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to delete option');
      }

      const resData = await res.json();

      // Update local options state
      const updated = options.filter((o) => o !== optToDelete);
      setOptions(updated);
      try {
        localStorage.setItem(`qa_opts_${fieldKey}`, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }

      // If current form value was the deleted option, update it
      if (value === optToDelete) {
        if (shouldReplace && replaceWithVal) {
          onChange(replaceWithVal);
        } else {
          onChange(updated[0] || '');
        }
      }

      // Broadcast update to other components
      window.dispatchEvent(new CustomEvent('qa_options_updated', { detail: { fieldKey } }));

      // Success message
      let msg = `تم حذف الخيار "${optToDelete}" بنجاح.`;
      if (shouldReplace && resData.updated_records > 0) {
        msg += ` وتم تحديث ${resData.updated_records} سجل في قاعدة البيانات إلى "${replaceWithVal}".`;
      } else if (!shouldReplace && pendingDelete.count > 0) {
        msg += ` وتم الاحتفاظ بـ ${pendingDelete.count} سجل قديم كما هي في قاعدة البيانات.`;
      }

      setNotification({ type: 'success', message: msg });
      setTimeout(() => setNotification(null), 4000);
      setPendingDelete(null);
    } catch (err: any) {
      console.error('Failed to execute option deletion:', err);
      setNotification({
        type: 'error',
        message: 'حدث خطأ أثناء حذف الخيار: ' + (err.message || 'Unknown error'),
      });
    } finally {
      setIsExecutingDelete(false);
    }
  };

  // Handle Select Change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__ADD_NEW__') {
      setIsManaging(true);
      return;
    }
    onChange(selected);
  };

  const defaultSelectClass =
    'w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all text-sm';
  const finalSelectClass = selectClassName || defaultSelectClass;

  // Ensure current value is displayed even if deprecated/deleted from list
  const allDisplayOptions = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <div className={`relative ${className}`} id={id}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-slate-600 font-bold text-xs sm:text-sm">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
          {canManageOptions && !disabled && (
            <button
              type="button"
              onClick={() => {
                setIsManaging(true);
                setPendingDelete(null);
                setNotification(null);
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/90 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200/80 transition-all cursor-pointer shadow-2xs"
              title="Manage choices (Add, Delete & Migrate Old Records)"
            >
              <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Manage Options</span>
            </button>
          )}
        </div>
      )}

      <div className="relative">
        <select
          value={value}
          onChange={handleSelectChange}
          disabled={disabled}
          className={finalSelectClass}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {allDisplayOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
          {canManageOptions && !disabled && (
            <option value="__ADD_NEW__" className="text-indigo-600 font-bold bg-indigo-50">
              ➕ + Add / Manage options...
            </option>
          )}
        </select>
      </div>

      {/* Options Management Modal Dialog */}
      {isManaging && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col relative animate-scaleUp max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-indigo-600" />
                  Manage Options: <span className="text-indigo-600">{label || fieldKey}</span>
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  إدارة الخيارات: إضافة خيارات جديدة أو حذف وتحديث السجلات المسجلة
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManaging(false);
                  setPendingDelete(null);
                  setNotification(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification Banner */}
            {notification && (
              <div
                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b animate-fadeIn ${
                  notification.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {notification.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
            )}

            {/* Add New Option Form */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                إضافة خيار جديد / Add New Option
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newOptionInput}
                  onChange={(e) => setNewOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                  placeholder="Type new option name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={!newOptionInput.trim() || adding}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
                >
                  {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Add Option</span>
                </button>
              </div>
            </div>

            {/* Options List */}
            <div className="p-4 overflow-y-auto space-y-2 bg-slate-50/50 flex-1 max-h-[340px]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Active Options ({options.length})
                </span>
                <span className="text-[10px] text-slate-400">انقر على أيقونة الحذف لإزالة الخيار</span>
              </div>

              {options.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">
                  لا توجد خيارات حالياً. أضف خيارك الأول أعلاه!
                </div>
              ) : (
                options.map((opt) => {
                  const isSelected = opt === value;
                  const isCheckingThis = checkingUsageVal === opt;

                  return (
                    <div
                      key={opt}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                        isSelected
                          ? 'bg-indigo-50/90 border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span className="truncate text-slate-900 font-bold">{opt}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold shrink-0">
                            Current Selected
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => initiateDelete(opt)}
                          disabled={isCheckingThis || isExecutingDelete}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-40"
                          title="حذف هذا الخيار"
                        >
                          {isCheckingThis ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-rose-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsManaging(false);
                  setPendingDelete(null);
                  setNotification(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Done / تم
              </button>
            </div>

            {/* Sub-Dialog: Confirm Deletion & Old Data Migration Prompt */}
            {pendingDelete && (
              <div className="absolute inset-0 z-30 bg-white/98 backdrop-blur-sm p-6 flex flex-col justify-between overflow-y-auto animate-fadeIn">
                <div className="space-y-4">
                  {/* Alert Header */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        pendingDelete.count > 0 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {pendingDelete.count > 0 ? (
                        <Database className="w-6 h-6" />
                      ) : (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        {pendingDelete.count > 0
                          ? 'تأكيد الحذف: توجد بيانات قديمة مسجلة بهذا الخيار'
                          : 'تأكيد حذف الخيار'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        أنت على وشك حذف الخيار:{' '}
                        <span className="font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {pendingDelete.option}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Scenario A: Records exist in DB */}
                  {pendingDelete.count > 0 ? (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          تم العثور على{' '}
                          <span className="text-amber-950 font-black underline">
                            {pendingDelete.count} سجل
                          </span>{' '}
                          في قاعدة البيانات مسجلة بقيمة "{pendingDelete.option}".
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        هل ترغب في <strong>استبدال قيمته في السجلات القديمة</strong> بخيار جديد، أم
                        تفضل <strong>إبقاء السجلات القديمة كما هي</strong> دون تعديل؟
                      </p>

                      {/* Option 1: Replace with another option */}
                      <div className="p-3 bg-white rounded-lg border border-amber-200/90 space-y-2">
                        <span className="text-[11px] font-bold text-slate-800 block">
                          الخيار 1: استبدال القيمة في السجلات القديمة بقيمة جديدة
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] text-slate-500 font-medium shrink-0">
                            استبدل بـ:
                          </label>
                          <select
                            value={replacementChoice}
                            onChange={(e) => setReplacementChoice(e.target.value)}
                            disabled={isExecutingDelete}
                            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                          >
                            {options
                              .filter((o) => o !== pendingDelete.option)
                              .map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => executeDelete(true)}
                          disabled={!replacementChoice || isExecutingDelete}
                          className="w-full mt-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {isExecutingDelete ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span>
                            تأكيد واستبدال القيمة في ({pendingDelete.count}) سجل بالخيار الجديد
                          </span>
                        </button>
                      </div>

                      {/* Option 2: Keep as is */}
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                        <span className="text-[11px] font-bold text-slate-800 block">
                          الخيار 2: حذف الخيار فقط مع إبقاء السجلات القديمة كما هي
                        </span>
                        <p className="text-[11px] text-slate-500">
                          لن يظهر الخيار في القائمة مستقبلاً، لكن ستبقى السجلات السابقة محتفظة بنفس
                          القيمة القديمة.
                        </p>
                        <button
                          type="button"
                          onClick={() => executeDelete(false)}
                          disabled={isExecutingDelete}
                          className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {isExecutingDelete ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>حذف الخيار فقط (إبقاء السجلات القديمة دون تغيير)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Scenario B: No records found in DB */
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                      <p className="text-xs text-slate-700 leading-relaxed">
                        لا توجد أي سجلات حالية في قاعدة البيانات تستخدم هذا الخيار. سيتم حذفه نهائياً
                        من القائمة المتاحة.
                      </p>
                      <button
                        type="button"
                        onClick={() => executeDelete(false)}
                        disabled={isExecutingDelete}
                        className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        {isExecutingDelete ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        <span>تأكيد حذف الخيار الآن</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Cancel Action */}
                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    disabled={isExecutingDelete}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    إلغاء التراجع / Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageableSelect;
