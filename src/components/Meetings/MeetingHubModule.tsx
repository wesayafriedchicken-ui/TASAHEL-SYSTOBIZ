import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Calendar, 
  MapPin, 
  Users, 
  Sparkles, 
  Trash2, 
  Plus, 
  Link as LinkIcon, 
  CheckCircle2, 
  Clock, 
  Search, 
  Settings, 
  Loader2, 
  ChevronRight, 
  AlertCircle,
  FileText,
  Bookmark,
  ExternalLink,
  Edit,
  X,
  List,
  LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import DeleteConfirmation from '../Common/DeleteConfirmation';

interface Attendee {
  id: number;
  name: string;
  email: string;
  job_title?: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  meeting_time: string;
  type: 'online' | 'offline';
  meeting_link: string | null;
  location: string | null;
  ai_summary: string | null;
  attendees: Attendee[];
  created_at: string;
}

export default function MeetingHubModule() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [usersList, setUsersList] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'history' | 'secretary' | 'integration'>('history');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [type, setType] = useState<'online' | 'offline'>('online');
  const [location, setLocation] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<number[]>([]);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Secretary states
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | ''>('');
  const [rawNotes, setRawNotes] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'online' | 'offline'>('all');

  // New states for Delete Confirmation, List/Board Toggle, and Editing
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Edit Meeting form states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMeetingTime, setEditMeetingTime] = useState('');
  const [editType, setEditType] = useState<'online' | 'offline'>('online');
  const [editLocation, setEditLocation] = useState('');
  const [editSelectedAttendees, setEditSelectedAttendees] = useState<number[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [meetingsRes, usersRes] = await Promise.all([
        fetch('/api/meetings'),
        fetch('/api/users')
      ]);

      if (meetingsRes.ok) {
        const data = await meetingsRes.json();
        setMeetings(data);
      }
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time updates via websocket if page is open
    const handleUpdate = () => {
      fetchData();
    };
    window.addEventListener('focus', handleUpdate);
    return () => window.removeEventListener('focus', handleUpdate);
  }, []);

  // Sync edit state values when editingMeeting changes
  useEffect(() => {
    if (editingMeeting) {
      setEditTitle(editingMeeting.title);
      setEditDescription(editingMeeting.description || '');
      
      // Format meeting_time safely for datetime-local input
      const date = new Date(editingMeeting.meeting_time);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      setEditMeetingTime(localISOTime);
      
      setEditType(editingMeeting.type);
      setEditLocation(editingMeeting.location || '');
      setEditSelectedAttendees(editingMeeting.attendees ? editingMeeting.attendees.map(a => a.id) : []);
      setEditError('');
    }
  }, [editingMeeting]);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title || !meetingTime) {
      setFormError('يرجى ملء الحقول المطلوبة: عنوان الاجتماع والوقت.');
      return;
    }

    if (type === 'offline' && !location) {
      setFormError('يرجى تحديد مكان أو قاعة الاجتماع للاجتماعات الحضورية.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '1'
        },
        body: JSON.stringify({
          title,
          description,
          meeting_time: meetingTime,
          type,
          location,
          attendee_ids: selectedAttendees
        })
      });

      if (res.ok) {
        setFormSuccess('تم إنشاء وجدولة الاجتماع بنجاح، وتم إرسال الإشعارات للموظفين التلقائية!');
        // Reset form
        setTitle('');
        setDescription('');
        setMeetingTime('');
        setLocation('');
        setSelectedAttendees([]);
        fetchData();
        // Switch to history after 1.5 seconds
        setTimeout(() => {
          setActiveTab('history');
          setFormSuccess('');
        }, 1500);
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'فشل في جدولة الاجتماع.');
      }
    } catch (err) {
      setFormError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeeting = (id: number) => {
    setShowDeleteConfirm(id);
  };

  const handleConfirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      const res = await fetch(`/api/meetings/${showDeleteConfirm}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id?.toString() || '1'
        }
      });
      if (res.ok) {
        setMeetings(prev => prev.filter(m => m.id !== showDeleteConfirm));
        setShowDeleteConfirm(null);
      } else {
        alert('فشل حذف الاجتماع.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;
    setEditError('');

    if (!editTitle || !editMeetingTime) {
      setEditError('يرجى ملء الحقول المطلوبة: عنوان الاجتماع والوقت.');
      return;
    }

    if (editType === 'offline' && !editLocation) {
      setEditError('يرجى تحديد مكان أو قاعة الاجتماع للاجتماعات الحضورية.');
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/meetings/${editingMeeting.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '1'
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          meeting_time: editMeetingTime,
          type: editType,
          location: editLocation,
          attendee_ids: editSelectedAttendees
        })
      });

      if (res.ok) {
        setEditingMeeting(null);
        fetchData();
      } else {
        const errData = await res.json();
        setEditError(errData.error || 'فشل في تعديل الاجتماع.');
      }
    } catch (err) {
      setEditError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleGenerateAISummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError('');
    setAiSuccessMsg('');

    if (!selectedMeetingId) {
      setAiError('يرجى اختيار الاجتماع أولاً.');
      return;
    }
    if (!rawNotes.trim()) {
      setAiError('يرجى كتابة أو لصق ملاحظات ونقاشات الاجتماع لتوليد الملخص.');
      return;
    }

    setGeneratingAI(true);
    try {
      const res = await fetch(`/api/meetings/${selectedMeetingId}/ai-summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id?.toString() || '1'
        },
        body: JSON.stringify({ notes: rawNotes })
      });

      if (res.ok) {
        setAiSuccessMsg('تم توليد ملخص الاجتماع بالذكاء الاصطناعي بنجاح، وتم تحويل التوصيات لمهام تنفيذية حية وإرسالها للموظفين!');
        setRawNotes('');
        setSelectedMeetingId('');
        fetchData();
      } else {
        const errData = await res.json();
        setAiError(errData.error || 'فشل توليد ملخص الذكاء الاصطناعي.');
      }
    } catch (err) {
      setAiError('حدث خطأ أثناء معالجة البيانات عبر الذكاء الاصطناعي.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const toggleAttendee = (id: number) => {
    setSelectedAttendees(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const toggleEditAttendee = (id: number) => {
    setEditSelectedAttendees(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = (m.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const getMeetingCategory = (meetingTimeStr: string): 'upcoming' | 'today' | 'past' => {
    const mDate = new Date(meetingTimeStr);
    const now = new Date();
    
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const meetingDay = new Date(mDate.getFullYear(), mDate.getMonth(), mDate.getDate());
    
    if (meetingDay.getTime() === today.getTime()) {
      return 'today';
    } else if (mDate.getTime() < now.getTime()) {
      return 'past';
    } else {
      return 'upcoming';
    }
  };

  const upcomingMeetings = filteredMeetings.filter(m => getMeetingCategory(m.meeting_time) === 'upcoming');
  const todayMeetings = filteredMeetings.filter(m => getMeetingCategory(m.meeting_time) === 'today');
  const pastMeetings = filteredMeetings.filter(m => getMeetingCategory(m.meeting_time) === 'past');

  const renderMeetingCard = (meeting: Meeting, isBoard = false) => {
    return (
      <div 
        key={meeting.id} 
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition duration-200 relative flex flex-col justify-between"
      >
        {/* Top Meta */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              meeting.type === 'online' 
                ? 'bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100' 
                : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              {meeting.type === 'online' ? (
                <>
                  <Video className="w-3.5 h-3.5" />
                  أونلاين
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  حضوري بمقر الشركة
                </>
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedMeetingId(meeting.id);
                  setActiveTab('secretary');
                }}
                title="توليد ملخص الذكاء الاصطناعي"
                className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingMeeting(meeting)}
                title="تعديل الاجتماع"
                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteMeeting(meeting.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Time */}
          <h3 className="text-xl font-bold text-slate-900 leading-snug">{meeting.title}</h3>
          
          <div className="flex items-center gap-2 text-slate-500 text-xs mt-2 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(meeting.meeting_time).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })}</span>
          </div>

          {meeting.description && (
            <p className={`text-slate-600 text-sm mt-3 leading-relaxed whitespace-pre-wrap ${isBoard ? 'line-clamp-2' : 'line-clamp-3'}`}>
              {meeting.description}
            </p>
          )}

          {/* Connection Details */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
            {meeting.type === 'online' ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500 font-medium text-right">رابط الانضمام المباشر:</span>
                {meeting.meeting_link ? (
                  <a 
                    href={meeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-fuchsia-600 hover:underline flex items-center gap-1 truncate max-w-[150px]"
                  >
                    رابط مباشر
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs text-amber-600 font-semibold">جاري التوليد...</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-xs">قاعة / مكان الاجتماع:</span>
                <span className="font-bold text-xs text-slate-950 truncate">{meeting.location || 'غير محدد'}</span>
              </div>
            )}
          </div>

          {/* Invited Attendees */}
          {meeting.attendees && meeting.attendees.length > 0 && (
            <div className="mt-4">
              <span className="text-xs text-slate-400 font-semibold block mb-2">المدعوين والموظفين المستهدفين:</span>
              <div className="flex flex-wrap gap-1.5">
                {meeting.attendees.map(attendee => (
                  <span 
                    key={attendee.id}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200"
                  >
                    <Users className="w-3 h-3 text-slate-400" />
                    {attendee.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Summary Block if exists */}
        {meeting.ai_summary && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-violet-700 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              ملخص الذكاء الاصطناعي والتوصيات الفورية:
            </h4>
            <div className="bg-violet-50/50 p-4 rounded-xl border border-violet-100/60 text-slate-700 text-xs leading-relaxed max-h-40 overflow-y-auto">
              <div className="prose prose-xs max-w-none text-slate-800">
                {meeting.ai_summary.split('\n').map((line, i) => (
                  <p key={i} className="mb-1">{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 dir-rtl text-right font-sans">
      {/* Module Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-fuchsia-100 text-fuchsia-600 rounded-xl">
              <Video className="w-8 h-8" />
            </span>
            مركز الاجتماعات الذكي (Meeting Hub)
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">
            إدارة كاملة للاجتماعات الأونلاين والزيارات الحضورية مع ميزة السكرتير والملخص التلقائي بالذكاء الاصطناعي وتوزيع التكليفات.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'history' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            سجل الاجتماعات
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'schedule' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            جدولة اجتماع جديد
          </button>
          <button
            onClick={() => setActiveTab('secretary')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'secretary' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            سكرتير الـ AI
          </button>
          <button
            onClick={() => setActiveTab('integration')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'integration' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            الربط بالـ APIs
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
          <span className="text-slate-500 text-sm">جاري تحميل بيانات الاجتماعات...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* TAB 1: HISTORY */}
          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Filter & View Mode Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="البحث عن اجتماع أو موضوع..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-sm font-medium">نوع الاجتماع:</span>
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterType === 'all' 
                          ? 'bg-slate-900 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      onClick={() => setFilterType('online')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterType === 'online' 
                          ? 'bg-fuchsia-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      أونلاين
                    </button>
                    <button
                      onClick={() => setFilterType('offline')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        filterType === 'offline' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      حضوري
                    </button>
                  </div>

                  {/* View Switcher (List - Board) */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        viewMode === 'list' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      قائمة
                    </button>
                    <button
                      onClick={() => setViewMode('board')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        viewMode === 'board' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      لوحة (Board)
                    </button>
                  </div>
                </div>
              </div>

              {/* Empty State */}
              {filteredMeetings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">لا توجد اجتماعات مجدولة</h3>
                  <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
                    لم يتم العثور على اجتماعات تطابق البحث. ابدأ بجدولة اجتماعك الأول الآن.
                  </p>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className="mt-4 px-4 py-2 bg-fuchsia-600 text-white rounded-lg text-sm font-semibold hover:bg-fuchsia-700 transition shadow-sm"
                  >
                    جدولة اجتماع جديد
                  </button>
                </div>
              ) : viewMode === 'list' ? (
                /* LIST VIEW MODE */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredMeetings.map((meeting) => renderMeetingCard(meeting, false))}
                </div>
              ) : (
                /* BOARD VIEW MODE */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  {/* Column 1: Today */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 animate-pulse" />
                        <h3 className="font-extrabold text-slate-800 text-sm md:text-base">اجتماعات اليوم</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-fuchsia-100 text-fuchsia-700 text-xs font-extrabold rounded-lg">
                        {todayMeetings.length}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {todayMeetings.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">لا توجد اجتماعات مجدولة لليوم.</div>
                      ) : (
                        todayMeetings.map(meeting => renderMeetingCard(meeting, true))
                      )}
                    </div>
                  </div>

                  {/* Column 2: Upcoming */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <h3 className="font-extrabold text-slate-800 text-sm md:text-base">الاجتماعات القادمة</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-extrabold rounded-lg">
                        {upcomingMeetings.length}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {upcomingMeetings.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">لا توجد اجتماعات قادمة مجدولة.</div>
                      ) : (
                        upcomingMeetings.map(meeting => renderMeetingCard(meeting, true))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Past */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <h3 className="font-extrabold text-slate-800 text-sm md:text-base">الاجتماعات المنتهية</h3>
                      </div>
                      <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-extrabold rounded-lg">
                        {pastMeetings.length}
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      {pastMeetings.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">لا توجد اجتماعات سابقة.</div>
                      ) : (
                        pastMeetings.map(meeting => renderMeetingCard(meeting, true))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: SCHEDULE */}
          {activeTab === 'schedule' && (
            <motion.div
              key="schedule-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
                  تحديد تفاصيل وجدولة الاجتماع
                </h3>

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleCreateMeeting} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">عنوان الاجتماع <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      placeholder="مثال: مراجعة خطة التسويق للربع الثالث"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">أجندة الاجتماع ووصفه</label>
                    <textarea
                      rows={4}
                      placeholder="اكتب المحاور والموضوعات الأساسية التي ستتم مناقشتها..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">نوع الاجتماع <span className="text-rose-500">*</span></label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setType('online')}
                          className={`py-1.5 rounded-md text-xs font-bold transition ${
                            type === 'online' 
                              ? 'bg-white text-fuchsia-600 shadow-sm' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          أونلاين (Meet/Zoom)
                        </button>
                        <button
                          type="button"
                          onClick={() => setType('offline')}
                          className={`py-1.5 rounded-md text-xs font-bold transition ${
                            type === 'offline' 
                              ? 'bg-white text-blue-600 shadow-sm' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          حضوري بالشركة
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">التاريخ والوقت <span className="text-rose-500">*</span></label>
                      <input
                        type="datetime-local"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500"
                        required
                      />
                    </div>
                  </div>

                  {type === 'offline' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl"
                    >
                      <label className="block text-sm font-semibold text-slate-700 mb-1">موقع/غرفة الاجتماعات المحددة <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: قاعة مجلس الإدارة - الطابق الثاني"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={type === 'offline'}
                      />
                    </motion.div>
                  )}

                  {type === 'online' && (
                    <div className="p-4 bg-fuchsia-50/50 border border-fuchsia-100 rounded-xl text-xs text-fuchsia-700">
                      <strong>معلومة:</strong> سيقوم السيستم تلقائياً بإنشاء رابط اجتماع رسمي عبر Google Meet وحفظه وإرساله لجميع الموظفين المدعوين، وسيقوم بإنشاء تذكير وبوب آب قبل البدء بـ 15 دقيقة.
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition flex items-center gap-2 shadow-md disabled:bg-slate-400"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري الجدولة وتوزيع المهام...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          حفظ وجدولة الاجتماع
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Multi-select Attendees */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-400" />
                  المدعوين والمنشن
                </h3>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  اختر الموظفين والمديرين لإرسال إشعارات فورية لهم، وجدولة مهام حقيقية في لوحات التحكم الخاصة بهم تلقائياً.
                </p>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {usersList.map((userObj) => (
                    <button
                      type="button"
                      key={userObj.id}
                      onClick={() => toggleAttendee(userObj.id)}
                      className={`w-full p-2.5 rounded-xl border text-right transition flex items-center justify-between ${
                        selectedAttendees.includes(userObj.id)
                          ? 'border-fuchsia-300 bg-fuchsia-50/50 text-fuchsia-950 font-medium'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold">{userObj.name}</div>
                        <div className="text-xs text-slate-400">{userObj.job_title || userObj.email}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        selectedAttendees.includes(userObj.id)
                          ? 'bg-fuchsia-600 border-fuchsia-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {selectedAttendees.includes(userObj.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: AI SECRETARY */}
          {activeTab === 'secretary' && (
            <motion.div
              key="secretary-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Form Input for Transcript */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2 text-violet-700 mb-4">
                  <Sparkles className="w-6 h-6 text-violet-600 animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-900 m-0">توليد ملخص وتكليفات بالذكاء الاصطناعي</h3>
                </div>
                <p className="text-slate-500 text-sm mb-5 leading-relaxed">
                  اكتب أو ألصق النقاط والملاحظات العشوائية أو النقاشات الكاملة التي دارت خلال الاجتماع. سيقوم الذكاء الاصطناعي بتحليلها بالكامل وتوليد ملخص تنفيذي مرتب، مع صياغة قرارات واضحة، واستخراج مهام حقيقية وتعيينها فوراً للموظفين المستهدفين!
                </p>

                {aiError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{aiError}</span>
                  </div>
                )}

                {aiSuccessMsg && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-800 rounded-xl text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>{aiSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleGenerateAISummary} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">اختر الاجتماع المستهدف</label>
                    <select
                      value={selectedMeetingId}
                      onChange={(e) => setSelectedMeetingId(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      required
                    >
                      <option value="">-- حدد الاجتماع المطلوب --</option>
                      {meetings.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({new Date(m.meeting_time).toLocaleDateString('ar-EG')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">نقاشات وتفاصيل ومحاور الاجتماع</label>
                    <textarea
                      rows={10}
                      placeholder="ألصق هنا تفاصيل الاجتماع... على سبيل المثال: 
- ناقشنا مع سارة إطلاق الحملة الإعلانية وسوف تبدأ بها يوم الأربعاء القادم.
- طلب المدير من أحمد مراجعة الكود البرمجي وإرساله لعميل الاختبار قبل نهاية الأسبوع.
- تقرر تعديل موعد إطلاق المنتج ليكون نهاية الشهر."
                      value={rawNotes}
                      onChange={(e) => setRawNotes(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                      required
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={generatingAI || !selectedMeetingId || !rawNotes}
                      className="px-6 py-3 bg-violet-600 text-white rounded-lg text-sm font-bold hover:bg-violet-700 transition flex items-center gap-2 shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {generatingAI ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري تحليل الاجتماع وتوليد المهام...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          توليد الملخص والمهام التنفيذية الحية
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Side Panel showing information */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mb-3 border-b border-slate-200 pb-2">
                    <FileText className="w-4 h-4 text-violet-600" />
                    كيف تعمل أتمتة سكرتير الذكاء الاصطناعي؟
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span><strong>التحليل الدقيق:</strong> يقوم نموذج Gemini 3.5 بتمشيط وتلخيص النقاط والاتفاقات تلقائياً وصياغة ملخص متقن ومحترف باللغة العربية.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span><strong>استخراج القرارات:</strong> تتم بلورة القرارات المصيرية بنقاط منفصلة وحفظها مباشرة داخل سجل الاجتماع ليرجع إليها الجميع.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full mt-1.5 flex-shrink-0" />
                      <span><strong>إسناد المهام الفورية:</strong> يحول الذكاء الاصطناعي كل تكلّيف عشوائي لمهمة صريحة، ويسجلها فوراً في موديول المهام الرئيسي للموظف المعني مع وضع ميعاد نهائي وتنبيه فوري!</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 p-4 bg-violet-50 rounded-xl border border-violet-100 text-xs text-violet-800">
                  <p className="font-semibold mb-1">💡 نصيحة للحصول على أفضل النتائج:</p>
                  من الأفضل ذكر أسماء الموظفين صراحة في الملاحظات (مثال: "أحمد سيقوم بـ...") ليقوم النظام بربط التكليف بالموظف الصحيح بدقة متناهية.
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: INTEGRATION */}
          {activeTab === 'integration' && (
            <motion.div
              key="integration-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-3xl mx-auto text-center space-y-6"
            >
              <div className="w-16 h-16 bg-fuchsia-50 text-fuchsia-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Video className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">ربط وتنشيط الـ APIs الرسمية</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-lg mx-auto">
                  يدعم موديول الاجتماعات الربط التلقائي والذكي مع Google Calendar و Google Meet و Zoom APIs. بمجرد التنشيط، سيتم توليد روابط أصلية ومحمية تلقائياً خلف الكواليس وحجز المواعيد في تقاويم الموظفين.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                <div className="border border-slate-200 rounded-2xl p-5 text-right flex flex-col justify-between hover:border-fuchsia-500 transition shadow-sm bg-slate-50/50">
                  <div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-extrabold rounded-md uppercase">متصل تلقائياً</span>
                    <h4 className="text-base font-bold mt-2 text-slate-900">Google Meet Integration</h4>
                    <p className="text-xs text-slate-500 mt-1">توليد تلقائي للروابط وحجز مواعيد Google Calendar الذكية للمدعوين والموظفين.</p>
                  </div>
                  <button className="mt-4 w-full py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition">
                    إعادة التهيئة
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl p-5 text-right flex flex-col justify-between hover:border-blue-500 transition shadow-sm bg-slate-50/50">
                  <div>
                    <span className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-extrabold rounded-md uppercase">خادم السحابة الذكي</span>
                    <h4 className="text-base font-bold mt-2 text-slate-900">Zoom Conferences API</h4>
                    <p className="text-xs text-slate-500 mt-1">توليد فوري لغرف اجتماعات زووم الآمنة وتشفير روابط الانضمام وكلمات السر.</p>
                  </div>
                  <button className="mt-4 w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition">
                    تفعيل الربط والـ API
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 text-xs text-slate-400">
                حماية فائقة للتشفير لجميع الروابط والشهادات المستخدمة في توليد غرف الفيديو الآمنة.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* EDIT MEETING MODAL OVERLAY */}
      <AnimatePresence>
        {editingMeeting && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] text-right dir-rtl"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
                      <Edit className="w-5 h-5" />
                    </span>
                    تعديل تفاصيل الاجتماع
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">تعديل الأجندة، الموعد، الموقع والموظفين المدعوين لهذا الاجتماع</p>
                </div>
                <button 
                  onClick={() => setEditingMeeting(null)} 
                  className="p-2 hover:bg-slate-200 rounded-xl transition"
                >
                  <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">عنوان الاجتماع <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        placeholder="مثال: مراجعة خطة التسويق"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">أجندة الاجتماع ووصفه</label>
                      <textarea
                        rows={4}
                        placeholder="اكتب تفاصيل الاجتماع..."
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">نوع الاجتماع <span className="text-rose-500">*</span></label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setEditType('online')}
                            className={`py-1.5 rounded-md text-xs font-bold transition ${
                              editType === 'online' 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            أونلاين (Google Meet)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditType('offline')}
                            className={`py-1.5 rounded-md text-xs font-bold transition ${
                              editType === 'offline' 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            حضوري بالشركة
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">التاريخ والوقت <span className="text-rose-500">*</span></label>
                        <input
                          type="datetime-local"
                          value={editMeetingTime}
                          onChange={(e) => setEditMeetingTime(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    {editType === 'offline' && (
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">موقع/غرفة الاجتماعات المحددة <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="مثال: قاعة مجلس الإدارة"
                          value={editLocation}
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required={editType === 'offline'}
                        />
                      </div>
                    )}

                    {editType === 'online' && (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs text-indigo-700">
                        <strong>تنبيه:</strong> سيتم مراجعة وتحديث روابط Google Meet تلقائياً وإخطار الموظفين المدعوين بالتغييرات الجديدة.
                      </div>
                    )}
                  </div>

                  {/* Edit Attendees List */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      تعديل المدعوين والمنشن
                    </h4>
                    <div className="space-y-1.5 overflow-y-auto max-h-[300px] flex-1 pr-1">
                      {usersList.map((userObj) => {
                        const isSelected = editSelectedAttendees.includes(userObj.id);
                        return (
                          <button
                            type="button"
                            key={userObj.id}
                            onClick={() => toggleEditAttendee(userObj.id)}
                            className={`w-full p-2 rounded-lg border text-right transition flex items-center justify-between ${
                              isSelected
                                ? 'border-indigo-300 bg-indigo-50/40 text-indigo-950 font-medium'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="truncate">
                              <div className="text-xs font-bold truncate">{userObj.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{userObj.job_title || userObj.email}</div>
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all flex-shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-150 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleUpdateMeeting}
                  disabled={editSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:bg-slate-400"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation 
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleConfirmDelete}
        title="حذف الاجتماع"
        message="هل أنت متأكد من رغبتك في إلغاء وحذف هذا الاجتماع؟ لا يمكن التراجع عن هذا الإجراء وسيتم إزالته وتكليفاته وتنبيهاته المرتبطة تماماً."
      />
    </div>
  );
}
