// B Design popup — auto-signs-in from the web app session when available.
// -----------------------------------------------------------------------------
// Tabs: New (defaults + pending image) | History (last 20)
// Popup lifecycle notes:
//  • Chrome auto-closes popups when they lose focus. We avoid focus-loss
//    triggers (no auto tab-switch on send, and history clicks open URLs with
//    `noopener` so the current tab stays focused).
//  • On open we check storage for a session pushed in by app-sync.js; if
//    present we skip the login view entirely.
// -----------------------------------------------------------------------------
const SUPABASE_URL = "https://jibbeetyogbfkjvazysy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmJlZXR5b2diZmtqdmF6eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzUwNzYsImV4cCI6MjA4ODgxMTA3Nn0.C20BJLWyo9A3c2ouT097uddJrrJJwM-K09RhEQ3bf0E";
const APP_URL = "https://autodesigner.lovable.app";

const $ = (id) => document.getElementById(id);
const loginView = $("login-view");
const mainView  = $("main-view");
const loginError = $("login-error");
const loginBtn = $("login-btn");
const openAppBtn = $("open-app-btn");
const logoutBtn = $("logout-btn");
const brandSel = $("brand-select");
const formatGrid = $("format-grid");
const pendingBox = $("pending-image");
const pendingImg = $("pending-preview");
const sendPendingBtn = $("send-pending-btn");
const newMsg = $("new-msg");
const historyList = $("history-list");
const historyEmpty = $("history-empty");

let session = null;
let selectedFormat = "square";
let pendingImageUrl = "";
let pollTimer = null;

function show(el, on = true) { if (el) el.hidden = !on; }
function switchView(v) {
  loginView.hidden = v !== "login";
  mainView.hidden  = v !== "main";
}

// ── Tabs ─────────────────────────────────────────────────────────────────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    $(`tab-${tab.dataset.tab}`).classList.add("active");
    if (tab.dataset.tab === "history") loadHistory();
  });
});

// ── Session ──────────────────────────────────────────────────────────────────
async function loadSession() {
  const { bt_session } = await chrome.storage.local.get(["bt_session"]);
  if (!bt_session) return null;
  const expMs = (bt_session.expires_at || 0) * 1000;
  if (Date.now() < expMs - 60_000) { session = bt_session; return session; }
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: bt_session.refresh_token }),
    });
    if (!r.ok) throw new Error("refresh failed");
    session = await r.json();
    await chrome.storage.local.set({ bt_session: session });
    return session;
  } catch {
    session = null;
    await chrome.storage.local.remove(["bt_session"]);
    return null;
  }
}

function authHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

// React to session pushes from app-sync.js while popup is open.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.bt_session) return;
  const next = changes.bt_session.newValue;
  if (next?.access_token && (!session || session.access_token !== next.access_token)) {
    session = next;
    if (mainView.hidden) initMain();
  } else if (!next && !mainView.hidden) {
    switchView("login");
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
loginBtn.addEventListener("click", async () => {
  const emailRaw = $("login-email").value.trim();
  const password = $("login-password").value;
  if (!emailRaw || !password) return showErr(loginError, "Enter your credentials.");
  const email = emailRaw.includes("@") ? emailRaw : `${emailRaw}@internal.brandtonic`;
  loginBtn.disabled = true; loginBtn.textContent = "Signing in…";
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error_description || data.msg || "Sign-in failed");
    session = data;
    await chrome.storage.local.set({ bt_session: session });
    await initMain();
  } catch (e) {
    showErr(loginError, e.message);
  } finally {
    loginBtn.disabled = false; loginBtn.textContent = "Sign in";
  }
});

// Submit login on Enter as well.
["login-email", "login-password"].forEach((id) => {
  $(id)?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); loginBtn.click(); }
  });
});

openAppBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: APP_URL, active: true });
});

logoutBtn.addEventListener("click", async () => {
  session = null;
  await chrome.storage.local.remove(["bt_session", "bt_defaults", "bt_brands", "bt_pending"]);
  switchView("login");
});

function showErr(el, msg) {
  el.textContent = msg;
  el.className = "alert alert-err";
  el.hidden = false;
}
function showOk(el, msg) {
  el.textContent = msg;
  el.className = "alert alert-ok";
  el.hidden = false;
}

// ── Format grid ──────────────────────────────────────────────────────────────
formatGrid.addEventListener("click", async (e) => {
  const el = e.target.closest(".fmt");
  if (!el) return;
  formatGrid.querySelectorAll(".fmt").forEach((n) => n.classList.remove("active"));
  el.classList.add("active");
  selectedFormat = el.dataset.f;
  await persistDefaults();
});

brandSel.addEventListener("change", persistDefaults);

async function persistDefaults() {
  await chrome.storage.local.set({
    bt_defaults: { brandId: brandSel.value, format: selectedFormat },
  });
}

