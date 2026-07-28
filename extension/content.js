// B Design content script — tiny icon-only hover overlay + inline chooser panel.
// -----------------------------------------------------------------------------
(() => {
  if (window.__bdesignInjected) return;
  window.__bdesignInjected = true;

  const MIN_SIZE = 140;
  const ICON_URL = chrome.runtime.getURL("icon.png");

  const host = document.createElement("div");
  host.style.cssText = "position:absolute;top:0;left:0;width:0;height:0;z-index:2147483646;pointer-events:none";
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: "closed" });
  shadow.innerHTML = `
    <style>
      :host, * { all: initial; box-sizing: border-box; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      .btn {
        position: fixed; z-index: 2147483647; pointer-events: auto;
        width: 32px; height: 32px; border-radius: 10px;
        background: #ffffff; border: 1px solid rgba(15,23,42,0.08);
        box-shadow: 0 6px 20px rgba(15,23,42,0.18), 0 2px 6px rgba(15,23,42,0.08);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; user-select: none;
        opacity: 0; transform: scale(0.9); transition: opacity .12s ease, transform .12s ease, box-shadow .12s ease;
      }
      .btn.show { opacity: 1; transform: scale(1); }
      .btn:hover { box-shadow: 0 8px 24px rgba(37,99,235,0.28); border-color: rgba(37,99,235,0.35); }
      .btn img { width: 22px; height: 22px; display: block; border-radius: 6px; }
      .tip {
        position: fixed; z-index: 2147483647; pointer-events: none;
        background: #0F172A; color: #fff; font-size: 11px; font-weight: 600;
        padding: 4px 8px; border-radius: 6px; opacity: 0; transform: translateY(-2px);
        transition: opacity .12s ease;
      }
      .tip.show { opacity: 1; }
      .panel {
        position: fixed; z-index: 2147483647; pointer-events: auto;
        width: 280px; padding: 16px;
        background: #ffffff; color: #0F172A; border-radius: 16px;
        box-shadow: 0 20px 60px rgba(15,23,42,0.25), 0 4px 12px rgba(15,23,42,0.08);
        border: 1px solid rgba(15,23,42,0.06);
        display: none; font-family: 'Inter', -apple-system, sans-serif;
      }
      .panel.show { display: block; }
      .head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; }
      .brand { display:flex; align-items:center; gap:8px; }
      .brand img { width: 22px; height: 22px; border-radius: 6px; }
      .title { font-size: 14px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em; }
      .close { cursor:pointer; color:#94A3B8; font-size:16px; line-height:1; padding:2px 6px; border-radius:6px; }
      .close:hover { background:#F1F5F9; color:#0F172A; }
      label { display:block; font-size: 10px; font-weight: 700; color:#64748B; text-transform: uppercase; letter-spacing: .06em; margin: 10px 0 6px; }
      select {
        width: 100%; padding: 8px 10px; border-radius: 10px;
        border: 1px solid #E2E8F0; background:#fff; font-size:13px; color:#0F172A;
        font-family: inherit; cursor: pointer;
      }
      select:focus { outline: 2px solid #2563EB; outline-offset: -1px; border-color: transparent; }
      .formats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
      .fmt {
        padding: 8px 4px; border: 1px solid #E2E8F0; border-radius: 10px;
        text-align:center; font-size:11px; font-weight:600; cursor:pointer;
        color:#475569; background:#fff; transition: all .12s ease;
      }
      .fmt:hover { border-color:#CBD5E1; }
      .fmt.active { background: #2563EB; color:#fff; border-color:#2563EB; }
      .save {
        display:block; width:100%; margin-top:14px; padding:10px 12px;
        background:#0F172A; color:#fff; border:none; border-radius:10px;
        font-weight:700; font-size:13px; cursor:pointer; font-family: inherit;
        transition: background .12s ease;
      }
      .save:hover { background:#2563EB; }
      .save[disabled] { opacity: .6; cursor: not-allowed; }
      .msg { font-size: 11px; margin-top: 10px; padding: 6px 8px; border-radius: 6px; }
      .msg.err { background:#FEF2F2; color:#B91C1C; }
      .msg.ok  { background:#F0FDF4; color:#15803D; }
      a { color:#2563EB; text-decoration: none; cursor:pointer; font-weight: 600; }
    </style>
    <div class="btn" id="btn" title="Save to B Design"><img src="${ICON_URL}" alt="" /></div>
    <div class="tip" id="tip">Save to B Design</div>
    <div class="panel" id="panel">
      <div class="head">
        <div class="brand"><img src="${ICON_URL}" alt="" /><span class="title">Save to B Design</span></div>
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
      <button class="save" id="save">Generate creative</button>
      <div class="msg" id="msg" style="display:none"></div>
    </div>
  `;

  const btn = shadow.getElementById("btn");
  const tip = shadow.getElementById("tip");
  const panel = shadow.getElementById("panel");
  const brandSel = shadow.getElementById("brand");
  const fmts = shadow.getElementById("fmts");
  const saveBtn = shadow.getElementById("save");
  const msg = shadow.getElementById("msg");
  const closeX = shadow.getElementById("close");

  let currentImg = null;
  let currentUrl = "";
  let selectedFormat = "square";
  let hideTimer = null;

  function isEligibleImg(el) {
    if (!(el instanceof HTMLImageElement)) return false;
    const url = el.currentSrc || el.src || "";
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) return false;
    const w = el.naturalWidth || el.width || el.clientWidth;
    const h = el.naturalHeight || el.height || el.clientHeight;
    return w >= MIN_SIZE && h >= MIN_SIZE;
  }

  function positionButton(img) {
    const r = img.getBoundingClientRect();
    // Top-right corner of the image, slightly inset.
    btn.style.top = `${Math.max(8, r.top + 8)}px`;
    btn.style.left = `${Math.max(8, r.right - 40)}px`;
    tip.style.top = `${Math.max(8, r.top + 8)}px`;
    tip.style.left = `${Math.max(8, r.right - 40 - 96)}px`;
  }
  function showButton(img) {
    currentImg = img;
    currentUrl = img.currentSrc || img.src || "";
    positionButton(img);
    btn.classList.add("show");
  }
  function hideButton() {
    if (panel.classList.contains("show")) return;
    btn.classList.remove("show");
    tip.classList.remove("show");
    currentImg = null;
  }
  function hidePanel() {
    panel.classList.remove("show");
    msg.style.display = "none";
    msg.textContent = "";
    msg.className = "msg";
  }

  // Detection via mousemove + elementFromPoint — more reliable than mouseover
  // on sites where images are wrapped in overlays/anchors that intercept events.
  let lastMove = 0;
  document.addEventListener("mousemove", (e) => {
    const now = Date.now();
    if (now - lastMove < 60) return;
    lastMove = now;
    if (panel.classList.contains("show")) return;
    // Ignore movement over our own overlay
    const overBtn = e.clientX >= parseFloat(btn.style.left || 0) &&
                    e.clientX <= parseFloat(btn.style.left || 0) + 32 &&
                    e.clientY >= parseFloat(btn.style.top || 0) &&
                    e.clientY <= parseFloat(btn.style.top || 0) + 32;
    if (overBtn && btn.classList.contains("show")) return;

    let el = document.elementFromPoint(e.clientX, e.clientY);
    // Walk up a few ancestors to find an <img>
    let img = null;
    for (let i = 0; i < 4 && el; i++) {
      if (el instanceof HTMLImageElement) { img = el; break; }
      // Try to find <img> descendant of small wrappers (e.g. <a><img></a>)
      const inner = el.querySelector && el.querySelector("img");
      if (inner && isEligibleImg(inner)) { img = inner; break; }
      el = el.parentElement;
    }
    if (img && isEligibleImg(img)) {
      if (img !== currentImg) {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        showButton(img);
      }
    } else {
      if (btn.classList.contains("show") && !hideTimer) {
        hideTimer = setTimeout(hideButton, 200);
      }
    }
  }, true);

  window.addEventListener("scroll", () => {
    if (currentImg && !panel.classList.contains("show")) positionButton(currentImg);
  }, true);
  window.addEventListener("resize", () => {
    if (currentImg && !panel.classList.contains("show")) positionButton(currentImg);
  });

  btn.addEventListener("mouseenter", () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    tip.classList.add("show");
  });
  btn.addEventListener("mouseleave", () => {
    tip.classList.remove("show");
  });
  btn.addEventListener("click", async (e) => {
    e.stopPropagation(); e.preventDefault();
    tip.classList.remove("show");
    if (!currentUrl) return;
    await openPanel();
  });
  closeX.addEventListener("click", (e) => { e.stopPropagation(); hidePanel(); hideButton(); });
  document.addEventListener("click", (e) => {
    if (!panel.classList.contains("show")) return;
    const path = e.composedPath();
    if (!path.includes(panel) && !path.includes(btn)) { hidePanel(); hideButton(); }
  }, true);

  fmts.addEventListener("click", (e) => {
    const el = e.target.closest(".fmt");
    if (!el) return;
    fmts.querySelectorAll(".fmt").forEach((n) => n.classList.remove("active"));
    el.classList.add("active");
    selectedFormat = el.dataset.f;
  });

  async function openPanel() {
    const bRect = btn.getBoundingClientRect();
    // Prefer showing to the left of the button so it stays on-image.
    const panelW = 280;
    let left = bRect.right - panelW;
    if (left < 8) left = 8;
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
    let top = bRect.bottom + 8;
    if (top + 300 > window.innerHeight) top = Math.max(8, bRect.top - 300);
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.classList.add("show");
    saveBtn.disabled = false;
    saveBtn.textContent = "Generate creative";

    const [brandsResp, defaultsStore] = await Promise.all([
      chrome.runtime.sendMessage({ type: "get_brands" }).catch(() => ({ brands: [] })),
      chrome.storage.local.get(["bt_defaults", "bt_session"]),
    ]);
    if (!defaultsStore.bt_session) {
      showMsg("Sign in to the B Design extension first.", "err");
      saveBtn.disabled = true;
      brandSel.innerHTML = `<option value="">Not signed in</option>`;
      return;
    }
    const brands = brandsResp?.brands || [];
    if (!brands.length) {
      brandSel.innerHTML = `<option value="">No brands found</option>`;
      msg.style.display = "block";
      msg.className = "msg err";
      msg.innerHTML = `Create a brand at <a id="openApp">B Design</a> first.`;
      shadow.getElementById("openApp")?.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.open("https://autodesigner.lovable.app/brands", "_blank");
      });
      saveBtn.disabled = true;
      return;
    }
    const defBrand = defaultsStore.bt_defaults?.brandId;
    const defFormat = defaultsStore.bt_defaults?.format || "square";
    brandSel.innerHTML = brands.map((b) =>
      `<option value="${b.id}" ${b.id === defBrand ? "selected" : ""}>${escapeHtml(b.name)}</option>`
    ).join("");
    selectedFormat = defFormat;
    fmts.querySelectorAll(".fmt").forEach((n) => {
      n.classList.toggle("active", n.dataset.f === defFormat);
    });
  }

  function showMsg(text, kind) {
    msg.style.display = "block";
    msg.textContent = text;
    msg.className = `msg ${kind || ""}`;
  }

  saveBtn.addEventListener("click", async () => {
    const brandId = brandSel.value;
    if (!brandId || !currentUrl) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "Sending…";
    msg.style.display = "none";
    const res = await chrome.runtime.sendMessage({
      type: "enqueue",
      payload: { imageUrl: currentUrl, brandId, format: selectedFormat },
    }).catch((e) => ({ ok: false, error: e?.message || "Failed" }));
    if (res?.ok) {
      showMsg("Sent! Generating on the server — you can close the tab.", "ok");
      saveBtn.textContent = "Sent ✓";
      setTimeout(() => { hidePanel(); hideButton(); }, 1400);
    } else {
      showMsg(res?.error || "Failed to send", "err");
      saveBtn.disabled = false;
      saveBtn.textContent = "Retry";
    }
  });

  function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }
})();
