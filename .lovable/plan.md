## Goal

Create **two new brand copies** (originals untouched) with rewritten briefs that fix the structural issues we identified, while keeping each brand's voice and visual essence intact.

New brands:
1. **A.Shridhar Festive (Optimized)** — duplicated from `c172a7a5…`
2. **Anantbaug Festive (Optimized)** — duplicated from `a04ba0bb…`

Both will live in the same account/campaign as their source brands.

---

## What gets fixed in each copy

Same restructuring applied to both:

1. **Add a clearly delimited `### CURRENT CAMPAIGN — Mother's Day` block** at the very top of `## MUST-INCLUDE ELEMENTS` — the only place you swap when the festival changes.
2. **Move evergreen festival methodology** (Step 1/2/3 logic, mode-selection rules) lower into `## VISUAL DIRECTION` so it stays put across festivals.
3. **Deduplicate conflicting rules** (e.g., A.Shridhar's three different "use logo once" lines collapsed into one).
4. **Add 3 sample headline+subtext couplets** to `## EXAMPLE COPY` so the Adapt step has anchor lines.
5. **Set Industry = Real Estate** on the A.Shridhar copy (the original is null).
6. **Make Mode-1 vs Mode-2 trigger explicit** on A.Shridhar ("figure in reference → Mode 1; landscape/scene → Mode 2").
7. **Remove the duplicate `## VISUAL DIRECTION` header** in Anantbaug.
8. **Relax the four-column info strip** for Anantbaug festive creatives (mark it optional when CURRENT CAMPAIGN is active).

Voice rules and never-lists stay **identical** to the originals — the essence (Anantbaug's quiet, unhurried certainty; A.Shridhar's reverent, restrained craft) is preserved word-for-word.

---

## What gets copied vs. rewritten

| Field | Action |
|---|---|
| `name` | "A.Shridhar Festive (Optimized)", "Anantbaug Festive (Optimized)" |
| `industry` | Real Estate (both) |
| `primary_color`, `secondary_color`, `extra_colors`, `logo_url` | Copied as-is |
| `brand_voice_rules` | Copied as-is |
| `negative_prompts` | Copied as-is |
| `campaign_id`, `user_id` | Copied as-is (same account/campaign) |
| `brand_brief` | **Rewritten** with the 8 fixes above |
| `brand_assets` rows | Copied as-is (so the Optimized brands have the same logos/textures available) |

Note on assets: I will **not** silently dedupe the two A.Shridhar Logo assets — I'll copy what exists. You can delete the duplicate manually in Brand Hub. Rewriting the brief without removing assets is non-destructive.

---

## Technical steps

```text
1. INSERT new brand row (A.Shridhar Optimized) — copy all fields from source,
   override name/industry/brand_brief.
2. INSERT new brand row (Anantbaug Optimized) — same pattern.
3. For each new brand: INSERT brand_assets rows mirroring the source
   brand's assets (new ids, same image_url + label + user_id).
4. Verify both new brands appear in the originating account's Brand Hub.
```

All done via the insert tool (data-only, no schema changes).

---

## What I will NOT do

- Touch the original `A.Shridhar Festive (Copy)` or `Anantbaug Festive` brands.
- Change voice, never-list, colors, or upload new assets.
- Add a new `campaign_context` DB column (you declined that earlier).
- Re-upload missing assets (chevron, sub-wordmark, project renders) — that's still on you to add manually in Brand Hub for either the original or the new copies.

---

## After approval

Once you approve, I'll switch to build mode, run the inserts, and reply with the two new brand IDs plus a one-line summary of what changed in each brief. You can then test-generate from the Optimized copies and compare against the originals.
