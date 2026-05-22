(function setupSupabaseClient() {
  const config = window.SUPABASE_CONFIG || {};
  const url = config.URL || "";
  const key = config.ANON_KEY || "";
  const configured =
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url) &&
    key &&
    !url.includes("YOUR_PROJECT_REF") &&
    !key.includes("YOUR_SUPABASE_ANON_KEY");

  window.portfolioBackend = {
    bucket: config.PROJECT_FILES_BUCKET || "project-files",
    isConfigured() {
      return Boolean(configured && window.supabase);
    },
    client: configured && window.supabase ? window.supabase.createClient(url, key) : null
  };
})();
