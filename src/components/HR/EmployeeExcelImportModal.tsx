import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Building2,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface PreviewRow {
  rowNumber: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  team_name: string;
  job_title: string;
  manager_ref: string;
  phone: string;
  extension_number: string;
  status: string;
  contract_type: string;
  hire_date: string | null;
  contract_end_date: string | null;
  salary_base: number;
  allowances: number;
  currency: string;
  vacation_balance: number;
  sick_leave_balance: number;
  attendance_method: string;
  national_id: string;
  gender: string;
  date_of_birth: string | null;
  nationality: string;
  marital_status: string;
  work_location: string;
  job_grade: string;
  personal_email: string;
  city: string;
  country: string;
  address: string;
  bank_name: string;
  account_number: string;
  iban: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  portal_password?: string;
  rowStatus: 'valid' | 'duplicate' | 'error';
  departmentStatus: 'matched' | 'new' | 'default';
  existingUserId: number | null;
  errors: string[];
  warnings: string[];
}

interface PreviewResponse {
  fileName: string;
  dialect: string;
  matchedColumns: string[];
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  newDepartments: string[];
  rows: PreviewRow[];
}

interface ImportResult {
  success: boolean;
  dialect: string;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  createdDepartments: string[];
  errors: Array<{ rowNumber: number; name: string; email: string; error: string }>;
}

