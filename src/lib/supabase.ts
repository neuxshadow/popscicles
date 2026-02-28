import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Public client for anonymous operations (e.g., INSERT with RLS)
// We only initialize if values are present to avoid build-time crashes when secrets are missing
export const supabase = (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your_supabase_url') 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
