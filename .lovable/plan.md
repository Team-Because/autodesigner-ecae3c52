
# Save to B Design — Pinterest-style extension v2

Turns the current right-click extension into a one-click "hover + save" tool, moves the whole generation pipeline server-side so closing the tab or popup never kills a job, and puts live history inside the popup so users rarely need to open the site.

## What the user gets

**On any webpage**
- Hover any image → small circular "Save to B Design" button appears in the top-right of the image (Pinterest pattern).
- Click it → a tiny inline chooser opens right next to the button with:
  - Brand dropdown (defaults to last-used, remembered per user)
  - Format chips (Square / Landscape / Portrait / Story — defaults to last-used)
  - "Save" button
- Click Save → button flips to a spinner for ~1s → checkmark "Sent to B Design" toast → job is now server-side, page can be closed.
- Right-click on any image still works as a fallback with the same one-click flow (uses last brand + format, no popup needed).

**In the extension popup**
- Two tabs: **New** and **History**.
- **New** tab: only used when the user opens the popup directly without a saved image (shows the "right-click or hover any image" hint) or to change the default brand/format.
- **History** tab: last 20 generations for the signed-in user, each row shows thumbnail, brand name, status badge (Queued / Generating / Done / Failed), timestamp. Auto-refreshes every 5s while any row is not Done/Failed. Click a Done row → open large preview + Download + "Open in B Design".
- Chrome notification when a job finishes, click → opens popup on the History tab with that row highlighted.

## Why this is tab-independent

Today the popup calls `generate-creative` directly and stores the result in `chrome.storage`. If the tab or popup closes mid-flight, the fetch is cancelled and the result is lost.

New flow: the extension does a tiny "enqueue" call that returns instantly with a `generation_id`. The heavy work runs entirely on the server. The popup only ever reads status from the DB — closing the popup, the tab, or the whole browser has zero effect.

## Architecture

```text
[Webpage]
   │  hover overlay / right-click
   ▼
[Content script]  ──► picks brand+format inline
   │  postMessage
   ▼
[Extension SW: background.js]
   │  POST /functions/v1/enqueue-generation  { brandId, imageUrl, format }
   ▼
[Edge: enqueue-generation]
   │  auth check → try_consume_credit → INSERT generations(status='queued')
   │  fire-and-forget invoke of generate-creative with { generationId }
   ▼  returns { generationId } immediately (<500ms)
[Edge: generate-creative]  (runs to completion server-side, no client attached)
   │  updates row: processing → complete/failed, refund on failure
   ▼
[DB: generations]  ◄── popup History tab reads via /rest/v1 with user JWT
```

Key points:
- The enqueue function returns the moment the row is inserted and the async job is kicked off. The extension never waits for the render.
- `generate-creative` is refactored to accept `{ generationId }` and operate on the existing row instead of creating one, so status transitions are already visible in History.
- Auto-recovery: existing `sweep-stuck-generations` already handles jobs stuck in `processing` — no new job needed.

## Extension changes

**manifest.json**
- Bump to 1.2.0.
- Add `"content_scripts"` for `<all_urls>` with `run_at: document_idle`.
- Add `host_permissions: ["<all_urls>"]` for the overlay to read image URLs cross-origin.
- Keep existing permissions.

**New: content.js + content.css**
- Injects the hover button on any `<img>` above a min size (e.g. 150×150) to avoid icon/spacer noise.
- Injects the inline chooser (shadow DOM to avoid page CSS collisions).
- Reads brand list + defaults from `chrome.storage.local` (background keeps them fresh).
- Sends `{type:"enqueue", imageUrl, brandId, format}` to background.

**background.js**
- Replace `handleGenerate` with `handleEnqueue`: single POST to `/functions/v1/enqueue-generation`, no long-lived fetch.
- Add periodic `refreshBrands()` (every 5 min while signed in) so the overlay chooser always has current list cached.
- Keep context menu, but on click send an immediate enqueue using last-used brand+format (no popup form) and show a toast/notification only.
- Notifications on completion driven by a lightweight `setInterval` (every 10s while any queued/processing row exists) that pings the History query.

**popup.html + popup.js + popup.css**
- Replace current single-flow UI with a tab bar: `New` | `History`.
- `New` tab keeps brand + format defaults (persisted as `bt_defaults`), plus the "right-click or hover" hint.
- `History` tab lists 20 latest generations for the user, polls every 5s while any non-final row exists.
- Remove the old `bt_lastResult` single-slot state — history is the source of truth.

## Backend changes

**New edge function: `supabase/functions/enqueue-generation/index.ts`**
- Verifies JWT (shared `_shared/auth.ts`).
- Validates body with Zod: `brandId` uuid, `referenceImageUrl` http(s), `outputFormat` enum.
- Confirms brand ownership (`brands.user_id = auth.uid()`).
- SSRF-checks `referenceImageUrl` via existing `_shared/ssrf.ts`.
- Calls `try_consume_credit`; if false, returns 402.
- Inserts a row into `generations` with `status='queued'`, `reference_image_url`, `output_format`, `requested_aspect_ratio/width/height`.
- Fires `supabase.functions.invoke("generate-creative", { body: { generationId } })` without awaiting the response (or uses `EdgeRuntime.waitUntil` to detach), then returns `{ generationId }` in <500ms.

**Refactor: `supabase/functions/generate-creative/index.ts`**
- Accepts either the current `{ brandId, referenceImageUrl, outputFormat }` (legacy site flow) OR `{ generationId }`.
- When `generationId` is provided, load the row, run the existing pipeline, update the same row (`processing` → `complete`/`failed`), refund credit on failure. No new insert.
- No behavior change to prompts, model routing, or rendering — this is purely a shape change on entry/exit.

**No schema changes required.** `generations.status` already supports `queued` / `processing` / `complete` / `failed` (text column). RLS already scopes SELECT to `auth.uid() = user_id`, which is exactly what the popup History needs.

## History query for the popup

Direct REST against `/rest/v1/generations`:
```
GET /rest/v1/generations?select=id,brand_id,reference_image_url,output_image_url,status,output_format,created_at,brand:brands(name)&order=created_at.desc&limit=20
```
Uses the user's JWT so RLS enforces per-user visibility. No new endpoint.

## Rollout order

1. Edge: add `enqueue-generation`, refactor `generate-creative` to accept `generationId`. Deploy.
2. Extension: content script + overlay + inline chooser, background enqueue, popup tabs + History. Bump to 1.2.0.
3. Repackage `public/bdesign-extension.zip` and update the in-app install modal copy.

## Out of scope for this pass

- Bulk multi-image save (Pinterest "Save all") — deferrable.
- Editing brand defaults per-domain — deferrable.
- Firefox/Safari builds — Chrome/Chromium only for now (matches current extension).

## Open decision (safe defaults picked, easy to change later)

- Min image size to show overlay: 150×150.
- History polling: 5s while any row is queued/processing, otherwise on popup open only.
- Notification click target: popup History tab (not a new site tab).
