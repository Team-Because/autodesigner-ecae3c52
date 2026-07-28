// B Design content script — CSP-safe hover overlay + inline chooser panel.
// -----------------------------------------------------------------------------
// Design choices worth calling out:
//  • Styles are attached via `adoptedStyleSheets` on a closed shadow root, so
//    strict CSP `style-src` / Trusted Types policies never see our CSS as raw
//    text (previous versions used shadow.innerHTML with a <style> tag which
//    could leak as visible text on some hardened sites).
//  • Detection uses `elementFromPoint` and ONLY latches onto an <img> when the
//    cursor is inside that <img>'s bounding rect. Never walk up to a wrapper
//    and pick a sibling image — that's how logos in navbars got hijacked.
//  • The overlay pill is placed relative to the specific hovered image and is
//    only shown while the cursor is over that image or over the pill itself.
// -----------------------------------------------------------------------------
(() => {
  if (window.__bdesignInjected) return;
  window.__bdesignInjected = true;

  // Bail on our own web-app origins (belt-and-suspenders — manifest already
  // excludes them, but defends against subdomain proxies).
  const HOST = location.hostname;
  if (/(^|\.)lovable\.app$|(^|\.)lovableproject\.com$|bdesign\.teambecause\.com$/i.test(HOST)) return;

  const MIN_SIZE = 120;         // visible px in viewport, not natural size
  const ICON_URL = chrome.runtime.getURL("icon.png");

  // ── Shadow host ────────────────────────────────────────────────────────────
  const host = document.createElement("bdesign-overlay-root");
  // Inline style set via setAttribute is a *style attribute*, not a <style>
  // element — allowed under `style-src` and unaffected by sanitizers.
  host.setAttribute(
    "style",
    "all:initial;position:fixed!important;top:0!important;left:0!important;" +
    "width:0!important;height:0!important;z-index:2147483646!important;" +
    "pointer-events:none!important;contain:layout style;",
  );
  const shadow = host.attachShadow({ mode: "closed" });
  (document.body || document.documentElement).appendChild(host);

  const CSS_TEXT = `
    :host, :host * { all: initial; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    .btn {
      position: fixed; z-index: 2147483647; pointer-events: auto;
      width: 32px; height: 32px; border-radius: 10px;
      background: #ffffff; border: 1px solid rgba(15,23,42,0.10);
      box-shadow: 0 6px 20px rgba(15,23,42,0.20), 0 2px 6px rgba(15,23,42,0.10);
      display: none; align-items: center; justify-content: center;
      cursor: pointer; user-select: none;
      opacity: 0; transform: scale(0.9);
      transition: opacity .12s ease, transform .12s ease, box-shadow .12s ease;
    }
    .btn.mount { display: flex; }
    .btn.show { opacity: 1; transform: scale(1); }
    .btn:hover { box-shadow: 0 8px 24px rgba(37,99,235,0.32); border-color: rgba(37,99,235,0.45); }
    .btn img { width: 22px; height: 22px; display: block; border-radius: 6px; pointer-events: none; }
    .tip {
      position: fixed; z-index: 2147483647; pointer-events: none;
      background: #0F172A; color: #fff; font-size: 11px; font-weight: 600;
      padding: 4px 8px; border-radius: 6px; opacity: 0;
      transition: opacity .12s ease; white-space: nowrap;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .tip.show { opacity: 1; }

    .panel {
      position: fixed; z-index: 2147483647; pointer-events: auto;
      width: 280px; padding: 16px;
      background: #ffffff; color: #0F172A; border-radius: 16px;
      box-shadow: 0 20px 60px rgba(15,23,42,0.28), 0 4px 12px rgba(15,23,42,0.10);
      border: 1px solid rgba(15,23,42,0.06);
      display: none;
    }
    .panel.show { display: block; }
    .head { display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; }
    .brand { display:flex; align-items:center; gap:8px; }
    .brand img { width: 22px; height: 22px; border-radius: 6px; }
    .title { font-size: 14px; font-weight: 700; color: #0F172A; letter-spacing: -0.01em; }
    .close { cursor:pointer; color:#94A3B8; font-size:16px; line-height:1; padding:2px 6px; border-radius:6px; }
    .close:hover { background:#F1F5F9; color:#0F172A; }
    .lbl { display:block; font-size: 10px; font-weight: 700; color:#64748B; text-transform: uppercase; letter-spacing: .06em; margin: 10px 0 6px; }
    select {
      width: 100%; padding: 8px 10px; border-radius: 10px;
      border: 1px solid #E2E8F0; background:#fff; font-size:13px; color:#0F172A;
      font-family: inherit; cursor: pointer;
      -webkit-appearance: menulist; appearance: menulist;
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
    .msg { font-size: 11px; margin-top: 10px; padding: 6px 8px; border-radius: 6px; display: none; }
    .msg.show { display: block; }
    .msg.err { background:#FEF2F2; color:#B91C1C; }
    .msg.ok  { background:#F0FDF4; color:#15803D; }
    .link { color:#2563EB; cursor:pointer; font-weight: 600; text-decoration: underline; }
  `;

  // Attach styles via adoptedStyleSheets (bypasses style-src / Trusted Types).
  // Fall back to a <style> node built with textContent (never innerHTML) if
  // constructable stylesheets aren't supported.
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS_TEXT);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    const s = document.createElement("style");
    s.textContent = CSS_TEXT;
    shadow.appendChild(s);
  }

  // ── DOM (built with createElement, no innerHTML anywhere) ──────────────────
  function el(tag, attrs = {}, children = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k === "html") { /* forbidden */ }
      else n.setAttribute(k, v);
    }
    for (const c of children) if (c) n.appendChild(c);
    return n;
  }

  const iconImg = () => el("img", { src: ICON_URL, alt: "" });

  const btn = el("div", { class: "btn", role: "button", "aria-label": "Save to B Design" }, [iconImg()]);
  const tip = el("div", { class: "tip", text: "Save to B Design" });

  const brandSel = el("select");
  const brandOptLoading = el("option", { value: "", text: "Loading…" });
  brandSel.appendChild(brandOptLoading);

  const fmts = el("div", { class: "formats" });
  const formatDefs = [
    ["square", "Square"],
    ["landscape", "Wide"],
    ["portrait", "Portrait"],
    ["story", "Story"],
  ];
  const fmtEls = formatDefs.map(([f, label]) => {
    const n = el("div", { class: "fmt", text: label });
    n.dataset.f = f;
    return n;
  });
  fmtEls.forEach((n) => fmts.appendChild(n));

  const saveBtn = el("button", { class: "save", text: "Generate creative" });
  const msg = el("div", { class: "msg" });
  const closeX = el("span", { class: "close", text: "✕" });

  const panel = el("div", { class: "panel" }, [
    el("div", { class: "head" }, [
      el("div", { class: "brand" }, [iconImg(), el("span", { class: "title", text: "Save to B Design" })]),
      closeX,
    ]),
    el("div", { class: "lbl", text: "Brand" }),
    brandSel,
    el("div", { class: "lbl", text: "Format" }),
    fmts,
    saveBtn,
    msg,
  ]);

  shadow.appendChild(btn);
  shadow.appendChild(tip);
  shadow.appendChild(panel);

  // ── State ──────────────────────────────────────────────────────────────────
  let currentImg = null;
  let currentUrl = "";
  let selectedFormat = "square";
  let hideTimer = null;
  let panelOpen = false;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function isEligibleImg(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const url = img.currentSrc || img.src || "";
    if (!url) return false;
    if (url.startsWith("data:") || url.startsWith("blob:")) return false;
    // Only accept http(s) URLs — we can't refetch chrome-extension:// etc.
    if (!/^https?:/i.test(url)) return false;
    const r = img.getBoundingClientRect();
    if (r.width < MIN_SIZE || r.height < MIN_SIZE) return false;
    // Skip images fully off-screen
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return false;
    // Skip zero-opacity / hidden ancestors (best-effort)
    const cs = getComputedStyle(img);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") return false;
    return true;
  }

  // Find the eligible <img> the cursor is DIRECTLY over. Never walk up to a
  // wrapper and pull a sibling/descendant image — that hijacks logos.
  function findImageAt(x, y) {
    let el0 = document.elementFromPoint(x, y);
    if (!el0) return null;
    // Skip our own overlay
    if (el0 === host) return null;
    // Direct <img> hit
    if (el0 instanceof HTMLImageElement) return isEligibleImg(el0) ? el0 : null;
    // <picture><source><img></picture> — <picture> layout is the <img> itself
    if (el0.tagName === "PICTURE") {
      const inner = el0.querySelector("img");
      if (inner && isEligibleImg(inner) && pointInRect(x, y, inner.getBoundingClientRect())) return inner;
      return null;
    }
    // Common case: an <a>, <div>, or overlay covering exactly one <img>.
    // Accept only if the cursor is inside that <img>'s rect (prevents the
    // "hover text next to a navbar logo → pill jumps to the logo" bug).
    let node = el0;
    for (let i = 0; i < 3 && node; i++) {
      const imgs = node.querySelectorAll ? node.querySelectorAll("img") : [];
      for (const im of imgs) {
        if (!isEligibleImg(im)) continue;
        if (pointInRect(x, y, im.getBoundingClientRect())) return im;
      }
      node = node.parentElement;
    }
    return null;
  }

  function pointInRect(x, y, r) {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function positionButton(img) {
    const r = img.getBoundingClientRect();
    // Anchor to the top-right of the image, clamped inside the viewport.
    const size = 32;
    let top = r.top + 8;
    let left = r.right - size - 8;
    // If the image is very small or scrolled such that its top-right is off,
    // clamp gently — but if the image is entirely off-screen, hide instead.
    if (r.bottom < 40 || r.top > innerHeight - 8) { hideButton(true); return; }
    top = Math.max(8, Math.min(innerHeight - size - 8, top));
    left = Math.max(8, Math.min(innerWidth - size - 8, left));
    btn.style.top = `${top}px`;
    btn.style.left = `${left}px`;
    // Tooltip sits to the left of the pill
    tip.style.top = `${top + 6}px`;
    tip.style.left = `${Math.max(8, left - 108)}px`;
  }

  function showButton(img) {
    currentImg = img;
    currentUrl = img.currentSrc || img.src || "";
    positionButton(img);
    btn.classList.add("mount");
    // Next frame so the transition plays
    requestAnimationFrame(() => btn.classList.add("show"));
  }

  function hideButton(immediate = false) {
    if (panelOpen) return;
    btn.classList.remove("show");
    tip.classList.remove("show");
    if (immediate) btn.classList.remove("mount");
    else setTimeout(() => { if (!btn.classList.contains("show")) btn.classList.remove("mount"); }, 140);
    currentImg = null;
  }

  function hidePanel() {
    panel.classList.remove("show");
    panelOpen = false;
    msg.classList.remove("show", "err", "ok");
    msg.textContent = "";
  }

  // ── Pointer tracking ───────────────────────────────────────────────────────
  let lastMove = 0;
  let lastX = 0, lastY = 0;
  document.addEventListener("mousemove", (e) => {
    lastX = e.clientX; lastY = e.clientY;
    const now = Date.now();
    if (now - lastMove < 50) return;
    lastMove = now;
    if (panelOpen) return;

    // If cursor is over the pill itself, keep it visible.
    if (btn.classList.contains("show")) {
      const br = btn.getBoundingClientRect();
      if (pointInRect(e.clientX, e.clientY, br)) {
        if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
        return;
      }
    }

    const img = findImageAt(e.clientX, e.clientY);
    if (img) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      if (img !== currentImg) showButton(img);
      else positionButton(img);
    } else {
      // Also allow the cursor to be inside currentImg's rect even if
      // elementFromPoint returned a lightbox/overlay above it.
      if (currentImg) {
        const r = currentImg.getBoundingClientRect();
        if (pointInRect(e.clientX, e.clientY, r) && isEligibleImg(currentImg)) {
          if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
          positionButton(currentImg);
          return;
        }
      }
      if (btn.classList.contains("show") && !hideTimer) {
        hideTimer = setTimeout(() => hideButton(), 220);
      }
    }
  }, true);

  document.addEventListener("mouseleave", () => {
    if (!panelOpen && btn.classList.contains("show") && !hideTimer) {
      hideTimer = setTimeout(() => hideButton(), 220);
    }
  }, true);

  const onScrollOrResize = () => {
    if (panelOpen) hidePanel();
    if (currentImg) {
      if (!isEligibleImg(currentImg)) hideButton(true);
      else positionButton(currentImg);
    }
  };
  window.addEventListener("scroll", onScrollOrResize, true);
  window.addEventListener("resize", onScrollOrResize);

  btn.addEventListener("mouseenter", () => {
    if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
    tip.classList.add("show");
  });
  btn.addEventListener("mouseleave", () => {
    tip.classList.remove("show");
    if (!panelOpen && !hideTimer) hideTimer = setTimeout(() => hideButton(), 220);
  });
  btn.addEventListener("click", (e) => {
    e.stopPropagation(); e.preventDefault();
    tip.classList.remove("show");
    if (!currentUrl) return;
    openPanel();
  });
  closeX.addEventListener("click", (e) => { e.stopPropagation(); hidePanel(); hideButton(true); });

  // Close panel on outside click. Use composedPath so shadow-DOM internals
  // don't trigger it.
  document.addEventListener("click", (e) => {
    if (!panelOpen) return;
    const path = e.composedPath();
    if (!path.includes(panel) && !path.includes(btn)) { hidePanel(); hideButton(true); }
  }, true);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panelOpen) { hidePanel(); hideButton(true); }
  });

  fmts.addEventListener("click", (e) => {
    const t = e.target.closest(".fmt");
    if (!t) return;
    fmtEls.forEach((n) => n.classList.remove("active"));
    t.classList.add("active");
    selectedFormat = t.dataset.f;
  });

  // ── Panel open / brand loading ────────────────────────────────────────────
  async function openPanel() {
    panelOpen = true;
    const bRect = btn.getBoundingClientRect();
    const panelW = 280, panelH = 300;
    let left = bRect.right - panelW;
    if (left < 8) left = 8;
    if (left + panelW > innerWidth - 8) left = innerWidth - panelW - 8;
    let top = bRect.bottom + 8;
    if (top + panelH > innerHeight - 8) top = Math.max(8, bRect.top - panelH - 8);
    panel.style.top = `${top}px`;
    panel.style.left = `${left}px`;
    panel.classList.add("show");
    saveBtn.disabled = false;
    saveBtn.textContent = "Generate creative";

    let brandsResp, store;
    try {
      [brandsResp, store] = await Promise.all([
        chrome.runtime.sendMessage({ type: "get_brands" }),
        chrome.storage.local.get(["bt_defaults", "bt_session"]),
      ]);
    } catch {
      brandsResp = { brands: [] }; store = {};
    }

    if (!store?.bt_session) {
      setMsg("Open the extension popup and sign in — or open B Design in another tab to sync automatically.", "err");
      saveBtn.disabled = true;
      resetBrandSelect("Not signed in");
      return;
    }
    const brands = brandsResp?.brands || [];
    if (!brands.length) {
      resetBrandSelect("No brands found");
      const m = el("span", {}, [
        document.createTextNode("Create a brand at "),
        (() => { const a = el("span", { class: "link", text: "B Design" }); a.addEventListener("click", (ev) => { ev.preventDefault(); window.open("https://autodesigner.lovable.app/brands", "_blank", "noopener"); }); return a; })(),
        document.createTextNode(" first."),
      ]);
      msg.textContent = ""; msg.appendChild(m);
      msg.classList.add("show", "err");
      saveBtn.disabled = true;
      return;
    }
    const defBrand = store.bt_defaults?.brandId;
    const defFormat = store.bt_defaults?.format || "square";
    // Rebuild select with DOM nodes (no innerHTML).
    brandSel.textContent = "";
    for (const b of brands) {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.name;
      if (b.id === defBrand) opt.selected = true;
      brandSel.appendChild(opt);
    }
    selectedFormat = defFormat;
    fmtEls.forEach((n) => n.classList.toggle("active", n.dataset.f === defFormat));
  }

  function resetBrandSelect(label) {
    brandSel.textContent = "";
    const opt = document.createElement("option");
    opt.value = ""; opt.textContent = label;
    brandSel.appendChild(opt);
  }

  function setMsg(text, kind) {
    msg.textContent = text;
    msg.classList.remove("err", "ok");
    if (kind) msg.classList.add(kind);
    msg.classList.add("show");
  }

  saveBtn.addEventListener("click", async () => {
    const brandId = brandSel.value;
    if (!brandId || !currentUrl) return;
    saveBtn.disabled = true;
    saveBtn.textContent = "Sending…";
    msg.classList.remove("show");
    let res;
    try {
      res = await chrome.runtime.sendMessage({
        type: "enqueue",
        payload: { imageUrl: currentUrl, brandId, format: selectedFormat },
      });
    } catch (e) {
      res = { ok: false, error: e?.message || "Failed" };
    }
    if (res?.ok) {
      setMsg("Sent! Generating on the server — you can close the tab.", "ok");
      saveBtn.textContent = "Sent ✓";
      setTimeout(() => { hidePanel(); hideButton(true); }, 1400);
    } else {
      setMsg(res?.error || "Failed to send", "err");
      saveBtn.disabled = false;
      saveBtn.textContent = "Retry";
    }
  });
})();
