import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, FileText, Video, Link, HelpCircle, X, Upload } from 'lucide-react';
import { motion } from 'motion/react';

interface LessonBuilderProps {
  courseId?: number;
  moduleId?: number;
  lesson?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const LessonBuilder: React.FC<LessonBuilderProps> = ({ courseId, moduleId, lesson, onSave, onCancel }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>(courseId || '');
  const [selectedModuleId, setSelectedModuleId] = useState<number | ''>(moduleId || '');
  
  // State for multiple targets
  const [targets, setTargets] = useState<{ courseId: number, courseTitle: string, moduleId: number, moduleTitle: string }[]>([]);

  const [title, setTitle] = useState(lesson?.title || '');
  const [contentType, setContentType] = useState(lesson?.content_type || 'document');
  const [contentUrl, setContentUrl] = useState(lesson?.content_url || '');
  const [contentBody, setContentBody] = useState(lesson?.content_body || '');
  const [orderIndex, setOrderIndex] = useState(lesson?.order_index || 0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId as number);
    } else {
      setModules([]);
    }
  }, [selectedCourseId]);

  // Set initial target if provided
  useEffect(() => {
    if (courseId && moduleId && courses.length > 0) {
      const c = courses.find(item => item.id === courseId);
      // Wait for modules to load first, or just add the association when ready
    }
  }, [courseId, moduleId, courses]);

  const fetchCourses = async () => {
    const res = await fetch('/api/training/courses');
    if (res.ok) setCourses(await res.json());
  };

  const fetchModules = async (id: number) => {
    const res = await fetch(`/api/training/courses/${id}/modules`);
    if (res.ok) setModules(await res.json());
  };

  const addTarget = () => {
    if (!selectedCourseId || !selectedModuleId) return;
    const courseObj = courses.find(c => c.id === selectedCourseId);
    const moduleObj = modules.find(m => m.id === selectedModuleId);
    
    if (courseObj && moduleObj) {
      // Check if already exists
      const exists = targets.some(t => t.moduleId === selectedModuleId);
      if (!exists) {
        setTargets([...targets, {
          courseId: selectedCourseId,
          courseTitle: courseObj.title,
          moduleId: selectedModuleId,
          moduleTitle: moduleObj.title
        }]);
      }
    }
  };

  const removeTarget = (index: number) => {
    setTargets(targets.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure we have at least one target
    const finalModuleIds = targets.length > 0 
      ? targets.map(t => t.moduleId) 
      : selectedModuleId ? [selectedModuleId] : [];

    if (finalModuleIds.length === 0 || !title) {
      alert("Please select at least one Course and Module, and enter a title.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        module_id: finalModuleIds[0], // backward compatibility
        module_ids: finalModuleIds,  // bulk inserts support
        title,
        content_type: contentType,
        content_url: contentUrl,
        content_body: contentBody,
        order_index: orderIndex
      };

      const url = lesson ? `/api/training/lessons/${lesson.id}` : '/api/training/lessons';
      const method = lesson ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const savedData = await res.json();
        alert(lesson ? "Lesson updated successfully!" : "Educational content created/linked successfully!");
        onSave(savedData);
      } else {
        throw new Error("Failed to save lesson");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 text-left" dir="ltr">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
        <h2 className="text-2xl font-black text-slate-900 font-sans">
          {lesson ? 'Edit Educational Content' : 'Add New Educational Content'}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
           <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Associate with Programs & Modules (يمكن التكرار مع أكثر من برنامج/موديول)</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600">Select Training Course / Program</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
              >
                <option value="">-- Choose Course --</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>

            <div className="space-y-2">
               <label className="text-xs font-black text-slate-600">Select Module</label>
               <div className="flex gap-2">
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 p-3 border border-slate-200 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                    disabled={!selectedCourseId}
                  >
                    <option value="">-- Choose Module --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                  {!selectedModuleId && selectedCourseId && (
                     <button 
                      type="button"
                      onClick={async () => {
                         const title = prompt("New module title:");
                         if(title) {
                            const res = await fetch('/api/training/modules', {
                               method: 'POST',
                               headers: {'Content-Type': 'application/json'},
                               body: JSON.stringify({ course_id: selectedCourseId, title })
                            });
                          if(res.ok) fetchModules(selectedCourseId as number);
                       }
                    }}
                    className="p-3 bg-slate-900 text-white rounded-xl"
                   >
                      <Plus className="w-5 h-5" />
                   </button>
                )}
             </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={addTarget}
            disabled={!selectedCourseId || !selectedModuleId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add to Target List / ربط بالبرنامج
          </button>
        </div>

        {targets.length > 0 && (
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Linked Programs & Modules / البرامج والموديولات المرتبطة ({targets.length})</span>
            <div className="flex flex-wrap gap-2">
              {targets.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 pl-3 pr-2 py-1.5 rounded-xl shadow-sm text-xs font-bold text-slate-800">
                  <span className="text-blue-600">{t.courseTitle}</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-600">{t.moduleTitle}</span>
                  <button
                    type="button"
                    onClick={() => removeTarget(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-50 transition-all ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        <div className="space-y-2">
           <label className="text-sm font-black text-slate-700">Lesson / Content Title *</label>
           <input
             type="text"
             value={title}
             onChange={e => setTitle(e.target.value)}
             className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
             placeholder="e.g., Introduction to Customer Service"
             required
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Content Type</label>
              <div className="flex gap-2">
                 {[
                   { id: 'document', label: 'Article / Text', icon: FileText },
                   { id: 'video', label: 'Video', icon: Video },
                   { id: 'pdf', label: 'PDF File', icon: Upload },
                   { id: 'link', label: 'External Link', icon: Link }
                 ].map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setContentType(type.id)}
                      className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${contentType === type.id ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
                    >
                       <type.icon className="w-5 h-5" />
                       <span className="text-[10px] font-black">{type.label}</span>
                    </button>
                 ))}
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-sm font-black text-slate-700 font-sans">Content URL (Video / PDF / File)</label>
              <input
                type="text"
                value={contentUrl || ''}
                onChange={e => setContentUrl(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 font-mono text-left"
                placeholder={contentType === 'video' ? "https://youtube.com/..." : "https://..."}
              />
           </div>
         </div>

        <div className="space-y-2">
           <label className="text-sm font-black text-slate-700">Lesson Content (Detailed Description)</label>
           <textarea
             value={contentBody || ''}
             onChange={e => setContentBody(e.target.value)}
             rows={6}
             className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
             placeholder="Write detailed lesson content here..."
           />
        </div>

        <div className="flex gap-4 justify-end pt-6 border-t border-slate-100">
           <button
             type="button"
             onClick={onCancel}
             className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all"
           >
             Cancel
           </button>
           <button
             type="submit"
             disabled={saving}
             className="px-10 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
           >
             {saving ? 'Saving...' : (lesson ? 'Save Changes' : 'Create Content')}
           </button>
        </div>
      </form>
    </div>
  );
};

export default LessonBuilder;
