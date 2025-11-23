import { createClient } from "@supabase/supabase-js";

// Use env vars in local dev, fall back to hardcoded values in production (GitHub Pages)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ohxxngcfwieuqljxptlo.supabase.co";

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_secret_-h5kKhuuAyMB38MKdN5zuw_ud9CtGLt";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase configuration is missing.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
