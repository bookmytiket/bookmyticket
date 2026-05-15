import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined' && !supabaseUrl) {
  console.error("Supabase Error: NEXT_PUBLIC_SUPABASE_URL is missing!");
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null;

if (supabase) {
  console.log("Supabase Browser Client initialized (Cookie-enabled).");
}
