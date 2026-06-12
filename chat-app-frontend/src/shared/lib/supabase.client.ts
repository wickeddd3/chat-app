import { createClient } from "@supabase/supabase-js";
import {
  VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_URL,
} from "../config/app.config";

const supabaseUrl = VITE_SUPABASE_URL;
const supabasePublishableKey = VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required.",
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
