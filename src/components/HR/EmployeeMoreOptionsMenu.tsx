import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  MoreVertical, Edit, Bell, Mail, Upload, Download, X, Check, Loader2, 
  AlertTriangle, Send, FileSpreadsheet, Info, ExternalLink, FileText, CheckCircle2, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee } from '../../types';
import { cn } from '../../lib/utils';

interface EmployeeMoreOptionsMenuProps {
  employee: Employee;
  onEdit: () => void;
  onRefresh?: () => void;
  onOpenPermissionsManager?: () => void;
  isViewOnly?: boolean;
}

export const EmployeeMoreOptionsMenu: React.FC<EmployeeMoreOptionsMenuProps> = ({
  employee,
  onEdit,
  onRefresh,
  onOpenPermissionsManager,
  isViewOnly = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'alarm' | 'email' | 'import' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Alarm Modal state
  const [alarmTitle, setAlarmTitle] = useState('');
  const [alarmMessage, setAlarmMessage] = useState('');
  const [alarmType, setAlarmType] = useState<'info' | 'warning' | 'urgent' | 'task'>('warning');
  const [isSendingAlarm, setIsSendingAlarm] = useState(false);

  // Email Modal state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [templates, setTemplates] = useState<Array<{ id: number; name: string; subject: string; body: string }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState<{ configured: boolean; sender_email?: string } | null>(null);

  // Import Modal state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, any> | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Toast feedback state
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Close dropdown on click outside or when another dropdown opens
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleCloseOthers = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.except !== 'employee_more_options') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('close-hr-dropdowns', handleCloseOthers);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('close-hr-dropdowns', handleCloseOthers);
    };
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4500);
  };

  // Fetch email templates & SMTP status when email modal opens
  const openEmailModal = async () => {
    setActiveModal('email');
    setIsOpen(false);
    try {
      const [tplRes, cfgRes] = await Promise.all([
        fetch('/api/hr/recruitment/email-templates'),
        fetch('/api/hr/recruitment/email-config')
      ]);
      if (tplRes.ok) {
        const data = await tplRes.json();
        setTemplates(data || []);
      }
      if (cfgRes.ok) {
        const cfg = await cfgRes.json();
        setSmtpStatus(cfg ? { configured: !!cfg.smtp_host, sender_email: cfg.sender_email } : { configured: false });
      }
    } catch (e) {
      console.error('Failed to load email config:', e);
    }
  };

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    const found = templates.find(t => String(t.id) === tplId);
    if (found) {
      // Replace placeholders
      const empName = employee.name || 'Employee';
      let subject = found.subject.replace(/\{Employee Name\}/g, empName).replace(/\{Candidate First Name\}/g, empName.split(' ')[0]);
      let body = found.body
        .replace(/\{Employee Name\}/g, empName)
        .replace(/\{Candidate First Name\}/g, empName.split(' ')[0])
        .replace(/\{Job Opening Name\}/g, employee.job_title || 'Position');
      
      setEmailSubject(subject);
      setEmailBody(body);
    }
  };

  // Handle Alarm Submission
  const handleSendAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarmTitle.trim() || !alarmMessage.trim()) {
      showToast('Please enter alert title and message', 'error');
      return;
    }

    setIsSendingAlarm(true);
    try {
      const res = await fetch(`/api/hr/employees/${employee.id}/send-alarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: alarmTitle,
          message: alarmMessage,
          type: alarmType,
        })
      });

      if (res.ok) {
        showToast(`Alert sent successfully to (${employee.name})!`, 'success');
        setAlarmTitle('');
        setAlarmMessage('');
        setActiveModal(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to send alert', 'error');
      }
    } catch (err) {
      showToast('Server connection error while sending alert', 'error');
    } finally {
      setIsSendingAlarm(false);
    }
  };

  // Handle Email Submission
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailBody.trim()) {
      showToast('Please enter email subject and message body', 'error');
      return;
    }

    setIsSendingEmail(true);
    try {
      const res = await fetch(`/api/hr/employees/${employee.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: emailSubject,
          body: emailBody,
          template_id: selectedTemplateId || null,
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || `Email sent successfully to (${employee.name})!`, 'success');
        setEmailSubject('');
        setEmailBody('');
        setActiveModal(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to send email', 'error');
      }
    } catch (err) {
      showToast('Server connection error while sending email', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Import File Selection & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          setImportPreview(parsed);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const values = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => {
              if (h) obj[h] = values[idx] || '';
            });
            setImportPreview(obj);
          } else {
            setImportError('CSV file is empty or invalid');
          }
        } else {
          setImportError('Please select a JSON or CSV file only');
        }
      } catch (err) {
        setImportError('Failed to read file. Please ensure valid file formatting.');
      }
    };
    reader.readAsText(file);
  };

  // Apply Import to Employee
  const handleApplyImport = async () => {
    if (!importPreview) return;
    setIsImporting(true);
    try {
      const payload = {
        name: importPreview.name || employee.name,
        email: importPreview.email || employee.email,
        job_title: importPreview.job_title || employee.job_title,
        department_id: importPreview.department_id || employee.department_id,
        phone: importPreview.phone || employee.phone,
        id_number: importPreview.id_number || employee.id_number,
        salary_base: importPreview.salary_base ? parseFloat(importPreview.salary_base) : employee.salary_base,
        allowances: importPreview.allowances ? parseFloat(importPreview.allowances) : employee.allowances,
        contract_type: importPreview.contract_type || employee.contract_type,
        personal_info: {
          ...(employee.personal_info || {}),
          ...(importPreview.personal_info || {}),
          nationality: importPreview.nationality || employee.personal_info?.nationality,
          address: importPreview.address || employee.personal_info?.address,
        }
      };

      const res = await fetch(`/api/hr/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast('Employee profile updated successfully from import!', 'success');
        setActiveModal(null);
        setImportFile(null);
        setImportPreview(null);
        if (onRefresh) onRefresh();
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to apply import', 'error');
      }
    } catch (err) {
      showToast('Server connection error during import', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // Download Sample Import Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = {
      name: employee.name,
      job_title: employee.job_title,
      phone: employee.phone || "0501234567",
      id_number: employee.id_number || "1098765432",
      salary_base: employee.salary_base || 5000,
      allowances: employee.allowances || 1000,
      contract_type: employee.contract_type || "Full-Time",
      address: employee.personal_info?.address || "Riyadh, Saudi Arabia",
      nationality: employee.personal_info?.nationality || "Saudi"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Sample_Employee_Import_${employee.name.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export Employee Profile as styled PDF
  const handleExportEmployee = () => {
    setIsOpen(false);
    try {
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      
      const primaryColor: [number, number, number] = [30, 112, 30]; // #1E701E Deep Green
      const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate-800
      const lightBgColor: [number, number, number] = [248, 250, 252]; // Slate-50

      // 1. Decorative Header Banner (Green Box)
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 36, 'F');

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('THE BUSINESS CORE', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('OFFICIAL EMPLOYEE PROFILE FILE & HR RECORD', 14, 24);

      // Date & Ref Number (Right aligned)
      const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      doc.setFontSize(9);
      doc.text(`Date: ${todayStr}`, 196, 16, { align: 'right' });
      doc.text(`Ref: EMP-${employee.id || '001'}`, 196, 24, { align: 'right' });

      // 2. Employee Identity Summary Card Box
      doc.setFillColor(...lightBgColor);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 42, 182, 28, 3, 3, 'FD');

      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(employee.name || 'Employee Name', 20, 52);

      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${employee.job_title || 'Position N/A'}  |  ${employee.department_name || 'General Department'}`, 20, 60);

      // Status Badge on Right
      const statusStr = (employee.status || 'Active').toUpperCase();
      doc.setFillColor(240, 253, 244);
      doc.setDrawColor(187, 247, 208);
      doc.roundedRect(148, 48, 40, 9, 2, 2, 'FD');
      doc.setTextColor(22, 101, 52);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`STATUS: ${statusStr}`, 168, 54, { align: 'center' });

      // 3. Section: Personal & Basic Details Table
      doc.setTextColor(...darkTextColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. Personal & Contact Information', 14, 78);

      const personalData = [
        ['Employee ID', `#EMP-${employee.id || 'N/A'}`, 'National ID / Iqama', employee.id_number || 'N/A'],
        ['Phone Number', employee.phone || 'N/A', 'Work Email', employee.email || 'N/A'],
        ['Joined Date', employee.joined_at || 'N/A', 'Nationality', employee.personal_info?.nationality || 'N/A'],
        ['Gender', employee.personal_info?.gender || 'N/A', 'Address', employee.personal_info?.address || 'N/A']
      ];

      autoTable(doc, {
        startY: 82,
        head: [['Field', 'Value', 'Field', 'Value']],
        body: personalData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      let currentY = (doc as any).lastAutoTable.finalY + 10;

      // 4. Section: Employment & Financial Compensation
      doc.setTextColor(...darkTextColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. Employment Contract & Compensation', 14, currentY);

      const salaryBase = Number(employee.salary_base) || 0;
      const allowances = Number(employee.allowances) || 0;
      const totalSalary = salaryBase + allowances;

      const financialData = [
        ['Contract Type', employee.contract_type || 'Full-Time', 'Contract Start Date', employee.contract_start_date || 'N/A'],
        ['Basic Monthly Salary', `${salaryBase.toLocaleString()} SAR/USD`, 'Contract End Date', employee.contract_end_date || 'Indefinite'],
        ['Monthly Allowances', `${allowances.toLocaleString()} SAR/USD`, 'Total Monthly Package', `${totalSalary.toLocaleString()} SAR/USD`]
      ];

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Field', 'Value', 'Field', 'Value']],
        body: financialData,
        theme: 'grid',
        headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // 5. Section: Leave Balances & Time-Off
      doc.setTextColor(...darkTextColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('3. Leave Balances & Entitlements', 14, currentY);

      const leaveData = [
        ['Annual Vacation Balance', `${employee.vacation_balance ?? 0} Days`],
        ['Sick Leave Balance', `${employee.sick_leave_balance ?? 0} Days`]
      ];

      autoTable(doc, {
        startY: currentY + 4,
        head: [['Leave Type', 'Available Balance']],
        body: leaveData,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85] },
        margin: { left: 14, right: 14 }
      });

      // 6. Verification Footer Box
      doc.setDrawColor(203, 213, 225);
      doc.line(14, 275, 196, 275);

      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('This is an official computer-generated document from The Business Core HR System.', 14, 281);
      doc.text('Confidential - For authorized HR personnel and employee reference only.', 14, 285);
      doc.text(`Exported on: ${new Date().toLocaleString()}`, 196, 281, { align: 'right' });

      // Download PDF
      const safeName = (employee.name || 'Employee').replace(/\s+/g, '_');
      doc.save(`Employee_Profile_${safeName}_${employee.id || 'file'}.pdf`);

      showToast(`Employee file for (${employee.name}) exported to PDF successfully!`, 'success');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      showToast('Error generating PDF document', 'error');
    }
  };

  return (
    <div className="relative inline-block text-left z-50" ref={dropdownRef}>
      {/* Toast Notification Popup */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-5 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border",
              toastMsg.type === 'success' ? "bg-emerald-950 text-emerald-200 border-emerald-800" : "bg-rose-950 text-rose-200 border-rose-800"
            )}
          >
            {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
            <span>{toastMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Button */}
      <button 
        onClick={() => {
          const next = !isOpen;
          if (next) {
            window.dispatchEvent(new CustomEvent('close-hr-dropdowns', { detail: { except: 'employee_more_options' } }));
          }
          setIsOpen(next);
        }} 
        className={cn(
          "w-9 h-9 bg-white hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-xs cursor-pointer transition-all border border-slate-200/60 focus:outline-none",
          isOpen && "ring-2 ring-white/60 bg-slate-100 text-slate-900"
        )} 
        title="More Options"
        id="btn-employee-more-options"
      >
        <MoreVertical className="w-4 h-4 text-slate-700" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[300] text-left text-slate-800"
          >
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Employee Actions</span>
              <p className="text-[11px] text-slate-600 font-bold truncate mt-0.5">{employee.name || 'Selected Employee'}</p>
            </div>

            <div className="py-1">
              {/* 1. Edit Option */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onEdit();
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 text-[#1b5e20] flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <Edit className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-[#1b5e20] transition-colors">Edit Profile</div>
                  <div className="text-[11px] text-slate-400 font-medium">Modify personal and employment details</div>
                </div>
              </button>

              {/* 2. Alarm Option */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('alarm');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-50 group-hover:bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors">Send Alert / Alarm</div>
                  <div className="text-[11px] text-slate-400 font-medium">Dispatch warning, reminder, or task alert</div>
                </div>
              </button>

              {/* 3. Email Option */}
              <button
                onClick={openEmailModal}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 group-hover:bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">Send Direct Email</div>
                  <div className="text-[11px] text-slate-400 font-medium">Compose templated or custom email</div>
                </div>
              </button>

              {/* 4. Import Option */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setActiveModal('import');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-all flex items-start gap-3 border-b border-slate-50 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Import Data</div>
                  <div className="text-[11px] text-slate-400 font-medium">Update profile via JSON or CSV file</div>
                </div>
              </button>

              {/* 5. Export Option */}
              <button
                onClick={handleExportEmployee}
                className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">Export File (PDF)</div>
                  <div className="text-[11px] text-slate-400 font-medium">Download complete official PDF dossier</div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ALARM MODAL ==================== */}
      <AnimatePresence>
        {activeModal === 'alarm' && createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="bg-amber-500/10 border-b border-amber-500/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">Send Employee Alert / Alarm</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Employee: {employee.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-200/50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSendAlarm} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">Alert Subject / Title <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={alarmTitle}
                    onChange={(e) => setAlarmTitle(e.target.value)}
                    placeholder="e.g. Contract Renewal Notice / Review Meeting"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">Priority Level</label>
                  <select
                    value={alarmType}
                    onChange={(e: any) => setAlarmType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all cursor-pointer"
                  >
                    <option value="warning">⚠️ Warning</option>
                    <option value="urgent">🚨 Urgent</option>
                    <option value="info">ℹ️ Information</option>
                    <option value="task">📋 Action Request / Task</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">Alert Message & Details <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={4}
                    required
                    value={alarmMessage}
                    onChange={(e) => setAlarmMessage(e.target.value)}
                    placeholder="Provide detailed instructions or information for the employee..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingAlarm}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSendingAlarm ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Alert Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* ==================== EMAIL MODAL ==================== */}
      <AnimatePresence>
        {activeModal === 'email' && createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="bg-indigo-600/10 border-b border-indigo-600/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-700 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-black text-slate-900 leading-tight">Send Direct Email</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Recipient: <span className="font-bold text-indigo-700">{employee.name}</span> ({employee.email || 'No email registered'})
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-200/50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSendEmail} className="p-6 space-y-4 text-left">
                {/* Configuration Note regarding HR Permissions Manager */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-3">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-950 font-medium space-y-1">
                    <p>
                      <strong>Email Settings Note:</strong> The SMTP gateway and pre-defined email templates can be configured in{' '}
                      <span className="font-black underline cursor-pointer hover:text-indigo-700" onClick={() => {
                        setActiveModal(null);
                        if (onOpenPermissionsManager) onOpenPermissionsManager();
                      }}>
                        HR Permissions Manager &gt; Email Config
                      </span>.
                    </p>
                    {smtpStatus && (
                      <div className="text-[11px] font-bold text-slate-600 flex items-center gap-2 pt-0.5">
                        <span className={cn("inline-block w-2 h-2 rounded-full", smtpStatus.configured ? "bg-emerald-500" : "bg-amber-500")} />
                        <span>Status: {smtpStatus.configured ? `SMTP Gateway Active (${smtpStatus.sender_email || ''})` : 'Default system sender mode'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Templates Selector if available */}
                {templates.length > 0 && (
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1.5">Email Template (Optional)</label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                    >
                      <option value="">-- Choose a pre-configured template --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} - ({t.subject})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">Subject <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">Message Body <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={5}
                    required
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your email message to the employee..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingEmail}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Send Email Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>

      {/* ==================== IMPORT MODAL ==================== */}
      <AnimatePresence>
        {activeModal === 'import' && createPortal(
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden text-slate-800"
            >
              {/* Header */}
              <div className="bg-blue-600/10 border-b border-blue-600/20 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-700 flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-base font-black text-slate-900 leading-tight">Import Employee Data</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">Updating record for: {employee.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-1.5 hover:bg-slate-200/50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-left">
                <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-xs font-bold text-slate-600">Sample import format:</span>
                  <button
                    type="button"
                    onClick={handleDownloadSampleTemplate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:text-blue-600 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Sample (JSON)</span>
                  </button>
                </div>

                {/* Upload box */}
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-blue-50/30 hover:border-blue-300 transition-all">
                  <FileSpreadsheet className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Drag and drop a JSON or CSV file here</p>
                  <p className="text-[11px] text-slate-400 mt-1">Or click to choose a file from your device</p>
                  <input
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileChange}
                    className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                  />
                </div>

                {importError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
                    {importError}
                  </div>
                )}

                {/* Preview parsed fields */}
                {importPreview && (
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl space-y-2 text-xs font-mono max-h-40 overflow-y-auto">
                    <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 block font-sans">Processed Fields Preview:</span>
                    <pre className="text-[11px] whitespace-pre-wrap">{JSON.stringify(importPreview, null, 2)}</pre>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!importPreview || isImporting}
                    onClick={handleApplyImport}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Apply Import & Update Profile</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
};
