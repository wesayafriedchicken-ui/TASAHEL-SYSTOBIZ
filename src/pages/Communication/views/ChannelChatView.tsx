import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Hash, 
  Lock, 
  Users, 
  Search, 
  Loader2, 
  Megaphone,
  ArrowDown,
  Settings,
  Edit3
} from 'lucide-react';
import { useComm } from '../context/CommContext';
import { CommMessage, CommChannel } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { ChannelSettingsModal } from '../components/ChannelSettingsModal';
import { supabase } from '../../../lib/supabase';

export const ChannelChatView: React.FC = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const { channels, currentUser, playNotificationSound, refreshRooms } = useComm();

  const [messages, setMessages] = useState<CommMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [channelInfo, setChannelInfo] = useState<CommChannel | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'members' | 'edit' | 'danger'>('members');

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Find current channel from context or fetch
  useEffect(() => {
    if (!channelId) return;
    const found = channels.find((c) => String(c.id) === String(channelId));
    if (found) {
      setChannelInfo(found);
    }
  }, [channelId, channels]);

  // Initial fetch: 30 latest messages (per requirements to reduce egress and quota)
  const fetchInitialMessages = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    setHasMore(true);

    try {
      const res = await fetch(`/api/chat/rooms/${channelId}/messages?limit=30`);
      if (res.ok) {
        const data: CommMessage[] = await res.json();
        setMessages(data);
        if (data.length < 30) {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error('Failed to fetch channel messages:', e);
    } finally {
      setLoading(false);
      // Auto-scroll to bottom after initial load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 50);
    }
  }, [channelId]);

  useEffect(() => {
    fetchInitialMessages();
  }, [fetchInitialMessages]);

  // Infinite Scroll: Load older 30 messages when user scrolls to top
  const handleScroll = async () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Show or hide floating scroll-to-bottom button
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    setShowScrollBottom(!isNearBottom);

    // If scrolled near top and more messages exist
    if (container.scrollTop < 40 && !loadingMore && hasMore && messages.length > 0) {
      setLoadingMore(true);
      const oldestId = messages[0].id;
      const scrollHeightBefore = container.scrollHeight;

      try {
        const res = await fetch(
          `/api/chat/rooms/${channelId}/messages?limit=30&before_id=${oldestId}`
        );
        if (res.ok) {
          const olderMessages: CommMessage[] = await res.json();
          if (olderMessages.length < 30) {
            setHasMore(false);
          }
          if (olderMessages.length > 0) {
            setMessages((prev) => [...olderMessages, ...prev]);

            // Preserve scroll position
            requestAnimationFrame(() => {
              if (messagesContainerRef.current) {
                const scrollHeightAfter = messagesContainerRef.current.scrollHeight;
                messagesContainerRef.current.scrollTop = scrollHeightAfter - scrollHeightBefore;
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to load older messages:', err);
      } finally {
        setLoadingMore(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Real-time listener: Supabase Realtime channel + WebSocket fallback
  useEffect(() => {
    if (!channelId) return;

    // 1. Supabase Postgres Changes / Broadcast
    try {
      const roomRealtime = supabase.channel(`comm:channel:${channelId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `room_id=eq.${channelId}`,
          },
          (payload) => {
            const newMsg = payload.new as CommMessage;
            if (!newMsg.parent_id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });

              if (Number(newMsg.sender_id) !== Number(currentUser?.id)) {
                const isMention = newMsg.mentions?.includes(Number(currentUser?.id));
                playNotificationSound(isMention);
              }
              scrollToBottom();
            }
          }
        )
        .subscribe();

      realtimeChannelRef.current = roomRealtime;
    } catch (e) {}

    // 2. WebSocket fallback to ensure 100% message delivery
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: 'CHAT_JOIN',
          userId: currentUser?.id,
          roomId: Number(channelId),
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_NEW_MESSAGE' && data.message) {
          const incoming: CommMessage = data.message;
          if (Number(incoming.room_id) === Number(channelId) && !incoming.parent_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;
              return [...prev, incoming];
            });

            if (Number(incoming.sender_id) !== Number(currentUser?.id)) {
              const isMention = incoming.mentions?.includes(Number(currentUser?.id));
              playNotificationSound(isMention);
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
  }, [channelId, currentUser?.id, playNotificationSound]);

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
    if (!channelId) return;

    try {
      const res = await fetch(`/api/chat/rooms/${channelId}/messages`, {
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

        // Broadcast to WS
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'CHAT_SEND_MESSAGE',
              content: data.content,
              mentions: data.mentions,
              is_announcement: data.is_announcement,
              attachment_url: data.attachment_url,
              attachment_name: data.attachment_name,
              attachment_type: data.attachment_type,
              audio_duration: data.audio_duration,
            })
          );
        }
      }
    } catch (e) {
      console.error('Error posting message:', e);
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
    } catch (e) {
      console.error('Reaction error:', e);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    try {
      const res = await fetch(`/api/chat/messages/${messageId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      }
    } catch (e) {}
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
      {/* Channel Header */}
      <div className="h-14 px-4 sm:px-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
            {channelInfo?.is_private ? (
              <Lock className="w-4 h-4 text-amber-500" />
            ) : (
              <Hash className="w-4 h-4 text-slate-600" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 truncate">
                {channelInfo?.name || `Channel #${channelId}`}
              </h2>
              {channelInfo?.is_private && (
                <span className="text-[10px] bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.5 rounded border border-amber-200">
                  Private
                </span>
              )}
            </div>
            {channelInfo?.description && (
              <p className="text-xs text-slate-500 truncate max-w-md">
                {channelInfo.description}
              </p>
            )}
          </div>
        </div>

        {/* Channel Details / Members */}
        <div className="flex items-center gap-2 text-xs">
          {/* Members button */}
          <button
            type="button"
            onClick={() => {
              setSettingsTab('members');
              setShowSettingsModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold border border-slate-200 rounded-xl transition-colors"
            title="View & manage channel members"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {channelInfo?.member_count !== undefined && channelInfo?.member_count !== null
                ? `${channelInfo.member_count} Members`
                : 'Members'}
            </span>
          </button>

          {/* Edit / Channel settings button */}
          <button
            type="button"
            onClick={() => {
              setSettingsTab('edit');
              setShowSettingsModal(true);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 transition-colors"
            title="Channel Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 relative divide-y divide-slate-50"
      >
        {/* Loading older indicator (Infinite scroll top) */}
        {loadingMore && (
          <div className="flex justify-center py-2">
            <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Loading older messages...
            </span>
          </div>
        )}

        {/* Start of channel banner if no more messages */}
        {!hasMore && !loading && (
          <div className="py-6 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Hash className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Welcome to #{channelInfo?.name || 'channel'}!
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              This is the very start of the #{channelInfo?.name} channel. Send a message, voice note, or attachment to collaborate.
            </p>
          </div>
        )}

        {/* Messages List */}
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
            <Hash className="w-8 h-8 text-slate-300 mb-2" />
            <span>No messages yet. Be the first to say hello!</span>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onToggleReaction={handleToggleReaction}
              onDeleteMessage={handleDeleteMessage}
            />
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 right-6 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center z-10"
          title="Scroll to latest"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Box */}
      <MessageInput
        onSendMessage={handleSendMessage}
        placeholder={`Message #${channelInfo?.name || 'channel'}...`}
        isAnnouncementAllowed={true}
      />

      {/* Channel Settings & Members Modal */}
      {channelInfo && (
        <ChannelSettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          channel={channelInfo}
          initialTab={settingsTab}
          onChannelUpdated={(updated) => {
            setChannelInfo(updated);
            refreshRooms();
          }}
          onChannelDeleted={() => {
            refreshRooms();
            navigate('/comm');
          }}
        />
      )}
    </div>
  );
};
