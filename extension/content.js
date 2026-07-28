// BDesign content script — Pinterest-style hover overlay
// -----------------------------------------------------------------------------
// Shows a small "Save to BDesign" button on any image (>= MIN_SIZE) when the
// user hovers. Clicking it opens an inline chooser (brand + format) inside a
// shadow DOM to avoid site CSS collisions. On save, forwards to the background
// service worker which enqueues on the server.
// -----------------------------------------------------------------------------
(() => {
  if (window.__bdesignInjected) return;
  window.__bdesignInjected = true;

  const MIN_SIZE = 150;

  // Shadow host containing the overlay button + chooser panel.
  const host = document.createElement("div");
  host.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      :host, * { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; box-sizing: border-box; }
      .btn {
        position: fixed; z-index: 2147483647; pointer-events: auto;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 6px 10px; border-radius: 999px;
        background: #111; color: #fff; font-size: 12px; font-weight: 600;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        cursor: pointer; user-select: none;
        opacity: 0; transform: translateY(-2px); transition: opacity .12s, transform .12s;
      }
      .btn.show { opacity: 1; transform: translateY(0); }
      .btn:hover { background: #2563EB; }
      .dot { width: 8px; height: 8px; border-radius: 50%; background: #E5B800; display:inline-block; }
      .panel {
        position: fixed; z-index: 2147483647; pointer-events: auto;
        min-width: 240px; padding: 12px;
        background: #fff; color: #111; border-radius: 12px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.25);
        border: 1px solid rgba(0,0,0,0.08);
        display: none;
      }
      .panel.show { display: block; }
      .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
      .title { font-size: 12px; font-weight: 700; color: #111; }
      .close { cursor:pointer; color:#888; font-size:14px; padding:2px 6px; }
      label { display:block; font-size: 11px; color:#555; margin: 8px 0 4px; font-weight: 600; }
      select {
        width: 100%; padding: 6px 8px; border-radius: 8px;
        border: 1px solid rgba(0,0,0,0.15); background:#fff; font-size:12px; color:#111;
      }
      .formats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
      .fmt { padding: 6px 4px; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; text-align:center; font-size:11px; cursor:pointer; color:#333; background:#fafafa; }
      .fmt.active { background: #2563EB; color:#fff; border-color:#2563EB; }
      .save {
        display:block; width:100%; margin-top:10px; padding:8px 10px;
        background:#111; color:#fff; border:none; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;
      }
      .save[disabled] { opacity: .6; cursor: not-allowed; }
      .msg { font-size: 11px; color:#555; margin-top: 6px; }
      .msg.err { color:#c62828; }
      .msg.ok  { color:#1b8f3a; }
      .hint { font-size:11px; color:#666; }
      a { color:#2563EB; text-decoration: none; cursor:pointer; }
    </style>
    <div class="btn" id="btn"><span class="dot"></span><span>Save to BDesign</span></div>
    <div class="panel" id="panel">
      <div class="row">
        <div class="title">Save to BDesign</div>
        <span class="close" id="close">✕</span>
      </div>
      <label for="brand">Brand</label>
      <select id="brand"><option value="">Loading…</option></select>
      <label>Format</label>
      <div class="formats" id="fmts">
        <div class="fmt" data-f="square">Square</div>
        <div class="fmt" data-f="landscape">Wide</div>
        <div class="fmt" data-f="portrait">Portrait</div>
        <div class="fmt" data-f="story">Story</div>
      </div>
      <button class="save" id="save">Save</button>
      <div class="msg" id="msg"></div>
    </div>
  `;

  const btn    = shadow.getElementById("btn");
  const panel  = shadow.getElementById("panel");
  const brandSel = shadow.getElementById("brand");
  const fmts   = shadow.getElementById("fmts");
  const saveBtn = shadow.getElementById("save");
  const msg    = shadow.getElementById("msg");
  const closeX = shadow.getElementById("close");

  let currentImg = null;
  let currentUrl = "";
  let selectedFormat = "square";
  let hideTimer = null;

  function positionButton(img) {
    const r = img.getBoundingClientRect();
    btn.style.top  = `${Math.max(8, r.top + 8)}px`;
    btn.style.left = `${Math.max(8, r.right - 138)}px`;
  }
  function showButton(img) {
    currentImg = img;
    currentUrl = img.currentSrc || img.src || "";
    if (!currentUrl || currentUrl.startsWith("data:") || currentUrl.startsWith("blob:")) return;
    positionButton(img);
    btn.classList.add("show");
  }
  function hideButton() {
    btn.classList.remove("show");
    currentImg = null;
  }
  function hidePanel() {
    panel.classList.remove("show");
    msg.textContent = "";
    msg.className = "msg";
  }

  document.addEventListener("mouseover", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLImageElement)) return;
    if (t.naturalWidth < MIN_SIZE || t.naturalHeight < MIN_SIZE) return;
    if (panel.classList.contains("show")) return;
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    showButton(t);
  }, true);

  document.addEventListener("mouseout", (e) => {
    if (!currentImg) return;
    if (panel.classList.contains("show")) return;
    if (e.relatedTarget && (e.relatedTarget === btn || btn.contains(e.relatedTarget))) return;
    hideTimer = setTimeout(hideButton, 120);
  }, true);

  window.addEventListener("scroll", () => {
    if (currentImg && !panel.classList.contains("show")) positionButton(currentImg);
  }, true);

  btn.addEventListener("mouseenter", () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } });
  btn.addEventListener("click", async (e) => {
    e.stopPropagation(); e.preventDefault();
    if (!currentUrl) return;
    await openPanel();
  });
  closeX.addEventListener("click", hidePanel);
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("show")) return;
    const path = e.composedPath();
    if (!path.includes(panel) && !path.includes(btn)) hidePanel();
  }, true);

  fmts.addEventListener("click", (e) => {
    const el = e.target.closest(".fmt");
    if (!el) return;
    fmts.querySelectorAll(".fmt").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    selectedFormat = el.dataset.f;
  });

  async function openPanel() {
    // Position near button
    const bRect = btn.getBoundingClientRect();
    panel.style.top  = `${bRect.bottom + 6}px`;
    panel.style.left = `${Math.max(8, bRect.right - 260)}px`;
    panel.classList.add("show");
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";

    // Load brands + defaults from background.
    const [brandsResp, defaultsStore] = await Promise.all([
      chrome.runtime.sendMessage({ type: "get_brands" }).catch(() => ({ brands: [] })),
      chrome.storage.local.get(["bt_defaults", "bt_session"]),
    ]);
    if (!defaultsStore.bt_session) {
      msg.textContent = "Sign in to the BDesign extension first.";
      msg.className = "msg err";
      saveBtn.disabled = true;
      brandSel.innerHTML = "";
      return;
    }
    const brands = brandsResp?.brands || [];
    if (!brands.length) {
      brandSel.innerHTML = `<option value="">No brands found</option>`;
      msg.innerHTML = `Create a brand at <a href="#" id="openApp">BDesign</a> first.`;
      msg.className = "msg err";
      shadow.getElementById("openApp")?.addEventListener("click", (ev) => {
        ev.preventDefault();
        chrome.runtime.sendMessage({ type: "open_app" }).catch(() => {});
        window.open("https://autodesigner.lovable.app/brands", "_blank");
      });
      saveBtn.disabled = true;
      return;
    }
    const defBrand  = defaultsStore.bt_defaults?.brandId;
    const defFormat = defaultsStore.bt_defaults?.format || "square";
    brandSel.innerHTML = brands.map((b) =>
      `<option value="${b.id}" ${b.id === defBrand ? "selected" : ""}>${escapeHtml(b.name)}</option>`
    ).join("");
    selectedFormat = defFormat;
    fmts.querySelectorAll(".fmt").forEach((n) => {
      n.classList.toggle("active", n.dataset.f === defFormat);
    });
  }

  saveBtn.addEventListener("click", async () => {
    const brandId = brandSel.value;
    if (!brandId || !currentUrl) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "Sending…";
    msg.textContent = "";
    const res = await chrome.runtime.sendMessage({
      type: "enqueue",
      payload: { imageUrl: currentUrl, brandId, format: selectedFormat },
    }).catch((e) => ({ ok: false, error: e?.message || "Failed" }));
    if (res?.ok) {
      msg.textContent = "Sent! You can close this tab.";
      msg.className = "msg ok";
      saveBtn.textContent = "Sent ✓";
      setTimeout(() => { hidePanel(); hideButton(); }, 1200);
    } else {
      msg.textContent = res?.error || "Failed to send";
      msg.className = "msg err";
      saveBtn.disabled = false;
      saveBtn.textContent = "Retry";
    }
  });

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }
})();
