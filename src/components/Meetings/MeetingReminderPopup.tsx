import React, { useState, useEffect } from 'react';
import { Video, Clock, X, ExternalLink, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWithRetry, safeJsonResponse } from '../../lib/utils';

interface Attendee {
  id: number;
  name: string;
  email: string;
}

interface Meeting {
  id: number;
  title: string;
  description: string;
  meeting_time: string;
  type: 'online' | 'offline';
  meeting_link: string | null;
  location: string | null;
  attendees: Attendee[];
}

export default function MeetingReminderPopup() {
  const { user } = useAuth();
  const [activeReminders, setActiveReminders] = useState<Meeting[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  useEffect(() => {
    if (!user) return;

    const checkMeetings = async () => {
      try {
        const res = await fetchWithRetry('/api/meetings');
        const meetingsData = await safeJsonResponse(res, []);
        const meetings: Meeting[] = Array.isArray(meetingsData) ? meetingsData : [];

        const now = new Date();
        const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

        const upcoming = meetings.filter(meeting => {
          // Check if already dismissed
          if (dismissedIds.includes(meeting.id)) return false;

          // Check if current user is an attendee
          const isAttendee = meeting.attendees?.some(a => a.id === user.id);
          if (!isAttendee) return false;

          const meetingTime = new Date(meeting.meeting_time);
          
          // Check if meeting starts in the future and within the next 15 minutes
          return meetingTime > now && meetingTime <= fifteenMinutesLater;
        });

        setActiveReminders(upcoming);
      } catch {
        // Quietly ignore transient network polling errors
      }
    };

    // Delay initial check by 20s to ensure zero impact on initial application boot
    const initialTimer = setTimeout(checkMeetings, 20000);
    const interval = setInterval(checkMeetings, 90000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [user, dismissedIds]);

  const dismissReminder = (id: number) => {
    setDismissedIds(prev => [...prev, id]);
    setActiveReminders(prev => prev.filter(m => m.id !== id));
  };

  if (activeReminders.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-[9999] w-96 space-y-3 pointer-events-none font-sans">
      <AnimatePresence>
        {activeReminders.map((meeting) => {
          const meetingTime = new Date(meeting.meeting_time);
          const minutesLeft = Math.max(1, Math.round((meetingTime.getTime() - Date.now()) / 60000));

          return (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-fuchsia-200 shadow-2xl p-5 pointer-events-auto relative overflow-hidden dir-rtl text-right"
            >
              {/* Top gradient border decoration */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-fuchsia-500 to-indigo-500" />

              <button 
                onClick={() => dismissReminder(meeting.id)}
                className="absolute left-3 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-3 mt-1">
                <div className="p-2.5 bg-fuchsia-100 text-fuchsia-600 rounded-xl mt-0.5">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    اجتماع عاجل بعد {minutesLeft} دقيقة
                  </span>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                    {meeting.title}
                  </h4>
                  <div className="flex items-center gap-1 text-slate-500 text-xs font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{meetingTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => dismissReminder(meeting.id)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition"
                >
                  إغلاق التنبيه
                </button>
                {meeting.type === 'online' && meeting.meeting_link ? (
                  <a
                    href={meeting.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-xs font-extrabold flex items-center gap-1 shadow-sm transition"
                  >
                    انضمام مباشر (Google Meet)
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 border border-slate-200">
                    <MapPin className="w-3 h-3" />
                    المكان: {meeting.location || 'بمقر الشركة'}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
