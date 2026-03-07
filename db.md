-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.app_popups (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  type text NOT NULL DEFAULT 'open'::text,
  title text NOT NULL DEFAULT ''::text,
  body text NOT NULL DEFAULT ''::text,
  image_url text DEFAULT ''::text,
  action_url text DEFAULT ''::text,
  action_label text DEFAULT 'Selengkapnya'::text,
  is_active boolean DEFAULT true,
  show_once boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT app_popups_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_question_settings (
  key text NOT NULL,
  value text NOT NULL,
  CONSTRAINT app_question_settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_jingle_mode boolean DEFAULT false,
  next_program_title text DEFAULT 'Program Berikutnya'::text,
  updated_at timestamp with time zone DEFAULT now(),
  live_program_id bigint,
  CONSTRAINT app_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chat_messages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  sender_name text NOT NULL DEFAULT 'Anonim'::text,
  message text NOT NULL DEFAULT ''::text,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.daily_doas (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL DEFAULT ''::text,
  arabic text DEFAULT ''::text,
  latin text DEFAULT ''::text,
  translation text DEFAULT ''::text,
  source text DEFAULT ''::text,
  category text DEFAULT ''::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_doas_pkey PRIMARY KEY (id)
);
CREATE TABLE public.donation_accounts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  account_name text NOT NULL,
  is_active boolean DEFAULT true,
  CONSTRAINT donation_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.fcm_tokens (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  token text NOT NULL UNIQUE,
  platform text DEFAULT 'android'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fcm_tokens_pkey PRIMARY KEY (id)
);
CREATE TABLE public.feedbacks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  rating smallint,
  category text,
  message text,
  is_read boolean DEFAULT false,
  CONSTRAINT feedbacks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.kajian_offline (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  pemateri text,
  materi text,
  description text,
  tempat text NOT NULL,
  alamat text,
  latitude double precision,
  longitude double precision,
  contact_person text,
  contact_phone text,
  hari text NOT NULL,
  jam text NOT NULL,
  is_relay boolean DEFAULT false,
  relay_schedule_id bigint,
  kitab_name text,
  file_url text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT kajian_offline_pkey PRIMARY KEY (id),
  CONSTRAINT kajian_offline_relay_schedule_id_fkey FOREIGN KEY (relay_schedule_id) REFERENCES public.schedules(id)
);
CREATE TABLE public.listener_stats (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_type text NOT NULL,
  duration_seconds integer DEFAULT 0,
  platform text DEFAULT 'android'::text,
  app_version text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT listener_stats_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  auto_notify_enabled boolean DEFAULT false,
  notify_before_minutes integer DEFAULT 10,
  notify_topic text DEFAULT 'jadwal_update'::text,
  last_auto_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  topic text DEFAULT 'all_users'::text,
  sent_by text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.podcasts (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text DEFAULT ''::text,
  pemateri text DEFAULT ''::text,
  category text DEFAULT 'Kajian'::text,
  audio_url text NOT NULL,
  cover_url text DEFAULT ''::text,
  duration_seconds integer DEFAULT 0,
  play_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT podcasts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.posters (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  judul text NOT NULL,
  image_url text NOT NULL,
  order_index integer DEFAULT 0,
  CONSTRAINT posters_pkey PRIMARY KEY (id)
);
CREATE TABLE public.program_questions (
  id bigint NOT NULL DEFAULT nextval('program_questions_id_seq'::regclass),
  schedule_id text NOT NULL,
  program_name text NOT NULL DEFAULT ''::text,
  sender_name text NOT NULL DEFAULT 'Anonim'::text,
  question text NOT NULL,
  admin_reply text,
  is_recording_request boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'answered'::text, 'archived'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT program_questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama_penanya text NOT NULL,
  lokasi text,
  is_anonymous boolean DEFAULT false,
  isi_pertanyaan text NOT NULL,
  target_ustadz_id uuid,
  status text DEFAULT 'pending'::text,
  jawaban_teks text,
  jawaban_audio_url text,
  nama_ustadz_penjawab text,
  created_at timestamp with time zone DEFAULT now(),
  pertanyaan_audio_url text,
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_target_ustadz_id_fkey FOREIGN KEY (target_ustadz_id) REFERENCES public.ustadz(id)
);
CREATE TABLE public.scheduled_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL DEFAULT ''::text,
  body text NOT NULL DEFAULT ''::text,
  topic text NOT NULL DEFAULT 'all_users'::text,
  scheduled_at timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  repeat_type text NOT NULL DEFAULT 'none'::text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT scheduled_notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.schedules (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  judul text NOT NULL,
  program text DEFAULT 'Umum'::text,
  pemateri text,
  jam text NOT NULL,
  is_live boolean DEFAULT false,
  date date DEFAULT now(),
  description text,
  is_relay boolean DEFAULT false,
  kitab_name text,
  file_url text,
  CONSTRAINT schedules_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ustadz (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nama text NOT NULL,
  foto_url text,
  spesialisasi text,
  CONSTRAINT ustadz_pkey PRIMARY KEY (id)
);