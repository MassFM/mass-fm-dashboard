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
    youtube_url?: string;
    recording_url?: string;
    resume_html?: string;
    /** Kategori program: 'live_studio' | 'live_relay' | 'live_delay' | 'rekaman' | '' */
    category?: string;
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
  fawaid?: string | null;
  notes?: string | null;
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
  recording_url?: string;
  schedule_day?: string;
  schedule_time?: string;
  schedule_speaker?: string;
  schedule_program?: string;
  created_at?: string;
}

export interface IslamicEvent {
  id?: string;
  created_at?: string;
  updated_at?: string;
  event_type: 'islamic_event' | 'sunnah_fasting' | 'national_holiday';
  name: string;
  description: string;
  hijri_month?: number | null;
  hijri_day?: number | null;
  masehi_month?: number | null;
  masehi_day?: number | null;
  day_of_week: string;
  is_annual: boolean;
  specific_date?: string | null;
  badge_color: string;
  is_active: boolean;
}

// ─── POSTER CATEGORIES ──────────────────────────────────────────────

export interface PosterCategory {
  id?: string;
  created_at?: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface Poster {
  id?: string;
  created_at?: string;
  judul: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
  category_id?: string | null;
  // joined
  poster_categories?: PosterCategory | null;
}

// ─── GREETING CARDS (Kartu Ucapan) ─────────────────────────────────

export interface TextFieldConfig {
  x: number;       // posisi horizontal (% dari lebar gambar, 0-100)
  y: number;       // posisi vertikal (% dari tinggi gambar, 0-100)
  fontSize: number; // ukuran font (pt)
  color: string;    // hex color (#000000)
  align: 'left' | 'center' | 'right';
  label: string;    // placeholder label
  enabled: boolean; // apakah field ini aktif
  fontWeight: 'normal' | 'bold';
  maxLines: number; // batas baris
}

export interface GreetingCard {
  id?: string;
  created_at?: string;
  category: string;
  title: string;
  image_url: string;
  sender_field: TextFieldConfig;
  receiver_field: TextFieldConfig;
  footnote_field: TextFieldConfig;
  watermark_position: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  show_logo: boolean;
  is_active: boolean;
  is_seasonal: boolean;
  season_start?: string | null;
  season_end?: string | null;
  sort_order: number;
}

// ─── EVENTS (Acara / Kajian Akbar) ─────────────────────────

export interface Event {
  id?: number;
  created_at?: string;
  updated_at?: string;
  title: string;
  description: string;
  kategori: string;
  poster_url: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jam_mulai: string;
  jam_selesai: string;
  tempat: string;
  alamat: string;
  provinsi: string;
  kota: string;
  latitude: number | null;
  longitude: number | null;
  pemateri: string;
  contact_person: string;
  contact_phone: string;
  registration_url: string;
  is_featured: boolean;
  is_free: boolean;
  is_active: boolean;
  sort_order: number;
}

// ─── EBOOKS (Ebook Islami) ──────────────────────────────────

export interface Ebook {
  id?: number;
  created_at?: string;
  updated_at?: string;
  title: string;
  author: string;
  description: string;
  kategori: string;
  thumbnail_url: string;
  file_url: string;
  total_pages: number;
  file_size_mb: number;
  download_count: number;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
}

// ─── POPUP INFO ─────────────────────────────────────────────

export interface ClickArea {
  x: number;  // posisi X (% dari lebar gambar, 0-100)
  y: number;  // posisi Y (% dari tinggi gambar, 0-100)
  w: number;  // lebar area (%)
  h: number;  // tinggi area (%)
}

export interface PopupItem {
  id?: number;
  created_at?: string;
  type: 'open' | 'close';
  title: string;
  body: string;
  image_url: string;
  action_type: 'url' | 'whatsapp' | 'screen';
  action_url: string;
  action_label: string;
  click_area: ClickArea | null;
  is_active: boolean;
  show_once: boolean;
}

// ─── MITRA DAKWAH (ADS / PARTNER) ──────────────────────────

export interface Ad {
  id?: string;
  created_at?: string;
  updated_at?: string;
  client_name: string;
  client_phone: string;
  client_email: string;
  package_type: 'banner' | 'interstitial' | 'featured' | 'premium';
  title: string;
  description: string;
  image_url: string;
  landing_url: string;
  action_type: 'webview' | 'url' | 'whatsapp' | 'screen';
  click_area: ClickArea | null;
  category: string;
  placement: 'catalog' | 'interstitial_open' | 'interstitial_close' | 'interstitial_transition';
  start_date: string;
  expiry_date: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  priority: number;
  show_duration_seconds: number;
  max_impressions_per_day: number;
}

export interface AdAnalytics {
  id?: number;
  ad_id: string;
  date: string;
  views: number;
  clicks: number;
  unique_views: number;
  created_at?: string;
}

export interface AdPricing {
  name: string;
  price: string;
  description: string;
}

export interface AdsConfig {
  is_enabled: boolean;
  interstitial_enabled: boolean;
  interstitial_throttle_minutes: number;
  catalog_title: string;
  catalog_subtitle: string;
  regulations_html: string;
  pricing: AdPricing[];
  contact_whatsapp: string;
  contact_text: string;
}