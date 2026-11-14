import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, BookOpen, Sliders, ChevronDown, Check, Edit2, Trash2, Plus, Calendar, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicLayoutSection } from './DynamicLayoutSection';

interface EmployeeTrainingTabProps {
  emp: any;
  currentUser: any;
  isViewOnly?: boolean;
  onMarkDirty?: () => void;
}

export const EmployeeTrainingTab: React.FC<EmployeeTrainingTabProps> = ({ 
  emp, 
  currentUser,
  isViewOnly = false,
  onMarkDirty
}) => {
  const [myLearnings, setMyLearnings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [layoutTrigger, setLayoutTrigger] = useState(0);

  const handleLayoutRefresh = () => {
    setLayoutTrigger(prev => prev + 1);
  };
  const [sortFilter, setSortFilter] = useState<string>('Most Recent');
  const [yearFilter, setYearFilter] = useState<string>('2025');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [selectedEnrollmentToEdit, setSelectedEnrollmentToEdit] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Upcoming Training',
    status: 'Completed',
    date: new Date().toISOString().split('T')[0],
    score: '',
    cost: '0'
  });

  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchLearnings = async () => {
    setLoading(true);
    try {
      const userId = emp.user_id || emp.id;
      const res = await fetch(`/api/training/my-learning?user_id=${userId}&department_id=${emp.department_id || ''}`);
      if (res.ok) {
        const data = await res.json();
        setMyLearnings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching training records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearnings();
  }, [emp.id, emp.user_id]);

  const handleToggleComplete = async (course: any) => {
    try {
      setLoading(true);
      if (onMarkDirty) onMarkDirty();
      const res = await fetch('/api/training/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: emp.user_id || emp.id,
          course_id: course.course_id,
          status: 'Completed',
          completed_at: new Date().toISOString().split('T')[0],
          cost: 15,
          score: 100
        })
      });
      if (res.ok) {
        fetchLearnings();
      }
    } catch (err) {
      console.error("Error marking course completed:", err);
      setLoading(false);
    }
  };

  const handleOpenRecordModal = (enrollment: any | null = null) => {
    if (enrollment) {
      setSelectedEnrollmentToEdit(enrollment);
      setFormData({
        title: enrollment.title || '',
        category: enrollment.category || 'Upcoming Training',
        status: enrollment.status || 'Completed',
        date: enrollment.completed_at ? new Date(enrollment.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        score: enrollment.score !== null ? enrollment.score.toString() : '',
        cost: enrollment.cost !== null ? enrollment.cost.toString() : '0'
      });
    } else {
      setSelectedEnrollmentToEdit(null);
      setFormData({
        title: '',
        category: 'Upcoming Training',
        status: 'Completed',
        date: new Date().toISOString().split('T')[0],
        score: '',
        cost: '0'
      });
    }
    setIsRecordModalOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    try {
      const userId = emp.user_id || emp.id;
      
      let url = '/api/training/record';
      let method = 'POST';
      let body: any = {
        user_id: userId,
        course_title: formData.title,
        category: formData.category,
        status: formData.status,
        score: formData.score ? parseInt(formData.score) : null,
        cost: formData.cost ? parseInt(formData.cost) : 0,
        completed_at: formData.status === 'Completed' ? formData.date : null,
        end_date: formData.status !== 'Completed' ? formData.date : null
      };

      if (selectedEnrollmentToEdit) {
        url = `/api/training/enrollments/${selectedEnrollmentToEdit.enrollment_id}`;
        method = 'PUT';
        body = {
          status: formData.status,
          score: formData.score ? parseInt(formData.score) : null,
          cost: formData.cost ? parseInt(formData.cost) : 0,
          completed_at: formData.status === 'Completed' ? formData.date : null
        };
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        if (onMarkDirty) onMarkDirty();
        setIsRecordModalOpen(false);
        fetchLearnings();
      } else {
        alert("Failed to save record.");
      }
    } catch (err) {
      console.error("Error saving training record:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: number) => {
    if (!confirm("Are you sure you want to delete this training record?")) return;
    
    try {
      setLoading(true);
      if (onMarkDirty) onMarkDirty();
      const res = await fetch(`/api/training/enrollments/${enrollmentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchLearnings();
      } else {
        alert("Failed to delete record.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeTrainings = myLearnings.filter(item => item.status !== 'Completed');
  const completedTrainingsRaw = myLearnings.filter(item => item.status === 'Completed');

  const categories = ['Upcoming Training', 'BambooHR Product Training', 'COVID-19'];
  const groupedActive: { [key: string]: any[] } = {};
  
  categories.forEach(cat => {
    groupedActive[cat] = activeTrainings.filter(item => item.category === cat);
  });

  const otherActive = activeTrainings.filter(item => !categories.includes(item.category || ''));
  if (otherActive.length > 0) {
    groupedActive['Other Active Training'] = otherActive;
  }

  const completedTrainingsFiltered = completedTrainingsRaw.filter(item => {
    if (yearFilter === 'All Years') return true;
    if (!item.completed_at) return false;
    const year = new Date(item.completed_at).getFullYear().toString();
    return year === yearFilter;
  });

  const sortedCompleted = [...completedTrainingsFiltered].sort((a, b) => {
    if (sortFilter === 'Most Recent') {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return dateB - dateA;
    } else if (sortFilter === 'Oldest') {
      const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return dateA - dateB;
    } else {
      return (a.title || '').localeCompare(b.title || '');
    }
  });

  const completedCount = sortedCompleted.length;
  const totalCost = sortedCompleted.reduce((sum, item) => sum + (item.cost || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white px-6 py-4 rounded-3xl border border-slate-200/80 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1b5e20]/10 flex items-center justify-center text-[#1b5e20]">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[#1b5e20] leading-none">Training</h2>
          </div>
        </div>
      </div>

      {loading && myLearnings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/85 p-16 text-center shadow-sm space-y-4">
          <Loader2 className="w-10 h-10 text-[#1b5e20] animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold">Loading training files...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm space-y-6">
            {Object.keys(groupedActive).map((categoryName) => {
              const list = groupedActive[categoryName];
              if (list.length === 0) return null;
              
              return (
                <div key={categoryName} className="space-y-3">
                  <h3 className="text-sm font-black text-[#1b5e20] tracking-wide uppercase">{categoryName}</h3>
                  <div className="space-y-2 border-t border-slate-100 pt-2">
                    {list.map((item) => {
                      const formattedDate = formatDate(item.end_date);
                      return (
                        <div key={item.course_id} className="flex items-center justify-between py-1.5 px-1 hover:bg-slate-50/50 rounded-lg group transition-all">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleToggleComplete(item)}
                              className="w-5 h-5 rounded border border-slate-300 hover:border-[#1b5e20] flex items-center justify-center transition-all cursor-pointer bg-white"
                              title="Mark as completed"
                            >
                              <span className="w-2.5 h-2.5 rounded-sm bg-[#1b5e20] scale-0 hover:scale-100 transition-all opacity-0 hover:opacity-100" />
                            </button>
                            <div className="flex items-baseline flex-wrap">
                              <span className="text-[#1565c0] font-black text-sm hover:underline cursor-pointer">
                                {item.title}
                              </span>
                              <span className="text-[11px] font-bold ml-2">
                                {formattedDate ? (
                                  <span className="text-orange-600">Due {formattedDate}</span>
                                ) : (
                                  <span className="text-slate-400">No due date</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {activeTrainings.length === 0 && (
              <div className="text-center py-4 text-xs font-bold text-slate-400">No upcoming training.</div>
            )}
          </div>

          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2">
              <h3 className="text-sm font-black text-[#1b5e20] tracking-wide uppercase">Completed Training</h3>
              
              <div className="flex items-center gap-3 flex-wrap">
                {!isViewOnly && (
                  <button 
                    onClick={() => handleOpenRecordModal(null)}
                    className="flex items-center gap-1 text-[#1565c0] hover:text-[#0d47a1] text-xs font-black transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 bg-[#1565c0]/10 text-[#1565c0] rounded-full p-0.5" />
                    Record a Training
                  </button>
                )}

                <select 
                  value={sortFilter} 
                  onChange={(e) => setSortFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1b5e20]"
                >
                  <option value="Most Recent">Most Recent</option>
                  <option value="Oldest">Oldest</option>
                  <option value="Alphabetical">Alphabetical</option>
                </select>

                <select 
                  value={yearFilter} 
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1b5e20]"
                >
                  <option value="All Years">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                </select>
              </div>
            </div>

            <div className="space-y-1 divide-y divide-slate-100">
              {sortedCompleted.map((item) => (
                <div key={item.enrollment_id || item.course_id} className="flex items-center justify-between py-3 hover:bg-slate-50/50 rounded-lg px-2 group transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-slate-200/70 border border-slate-300 flex items-center justify-center text-slate-600">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-baseline flex-wrap">
                      <span className="text-[#1565c0] font-black text-sm hover:underline cursor-pointer">
                        {item.title}
                      </span>
                      <span className="text-slate-400 text-xs font-bold ml-2">
                        Completed {formatDate(item.completed_at) || formatDate(item.enrolled_at) || 'Completed'}
                      </span>
                    </div>
                  </div>

                  {!isViewOnly && (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenRecordModal(item)}
                        className="p-1 text-slate-400 hover:text-[#1565c0] hover:bg-blue-50 rounded transition-all"
                        title="Edit training record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEnrollment(item.enrollment_id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                        title="Delete training record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {completedCount === 0 && (
                <div className="text-center py-6 text-xs font-bold text-slate-400">No completed training for this filter.</div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-slate-500 font-sans font-bold text-xs">
              <div>
                {completedCount} Trainings Completed · Cost: ${totalCost}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm space-y-6">
            <DynamicLayoutSection 
              tab="training" 
              section="Training Milestones" 
              employeeId={emp.id} 
              key={`tm-${layoutTrigger}`}
            />
          </div>

          <div className="bg-white rounded-[24px] border border-slate-200/80 p-6 shadow-sm space-y-6">
            <DynamicLayoutSection 
              tab="training" 
              section="Certificates" 
              employeeId={emp.id} 
              key={`cert-${layoutTrigger}`}
            />
          </div>
        </>
      )}

      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-[#1b5e20]/5">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#1b5e20]" />
                  {selectedEnrollmentToEdit ? 'Edit Training Record' : 'Record a Training'}
                </h3>
                <button 
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200/60 rounded-full transition-all text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRecord} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Training Title</label>
                  <input 
                    type="text" 
                    required
                    disabled={!!selectedEnrollmentToEdit}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-4 py-2.5 transition-all outline-none text-slate-800 disabled:opacity-60"
                    placeholder="e.g. CPR, Harassment Training"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Category</label>
                    <select
                      disabled={!!selectedEnrollmentToEdit}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-3 py-2.5 transition-all outline-none text-slate-800"
                    >
                      <option value="Upcoming Training">Upcoming Training</option>
                      <option value="BambooHR Product Training">BambooHR Product Training</option>
                      <option value="COVID-19">COVID-19</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-3 py-2.5 transition-all outline-none text-slate-800"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Failed">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">
                      {formData.status === 'Completed' ? 'Completed Date' : 'Due Date'}
                    </label>
                    <input 
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-3 py-2.5 transition-all outline-none text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Cost ($)</label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-3 py-2.5 transition-all outline-none text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Score (%)</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                    className="w-full text-sm font-bold bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-[#1b5e20] focus:bg-white rounded-xl px-3 py-2.5 transition-all outline-none text-slate-800"
                    placeholder="e.g. 100"
                  />
                </div>

                <div className="pt-3 flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-5 py-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-black text-white bg-[#1b5e20] hover:bg-[#123e15] rounded-xl transition-all flex items-center gap-1"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
