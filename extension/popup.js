// BDesign popup — tabs: New (defaults + pending image) | History (last 20)
// -----------------------------------------------------------------------------
const SUPABASE_URL = "https://jibbeetyogbfkjvazysy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppYmJlZXR5b2diZmtqdmF6eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzUwNzYsImV4cCI6MjA4ODgxMTA3Nn0.C20BJLWyo9A3c2ouT097uddJrrJJwM-K09RhEQ3bf0E";
const APP_URL = "https://autodesigner.lovable.app";

const $ = (id) => document.getElementById(id);
const loginView = $("login-view");
const mainView  = $("main-view");
const loginError = $("login-error");
const loginBtn = $("login-btn");
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
    loginBtn.disabled = false; loginBtn.textContent = "Sign In";
  }
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
  setTimeout(() => { el.hidden = true; }, 5000);
}
function showOk(el, msg) {
  el.textContent = msg;
  el.className = "alert alert-ok";
  el.hidden = false;
  setTimeout(() => { el.hidden = true; }, 4000);
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
  brandSel.innerHTML = "<option>Loading…</option>";
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/brands?select=id,name&archived=eq.false&order=name`, {
      headers: authHeaders(),
    });
    const list = r.ok ? await r.json() : [];
    if (!list.length) {
      brandSel.innerHTML = `<option value="">No brands — create one in BDesign</option>`;
      return;
    }
    const { bt_defaults } = await chrome.storage.local.get(["bt_defaults"]);
    const defId = bt_defaults?.brandId;
    brandSel.innerHTML = list.map((b) =>
      `<option value="${b.id}" ${b.id === defId ? "selected" : ""}>${escapeHtml(b.name)}</option>`
    ).join("");
    // Cache for content script
    await chrome.storage.local.set({ bt_brands: { ts: Date.now(), list } });
  } catch {
    brandSel.innerHTML = `<option value="">Failed to load brands</option>`;
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
  const res = await chrome.runtime.sendMessage({
    type: "enqueue",
    payload: { imageUrl: pendingImageUrl, brandId, format: selectedFormat },
  }).catch((e) => ({ ok: false, error: e?.message || "Failed" }));
  if (res?.ok) {
    showOk(newMsg, "Sent! Your creative is generating on the server.");
    pendingImageUrl = "";
    show(pendingBox, false);
    show(sendPendingBtn, false);
    // Jump to history tab so user can watch it progress.
    document.querySelector('.tab[data-tab="history"]').click();
  } else {
    showErr(newMsg, res?.error || "Failed to send");
  }
  sendPendingBtn.disabled = false;
  sendPendingBtn.textContent = "Send to BDesign";
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
    // Auto-poll while any non-final row exists.
    const hasPending = rows.some((r) => !["completed","failed"].includes(r.status));
    if (hasPending) schedulePoll();
    else stopPoll();
  } catch (e) {
    historyList.innerHTML = `<li><div class="meta"><div class="name">Failed to load history</div><div class="time">${escapeHtml(e.message)}</div></div></li>`;
  }
}

function renderHistory(rows) {
  if (!rows.length) { show(historyEmpty, true); historyList.innerHTML = ""; return; }
  show(historyEmpty, false);
  historyList.innerHTML = rows.map((r) => {
    const isDone = r.status === "completed" && r.output_image_url;
    const isFail = r.status === "failed";
    const thumb = isDone ? r.output_image_url : r.reference_image_url;
    const badge = isDone ? `<span class="badge done">Done</span>`
                : isFail ? `<span class="badge fail">Failed</span>`
                : `<span class="badge busy"><span class="spinner"></span> ${escapeHtml(r.status || "queued")}</span>`;
    const brand = r.brand?.name || "Brand";
    const time  = timeAgo(new Date(r.created_at));
    return `<li data-id="${r.id}" data-done="${isDone ? '1':'0'}" data-url="${escapeAttr(r.output_image_url || '')}">
      <img class="thumb" src="${escapeAttr(thumb || '')}" onerror="this.style.visibility='hidden'" />
      <div class="meta">
        <div class="name">${escapeHtml(brand)} · ${escapeHtml(r.output_format || '')}</div>
        <div class="time">${time}</div>
      </div>
      ${badge}
    </li>`;
  }).join("");
  historyList.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      const done = li.dataset.done === "1";
      const url  = li.dataset.url;
      if (done && url) {
        chrome.tabs.create({ url });
      } else {
        chrome.tabs.create({ url: `${APP_URL}/history` });
      }
    });
  });
}

function schedulePoll() {
  if (pollTimer) return;
  pollTimer = setInterval(loadHistory, 5000);
}
function stopPoll() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
}
window.addEventListener("beforeunload", stopPoll);

function timeAgo(d) {
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const dd = Math.floor(h / 24); return `${dd}d ago`;
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

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
