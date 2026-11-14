import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  UserPlus, 
  Shield, 
  Lock, 
  UserCheck, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Fingerprint, 
  X, 
  AlertCircle,
  Loader2,
  Building2,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import DeleteConfirmation from '../../components/Common/DeleteConfirmation';

interface UserItem {
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
  department_name?: string;
  manager_name?: string;
  hr_employee_id?: number;
}

export const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = (currentUser as any)?.is_super_admin || currentUser?.email === 'admin@gmail.com' || (currentUser as any)?.role_id === 1;

  const [users, setUsers] = useState<UserItem[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; user: UserItem | null }>({
    isOpen: false,
    user: null
  });

  // Quick Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role_id: 3,
    department_id: '' as string | number,
    job_title: '',
    employee_id: '',
    auth_method: 'standard' as 'standard' | 'corporate_sso',
    status: 'active' as 'active' | 'inactive'
  });

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

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch paginated users (LIMIT 25)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const res = await fetch(`/api/admin/users?page=${page}&limit=25${searchParam}`, {
        headers: getAuthHeaders()
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
        setTotalUsers(data.total || data.users.length);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.users.length) / 25) || 1);
      } else if (Array.isArray(data)) {
        setUsers(data);
        setTotalUsers(data.length);
        setTotalPages(Math.ceil(data.length / 25) || 1);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showToast('Failed to load users from server', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, getAuthHeaders]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Load minimal roles & departments when Add User modal opens
  const loadReferenceData = async () => {
    try {
      const [rRes, dRes] = await Promise.all([
        fetch('/api/admin/roles', { headers: getAuthHeaders() }),
        fetch('/api/departments', { headers: getAuthHeaders() })
      ]);
      if (rRes.ok) {
        const rData = await rRes.json();
        if (Array.isArray(rData)) setRoles(rData);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        if (Array.isArray(dData)) setDepartments(dData);
      }
    } catch (e) {
      console.error('Error loading reference data:', e);
    }
  };

  const handleOpenAddUser = () => {
    loadReferenceData();
    setNewUser({
      name: '',
      email: '',
      username: '',
      password: '',
      role_id: roles[0]?.id || 3,
      department_id: '',
      job_title: '',
      employee_id: '',
      auth_method: 'standard',
      status: 'active'
    });
    setIsAddUserModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.username) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    if (newUser.auth_method === 'standard' && !newUser.password) {
      showToast('Password is required for standard login', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...newUser,
          password: newUser.password || (newUser.auth_method === 'corporate_sso' ? 'sso-auth-protected' : 'core123'),
          department_id: newUser.department_id ? Number(newUser.department_id) : null,
          role_id: Number(newUser.role_id)
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || 'Failed to create user');
      }

      showToast('User created successfully!', 'success');
      setIsAddUserModalOpen(false);
      fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error creating user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleUserStatus = async (targetUser: UserItem) => {
    const newStatus = targetUser.status === 'inactive' ? 'active' : 'inactive';
    
    // Optimistic UI update
    setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) {
        // Try fallback PUT
        await fetch(`/api/admin/users/${targetUser.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ status: newStatus })
        });
      }

      showToast(
        newStatus === 'inactive' 
          ? `تم إيقاف دخول المستخدم (${targetUser.name})` 
          : `تم تفعيل حساب المستخدم (${targetUser.name})`,
        newStatus === 'inactive' ? 'error' : 'success'
      );
    } catch (err) {
      // Revert on error
      setUsers(prev => prev.map(u => u.id === targetUser.id ? targetUser : u));
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm.user) return;
    const userId = deleteConfirm.user.id;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to delete user');
      }

      showToast(`User ${deleteConfirm.user.name} deleted successfully!`, 'success');
      setDeleteConfirm({ isOpen: false, user: null });
      fetchUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5",
          toast.type === 'error' ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
        )}>
          {toast.message}
        </div>
      )}

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, email, job title, or Emp ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          onClick={handleOpenAddUser}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Users Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Department</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Auth Method</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Reports To</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <span className="text-sm font-medium">Loading users data...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No users found matching your criteria.</p>
                      <p className="text-xs text-slate-400">Try adjusting your search terms or create a new user.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr 
                    key={user.id} 
                    onClick={() => navigate(`/admin/users/${user.id}`)}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    title="انقر لعرض وتعديل الملف الشامل للمستخدم وصلاحياته"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black shadow-xs shrink-0">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {user.name}
                            </p>
                            <span 
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded-md border border-slate-200" 
                              title="رقم المستخدم بالنظام (System User ID)"
                            >
                              User ID: #{user.id}
                            </span>
                            {user.employee_id && (
                              <span 
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-md border border-indigo-200/60" 
                                title="كود البصمة / Employee Fingerprint ID"
                              >
                                Emp ID: {user.employee_id}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium">
                            {user.job_title || <span className="text-slate-400 italic">No job title</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {user.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                        <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {user.role_name || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.auth_method === 'corporate_sso' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                          Corporate SSO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/70 shadow-2xs">
                          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.manager_name || <span className="text-slate-300 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs border",
                          user.status === 'active' || !user.status
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        )}>
                          <span className={cn(
                            "w-2 h-2 rounded-full", 
                            user.status === 'active' || !user.status ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                          )} />
                          {user.status === 'active' || !user.status ? "Active / نشط" : "Inactive / معطل"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleUserStatus(user)}
                          title={user.status === 'active' || !user.status ? 'إيقاف صلاحية الدخول' : 'تفعيل حساب المستخدم وصلاحية الدخول'}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer",
                            user.status === 'active' || !user.status
                              ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          )}
                        >
                          {user.status === 'active' || !user.status ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-600" />
                              <span className="hidden sm:inline">إيقاف الدخول</span>
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="hidden sm:inline">تفعيل الدخول</span>
                            </>
                          )}
                        </button>

                        <button 
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors cursor-pointer"
                          title="تعديل بيانات وصلاحيات المستخدم (الانتقال لصفحة المستخدم)"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {isSuperAdmin && (
                          <button 
                            onClick={() => setDeleteConfirm({ isOpen: true, user })}
                            className="p-2 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                            title="حذف المستخدم"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Controls (LIMIT 25) */}
        {!loading && totalUsers > 0 && (
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{(page - 1) * 25 + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * 25, totalUsers)}</span> of{' '}
              <span className="font-bold text-slate-800">{totalUsers}</span> total users
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={cn(
                  "p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1",
                  page <= 1 
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="px-2 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setPage(p)}
                          className={cn(
                            "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                            p === page
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={cn(
                  "p-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1",
                  page >= totalPages 
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs"
                )}
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete User Confirmation Modal */}
      {deleteConfirm.isOpen && deleteConfirm.user && (
        <DeleteConfirmation
          isOpen={deleteConfirm.isOpen}
          title="Delete User Account"
          message={`Are you sure you want to permanently delete the account for "${deleteConfirm.user.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteUser}
          onClose={() => setDeleteConfirm({ isOpen: false, user: null })}
        />
      )}

      {/* Quick Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsAddUserModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-bold text-slate-900">Add New User</h3>
              </div>
              <button 
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                  <input 
                    required
                    type="email" 
                    placeholder="john@company.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username *</label>
                  <input 
                    required
                    type="text" 
                    placeholder="johndoe"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  />
                </div>

                {/* Authentication Method Selector */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Authentication Method / طريقة تسجيل الدخول *</span>
                    <span className="text-[11px] font-semibold text-indigo-600">
                      {newUser.auth_method === 'corporate_sso' ? 'Corporate SSO Enabled' : 'Standard Password Login'}
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setNewUser({ ...newUser, auth_method: 'standard' })}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                        newUser.auth_method === 'standard'
                          ? "border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        newUser.auth_method === 'standard' ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-200 text-slate-500"
                      )}>
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Standard Login</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Username & password authentication (current login flow).</p>
                      </div>
                    </div>

                    <div 
                      onClick={() => setNewUser({ ...newUser, auth_method: 'corporate_sso' })}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                        newUser.auth_method === 'corporate_sso'
                          ? "border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        newUser.auth_method === 'corporate_sso' ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-500"
                      )}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Corporate Domain SSO</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">Domain-restricted SSO (e.g. @tasahel.com.eg). Password login blocked.</p>
                      </div>
                    </div>
                  </div>
                  {newUser.auth_method === 'corporate_sso' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>This user will authenticate using their verified corporate email domain. Standard password login will be disabled for security.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Password {newUser.auth_method === 'standard' ? '*' : '(Optional for SSO)'}
                  </label>
                  <input 
                    required={newUser.auth_method === 'standard'}
                    type="password" 
                    placeholder={newUser.auth_method === 'corporate_sso' ? "Managed by Corporate SSO" : "••••••••"}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Fingerprint className="w-4 h-4 text-indigo-600" />
                    <span>Employee ID / Fingerprint Code (كود البصمة)</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 101 or EMP-101"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.employee_id}
                    onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.role_id}
                    onChange={(e) => setNewUser({ ...newUser, role_id: Number(e.target.value) })}
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.department_id}
                    onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Operations Specialist"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                    value={newUser.job_title}
                    onChange={(e) => setNewUser({ ...newUser, job_title: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
