// Supabase browser client. Load this after supabase-config.js and the Supabase CDN.
(function () {
  const configured = window.ACKUMEN_SUPABASE_URL && !window.ACKUMEN_SUPABASE_URL.includes('YOUR-PROJECT') && window.ACKUMEN_SUPABASE_ANON_KEY && !window.ACKUMEN_SUPABASE_ANON_KEY.includes('YOUR_');
  window.ackumenConfigured = Boolean(configured);
  window.ackumenSupabase = configured ? window.supabase.createClient(window.ACKUMEN_SUPABASE_URL, window.ACKUMEN_SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
})();
