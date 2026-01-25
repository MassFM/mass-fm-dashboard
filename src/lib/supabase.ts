import { createClient } from '@supabase/supabase-js';
import { Kajian } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Mendefinisikan database schema sederhana
export interface Database {
  public: {
    Tables: {
      schedules: {
        Row: Kajian;
        Insert: Kajian;
        Update: Partial<Kajian>;
      };
    };
  };
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);