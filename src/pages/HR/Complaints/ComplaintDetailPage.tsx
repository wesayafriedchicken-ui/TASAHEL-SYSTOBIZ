import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, CheckCircle2, Clock, Trash2,
  Share2, MessageSquare, FileText, User, Mail, Building,
  Calendar, Tag, ChevronRight, Check, X, Sparkles,
  RefreshCw, AlertTriangle, ShieldCheck, HelpCircle,
  ExternalLink, Edit
} from 'lucide-react';
import { useHRContext } from '../HRContext';
import { cn } from '../../../lib/utils';
import DeleteConfirmation from '../../../components/Common/DeleteConfirmation';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    complaints,
    employees,
    departments,
    currentUser,
    isHRAdmin,
    canViewComplaint,
    canEditComplaint,
    canResolveComplaint,
    canDeleteComplaint,
    canShareComplaint,
    showCustomToast,
    fetchData
  } = useHRContext();

  const [complaint, setComplaint] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Admin Notes State
  const [adminNotes, setAdminNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Delete Confirm State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch or sync complaint
  const fetchSingleComplaint = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/hr/complaints/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
        setEditTitle(data.title || '');
        setEditCategory(data.category || 'Workplace');
        setEditDescription(data.description || '');
        setAdminNotes(data.admin_notes || '');
      } else if (res.status === 404) {
        // Try fallback from complaints in context
        const found = complaints.find(c => String(c.id) === String(id));
        if (found) {
          setComplaint(found);
          setEditTitle(found.title || '');
          setEditCategory(found.category || 'Workplace');
          setEditDescription(found.description || '');
          setAdminNotes(found.admin_notes || '');
        } else {
          setError('Complaint not found.');
        }
      } else {
        setError('Failed to load complaint.');
      }
    } catch (err) {
      console.error('Error fetching complaint:', err);
      // Try fallback from context
      const found = complaints.find(c => String(c.id) === String(id));
      if (found) {
        setComplaint(found);
        setEditTitle(found.title || '');
        setEditCategory(found.category || 'Workplace');
        setEditDescription(found.description || '');
        setAdminNotes(found.admin_notes || '');
      } else {
        setError('Error connecting to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSingleComplaint();
  }, [id]);

  // Find employee profile details
  const employeeInfo = useMemo(() => {
    if (!complaint) return null;
    const empId = complaint.user_id;
    return employees.find(e => e.id === empId || e.user_id === empId || (complaint.employee_email && e.email === complaint.employee_email));
  }, [complaint, employees]);

  const employeeDept = useMemo(() => {
    if (!employeeInfo) return null;
    return departments.find(d => d.id === employeeInfo.department_id);
  }, [employeeInfo, departments]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!complaint) return;
    try {
      const res = await fetch(`/api/hr/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaint((prev: any) => ({ ...prev, ...updated, status: newStatus }));
        showCustomToast(`Status updated to "${newStatus}"`, 'success');
        fetchData();
      } else {
        showCustomToast('Failed to update status', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Server error updating status', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint) return;
    if (!editTitle.trim() || !editDescription.trim()) {
      showCustomToast('Title and Description are required', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/hr/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          category: editCategory,
          description: editDescription
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaint((prev: any) => ({ ...prev, ...updated }));
        setIsEditing(false);
        showCustomToast('Complaint details updated successfully', 'success');
        fetchData();
      } else {
        showCustomToast('Failed to save changes', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Server error', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!complaint) return;
    try {
      setIsSavingNotes(true);
      const res = await fetch(`/api/hr/complaints/${complaint.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes })
      });
      if (res.ok) {
        const updated = await res.json();
        setComplaint((prev: any) => ({ ...prev, ...updated }));
        setIsEditingNotes(false);
        showCustomToast('Investigative notes updated successfully', 'success');
        fetchData();
      } else {
        showCustomToast('Failed to save notes', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Server error', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async () => {
    if (!complaint) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/hr/complaints/${complaint.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showCustomToast('Complaint deleted successfully', 'success');
        fetchData();
        navigate('/hr/complaints');
      } else {
        showCustomToast('Failed to delete complaint', 'error');
      }
    } catch (err) {
      console.error(err);
      showCustomToast('Server error deleting complaint', 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = () => {
    if (!canShareComplaint) {
      showCustomToast('Permission Denied: You do not have permission to share complaints.', 'error');
      return;
    }
    const currentUrl = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        showCustomToast('🔗 Complaint page link copied to clipboard!', 'success');
      }).catch(() => {
        showCustomToast(`Share link: ${currentUrl}`, 'info');
      });
    } else {
      showCustomToast(`Share link: ${currentUrl}`, 'info');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500">Loading complaint details...</p>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-xl mx-auto space-y-4 shadow-sm my-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Complaint Not Found</h2>
        <p className="text-slate-500 text-xs leading-relaxed font-medium">
          {error || "The complaint you are looking for does not exist or has been removed."}
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('/hr/complaints')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints List
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
          label: 'Pending Review'
        };
      case 'Under Review':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          icon: RefreshCw,
          label: 'Under Investigation'
        };
      case 'Resolved':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2,
          label: 'Resolved & Closed'
        };
      case 'Dismissed':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-400',
          icon: X,
          label: 'Dismissed'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: AlertCircle,
          label: status
        };
    }
  };

  const statusInfo = getStatusBadge(complaint.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Link
            to="/hr/complaints"
            className="hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Complaints</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-black">Complaint #{complaint.id}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            disabled={!canShareComplaint}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer",
              canShareComplaint
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
                : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
            )}
            title={canShareComplaint ? "Share Complaint Link" : "Permission Required: Share"}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Edit Button */}
          {(canEditComplaint || isHRAdmin) && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-amber-600" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Details'}</span>
            </button>
          )}

          {/* Delete Button */}
          {(canDeleteComplaint || isHRAdmin) && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left / Main Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 md:p-8 shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Case #{complaint.id}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {complaint.category || 'General'}
                </span>
              </div>

              {/* Status Badge */}
              <div className={cn("flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-black", statusInfo.bg)}>
                <span className={cn("w-2 h-2 rounded-full", statusInfo.dot)} />
                <StatusIcon className="w-3.5 h-3.5" />
                <span>{statusInfo.label}</span>
              </div>
            </div>

            {/* Editable or Display View */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Complaint Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  >
                    <option value="Workplace">Workplace</option>
                    <option value="Salary">Salary & Compensation</option>
                    <option value="Harassment">Conduct & Ethics</option>
                    <option value="Tooling">Equipment & Tooling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Description & Grievance Particulars
                  </label>
                  <textarea
                    rows={5}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    required
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-y"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {complaint.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Submitted: {new Date(complaint.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Updated: {new Date(complaint.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Complaint Full Statement */}
                <div className="space-y-2 pt-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Grievance Statement & Particulars
                  </label>
                  <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/80 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {complaint.description}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Investigation & Notes Section */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 md:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Admin Investigation & Resolution Notes
                </h3>
              </div>
              {(canResolveComplaint || canEditComplaint || isHRAdmin) && !isEditingNotes && (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3 h-3" />
                  <span>{complaint.admin_notes ? 'Edit Notes' : 'Add Notes'}</span>
                </button>
              )}
            </div>

            {isEditingNotes ? (
              <div className="space-y-3 pt-2">
                <textarea
                  rows={4}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record HR findings, investigative hearings, mediation outcome, or resolution summary..."
                  className="w-full p-4 bg-emerald-50/40 border border-emerald-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdminNotes(complaint.admin_notes || '');
                      setIsEditingNotes(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAdminNotes}
                    disabled={isSavingNotes}
                    className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingNotes && <RefreshCw className="w-3 h-3 animate-spin" />}
                    <span>Save Notes</span>
                  </button>
                </div>
              </div>
            ) : complaint.admin_notes ? (
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-emerald-950 text-xs font-medium leading-relaxed">
                {complaint.admin_notes}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-400 font-medium">
                  No investigative notes recorded yet.
                </p>
                {(canResolveComplaint || canEditComplaint || isHRAdmin) && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="mt-2 text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <PlusIcon className="w-3 h-3" /> Add resolution or investigative notes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Workflow Status Progression */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 md:p-8 shadow-xs space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Investigation Lifecycle & Status
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              {[
                { key: 'Pending', label: '1. Pending', desc: 'Received & Queued' },
                { key: 'Under Review', label: '2. Under Review', desc: 'Active Investigation' },
                { key: 'Resolved', label: '3. Resolved', desc: 'Settled & Addressed' },
                { key: 'Dismissed', label: 'Dismissed', desc: 'Closed / Inapplicable' }
              ].map((step) => {
                const isCurrent = complaint.status === step.key;
                const canChange = canResolveComplaint || canEditComplaint || isHRAdmin;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => canChange && handleUpdateStatus(step.key)}
                    disabled={!canChange}
                    className={cn(
                      "p-3.5 rounded-2xl border text-left transition-all",
                      isCurrent
                        ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                        : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/70",
                      canChange ? "cursor-pointer" : "cursor-default"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-xs font-black", isCurrent ? "text-indigo-900" : "text-slate-700")}>
                        {step.label}
                      </span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {step.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column / Sidebar */}
        <div className="space-y-6">
          {/* Submitter Info Card */}
          <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Submitted By
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-black flex items-center justify-center text-sm shrink-0">
                  {complaint.employee_name ? complaint.employee_name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 truncate">{complaint.employee_name || 'Employee'}</p>
                  <p className="text-[11px] text-slate-500 truncate">{complaint.employee_email || '—'}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                {employeeInfo?.job_title && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Job Title:</span>
                    <span className="font-bold text-slate-800">{employeeInfo.job_title}</span>
                  </div>
                )}
                {employeeDept?.name && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Department:</span>
                    <span className="font-bold text-slate-800">{employeeDept.name}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">User ID:</span>
                  <span className="font-mono font-bold text-slate-700">#{complaint.user_id}</span>
                </div>
              </div>

              {employeeInfo && (
                <div className="pt-3">
                  <Link
                    to={`/hr/directory/${employeeInfo.id}`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>View Employee File</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Status Control Card */}
          {(canResolveComplaint || canEditComplaint || isHRAdmin) && (
            <div className="bg-white rounded-[28px] border border-slate-200/90 p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Quick Status Action
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Change grievance disposition directly:
              </p>
              <select
                value={complaint.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              >
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>
          )}

          {/* Privacy & Confidentiality Notice */}
          <div className="bg-amber-50/60 rounded-[28px] border border-amber-200/80 p-5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Confidential HR Record</span>
            </div>
            <p className="text-amber-800/90 text-[11px] leading-relaxed font-medium">
              Employee grievances are strictly confidential under company HR guidelines. Only authorized personnel may review, arbitrate, or modify this record.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Complaint / حذف الشكوى"
        message={`Are you sure you want to delete complaint #${complaint.id} ("${complaint.title}")? This action is permanent and cannot be undone.`}
      />
    </div>
  );
};

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export default ComplaintDetailPage;
