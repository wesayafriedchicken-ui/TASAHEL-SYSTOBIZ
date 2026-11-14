import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShieldCheck, Plus, Check, Trash2, Loader2, Users } from 'lucide-react';
import { EmployeeProfileOutletContext } from './types';

interface DependentItem {
  id: string | number;
  name: string;
  relationship: string;
  dob?: string;
  gender?: string;
}

interface BenefitHistoryItem {
  id: string | number;
  date: string;
  benefit: string;
  changeType: string;
  notes?: string;
}

export const BenefitsTab: React.FC = () => {
  const { 
    employee, 
    isViewOnly, 
    onSaveEmployeeDetails, 
    showCustomToast 
  } = useOutletContext<EmployeeProfileOutletContext>();

  const [loading, setLoading] = useState<boolean>(false);
  const [dependentsList, setDependentsList] = useState<DependentItem[]>(() => {
    return Array.isArray(employee?.benefits_info?.dependents) ? employee.benefits_info.dependents : [];
  });
  const [benefitHistoryList, setBenefitHistoryList] = useState<BenefitHistoryItem[]>(() => {
    return Array.isArray(employee?.benefits_info?.history) ? employee.benefits_info.history : [];
  });

  const [isAddingDependent, setIsAddingDependent] = useState<boolean>(false);
  const [newDependentForm, setNewDependentForm] = useState({
    name: '',
    relationship: 'Spouse',
    dob: '',
    gender: 'Male'
  });

  const [isAddingBenefitHistory, setIsAddingBenefitHistory] = useState<boolean>(false);
  const [newBenefitHistoryForm, setNewBenefitHistoryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    benefit: 'Medical Coverage (PPO)',
    changeType: 'Enrollment',
    notes: ''
  });

  // On-demand fetch
  useEffect(() => {
    if (!employee?.id) return;
    if (dependentsList.length > 0 || benefitHistoryList.length > 0) return;

    let isMounted = true;
    const fetchBenefits = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hr/employees/${employee.id}/details`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.benefits_info) {
            if (Array.isArray(data.benefits_info.dependents)) {
              setDependentsList(data.benefits_info.dependents);
            }
            if (Array.isArray(data.benefits_info.history)) {
              setBenefitHistoryList(data.benefits_info.history);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching benefits:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBenefits();
    return () => { isMounted = false; };
  }, [employee?.id]);

  const handleSaveDependent = async () => {
    if (!newDependentForm.name.trim()) {
      showCustomToast('Please enter dependent full name', 'error');
      return;
    }

    const newDep: DependentItem = {
      id: 'dep-' + Date.now(),
      ...newDependentForm
    };

    const updated = [...dependentsList, newDep];
    setDependentsList(updated);
    setIsAddingDependent(false);
    setNewDependentForm({ name: '', relationship: 'Spouse', dob: '', gender: 'Male' });

    try {
      await onSaveEmployeeDetails({
        benefits_info: {
          dependents: updated,
          history: benefitHistoryList
        }
      });
      showCustomToast('Dependent added', 'success');
    } catch {
      showCustomToast('Failed to add dependent', 'error');
    }
  };

  const handleDeleteDependent = async (depId: string | number) => {
    const updated = dependentsList.filter(d => d.id !== depId);
    setDependentsList(updated);
    try {
      await onSaveEmployeeDetails({
        benefits_info: {
          dependents: updated,
          history: benefitHistoryList
        }
      });
      showCustomToast('Dependent removed', 'info');
    } catch {
      showCustomToast('Failed to remove dependent', 'error');
    }
  };

  const handleSaveBenefitHistory = async () => {
    if (!newBenefitHistoryForm.date || !newBenefitHistoryForm.benefit) {
      showCustomToast('Please provide required benefit record fields', 'error');
      return;
    }

    const newHist: BenefitHistoryItem = {
      id: 'bh-' + Date.now(),
      ...newBenefitHistoryForm
    };

    const updated = [newHist, ...benefitHistoryList];
    setBenefitHistoryList(updated);
    setIsAddingBenefitHistory(false);
    setNewBenefitHistoryForm({
      date: new Date().toISOString().split('T')[0],
      benefit: 'Medical Coverage (PPO)',
      changeType: 'Enrollment',
      notes: ''
    });

    try {
      await onSaveEmployeeDetails({
        benefits_info: {
          dependents: dependentsList,
          history: updated
        }
      });
      showCustomToast('Benefit record added', 'success');
    } catch {
      showCustomToast('Failed to add benefit record', 'error');
    }
  };

  const handleDeleteBenefitHistory = async (histId: string | number) => {
    const updated = benefitHistoryList.filter(h => h.id !== histId);
    setBenefitHistoryList(updated);
    try {
      await onSaveEmployeeDetails({
        benefits_info: {
          dependents: dependentsList,
          history: updated
        }
      });
      showCustomToast('Benefit record removed', 'info');
    } catch {
      showCustomToast('Failed to remove record', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-slate-800 font-serif flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#1b5e20]" /> Benefits Information
        </h3>
      </div>

      {/* Overview Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-[#1b5e20]" /> Active Plans Overview
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Medical Coverage</span>
            <span className="text-sm font-black text-slate-800">Standard PPO Family Plan</span>
            <span className="text-xs text-slate-500 font-medium block mt-1">Status: Active • Employer Paid 80%</span>
          </div>
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Dental & Vision</span>
            <span className="text-sm font-black text-slate-800">Comprehensive Dental (Delta)</span>
            <span className="text-xs text-slate-500 font-medium block mt-1">Status: Active • Included</span>
          </div>
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Retirement (401k)</span>
            <span className="text-sm font-black text-slate-800">Safe Harbor 4% Match</span>
            <span className="text-xs text-slate-500 font-medium block mt-1">Employee Contribution: 6%</span>
          </div>
        </div>
      </div>

      {/* Dependents Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1b5e20]" /> Covered Dependents ({dependentsList.length})
          </h4>
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => setIsAddingDependent(!isAddingDependent)}
              className="text-xs font-black text-[#1b5e20] hover:bg-green-50 border border-[#1b5e20] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> {isAddingDependent ? 'Cancel' : 'Add Dependent'}
            </button>
          )}
        </div>

        {isAddingDependent && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
              <input
                type="text"
                placeholder="Dependent's full name"
                value={newDependentForm.name}
                onChange={(e) => setNewDependentForm({ ...newDependentForm, name: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Relationship</label>
              <select
                value={newDependentForm.relationship}
                onChange={(e) => setNewDependentForm({ ...newDependentForm, relationship: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              >
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date of Birth</label>
              <input
                type="date"
                value={newDependentForm.dob}
                onChange={(e) => setNewDependentForm({ ...newDependentForm, dob: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gender</label>
                <select
                  value={newDependentForm.gender}
                  onChange={(e) => setNewDependentForm({ ...newDependentForm, gender: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleSaveDependent}
                className="p-3 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl font-bold shrink-0 shadow-xs cursor-pointer"
                title="Save Dependent"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                <th className="p-3">Dependent Name</th>
                <th className="p-3">Relationship</th>
                <th className="p-3">Date of Birth</th>
                <th className="p-3">Gender</th>
                {!isViewOnly && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dependentsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-bold text-xs">
                    No dependents added for this employee.
                  </td>
                </tr>
              ) : (
                dependentsList.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-black text-slate-800">{dep.name}</td>
                    <td className="p-3 font-bold text-slate-600">{dep.relationship}</td>
                    <td className="p-3 text-slate-500">{dep.dob || '—'}</td>
                    <td className="p-3 text-slate-500">{dep.gender || '—'}</td>
                    {!isViewOnly && (
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDependent(dep.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                          title="Remove Dependent"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Benefit Change History */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1b5e20]" /> Benefit History & Enrollment Log
          </h4>
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => setIsAddingBenefitHistory(!isAddingBenefitHistory)}
              className="text-xs font-black text-[#1b5e20] hover:bg-green-50 border border-[#1b5e20] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> {isAddingBenefitHistory ? 'Cancel' : 'Add History Record'}
            </button>
          )}
        </div>

        {isAddingBenefitHistory && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Effective Date *</label>
              <input
                type="date"
                value={newBenefitHistoryForm.date}
                onChange={(e) => setNewBenefitHistoryForm({ ...newBenefitHistoryForm, date: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Benefit *</label>
              <input
                type="text"
                placeholder="e.g. Health PPO, Dental"
                value={newBenefitHistoryForm.benefit}
                onChange={(e) => setNewBenefitHistoryForm({ ...newBenefitHistoryForm, benefit: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Change Type</label>
              <select
                value={newBenefitHistoryForm.changeType}
                onChange={(e) => setNewBenefitHistoryForm({ ...newBenefitHistoryForm, changeType: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              >
                <option value="Enrollment">Enrollment</option>
                <option value="Modification">Modification</option>
                <option value="Termination">Termination</option>
                <option value="Open Enrollment">Open Enrollment</option>
              </select>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional details"
                  value={newBenefitHistoryForm.notes}
                  onChange={(e) => setNewBenefitHistoryForm({ ...newBenefitHistoryForm, notes: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveBenefitHistory}
                className="p-3 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl font-bold shrink-0 shadow-xs cursor-pointer"
                title="Save Benefit Record"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                <th className="p-3">Effective Date</th>
                <th className="p-3">Benefit</th>
                <th className="p-3">Change Type</th>
                <th className="p-3">Notes</th>
                {!isViewOnly && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {benefitHistoryList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-bold text-xs">
                    No benefit history records found.
                  </td>
                </tr>
              ) : (
                benefitHistoryList.map((hist) => (
                  <tr key={hist.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{hist.date}</td>
                    <td className="p-3 font-bold text-slate-700">{hist.benefit}</td>
                    <td className="p-3 font-medium text-slate-500">{hist.changeType}</td>
                    <td className="p-3 font-medium text-slate-400">{hist.notes || '—'}</td>
                    {!isViewOnly && (
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteBenefitHistory(hist.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-md cursor-pointer"
                          title="Remove Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BenefitsTab;
