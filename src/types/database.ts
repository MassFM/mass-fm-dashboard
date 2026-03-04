// Interface ini harus sama dengan model di Flutter agar sinkron
export interface Kajian {
    id?: number;
    created_at?: string;
    judul: string;
    program: string;
    pemateri: string;
    jam: string;
    date?: string;
    is_live: boolean;
    description?: string;
    is_relay?: boolean;
    kitab_name?: string;
    file_url?: string;
  }

export interface DonationAccount {
  id?: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  is_active: boolean;
}

export interface Podcast {
  id?: number;
  created_at?: string;
  title: string;
  description: string;
  pemateri: string;
  category: string;
  audio_url: string;
  cover_url: string;
  duration_seconds: number;
  play_count: number;
  is_published: boolean;
  published_at?: string;
}

export interface Notification {
  id?: number;
  created_at?: string;
  title: string;
  body: string;
  topic: string;
  sent_by?: string;
  data?: Record<string, string>;
}

export interface ListenerStat {
  id?: number;
  created_at?: string;
  event_type: string;
  duration_seconds?: number;
  platform?: string;
  app_version?: string;
  metadata?: Record<string, unknown>;
}

export interface FcmToken {
  id?: number;
  created_at?: string;
  token: string;
  platform: string;
  updated_at?: string;
}

export interface KajianOffline {
  id?: number;
  created_at?: string;
  title: string;
  pemateri: string;
  materi: string;
  description: string;
  tempat: string;
  alamat: string;
  latitude: number | null;
  longitude: number | null;
  contact_person: string;
  contact_phone: string;
  hari: string;
  jam: string;
  is_relay: boolean;
  kitab_name: string;
  file_url: string;
  image_url: string;
  is_active: boolean;
}

export interface NotificationSettings {
  id?: number;
  auto_notify_enabled: boolean;
  notify_before_minutes: number;
  notify_topic: string;
  last_auto_sent_at?: string;
}

export interface ChatMessage {
  id?: number;
  sender_name: string;
  message: string;
  is_pinned: boolean;
  created_at?: string;
}

export interface DailyDoa {
  id?: number;
  title: string;
  arabic: string;
  latin: string;
  translation: string;
  source: string;
  category: string;
  is_active: boolean;
  created_at?: string;
}

export interface ScheduledNotification {
  id?: number;
  title: string;
  body: string;
  topic: string;
  scheduled_at: string;
  status: 'pending' | 'sent' | 'cancelled';
  repeat_type: 'none' | 'daily' | 'weekly';
  created_at?: string;
  sent_at?: string;
}

export interface TroubleReport {
  id?: number;
  category: string;
  description: string;
  contact_name: string;
  contact_phone: string;
  status: 'pending' | 'in_progress' | 'resolved';
  admin_note?: string;
  created_at?: string;
}

export interface ProgramQuestion {
  id?: number;
  schedule_id: string;
  program_name: string;
  sender_name: string;
  question: string;
  admin_reply?: string;
  is_recording_request: boolean;
  status: 'pending' | 'answered' | 'archived';
  created_at?: string;
}