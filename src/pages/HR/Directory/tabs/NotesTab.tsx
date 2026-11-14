import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  MessageSquare, Plus, Trash2, Send, Clock, Edit, Eye, 
  Mail, BellRing, Repeat, Calendar, AlertCircle, Paperclip 
} from 'lucide-react';
import { EmployeeProfileOutletContext } from './types';

export const NotesTab: React.FC = () => {
  const { 
    employee, 
    currentUser, 
    isViewOnly, 
    onSaveEmployeeDetails, 
    showCustomToast 
  } = useOutletContext<EmployeeProfileOutletContext>();

  const [notesSubTab, setNotesSubTab] = useState<'comments' | 'history' | 'all'>('comments');
  const [newCommentText, setNewCommentText] = useState<string>('');

  const empComments: any[] = (employee?.personal_info as any)?.comments || [];
  const empLogs: any[] = (employee?.personal_info as any)?.logs || [
    { 
      id: 'init-1', 
      action_type: 'created', 
      details: 'Employee profile registered in the core HR system.', 
      created_at: employee?.joined_at || employee?.created_at || new Date().toISOString() 
    }
  ];

  const handleAddEmployeeComment = async () => {
    if (!newCommentText.trim()) {
      showCustomToast('Please enter a comment', 'error');
      return;
    }

    const commentId = `comment-${Date.now()}`;
    const newComment = {
      id: commentId,
      author_name: currentUser?.name || 'HR Specialist',
      content: newCommentText.trim(),
      created_at: new Date().toISOString()
    };

    const logId = `log-${Date.now()}`;
    const newLog = {
      id: logId,
      action_type: 'comment_added',
      details: `New comment: "${newCommentText.substring(0, 50)}${newCommentText.length > 50 ? '...' : ''}" by ${currentUser?.name || 'HR Specialist'}`,
      created_at: new Date().toISOString()
    };

    const updatedPersonalInfo = {
      ...(employee?.personal_info || {}),
      comments: [newComment, ...empComments],
      logs: [newLog, ...empLogs]
    };

    try {
      await onSaveEmployeeDetails({ personal_info: updatedPersonalInfo });
      setNewCommentText('');
      showCustomToast('Comment added successfully!', 'success');
    } catch {
      showCustomToast('Failed to save comment', 'error');
    }
  };

  const handleDeleteEmployeeComment = async (commentId: string) => {
    const remainingComments = empComments.filter((c: any) => c.id !== commentId);
    
    const logId = `log-${Date.now()}`;
    const newLog = {
      id: logId,
      action_type: 'edit_profile',
      details: `Comment deleted by ${currentUser?.name || 'HR Specialist'}`,
      created_at: new Date().toISOString()
    };

    const updatedPersonalInfo = {
      ...(employee?.personal_info || {}),
      comments: remainingComments,
      logs: [newLog, ...empLogs]
    };

    try {
      await onSaveEmployeeDetails({ personal_info: updatedPersonalInfo });
      showCustomToast('Comment deleted successfully!', 'success');
    } catch {
      showCustomToast('Failed to delete comment', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Horizontal notes sub-tabs */}
      <div className="flex gap-6 border-b border-slate-200 pb-3 items-center">
        {[
          { id: 'comments', label: `Comments (${empComments.length})` },
          { id: 'history', label: `History (${empLogs.length})` },
          { id: 'all', label: 'All' }
        ].map(sub => {
          const isActive = notesSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setNotesSubTab(sub.id as any)}
              className={`text-xs font-black transition-all pb-3 relative cursor-pointer ${
                isActive ? 'text-[#1b5e20]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {sub.label}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1b5e20] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Sub-tab 1: Comments */}
      {(notesSubTab === 'comments' || notesSubTab === 'all') && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 font-serif">Comments</h2>
          
          {/* New Comment Box */}
          {!isViewOnly && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black text-[#1b5e20] mb-4 uppercase tracking-wider">New Comment</h3>
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-600 border border-slate-200 shrink-0 uppercase">
                  {currentUser?.name ? currentUser.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : 'US'}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="relative">
                    <textarea
                      rows={3}
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full border border-slate-200 rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-green-500/20 focus:border-[#1b5e20] focus:outline-none shadow-inner"
                    />
                    <Paperclip className="absolute bottom-3 right-4 w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddEmployeeComment}
                      className="bg-[#1b5e20] text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-green-800 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments Feed List */}
          <div className="space-y-4">
            {empComments.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-xs font-bold">
                No comments posted yet.
              </div>
            ) : (
              empComments.map((comment: any) => (
                <div key={comment.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 relative group">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#1b5e20] font-bold text-xs flex items-center justify-center uppercase border border-emerald-100">
                        {(comment.author_name || 'User').split(' ').map((n: string) => n[0]).join('').substring(0,2)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-xs block">{comment.author_name}</span>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {comment?.created_at ? new Date(comment.created_at).toLocaleString() : '—'}
                        </span>
                      </div>
                    </div>
                    {!isViewOnly && (
                      <button 
                        onClick={() => handleDeleteEmployeeComment(comment.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 text-xs font-medium leading-relaxed pr-6">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: History */}
      {(notesSubTab === 'history' || notesSubTab === 'all') && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-800 font-serif">Employee History</h2>
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
            {/* Interactive dynamic timeline */}
            <div className="relative border-l border-slate-100 pl-6 ml-4 space-y-6">
              {empLogs.map((log: any, idx: number) => {
                let icon = <Clock className="w-3 h-3 text-slate-500" />;
                let colorClass = "bg-slate-100 border-slate-200";
                let title = log.title || "System Action";

                if (log.action_type === 'created') {
                  icon = <Plus className="w-3 h-3 text-slate-600" />;
                  colorClass = "bg-slate-100 border-slate-200";
                  title = log.title || "Employee Registered";
                } else if (log.action_type === 'comment_added') {
                  icon = <MessageSquare className="w-3 h-3 text-blue-600" />;
                  colorClass = "bg-blue-100 border-blue-200";
                  title = log.title || "New Note Added";
                } else if (log.action_type === 'edit_profile') {
                  icon = <Edit className="w-3 h-3 text-purple-600" />;
                  colorClass = "bg-purple-100 border-purple-200";
                  title = log.title || "Profile Info Updated";
                } else if (log.action_type === 'view_profile') {
                  icon = <Eye className="w-3 h-3 text-emerald-600" />;
                  colorClass = "bg-emerald-100 border-emerald-200";
                  title = log.title || "Viewed Employee File";
                } else if (log.action_type === 'email_sent') {
                  icon = <Mail className="w-3 h-3 text-sky-600" />;
                  colorClass = "bg-sky-100 border-sky-200";
                  title = log.title || "Email Sent";
                } else if (log.action_type === 'alarm_sent') {
                  icon = <BellRing className="w-3 h-3 text-amber-600" />;
                  colorClass = "bg-amber-100 border-amber-200";
                  title = log.title || "Notice / Alarm Sent";
                } else if (log.action_type === 'shift_swap') {
                  icon = <Repeat className="w-3 h-3 text-indigo-600" />;
                  colorClass = "bg-indigo-100 border-indigo-200";
                  title = log.title || "Shift Swap Requested";
                } else if (log.action_type === 'leave_request') {
                  icon = <Calendar className="w-3 h-3 text-teal-600" />;
                  colorClass = "bg-teal-100 border-teal-200";
                  title = log.title || "Leave Requested";
                } else if (log.action_type === 'complaint_filed') {
                  icon = <AlertCircle className="w-3 h-3 text-rose-600" />;
                  colorClass = "bg-rose-100 border-rose-200";
                  title = log.title || "Complaint Filed";
                }

                return (
                  <div key={log.id || idx} className="relative">
                    <div className={`absolute -left-[36px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${colorClass}`}>
                      {icon}
                    </div>
                    <div className="pl-2 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-black block uppercase tracking-wider">{title}</span>
                        {log.performed_by && (
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            By: {log.performed_by}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-800 block bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100 leading-relaxed">{log.details}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        📅 {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;
