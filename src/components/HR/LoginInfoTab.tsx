import React, { useState } from 'react';
import { 
  Key, Globe, Mail, User, Shield, ExternalLink, Plus, Trash2, Edit2, Copy, Check, X, Eye, EyeOff, LayoutGrid, Fingerprint, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils'; // Or standard className merging if cn is not present, but let's check. Actually cn is imported in HRManagement.tsx from "src/lib/utils" or similar, let's use a safe check.

export interface LoginCredential {
  id: string;
  system_name: string;
  url: string;
  email: string;
  user: string;
  password?: string;
  extensions: string;
}

interface LoginInfoTabProps {
  emp: any;
  onSaveEmployeeDetails: (updated: any) => Promise<void>;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
}

export const LoginInfoTab: React.FC<LoginInfoTabProps> = ({ 
  emp, 
  onSaveEmployeeDetails,
  isViewOnly = false,
  onMarkDirty
}) => {
  const credentials: LoginCredential[] = emp.personal_info?.login_credentials || emp.system_logins || [];
  
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [editingCred, setEditingCred] = useState<LoginCredential | null>(null);
  
  // Form state
  const [systemName, setSystemName] = useState('');
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [extensions, setExtensions] = useState('');
  
  // UI helper states
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<{ [key: string]: boolean }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Employee ID & User ID State
  const initialEmpId = emp.employee_id || emp.id_number || emp.personal_info?.employee_number || '';
  const [employeeIdInput, setEmployeeIdInput] = useState(initialEmpId);
  const [isEditingEmpId, setIsEditingEmpId] = useState(false);
  const [isSavingEmpId, setIsSavingEmpId] = useState(false);

  const handleSaveEmpId = async () => {
    setIsSavingEmpId(true);
    if (onMarkDirty) onMarkDirty();
    try {
      const updatedPersonal = {
        ...(emp.personal_info || {}),
        employee_number: employeeIdInput
      };
      await onSaveEmployeeDetails({
        employee_id: employeeIdInput,
        id_number: employeeIdInput,
        personal_info: updatedPersonal
      });
      setIsEditingEmpId(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update Employee ID');
    } finally {
      setIsSavingEmpId(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingCred(null);
    setSystemName('');
    setUrl('');
    setEmail('');
    setUser('');
    setPassword('');
    setExtensions('');
    setIsOpenModal(true);
  };

  const handleOpenEdit = (cred: LoginCredential) => {
    setEditingCred(cred);
    setSystemName(cred.system_name || '');
    setUrl(cred.url || '');
    setEmail(cred.email || '');
    setUser(cred.user || '');
    setPassword(cred.password || '');
    setExtensions(cred.extensions || '');
    setIsOpenModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemName.trim()) {
      alert('System name is required');
      return;
    }

    setIsSaving(true);
    if (onMarkDirty) onMarkDirty();
    try {
      let updatedList: LoginCredential[] = [...credentials];
      
      if (editingCred) {
        // Edit existing
        updatedList = updatedList.map(item => 
          item.id === editingCred.id 
            ? { ...item, system_name: systemName, url, email, user, password, extensions }
            : item
        );
      } else {
        // Add new
        const newCred: LoginCredential = {
          id: Date.now().toString(),
          system_name: systemName,
          url,
          email,
          user,
          password,
          extensions
        };
        updatedList.push(newCred);
      }

      const updatedPersonal = {
        ...(emp.personal_info || {}),
        login_credentials: updatedList
      };

      await onSaveEmployeeDetails({
        personal_info: updatedPersonal,
        system_logins: updatedList
      });

      setIsOpenModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save credentials');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (onMarkDirty) onMarkDirty();
      const updatedList = credentials.filter(item => item.id !== id);
      const updatedPersonal = {
        ...(emp.personal_info || {}),
        login_credentials: updatedList
      };

      await onSaveEmployeeDetails({
        personal_info: updatedPersonal,
        system_logins: updatedList
      });
      setDeletingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string, id: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    const key = `${id}-${type}`;
    setCopiedId(key);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="space-y-6">
      {/* System & Attendance Identifiers Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Attendance & System Identifiers (بيانات الربط والبصمة)</h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Primary Keys for Daily Logs & Attendance Sync</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Employee ID (Biometric Fingerprint ID - Editable) */}
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-150 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-indigo-600" />
                Employee ID / Fingerprint Code (كود البصمة)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                Editable (قابل للتعديل)
              </span>
            </div>

            {isEditingEmpId ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={employeeIdInput}
                  onChange={(e) => setEmployeeIdInput(e.target.value)}
                  placeholder="e.g. 101 or EMP-101"
                  className="flex-1 px-3 py-1.5 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSaveEmpId}
                  disabled={isSavingEmpId}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingEmpId ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => {
                    setEmployeeIdInput(initialEmpId);
                    setIsEditingEmpId(false);
                  }}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-mono font-black text-indigo-950">
                  {initialEmpId || <span className="text-slate-400 italic text-xs">Not Set (غير محدد)</span>}
                </span>
                {!isViewOnly && (
                  <button
                    onClick={() => setIsEditingEmpId(true)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل كود البصمة</span>
                  </button>
                )}
              </div>
            )}
            <p className="text-[11px] text-indigo-800/80 font-medium">
              هذا الرقم مطبق في أجهزة الحضور والانصراف (Fingerprint Devices) لربط السجلات اليومية فور سحب البصمة.
            </p>
          </div>

          {/* System User ID (Read-Only) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-500" />
                System User ID (رقم المستخدم بالنظام)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                Read-Only (غير قابل للتعديل)
              </span>
            </div>
            <div className="pt-1">
              <span className="text-base font-mono font-black text-slate-800">
                {emp.user_id || emp.id ? `User ID: #${emp.user_id || emp.id}` : 'N/A (No System User Linked)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              الرمز المعرف لم حساب المستخدم المسؤول عن تسجيل الدخول وصلاحيات الوصول على النظام.
            </p>
          </div>
        </div>
      </div>

      {/* Credentials Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Header / Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#1b5e20]" />
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                System Credentials & Logins (بيانات دخول الأنظمة)
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                إدارة أسماء الأنظمة، المستخدم، كلمة المرور، وروابط الدخول المباشرة
              </p>
            </div>
          </div>
          
          {!isViewOnly && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#1b5e20] hover:bg-[#123e15] text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حساب نظام (Add System Login)</span>
            </button>
          )}
        </div>

        {credentials.length === 0 ? (
          <div className="py-14 text-center space-y-4 px-4">
            <div className="w-12 h-12 bg-emerald-50 text-[#1b5e20] rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No Login Info Added Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                قم بإضافة بيانات تسجيل الدخول الخاصة بالموظف (اسم السيستم، اسم المستخدم، كلمة المرور، والرابط) لإدارتها بسهولة وبأمان.
              </p>
            </div>
            {!isViewOnly && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1b5e20] text-white rounded-xl text-xs font-black hover:bg-[#123e15] transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة أول حساب نظام</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="px-6 py-3.5">اسم السيستم (System Name)</th>
                  <th className="px-6 py-3.5">اليوزر (Username)</th>
                  <th className="px-6 py-3.5">الباسورد (Password)</th>
                  <th className="px-6 py-3.5">الرابط (Link / URL)</th>
                  {!isViewOnly && <th className="px-6 py-3.5 text-right">إجراءات (Actions)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                {credentials.map((cred) => (
                  <tr key={cred.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* 1. System Name (اسم السيستم) */}
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1b5e20] flex items-center justify-center font-bold">
                          <LayoutGrid className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="block font-black text-slate-800">{cred.system_name}</span>
                          {cred.extensions && (
                            <span className="text-[10px] font-semibold text-slate-400 block">{cred.extensions}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 2. Username (اليوزر) */}
                    <td className="px-6 py-4">
                      {cred.user || cred.email ? (
                        <div className="flex items-center gap-1.5 group font-mono font-bold text-slate-800">
                          <span className="truncate max-w-[160px]">{cred.user || cred.email}</span>
                          <button
                            onClick={() => handleCopy(cred.user || cred.email || '', cred.id, 'user')}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title="Copy Username"
                          >
                            {copiedId === `${cred.id}-user` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">-</span>
                      )}
                    </td>

                    {/* 3. Password (الباسورد) */}
                    <td className="px-6 py-4">
                      {cred.password ? (
                        <div className="flex items-center gap-1.5 group font-mono font-bold text-slate-800">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                            {visiblePasswords[cred.id] ? cred.password : '••••••••'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => togglePasswordVisibility(cred.id)}
                              className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                              title={visiblePasswords[cred.id] ? "Hide Password" : "Show Password"}
                            >
                              {visiblePasswords[cred.id] ? (
                                <EyeOff className="w-3.5 h-3.5" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopy(cred.password || '', cred.id, 'password')}
                              className="text-slate-400 hover:text-slate-600 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Copy Password"
                            >
                              {copiedId === `${cred.id}-password` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-300 font-mono">-</span>
                      )}
                    </td>

                    {/* 4. Link / URL (رابط بتاعه) */}
                    <td className="px-6 py-4 font-medium max-w-[200px]">
                      {cred.url ? (
                        <div className="flex items-center gap-1.5 group">
                          <a 
                            href={cred.url.startsWith('http') ? cred.url : `https://${cred.url}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[#1565c0] font-bold hover:underline truncate flex items-center gap-1"
                          >
                            <Globe className="w-3.5 h-3.5 text-[#1565c0] shrink-0" />
                            <span className="truncate">{cred.url.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                          </a>
                          <button
                            onClick={() => handleCopy(cred.url, cred.id, 'url')}
                            className="text-slate-400 hover:text-slate-600 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                            title="Copy Link"
                          >
                            {copiedId === `${cred.id}-url` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    {!isViewOnly && (
                      <td className="px-6 py-4 text-right">
                        {deletingId === cred.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                            <span className="text-[10px] font-bold text-slate-400 mr-1">حذف؟</span>
                            <button
                              onClick={() => handleDelete(cred.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-black text-[10px] transition-all cursor-pointer"
                            >
                              حذف
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-black text-[10px] transition-all cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(cred)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(cred.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isOpenModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden border border-slate-150"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-[#1b5e20]" />
                  {editingCred ? 'Edit Login Info' : 'Add Login Info'}
                </h3>
                <button
                  onClick={() => setIsOpenModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* System Name */}
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      System Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={systemName}
                      onChange={(e) => setSystemName(e.target.value)}
                      placeholder="e.g. ERP, Gmail, BambooHR..."
                      className="w-full text-xs font-bold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                    />
                  </div>

                  {/* URL */}
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      URL
                    </label>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="e.g. system.company.com"
                      className="w-full text-xs font-semibold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      placeholder="e.g. admin_jane"
                      className="w-full text-xs font-semibold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. jane@company.com"
                      className="w-full text-xs font-semibold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Password
                    </label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full text-xs font-mono text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                    />
                  </div>

                  {/* Extensions */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Extensions
                    </label>
                    <input
                      type="text"
                      value={extensions}
                      onChange={(e) => setExtensions(e.target.value)}
                      placeholder="e.g. Admin Role, Ext 42"
                      className="w-full text-xs font-semibold text-slate-800 p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#1b5e20]/50 focus:border-[#1b5e20]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-150 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsOpenModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-bold bg-[#1b5e20] hover:bg-[#123f15] text-white rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
