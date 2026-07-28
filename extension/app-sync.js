// B Design — session bridge from the web app to the extension.
// Runs on autodesigner.lovable.app / bdesign.teambecause.com.
// Reads the Supabase auth token from localStorage and forwards it to the SW,
// so users don't need to log in separately in the extension.
// -----------------------------------------------------------------------------
(() => {
  if (window.__bdesignAppSyncInjected) return;
  window.__bdesignAppSyncInjected = true;

  const STORAGE_KEY = "sb-jibbeetyogbfkjvazysy-auth-token";

  function readSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // supabase-js v2 stores { access_token, refresh_token, expires_at, ... }
      // Older shape wraps it in { currentSession: {...} }.
      const s = parsed?.access_token ? parsed : parsed?.currentSession;
      if (!s?.access_token || !s?.refresh_token) return null;
      return {
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        expires_at: s.expires_at,
        expires_in: s.expires_in,
        token_type: s.token_type || "bearer",
        user: s.user || null,
      };
    } catch { return null; }
  }

  let lastToken = "";
  function pushIfChanged() {
    const s = readSession();
    const tok = s?.access_token || "";
    if (tok === lastToken) return;
    lastToken = tok;
    try {
      chrome.runtime.sendMessage(
        { type: "sync_session", session: s },
        () => void chrome.runtime.lastError, // swallow "no receiver" during SW spin-up
      );
    } catch { /* extension context invalidated on reload — safe to ignore */ }
  }

  // Initial push, then react to storage changes and periodically re-check
  // (Supabase refreshes tokens in the background without a storage event).
  pushIfChanged();
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) pushIfChanged();
  });
  setInterval(pushIfChanged, 15_000);
})();
