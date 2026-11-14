import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, BookOpen, List, Video, FileText, HelpCircle, 
  ChevronRight, ChevronLeft, CheckCircle, X, ClipboardCheck, Users, 
  Settings, Layers, Target, Coins, Trophy, Clock, Search, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentBuilder } from './AssessmentBuilder';
import DeleteConfirmation from '../Common/DeleteConfirmation';

interface CourseBuilderProps {
  onCourseCreated: () => void;
  onCancel?: () => void;
  courseToEdit?: any;
}

interface FormState {
  sop_id: number | null;
  title: string;
  description: string;
  department_id: number | null;
  passing_score: number;
  points_reward: number;
  modules: any[];
  target_user_ids: number[];
  start_date: string;
  end_date: string;
  notes: string;
}

export const CourseBuilder: React.FC<CourseBuilderProps> = ({ onCourseCreated, onCancel, courseToEdit }) => {
  const [step, setStep] = useState(courseToEdit ? 2 : 1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [activeModuleForQuiz, setActiveModuleForQuiz] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  
  // Master data
  const [sops, setSops] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Content Reusability states
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [showImportModuleModal, setShowImportModuleModal] = useState(false);
  const [selectedImportCourseId, setSelectedImportCourseId] = useState<number | ''>('');
  const [importCourseModules, setImportCourseModules] = useState<any[]>([]);
  const [showImportLessonModal, setShowImportLessonModal] = useState<number | null>(null); // module index

  // Unified Form State (Requirement: Single Object State)
  const [formData, setFormData] = useState<FormState>({
    sop_id: courseToEdit?.sop_id || null,
    title: courseToEdit?.title || '',
    description: courseToEdit?.description || '',
    department_id: courseToEdit?.department_id || null,
    passing_score: courseToEdit?.passing_score || 80,
    points_reward: courseToEdit?.points_reward || 100,
    modules: courseToEdit?.modules || [],
    target_user_ids: courseToEdit?.target_user_ids || [],
    start_date: courseToEdit?.start_date ? new Date(courseToEdit.start_date).toISOString().split('T')[0] : '',
    end_date: courseToEdit?.end_date ? new Date(courseToEdit.end_date).toISOString().split('T')[0] : '',
    notes: courseToEdit?.notes || ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedImportCourseId) {
      const fetchCourseDetails = async () => {
        try {
          const res = await fetch(`/api/training/courses/${selectedImportCourseId}`);
          if (res.ok) {
            const data = await res.json();
            setImportCourseModules(data.modules || []);
          }
        } catch (err) {
          console.error("Error fetching import course details:", err);
        }
      };
      fetchCourseDetails();
    } else {
      setImportCourseModules([]);
    }
  }, [selectedImportCourseId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [sopsRes, deptsRes, usersRes, coursesRes] = await Promise.all([
        fetch('/api/sops', { headers }),
        fetch('/api/departments', { headers }),
        fetch('/api/users', { headers }),
        fetch('/api/training/courses', { headers })
      ]);

      if (sopsRes.ok) setSops(await sopsRes.json());
      if (deptsRes.ok) setDepartments(await deptsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (coursesRes.ok) setAvailableCourses(await coursesRes.json());
    } catch (err) {
      console.error("Failed to fetch initial data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSopSelect = async (sop: any) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sops/${sop.id}`);
      const data = await res.json();
      
      const autoModules = (data.steps || []).map((step: any, index: number) => ({
        id: Date.now() + index,
        title: step.step_title || `Module ${step.step_number}`,
        order_index: index,
        lessons: [
          {
            id: Date.now() + index + 100,
            title: 'Standard Procedure',
            content_type: 'document',
            content_body: step.step_description,
            order_index: 0
          }
        ],
        quiz: {
          title: 'Review Quiz',
          questions: [
            {
              id: Date.now() + index + 200,
              question_text: `What is the main goal of ${step.step_title || 'this step'}?`,
              question_type: 'multiple_choice',
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correct_answer: 'Option A'
            }
          ]
        }
      }));

      setFormData(prev => ({
        ...prev,
        sop_id: sop.id,
        title: `${sop.title} Training`,
        description: `Comprehensive training based on SOP: ${sop.title}`,
        department_id: sop.department_id,
        modules: autoModules
      }));
      setStep(2);
    } catch (err) {
      console.error("SOP auto-fill failed", err);
    } finally {
      setLoading(false);
    }
  };

  const addModule = () => {
    const newMod = {
      id: Date.now(),
      title: 'New Module',
      order_index: formData.modules.length,
      lessons: [],
      quiz: { title: 'Quick Quiz', questions: [] }
    };
    setFormData(prev => ({ ...prev, modules: [...prev.modules, newMod] }));
  };

  const addLesson = (mIdx: number) => {
    const newLesson = {
      id: Date.now(),
      title: 'New Lesson',
      content_type: 'document',
      content_body: '',
      order_index: formData.modules[mIdx].lessons.length
    };
    const updatedModules = [...formData.modules];
    updatedModules[mIdx].lessons.push(newLesson);
    setFormData(prev => ({ ...prev, modules: updatedModules }));
  };

  const handleImportModule = (modToImport: any) => {
    const clonedMod = {
      id: Date.now(),
      title: modToImport.title,
      order_index: formData.modules.length,
      lessons: (modToImport.lessons || []).map((l: any, idx: number) => ({
        id: Date.now() + idx + 1000,
        title: l.title,
        content_type: l.content_type || 'document',
        content_url: l.content_url || '',
        content_body: l.content_body || '',
        order_index: idx
      })),
      quiz: modToImport.quiz ? {
        title: modToImport.quiz.title,
        questions: (modToImport.quiz.questions || []).map((q: any) => ({
          question_text: q.question_text,
          question_type: q.question_type,
          correct_answer: q.correct_answer,
          options: q.options
        }))
      } : { title: 'Quick Quiz', questions: [] }
    };
    setFormData(prev => ({ ...prev, modules: [...prev.modules, clonedMod] }));
    setShowImportModuleModal(false);
    setSelectedImportCourseId('');
  };

  const handleImportLesson = (lessonToImport: any, mIdx: number) => {
    const clonedLesson = {
      id: Date.now(),
      title: lessonToImport.title,
      content_type: lessonToImport.content_type || 'document',
      content_url: lessonToImport.content_url || '',
      content_body: lessonToImport.content_body || '',
      order_index: formData.modules[mIdx].lessons.length
    };
    const updatedModules = [...formData.modules];
    updatedModules[mIdx].lessons.push(clonedLesson);
    setFormData(prev => ({ ...prev, modules: updatedModules }));
    setShowImportLessonModal(null);
    setSelectedImportCourseId('');
  };

  const handleSave = async () => {
    if (!formData.title) return alert("Course title is required");
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const url = courseToEdit?.id 
        ? `/api/training/courses/${courseToEdit.id}` 
        : '/api/training/courses';
      
      const res = await fetch(url, {
        method: courseToEdit?.id ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onCourseCreated();
      } else {
        throw new Error("Failed to save course");
      }
    } catch (err) {
      console.error("Save error", err);
      alert("Error saving course");
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 1, title: 'Source', icon: ClipboardCheck, desc: 'Strategy' },
    { id: 2, title: 'Settings', icon: Settings, desc: 'Identity' },
    { id: 3, title: 'Curriculum', icon: Layers, desc: 'Content' },
    { id: 4, title: 'Target', icon: Target, desc: 'Audience' },
  ];

  const filteredSops = sops.filter(s => 
    (s.title || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col h-[88vh] md:h-[84vh] overflow-hidden" dir="ltr">
      {/* Dynamic Header */}
      <div className="bg-slate-50/50 border-b border-slate-200 p-4 pb-3">
        <div className="flex justify-between items-center mb-3">
          <div className="text-left">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Course Builder
            </h2>
            <p className="text-slate-400 text-[10px] mt-0.5 font-bold uppercase tracking-widest">Design & deploy high-impact training</p>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-all hover:rotate-90">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Wizard Progress Stepper */}
        <div className="flex items-center justify-between max-w-4xl mx-auto relative px-4">
          <div className="absolute top-[14px] left-0 w-full h-[3px] bg-slate-100 -translate-y-1/2 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
               initial={false}
               animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
               transition={{ type: 'spring', stiffness: 50, damping: 20 }}
             />
          </div>

          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = step >= s.id;
            const isCurrent = step === s.id;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => step > s.id && setStep(s.id)}>
                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isActive ? '#2563eb' : '#fff',
                    borderColor: isActive ? '#2563eb' : '#e2e8f0',
                    color: isActive ? '#fff' : '#cbd5e1'
                  }}
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center shadow-sm transition-all duration-500 font-bold`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.div>
                <div className="mt-1 text-center">
                  <span className={`block text-[8px] font-black uppercase tracking-[0.1em] leading-none mb-0.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    {s.title}
                  </span>
                  <span className={`block text-[7px] font-bold uppercase tracking-widest leading-none ${isCurrent ? 'text-slate-900' : 'text-slate-300'}`}>
                    {s.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
               key="step1"
               initial={{ opacity: 0, y: 40 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -40 }}
               className="space-y-6 max-w-6xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
                <div className="text-left">
                  <h3 className="text-xl font-bold text-slate-800">Choose Resource Base</h3>
                  <p className="text-slate-500 text-xs mt-1">Connect to existing SOPs to auto-generate content structure</p>
                </div>
                <div className="relative group w-full sm:w-auto">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Filter SOP repository..." 
                    className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-xs font-bold w-full sm:w-72 text-left shadow-sm outline-none transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.button
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setFormData(prev => ({ ...prev, sop_id: null }));
                    setStep(2);
                  }}
                  className="p-6 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/20 transition-all text-slate-300 hover:text-blue-600 group min-h-[260px]"
                >
                  <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 group-hover:rotate-6 transition-all duration-500">
                    <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div className="text-center">
                    <span className="font-extrabold text-lg text-slate-800 block mb-1">Blank Canvas</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-80">Manual curriculum design</span>
                  </div>
                </motion.button>

                {filteredSops.map((sop, i) => (
                  <motion.div
                    key={sop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                    whileHover={{ y: -6, scale: 1.01, boxShadow: '0 20px 30px -10px rgba(0,0,0,0.05)' }}
                    className="group bg-white border border-slate-200 p-6 rounded-2xl relative overflow-hidden transition-all cursor-pointer hover:border-blue-200 shadow-sm min-h-[260px]"
                    onClick={() => handleSopSelect(sop)}
                  >
                    <div className="absolute top-0 left-0 w-24 h-24 bg-blue-50 rounded-br-2xl -ml-8 -mt-8 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-700 pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                      <div className="w-12 h-12 bg-white shadow-md rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                        <FileText className="w-6 h-6 text-slate-600 group-hover:text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-extrabold text-slate-900 text-lg leading-snug line-clamp-2">{sop.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                           <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                             {sop.department_name}
                           </span>
                           <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                             v{sop.version_number}
                           </span>
                        </div>
                      </div>
                      <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed text-left min-h-[3rem]">
                        Automatically generate learning modules, lessons, and compliance quizzes derived directly from standard procedure steps.
                      </p>
                      <div className="pt-3 border-t border-slate-50 flex items-center justify-start text-blue-600 font-extrabold text-[10px] gap-2 group-hover:gap-3 transition-all uppercase tracking-widest">
                         <span>Map Curriculum</span> 
                         <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-2 justify-start border-b border-slate-50 pb-4">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Identity Core</h4>
                       <div className="w-6 h-0.5 bg-blue-600 rounded-full" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-800 pl-1 block">Instructional Title</label>
                        <input 
                          type="text" 
                          value={formData.title}
                          onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/10 text-lg font-extrabold text-slate-900 text-left outline-none transition-all placeholder:text-slate-300"
                          placeholder="e.g. Operational Security Excellence"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-800 pl-1 block">Course Narrative & Objectives</label>
                        <textarea 
                          rows={4}
                          value={formData.description || ''}
                          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 focus:ring-2 focus:ring-blue-500/10 text-xs font-medium text-slate-600 leading-relaxed text-left outline-none transition-all"
                          placeholder="Describe the transformative journey of this course..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-blue-600/10 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-1000" />
                    
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md rotate-3">
                        <Trophy className="w-5 h-5" />
                      </div>
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Gamification Engine</h4>
                    </div>
                    
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-3">
                         <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 px-1 tracking-widest">
                           <span>KPI Threshold</span>
                           <span className="text-white bg-blue-600 px-2 py-0.5 rounded-md text-[10px]">{formData.passing_score}%</span>
                         </div>
                         <div className="relative h-[4px] bg-slate-800 rounded-full">
                           <motion.div 
                             className="absolute left-0 top-0 h-full bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.8)] rounded-full"
                             initial={false}
                             animate={{ width: `${formData.passing_score}%` }}
                           />
                           <input 
                             type="range" 
                             min="1" 
                             max="100" 
                             value={formData.passing_score}
                             onChange={e => setFormData(prev => ({ ...prev, passing_score: parseInt(e.target.value) }))}
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                           />
                         </div>
                         <p className="text-[8px] text-slate-500 italic text-center font-bold tracking-tight">Minimum graduation requirement</p>
                      </div>

                      <div className="space-y-2">
                         <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400 px-1 tracking-widest">
                           <span>Reward Capital</span>
                           <span className="text-yellow-400 flex items-center gap-1.5 font-bold text-sm"><Coins className="w-3.5 h-3.5" /> {formData.points_reward}</span>
                         </div>
                         <input 
                           type="number" 
                           value={formData.points_reward}
                           onChange={e => setFormData(prev => ({ ...prev, points_reward: parseInt(e.target.value) }))}
                           className="w-full bg-slate-800 border border-slate-700/50 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500/20 text-lg font-black text-yellow-500 text-center outline-none transition-all shadow-inner"
                         />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                     <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Lifecycle Configuration</h4>
                     <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-700 mr-2 uppercase tracking-widest block text-left">Deployment Date</label>
                          <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:border-blue-300 transition-colors">
                            <Clock className="w-4 h-4 text-slate-300" />
                            <input 
                              type="date"
                              value={formData.start_date}
                              onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                              className="bg-transparent border-none text-xs font-bold outline-none flex-1 text-left p-0"
                            />
                          </div>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-6xl mx-auto space-y-6"
            >
               <div className="flex justify-between items-center bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100">
                <div className="text-left">
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight">Timeline Architecture</h3>
                   <p className="text-slate-500 mt-1 text-xs font-medium">Engineer your lesson flow and adaptive learning routes</p>
                </div>
                <div className="flex gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowImportModuleModal(true)}
                    className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-2xl font-black hover:bg-slate-200 flex items-center gap-2 transition-all text-xs"
                  >
                    <BookOpen className="w-4 h-4 text-slate-500" /> Use Existing Module
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addModule}
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black hover:bg-blue-700 flex items-center gap-2 shadow-md shadow-blue-500/10 transition-all text-xs"
                  >
                    <Plus className="w-4 h-4" /> Add Module
                  </motion.button>
                </div>
              </div>

              <div className="relative pt-4 pl-12 space-y-10 pb-10">
                {/* Visual Timeline Backbone */}
                <div className="absolute top-0 left-5 bottom-0 w-1 bg-slate-100 rounded-full" />

                {formData.modules.map((mod, mIdx) => (
                  <motion.div 
                    key={mod.id}
                    layout
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', delay: mIdx * 0.1 }}
                    className="relative"
                  >
                    {/* Node Pin */}
                    <div className="absolute left-[-2.25rem] top-1 w-8 h-8 bg-white border-[3px] border-blue-600 rounded-full shadow-md flex items-center justify-center text-blue-600 font-bold text-xs z-10 hover:scale-110 transition-transform">
                      {mIdx + 1}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200/20 transition-all group/container">
                       <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-50 pb-4">
                         <div className="flex-1 space-y-3 w-full text-left">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1 leading-none">Modular Subject</span>
                            <input 
                              type="text" 
                              value={mod.title}
                              onChange={e => {
                                const newMods = [...formData.modules];
                                newMods[mIdx].title = e.target.value;
                                setFormData(p => ({ ...p, modules: newMods }));
                              }}
                              className="text-lg font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-1 w-full text-left outline-none placeholder:text-slate-100"
                              placeholder="Module thematic name..."
                            />
                         </div>
                         <button 
                           onClick={() => setShowDeleteConfirm(mIdx)}
                           className="p-2 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all group-hover/container:text-slate-400"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center gap-4 justify-start px-4">
                             <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Core Assets</h5>
                             <div className="h-px w-full bg-slate-100" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mod.lessons.map((lesson: any, lIdx: number) => (
                              <motion.div 
                                key={lesson.id} 
                                layout
                                className="bg-slate-50 p-4 rounded-xl border border-slate-200 transition-all hover:bg-white hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 group/lesson"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md group-hover/lesson:bg-blue-600 group-hover/lesson:text-white transition-all duration-500">
                                    <FileText className="w-5 h-5 text-slate-600 group-hover/lesson:text-white" />
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newMods = [...formData.modules];
                                      newMods[mIdx].lessons = newMods[mIdx].lessons.filter((_: any, i: number) => i !== lIdx);
                                      setFormData(p => ({ ...p, modules: newMods }));
                                    }}
                                    className="p-3 text-slate-300 hover:text-rose-600 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <input 
                                  value={lesson.title}
                                  onChange={e => {
                                    const newMods = [...formData.modules];
                                    newMods[mIdx].lessons[lIdx].title = e.target.value;
                                    setFormData(p => ({ ...p, modules: newMods }));
                                  }}
                                  className="font-bold text-slate-900 text-sm bg-transparent border-none focus:ring-0 p-1 w-full text-left outline-none placeholder:text-slate-200 mb-1"
                                  placeholder="Asset Title"
                                />
                                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                   <div className="w-2 h-2 rounded-full bg-blue-500" />
                                   <span className="uppercase text-[8px] font-bold text-slate-400 tracking-widest">{lesson.content_type} Delivery</span>
                                </div>
                              </motion.div>
                            ))}
                            <div className="flex flex-col gap-2 justify-center min-h-[140px] w-full">
                              <button 
                                onClick={() => addLesson(mIdx)}
                                className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/5 transition-all group/add w-full"
                              >
                                <Plus className="w-4 h-4 text-slate-400 group-hover/add:text-blue-600 group-hover/add:rotate-90 transition-all duration-300" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Append New Asset</span>
                              </button>
                              
                              <button 
                                onClick={() => setShowImportLessonModal(mIdx)}
                                className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/5 transition-all group/add w-full"
                              >
                                <BookOpen className="w-4 h-4 text-slate-400 group-hover/add:text-emerald-600" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Use Existing Lesson</span>
                              </button>
                            </div>
                          </div>
                       </div>

                        {mod.quiz ? (
                          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 flex flex-col lg:flex-row items-center justify-between gap-4 group/quiz transition-all hover:bg-emerald-50">
                             <div className="flex items-center gap-4 text-left bg-white p-3 rounded-xl flex-1 w-full border border-emerald-100 shadow-sm">
                               <div className="w-11 h-11 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                                 <HelpCircle className="w-5 h-5" />
                               </div>
                               <div className="flex-1">
                                  <h6 className="font-bold text-sm text-emerald-900 leading-tight">{mod.quiz.title}</h6>
                                  <div className="flex items-center gap-3 mt-2 justify-start">
                                     <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest">{(mod.quiz.questions || []).length} Active Challenges</p>
                                     <div className="h-1 flex-1 bg-emerald-100 rounded-full" />
                                  </div>
                               </div>
                             </div>
                             <button 
                               onClick={() => {
                                 setActiveModuleForQuiz(mIdx);
                                 setShowAssessmentModal(true);
                               }}
                               className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:scale-102 active:scale-98 transition-all text-xs flex items-center gap-2 group/btn"
                             >
                                Configure Assessment
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                             </button>
                          </div>
                        ) : (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-4">
                             <div className="flex items-center gap-4 text-left">
                               <div className="w-11 h-11 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center">
                                 <HelpCircle className="w-5 h-5" />
                               </div>
                               <div>
                                 <h6 className="font-bold text-sm text-slate-500">No Assessment</h6>
                                 <p className="text-xs text-slate-400 font-bold mt-1">Verify knowledge for this module</p>
                               </div>
                             </div>
                             <button 
                               onClick={() => {
                                 const newModules = [...formData.modules];
                                 newModules[mIdx].quiz = { title: `${mod.title} Quiz`, questions: [] };
                                 setFormData({ ...formData, modules: newModules });
                                 setActiveModuleForQuiz(mIdx);
                                 setShowAssessmentModal(true);
                               }}
                               className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md hover:scale-102 active:scale-98 transition-all text-xs flex items-center gap-2"
                             >
                                <Plus className="w-5 h-5" /> Add Assessment
                             </button>
                          </div>
                        )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-6xl mx-auto space-y-6"
            >
               <div className="bg-slate-900 p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-[0_30px_60px_-10px_rgba(15,23,42,0.5)]">
                 <div className="absolute top-[-20%] right-[-10%] w-[25rem] h-[25rem] bg-blue-600/10 rounded-full blur-[50px] pointer-events-none" />
                 <Users className="absolute bottom-[-10%] left-[-15%] w-[20rem] h-[20rem] text-white/5 rotate-12 pointer-events-none" />
                 
                 <div className="relative z-10 space-y-6">
                     <div className="text-left max-w-2xl">
                      <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">Deployment Strategy</h3>
                      <p className="text-slate-400 mt-2 text-sm leading-relaxed">Assign training program to departments or individuals.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       <div className="space-y-4">
                         <div className="flex items-center gap-5 justify-start px-4">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Authority Clusters</h4>
                            <div className="h-[2px] flex-1 bg-slate-800" />
                         </div>
                         <div className="grid grid-cols-1 gap-4">
                           {departments.map(d => {
                             const isSelected = formData.department_id === d.id;
                             return (
                               <motion.button 
                                 key={d.id}
                                 whileHover={{ x: 15 }}
                                 onClick={() => setFormData(p => ({ ...p, department_id: d.id }))}
                                 className={`p-7 rounded-[2.5rem] border text-left transition-all flex items-center justify-between group h-24 relative overflow-hidden ${isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-3xl shadow-blue-500/20' : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-500'}`}
                               >
                                 <span className="font-bold text-lg tracking-tight relative z-10">{d.name}</span>
                                 {isSelected ? <CheckCircle className="w-5 h-5 text-white" /> : <div className="w-5 h-5 rounded-lg border-2 border-slate-700 group-hover:border-slate-500 transition-colors" />}
                                 {isSelected && <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-br-[3rem] -mt-12 -ml-12" />}
                               </motion.button>
                             )
                           })}
                         </div>
                       </div>

                       <div className="space-y-4">
                         <div className="flex items-center gap-5 justify-start px-4">
                            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] leading-none">Individual Slots</h4>
                            <div className="h-[2px] flex-1 bg-slate-800" />
                         </div>
                         <div className="bg-slate-800/20 backdrop-blur-3xl rounded-3xl p-5 max-h-[350px] overflow-y-auto custom-scrollbar space-y-2 border border-slate-700/50 shadow-inner">
                            {users.filter(u => !formData.department_id || u.department_id === formData.department_id).length === 0 && (
                              <div className="text-center py-40 text-slate-700 space-y-6">
                                <Search className="w-20 h-20 mx-auto opacity-10" />
                                <p className="text-xs font-black uppercase tracking-[0.4em] opacity-30">Zero Demographic Hit</p>
                              </div>
                            )}
                            {users.filter(u => !formData.department_id || u.department_id === formData.department_id).map(u => {
                              const isEnrolled = formData.target_user_ids.includes(u.id);
                              return (
                                <motion.button 
                                  key={u.id}
                                  layout
                                  onClick={() => {
                                    if (isEnrolled) setFormData(p => ({ ...p, target_user_ids: p.target_user_ids.filter(id => id !== u.id) }));
                                    else setFormData(p => ({ ...p, target_user_ids: [...p.target_user_ids, u.id] }));
                                  }}
                                  className={`w-full p-3 rounded-xl flex items-center justify-between transition-all ${isEnrolled ? 'bg-blue-600/30 border border-blue-500/40 shadow-md shadow-blue-500/5' : 'hover:bg-slate-800/80 border border-transparent'}`}
                                  style={{ minHeight: "64px" }}
                                >
                                  <div className="flex items-center gap-3 text-left">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-xs text-slate-500 border border-slate-800 shadow-md relative overflow-hidden group-hover:border-slate-600 transition-colors flex-shrink-0">
                                       {u.avatar_url && u.avatar_url.trim() !== '' ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                       {isEnrolled && <div className="absolute inset-0 bg-blue-600/20" />}
                                    </div>
                                    <div>
                                      <p className={`text-sm font-bold tracking-tight leading-none ${isEnrolled ? 'text-white' : 'text-slate-300'}`}>{u.name}</p>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 leading-none">{u.role_name}</p>
                                    </div>
                                  </div>
                                  {isEnrolled ? (
                                    <div className="w-5 h-5 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                                      <CheckCircle className="w-3.5 h-3.5 shadow-sm" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-md border-2 border-slate-700 group-hover:border-slate-500" />
                                  )}
                                </motion.button>
                              )
                            })}
                         </div>
                       </div>
                    </div>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAssessmentModal && activeModuleForQuiz !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 lg:p-12"
            >
              <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[3.5rem] shadow-2xl relative border border-white/10">
                <AssessmentBuilder 
                  quizToEdit={formData.modules[activeModuleForQuiz].quiz}
                  onSave={(updatedQuiz) => {
                    const newModules = [...formData.modules];
                    newModules[activeModuleForQuiz].quiz = updatedQuiz;
                    setFormData({ ...formData, modules: newModules });
                    setShowAssessmentModal(false);
                    setActiveModuleForQuiz(null);
                  }}
                  onCancel={() => {
                    setShowAssessmentModal(false);
                    setActiveModuleForQuiz(null);
                  }} 
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Industrial Grade Footer Navigation */}
      <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-100 flex items-center gap-4 shadow-md z-20">
        <div className="w-44 sm:w-48 text-left opacity-80">
          <span className="block text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] mb-2 leading-none">Operational Phase</span>
          <span className="block text-sm font-bold text-slate-900 tracking-tight leading-none uppercase">{steps[step-1].title}</span>
        </div>

        <div className="flex-1 flex justify-center items-center gap-3">
           {step > 1 && (
             <motion.button 
               whileHover={{ x: -10 }}
               onClick={() => setStep(s => s - 1)}
               className="flex items-center gap-2 px-4 py-2 text-slate-400 font-bold hover:text-slate-900 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 text-xs"
             >
               <ChevronLeft className="w-4 h-4" /> Previous
             </motion.button>
           )}
           
           {step < 4 ? (
             <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 25px 50px -12px rgba(15,23,42,0.3)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(s => s + 1)}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-md text-xs"
             >
                <span className="text-lg">Continue</span> 
                <ChevronRight className="w-8 h-8 text-slate-500" />
             </motion.button>
           ) : (
             <motion.button 
                whileHover={{ scale: 1.05, boxShadow: '0 30px 60px -12px rgba(37,99,235,0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md disabled:opacity-50 text-xs"
             >
                {saving ? 'Synchronizing Data...' : <><Save className="w-4 h-4" /> <span className="uppercase tracking-tight">Deploy Module</span></>}
             </motion.button>
           )}
        </div>

        <div className="w-44 sm:w-48 flex justify-end">
           <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
             <div className="text-left">
               <span className="block text-[8.5px] font-bold text-slate-300 uppercase tracking-[0.4em] leading-none mb-1">State Integrity</span>
               <span className={`text-[10px] font-bold uppercase tracking-tight leading-none ${formData.title ? 'text-emerald-500' : 'text-slate-200'}`}>
                 {formData.title ? 'Ready to Sync' : 'Invalid Build'}
               </span>
             </div>
             <div className={`w-3 h-3 rounded-full ${formData.title ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)]' : 'bg-slate-100'} transition-all duration-1000`} />
           </div>
        </div>
      </div>
      <DeleteConfirmation 
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => {
          if (showDeleteConfirm !== null) {
            setFormData(prev => ({ ...prev, modules: prev.modules.filter((_, i) => i !== showDeleteConfirm) }));
            setShowDeleteConfirm(null);
          }
        }}
        title="Remove Module"
        message="Acknowledge permanent removal of this curricular unit? This cannot be undone."
      />

      {/* --- CONTENT REUSABILITY: IMPORT MODULE MODAL --- */}
      <AnimatePresence>
        {showImportModuleModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    Use Existing Module / Subject
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">Select a module from another course to clone with its content</p>
                </div>
                <button 
                  onClick={() => {
                    setShowImportModuleModal(false);
                    setSelectedImportCourseId('');
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-slate-700">Select Training Course</label>
                  <select
                    value={selectedImportCourseId}
                    onChange={(e) => setSelectedImportCourseId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                  >
                    <option value="">-- Choose Course to Browse Modules --</option>
                    {availableCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {selectedImportCourseId && (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-left">Available Modules</span>
                    {importCourseModules.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 text-xs italic font-bold">No modules available in this course</p>
                    ) : (
                      <div className="space-y-2">
                        {importCourseModules.map((modObj) => (
                          <div 
                            key={modObj.id} 
                            className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-blue-400 hover:bg-white transition-all group"
                          >
                            <div className="text-left">
                              <h4 className="font-bold text-slate-950 text-sm">{modObj.title}</h4>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
                                {(modObj.lessons || []).length} Lessons / {modObj.quiz ? 'Quiz included' : 'No quiz'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleImportModule(modObj)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black transition-all shadow-sm flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Clone
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- CONTENT REUSABILITY: IMPORT LESSON MODAL --- */}
      <AnimatePresence>
        {showImportLessonModal !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
                <div className="text-left">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Use Existing Lesson / Asset
                  </h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider font-bold mt-0.5">Select a lesson from another course module to clone into this unit</p>
                </div>
                <button 
                  onClick={() => {
                    setShowImportLessonModal(null);
                    setSelectedImportCourseId('');
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-black text-slate-700">Select Training Course</label>
                  <select
                    value={selectedImportCourseId}
                    onChange={(e) => setSelectedImportCourseId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                  >
                    <option value="">-- Choose Course to Browse Modules --</option>
                    {availableCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {selectedImportCourseId && (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {importCourseModules.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 text-xs italic font-bold">No modules available in this course</p>
                    ) : (
                      <div className="space-y-4">
                        {importCourseModules.map((modObj) => (
                          <div key={modObj.id} className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-left">Module: {modObj.title}</span>
                            <div className="space-y-1.5 pl-2 border-l-2 border-slate-100">
                              {(modObj.lessons || []).length === 0 ? (
                                <p className="text-slate-300 text-[10px] italic text-left">No lessons inside this module</p>
                              ) : (
                                modObj.lessons.map((lessonObj: any) => (
                                  <div 
                                    key={lessonObj.id} 
                                    className="bg-slate-50 hover:bg-white border border-slate-150 p-3 rounded-xl flex items-center justify-between hover:border-emerald-400 transition-all group"
                                  >
                                    <div className="text-left flex items-center gap-2">
                                      <div className="p-1.5 bg-white text-slate-400 rounded-lg group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                        {lessonObj.content_type === 'video' ? <Video className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                      </div>
                                      <div>
                                        <h5 className="font-bold text-slate-900 text-xs">{lessonObj.title}</h5>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{lessonObj.content_type} Delivery</span>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleImportLesson(lessonObj, showImportLessonModal)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-black transition-all shadow-sm"
                                    >
                                      Import
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CourseBuilder;

