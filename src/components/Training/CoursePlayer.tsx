import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Play, FileText, HelpCircle, X, Award, Clock } from 'lucide-react';
import ReactPlayer from 'react-player';
const Player = ReactPlayer as any;
import { motion, AnimatePresence } from 'motion/react';
import { QuizView } from './QuizView';

interface CoursePlayerProps {
  courseId: number;
  enrollmentId: number;
  onClose: () => void;
}

export const CoursePlayer: React.FC<CoursePlayerProps> = ({ courseId, enrollmentId, onClose }) => {
  const [course, setCourse] = useState<any>(null);
  const [currentModuleIdx, setCurrentModuleIdx] = useState(0);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [view, setView] = useState<'lesson' | 'quiz' | 'completed'>('lesson');
  const [loading, setLoading] = useState(true);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [completing, setCompleting] = useState(false);

  // Mock user for now - in real app get from context
  const user = JSON.parse(localStorage.getItem('user') || '{"id": 1, "name": "System Admin", "role": "Admin", "department_id": 1}');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/training/courses/${courseId}?user_id=${user.id}`);
      setCourse(await res.json());
    } catch (err) {
      console.error("Failed to fetch course details", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !course) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading Course Content...</p>
        </div>
      </div>
    );
  }

  const currentModule = course.modules?.[currentModuleIdx];
  const currentLesson = currentModule?.lessons?.[currentLessonIdx];

  const handleNext = async () => {
    if (view === 'lesson') {
      if (!currentLesson) return;
      // Mark current lesson as completed
      if (!currentLesson.is_completed) {
        setCompleting(true);
        try {
          const res = await fetch(`/api/training/lessons/${currentLesson.id}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, enrollment_id: enrollmentId })
          });
          
          if (res.status === 403) {
            const errorData = await res.json();
            alert(errorData.error);
            return;
          }

          if (!res.ok) throw new Error("Failed to complete lesson");

          // Update local state
          const newCourse = { ...course };
          newCourse.modules[currentModuleIdx].lessons[currentLessonIdx].is_completed = true;
          setCourse(newCourse);
        } catch (err) {
          console.error("Failed to complete lesson", err);
        } finally {
          setCompleting(false);
        }
      }

      if (currentLessonIdx < currentModule.lessons.length - 1) {
        setCurrentLessonIdx(currentLessonIdx + 1);
      } else if (currentModule.quiz) {
        setView('quiz');
      } else {
        moveToNextModule();
      }
    } else if (view === 'quiz') {
      moveToNextModule();
    }
  };

  const moveToNextModule = () => {
    if (currentModuleIdx < course.modules.length - 1) {
      setCurrentModuleIdx(currentModuleIdx + 1);
      setCurrentLessonIdx(0);
      setView('lesson');
      setQuizResult(null);
    } else {
      setView('completed');
    }
  };

  const handleQuizSubmit = (result: any) => {
    setQuizResult(result);
    if (result.passed) {
      // Logic to unlock next module or complete course
    }
  };

  const totalLessons = course.modules.reduce((acc: number, mod: any) => acc + mod.lessons.length, 0);
  const completedLessons = course.modules.reduce((acc: number, mod: any) => 
    acc + mod.lessons.filter((l: any) => l.is_completed).length, 0);
  const progressPercent = (completedLessons / totalLessons) * 100;

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900">{course.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="h-1.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-blue-500 transition-all" 
                   style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {Math.round(progressPercent)}% Complete
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
            <Award className="w-4 h-4" />
            <span className="text-xs font-bold">{course.points_reward} Points</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-slate-200 overflow-y-auto hidden lg:block">
          <div className="p-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Course Content</h3>
            <div className="space-y-6">
              {course.modules.map((mod: any, mIdx: number) => (
                <div key={mod.id} className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm font-bold ${mIdx === currentModuleIdx ? 'text-blue-600' : 'text-slate-700'}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] ${mIdx <= currentModuleIdx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {mIdx < currentModuleIdx ? <CheckCircle className="w-3 h-3" /> : mIdx + 1}
                    </div>
                    <span className="line-clamp-1">{mod.title}</span>
                  </div>
                  <div className="pl-7 space-y-1">
                    {mod.lessons?.map((lesson: any, lIdx: number) => (
                      <button
                        key={lesson.id}
                        disabled={mIdx > currentModuleIdx}
                        onClick={() => {
                          setCurrentModuleIdx(mIdx);
                          setCurrentLessonIdx(lIdx);
                          setView('lesson');
                        }}
                        className={`w-full text-left py-1 text-xs flex items-center gap-2 transition-colors ${mIdx === currentModuleIdx && lIdx === currentLessonIdx ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'} ${mIdx > currentModuleIdx ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {lesson.is_completed ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : (
                          lesson?.content_type === 'video' ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />
                        )}
                        {lesson.title}
                      </button>
                    ))}
                    {mod.quiz && (
                      <button
                        disabled={mIdx > currentModuleIdx}
                        onClick={() => {
                          setCurrentModuleIdx(mIdx);
                          setView('quiz');
                        }}
                        className={`w-full text-left py-1 text-xs flex items-center gap-2 transition-colors ${mIdx === currentModuleIdx && view === 'quiz' ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-900'} ${mIdx > currentModuleIdx ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <HelpCircle className="w-3 h-3" />
                        Knowledge Check
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto">
          <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {view === 'lesson' && currentLesson && (
                <motion.div
                  key={`lesson-${currentLesson.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    {currentLesson.content_type === 'video' && currentLesson.content_url ? (
                      <div className="aspect-video bg-black">
                        <Player
                          url={currentLesson.content_url}
                          width="100%"
                          height="100%"
                          controls
                        />
                      </div>
                    ) : (
                      <div className="p-12 text-center bg-blue-50/30 border-b border-slate-100">
                        <FileText className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-900">{currentLesson.title}</h3>
                      </div>
                    )}
                    <div className="p-8">
                      <h1 className="text-2xl font-bold text-slate-900 mb-4">{currentLesson.title}</h1>
                      <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                        {currentLesson.content_body || 'No content provided for this lesson.'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {view === 'lesson' && !currentLesson && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                   <FileText className="w-12 h-12 mb-4 opacity-20" />
                   <p>No lesson content available in this module.</p>
                   <button 
                     onClick={handleNext}
                     className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
                   >
                     Skip to Next
                   </button>
                </div>
              )}

              {view === 'quiz' && currentModule?.quiz && (
                <motion.div
                  key={`quiz-${currentModule.quiz.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                >
                  <QuizView 
                    quizId={currentModule.quiz.id} 
                    onComplete={handleQuizSubmit} 
                  />
                </motion.div>
              )}

              {view === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
                    <CheckCircle className="w-12 h-12" />
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Congratulations!</h1>
                  <p className="text-slate-500 mb-8 max-w-md mx-auto">
                    You have successfully completed the <strong>{course.title}</strong>. 
                    Your skills have been updated and points awarded.
                  </p>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={onClose}
                      className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                    >
                      Back to Dashboard
                    </button>
                    <button className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all">
                      Download Certificate
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
            <div className="max-w-4xl mx-auto flex justify-between items-center">
              <button
                disabled={currentModuleIdx === 0 && currentLessonIdx === 0}
                onClick={() => {
                  if (currentLessonIdx > 0) setCurrentLessonIdx(currentLessonIdx - 1);
                  else if (currentModuleIdx > 0) {
                    setCurrentModuleIdx(currentModuleIdx - 1);
                    setCurrentLessonIdx(course.modules[currentModuleIdx - 1].lessons.length - 1);
                  }
                }}
                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {view === 'lesson' && currentLesson && (
                <button
                  onClick={handleNext}
                  disabled={completing}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 disabled:opacity-50"
                >
                  {currentLesson.is_completed ? 'Next' : 'Mark as Completed'} <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {view === 'quiz' && quizResult?.passed && (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100"
                >
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
