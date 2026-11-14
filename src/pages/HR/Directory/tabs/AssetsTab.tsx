import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Briefcase, Check, Trash2, Loader2, Plus } from 'lucide-react';
import { EmployeeProfileOutletContext } from './types';
import { supabase } from '../../../../lib/supabase';

interface AssetEntry {
  id: string | number;
  category: string;
  description: string;
  serial: string;
  dateLoaned: string;
  dateReturned?: string;
}

export const AssetsTab: React.FC = () => {
  const { 
    employee, 
    isViewOnly, 
    onSaveEmployeeDetails, 
    showCustomToast 
  } = useOutletContext<EmployeeProfileOutletContext>();

  const [assetsList, setAssetsList] = useState<AssetEntry[]>(() => {
    return Array.isArray(employee?.assets_list) ? employee.assets_list : [];
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isAddingAsset, setIsAddingAsset] = useState<boolean>(false);
  const [newAssetForm, setNewAssetForm] = useState({
    category: '',
    description: '',
    serial: '',
    dateLoaned: new Date().toISOString().split('T')[0],
    dateReturned: ''
  });

  // On-demand lazy fetch for assets if not populated
  useEffect(() => {
    if (!employee?.id) return;
    
    // If already populated, sync local state
    if (Array.isArray(employee.assets_list) && employee.assets_list.length > 0) {
      setAssetsList(employee.assets_list);
      return;
    }

    let isMounted = true;
    const fetchAssets = async () => {
      setLoading(true);
      try {
        // Try backend endpoint first
        const res = await fetch(`/api/hr/employees/${employee.id}/details`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.assets_list)) {
            setAssetsList(data.assets_list);
            return;
          }
        }

        // Try Supabase hr_employee_assets table
        if (supabase && typeof supabase.from === 'function') {
          const { data, error } = await supabase
            .from('hr_employee_assets')
            .select('*')
            .eq('user_id', employee.user_id || employee.id)
            .order('id', { ascending: false });
          if (!error && data && isMounted) {
            const mapped = data.map(a => ({
              id: a.id,
              category: a.category || '',
              description: a.description || '',
              serial: a.serial_number || a.serial || '',
              dateLoaned: a.date_loaned || '',
              dateReturned: a.date_returned || ''
            }));
            setAssetsList(mapped);
          }
        }
      } catch (err) {
        console.warn('Error fetching employee assets:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAssets();
    return () => { isMounted = false; };
  }, [employee?.id, employee?.user_id]);

  const handleSaveNewAsset = async () => {
    if (!newAssetForm.category.trim() || !newAssetForm.description.trim() || !newAssetForm.serial.trim() || !newAssetForm.dateLoaned) {
      showCustomToast('Please fill in all required asset fields (*)', 'error');
      return;
    }

    const newEntry: AssetEntry = {
      id: 'asset-' + Date.now(),
      ...newAssetForm
    };

    const updated = [...assetsList, newEntry];
    setAssetsList(updated);
    setIsAddingAsset(false);
    setNewAssetForm({
      category: '',
      description: '',
      serial: '',
      dateLoaned: new Date().toISOString().split('T')[0],
      dateReturned: ''
    });

    try {
      await onSaveEmployeeDetails({ assets_list: updated });
      showCustomToast('Asset added successfully', 'success');
    } catch (e) {
      showCustomToast('Failed to save asset', 'error');
    }
  };

  const handleDeleteAsset = async (assetId: string | number) => {
    const updated = assetsList.filter(a => a.id !== assetId);
    setAssetsList(updated);
    try {
      await onSaveEmployeeDetails({ assets_list: updated });
      showCustomToast('Asset removed', 'info');
    } catch (e) {
      showCustomToast('Failed to remove asset', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-black text-slate-800 font-serif flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#1b5e20]" /> Assets
        </h3>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-[#1b5e20] text-sm font-black font-serif flex items-center gap-2">
            Assets <span className="font-sans font-normal text-xs text-slate-500">*Custom Table*</span>
          </h4>
          {!isViewOnly && (
            <button
              type="button"
              onClick={() => setIsAddingAsset(!isAddingAsset)}
              className="border border-[#1b5e20] text-[#1b5e20] hover:bg-green-50 px-4 py-2 rounded-xl text-xs font-black transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {isAddingAsset ? 'Cancel' : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Entry</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Add Entry Inline Form */}
        {isAddingAsset && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-3 text-xs animate-in fade-in">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asset Category *</label>
              <input
                type="text"
                placeholder="e.g. Computer, Phone"
                value={newAssetForm.category}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-1 focus:ring-[#1b5e20]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Asset Description *</label>
              <input
                type="text"
                placeholder="e.g. Dell desktop"
                value={newAssetForm.description}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, description: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-1 focus:ring-[#1b5e20]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Serial # *</label>
              <input
                type="text"
                placeholder="e.g. 124343ABC"
                value={newAssetForm.serial}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, serial: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-1 focus:ring-[#1b5e20]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Loaned *</label>
              <input
                type="date"
                value={newAssetForm.dateLoaned}
                onChange={(e) => setNewAssetForm({ ...newAssetForm, dateLoaned: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-1 focus:ring-[#1b5e20]"
              />
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date Returned</label>
                <input
                  type="date"
                  value={newAssetForm.dateReturned}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, dateReturned: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:ring-1 focus:ring-[#1b5e20]"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveNewAsset}
                className="p-3 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl font-bold shrink-0 transition-colors shadow-xs cursor-pointer"
                title="Save Asset Entry"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-[#1b5e20]" />
              <span className="text-xs font-bold">Loading assets data...</span>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-150 text-slate-500 font-black uppercase tracking-wider text-[10px] bg-slate-50/70">
                  <th className="p-4">Asset Category</th>
                  <th className="p-4">Asset Description</th>
                  <th className="p-4">Serial #</th>
                  <th className="p-4">Date Loaned</th>
                  <th className="p-4">Date Returned</th>
                  {!isViewOnly && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assetsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-bold text-xs">
                      No assets assigned to this employee.
                    </td>
                  </tr>
                ) : (
                  assetsList.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-black text-slate-800">{row.category}</td>
                      <td className="p-4 font-bold text-slate-600">{row.description}</td>
                      <td className="p-4 font-mono font-bold text-slate-500">{row.serial}</td>
                      <td className="p-4 text-slate-500 font-bold">{row.dateLoaned || '—'}</td>
                      <td className="p-4 text-slate-500 font-bold">{row.dateReturned || '—'}</td>
                      {!isViewOnly && (
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(row.id)}
                            className="text-rose-600 hover:text-rose-800 p-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetsTab;
