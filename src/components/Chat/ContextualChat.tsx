import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, User, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

import { useAuth } from '../../context/AuthContext';

interface ContextualChatProps {
  contextType: 'sop' | 'crm_deal' | 'risk' | 'task';
  contextId: number;
  contextName: string;
}

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  created_at: string;
}

export default function ContextualChat({ contextType, contextId, contextName }: ContextualChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (isOpen) {
      initChat();
    }
    return () => ws.current?.close();
  }, [isOpen, contextId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initChat = async () => {
    if (!currentUser?.id) return;
    try {
      // 1. Find or create room
      const res = await fetch('/api/chat/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${contextName} Discussion`,
          type: 'contextual',
          context_type: contextType,
          context_id: contextId,
          member_ids: [currentUser.id]
        })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const room = await res.json();
      setRoomId(room.id);

      // 2. Fetch messages
      const msgRes = await fetch(`/api/chat/rooms/${room.id}/messages`);
      if (!msgRes.ok) throw new Error(`HTTP ${msgRes.status}`);
      const msgData = await msgRes.json();
      setMessages(Array.isArray(msgData) ? msgData : []);

      // 3. Connect WS
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}`);
      
      socket.onopen = () => {
        if (!currentUser?.id || !room?.id) return;
        socket.send(JSON.stringify({ type: 'AUTH', userId: currentUser.id }));
        socket.send(JSON.stringify({ type: 'CHAT_JOIN_ROOM', roomId: room.id }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'CHAT_NEW_MESSAGE' && data.message && data.message.room_id === room.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
        } catch (e) {
          console.error("Failed to parse contextual chat WebSocket message", e);
        }
      };

      ws.current = socket;
    } catch (err) {
      console.error('Failed to init contextual chat');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !roomId) return;

    ws.current?.send(JSON.stringify({
      type: 'CHAT_SEND_MESSAGE',
      content: newMessage
    }));

    setNewMessage('');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition-all z-40 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute right-full mr-4 px-3 py-1 bg-slate-900 text-white text-[10px] uppercase tracking-widest font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Contextual Chat
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 w-96 h-[600px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden contextual-chat no-print"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold truncate max-w-[200px]">{contextName}</h4>
                  <span className="text-[10px] uppercase tracking-widest opacity-70 font-medium">Contextual Discussion</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUser?.id;
                return (
                  <div key={msg.id} className={cn("flex gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                    {!isMe && (
                      <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-slate-400" />
                      </div>
                    )}
                    <div className={cn("max-w-[80%]", isMe ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-3 py-1.5 rounded-xl text-xs shadow-sm",
                        isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <span className="text-[8px] text-slate-400 mt-1 block">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="relative">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
