import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const hasPlaceholder = (value?: string) => !value || /(TU_|YOUR_|MY_)/i.test(value);

export const isSupabaseConfigured =
  !hasPlaceholder(supabaseUrl) && !hasPlaceholder(supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;
