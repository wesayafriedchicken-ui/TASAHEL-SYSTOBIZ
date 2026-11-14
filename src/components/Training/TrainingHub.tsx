import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, BookOpen, Clock, Target, 
  Users, CheckCircle, BarChart2, Edit3, Trash2, 
  Layout, GraduationCap, FileText, PieChart, Award,
  Video
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TrainingDashboard } from '@/components/Training/TrainingDashboard';
import { CourseBuilder } from '@/components/Training/CourseBuilder';
import { CourseCard } from '@/components/Training/CourseCard';
import { LessonBuilder } from '@/components/Training/LessonBuilder';
import { AssessmentBuilder } from '@/components/Training/AssessmentBuilder';
import { useAuth } from '@/context/AuthContext';
import DeleteConfirmation from '@/components/Common/DeleteConfirmation';

type TabType = 'Dashboard' | 'Programs' | 'Content' | 'Quizzes' | 'Tracking' | 'Certificates';

const TrainingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [courses, setCourses] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showLessonBuilder, setShowLessonBuilder] = useState(false);
  const [showAssessmentBuilder, setShowAssessmentBuilder] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [courseToEdit, setCourseToEdit] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ id: number, type: 'course' | 'lesson' | 'quiz' } | null>(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin' || 
                  user?.role_name === 'Admin' ||
                  user?.role === 'Manager' || 
                  user?.role_name === 'Manager' ||
                  user?.role === 'Super Admin' ||
                  user?.role_name === 'Super Admin' ||
                  user?.role === 'Director' ||
                  user?.role_name === 'Director' ||
                  user?.role_id === 1 || 
                  user?.id === 1;

  const tabs: { id: TabType, label: string, icon: any }[] = [
    { id: 'Dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'Programs', label: 'Training Programs', icon: GraduationCap },
    { id: 'Content', label: 'Learning Content', icon: BookOpen },
    { id: 'Quizzes', label: 'Assessments', icon: FileText },
    { id: 'Tracking', label: 'Tracking', icon: Target },
    { id: 'Certificates', label: 'Certificates', icon: Award },
  ];

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    const { id, type } = showDeleteConfirm;
    const token = localStorage.getItem('token');
    const headers: any = {
      'X-User-ID': user?.id?.toString() || localStorage.getItem('user_id') || '1',
      'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let url = '';
    if (type === 'course') url = `/api/training/courses/${id}`;
    else if (type === 'lesson') url = `/api/training/lessons/${id}`;
    else if (type === 'quiz') url = `/api/training/quizzes/${id}`;

    try {
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Delete failed: ${errData.error || 'Unknown error'}`);
      } else {
        setShowDeleteConfirm(null);
        fetchInitialData();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error while deleting");
    }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers: any = {
      'X-User-ID': user?.id?.toString() || localStorage.getItem('user_id') || '1',
      'Content-Type': 'application/json'
    };
    if (token && token !== 'null' && token !== 'undefined') {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      if (activeTab === 'Dashboard') {
        const [coursesRes, analyticsRes] = await Promise.all([
          courses.length === 0 ? fetch('/api/training/courses', { headers }) : Promise.resolve(null),
          fetch('/api/training/analytics', { headers })
        ]);
        if (coursesRes && coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(Array.isArray(coursesData) ? coursesData : []);
        }
        if (analyticsRes.ok) {
          setAnalytics(await analyticsRes.json());
        }
      } else if (activeTab === 'Programs') {
        const coursesRes = await fetch('/api/training/courses', { headers });
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(Array.isArray(coursesData) ? coursesData : []);
        }
      } else if (activeTab === 'Content') {
        let currentCourses = courses;
        if (currentCourses.length === 0) {
          const coursesRes = await fetch('/api/training/courses', { headers });
          if (coursesRes.ok) {
            currentCourses = await coursesRes.json();
            setCourses(Array.isArray(currentCourses) ? currentCourses : []);
          }
        }
        if (Array.isArray(currentCourses)) {
          const lessonPromises = currentCourses.map(course => 
             fetch(`/api/training/courses/${course.id}`, { headers }).then(r => r.ok ? r.json() : null)
          );
          const courseDetails = await Promise.all(lessonPromises);
          const allLessons: any[] = [];
          courseDetails.forEach((details, index) => {
             if (details && details.modules) {
                details.modules.forEach((mod: any) => {
                   if (mod.lessons) {
                      mod.lessons.forEach((lesson: any) => {
                         allLessons.push({ 
                            ...lesson, 
                            courseTitle: currentCourses[index].title, 
                            moduleTitle: mod.title 
                         });
                      });
                   }
                });
             }
          });
          setLessons(allLessons);
        }
      } else if (activeTab === 'Quizzes') {
        const res = await fetch('/api/training/quizzes', { headers });
        if (res.ok) {
          const quizData = await res.json();
          setQuizzes(Array.isArray(quizData) ? quizData : []);
        }
      } else if (activeTab === 'Tracking' || activeTab === 'Certificates') {
        const enrollRes = await fetch('/api/training/enrollments', { headers });
        if (enrollRes.ok) {
          const enrollData = await enrollRes.json();
          setEnrollments(Array.isArray(enrollData) ? enrollData : []);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("Training Hub Data Fetch Error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 text-left" dir="ltr">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50">
        <div className="text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">TRAINING HUB</h1>
          <p className="text-slate-500 font-bold mt-1">Enterprise Integrated Learning Management System (LMS)</p>
        </div>
        <div className="flex gap-4">
           {isAdmin && (
             <button 
               onClick={() => {
                 setSelectedCourse(null);
                 setShowBuilder(true);
               }}
               className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-lg shadow-blue-200 active:scale-95 text-lg"
             >
               <Plus className="w-6 h-6" /> Add New Program
             </button>
           )}
           <button 
             onClick={fetchInitialData}
             disabled={loading}
             className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm group"
             title="Refresh Data"
           >
             <Clock className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all whitespace-nowrap border-2 ${
              activeTab === tab.id 
                ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-200' 
                : 'bg-white border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100'
            }`}
          >
            <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'Dashboard' && analytics && analytics.overview && (
            <div className="space-y-8" dir="ltr">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-left">
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">Total Enrollments</p>
                  <p className="text-4xl font-black text-slate-900">{analytics.overview.total_enrollments || 0}</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-left">
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">Completion Rate</p>
                  <p className="text-4xl font-black text-emerald-600">
                    {analytics.overview.total_enrollments > 0 
                      ? Math.round(((analytics.overview.total_completions || 0) / analytics.overview.total_enrollments) * 100) 
                      : 0}%
                  </p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-left">
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">Overdue Modules</p>
                  <p className="text-4xl font-black text-rose-600">{analytics.overview.overdue_count || 0}</p>
                </div>
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-left">
                  <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2">Avg Assessment Score</p>
                  <p className="text-4xl font-black text-blue-600">{Math.round(analytics.overview.avg_score || 0)}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-left">
                    <h4 className="font-black text-slate-900 mb-6 flex items-center gap-3 justify-start uppercase text-xs tracking-widest">
                       <BarChart2 className="w-5 h-5 text-blue-500" />
                       Performance by Department
                    </h4>
                    <div className="space-y-6">
                       {(analytics.byDepartment || []).map((dept: any) => (
                          <div key={dept.id}>
                             <div className="flex justify-between text-sm mb-2 font-bold">
                                <span className="text-slate-700">{dept.name}</span>
                                <span className="text-slate-500">{Math.round(dept.avg_score || 0)}% Compliance</span>
                             </div>
                             <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${dept.avg_score || 0}%` }}
                                  className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
                 <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center group">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                       <Award className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-white mb-2 text-xl tracking-tight">Skills Gap Intelligence</h4>
                    <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed">System automatically updates based on recent assessment trends across the organization.</p>
                 </div>
              </div>
            </div>
          )}
          {activeTab === 'Programs' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm" dir="ltr">
                 <div className="text-left">
                    <h3 className="text-xl font-black text-slate-900">Program Management</h3>
                    <p className="text-sm text-slate-500 font-bold">Create and manage training curricula for your workforce</p>
                 </div>
                 {isAdmin && (
                   <button 
                     onClick={() => setShowBuilder(true)}
                     className="flex items-center gap-3 bg-blue-600 text-white px-10 py-4 rounded-2xl font-black transition-all hover:bg-blue-700 shadow-lg shadow-blue-100 active:scale-95"
                   >
                      <Plus className="w-5 h-5" />
                      Add New Program
                   </button>
                 )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {loading ? (
                   <div className="col-span-full py-20 text-center text-slate-400 font-black italic">Loading Programs...</div>
                 ) : courses.length === 0 ? (
                   <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                     <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                     <p className="text-slate-500 font-black text-xl">No training programs found</p>
                     <p className="text-slate-400 text-sm mt-2 font-bold">Click "Add New Program" to start building your first course</p>
                   </div>
                 ) : (
                   courses.map(course => (
                     <CourseCard 
                       key={course.id}
                       course={course}
                       isAdmin={isAdmin}
                       onEdit={async (c: any) => {
                         const res = await fetch(`/api/training/courses/${c.id}`);
                         if (res.ok) {
                           const fullCourse = await res.json();
                           setCourseToEdit(fullCourse);
                           setShowBuilder(true);
                         }
                       }}
                       onViewDetails={async (c) => {
                         const res = await fetch(`/api/training/courses/${c.id}`);
                         if (res.ok) {
                           const fullCourse = await res.json();
                           setSelectedCourse(fullCourse);
                           setShowDetails(true);
                         }
                       }}
                       onDelete={(id) => setShowDeleteConfirm({ id, type: 'course' })}
                      />
                    ))
                  )}
              </div>
            </div>
          )}

          {activeTab === 'Content' && (
             <div className="space-y-6">
                {isAdmin && (
                  <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm" dir="ltr">
                    <div className="text-left">
                      <h3 className="text-xl font-black text-slate-900">Learning Library</h3>
                      <p className="text-sm text-slate-500 font-bold">Manage lessons and educational materials</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedLesson(null);
                        setShowLessonBuilder(true);
                      }}
                      className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-emerald-100 active:scale-95"
                    >
                      <Plus className="w-5 h-5" /> Create New Content
                    </button>
                  </div>
                )}
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                    <table className="w-full text-left" dir="ltr">
                       <thead>
                          <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black bg-slate-50/50">
                             <th className="px-8 py-6">Lesson</th>
                             <th className="px-8 py-6">Program / Module</th>
                             <th className="px-8 py-6">Type</th>
                             <th className="px-8 py-6">Actions</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {lessons.length === 0 ? (
                             <tr>
                                <td colSpan={4} className="px-8 py-16 text-center text-slate-400 font-black italic">No content available</td>
                             </tr>
                          ) : (
                             lessons.map((lesson, idx) => (
                                <tr key={`lesson-${lesson.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-4 justify-start">
                                         <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                            {lesson.content_type === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                         </div>
                                         <span className="font-black text-slate-900 text-lg">{lesson.title}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex flex-col">
                                         <span className="text-sm font-black text-slate-700">{lesson.courseTitle}</span>
                                         <span className="text-[11px] text-slate-400 font-black uppercase tracking-tighter">{lesson.moduleTitle}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6">
                                     <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                       {lesson.content_type}
                                     </span>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex gap-3 justify-start">
                                         <button 
                                           onClick={() => {
                                             setSelectedLesson(lesson);
                                             setShowLessonBuilder(true);
                                           }}
                                           className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all active:scale-95"
                                         >
                                           <Edit3 className="w-5 h-5" />
                                         </button>
                                         <button 
                                           onClick={() => setShowDeleteConfirm({ id: lesson.id, type: 'lesson' })}
                                           className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-all active:scale-95"
                                         >
                                           <Trash2 className="w-5 h-5" />
                                         </button>
                                      </div>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                </div>
             </div>
          )}

          {activeTab === 'Tracking' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden text-left" dir="ltr">
               <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-black text-slate-900">Trainee Progress Tracking</h3>
               </div>
               <div className="p-0 overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black bg-slate-50">
                           <th className="px-8 py-6">Employee</th>
                           <th className="px-8 py-6">Program</th>
                           <th className="px-8 py-6">Department</th>
                           <th className="px-8 py-6">Status</th>
                           <th className="px-8 py-6">Score</th>
                           <th className="px-8 py-6">Date</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {enrollments.map((en, idx) => (
                           <tr key={`${en.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4 justify-start">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xs font-black shadow-lg">
                                       {en.user_name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col text-left">
                                       <span className="text-base font-black text-slate-900">{en.user_name}</span>
                                       <span className="text-[11px] text-slate-400 font-bold uppercase">{en.user_email}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-sm font-black text-slate-700">{en.course_title}</td>
                              <td className="px-8 py-6">
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                  {en.department_name}
                                </span>
                              </td>
                              <td className="px-8 py-6">
                                 <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                                    en.status === 'completed' ? 'bg-emerald-100 text-emerald-700 shadow-emerald-100' :
                                    en.status === 'failed' ? 'bg-rose-100 text-rose-700 shadow-rose-100' : 'bg-blue-100 text-blue-700 shadow-blue-100'
                                 }`}>
                                    {en.status || 'Enrolled'}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-xl font-black text-slate-900">{en.score || '--'}%</td>
                              <td className="px-8 py-6 text-xs text-slate-400 font-black uppercase">
                                 {en.completed_at ? new Date(en.completed_at).toLocaleDateString() : 'Active'}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
          )}

          {activeTab === 'Quizzes' && (
             <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-900">Assessment Management</h3>
                   {isAdmin && (
                     <button 
                       onClick={() => {
                         setSelectedQuiz(null);
                         setShowAssessmentBuilder(true);
                       }}
                       className="flex items-center gap-3 bg-slate-900 text-white px-8 py-3 rounded-xl font-black transition-all hover:bg-black active:scale-95"
                     >
                        <Plus className="w-5 h-5" /> Add Assessment
                     </button>
                   )}
                </div>
                <div className="p-0">
                   <table className="w-full text-left" dir="ltr">
                      <thead>
                         <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black bg-slate-50">
                            <th className="px-8 py-6">Assessment</th>
                            <th className="px-8 py-6">Associated Program</th>
                            <th className="px-8 py-6">Created Date</th>
                            <th className="px-8 py-6">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {quizzes.length === 0 ? (
                            <tr>
                               <td colSpan={4} className="px-8 py-16 text-center text-slate-400 font-black italic">No assessments available</td>
                            </tr>
                         ) : (
                            quizzes.map(quiz => (
                               <tr key={quiz.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="px-8 py-6 text-left">
                                      <div className="font-black text-slate-900 text-lg">{quiz.title}</div>
                                      {quiz.description && <div className="text-xs text-slate-500 font-medium line-clamp-1 max-w-md">{quiz.description}</div>}
                                   </td>
                                   <td className="px-8 py-6 text-left">
                                      <div className="text-sm font-bold text-slate-600">{quiz.course_title || (quiz.course_id ? `Program #${quiz.course_id}` : 'Standalone')}</div>
                                      {quiz.department_name && <div className="text-xs text-violet-600 font-black uppercase mt-1">{quiz.department_name}</div>}
                                   </td>
                                  <td className="px-8 py-6 text-xs text-slate-400 font-black uppercase">{new Date(quiz.created_at).toLocaleDateString()}</td>
                                   <td className="px-8 py-6 text-right">
                                      <div className="flex justify-end gap-2">
                                         <button 
                                           onClick={async () => {
                                             const res = await fetch(`/api/training/quizzes/${quiz.id}`, {
                                               headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                                             });
                                             if (res.ok) {
                                               setSelectedQuiz(await res.json());
                                               setShowAssessmentBuilder(true);
                                             }
                                           }}
                                           className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-black text-xs flex items-center gap-2"
                                         >
                                            <Edit3 className="w-4 h-4" /> Manage
                                         </button>
                                         <button 
                                           onClick={() => setShowDeleteConfirm({ id: quiz.id, type: 'quiz' })}
                                           className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                         >
                                            <Trash2 className="w-4 h-4" />
                                         </button>
                                      </div>
                                   </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
          
          {activeTab === 'Certificates' && (
             <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                   <h3 className="text-2xl font-black text-slate-900 text-left">Digital Certificates Registry</h3>
                </div>
                <div className="p-0 overflow-x-auto">
                   <table className="w-full text-left" dir="ltr">
                      <thead>
                         <tr className="border-b border-slate-100 text-[11px] uppercase tracking-widest text-slate-400 font-black bg-slate-50">
                            <th className="px-8 py-6">Employee</th>
                            <th className="px-8 py-6">Training Program</th>
                            <th className="px-8 py-6">Issuance Date</th>
                            <th className="px-8 py-6 text-center">Actions</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {enrollments.filter(e => e.status === 'completed').length === 0 ? (
                            <tr>
                               <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-black italic">No certificates issued yet</td>
                            </tr>
                         ) : (
                            enrollments.filter(e => e.status === 'completed').map((en, idx) => (
                               <tr key={`${en.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-6">
                                     <div className="flex items-center gap-4 justify-start">
                                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-black text-lg border border-amber-100">
                                           {en.user_name?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                           <span className="text-base font-black text-slate-900">{en.user_name}</span>
                                           <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{en.user_email}</span>
                                        </div>
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-sm font-black text-slate-700">{en.course_title}</td>
                                  <td className="px-8 py-6 text-xs text-slate-500 font-black uppercase">
                                     {en.completed_at ? new Date(en.completed_at).toLocaleDateString() : '--'}
                                  </td>
                                  <td className="px-8 py-6 text-center">
                                     <a 
                                       href={`/api/training/certificate/${en.id}`} 
                                       target="_blank" 
                                       rel="noreferrer"
                                       className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-slate-900 transition-all shadow-lg shadow-blue-200"
                                     >
                                        <Award className="w-4 h-4" />
                                        Download Certificate
                                     </a>
                                  </td>
                               </tr>
                            ))
                         )}
                      </tbody>
                   </table>
                </div>
             </div>
          )}
        </motion.div>
      </AnimatePresence>

      {showBuilder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="w-full max-w-5xl h-[85vh] relative">
              <CourseBuilder 
                courseToEdit={courseToEdit}
                onCourseCreated={() => { 
                  setShowBuilder(false); 
                  setCourseToEdit(null);
                  fetchInitialData();
                }} 
                onCancel={() => {
                  setShowBuilder(false);
                  setCourseToEdit(null);
                }}
              />
           </div>
        </div>
      )}

      {showDetails && selectedCourse && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden text-left" dir="ltr">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">{selectedCourse.title}</h2>
                  <p className="text-slate-500 font-bold">{selectedCourse.description}</p>
               </div>
               <button 
                 onClick={() => setShowDetails(false)}
                 className="p-3 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 transition-all shadow-lg hover:rotate-90"
               >
                 <Plus className="w-8 h-8 rotate-45" />
               </button>
            </div>
            
            <div className="p-10 max-h-[60vh] overflow-y-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Program Curriculum (Modules)</h3>
                     <div className="space-y-4">
                        {selectedCourse.modules?.length > 0 ? (
                           selectedCourse.modules.map((mod: any) => (
                              <div key={mod.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                                 <h4 className="font-black text-slate-900 mb-3 text-lg">{mod.title}</h4>
                                 <div className="space-y-2">
                                    {mod.lessons?.map((lesson: any) => (
                                       <div key={lesson.id} className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                                          <span>{lesson.title}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))
                        ) : <div className="text-slate-400 text-sm italic font-bold">No modules defined for this program yet.</div>}
                     </div>
                  </div>
                  <div className="space-y-6">
                     <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Enrolled Trainees</h3>
                     <div className="space-y-4">
                        {enrollments.filter(e => e.course_id === selectedCourse.id).length > 0 ? (
                           enrollments.filter(e => e.course_id === selectedCourse.id).map((en, idx) => (
                              <div key={`${en.id}-${idx}`} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xs">
                                       {en.user_name?.charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                       <span className="text-sm font-black text-slate-900">{en.user_name}</span>
                                       <span className={`text-[10px] font-black uppercase tracking-tighter ${en.status === 'completed' ? 'text-emerald-500' : 'text-blue-500'}`}>
                                          {en.status || 'Active'}
                                       </span>
                                    </div>
                                 </div>
                                 <span className="text-base font-black text-slate-900">{en.score || 0}%</span>
                              </div>
                           ))
                        ) : <div className="text-slate-400 text-sm italic font-bold">No trainees enrolled yet.</div>}
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex justify-end">
               <button 
                 onClick={() => setShowDetails(false)}
                 className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-200 active:scale-95 transition-all"
               >
                 Close Curriculum View
               </button>
            </div>
          </div>
        </div>
      )}
      {showLessonBuilder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
           <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl relative">
              <LessonBuilder 
                lesson={selectedLesson}
                onSave={(_data) => {
                  setShowLessonBuilder(false);
                  fetchInitialData();
                }}
                onCancel={() => setShowLessonBuilder(false)} 
              />
           </div>
        </div>
      )}
      {showAssessmentBuilder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[3rem] shadow-2xl relative">
              <AssessmentBuilder 
                quizToEdit={selectedQuiz}
                onSave={(_data) => {
                  setShowAssessmentBuilder(false);
                  fetchInitialData();
                }}
                onCancel={() => setShowAssessmentBuilder(false)} 
              />
           </div>
        </div>
      )}
      
      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        title={`Delete ${showDeleteConfirm?.type === 'course' ? 'Training Program' : showDeleteConfirm?.type === 'lesson' ? 'Content' : 'Assessment'}`}
        message={`Are you sure you want to delete this ${showDeleteConfirm?.type === 'course' ? 'program' : showDeleteConfirm?.type === 'lesson' ? 'lesson' : 'assessment'}? This action cannot be undone.`}
      />
    </div>
  );
};

export default TrainingHub;
