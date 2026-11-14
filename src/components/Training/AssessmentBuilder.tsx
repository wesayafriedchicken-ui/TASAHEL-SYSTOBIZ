import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, X, HelpCircle, GraduationCap, 
  CheckCircle, ListOrdered, ClipboardCheck, Info,
  Trophy, Clock, Users, ChevronRight, Layers, Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Question {
  id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'ordering';
  options: string[];
  correct_answer: string;
  explanation: string;
}

interface AssessmentBuilderProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  quizToEdit?: any;
}

export const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({ onSave, onCancel, quizToEdit }) => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: quizToEdit?.title || '',
    description: quizToEdit?.description || '',
    department_id: quizToEdit?.department_id || '',
    passing_score: quizToEdit?.passing_score || 80,
    end_date: quizToEdit?.end_date ? new Date(quizToEdit.end_date).toISOString().split('T')[0] : '',
    questions: (quizToEdit?.questions || []).map((q: any) => ({
      ...q,
      id: q.id?.toString() || Math.random().toString(36).substr(2, 9),
      options: Array.isArray(q.options) ? q.options : (typeof q.options === 'string' ? JSON.parse(q.options) : ['', '', '', ''])
    })) as Question[]
  });

  useEffect(() => {
    fetchDepartments();
    if (formData.questions.length === 0) {
      addQuestion();
    }
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setDepartments(await res.json());
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      explanation: ''
    };
    setFormData(prev => ({ 
      ...prev, 
      questions: [...prev.questions, newQuestion] 
    }));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, ...updates } : q)
    }));
  };

  const removeQuestion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id)
    }));
  };

  const handleSave = async () => {
    if (!formData.title) return alert('Assessment title is required');
    if (formData.questions.length === 0) return alert('Add at least one question');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const quizId = quizToEdit?.id || quizToEdit?.quiz_id;
      const url = quizId ? `/api/training/quizzes/${quizId}` : '/api/training/quizzes';
      const method = quizId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': localStorage.getItem('user_id') || '1'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        onSave(await res.json());
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Save error:", err);
      alert('Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen p-8 rounded-2xl shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-200">
              <ClipboardCheck className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Assessment Builder</h1>
              <p className="text-slate-500 font-medium">Create rigorous testing for your training curricula</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              <X className="w-5 h-5" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Save Assessment'}
            </button>
          </div>
        </div>

        {/* General Info */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Info className="text-violet-600 w-6 h-6" />
            <h2 className="text-lg font-bold text-slate-800">General Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Assessment Title</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="e.g., Q2 Safety & Compliance Audit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none placeholder:text-slate-400"
                rows={3}
                placeholder="Explain the purpose and scope of this assessment..."
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all appearance-none"
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Passing Score (%)</label>
                <div className="relative">
                  <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    value={formData.passing_score}
                    onChange={(e) => setFormData({ ...formData, passing_score: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Deadline</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="date"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question Engine */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="text-violet-600 w-6 h-6" />
              <h2 className="text-xl font-bold text-slate-800">Question Engine</h2>
            </div>
            <button
              onClick={addQuestion}
              className="px-4 py-2 bg-white border border-violet-200 text-violet-600 rounded-xl font-bold hover:bg-violet-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" /> Add Question
            </button>
          </div>

          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {formData.questions.map((q, qIndex) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative group hover:border-violet-300 transition-colors"
                >
                  <div className="absolute -left-3 top-8 w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-violet-200">
                    {qIndex + 1}
                  </div>

                  <div className="flex justify-between items-start mb-6 pt-2 pl-4">
                    <div className="flex gap-2">
                       <button
                         onClick={() => updateQuestion(q.id, { question_type: 'multiple_choice' })}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${q.question_type === 'multiple_choice' ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'}`}
                       >
                         <HelpCircle className="w-3.5 h-3.5" /> MCQ
                       </button>
                       <button
                         onClick={() => updateQuestion(q.id, { question_type: 'true_false', options: ['True', 'False'] })}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${q.question_type === 'true_false' ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'}`}
                       >
                         <CheckCircle className="w-3.5 h-3.5" /> True/False
                       </button>
                       <button
                         onClick={() => updateQuestion(q.id, { question_type: 'ordering' })}
                         className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${q.question_type === 'ordering' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-50 text-slate-500 border border-transparent hover:bg-slate-100'}`}
                       >
                         <ListOrdered className="w-3.5 h-3.5" /> Ordering
                       </button>
                    </div>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Question Text</label>
                      <textarea
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none"
                        rows={2}
                        placeholder="What is the primary protocol for..."
                        value={q.question_text || ''}
                        onChange={(e) => updateQuestion(q.id, { question_text: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                         <label className="block text-sm font-bold text-slate-700 mb-2">Options</label>
                         {q.options.map((option, optIdx) => (
                           <div key={optIdx} className="relative group/opt">
                             <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border-2 ${q.correct_answer === option && option !== '' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                               {String.fromCharCode(65 + optIdx)}
                             </div>
                             <input
                               type="text"
                               className={`w-full pl-12 pr-10 py-3 rounded-xl border transition-all outline-none ${q.correct_answer === option && option !== '' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 focus:border-violet-300'}`}
                               value={option}
                               placeholder={`Option ${optIdx + 1}`}
                               onChange={(e) => {
                                 const next = [...q.options];
                                 next[optIdx] = e.target.value;
                                 updateQuestion(q.id, { options: next });
                               }}
                             />
                             {q.question_type !== 'true_false' && (
                               <button 
                                 onClick={() => {
                                   const next = q.options.filter((_, i) => i !== optIdx);
                                   updateQuestion(q.id, { options: next });
                                 }}
                                 className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover/opt:opacity-100 text-slate-300 hover:text-rose-500 p-1"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                         ))}
                         {q.question_type !== 'true_false' && q.options.length < 6 && (
                           <button
                             onClick={() => updateQuestion(q.id, { options: [...q.options, ''] })}
                             className="text-violet-600 text-sm font-bold flex items-center gap-1 hover:underline ml-1"
                           >
                             <Plus className="w-4 h-4" /> Add Option
                           </button>
                         )}
                       </div>

                       <div className="space-y-6">
                         <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Correct Answer</label>
                           <select
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all appearance-none bg-slate-50 font-medium"
                              value={q.correct_answer}
                              onChange={(e) => updateQuestion(q.id, { correct_answer: e.target.value })}
                           >
                             <option value="">Select Correct Answer</option>
                             {q.options.filter(o => o !== '').map((o, idx) => (
                               <option key={idx} value={o}>Option {String.fromCharCode(65 + idx)}: {o}</option>
                             ))}
                           </select>
                         </div>

                         <div>
                           <label className="block text-sm font-bold text-slate-700 mb-2">Explanation (Optional)</label>
                           <textarea
                             className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none italic placeholder:text-slate-400"
                             rows={2}
                             placeholder="Why is this the correct answer?"
                             value={q.explanation || ''}
                             onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                           />
                         </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pb-8">
            <button
              onClick={onCancel}
              className="px-8 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all"
            >
              Discard Changes
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-10 py-3 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 shadow-xl shadow-violet-200 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Save className="w-5 h-5" /> {loading ? 'Saving...' : 'Finalize & Publish Assessment'}
            </button>
        </div>
      </div>
    </div>
  );
};
