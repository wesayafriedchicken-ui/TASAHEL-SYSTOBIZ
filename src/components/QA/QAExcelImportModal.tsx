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
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

export type QaExcelCaseType =
  | 'complaints'
  | 'delays'
  | 'refunds'
  | 'cancellations'
  | 'nps'
  | 'action_plans'
  | 'checklists';

const CASE_LABELS: Record<QaExcelCaseType, { en: string; ar: string }> = {
  complaints: { en: 'Complaints Audit', ar: 'تدقيق الشكاوى (Complaints)' },
  delays: { en: 'Delays Audit', ar: 'تدقيق التأخيرات (Delays)' },
  refunds: { en: 'Refunds Audit', ar: 'تدقيق الاستردادات المالية (Refunds)' },
  cancellations: { en: 'Cancellations Audit', ar: 'تدقيق الإلغاءات (Cancellations)' },
  nps: { en: 'NPS & CSAT Feedback', ar: 'استبيانات رضا العملاء (NPS)' },
  action_plans: { en: 'Action Plans (CAPA)', ar: 'خطط العمل التصحيحية (Action Plans)' },
  checklists: { en: 'Audit Checklists', ar: 'قوائم التدقيق والأسباب الجذرية (Audit Checklists)' },
};

interface PreviewColumn {
  key: string;
  label: string;
  arLabel: string;
}

interface PreviewRow {
  rowNumber: number;
  rowStatus: 'valid' | 'duplicate' | 'error';
  existingId: number | null;
  errors: string[];
  warnings: string[];
  [key: string]: any;
}

interface PreviewResponse {
  fileName: string;
  dialect: string;
  caseType: QaExcelCaseType;
  caseLabelEn: string;
  caseLabelAr: string;
  matchedColumns: string[];
  previewColumns: PreviewColumn[];
  totalRows: number;
  validCount: number;
  duplicateCount: number;
  errorCount: number;
  rows: PreviewRow[];
}

interface ImportResult {
  success: boolean;
  dialect: string;
  caseType: QaExcelCaseType;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ rowNumber: number; label: string; error: string }>;
}

interface QAExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseType: QaExcelCaseType;
  onImportSuccess: () => Promise<void> | void;
  showToast?: (message: string) => void;
}

