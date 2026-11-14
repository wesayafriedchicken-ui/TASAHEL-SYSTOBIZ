import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Shield, 
  Building2, 
  Phone, 
  Calendar, 
  Lock, 
  UserCheck, 
  Fingerprint, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink,
  Loader2,
  Check,
  Briefcase,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface DetailedUser {
  id: number;
  name: string;
  email: string;
  username: string;
  role_id: number;
  department_id: number | null;
  job_title: string;
  team_name?: string;
  reporting_to?: number | null;
  status: 'active' | 'inactive';
  is_super_admin?: boolean;
  training_points?: number;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  company_id?: number;
  has_portal_access?: boolean;
  employee_id?: string;
  auth_method?: 'standard' | 'corporate_sso';
  role_name?: string;
  role_description?: string;
  role_permissions?: Record<string, any>;
  department_name?: string;
  manager_name?: string;
  manager_email?: string;
  hr_employee_id?: number;
  phone?: string;
  contract_type?: string;
  contract_start_date?: string;
  personal_info?: any;
}

export const AdminUserDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = (currentUser as any)?.is_super_admin || currentUser?.email === 'admin@gmail.com' || (currentUser as any)?.role_id === 1;

  const [userData, setUserData] = useState<DetailedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmployeeId, setFormEmployeeId] = useState('');
  const [formRoleId, setFormRoleId] = useState<number>(3);
  const [formDepartmentId, setFormDepartmentId] = useState<string | number>('');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formReportingTo, setFormReportingTo] = useState<string | number>('');
  const [formTeamName, setFormTeamName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formContractType, setFormContractType] = useState('Full-time');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formPortalAccess, setFormPortalAccess] = useState<boolean>(true);
  const [formAuthMethod, setFormAuthMethod] = useState<'standard' | 'corporate_sso'>('standard');

  // Reference lists
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Active section tab
  const [activeSection, setActiveSection] = useState<'basic' | 'org' | 'contact' | 'permissions'>('basic');

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': userId || '1'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch only this user's data on mount (GET /api/admin/users/:id)
  useEffect(() => {
    if (!id || isNaN(Number(id))) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000);

    const fetchSingleUser = async () => {
      setLoading(true);
      try {
        const headers = getAuthHeaders();
        const signal = abortController.signal;

        const [uRes, rRes, dRes, mRes] = await Promise.all([
          fetch(`/api/admin/users/${id}`, { headers, signal }).catch(() => null),
          fetch('/api/admin/roles', { headers, signal }).catch(() => null),
          fetch('/api/departments', { headers, signal }).catch(() => null),
          fetch('/api/admin/users?limit=50', { headers, signal }).catch(() => null)
        ]);

        if (!uRes || !uRes.ok) {
          throw new Error(`User not found or connection failed`);
        }

        const userJson: DetailedUser = await uRes.json();
        setUserData(userJson);

        // Populate Form
        setFormName(userJson.name || '');
        setFormEmail(userJson.email || '');
        setFormUsername(userJson.username || '');
        setFormEmployeeId(userJson.employee_id || '');
        setFormRoleId(userJson.role_id || 3);
        setFormDepartmentId(userJson.department_id || '');
        setFormJobTitle(userJson.job_title || '');
        setFormReportingTo(userJson.reporting_to || '');
        setFormTeamName(userJson.team_name || '');
        setFormPhone(userJson.phone || (userJson.personal_info?.phone) || '');
        setFormContractType(userJson.contract_type || 'Full-time');
        setFormStatus(userJson.status || 'active');
        setFormPortalAccess(userJson.has_portal_access !== false);
        setFormAuthMethod(userJson.auth_method || 'standard');

        if (rRes && rRes.ok) {
          const rJson = await rRes.json().catch(() => []);
          if (Array.isArray(rJson)) setRoles(rJson);
        }

        if (dRes && dRes.ok) {
          const dJson = await dRes.json().catch(() => []);
          if (Array.isArray(dJson)) setDepartments(dJson);
        }

        if (mRes && mRes.ok) {
          const mJson = await mRes.json().catch(() => ({}));
          const userList = Array.isArray(mJson.users) ? mJson.users : (Array.isArray(mJson) ? mJson : []);
          setManagers(userList.filter((u: any) => String(u.id) !== String(id)));
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load user:', err);
          showToast(err instanceof Error ? err.message : 'Failed to load user details', 'error');
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchSingleUser();

    return () => {
      clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [id, getAuthHeaders]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formName || !formEmail) {
      showToast('Name and email are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        name: formName,
        email: formEmail,
        username: formUsername,
        role_id: Number(formRoleId),
        department_id: formDepartmentId ? Number(formDepartmentId) : null,
        job_title: formJobTitle,
        reporting_to: formReportingTo ? Number(formReportingTo) : null,
        team_name: formTeamName,
        employee_id: formEmployeeId,
        status: formStatus,
        has_portal_access: formPortalAccess,
        phone: formPhone,
        contract_type: formContractType,
        auth_method: formAuthMethod
      };

      if (formPassword.trim()) {
        payload.password = formPassword;
      }

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to save user');
      }

      const updatedUser = await res.json();
      setUserData(prev => prev ? { ...prev, ...updatedUser, ...payload } : null);
      setFormPassword('');
      showToast('User profile & permissions updated successfully!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error updating user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = () => {
    const nextStatus = formStatus === 'active' ? 'inactive' : 'active';
    setFormStatus(nextStatus);
    showToast(`Status toggled to ${nextStatus}. Remember to click Save Changes to persist.`, 'success');
  };

  // Selected role details for the permissions preview
  const selectedRole = roles.find(r => r.id === Number(formRoleId)) || {
    name: userData?.role_name || 'Standard',
    description: userData?.role_description || '',
    permissions: userData?.role_permissions || {}
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading user profile & permissions...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800">User Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          The requested user profile does not exist or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Users Table
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5",
          toast.type === 'error' ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
        )}>
          {toast.message}
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs cursor-pointer"
            title="العودة لجدول المستخدمين"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Link to="/admin/users" className="hover:text-indigo-600 transition-colors no-underline text-slate-500">
                Users
              </Link>
              <span>/</span>
              <span className="text-slate-800">{userData.name}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{userData.name}</span>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200">
                User ID: #{userData.id}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-bold transition-all shadow-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Changes / حفظ التعديلات</span>
          </button>
        </div>
      </div>

      {/* User Profile Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-black shadow-xs shrink-0">
              {(formName || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{formName}</h2>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs border",
                  formStatus === 'active'
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  <span className={cn("w-2 h-2 rounded-full", formStatus === 'active' ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                  {formStatus === 'active' ? 'Active / نشط' : 'Inactive / معطل'}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-500">{formEmail} • {formJobTitle || 'No title set'}</p>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  {selectedRole.name || 'Role'}
                </span>
                {formEmployeeId && (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold flex items-center gap-1">
                    <Fingerprint className="w-3.5 h-3.5 text-indigo-600" />
                    Emp ID: {formEmployeeId}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  {departments.find(d => String(d.id) === String(formDepartmentId))?.name || 'Department Unassigned'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t md:border-t-0 pt-4 md:pt-0">
            <button
              type="button"
              onClick={handleToggleStatus}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-xs cursor-pointer",
                formStatus === 'active'
                  ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              )}
            >
              {formStatus === 'active' ? (
                <>
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>إيقاف الحساب (Deactivate)</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>تفعيل الحساب (Activate)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for Details */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto custom-scrollbar">
        <button
          type="button"
          onClick={() => setActiveSection('basic')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
            activeSection === 'basic'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <User className="w-4 h-4" />
          <span>Basic & Account Info / البيانات الأساسية</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('org')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
            activeSection === 'org'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Building2 className="w-4 h-4" />
          <span>Org & Job / الهيكل والوظيفة</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('permissions')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
            activeSection === 'permissions'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Shield className="w-4 h-4" />
          <span>Assigned Role & Scope / الدور ونطاق الصلاحيات</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('contact')}
          className={cn(
            "px-5 py-3 border-b-2 font-bold text-sm transition-all whitespace-nowrap cursor-pointer flex items-center gap-2",
            activeSection === 'contact'
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Phone className="w-4 h-4" />
          <span>Contact & Profile / بيانات الاتصال</span>
        </button>
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Panel 1: Basic & Account Info */}
        {activeSection === 'basic' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">بيانات الحساب والدخول الأساسية</h3>
              <p className="text-xs text-slate-500">معلومات الهوية وبيانات اعتماد تسجيل الدخول بالنظام.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name / الاسم الكامل *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address / البريد الإلكتروني *</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username / اسم المستخدم *</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Password / تغيير كلمة المرور
                </label>
                <input 
                  type="password" 
                  placeholder="اتركه فارغاً للاحتفاظ بكلمة المرور الحالية"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 font-medium">
                  * Leave blank to keep current password unchanged.
                </p>
              </div>

              {/* Authentication Method Selector */}
              <div className="space-y-2 md:col-span-2 p-5 bg-slate-50/80 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-indigo-600" />
                    <span>Authentication Method / طريقة تسجيل الدخول</span>
                  </label>
                  <span className={cn(
                    "text-[11px] font-bold px-2.5 py-0.5 rounded-full border",
                    formAuthMethod === 'corporate_sso' 
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-indigo-100 text-indigo-800 border-indigo-200"
                  )}>
                    {formAuthMethod === 'corporate_sso' ? 'Corporate SSO Active' : 'Standard Password Login'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div 
                    onClick={() => setFormAuthMethod('standard')}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                      formAuthMethod === 'standard'
                        ? "border-indigo-500 bg-white ring-2 ring-indigo-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white/60"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      formAuthMethod === 'standard' ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Standard Login (Username & Password)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Authenticates using system username / email and local password.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setFormAuthMethod('corporate_sso')}
                    className={cn(
                      "p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3",
                      formAuthMethod === 'corporate_sso'
                        ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white/60"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      formAuthMethod === 'corporate_sso' ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                    )}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Corporate Domain SSO</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Restricted to corporate company domain. Standard password login is rejected.</p>
                    </div>
                  </div>
                </div>
                {formAuthMethod === 'corporate_sso' && (
                  <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/80">
                    ℹ️ When configured for Corporate Domain SSO, this user must authenticate through the Company SSO tab on the login screen.
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2 p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-indigo-600" />
                    <span>Employee ID / Fingerprint Code (كود البصمة المسجل بأجهزة الحضور)</span>
                  </label>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    HR & Attendance Sync
                  </span>
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. 101 or EMP-101"
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-800"
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                />
                <p className="text-[11px] font-medium text-slate-500">
                  كود الموظف يربط هذا الحساب تلقائياً بسجلات الحضور والانصراف، الورديات، والمسيرات في موديول HR.
                </p>
              </div>

              <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">صلاحية دخول بوابة النظام (Portal Access)</h4>
                  <p className="text-xs text-slate-500">السماح للمستخدم بالوصول إلى لوحة التحكم والواجهات السحابية.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={formPortalAccess}
                    onChange={(e) => setFormPortalAccess(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Panel 2: Org & Job */}
        {activeSection === 'org' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">الهيكل التنظيمي والتعيين الوظيفي</h3>
              <p className="text-xs text-slate-500">تحديد القسم، المسمى الوظيفي، المدير المباشر، والفريق.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department / القسم</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value)}
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title / المسمى الوظيفي</label>
                <input 
                  type="text" 
                  placeholder="e.g. Senior Operations Specialist"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formJobTitle}
                  onChange={(e) => setFormJobTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reports To / المدير المباشر</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formReportingTo}
                  onChange={(e) => setFormReportingTo(e.target.value)}
                >
                  <option value="">No Direct Manager / N/A</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.job_title || m.role_name || 'User'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team / الفريق</label>
                <input 
                  type="text" 
                  placeholder="e.g. Core Operations Team"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formTeamName}
                  onChange={(e) => setFormTeamName(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Panel 3: Assigned Role & Permissions Scope */}
        {activeSection === 'permissions' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">الدور المسند ونطاق الصلاحيات</h3>
                <p className="text-xs text-slate-500">
                  تحديد الدور الأمني والاطلاع على الحزم والصلاحيات المفعلة لهذا المستخدم.
                </p>
              </div>

              <Link
                to="/admin/rbac"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all no-underline"
              >
                <span>إدارة مصفوفة الأدوار (RBAC Matrix)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Role Selector Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Role / الدور المسند *</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-800"
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(Number(e.target.value))}
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.description ? `— ${r.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-sm">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>{selectedRole.name}</span>
                </div>
                <p className="text-xs text-slate-600">
                  {selectedRole.description || 'دور مخصص مع صلاحيات محددة لإدارة الموديولات والبيانات.'}
                </p>
              </div>
            </div>

            {/* Visual Breakdown of Permissions by Module */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  نطاق صلاحيات الدور ({selectedRole.name}) عبر الموديولات:
                </h4>
                <span className="text-xs text-slate-400 font-medium">
                  Read-only overview (عدل عبر صفحة RBAC)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {['Dashboard', 'AI Business', 'Sales', 'HR', 'Operations', 'Finance', 'Inventory', 'Admin'].map((moduleName) => {
                  const modPerm = selectedRole.permissions?.[moduleName] || {};
                  const hasView = modPerm.view !== false && (modPerm.read !== false);
                  const hasCreate = modPerm.create === true;
                  const hasEdit = modPerm.edit === true || modPerm.write === true;
                  const hasDelete = modPerm.delete === true;

                  return (
                    <div 
                      key={moduleName}
                      className={cn(
                        "p-4 rounded-2xl border transition-all space-y-3",
                        hasView ? "bg-white border-slate-200 shadow-xs" : "bg-slate-50 border-slate-100 opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-800">{moduleName}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          hasView ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                        )}>
                          {hasView ? 'متاح' : 'معطل'}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100 text-center">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">View</span>
                          <div>{hasView ? <Check className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <span className="text-slate-300 text-xs">-</span>}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">Create</span>
                          <div>{hasCreate ? <Check className="w-3.5 h-3.5 text-indigo-600 mx-auto" /> : <span className="text-slate-300 text-xs">-</span>}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">Edit</span>
                          <div>{hasEdit ? <Check className="w-3.5 h-3.5 text-indigo-600 mx-auto" /> : <span className="text-slate-300 text-xs">-</span>}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-medium">Delete</span>
                          <div>{hasDelete ? <Check className="w-3.5 h-3.5 text-rose-600 mx-auto" /> : <span className="text-slate-300 text-xs">-</span>}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Panel 4: Contact & Profile */}
        {activeSection === 'contact' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6 animate-in fade-in duration-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">بيانات الاتصال ومعلومات التعاقد</h3>
              <p className="text-xs text-slate-500">بيانات التواصل المباشر ومعلومات سجل الموظف.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number / رقم الهاتف</label>
                <input 
                  type="text" 
                  placeholder="+966 50 000 0000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contract Type / نوع العقد</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-slate-800"
                  value={formContractType}
                  onChange={(e) => setFormContractType(e.target.value)}
                >
                  <option value="Full-time">Full-time / دوام كامل</option>
                  <option value="Part-time">Part-time / دوام جزئي</option>
                  <option value="Contract">Contract / عقد محدد المدة</option>
                  <option value="Remote">Remote / عن بعد</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Created At / تاريخ التسجيل بالنظام</label>
                <input 
                  disabled
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
                  value={userData.created_at ? new Date(userData.created_at).toLocaleString() : 'N/A'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Updated / آخر تحديث</label>
                <input 
                  disabled
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 cursor-not-allowed"
                  value={userData.updated_at ? new Date(userData.updated_at).toLocaleString() : 'N/A'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
          >
            Back to Users / العودة
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Changes / حفظ كافة التعديلات</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserDetailPage;
