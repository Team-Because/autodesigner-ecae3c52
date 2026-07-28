// BDesign extension — background service worker (MV3)
// -----------------------------------------------------------------------------
// One-click "Save to BDesign" pipeline:
//   1. Content script / context menu → { type: "enqueue", imageUrl, brandId, format }
//   2. This SW posts to the `enqueue-generation` edge function
//   3. Edge function returns { generationId } instantly; the server pipeline
//      runs to completion regardless of tab/popup state.
//   4. We poll `generations` every ~10s while any row is not-final; on
//      completion, we fire a Chrome notification.
// -----------------------------------------------------------------------------

const SUPABASE_URL = "https://jibbeetyogbfkjvazysy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmJlZXR5b2diZmtqdmF6eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzUwNzYsImV4cCI6MjA4ODgxMTA3Nn0.C20BJLWyo9A3c2ouT097uddJrrJJwM-K09RhEQ3bf0E";
const APP_URL = "https://autodesigner.lovable.app";

// ── Context menu ──────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "bdesign-generate",
    title: "Save to BDesign",
    contexts: ["image"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "bdesign-generate" || !info.srcUrl) return;
  const { bt_defaults } = await chrome.storage.local.get(["bt_defaults"]);
  const brandId = bt_defaults?.brandId;
  const format  = bt_defaults?.format || "square";
  if (!brandId) {
    // No default brand set — open popup so the user can pick one.
    await chrome.storage.local.set({ selectedImageUrl: info.srcUrl });
    try { await chrome.action.openPopup(); } catch {}
    return;
  }
  const res = await enqueue({ imageUrl: info.srcUrl, brandId, format });
  notifyEnqueue(res);
});

// ── Message router ────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "enqueue") {
    enqueue(msg.payload).then((r) => {
      sendResponse(r);
      notifyEnqueue(r);
    }).catch((e) => sendResponse({ ok: false, error: e?.message || String(e) }));
    return true; // async response
  }
  if (msg?.type === "get_brands") {
    getBrandsCached().then((brands) => sendResponse({ brands })).catch(() => sendResponse({ brands: [] }));
    return true;
  }
  if (msg?.type === "get_session") {
    getSession().then((s) => sendResponse({ session: s })).catch(() => sendResponse({ session: null }));
    return true;
  }
});

// ── Session helpers ───────────────────────────────────────────────────────────
async function getSession() {
  const { bt_session } = await chrome.storage.local.get(["bt_session"]);
  if (!bt_session) return null;
  const expMs = (bt_session.expires_at || 0) * 1000;
  if (Date.now() < expMs - 60_000) return bt_session;
  // Refresh
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: bt_session.refresh_token }),
    });
    if (!r.ok) throw new Error("refresh failed");
    const fresh = await r.json();
    await chrome.storage.local.set({ bt_session: fresh });
    return fresh;
  } catch {
    await chrome.storage.local.remove(["bt_session"]);
    return null;
  }
}

async function authHeaders() {
  const s = await getSession();
  if (!s) throw new Error("Not signed in — open the BDesign extension and sign in.");
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${s.access_token}`,
    "Content-Type": "application/json",
  };
}

// ── Brand cache (5 min) ───────────────────────────────────────────────────────
async function getBrandsCached() {
  const { bt_brands } = await chrome.storage.local.get(["bt_brands"]);
  const fresh = bt_brands && Date.now() - bt_brands.ts < 5 * 60_000;
  if (fresh) return bt_brands.list;
  try {
    const h = await authHeaders();
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/brands?select=id,name&archived=eq.false&order=name`,
      { headers: h },
    );
    if (!r.ok) throw new Error("brand fetch failed");
    const list = await r.json();
    await chrome.storage.local.set({ bt_brands: { ts: Date.now(), list } });
    return list;
  } catch {
    return bt_brands?.list || [];
  }
}

