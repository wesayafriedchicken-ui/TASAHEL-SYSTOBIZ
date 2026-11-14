import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { CommChannel, CommUser, CommMessage, PresenceStatus, CommNotification, CommSettings } from '../types';
import { audioChimes } from '../utils/audioNotification';

interface CommContextValue {
  currentUser: any;
  channels: CommChannel[];
  dms: CommChannel[];
  employees: CommUser[];
  userPresences: Record<number, { status: PresenceStatus; custom_status?: string; last_seen?: string }>;
  myStatus: PresenceStatus;
  myCustomStatus: string;
  setMyStatus: (status: PresenceStatus) => Promise<void>;
  setMyCustomStatus: (status: string) => Promise<void>;
  unreadActivityCount: number;
  activeThread: CommMessage | null;
  openThread: (msg: CommMessage) => void;
  closeThread: () => void;
  settings: CommSettings;
  updateSettings: (newSettings: Partial<CommSettings>) => void;
  refreshRooms: () => Promise<void>;
  createChannel: (data: { name: string; description?: string; is_private?: boolean; member_ids?: number[] }) => Promise<CommChannel>;
  updateChannel: (channelId: number, data: { name?: string; description?: string; is_private?: boolean; department_id?: number | null }) => Promise<CommChannel>;
  deleteChannel: (channelId: number) => Promise<void>;
  getChannelMembers: (channelId: number) => Promise<CommUser[]>;
  addChannelMember: (channelId: number, userId: number | number[]) => Promise<void>;
  removeChannelMember: (channelId: number, userId: number) => Promise<void>;
  getOrCreateDmRoom: (recipientId: number) => Promise<CommChannel>;
  playNotificationSound: (isMention?: boolean) => void;
}

const CommContext = createContext<CommContextValue | null>(null);

export const useComm = () => {
  const ctx = useContext(CommContext);
  if (!ctx) throw new Error('useComm must be used within CommProvider');
  return ctx;
};

