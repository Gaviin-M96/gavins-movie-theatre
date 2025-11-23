import { createClient } from "@supabase/supabase-js";

// Supabase project settings:
// - Project URL (https://ohxxngcfwieuqljxptlo.supabase.co)
// - Publishable key (sb_publishable_JHt5PshSWDbv5uKFKrRHiQ_-Q0W9Jmu)
const SUPABASE_URL = "https://ohxxngcfwieuqljxptlo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "YOUR_SB_PUBLISHABLE_KEY_HERE";

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Supabase configuration is missing.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