interface EmployeeExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: number | string;
  onImportSuccess: () => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EmployeeExcelImportModal: React.FC<EmployeeExcelImportModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
  onImportSuccess,
  showToast
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [autoCreateDepartments, setAutoCreateDepartments] = useState<boolean>(true);
  const [rowFilter, setRowFilter] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');

  if (!isOpen) return null;

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'x-user-id': String(currentUserId || localStorage.getItem('user_id') || '1')
    };
    const token = localStorage.getItem('token');
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  const resetModal = () => {
    setStep('upload');
    setPreviewData(null);
    setImportResult(null);
    setErrorBanner(null);
    setRowFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (isImporting) return;
    resetModal();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/hr/employees/import-template', {
        method: 'GET',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Failed to download template (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SystoBiz_Employees_Import_Template.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast?.('تم تحميل قالب Excel بنجاح (SystoBiz_Employees_Import_Template.xlsx)', 'success');
    } catch (err: any) {
      setErrorBanner(err?.message || 'حدث خطأ أثناء تحميل قالب Excel');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileSelected = async (file: File | null | undefined) => {
    if (!file) return;
    setErrorBanner(null);

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.csv')) {
      setErrorBanner('يرجى اختيار ملف بصيغة Excel (.xlsx) أو CSV (.csv) فقط.');
      return;
    }

    setIsParsing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/hr/employees/import/preview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `فشل فحص الملف (HTTP ${res.status})`);
      }

      setPreviewData(data);
      setStep('preview');
      setRowFilter('all');
    } catch (err: any) {
      setErrorBanner(err?.message || 'حدث خطأ أثناء قراءة الملف المرفوع.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData) return;
    const actionableRows = previewData.rows.filter(
      (r) => r.rowStatus === 'valid' || (r.rowStatus === 'duplicate' && duplicateMode === 'update')
    );

    if (actionableRows.length === 0) {
      setErrorBanner('لا توجد صفوف قابلة للاستيراد بناءً على الخيارات الحالية.');
      return;
    }

    setIsImporting(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/hr/employees/import', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rows: actionableRows,
          duplicateMode,
          autoCreateDepartments
        })
      });

      const result: ImportResult & { error?: string } = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        throw new Error(result.error || `فشل حفظ البيانات في قاعدة البيانات (HTTP ${res.status})`);
      }

      setImportResult(result);
      setStep('result');
      await onImportSuccess();
      const totalSaved = (result.imported || 0) + (result.updated || 0);
      if (totalSaved > 0) {
        showToast?.(`تم حفظ ${totalSaved} موظف بنجاح في قاعدة البيانات!`, 'success');
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'حدث خطأ أثناء الحفظ في قاعدة البيانات.');
    } finally {
      setIsImporting(false);
    }
  };

  const actionableCount = previewData
    ? previewData.validCount + (duplicateMode === 'update' ? previewData.duplicateCount : 0)
    : 0;

  const filteredPreviewRows = (previewData?.rows || []).filter((r) => {
    if (rowFilter === 'all') return true;
    return r.rowStatus === rowFilter;
  });

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Import Employees from Excel</h2>
              <p className="text-xs text-indigo-100 font-medium">
                استيراد بيانات الموظفين من ملف Excel وحفظها مباشرة في قاعدة البيانات (MySQL / PostgreSQL)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            className="p-2 rounded-xl hover:bg-white/15 transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3 text-xs font-bold shrink-0">
          <div className={cn('flex items-center gap-1.5', step === 'upload' ? 'text-indigo-700' : 'text-emerald-600')}>
            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[11px]', step === 'upload' ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-700')}>
              1
            </span>
            <span>Download Template & Upload</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={cn('flex items-center gap-1.5', step === 'preview' ? 'text-indigo-700' : step === 'result' ? 'text-emerald-600' : 'text-slate-400')}>
            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[11px]', step === 'preview' ? 'bg-indigo-600 text-white' : step === 'result' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500')}>
              2
            </span>
            <span>Review & Validate</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
          <div className={cn('flex items-center gap-1.5', step === 'result' ? 'text-emerald-700' : 'text-slate-400')}>
            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[11px]', step === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500')}>
              3
            </span>
            <span>Saved to Database</span>
          </div>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorBanner}</div>
            <button type="button" onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {step === 'upload' && (
            <>
              {/* Step 1A: Download Template */}
              <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-black text-slate-900">
                      Step 1: Download the Official Excel Template (تحميل القالب الجاهز)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed" dir="rtl">
                    يحتوي الملف على جميع الأعمدة المطلوبة + صفّين مثال لتوضيح الصيغة الصحيحة + ورقة <strong>Instructions</strong> بها قائمة أقسام شركتك الحالية من قاعدة البيانات.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={isDownloadingTemplate}
                  className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {isDownloadingTemplate ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Download Excel Template (.xlsx)</span>
                </button>
              </div>

              {/* Step 1B: Upload Filled Excel */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const dropped = e.dataTransfer.files?.[0];
                  handleFileSelected(dropped);
                }}
                onClick={() => !isParsing && fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer',
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/70'
                    : 'border-slate-300 bg-slate-50/60 hover:border-indigo-400 hover:bg-indigo-50/30',
                  isParsing && 'opacity-70 cursor-wait'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="hidden"
                  onChange={(e) => handleFileSelected(e.target.files?.[0])}
                />

                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center">
                  {isParsing ? (
                    <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
                  ) : (
                    <Upload className="w-7 h-7 text-indigo-600" />
                  )}
                </div>

                <h4 className="text-sm font-black text-slate-800">
                  {isParsing
                    ? 'جاري قراءة وفحص ملف Excel...'
                    : 'Step 2: Drop your filled Excel (.xlsx) or CSV file here, or click to browse'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  يدعم ملفات <span className="font-bold text-slate-700">.xlsx</span> و <span className="font-bold text-slate-700">.csv</span> حتى 2,000 موظف في المرة الواحدة (الحد الأقصى 10MB).
                </p>
              </div>

              {/* Helpful Tips */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5" dir="rtl">
                <div className="font-black text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>ملاحظات مهمة لضمان حفظ البيانات بشكل صحيح في قاعدة البيانات:</span>
                </div>
                <ul className="list-disc pr-5 space-y-1 text-[11px] leading-relaxed">
                  <li>الأعمدة الأساسية المطلوبة هي <strong>Full_Name *</strong> و <strong>Email *</strong> (ويُفضّل إدخال <strong>Employee_ID</strong> لربط البصمة).</li>
                  <li>احذفي الصفّين التجريبيين من القالب قبل الرفع أو استبدليهما ببيانات موظفيك الفعليين.</li>
                  <li>التواريخ يُفضل أن تكون بصيغة <code>YYYY-MM-DD</code> (مثل <code>2026-01-15</code>)، والرواتب أرقام فقط بدون رموز عملة.</li>
                  <li>سيتم عرض معاينة كاملة ومراجعة للأخطاء قبل حفظ أي صف في قاعدة البيانات.</li>
                </ul>
              </div>
            </>
          )}

          {step === 'preview' && previewData && (
            <>
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-500">Total Rows</div>
                  <div className="text-xl font-black text-slate-900 mt-0.5">{previewData.totalRows}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[11px] font-bold text-emerald-700">New & Ready</div>
                  <div className="text-xl font-black text-emerald-800 mt-0.5">{previewData.validCount}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-700">Already in DB</div>
                  <div className="text-xl font-black text-amber-800 mt-0.5">{previewData.duplicateCount}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                  <div className="text-[11px] font-bold text-rose-700">Invalid Rows</div>
                  <div className="text-xl font-black text-rose-800 mt-0.5">{previewData.errorCount}</div>
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="text-xs font-black text-slate-800">Duplicate Handling (التعامل مع الموظفين الموجودين)</div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="duplicateMode"
                        checked={duplicateMode === 'skip'}
                        onChange={() => setDuplicateMode('skip')}
                        className="accent-indigo-600"
                      />
                      <span>Skip existing (تخطي الموجود)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="duplicateMode"
                        checked={duplicateMode === 'update'}
                        onChange={() => setDuplicateMode('update')}
                        className="accent-indigo-600"
                      />
                      <span>Update existing (تحديث بياناته)</span>
                    </label>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span>Missing Departments (الأقسام الجديدة)</span>
                    {previewData.newDepartments.length > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {previewData.newDepartments.length} new
                      </span>
                    )}
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={autoCreateDepartments}
                      onChange={(e) => setAutoCreateDepartments(e.target.checked)}
                      className="accent-indigo-600 w-4 h-4 rounded"
                    />
                    <span>Auto-create new departments in DB (إنشاء الأقسام غير الموجودة تلقائياً)</span>
                  </label>
                  {previewData.newDepartments.length > 0 && (
                    <div className="text-[11px] text-slate-500 truncate">
                      New: {previewData.newDepartments.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs">
                  {(['all', 'valid', 'duplicate', 'error'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRowFilter(tab)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer border',
                        rowFilter === tab
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      {tab === 'all' && `All (${previewData.totalRows})`}
                      {tab === 'valid' && `Ready (${previewData.validCount})`}
                      {tab === 'duplicate' && `Existing (${previewData.duplicateCount})`}
                      {tab === 'error' && `Errors (${previewData.errorCount})`}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  Target DB: <strong className="uppercase text-slate-800">{previewData.dialect}</strong>
                </span>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 sticky top-0 z-10 text-[11px] font-black text-slate-600 uppercase">
                      <tr>
                        <th className="px-3 py-2.5 border-b border-slate-200">Row</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Status</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Emp ID</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Full Name</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Email</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Department</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Job Title</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Phone</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Hire Date</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Salary</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">Notes / Validation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredPreviewRows.slice(0, 200).map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={cn(
                            row.rowStatus === 'error' && 'bg-rose-50/60',
                            row.rowStatus === 'duplicate' && 'bg-amber-50/40'
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-slate-500">#{row.rowNumber}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.rowStatus === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            )}
                            {row.rowStatus === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> {duplicateMode === 'update' ? 'Will Update' : 'Will Skip'}
                              </span>
                            )}
                            {row.rowStatus === 'error' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px]">
                                <XCircle className="w-3 h-3" /> Error
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 font-mono text-slate-700">{row.employee_id || '—'}</td>
                          <td className="px-3 py-2 font-bold text-slate-900 whitespace-nowrap">{row.name || '—'}</td>
                          <td className="px-3 py-2 text-slate-600">{row.email || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="font-semibold text-slate-700">{row.department || 'Default'}</span>
                            {row.departmentStatus === 'new' && (
                              <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                New
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{row.job_title || '—'}</td>
                          <td className="px-3 py-2 font-mono text-slate-600">{row.phone || '—'}</td>
                          <td className="px-3 py-2 font-mono text-slate-600 whitespace-nowrap">{row.hire_date || 'Today'}</td>
                          <td className="px-3 py-2 font-mono font-bold text-slate-800 whitespace-nowrap">
                            {row.salary_base > 0 ? `${row.salary_base.toLocaleString()} ${row.currency}` : '0'}
                          </td>
                          <td className="px-3 py-2 text-[11px] max-w-[260px]">
                            {row.errors.length > 0 ? (
                              <span className="text-rose-700 font-bold">{row.errors.join(' • ')}</span>
                            ) : row.warnings.length > 0 ? (
                              <span className="text-amber-700 font-medium">{row.warnings.join(' • ')}</span>
                            ) : (
                              <span className="text-emerald-600 font-medium">Valid & ready</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPreviewRows.length > 200 && (
                  <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] font-semibold text-slate-500">
                    Showing first 200 rows of {filteredPreviewRows.length}. All valid rows will be imported.
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'result' && importResult && (
            <div className="space-y-5 py-2">
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-emerald-950">
                  Import Completed Successfully!
                </h3>
                <p className="text-xs text-emerald-800 font-medium">
                  تم حفظ بيانات الموظفين مباشرة في قاعدة البيانات (<strong className="uppercase">{importResult.dialect}</strong>) وتحديث دليل الموظفين.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <div className="text-[11px] font-bold text-emerald-700">Created (تمت إضافتهم)</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">{importResult.imported}</div>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                  <div className="text-[11px] font-bold text-indigo-700">Updated (تم تحديثهم)</div>
                  <div className="text-2xl font-black text-indigo-800 mt-1">{importResult.updated}</div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <div className="text-[11px] font-bold text-amber-700">Skipped (تم تخطيهم)</div>
                  <div className="text-2xl font-black text-amber-800 mt-1">{importResult.skipped}</div>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <div className="text-[11px] font-bold text-rose-700">Failed (فشل)</div>
                  <div className="text-2xl font-black text-rose-800 mt-1">{importResult.failed}</div>
                </div>
              </div>

              {importResult.createdDepartments.length > 0 && (
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Auto-created departments:</strong> {importResult.createdDepartments.join(', ')}
                  </span>
                </div>
              )}

              {importResult.errors.length > 0 && (
                <div className="border border-rose-200 rounded-xl overflow-hidden">
                  <div className="px-3.5 py-2 bg-rose-50 text-xs font-black text-rose-800 border-b border-rose-200">
                    Row Errors ({importResult.errors.length})
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-rose-100 text-xs">
                    {importResult.errors.map((e, idx) => (
                      <div key={idx} className="px-3.5 py-2 flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-800">
                          Row #{e.rowNumber} — {e.name} ({e.email})
                        </span>
                        <span className="text-rose-700 font-semibold">{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          {step === 'upload' && (
            <>
              <span className="text-xs text-slate-500 font-medium">
                Need the exact columns? Click <strong>Download Excel Template</strong> above.
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={resetModal}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
              >
                Choose Another File
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={isImporting || actionableCount === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>Import {actionableCount} Employees to Database</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'result' && (
            <>
              <button
                type="button"
                onClick={resetModal}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Import Another File
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer"
              >
                Done & View Directory
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
