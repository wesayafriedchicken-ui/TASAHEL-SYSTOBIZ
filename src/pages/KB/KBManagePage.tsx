import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  Activity, 
  ShieldCheck, 
  Settings, 
  Plus, 
  ArrowLeft, 
  Trash2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useKB } from './KBContext';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

export const KBManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { checkPermission } = useAuth();
  const {
    categories,
    departments,
    categoryFormData,
    setCategoryFormData,
    editingCategory,
    setEditingCategory,
    handleSaveCategory,
    handleDeleteCategory,
    kbStatuses,
    statusFormData,
    setStatusFormData,
    editingStatus,
    setEditingStatus,
    handleSaveStatus,
    handleDeleteStatus,
    systemRoles,
    handleTogglePermission
  } = useKB();

  const [activeTab, setActiveTab] = useState<'categories' | 'statuses' | 'permissions'>('categories');
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  if (!checkPermission('kb', 'settings') && !checkPermission('kb', 'edit')) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Access Denied</h3>
        <p className="text-xs text-slate-500 mb-6">You don't have administrative permissions to manage Knowledge Base settings.</p>
        <button
          onClick={() => navigate('/kb/articles')}
          className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Return to Articles
        </button>
      </div>
    );
  }

  const confirmDeleteCategory = async () => {
    if (!deleteCatId) return;
    const ok = await handleDeleteCategory(deleteCatId);
    if (ok) setDeleteCatId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/kb/articles')}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Back to Articles"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-600" />
              <span>Knowledge Base Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure article categories, custom lifecycle statuses, and system role access permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Main Card with Tabs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={cn(
              "px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
              activeTab === 'categories' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Manage Categories ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('statuses')}
            className={cn(
              "px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
              activeTab === 'statuses' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Activity className="w-4 h-4" />
            <span>Manage Statuses ({kbStatuses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={cn(
              "px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
              activeTab === 'permissions' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Manage Permissions</span>
          </button>
        </div>

        <div className="p-6 md:p-8">
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <form onSubmit={handleSaveCategory} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category Name</label>
                    <input 
                      required
                      value={categoryFormData.name}
                      onChange={e => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                      placeholder="e.g., HR Policies & Guidelines"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                    <select 
                      value={categoryFormData.department_id}
                      onChange={e => setCategoryFormData({ ...categoryFormData, department_id: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {editingCategory && (
                    <button 
                      type="button"
                      onClick={() => { 
                        setEditingCategory(null); 
                        setCategoryFormData({ name: '', department_id: 1 }); 
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Existing Categories ({categories.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-all group shadow-sm">
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{cat.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{cat.department_name || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => {
                            setEditingCategory(cat);
                            setCategoryFormData({ name: cat.name, department_id: cat.department_id });
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Edit category"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteCatId(cat.id)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Statuses Tab */}
          {activeTab === 'statuses' && (
            <div className="space-y-8">
              <form onSubmit={handleSaveStatus} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  {editingStatus ? 'Edit Status' : 'Add New Status'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Label</label>
                    <input 
                      required
                      value={statusFormData.label}
                      onChange={e => setStatusFormData({ ...statusFormData, label: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm"
                      placeholder="e.g., In Review"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color"
                        value={statusFormData.color}
                        onChange={e => setStatusFormData({ ...statusFormData, color: e.target.value })}
                        className="w-10 h-10 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={statusFormData.color}
                        onChange={e => setStatusFormData({ ...statusFormData, color: e.target.value })}
                        className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono"
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                  <div className="pb-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input 
                        type="checkbox"
                        checked={statusFormData.is_default}
                        onChange={e => setStatusFormData({ ...statusFormData, is_default: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                      <span>Set as Default Status</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  {editingStatus && (
                    <button 
                      type="button"
                      onClick={() => { 
                        setEditingStatus(null); 
                        setStatusFormData({ label: '', color: '#64748b', is_default: false }); 
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                  >
                    {editingStatus ? 'Update Status' : 'Add Status'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Existing Statuses ({kbStatuses.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kbStatuses.map(status => (
                    <div key={status.id} className="flex items-center justify-between p-4 bg-white border border-slate-200/80 rounded-2xl hover:border-slate-300 transition-all group shadow-sm">
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" 
                          style={{ backgroundColor: status.color || '#64748b' }} 
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{status.label}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest flex items-center gap-1.5 mt-0.5">
                            <span>Key: {status.value || status.status_key}</span>
                            {status.is_default && (
                              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-bold text-[8px]">DEFAULT</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button 
                          onClick={() => {
                            setEditingStatus(status);
                            setStatusFormData({ label: status.label, color: status.color || '#64748b', is_default: !!status.is_default });
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Edit status"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteStatus(status.id)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete status"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Knowledge Base Permissions Matrix</h4>
                <p className="text-[11px] text-slate-500">Configure permission access (View, Create, Edit, Delete, Export) for each defined system role below.</p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full border-collapse bg-white text-left text-sm text-slate-500">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th scope="col" className="px-6 py-4">System Role</th>
                      <th scope="col" className="px-6 py-4 text-center">View</th>
                      <th scope="col" className="px-6 py-4 text-center">Create</th>
                      <th scope="col" className="px-6 py-4 text-center">Edit</th>
                      <th scope="col" className="px-6 py-4 text-center">Delete</th>
                      <th scope="col" className="px-6 py-4 text-center">Export</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 border-t border-slate-100">
                    {systemRoles.map(role => {
                      const perms = role.permissions?.['Knowledge Base'] || role.permissions?.['kb'] || { view: false, create: false, edit: false, delete: false, export: false };
                      return (
                        <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{role.name}</td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={!!perms.view}
                              onChange={() => handleTogglePermission(role, 'view')}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={!!perms.create}
                              onChange={() => handleTogglePermission(role, 'create')}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={!!perms.edit}
                              onChange={() => handleTogglePermission(role, 'edit')}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={!!perms.delete}
                              onChange={() => handleTogglePermission(role, 'delete')}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="checkbox"
                              checked={!!perms.export}
                              onChange={() => handleTogglePermission(role, 'export')}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Category Confirmation Modal */}
      {deleteCatId !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-lg font-bold text-slate-900">Delete Category?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this category? Make sure no articles are currently assigned to it.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCatId(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KBManagePage;
