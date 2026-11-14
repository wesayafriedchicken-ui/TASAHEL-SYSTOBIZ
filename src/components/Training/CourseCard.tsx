import React from 'react';
import { Edit3, Trash2, Users, Clock, BookOpen } from 'lucide-react';

interface CourseCardProps {
  course: any;
  isAdmin: boolean;
  onEdit?: (course: any) => void;
  onDelete?: (id: number) => void;
  onViewDetails?: (course: any) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, isAdmin, onEdit, onDelete, onViewDetails }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col h-full" dir="ltr">
      <div className="h-2 bg-blue-600 w-full" />
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
            course.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {course.status}
          </span>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit?.(course)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                title="Edit"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onDelete?.(course.id)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1 text-left">{course.title}</h3>
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed text-left">{course.description}</p>
        
        <div className="mt-auto">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-slate-600 justify-start">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold">{course.enrolled_count || 0} Trainees</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 justify-start">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold">{course.department_name}</span>
            </div>
          </div>
          
          <button 
            onClick={() => onViewDetails?.(course)}
            className="w-full py-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-slate-700 font-black text-sm transition-all border border-slate-200 active:scale-[0.98]"
          >
            View Details & Analytics
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
