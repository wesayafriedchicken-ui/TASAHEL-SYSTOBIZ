import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Briefcase, 
  Building2, 
  Loader2, 
  ArrowDown, 
  Clock,
  ShieldCheck
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { CommMessage, CommChannel, CommUser, PresenceStatus } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { supabase } from '../../../lib/supabase';
import { formatRelativeTime } from '../utils/mediaCompressor';

const STATUS_CONFIG: Record<PresenceStatus, { label: string; dot: string; text: string }> = {
  online: { label: 'Online', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  busy: { label: 'Busy / In Meeting', dot: 'bg-rose-500', text: 'text-rose-600' },
  away: { label: 'Away', dot: 'bg-amber-400', text: 'text-amber-600' },
  offline: { label: 'Offline', dot: 'bg-slate-400', text: 'text-slate-400' },
};

export const DirectMessageChatView: React.FC = () => {
  const { recipientUserId } = useParams<{ recipientUserId: string }>();
  const { employees, currentUser, userPresences, getOrCreateDmRoom, playNotificationSound, refreshRooms } = useComm();

  const [dmRoom, setDmRoom] = useState<CommChannel | null>(null);
  const [recipient, setRecipient] = useState<CommUser | null>(null);
  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Recipient info
  useEffect(() => {
    if (!recipientUserId) return;
    const found = employees.find((e) => String(e.id) === String(recipientUserId));
    if (found) {
      setRecipient(found);
    } else {
      setRecipient({
        id: Number(recipientUserId),
        name: `User #${recipientUserId}`,
        email: '',
      });
    }
  }, [recipientUserId, employees]);

  // Load or create the DM room
  useEffect(() => {
    let isMounted = true;
    if (!recipientUserId) return;

    const initDm = async () => {
      setLoading(true);
      try {
        const room = await getOrCreateDmRoom(Number(recipientUserId));
        if (isMounted) {
          setDmRoom(room);
        }
      } catch (err) {
        console.error('Failed to init DM room:', err);
      }
    };

    initDm();

    return () => {
      isMounted = false;
    };
  }, [recipientUserId, getOrCreateDmRoom]);

  // Fetch 30 latest messages when dmRoom is known
  const fetchMessages = useCallback(async () => {
    if (!dmRoom?.id) return;
    setLoading(true);
    setHasMore(true);

    try {
      const res = await fetch(`/api/chat/rooms/${dmRoom.id}/messages?limit=30`);
      if (res.ok) {
        const data: CommMessage[] = await res.json();
        setMessages(data);
        if (data.length < 30) setHasMore(false);
      }
    } catch (e) {
      console.error('Failed to fetch DM messages:', e);
    } finally {
      setLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
    }
  }, [dmRoom?.id]);

  useEffect(() => {
    if (dmRoom?.id) {
      fetchMessages();
    }
  }, [dmRoom?.id, fetchMessages]);

  // Infinite Scroll: fetch older 30 messages
  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    setShowScrollBottom(!isNearBottom);

    if (container.scrollTop < 40 && !loadingMore && hasMore && messages.length > 0 && dmRoom?.id) {
      setLoadingMore(true);
      const oldestId = messages[0].id;
      const scrollHeightBefore = container.scrollHeight;

      try {
        const res = await fetch(
          `/api/chat/rooms/${dmRoom.id}/messages?limit=30&before_id=${oldestId}`
        );
        if (res.ok) {
          const older: CommMessage[] = await res.json();
          if (older.length < 30) setHasMore(false);
          if (older.length > 0) {
            setMessages((prev) => [...older, ...prev]);
            requestAnimationFrame(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                  messagesContainerRef.current.scrollHeight - scrollHeightBefore;
              }
            });
          }
        }
      } catch (e) {
        console.error('Failed to load older messages:', e);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Realtime subscription (Supabase + WebSocket)
  useEffect(() => {
    if (!dmRoom?.id) return;

    try {
      const roomRealtime = supabase
        .channel(`comm:dm:${dmRoom.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${dmRoom.id}`,
          },
          (payload) => {
            const newMsg = payload.new as CommMessage;
            if (!newMsg.parent_id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              if (Number(newMsg.sender_id) !== Number(currentUser?.id)) {
                playNotificationSound(true);
              }
              scrollToBottom();
            }
          }
        )
        .subscribe();

      realtimeChannelRef.current = roomRealtime;
    } catch (e) {}

    // WebSocket fallback
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'CHAT_JOIN',
          userId: currentUser?.id,
          roomId: Number(dmRoom.id),
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_NEW_MESSAGE' && data.message) {
          const incoming: CommMessage = data.message;
          if (Number(incoming.room_id) === Number(dmRoom.id) && !incoming.parent_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });
            if (Number(incoming.sender_id) !== Number(currentUser?.id)) {
              playNotificationSound(true);
            }
            scrollToBottom();
          }
        }
      } catch (err) {}
    };

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [dmRoom?.id, currentUser?.id, playNotificationSound]);

  // Send message
  const handleSendMessage = async (data: {
    content: string;
    mentions?: number[];
    is_announcement?: boolean;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
    audio_duration?: number;
  }) => {
    if (!dmRoom?.id) return;

    try {
      const res = await fetch(`/api/chat/rooms/${dmRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          sender_id: currentUser?.id,
        }),
      });

      if (res.ok) {
        const sent: CommMessage = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
        scrollToBottom();
        refreshRooms();

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'CHAT_SEND_MESSAGE',
              content: data.content,
              mentions: data.mentions,
              attachment_url: data.attachment_url,
              attachment_name: data.attachment_name,
              attachment_type: data.attachment_type,
              audio_duration: data.audio_duration,
            })
          );
        }
      }
    } catch (e) {
      console.error('Error sending DM:', e);
    }
  };

  // Toggle reaction
  const handleToggleReaction = async (messageId: number, emoji: string) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: currentUser?.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, reactions: data.reactions } : m))
        );
      }
    } catch (e) {}
  };

  const recipientPresence = recipientUserId
    ? userPresences[Number(recipientUserId)]?.status || 'offline'
    : 'offline';

  const recipientCustomStatus = recipientUserId
    ? userPresences[Number(recipientUserId)]?.custom_status
    : undefined;

  const recipientLastSeen = recipientUserId
    ? userPresences[Number(recipientUserId)]?.last_seen
    : undefined;

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
      {/* Header with Recipient Info */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {recipient?.avatar_url ? (
              <img
                src={recipient.avatar_url}
                alt=""
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-700 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {recipient?.name?.charAt(0) || 'U'}
              </div>
            )}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_CONFIG[recipientPresence].dot}`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {recipient?.name || 'Direct Message'}
              </h2>
              <span className={`text-[10px] font-semibold ${STATUS_CONFIG[recipientPresence].text}`}>
                {STATUS_CONFIG[recipientPresence].label}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
              {recipient?.job_title && (
                <span>{recipient.job_title}</span>
              )}
              {recipient?.department && (
                <span>• {recipient.department}</span>
              )}
              {recipientCustomStatus && (
                <span className="italic text-slate-600">"{recipientCustomStatus}"</span>
              )}
            </div>
          </div>
        </div>

        {recipient?.email && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            <Mail className="w-3.5 h-3.5" />
            <span className="truncate max-w-[200px]">{recipient.email}</span>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 relative divide-y divide-slate-50"
      >
        {loadingMore && (
          <div className="flex justify-center py-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Loading earlier messages...
            </span>
          </div>
        )}

        {/* Start of Direct Message Profile Hero Card */}
        {!hasMore && !loading && (
          <div className="py-8 px-6 bg-slate-50/70 rounded-2xl border border-slate-200 text-center mb-6 max-w-lg mx-auto">
            <div className="relative inline-block mb-3">
              {recipient?.avatar_url ? (
                <img
                  src={recipient.avatar_url}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-md mx-auto"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center ring-4 ring-white shadow-md mx-auto">
                  {recipient?.name?.charAt(0) || 'U'}
                </div>
              )}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${STATUS_CONFIG[recipientPresence].dot}`}
              />
            </div>

            <h3 className="text-base font-bold text-slate-800">{recipient?.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {recipient?.job_title || 'Colleague'} • {recipient?.department || 'Operations Team'}
            </p>

            <p className="text-xs text-slate-500 mt-3 max-w-sm mx-auto leading-relaxed">
              This is the start of your direct message history with <strong className="text-slate-700">{recipient?.name}</strong>. Messages and shared files here are direct and private.
            </p>

            {recipientLastSeen && recipientPresence === 'offline' && (
              <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400 mt-3 font-mono">
                <Clock className="w-3 h-3" />
                <span>Last active {formatRelativeTime(recipientLastSeen)}</span>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-xs">
            <span>No messages yet. Send a direct message or voice note to begin!</span>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onToggleReaction={handleToggleReaction}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center z-10"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Box */}
      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder={`Direct message ${recipient?.name || 'colleague'}...`}
        isAnnouncementAllowed={false}
      />
    </div>
  );
};
