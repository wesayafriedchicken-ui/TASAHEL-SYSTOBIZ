import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AtSign, 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  Clock, 
  Loader2, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { CommNotification } from '../types';
import { formatRelativeTime } from '../utils/mediaCompressor';

export const ActivityMentionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, refreshRooms } = useComm();

  const [notifications, setNotifications] = useState<CommNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'mentions' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/notifications/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to load activity:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const markAllRead = async () => {
    try {
      await fetch(`/api/chat/notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {}
  };

  const handleNotificationClick = (notif: CommNotification) => {
    // If notification has action_url or channel reference
    if (notif.action_url) {
      navigate(notif.action_url);
    } else {
      // Navigate to general channel or DMs
      navigate('/comm/channels/1');
    }
  };

  // Filtered notifications
  const filtered = notifications.filter((n) => {
    if (filter === 'mentions') {
      return (
        n.title.toLowerCase().includes('mention') ||
        n.message.toLowerCase().includes('mentioned')
      );
    }
    if (filter === 'unread') {
      return !n.is_read;
    }
    return true;
  });

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <AtSign className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Activity & Mentions</h2>
            <p className="text-[11px] text-slate-500">Track all your team interactions, mentions, and updates</p>
          </div>
        </div>

        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-all"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-3 bg-white border-b border-slate-200 flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('mentions')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            filter === 'mentions'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          @ Mentions
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
            filter === 'unread'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-2">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">You're all caught up!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              When teammates mention you or reply to your threads, you'll see them right here.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                !item.is_read
                  ? 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-500/10'
                  : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  !item.is_read
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <AtSign className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 font-mono">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                  {item.message}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-300 self-center shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
