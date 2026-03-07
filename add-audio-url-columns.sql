-- ============================================================
-- ALTER TABLES: Tambahkan kolom audio_url untuk doa & dzikir
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tambah kolom audio_url ke tabel daily_doas
ALTER TABLE daily_doas ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- 2. Tambah kolom audio_url ke tabel dzikir_items
ALTER TABLE dzikir_items ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Selesai! Kolom audio_url sekarang tersedia untuk diisi via dashboard.