// ── Enqueue ───────────────────────────────────────────────────────────────────
async function enqueue({ imageUrl, brandId, format }) {
  const h = await authHeaders();
  const r = await fetch(`${SUPABASE_URL}/functions/v1/enqueue-generation`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ brandId, referenceImageUrl: imageUrl, outputFormat: format }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { ok: false, error: data?.error || `Enqueue failed (${r.status})` };
  }
  // Remember last-used defaults
  await chrome.storage.local.set({ bt_defaults: { brandId, format } });
  // Track this generation so the poller can notify on completion.
  const { bt_pending = [] } = await chrome.storage.local.get(["bt_pending"]);
  bt_pending.push({ id: data.generationId, since: Date.now() });
  await chrome.storage.local.set({ bt_pending });
  ensurePoller();
  return { ok: true, generationId: data.generationId };
}

function notifyEnqueue(res) {
  if (res?.ok) {
    chrome.notifications.create(`bd-queued-${res.generationId}`, {
      type: "basic",
      iconUrl: "icon.png",
      title: "Sent to BDesign",
      message: "Your creative is being generated. You can close the tab — we'll notify you when it's done.",
      priority: 1,
    });
  } else {
    chrome.notifications.create(`bd-error-${Date.now()}`, {
      type: "basic",
      iconUrl: "icon.png",
      title: "Couldn't send to BDesign",
      message: res?.error || "Unknown error",
      priority: 2,
    });
  }
}

// ── Completion poller ─────────────────────────────────────────────────────────
// Uses chrome.alarms so the SW is woken every 30s while there are pending rows.
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === "bd-poll") pollPending();
});

async function ensurePoller() {
  const existing = await chrome.alarms.get("bd-poll");
  if (!existing) chrome.alarms.create("bd-poll", { periodInMinutes: 0.5 });
}

async function pollPending() {
  const { bt_pending = [] } = await chrome.storage.local.get(["bt_pending"]);
  if (!bt_pending.length) { chrome.alarms.clear("bd-poll"); return; }
  let headers;
  try { headers = await authHeaders(); } catch { return; }
  const ids = bt_pending.map((p) => p.id);
  const url = `${SUPABASE_URL}/rest/v1/generations?select=id,status,output_image_url&id=in.(${ids.join(",")})`;
  let rows = [];
  try {
    const r = await fetch(url, { headers });
    if (r.ok) rows = await r.json();
  } catch { return; }
  const now = Date.now();
  const stillPending = [];
  for (const p of bt_pending) {
    const row = rows.find((x) => x.id === p.id);
    if (!row) {
      // Row disappeared or too old — drop after 30 min.
      if (now - p.since < 30 * 60_000) stillPending.push(p);
      continue;
    }
    if (row.status === "completed" && row.output_image_url) {
      chrome.notifications.create(`bd-done-${row.id}`, {
        type: "basic",
        iconUrl: "icon.png",
        title: "Creative ready 🎨",
        message: "Your BDesign creative is done. Click to view.",
        priority: 2,
      });
    } else if (row.status === "failed") {
      chrome.notifications.create(`bd-fail-${row.id}`, {
        type: "basic",
        iconUrl: "icon.png",
        title: "Generation failed",
        message: "One of your BDesign jobs failed. Open the popup for details.",
        priority: 2,
      });
    } else {
      // still processing / analyzing / adapting / generating
      if (now - p.since < 30 * 60_000) stillPending.push(p);
    }
  }
  await chrome.storage.local.set({ bt_pending: stillPending });
  if (!stillPending.length) chrome.alarms.clear("bd-poll");
}

// ── Notification click → open popup / app ─────────────────────────────────────
chrome.notifications.onClicked.addListener((id) => {
  if (id.startsWith("bd-done-")) {
    chrome.tabs.create({ url: `${APP_URL}/history` });
  } else {
    try { chrome.action.openPopup(); } catch {}
  }
  chrome.notifications.clear(id);
});
