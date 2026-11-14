import React, { useState } from 'react';
import { 
  Award, Trophy, Star, Plus, Trash2, Edit2, Calendar, User, Gift, Check, X, Shield, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee } from '../../types';

export interface RecognitionAward {
  id: string;
  title: string;
  category: string;
  date: string;
  awardedBy: string;
  reward?: string;
  message: string;
}

interface EmployeeRecognitionTabProps {
  emp: Employee;
  currentUser: any;
  onSaveEmployeeDetails: (updated: Partial<Employee>) => Promise<void>;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
}

const CATEGORIES = [
  'Excellence Award',
  'Employee of the Month',
  'Innovation Champion',
  'Leadership Award',
  'Team Player',
  'Spot Bonus',
  'Customer Hero',
  'Years of Service'
];

const REWARDS = [
  'Spot Bonus ($250)',
  'Spot Bonus ($500)',
  'Plaque & Trophy',
  'Gift Certificate',
  'Recognition Points',
  'Extra Paid Day Off',
  'Public Commendation'
];

export const EmployeeRecognitionTab: React.FC<EmployeeRecognitionTabProps> = ({
  emp,
  currentUser,
  onSaveEmployeeDetails,
  isViewOnly = false,
  onMarkDirty
}) => {
  const recognitions: RecognitionAward[] = 
    (emp as any).recognition_list ||
    emp.personal_info?.recognition_list ||
    (emp as any).recognitions ||
    [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAward, setEditingAward] = useState<RecognitionAward | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Excellence Award');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [awardedBy, setAwardedBy] = useState(currentUser?.name || 'Management');
  const [reward, setReward] = useState('Spot Bonus ($250)');
  const [message, setMessage] = useState('');

  const handleOpenAdd = () => {
    setEditingAward(null);
    setTitle('');
    setCategory('Excellence Award');
    setDate(new Date().toISOString().slice(0, 10));
    setAwardedBy(currentUser?.name || 'Management');
    setReward('Spot Bonus ($250)');
    setMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (award: RecognitionAward) => {
    setEditingAward(award);
    setTitle(award.title || '');
    setCategory(award.category || 'Excellence Award');
    setDate(award.date || new Date().toISOString().slice(0, 10));
    setAwardedBy(award.awardedBy || 'Management');
    setReward(award.reward || '');
    setMessage(award.message || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Award title is required');
      return;
    }

    setIsSaving(true);
    onMarkDirty?.();

    try {
      let updatedList: RecognitionAward[] = [...recognitions];

      if (editingAward) {
        updatedList = updatedList.map(item => 
          item.id === editingAward.id
            ? { ...item, title, category, date, awardedBy, reward, message }
            : item
        );
      } else {
        const newAward: RecognitionAward = {
          id: 'rec-' + Date.now(),
          title,
          category,
          date,
          awardedBy,
          reward,
          message
        };
        updatedList.unshift(newAward);
      }

      const updatedPersonalInfo = {
        ...(emp.personal_info || {}),
        recognition_list: updatedList
      };

      await onSaveEmployeeDetails({
        personal_info: updatedPersonalInfo,
        ...({ recognition_list: updatedList } as any)
      });

      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save recognition:', err);
      alert('Error saving recognition.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recognition?')) return;
    setDeletingId(id);
    onMarkDirty?.();

    try {
      const updatedList = recognitions.filter(r => r.id !== id);
      const updatedPersonalInfo = {
        ...(emp.personal_info || {}),
        recognition_list: updatedList
      };

      await onSaveEmployeeDetails({
        personal_info: updatedPersonalInfo,
        ...({ recognition_list: updatedList } as any)
      });
    } catch (err) {
      console.error('Failed to delete recognition:', err);
      alert('Error deleting recognition.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50/50 p-6 rounded-3xl border border-amber-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-200">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              Recognitions & Awards
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {recognitions.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Celebrate employee milestones, spot bonuses, and company honors.
            </p>
          </div>
        </div>

        {!isViewOnly && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Recognition
          </button>
        )}
      </div>

      {/* Recognition Cards Grid */}
      {recognitions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-300">
            <Award className="w-8 h-8" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 mb-1">No Recognitions Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            This employee does not have any recorded awards or formal recognitions yet.
          </p>
          {!isViewOnly && (
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Award First Recognition
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recognitions.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none" />

              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">{rec.title}</h4>
                      <span className="inline-block text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-0.5">
                        {rec.category}
                      </span>
                    </div>
                  </div>

                  {!isViewOnly && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(rec)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Award"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        disabled={deletingId === rec.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Award"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {rec.message && (
                  <p className="text-xs text-slate-600 italic bg-slate-50/80 p-3 rounded-xl border border-slate-100 mb-3">
                    "{rec.message}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{rec.date || '—'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{rec.awardedBy || 'Management'}</span>
                </div>
                {rec.reward && (
                  <div className="flex items-center gap-1.5 col-span-2 text-emerald-700 font-bold bg-emerald-50/60 px-2 py-1 rounded-lg">
                    <Gift className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{rec.reward}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">
                    {editingAward ? 'Edit Recognition / Award' : 'Add Recognition / Award'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Award Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Employee of the Month, Innovation Champion"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1b5e20]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1b5e20] bg-white"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Awarded By</label>
                    <input
                      type="text"
                      placeholder="e.g. Executive Board, Team Lead"
                      value={awardedBy}
                      onChange={(e) => setAwardedBy(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1b5e20]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reward / Bonus</label>
                    <input
                      type="text"
                      list="reward-suggestions"
                      placeholder="e.g. Spot Bonus ($250)"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1b5e20]"
                    />
                    <datalist id="reward-suggestions">
                      {REWARDS.map(r => (
                        <option key={r} value={r} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Recognition Message / Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Brief description or commendation praise..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1b5e20] resize-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-[#1b5e20] hover:bg-green-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingAward ? 'Save Changes' : 'Grant Award'}
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
