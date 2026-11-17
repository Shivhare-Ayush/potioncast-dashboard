// public/js/supabaseClient.js — Supabase Client matching potioncast-web
const SUPABASE_URL = 'https://ucvyriacwtjcwxxcubua.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_3j0x6ydGQuw_hhHFp1QGFQ_G7Alu-be';

if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
