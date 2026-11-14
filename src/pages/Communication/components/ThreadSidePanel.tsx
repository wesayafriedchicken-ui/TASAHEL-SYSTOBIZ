import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { useComm } from '../context/CommContext';
import { CommMessage } from '../types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

export const ThreadSidePanel: React.FC = () => {
  const { activeThread, closeThread, currentUser } = useComm();
  const [parentMsg, setParentMsg] = useState<CommMessage | null>(null);
  const [replies, setReplies] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const repliesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch thread replies
  const fetchThreadData = useCallback(async () => {
    if (!activeThread?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages/${activeThread.id}/replies`);
      if (res.ok) {
        const data = await res.json();
        setParentMsg(data.parent || activeThread);
        setReplies(data.replies || []);
      }
    } catch (e) {
      console.error('Failed to load thread replies:', e);
    } finally {
      setLoading(false);
    }
  }, [activeThread]);

  useEffect(() => {
    if (activeThread) {
      setParentMsg(activeThread);
      setReplies([]);
      fetchThreadData();
    }
  }, [activeThread, fetchThreadData]);

  // Scroll to bottom on new reply
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies.length]);

  if (!activeThread) return null;

  const handleSendReply = async (data: {
    content: string;
    mentions?: number[];
    is_announcement?: boolean;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    audio_duration?: number;
  }) => {
    try {
      const res = await fetch(`/api/chat/rooms/${activeThread.room_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sender_id: currentUser?.id,
          parent_id: activeThread.id,
        }),
      });

      if (res.ok) {
        const newReply: CommMessage = await res.json();
        setReplies((prev) => [...prev, newReply]);
      }
    } catch (e) {
      console.error('Failed to send reply:', e);
    }
  };

  const handleToggleReaction = async (msgId: number, emoji: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${msgId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: currentUser?.id }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update parent reaction if matches
        if (parentMsg && parentMsg.id === msgId) {
          setParentMsg((prev) => (prev ? { ...prev, reactions: data.reactions } : null));
        }
        // Update replies reaction
        setReplies((prev) =>
          prev.map((r) => (r.id === msgId ? { ...r, reactions: data.reactions } : r))
        );
      }
    } catch (e) {
      console.error('Failed to toggle reaction:', e);
    }
  };

  return (
    <div className="w-80 sm:w-96 md:w-[420px] h-full flex flex-col bg-white border-l border-slate-200 shadow-xl z-20 animate-slideLeft">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-800">Thread</h3>
          <span className="text-xs text-slate-400 font-medium">
            ({replies.length} {replies.length === 1 ? 'reply' : 'replies'})
          </span>
        </div>
        <button
          onClick={closeThread}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          title="Close thread"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Thread Content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3">
        {/* Parent Message Card */}
        {parentMsg && (
          <div className="pb-3">
            <MessageBubble
              message={parentMsg}
              onToggleReaction={handleToggleReaction}
              isThreadView={true}
            />
          </div>
        )}

        {/* Replies Divider */}
        <div className="py-2.5 flex items-center gap-2">
          <div className="flex-1 h-[1px] bg-slate-200" />
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {replies.length === 0 ? 'No replies yet' : `${replies.length} Replies`}
          </span>
          <div className="flex-1 h-[1px] bg-slate-200" />
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Chronological Replies */}
        <div className="space-y-2 pt-2">
          {replies.map((reply) => (
            <MessageBubble
              key={reply.id}
              message={reply}
              onToggleReaction={handleToggleReaction}
              isThreadView={true}
            />
          ))}
          <div ref={repliesEndRef} />
        </div>
      </div>

      {/* Thread Input Bar */}
      <MessageInput
        onSendMessage={handleSendReply}
        placeholder="Reply to thread..."
        isAnnouncementAllowed={false}
      />
    </div>
  );
};
