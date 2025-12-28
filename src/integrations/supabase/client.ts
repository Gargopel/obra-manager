import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://yqjcvffczeykiqwmopcw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxamN2ZmZjemV5a2lxd21vcGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NTE1MDksImV4cCI6MjA4MTMyNzUwOX0.cRXBrYJWWH_mgBemotrv7vrqc-BzWI5llo59wqcfpz4";

// Singleton: Esta instância é exportada e reutilizada em todo o app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});