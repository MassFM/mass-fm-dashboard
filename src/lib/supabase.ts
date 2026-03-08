import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase client tanpa strict Database generic agar tidak kena 'never' type
// Semua tabel menggunakan runtime typing
export const supabase = createClient(supabaseUrl, supabaseAnonKey);