export async function downloadQaExcelFile(
  caseType: QaExcelCaseType,
  mode: 'template' | 'export',
  onSuccess?: (msg: string) => void,
  onError?: (msg: string) => void
): Promise<boolean> {
  try {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id') || '1';
    const headers: Record<string, string> = { 'x-user-id': String(userId) };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoint = `/api/qa/excel/${caseType}/${mode}`;
    const res = await fetch(endpoint, { method: 'GET', headers });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to download file (HTTP ${res.status})`);
    }

    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const isCsvFallback = contentType.includes('text/csv');
    const disposition = res.headers.get('content-disposition') || '';
    const matchName = disposition.match(/filename="?([^"]+)"?/i);
    const ext = isCsvFallback ? 'csv' : 'xlsx';
    const fallbackName =
      mode === 'template'
        ? `SystoBiz_QA_${caseType}_Template.${ext}`
        : `SystoBiz_QA_${caseType}_Export_${new Date().toISOString().slice(0, 10)}.${ext}`;
    const downloadName = matchName?.[1] || fallbackName;

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    onSuccess?.(
      mode === 'template'
        ? `تم تحميل قالب Excel بنجاح (${downloadName})`
        : `تم تصدير البيانات إلى Excel بنجاح (${downloadName})`
    );
    return true;
  } catch (err: any) {
    onError?.(err?.message || 'حدث خطأ أثناء تحميل ملف Excel');
    return false;
  }
}

export const QAExcelImportModal: React.FC<QAExcelImportModalProps> = ({
  isOpen,
  onClose,
  caseType,
  onImportSuccess,
  showToast,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [rowFilter, setRowFilter] = useState<'all' | 'valid' | 'duplicate' | 'error'>('all');

  if (!isOpen) return null;

  const caseLabel = CASE_LABELS[caseType] || { en: caseType, ar: caseType };

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'x-user-id': String(localStorage.getItem('user_id') || '1'),
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
    await downloadQaExcelFile(
      caseType,
      'template',
      (msg) => showToast?.(`📥 ${msg}`),
      (err) => setErrorBanner(err)
    );
    setIsDownloadingTemplate(false);
  };

  const handleExportCurrentData = async () => {
    setIsExportingData(true);
    setErrorBanner(null);
    await downloadQaExcelFile(
      caseType,
      'export',
      (msg) => showToast?.(`📊 ${msg}`),
      (err) => setErrorBanner(err)
    );
    setIsExportingData(false);
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

      const res = await fetch(`/api/qa/excel/${caseType}/import/preview`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
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
      const res = await fetch(`/api/qa/excel/${caseType}/import`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: actionableRows,
          duplicateMode,
        }),
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
        showToast?.(`✅ تم حفظ ${totalSaved} سجل في ${caseLabel.en} بنجاح في قاعدة البيانات!`);
      }
    } catch (err: any) {
      setErrorBanner(err?.message || 'حدث خطأ أثناء الحفظ في قاعدة البيانات.');
    } finally {
      setIsImporting(false);
    }
  };

  const filteredPreviewRows = (previewData?.rows || []).filter((r) => {
    if (rowFilter === 'all') return true;
    return r.rowStatus === rowFilter;
  });

  const actionableCount = previewData
    ? previewData.validCount + (duplicateMode === 'update' ? previewData.duplicateCount : 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 px-6 py-5 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  استيراد وتصدير Excel — {caseLabel.ar}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <Database className="w-3 h-3" />
                  MySQL / MariaDB Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {caseLabel.en} • Download template, export live records, or bulk import Excel/CSV directly into database
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isImporting}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {[
              { id: 'upload', num: 1, label: '1. القالب والرفع (Template & Upload)' },
              { id: 'preview', num: 2, label: '2. المعاينة والفحص (Validate & Preview)' },
              { id: 'result', num: 3, label: '3. الحفظ في قاعدة البيانات (Saved)' },
            ].map((s, idx) => {
              const active = step === s.id;
              const done =
                (step === 'preview' && idx === 0) ||
                (step === 'result' && idx < 2);
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-3 py-1 rounded-xl border transition-all',
                      active
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : done
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-400 border-slate-200'
                    )}
                  >
                    {s.label}
                  </span>
                  {idx < 2 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden sm:block" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {errorBanner && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span className="flex-1 leading-relaxed">{errorBanner}</span>
            <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-700 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: TEMPLATE / EXPORT / UPLOAD */}
          {step === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Card: Template + Export Live Data */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-5 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        تحميل قالب Excel أو تصدير البيانات الحالية
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Download Example Template or Export Existing Records
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>
                        ملف القالب يحتوي على <strong>نفس الأعمدة المطلوبة</strong> مع صف توضيحي بالعربية ومثالين جاهزين وشيت تعليمات (Instructions) لضمان حفظ البيانات بشكل سليم 100% في MySQL.
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>
                        يمكنك أيضاً <strong>تصدير البيانات الحالية</strong> لنفس الحالة إلى ملف Excel، وتعديلها ثم إعادة رفعها لتحديث السجلات أو إضافة سجلات جديدة.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloadingTemplate}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isDownloadingTemplate ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>تحميل قالب Excel الجاهز (Download Template .xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCurrentData}
                    disabled={isExportingData}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isExportingData ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                    )}
                    <span>تصدير البيانات الموجودة حالياً (Export Current Data .xlsx)</span>
                  </button>
                </div>
              </div>

              {/* Right Card: Upload Dropzone */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      رفع ملف البيانات المعبأ (Excel / CSV)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Upload filled .xlsx or .csv file for instant validation
                    </p>
                  </div>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    handleFileSelected(file);
                  }}
                  onClick={() => !isParsing && fileInputRef.current?.click()}
                  className={cn(
                    'flex-1 min-h-[200px] rounded-2xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-center gap-3 transition-all cursor-pointer',
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/70'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.csv"
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files?.[0])}
                  />
                  {isParsing ? (
                    <>
                      <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                      <p className="text-sm font-black text-slate-800">جارٍ قراءة وفحص الملف ومطابقته مع قاعدة البيانات...</p>
                      <p className="text-xs text-slate-500">Validating columns, dates, numbers, and duplicates</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Upload className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          اسحب وأفلت ملف Excel هنا أو اضغط لاختيار ملف
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          يدعم صيغ <strong>.xlsx</strong> و <strong>.csv</strong> (حتى 2,500 صف في المرة الواحدة)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION */}
          {step === 'preview' && previewData && (
            <div className="space-y-4">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">إجمالي الصفوف</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{previewData.totalRows}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[11px] font-bold text-emerald-700">جديد وصالح للحفظ</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{previewData.validCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-700">موجود مسبقاً (مكرر)</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{previewData.duplicateCount}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                  <span className="text-[11px] font-bold text-rose-700">أخطاء (سيتم تخطيها)</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{previewData.errorCount}</p>
                </div>
              </div>

              {/* Duplicate Handling & Filter Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-slate-700">عند وجود سجل مكرر:</span>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('skip')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                      duplicateMode === 'skip'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    تخطي المكرر (Skip)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('update')}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                      duplicateMode === 'update'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    تحديث السجل الموجود (Update)
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['all', 'valid', 'duplicate', 'error'] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setRowFilter(f)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer',
                        rowFilter === f
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      )}
                    >
                      {f === 'all' ? 'الكل' : f === 'valid' ? 'جديد' : f === 'duplicate' ? 'مكرر' : 'أخطاء'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2.5 border-b border-slate-200">#</th>
                        <th className="px-3 py-2.5 border-b border-slate-200">الحالة</th>
                        {previewData.previewColumns.map((col) => (
                          <th key={col.key} className="px-3 py-2.5 border-b border-slate-200 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 border-b border-slate-200">ملاحظات الفحص</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPreviewRows.slice(0, 200).map((row) => (
                        <tr
                          key={`${row.rowNumber}-${row.transaction_id || row.plan_code || row.root_cause_name || ''}`}
                          className={cn(
                            row.rowStatus === 'error'
                              ? 'bg-rose-50/50'
                              : row.rowStatus === 'duplicate'
                              ? 'bg-amber-50/40'
                              : 'bg-white hover:bg-slate-50'
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-slate-500">{row.rowNumber}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {row.rowStatus === 'valid' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> جديد
                              </span>
                            )}
                            {row.rowStatus === 'duplicate' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                                <AlertTriangle className="w-3 h-3" /> {duplicateMode === 'update' ? 'سيُحدّث' : 'مكرر'}
                              </span>
                            )}
                            {row.rowStatus === 'error' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                                <XCircle className="w-3 h-3" /> خطأ
                              </span>
                            )}
                          </td>
                          {previewData.previewColumns.map((col) => {
                            const val = row[col.key];
                            const displayVal =
                              typeof val === 'boolean'
                                ? val
                                  ? 'Yes'
                                  : 'No'
                                : val !== null && val !== undefined && String(val) !== ''
                                ? String(val)
                                : '—';
                            return (
                              <td key={col.key} className="px-3 py-2 text-slate-800 max-w-[200px] truncate" title={displayVal}>
                                {displayVal}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-[11px]">
                            {row.errors.length > 0 && (
                              <div className="text-rose-600 font-bold">{row.errors.join(' • ')}</div>
                            )}
                            {row.warnings.length > 0 && (
                              <div className="text-amber-700">{row.warnings.join(' • ')}</div>
                            )}
                            {row.errors.length === 0 && row.warnings.length === 0 && (
                              <span className="text-emerald-600 font-semibold">جاهز للحفظ</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredPreviewRows.length > 200 && (
                  <div className="px-4 py-2 bg-slate-50 text-[11px] text-slate-500 font-semibold border-t border-slate-200">
                    يتم عرض أول 200 صف في المعاينة (سيتم استيراد جميع الصفوف الصالحة وعددها {actionableCount} صف).
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: RESULT SUMMARY */}
          {step === 'result' && importResult && (
            <div className="space-y-5 py-2">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  تم استيراد وحفظ البيانات في قاعدة البيانات بنجاح!
                </h3>
                <p className="text-xs text-slate-500">
                  {caseLabel.ar} • Database Engine:{' '}
                  <strong className="text-indigo-600 uppercase">{importResult.dialect}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-xs font-bold text-emerald-700">تمت الإضافة (New)</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{importResult.imported}</p>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-center">
                  <span className="text-xs font-bold text-indigo-700">تم التحديث (Updated)</span>
                  <p className="text-2xl font-black text-indigo-700 mt-1">{importResult.updated}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-xs font-bold text-amber-700">تم التخطي (Skipped)</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{importResult.skipped}</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-xs font-bold text-rose-700">فشل (Failed)</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{importResult.failed}</p>
                </div>
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-2 max-h-48 overflow-y-auto">
                  <h4 className="text-xs font-black text-rose-700">تفاصيل الصفوف التي لم تُحفظ:</h4>
                  {importResult.errors.map((e, i) => (
                    <div key={i} className="text-xs text-rose-700 flex items-start gap-2">
                      <span className="font-mono font-bold">Row #{e.rowNumber} ({e.label}):</span>
                      <span>{e.error}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          {step === 'upload' && (
            <>
              <span className="text-[11px] text-slate-500 font-semibold">
                جميع البيانات تُفحص وتُحفظ مباشرة في قاعدة بيانات MySQL / PostgreSQL
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                إغلاق
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                type="button"
                onClick={resetModal}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
              >
                اختيار ملف آخر
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer disabled:opacity-50"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleCommitImport}
                  disabled={isImporting || actionableCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جارٍ الحفظ في قاعدة البيانات...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>تأكيد الاستيراد وحفظ ({actionableCount}) سجل</span>
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
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                استيراد ملف آخر
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                تم — عرض البيانات
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QAExcelImportModal;
