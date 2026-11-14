import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Hash, 
  MessageSquare, 
  Send, 
  Paperclip, 
  Search, 
  MoreVertical, 
  User, 
  Circle, 
  AtSign, 
  Settings, 
  Bell, 
  BellOff, 
  Image as ImageIcon, 
  File, 
  X,
  Plus,
  Activity,
  Trash2,
  Edit2,
  Megaphone,
  Link as LinkIcon,
  ExternalLink,
  FileText,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import ActivityFeed from './ActivityFeed';
import { uploadFileToStorage } from '../../lib/storage';

import { useAuth } from '../../context/AuthContext';

interface ChatRoom {
  id: number;
  name: string;
  type: 'channel' | 'dm' | 'contextual';
  department_id?: number;
  context_type?: string;
  context_id?: number;
  last_message?: string;
  last_message_at?: string;
}

interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  mentions: number[];
  is_system_message: boolean;
  is_announcement: boolean;
  created_at: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  reactions?: any[];
}

interface UserPresence {
  user_id: number;
  name: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  custom_status?: string;
}

export default function ChatSystem() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<any>(null);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'activity'>('chats');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);
  const typingTimeout = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user: currentUser } = useAuth();

  const safeSend = useCallback((data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
      return true;
    }
    console.warn("WebSocket not open. ReadyState:", ws.current?.readyState);
    return false;
  }, []);

  const connectWS = useCallback(() => {
    if (!currentUser?.id) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}`);

    socket.onopen = () => {
      console.log('Chat System: Connected and Live');
      socket.send(JSON.stringify({ type: 'AUTH', userId: currentUser?.id }));
      if (activeRoom) {
        socket.send(JSON.stringify({ type: 'CHAT_JOIN_ROOM', roomId: activeRoom.id }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'CHAT_NEW_MESSAGE') {
          if (activeRoom && data.message && data.message.room_id === activeRoom.id) {
            setMessages(prev => {
              if (prev.some(m => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
          // Update room last message
          if (data.message) {
            setRooms(prev => prev.map(r => 
              r.id === data.message.room_id 
                ? { ...r, last_message: data.message.content, last_message_at: data.message.created_at }
                : r
            ));
          }
        } else if (data.type === 'CHAT_USER_TYPING') {
          if (activeRoom && data.roomId === activeRoom.id) {
            setTypingUsers(prev => ({ ...prev, [data.userId]: data.isTyping }));
          }
        } else if (data.type === 'CHAT_MESSAGE_REACTIONS_UPDATE') {
          setMessages(prev => prev.map(m => 
            m.id === data.messageId ? { ...m, reactions: data.reactions } : m
          ));
        } else if (data.type === 'NOTIFICATION') {
          // Targeted notification check
          const notification = data.notification;
          if (notification && (!notification.user_id || notification.user_id === currentUser?.id)) {
            setNotifications(prev => {
              const newNotif = { 
                ...notification, 
                id: notification.id || `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
              };
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
            // Show browser notification if enabled
            if (notificationPrefs?.push_enabled && "Notification" in window && Notification.permission === "granted") {
              new Notification(notification.title || 'New Notification', { body: notification.message });
            }
          }
        }
      } catch (e) {
        console.error("Failed to parse chat WebSocket message", e);
      }
    };

    socket.onclose = () => {
      // Auto-reconnect for a live experience
      setTimeout(connectWS, 1000);
    };

    ws.current = socket;
  }, [currentUser?.id, activeRoom, notificationPrefs]);

  useEffect(() => {
    connectWS();
    fetchRooms();
    fetchPresence();
    fetchNotificationPrefs();
    fetchNotifications();
    fetchUsers();
    return () => ws.current?.close();
  }, [connectWS]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'x-user-id': currentUser?.id?.toString() || '1' }
      });
      const text = await res.text();
      if (!res.ok) {
        if (text.includes("Rate exceeded")) {
          console.warn('Fetch users rate limit hit');
          return;
        }
        throw new Error(`Status ${res.status}: ${text.substring(0, 50)}`);
      }
      const data = JSON.parse(text);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    setUploading(true);
    try {
      const uploaded = await uploadFileToStorage(file, 'chat-attachments');
      safeSend({
        type: 'CHAT_SEND_MESSAGE',
        content: `Shared a file: ${file.name}`,
        attachment_url: uploaded.url,
        attachment_name: file.name,
        attachment_type: file.type,
        is_announcement: false
      });
      setUploading(false);
    } catch (err) {
      console.error('Chat attachment upload failed:', err);
      setUploading(false);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const addReaction = (messageId: number, emoji: string) => {
    safeSend({
      type: 'CHAT_ADD_REACTION',
      messageId,
      emoji
    });
  };

  const fetchNotifications = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/notifications/${currentUser.id}`);
      const text = await res.text();
      if (!res.ok) {
        if (text.includes("Rate exceeded")) {
          console.warn('Fetch notifications rate limit hit');
          return;
        }
        throw new Error(`Status ${res.status}: ${text.substring(0, 50)}`);
      }
      const data = JSON.parse(text);
      setNotifications(Array.isArray(data) ? data.map((n: any) => ({ ...n, id: n.id || `init-${Math.random()}` })) : []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id);
      safeSend({ type: 'CHAT_JOIN_ROOM', roomId: activeRoom.id });
    }
  }, [activeRoom, safeSend]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchRooms = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/rooms?user_id=${currentUser.id}`);
      const text = await res.text();
      if (!res.ok) {
        if (text.includes("Rate exceeded")) {
          console.warn('Fetch rooms rate limit hit');
          return;
        }
        throw new Error(`Status ${res.status}: ${text.substring(0, 50)}`);
      }
      const data = JSON.parse(text);
      const roomsArray = Array.isArray(data) ? data : [];
      setRooms(roomsArray);
      if (roomsArray.length > 0 && !activeRoom) setActiveRoom(roomsArray[0]);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    }
  };

  const fetchMessages = async (roomId: number) => {
    try {
      const res = await fetch(`/api/chat/rooms/${roomId}/messages`);
      const text = await res.text();
      if (!res.ok) {
        if (text.includes("Rate exceeded")) {
          console.warn('Fetch messages rate limit hit');
          return;
        }
        throw new Error(`Status ${res.status}: ${text.substring(0, 50)}`);
      }
      const data = JSON.parse(text);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    }
  };

  const fetchPresence = async () => {
    try {
      const res = await fetch('/api/chat/presence');
      const text = await res.text();
      if (!res.ok) {
        if (text.includes("Rate exceeded")) {
          console.warn('Fetch presence rate limit hit');
          return;
        }
        throw new Error(`Status ${res.status}: ${text.substring(0, 50)}`);
      }
      const data = JSON.parse(text);
      setPresence(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch presence:', err);
      setPresence([]);
    }
  };

  const fetchNotificationPrefs = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/notifications/preferences/${currentUser.id}`);
      if (!res.ok) throw new Error('Response not OK');
      const data = await res.json();
      setNotificationPrefs(data);
    } catch (err) {
      console.warn('Notification preferences fetch failed, using defaults');
      setNotificationPrefs({
        email_enabled: true,
        push_enabled: true,
        chat_messages: true
      });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    safeSend({
      type: 'CHAT_SEND_MESSAGE',
      content: newMessage,
      mentions: extractMentions(newMessage),
      is_announcement: isAnnouncement
    });

    setNewMessage('');
    setIsAnnouncement(false);
    handleTyping(false);
  };

  const handleDeleteMessage = async (id: number) => {
    try {
      const res = await fetch(`/api/chat/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete message');
    }
  };

  const handleDeleteRoom = async (id: number) => {
    try {
      const res = await fetch(`/api/chat/rooms/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRooms(prev => prev.filter(r => r.id !== id));
        if (activeRoom?.id === id) setActiveRoom(null);
      }
    } catch (err) {
      console.error('Failed to delete room');
    }
  };

  const markRead = async (id: number) => {
    try {
      await fetch(`/api/chat/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read');
    }
  };

  const handleTyping = (typing: boolean) => {
    if (isTyping !== typing) {
      setIsTyping(typing);
      safeSend({
        type: 'CHAT_TYPING',
        isTyping: typing
      });
    }

    if (typing) {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => handleTyping(false), 3000);
    }
  };

  const extractMentions = (text: string) => {
    const matches = text.match(/@(\w+)/g);
    if (!matches) return [];
    
    return matches.map(match => {
      const name = match.substring(1).toLowerCase();
      const user = users.find(u => u.name?.toLowerCase().replace(/\s+/g, '') === name);
      return user ? user.id : null;
    }).filter(id => id !== null);
  };

  const renderContent = (content: string) => {
    if (!content || typeof content !== 'string') return '';
    
    // Split content by mentions to highlight them
    const parts = content.split(/(@\w+)/g);
    const renderedParts = parts.map((part, i) => {
      if (part.startsWith('@')) {
        const name = part.substring(1).toLowerCase();
        const user = users.find(u => u.name?.toLowerCase().replace(/\s+/g, '') === name);
        if (user) {
          return <span key={i} className="font-black text-indigo-200 underline cursor-help" title={user.email}>@{user.name}</span>;
        }
      }
      return part;
    });

    // Detect SOP/KB links
    const sopMatch = content.match(/SOP #(\d+)/);
    const kbMatch = content.match(/KB #(\d+)/);

    return (
      <div className="space-y-2">
        <p>{renderedParts}</p>
        
        {sopMatch && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-between group/link cursor-pointer hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Standard Operating Procedure</p>
                <p className="text-[10px] opacity-70">SOP ID: {sopMatch[1]}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </div>
        )}

        {kbMatch && (
          <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-between group/link cursor-pointer hover:bg-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Knowledge Base Article</p>
                <p className="text-[10px] opacity-70">KB ID: {kbMatch[1]}</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </div>
        )}
      </div>
    );
  };

  const updatePrefs = async (field: string, value: boolean) => {
    try {
      const updated = { ...notificationPrefs, [field]: value };
      setNotificationPrefs(updated);
      await fetch(`/api/chat/notifications/preferences/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (err) {
      console.error('Failed to update preferences');
    }
  };

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex gap-2">
          <button 
            onClick={() => setSidebarTab('chats')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              sidebarTab === 'chats' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <MessageSquare className="w-3 h-3" /> Chats
          </button>
          <button 
            onClick={() => setSidebarTab('activity')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
              sidebarTab === 'activity' ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Activity className="w-3 h-3" /> Activity
          </button>
        </div>

        {sidebarTab === 'chats' ? (
          <>
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-6">
              {isSearching && searchResults.length > 0 && (
                <div>
                  <div className="px-3 mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Search Results</span>
                    <button onClick={() => { setSearchQuery(''); setIsSearching(false); }} className="text-[10px] text-indigo-600 font-bold hover:underline">Clear</button>
                  </div>
                  {searchResults.map(result => (
                    <button
                      key={`search-${result.id}`}
                      onClick={() => {
                        const room = rooms.find(r => r.id === result.room_id);
                        if (room) {
                          setActiveRoom(room);
                          setIsSearching(false);
                          setSearchQuery('');
                        }
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 mb-1"
                    >
                      <p className="text-xs font-bold text-slate-900 truncate">{result.content}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">#{result.room_name} • {result.sender_name}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Channels */}
              <div>
                <div className="px-3 mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Channels</span>
                  <button 
                    onClick={() => setShowCreateRoom(true)}
                    className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                  >
                    <Plus className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
                {rooms.filter(r => r.type === 'channel').map(room => (
                  <div key={room.id} className="group relative">
                    <button
                      onClick={() => setActiveRoom(room)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all",
                        activeRoom?.id === room.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "hover:bg-slate-200 text-slate-600"
                      )}
                    >
                      <Hash className={cn("w-4 h-4", activeRoom?.id === room.id ? "text-indigo-200" : "text-slate-400")} />
                      <span className="text-sm font-medium truncate">{room.name}</span>
                    </button>
                    {currentUser?.role === 'Admin' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteRoom(room.id); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Direct Messages */}
              <div>
                <div className="px-3 mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Direct Messages</span>
                  <button className="p-1 hover:bg-slate-200 rounded-md transition-colors">
                    <Plus className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
                {rooms.filter(r => r.type === 'dm').map(room => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                      activeRoom?.id === room.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "hover:bg-slate-200 text-slate-600"
                    )}
                  >
                    <div className="relative">
                      <User className={cn("w-4 h-4", activeRoom?.id === room.id ? "text-indigo-200" : "text-slate-400")} />
                      <Circle className="absolute -bottom-0.5 -right-0.5 w-2 h-2 fill-emerald-500 text-emerald-500 border border-white" />
                    </div>
                    <span className="text-sm font-medium truncate">{room.name || 'User'}</span>
                  </button>
                ))}
              </div>

              {/* Contextual Chats */}
              <div>
                <div className="px-3 mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Contextual</span>
                </div>
                {rooms.filter(r => r.type === 'contextual').map(room => (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                      activeRoom?.id === room.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "hover:bg-slate-200 text-slate-600"
                    )}
                  >
                    <MessageSquare className={cn("w-4 h-4", activeRoom?.id === room.id ? "text-indigo-200" : "text-slate-400")} />
                    <div className="text-left truncate">
                      <span className="text-sm font-medium block truncate">{room.name}</span>
                      <span className={cn("text-[10px] uppercase tracking-tighter opacity-70", activeRoom?.id === room.id ? "text-white" : "text-slate-400")}>
                        {room.context_type}: {room.context_id}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-hidden">
            <ActivityFeed />
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-white flex gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-600"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold">Settings</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "p-2 rounded-xl transition-all relative",
                showNotifications ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-100 text-slate-400"
              )}
            >
              <Bell className="w-5 h-5" />
              {Array.isArray(notifications) && notifications.some(n => !n.is_read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />
              )}
            </button>
            
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
                >
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <button 
                      onClick={() => setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))}
                      className="text-[10px] font-bold text-indigo-600 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <BellOff className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markRead(n.id)}
                          className={cn(
                            "p-4 border-b border-slate-50 cursor-pointer transition-colors",
                            n.is_read ? "bg-white" : "bg-indigo-50/30 hover:bg-indigo-50/50"
                          )}
                        >
                          <p className="text-xs font-bold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1">
                            {n.created_at ? `${new Date(n.created_at).toLocaleDateString()} ${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '---'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeRoom ? (
          <>
            {/* Header */}
            <div className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  {activeRoom.type === 'channel' ? (
                    <Hash className="w-5 h-5 text-indigo-600" />
                  ) : activeRoom.type === 'dm' ? (
                    <User className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{activeRoom.name}</h3>
                  <div className="flex items-center gap-2">
                    <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Active Now</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUser?.id;
                const showAvatar = idx === 0 || messages[idx-1].sender_id !== msg.sender_id;
                
                return (
                  <div key={msg.id} className={cn("flex gap-3 group/msg", isMe ? "flex-row-reverse" : "flex-row")}>
                    {!isMe && (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {showAvatar ? <User className="w-4 h-4 text-slate-400" /> : null}
                      </div>
                    )}
                    <div className={cn("max-w-[70%] relative flex flex-col", isMe ? "items-end" : "items-start")}>
                      {showAvatar && !isMe && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">
                          {msg.sender_name}
                        </span>
                      )}
                      
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm shadow-sm group/bubble relative",
                        msg.is_announcement ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-xl" :
                        isMe ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-700 rounded-tl-none"
                      )}>
                        {msg.is_announcement && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-amber-200/50">
                            <Megaphone className="w-4 h-4 text-amber-600" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Announcement</span>
                          </div>
                        )}
                        
                        <div className="break-words">
                          {msg.content && renderContent(msg.content)}
                        </div>

                        {msg.attachment_url && (
                          <div className={cn(
                            "mt-3 p-3 rounded-xl border flex items-center gap-3",
                            isMe ? "bg-indigo-700/50 border-indigo-400/30" : "bg-white border-slate-200"
                          )}>
                            <div className={cn(
                              "w-10 h-10 rounded-lg flex items-center justify-center",
                              isMe ? "bg-indigo-400/20 text-indigo-200" : "bg-slate-100 text-slate-500"
                            )}>
                              {msg.attachment_type?.startsWith('image/') ? <ImageIcon className="w-5 h-5" /> : <File className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-bold truncate", isMe ? "text-white" : "text-slate-900")}>{msg.attachment_name}</p>
                              <p className={cn("text-[10px] opacity-60", isMe ? "text-indigo-200" : "text-slate-500")}>{(msg.attachment_type || 'File').toUpperCase()}</p>
                            </div>
                            <a 
                              href={msg.attachment_url} 
                              download={msg.attachment_name}
                              className={cn(
                                "p-2 rounded-lg transition-colors",
                                isMe ? "hover:bg-indigo-500 text-white" : "hover:bg-slate-100 text-indigo-600"
                              )}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        <div className={cn(
                          "absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-all flex gap-1",
                          isMe ? "right-full mr-2" : "left-full ml-2"
                        )}>
                          {['👍', '❤️', '🔥', '👏', '😮'].map(emoji => (
                            <button 
                              key={emoji}
                              onClick={() => addReaction(msg.id, emoji)}
                              className="w-8 h-8 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center hover:scale-110 transition-transform text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reactions Display */}
                      {(msg as any).reactions && (msg as any).reactions.length > 0 && (
                        <div className={cn("flex flex-wrap gap-1 mt-2", isMe ? "justify-end" : "justify-start")}>
                          {(msg as any).reactions.map((r: any) => (
                            <button 
                              key={r.emoji}
                              onClick={() => addReaction(msg.id, r.emoji)}
                              className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5",
                                r.user_ids?.includes(currentUser?.id) 
                                  ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                              )}
                            >
                              <span>{r.emoji}</span>
                              <span>{r.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className={cn(
                        "flex items-center gap-2 mt-1 px-1",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className="text-[9px] text-slate-400">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                        </span>
                        {isMe && (
                          <button 
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 opacity-0 group-hover/msg:opacity-100 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {Object.entries(typingUsers).some(([id, typing]) => typing && Number(id) !== currentUser?.id) && (
                <div className="flex items-center gap-2 text-slate-400 italic text-xs animate-pulse">
                  <Circle className="w-1.5 h-1.5 fill-slate-300 text-slate-300" />
                  Someone is typing...
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {isAnnouncement && (
                  <div className="flex items-center justify-between bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Megaphone className="w-4 h-4" />
                      <span className="text-xs font-bold">Posting as Announcement</span>
                    </div>
                    <button onClick={() => setIsAnnouncement(false)} className="text-amber-400 hover:text-amber-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping(true);
                    }}
                    placeholder={isAnnouncement ? "Type your announcement..." : `Message ${activeRoom.name}...`}
                    className={cn(
                      "w-full pl-12 pr-24 py-4 border rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all",
                      isAnnouncement ? "bg-amber-50/30 border-amber-200" : "bg-slate-50 border-slate-200"
                    )}
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className={cn(
                        "p-1 hover:bg-slate-200 rounded-md text-slate-400 transition-colors",
                        uploading && "animate-pulse"
                      )}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {activeRoom.type === 'channel' && (
                      <button 
                        type="button" 
                        onClick={() => setIsAnnouncement(!isAnnouncement)}
                        className={cn(
                          "p-1.5 rounded-lg transition-all",
                          isAnnouncement ? "bg-amber-100 text-amber-600" : "hover:bg-slate-200 text-slate-400"
                        )}
                      >
                        <Megaphone className="w-4 h-4" />
                      </button>
                    )}
                    <button type="button" className="p-1 hover:bg-slate-200 rounded-md text-slate-400 transition-colors">
                      <AtSign className="w-4 h-4" />
                    </button>
                    <button 
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Internal Communication Engine</h2>
            <p className="text-slate-500 max-w-sm">Select a channel or direct message to start collaborating with your team in real-time.</p>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">Chat Preferences</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">Notification Channels</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Push Notifications</span>
                      </div>
                      <button 
                        onClick={() => updatePrefs('push_enabled', !notificationPrefs?.push_enabled)}
                        className={cn("w-10 h-5 rounded-full transition-all relative", notificationPrefs?.push_enabled ? "bg-emerald-500" : "bg-slate-200")}
                      >
                        <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", notificationPrefs?.push_enabled ? "right-1" : "left-1")} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">WhatsApp Alerts</span>
                      </div>
                      <button 
                        onClick={() => updatePrefs('whatsapp_enabled', !notificationPrefs?.whatsapp_enabled)}
                        className={cn("w-10 h-5 rounded-full transition-all relative", notificationPrefs?.whatsapp_enabled ? "bg-emerald-500" : "bg-slate-200")}
                      >
                        <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", notificationPrefs?.whatsapp_enabled ? "right-1" : "left-1")} />
                      </button>
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-4">Content Alerts</h4>
                  <div className="space-y-4">
                    {[
                      { id: 'sop_updates', label: 'SOP Updates' },
                      { id: 'crm_updates', label: 'CRM Deal Updates' },
                      { id: 'qa_alerts', label: 'QA Critical Alerts' }
                    ].map(item => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">{item.label}</span>
                        <button 
                          onClick={() => updatePrefs(item.id, !notificationPrefs?.[item.id])}
                          className={cn("w-10 h-5 rounded-full transition-all relative", notificationPrefs?.[item.id] ? "bg-emerald-500" : "bg-slate-200")}
                        >
                          <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", notificationPrefs?.[item.id] ? "right-1" : "left-1")} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreateRoom && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const data = Object.fromEntries(formData.entries());
                
                try {
                  const res = await fetch('/api/chat/rooms', {
                    method: 'POST',
                    headers: { 
                      'Content-Type': 'application/json',
                      'x-user-id': currentUser?.id?.toString() || '1'
                    },
                    body: JSON.stringify({
                      name: data.name,
                      type: data.type,
                      member_ids: [currentUser.id]
                    })
                  });
                  if (res.ok) {
                    const room = await res.json();
                    setRooms(prev => [room, ...prev]);
                    setActiveRoom(room);
                    setShowCreateRoom(false);
                  }
                } catch (err) {
                  console.error('Failed to create room');
                }
              }}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Create New Channel</h3>
                  <button type="button" onClick={() => setShowCreateRoom(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Channel Name</label>
                    <input 
                      name="name" 
                      required 
                      type="text" 
                      placeholder="e.g. general-discussion" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
                    <select 
                      name="type" 
                      defaultValue="channel"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="channel">Public Channel</option>
                      <option value="dm">Direct Message Group</option>
                    </select>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    Create Channel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
