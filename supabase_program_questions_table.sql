-- ============================================================
-- SQL untuk membuat tabel `program_questions` di Supabase
-- Jalankan di Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================

-- 1. Buat tabel
CREATE TABLE IF NOT EXISTS public.program_questions (
  id BIGSERIAL PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  program_name TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL DEFAULT 'Anonim',
  question TEXT NOT NULL,
  admin_reply TEXT,
  is_recording_request BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE public.program_questions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Siapa saja bisa INSERT (pendengar dari app Flutter)
CREATE POLICY "Anyone can insert program questions"
  ON public.program_questions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 4. Policy: Siapa saja bisa SELECT (dashboard + app Flutter bisa baca)
CREATE POLICY "Anyone can read program questions"
  ON public.program_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Policy: Authenticated users bisa UPDATE (admin menjawab/arsipkan)
CREATE POLICY "Authenticated can update program questions"
  ON public.program_questions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Policy: Authenticated users bisa DELETE (admin hapus)
CREATE POLICY "Authenticated can delete program questions"
  ON public.program_questions
  FOR DELETE
  TO authenticated
  USING (true);

-- 7. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.program_questions;

-- 8. Index untuk query cepat berdasarkan schedule_id
CREATE INDEX IF NOT EXISTS idx_program_questions_schedule_id 
  ON public.program_questions(schedule_id);

CREATE INDEX IF NOT EXISTS idx_program_questions_status 
  ON public.program_questions(status);
