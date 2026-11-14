export type PresenceStatus = 'online' | 'busy' | 'away' | 'offline';

export interface UserPresence {
  user_id: number;
  status: PresenceStatus;
  custom_status?: string;
  last_seen?: string;
}

export interface CommUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  avatar_url?: string;
  department?: string;
  job_title?: string;
  status?: PresenceStatus;
  custom_status?: string;
  last_seen?: string;
}

export interface CommChannel {
  id: number;
  name: string;
  type: 'channel' | 'dm' | 'contextual';
  description?: string;
  is_private?: boolean;
  department_id?: number;
  company_id?: number;
  last_message?: string;
  last_message_at?: string;
  total_messages?: number;
  member_count?: number;
  created_at?: string;
  // For DMs:
  recipient_id?: number;
  recipient_name?: string;
  recipient_email?: string;
  recipient_presence?: PresenceStatus;
}

export interface CommReaction {
  emoji: string;
  count: number;
  user_ids: number[];
}

export interface CommMessage {
  id: number;
  room_id: number;
  sender_id: number;
  sender_name?: string;
  sender_email?: string;
  sender_avatar?: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  audio_duration?: number;
  mentions?: number[];
  parent_id?: number;
  reply_count?: number;
  last_reply_at?: string;
  reactions?: CommReaction[];
  created_at: string;
  is_announcement?: boolean;
}

export interface CommNotification {
  id: string | number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export interface CommSettings {
  sound_enabled: boolean;
  dnd_enabled: boolean;
  chime_type: 'soft' | 'gentle' | 'modern';
  notify_on_mentions: boolean;
  notify_on_dms: boolean;
  notify_on_channel_all: boolean;
  status: PresenceStatus;
  custom_status: string;
}
