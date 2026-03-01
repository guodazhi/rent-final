// assets/supabaseClient.js
(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Missing Supabase config: assets/config.js");
    return;
  }
  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();
