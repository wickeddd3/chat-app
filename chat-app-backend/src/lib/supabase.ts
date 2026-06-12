import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from "@/config/app.config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Crucial for stateless Express backends
    autoRefreshToken: false,
  },
});