// ── Brands ───────────────────────────────────────────────────────────────────
async function loadBrands() {
  brandSel.textContent = "";
  const loading = document.createElement("option");
  loading.textContent = "Loading…";
  brandSel.appendChild(loading);
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=id,name&archived=eq.false&order=name`, {
      headers: authHeaders(),
    });
    const list = r.ok ? await r.json() : [];
    brandSel.textContent = "";
    if (!list.length) {
      const opt = document.createElement("option");
      opt.value = ""; opt.textContent = "No brands — create one in B Design";
      brandSel.appendChild(opt);
      return;
    }
    const { bt_defaults } = await chrome.storage.local.get(["bt_defaults"]);
    const defId = bt_defaults?.brandId;
    for (const b of list) {
      const opt = document.createElement("option");
      opt.value = b.id; opt.textContent = b.name;
      if (b.id === defId) opt.selected = true;
      brandSel.appendChild(opt);
    }
    await chrome.storage.local.set({ bt_brands: { ts: Date.now(), list } });
  } catch {
    brandSel.textContent = "";
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = "Failed to load brands";
    brandSel.appendChild(opt);
  }
}

// ── Pending image (from context menu) ────────────────────────────────────────
async function loadPending() {
  const { selectedImageUrl } = await chrome.storage.local.get(["selectedImageUrl"]);
  if (selectedImageUrl) {
    pendingImageUrl = selectedImageUrl;
    pendingImg.src = pendingImageUrl;
    show(pendingBox, true);
    show(sendPendingBtn, true);
    await chrome.storage.local.remove(["selectedImageUrl"]);
  }
}

sendPendingBtn.addEventListener("click", async () => {
  const brandId = brandSel.value;
  if (!brandId || !pendingImageUrl) return;
  sendPendingBtn.disabled = true;
  sendPendingBtn.textContent = "Sending…";
  let res;
  try {
    res = await chrome.runtime.sendMessage({
      type: "enqueue",
      payload: { imageUrl: pendingImageUrl, brandId, format: selectedFormat },
    });
  } catch (e) { res = { ok: false, error: e?.message || "Failed" }; }
  if (res?.ok) {
    showOk(newMsg, "Sent! Your creative is generating on the server.");
    pendingImageUrl = "";
    show(pendingBox, false);
    show(sendPendingBtn, false);
  } else {
    showErr(newMsg, res?.error || "Failed to send");
  }
  sendPendingBtn.disabled = false;
  sendPendingBtn.textContent = "Send to B Design";
});

// ── History ──────────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/generations?select=id,brand_id,reference_image_url,output_image_url,status,output_format,created_at,brand:brands(name)&order=created_at.desc&limit=20`,
      { headers: authHeaders() },
    );
    if (!r.ok) throw new Error("history fetch failed");
    const rows = await r.json();
    renderHistory(rows);
    const hasPending = rows.some((row) => !["completed","failed"].includes(row.status));
    if (hasPending) schedulePoll(); else stopPoll();
  } catch (e) {
    historyList.textContent = "";
    const li = document.createElement("li");
    li.textContent = `Failed to load history: ${e.message}`;
    historyList.appendChild(li);
  }
}

function renderHistory(rows) {
  historyList.textContent = "";
  if (!rows.length) { show(historyEmpty, true); return; }
  show(historyEmpty, false);
  for (const r of rows) {
    const isDone = r.status === "completed" && r.output_image_url;
    const isFail = r.status === "failed";
    const thumb = isDone ? r.output_image_url : r.reference_image_url;

    const li = document.createElement("li");
    const img = document.createElement("img");
    img.className = "thumb"; img.src = thumb || "";
    img.addEventListener("error", () => { img.style.visibility = "hidden"; });
    const meta = document.createElement("div"); meta.className = "meta";
    const name = document.createElement("div"); name.className = "name";
    name.textContent = `${r.brand?.name || "Brand"} · ${r.output_format || ""}`;
    const time = document.createElement("div"); time.className = "time";
    time.textContent = timeAgo(new Date(r.created_at));
    meta.append(name, time);

    const badge = document.createElement("span");
    badge.className = "badge " + (isDone ? "done" : isFail ? "fail" : "busy");
    if (isDone) badge.textContent = "Done";
    else if (isFail) badge.textContent = "Failed";
    else {
      const sp = document.createElement("span"); sp.className = "spinner";
      badge.appendChild(sp);
      badge.appendChild(document.createTextNode(" " + (r.status || "queued")));
    }

    li.append(img, meta, badge);
    li.addEventListener("click", () => {
      const url = isDone && r.output_image_url ? r.output_image_url : `${APP_URL}/history`;
      // Open in background tab so the popup stays open.
      chrome.tabs.create({ url, active: false });
    });
    historyList.appendChild(li);
  }
}

function schedulePoll() {
  if (pollTimer) return;
  pollTimer = setInterval(loadHistory, 5000);
}
function stopPoll() { if (pollTimer) { clearInterval(pollTimer); pollTimer = null; } }
window.addEventListener("beforeunload", stopPoll);

function timeAgo(d) {
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24); return `${dd}d ago`;
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function initMain() {
  switchView("main");
  await loadBrands();
  const { bt_defaults } = await chrome.storage.local.get(["bt_defaults"]);
  if (bt_defaults?.format) {
    selectedFormat = bt_defaults.format;
    formatGrid.querySelectorAll(".fmt").forEach((n) => {
      n.classList.toggle("active", n.dataset.f === selectedFormat);
    });
  }
  await loadPending();
}

(async () => {
  await loadSession();
  if (session) await initMain();
  else switchView("login");
})();
