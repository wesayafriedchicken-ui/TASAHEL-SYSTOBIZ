import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, Edit3, X, CheckCircle2 } from 'lucide-react';
import { MODULE_SENSITIVE_FIELDS } from './rbacPresets';

interface FieldSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName: string;
  roleName: string;
  currentFieldPermissions: Record<string, 'editable' | 'readonly' | 'hidden'>;
  onSaveFieldPermissions: (fieldPermissions: Record<string, 'editable' | 'readonly' | 'hidden'>) => void;
}

export const FieldSecurityModal: React.FC<FieldSecurityModalProps> = ({
  isOpen,
  onClose,
  moduleName,
  roleName,
  currentFieldPermissions,
  onSaveFieldPermissions,
}) => {
  if (!isOpen) return null;

  const canonModule = moduleName === 'HR Management' ? 'HR' : moduleName === 'Sales CRM' ? 'CRM' : moduleName;
  const sensitiveFields = MODULE_SENSITIVE_FIELDS[canonModule] || [
    { key: 'financial_budget', labelEn: 'Financial Budget & Totals', labelAr: 'الميزانية المعتمدة والإجماليات', permLevel: 1, defaultStatus: 'readonly' as const },
    { key: 'confidential_notes', labelEn: 'Internal Management Notes', labelAr: 'الملاحظات الإدارية السرية', permLevel: 2, defaultStatus: 'hidden' as const },
    { key: 'contact_info', labelEn: 'Sensitive Contact Information', labelAr: 'معلومات التواصل الحساسة', permLevel: 0, defaultStatus: 'editable' as const }
  ];

  const [fieldState, setFieldState] = useState<Record<string, 'editable' | 'readonly' | 'hidden'>>(() => {
    const initial: Record<string, 'editable' | 'readonly' | 'hidden'> = {};
    sensitiveFields.forEach(f => {
      initial[f.key] = currentFieldPermissions[f.key] || f.defaultStatus;
    });
    return initial;
  });

  const handleFieldStatusChange = (key: string, status: 'editable' | 'readonly' | 'hidden') => {
    setFieldState(prev => ({
      ...prev,
      [key]: status
    }));
  };

  const handleSave = () => {
    onSaveFieldPermissions(fieldState);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col">
        <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">التحكم في مستويات صلاحيات الحقول (Permission Levels)</h3>
              <p className="text-xs text-indigo-200 mt-0.5">
                Field Level Security for Role: <span className="font-black text-amber-300">{roleName}</span> ({moduleName})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {/* ERPNext Permission Levels Architecture Guide Banner */}
          <div className="p-4 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl border border-indigo-700/50 shadow-md space-y-2.5" dir="rtl">
            <div className="flex items-center justify-between border-b border-indigo-700/50 pb-2">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                معمارية مستويات الصلاحيات (Frappe / ERPNext Permission Levels)
              </span>
              <span className="text-[10px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">
                تأمين المستند والحقول
              </span>
            </div>

            <div className="text-[11px] text-slate-200 leading-relaxed space-y-1.5">
              <p>
                <strong className="text-indigo-300">1️⃣ المستوى الصفر (Level 0 = Document Level):</strong> هو البوابة الرئيسية لدخول المستند/الشاشة بالكامل (Read, Write, Create, Delete).
              </p>
              <div className="p-2 bg-amber-500/10 border border-amber-400/30 rounded-xl text-amber-200 text-[10px] font-bold">
                ⚡ القاعدة الذهبية: "If a Role does not have access at Level 0, then higher levels are meaningless."
                <br />
                إذا لم يمتلك الدور صلاحية عند Level 0، فلن يتمكن من فتح الشاشة أصلًا وتصبح صلاحيات الحقول بلا قيمة.
              </div>
              <p>
                <strong className="text-indigo-300">2️⃣ المستويات الأعلى (Level 1, 2, 3... = Field Levels):</strong> تُخصص للحقول الحساسة داخل المستند (مثل الراتب، الرقم القومي، الأرباح) للتحكم برؤيتها وتعديلها.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {sensitiveFields.map((field) => {
              const currentStatus = fieldState[field.key] || field.defaultStatus;

              return (
                <div 
                  key={field.key}
                  className="p-4 border border-slate-200 rounded-2xl bg-white space-y-3 hover:border-indigo-300 transition-all shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                          field.permLevel === 0 ? 'bg-slate-100 text-slate-700 border-slate-300' :
                          field.permLevel === 1 ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          field.permLevel === 2 ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          Perm Level {field.permLevel}
                        </span>
                        <h4 className="text-xs font-black text-slate-800">{field.labelEn}</h4>
                      </div>
                      <span className="text-[11px] text-indigo-700 font-bold block mt-1" dir="rtl">
                        {field.labelAr}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                      currentStatus === 'editable' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      currentStatus === 'readonly' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {currentStatus === 'editable' ? 'تعديل وقراءة' : currentStatus === 'readonly' ? 'قراءة فقط' : 'مخفي سري'}
                    </span>
                  </div>

                  {/* Status Options Toggle Group */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleFieldStatusChange(field.key, 'editable')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        currentStatus === 'editable'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>تعديل (Editable)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldStatusChange(field.key, 'readonly')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        currentStatus === 'readonly'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>قراءة (Read-Only)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleFieldStatusChange(field.key, 'hidden')}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        currentStatus === 'hidden'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>مخفي (Hidden)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
          >
            إلغاء (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>حفظ إعدادات الحقول</span>
          </button>
        </div>
      </div>
    </div>
  );
};
