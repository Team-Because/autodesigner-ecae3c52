## Diagnosis

Looking at the 7 most recent generations (all marked `failed` today, 14:39–14:52 UTC):

- `layout_guide` is empty (length 0)
- `kie_task_id` is null
- `output_image_url` is empty
- No `generate-creative` edge function logs at all

This means the background worker is dying at (or before) **Step 1 — Framework Analysis**, before any update to the row succeeds. The most recent change to that step was switching framework from kie.ai `gemini-3-flash` to the new `gemini-3-pro` "thinking" endpoint with `reasoning_effort: high`. The thinking endpoint is most likely:

- returning a response shape the parser doesn't accept, or
- timing out beyond the 45s reasoning budget, or
- intermittently 5xx-ing,

…and the Lovable AI fallback is also failing (workspace credits were observed exhausted earlier today during the Adapt-stage debugging), so the function calls `markFailed("AI is temporarily degraded (framework step)")` and exits.

Adapt was already hardened with a deterministic local fallback in the previous turn; Framework was not, so any wobble there kills the whole run.

## Plan

1. **Revert framework primary to the stable endpoint**
   - Use kie.ai `gemini-3-flash` (which had a 100% success rate over the prior ~30 completed rows) as the primary for Framework Analysis.
   - Keep `gemini-3-pro` thinking only as an optional secondary, behind the existing kieChat fallback ladder — not as the first call.

2. **Add a local framework fallback (parallel to the local directive fallback)**
   - If both kie.ai and Lovable AI fail/return invalid framework JSON, synthesize a safe minimal framework from the spec (aspect ratio, brand colors, text-zone defaults) instead of hard-failing.
   - Pipeline then proceeds to Adapt → Render, so the user still gets a creative and only the *quality* degrades, not the whole run.

3. **Keep GPT-5.5 for Adapt with the robust recursive parser** (already added). No change.

4. **Tighten observability**
   - Add an explicit `console.log` at the very top of `runGenerationPipeline` (generationId + brandId) so we can confirm the worker is even starting next time logs go dark.
   - Log which provider/endpoint produced the framework (kie-flash / kie-thinking / lovable / local-fallback).

5. **Cleanup**
   - Mark the 7 stuck-failed rows as "failed (no credit charged)" — credits were already not deducted, but the History row currently reads as a generic failure. (Cosmetic; optional.)

6. **Validation**
   - After deploy, run one generation end-to-end and confirm: `layout_guide` populated, `kie_task_id` set, `output_image_url` populated, status `completed`.
   - If kie thinking endpoint is genuinely down, the flash primary keeps the system working; if Lovable credits are out, the local fallback keeps it working.

## Files to change

- `supabase/functions/generate-creative/index.ts` — framework primary endpoint, add `buildLocalFrameworkFallback`, extra logging.

## Expected outcome

New generations stop hard-failing at Step 1. Even under degraded AI conditions the pipeline reaches the image-render step, which is where the actual creative is produced.
