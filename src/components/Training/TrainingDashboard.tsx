import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle, Clock, ChevronRight, PlayCircle, BarChart2, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { CourseBuilder } from './CourseBuilder';
import { CoursePlayer } from './CoursePlayer';

export const TrainingDashboard: React.FC = () => {
  const [view, setView] = useState<'my-learning' | 'analytics' | 'builder' | 'player'>('my-learning');
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock user for now - in real app get from context
  const user = JSON.parse(localStorage.getItem('user') || '{"id": 1, "name": "System Admin", "role": "Admin", "department_id": 1}');

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user_id') || '1';
      const headers = {
        'Authorization': `Bearer ${token}`,
        'x-user-id': userId
      };

      let data: any[] = [];
      if (view === 'my-learning') {
        const res = await fetch(`/api/training/my-learning?user_id=${user.id}&department_id=${user.department_id}`, { headers });
        data = await res.json();
      } else if (view === 'analytics') {
        const res = await fetch('/api/training/analytics', { headers });
        setStats(await res.json());
        return;
      } else if (view === 'builder') {
        const res = await fetch('/api/training/courses', { headers });
        data = await res.json();
      }

      if (Array.isArray(data)) {
        setCourses(data);
        localStorage.setItem('business_core_training_courses', JSON.stringify(data));
      }
    } catch (err) {
      console.error("Failed to fetch training data", err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(null);

  const handleStartCourse = async (courseId: number, enrollmentId: number | null) => {
    let currentEnrollmentId = enrollmentId;
    if (!enrollmentId) {
      try {
        const res = await fetch('/api/training/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, course_id: courseId })
        });
        const data = await res.json();
        currentEnrollmentId = data.id;
        // Refresh data
        await fetchData();
      } catch (err) {
        console.error("Failed to enroll", err);
        return;
      }
    }
    setSelectedCourseId(courseId);
    setSelectedEnrollmentId(currentEnrollmentId);
    setView('player');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Training & Onboarding Hub</h1>
          <p className="text-slate-500 mt-1">Transforming SOPs into knowledge and skills.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setView('my-learning')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'my-learning' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
          >
            My Learning
          </button>
          {user.role === 'Admin' && (
            <>
              <button
                onClick={() => setView('analytics')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'analytics' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setView('builder')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'builder' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Course Builder
              </button>
            </>
          )}
        </div>
      </div>

      {view === 'my-learning' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Active Courses
            </h2>
            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2].map(i => <div key={i} className="h-32 bg-slate-100 rounded-xl"></div>)}
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No active courses. You're all caught up!</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {courses.map(course => (
                  <motion.div
                    key={course.course_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded">
                            {course.department_name || 'General'}
                          </span>
                          <span className="text-slate-400 text-xs flex items-center gap-1">
                            <Award className="w-3 h-3" /> {course.points_reward} Points
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 line-clamp-2">{course.description}</p>
                      </div>
                      <button
                        onClick={() => handleStartCourse(course.course_id, course.enrollment_id)}
                        className="ml-4 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                      >
                        <PlayCircle className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="mt-6">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progress</span>
                        <span>{course.status === 'completed' ? '100%' : 'In Progress'}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${course.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: course.status === 'completed' ? '100%' : '35%' }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-100">
              <div className="flex justify-between items-start mb-4">
                <Award className="w-10 h-10 opacity-50" />
                <div className="text-left">
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest">Total Points</p>
                  <p className="text-4xl font-black">1,250</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10">
                  <p className="text-xs font-medium text-blue-100 mb-1">Current Rank</p>
                  <p className="text-lg font-bold">Knowledge Master</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-blue-100 uppercase">Courses</p>
                    <p className="text-xl font-bold">12</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/10 text-center">
                    <p className="text-[10px] font-bold text-blue-100 uppercase">Badges</p>
                    <p className="text-xl font-bold">5</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Recent Achievements
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">SOP Compliance Pro</p>
                      <p className="text-[10px] text-slate-500">Completed Sales SOP Training</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'analytics' && stats && stats.overview && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Active Trainees</p>
              <p className="text-3xl font-black text-slate-900">{stats.overview.active_trainees || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Success Rate</p>
              <p className="text-3xl font-black text-emerald-600">
                {stats.overview.total_enrollments > 0 
                  ? Math.round((stats.overview.total_completions / stats.overview.total_enrollments) * 100) 
                  : 0}%
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Overdue Courses</p>
              <p className="text-3xl font-black text-rose-600">{stats.overview.overdue_count || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Avg Quiz Score</p>
              <p className="text-3xl font-black text-blue-600">{Math.round(stats.overview?.avg_score || 0)}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                Performance by Department
              </h3>
              <div className="space-y-6">
                {stats.byDepartment?.map((dept: any) => (
                  <div key={dept.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">{dept.name}</span>
                      <span className="text-slate-500">{dept.enrollment_count} Enrolled</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${dept.avg_score || 0}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Avg Score</span>
                      <span className="text-[10px] text-blue-600 font-bold">{Math.round(dept.avg_score || 0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Skill Gap Analysis
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <p className="text-amber-800 font-bold text-sm">Critical Gap: CRM Data Entry</p>
                  <p className="text-amber-600 text-xs mt-1">45% of Operations team failed the recent assessment.</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-blue-800 font-bold text-sm">Strength: Lead Qualification</p>
                  <p className="text-blue-600 text-xs mt-1">92% of Sales team passed with honors.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'builder' && <CourseBuilder onCourseCreated={fetchData} />}
      
      {view === 'player' && selectedCourseId && (
        <CoursePlayer 
          courseId={selectedCourseId} 
          enrollmentId={selectedEnrollmentId!}
          onClose={() => { setView('my-learning'); setSelectedCourseId(null); setSelectedEnrollmentId(null); fetchData(); }} 
        />
      )}
    </div>
  );
};

export default TrainingDashboard;
