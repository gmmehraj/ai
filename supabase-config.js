// ============================================
// AXIOM — Supabase client configuration
// The anon/publishable key is safe to expose in the browser —
// it has no power on its own; every table it can touch is
// locked down by Row Level Security policies (see schema.sql).
// ============================================
const SUPABASE_URL = "https://zdskilffkwpwyszmhvov.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iFnV-k1K1j78rdVLh4TzqQ_ovGiWqEZ";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);