export const CommProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('user') || localStorage.getItem('systo_user') || localStorage.getItem('auth_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { id: 1, name: 'Admin User', email: 'admin@opex.com', role: 'Admin' };
  });

  const [channels, setChannels] = useState<CommChannel[]>([]);
  const [dms, setDms] = useState<CommChannel[]>([]);
  const [employees, setEmployees] = useState<CommUser[]>([]);
  const [userPresences, setUserPresences] = useState<Record<number, { status: PresenceStatus; custom_status?: string; last_seen?: string }>>({});
  
  const [myStatus, setMyStatusState] = useState<PresenceStatus>(() => {
    return (localStorage.getItem('comm_status') as PresenceStatus) || 'online';
  });
  
  const [myCustomStatus, setMyCustomStatusState] = useState<string>(() => {
    return localStorage.getItem('comm_custom_status') || '';
  });

  const [activeThread, setActiveThread] = useState<CommMessage | null>(null);
  const [unreadActivityCount, setUnreadActivityCount] = useState<number>(0);

  const [settings, setSettings] = useState<CommSettings>(() => {
    try {
      const saved = localStorage.getItem('comm_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      sound_enabled: true,
      dnd_enabled: false,
      chime_type: 'soft',
      notify_on_mentions: true,
      notify_on_dms: true,
      notify_on_channel_all: false,
      status: 'online',
      custom_status: ''
    };
  });

  const presenceChannelRef = useRef<any>(null);

  // Play audio chimes
  const playNotificationSound = useCallback((isMention = false) => {
    if (!settings.sound_enabled || settings.dnd_enabled) return;
    if (isMention) {
      audioChimes.playMentionPing();
    } else {
      audioChimes.playMessageChime();
    }
  }, [settings.sound_enabled, settings.dnd_enabled]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<CommSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('comm_settings', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Fetch HR employees directory for DMs & mentions
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/employees');
      if (res.ok) {
        const data = await res.json();
        const emps = Array.isArray(data) ? data : (data.employees || []);
        const formatted: CommUser[] = emps.map((emp: any) => ({
          id: Number(emp.user_id || emp.id),
          name: emp.full_name || emp.name || `User #${emp.id}`,
          email: emp.email || emp.work_email || '',
          avatar_url: emp.avatar_url || emp.profile_picture,
          department: emp.department || emp.department_name,
          job_title: emp.job_title || emp.position,
          status: 'offline'
        }));
        // Deduplicate by id
        const unique = Array.from(new Map(formatted.map(item => [item.id, item])).values());
        setEmployees(unique);
      }
    } catch (e) {
      console.warn('Could not load employees directory:', e);
    }
  }, []);

  // Fetch Rooms (Channels + DMs)
  const refreshRooms = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/rooms?user_id=${currentUser.id}`);
      if (res.ok) {
        const data: CommChannel[] = await res.json();
        if (Array.isArray(data)) {
          const chs = data.filter(r => r.type === 'channel');
          const direct = data.filter(r => r.type === 'dm');
          setChannels(chs);
          setDms(direct);
        }
      }
    } catch (e) {
      console.warn('Could not refresh chat rooms:', e);
    }
  }, [currentUser?.id]);

  // Fetch Notifications & Activity Count
  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`/api/chat/notifications/${currentUser.id}`);
      if (res.ok) {
        const data: CommNotification[] = await res.json();
        if (Array.isArray(data)) {
          const unread = data.filter(n => !n.is_read).length;
          setUnreadActivityCount(unread);
        }
      }
    } catch (e) {}
  }, [currentUser?.id]);

  // Fetch Server-side Presences
  const fetchPresences = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/presence');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const map: Record<number, { status: PresenceStatus; custom_status?: string; last_seen?: string }> = {};
          data.forEach((p: any) => {
            map[Number(p.user_id)] = {
              status: p.status as PresenceStatus,
              custom_status: p.custom_status,
              last_seen: p.last_seen
            };
          });
          setUserPresences(prev => ({ ...prev, ...map }));
        }
      }
    } catch (e) {}
  }, []);

  // Update Status
  const setMyStatus = useCallback(async (newStatus: PresenceStatus) => {
    setMyStatusState(newStatus);
    localStorage.setItem('comm_status', newStatus);

    if (currentUser?.id) {
      // 1. Update on server
      fetch(`/api/chat/presence/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, custom_status: myCustomStatus })
      }).catch(() => {});

      // 2. Track via Supabase Realtime presence channel if connected
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          user_id: currentUser.id,
          name: currentUser.name,
          status: newStatus,
          custom_status: myCustomStatus,
          online_at: new Date().toISOString()
        }).catch(() => {});
      }

      setUserPresences(prev => ({
        ...prev,
        [currentUser.id]: {
          status: newStatus,
          custom_status: myCustomStatus,
          last_seen: new Date().toISOString()
        }
      }));
    }
  }, [currentUser, myCustomStatus]);

  // Update Custom Status Message
  const setMyCustomStatus = useCallback(async (custom: string) => {
    setMyCustomStatusState(custom);
    localStorage.setItem('comm_custom_status', custom);

    if (currentUser?.id) {
      fetch(`/api/chat/presence/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: myStatus, custom_status: custom })
      }).catch(() => {});

      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          user_id: currentUser.id,
          name: currentUser.name,
          status: myStatus,
          custom_status: custom,
          online_at: new Date().toISOString()
        }).catch(() => {});
      }

      setUserPresences(prev => ({
        ...prev,
        [currentUser.id]: {
          status: myStatus,
          custom_status: custom,
          last_seen: new Date().toISOString()
        }
      }));
    }
  }, [currentUser, myStatus]);

  // Create Channel
  const createChannel = useCallback(async (data: { name: string; description?: string; is_private?: boolean; member_ids?: number[] }): Promise<CommChannel> => {
    const cleanName = data.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    const res = await fetch('/api/chat/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanName,
        type: 'channel',
        description: data.description || '',
        is_private: !!data.is_private,
        member_ids: data.member_ids || [currentUser?.id]
      })
    });

    if (!res.ok) {
      throw new Error('Failed to create channel');
    }

    const created: CommChannel = await res.json();
    await refreshRooms();
    return created;
  }, [currentUser?.id, refreshRooms]);

  // Update Channel
  const updateChannel = useCallback(async (channelId: number, data: { name?: string; description?: string; is_private?: boolean; department_id?: number | null }): Promise<CommChannel> => {
    const payload: any = {};
    if (data.name !== undefined) {
      payload.name = data.name.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    }
    if (data.description !== undefined) {
      payload.description = data.description;
    }
    if (data.is_private !== undefined) {
      payload.is_private = data.is_private;
    }
    if (data.department_id !== undefined) {
      payload.department_id = data.department_id;
    }

    const res = await fetch(`/api/chat/rooms/${channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update channel');
    }

    const updated: CommChannel = await res.json();
    await refreshRooms();
    return updated;
  }, [refreshRooms]);

  // Delete Channel
  const deleteChannel = useCallback(async (channelId: number): Promise<void> => {
    const res = await fetch(`/api/chat/rooms/${channelId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete channel');
    }

    await refreshRooms();
  }, [refreshRooms]);

  // Get Channel Members
  const getChannelMembers = useCallback(async (channelId: number): Promise<CommUser[]> => {
    const res = await fetch(`/api/chat/rooms/${channelId}/members`);
    if (!res.ok) {
      throw new Error('Failed to load channel members');
    }
    return await res.json();
  }, []);

  // Add Channel Member
  const addChannelMember = useCallback(async (channelId: number, userId: number | number[]): Promise<void> => {
    const res = await fetch(`/api/chat/rooms/${channelId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Array.isArray(userId) ? { userIds: userId } : { userId })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add member to channel');
    }

    await refreshRooms();
  }, [refreshRooms]);

  // Remove Channel Member
  const removeChannelMember = useCallback(async (channelId: number, userId: number): Promise<void> => {
    const res = await fetch(`/api/chat/rooms/${channelId}/members/${userId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to remove member from channel');
    }

    await refreshRooms();
  }, [refreshRooms]);

  // Get or Create DM Room
  const getOrCreateDmRoom = useCallback(async (recipientId: number): Promise<CommChannel> => {
    const res = await fetch('/api/chat/dm-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipientId,
        userId: currentUser?.id
      })
    });

    if (!res.ok) {
      throw new Error('Failed to start conversation');
    }

    const room: CommChannel = await res.json();
    await refreshRooms();
    return room;
  }, [currentUser?.id, refreshRooms]);

  // Thread management
  const openThread = useCallback((msg: CommMessage) => {
    setActiveThread(msg);
  }, []);

  const closeThread = useCallback(() => {
    setActiveThread(null);
  }, []);

  // Supabase Realtime Presence Channel Sync
  useEffect(() => {
    if (!currentUser?.id) return;

    fetchEmployees();
    refreshRooms();
    fetchNotifications();
    fetchPresences();

    // Check if Supabase client is valid
    try {
      const channel = supabase.channel('comm:presence-hub', {
        config: {
          presence: {
            key: String(currentUser.id),
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const newMap: Record<number, { status: PresenceStatus; custom_status?: string; last_seen?: string }> = {};
          
          Object.keys(state).forEach(key => {
            const presences = state[key] as any[];
            if (presences && presences.length > 0) {
              const latest = presences[presences.length - 1];
              const uId = Number(latest.user_id || key);
              if (uId) {
                newMap[uId] = {
                  status: (latest.status as PresenceStatus) || 'online',
                  custom_status: latest.custom_status,
                  last_seen: latest.online_at || new Date().toISOString()
                };
              }
            }
          });

          setUserPresences(prev => ({ ...prev, ...newMap }));
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          if (Array.isArray(newPresences)) {
            const updates: Record<number, any> = {};
            newPresences.forEach((p: any) => {
              if (p.user_id) {
                updates[Number(p.user_id)] = {
                  status: (p.status as PresenceStatus) || 'online',
                  custom_status: p.custom_status,
                  last_seen: p.online_at || new Date().toISOString()
                };
              }
            });
            setUserPresences(prev => ({ ...prev, ...updates }));
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          if (Array.isArray(leftPresences)) {
            const updates: Record<number, any> = {};
            leftPresences.forEach((p: any) => {
              if (p.user_id) {
                updates[Number(p.user_id)] = {
                  status: 'offline',
                  last_seen: new Date().toISOString()
                };
              }
            });
            setUserPresences(prev => ({ ...prev, ...updates }));
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: currentUser.id,
              name: currentUser.name,
              status: myStatus,
              custom_status: myCustomStatus,
              online_at: new Date().toISOString()
            });
          }
        });

      presenceChannelRef.current = channel;

      // Also register online on backend
      setMyStatus(myStatus);

      return () => {
        if (presenceChannelRef.current) {
          presenceChannelRef.current.untrack().catch(() => {});
          supabase.removeChannel(presenceChannelRef.current);
          presenceChannelRef.current = null;
        }
      };
    } catch (e) {
      console.warn('Supabase Realtime Presence setup skipped:', e);
    }
  }, [currentUser?.id, fetchEmployees, refreshRooms, fetchNotifications, fetchPresences]);

  // Periodic heartbeat / polling fallback (every 60s) to keep presence fresh without exhausting quotas
  useEffect(() => {
    const timer = setInterval(() => {
      fetchPresences();
      fetchNotifications();
    }, 60000);
    return () => clearInterval(timer);
  }, [fetchPresences, fetchNotifications]);

  const value: CommContextValue = {
    currentUser,
    channels,
    dms,
    employees,
    userPresences,
    myStatus,
    myCustomStatus,
    setMyStatus,
    setMyCustomStatus,
    unreadActivityCount,
    activeThread,
    openThread,
    closeThread,
    settings,
    updateSettings,
    refreshRooms,
    createChannel,
    updateChannel,
    deleteChannel,
    getChannelMembers,
    addChannelMember,
    removeChannelMember,
    getOrCreateDmRoom,
    playNotificationSound,
  };

  return <CommContext.Provider value={value}>{children}</CommContext.Provider>;
};
