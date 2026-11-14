import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Employee } from '../../../../types';

interface FileComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currentUser: any;
  onSuccess?: () => void;
  showCustomToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const FileComplaintModal: React.FC<FileComplaintModalProps> = ({
  isOpen,
  onClose,
  employee,
  currentUser,
  onSuccess,
  showCustomToast,
}) => {
  const navigate = useNavigate();
  const [complaintFormData, setComplaintFormData] = useState({
    title: '',
    category: 'Workplace',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintFormData.title || !complaintFormData.description) {
      showCustomToast('Please fill out all fields', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/hr/complaints', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id?.toString() || '1'
        },
        body: JSON.stringify({
          user_id: employee?.user_id || employee?.id || currentUser?.id,
          title: complaintFormData.title,
          category: complaintFormData.category,
          description: complaintFormData.description
        })
      });
      if (res.ok) {
        const created = await res.json().catch(() => null);
        onClose();
        setComplaintFormData({ title: '', category: 'Workplace', description: '' });
        showCustomToast('Complaint submitted successfully! It is now being reviewed by HR.', 'success');
        if (onSuccess) onSuccess();
        if (created?.id) {
          navigate(`/hr/complaints/${created.id}`);
        }
      } else {
        showCustomToast('Failed to submit complaint', 'error');
      }
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      showCustomToast('Server error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-200"
      >
        <div className="p-8 bg-rose-600 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/10 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Submit a Complaint</h2>
            </div>
            <p className="text-rose-100 text-sm">Your complaint will be treated with absolute confidentiality by the HR team.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmitComplaint} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Complaint Title
              </label>
              <input 
                type="text"
                placeholder="e.g. Workplace temperature, missing tool..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                value={complaintFormData.title}
                onChange={e => setComplaintFormData({ ...complaintFormData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Category
              </label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                value={complaintFormData.category}
                onChange={e => setComplaintFormData({ ...complaintFormData, category: e.target.value })}
                required
              >
                <option value="Workplace">Workplace Environment</option>
                <option value="Salary">Salary & Compensation</option>
                <option value="Harassment">Harassment or Misconduct</option>
                <option value="Tooling">Equipment & Systems</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                Complaint Details
              </label>
              <textarea 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none min-h-[120px] resize-none focus:ring-2 focus:ring-rose-500"
                placeholder="Provide details about the issue..."
                value={complaintFormData.description}
                onChange={e => setComplaintFormData({ ...complaintFormData, description: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
