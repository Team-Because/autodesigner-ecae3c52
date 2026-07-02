# Plan — Improve ABSOLUTE output quality (brand-side, not system)

You're right — the pipeline is producing what the inputs tell it to. Absolute's brief, asset library, and reference habits are what's capping quality. This plan changes only the brand setup for ABSOLUTE.

## What I audited

- Brand row: brief exists, but has structural problems (below).
- Last 10 generations: all `4:5`, no `campaign_message` on any run, references rotate across only ~2 files, one 3D building image is being reused as both reference and hero.
- Voice rules field duplicates the tail of the brief (redundant, dilutes prompt).

## Diagnosed weaknesses

1. **Brief bloat & duplication** — `## VISUAL DIRECTION` header appears twice; `brand_voice_rules` re-pastes the "Luxury, aspirational…" block already in the brief. Repeated text pushes the model toward the same phrasing every run.
2. **Vague "match the reference" instructions** — Brief literally says "closely match the reference in typography, hierarchy, spacing." This tells the model to *copy* the reference instead of using it as a blueprint, which is the exact confusion you flagged earlier.
3. **Reference/hero collision** — Some generations use the ABSOLUTE 3D building itself as the reference image. That guarantees the model conflates "layout blueprint" with "hero subject."
4. **Narrow asset variety** — Same 3D building used every time → visually identical outputs even when copy changes.
5. **No campaign context per run** — `campaign_message` empty on every recent generation, so the model has nothing to differentiate one ad from the next beyond mood rotation.
6. **Example copy list is too specific** — 7 near-identical "Architecture / Landmark / Ownership" lines. Model keeps regurgitating this cluster.

## Changes to make in Brand Hub (ABSOLUTE)

### A. Brief cleanup (BrandForm → Brand Brief)

- Remove the duplicate `## VISUAL DIRECTION` header.
- Rewrite the Reference Alignment paragraph from "closely match" → *"Use references only as compositional blueprints (zone layout, text-to-image ratio, negative space, typography, colors)."*
- Cut `## EXAMPLE COPY` down to **3 lines** representing distinct angles (Landmark, Scarcity, Investment) — not 7 variations of the same idea.
- Add a `## COPY ANGLES TO ROTATE` section listing 6-8 *directions* (not finished lines): Architectural authority · Scarcity/last units · Investment thesis · Location prestige · Design provenance (Zaha) · Possession timeline · Skyline identity · Legacy ownership.

### B. Voice rules

- Replace `brand_voice_rules` with a short, non-overlapping ruleset only (≤400 chars): allowed registers, forbidden words ("luxury" overuse, "unparalleled", "epitome"), sentence length cap, no exclamation marks, no emoji.

### C. Negative prompts (visual + content nevers)

- **Visual nevers:** no stock skyline photos, no generic glass towers, no lens flares, no gold gradients, no people, no cars in foreground, no text over the building's curves.
- **Content nevers:** no discount/offer language, no "book now" urgency, no superlatives without proof, no generic "your dream office" phrasing.

### D. Asset library

- Upload **3–5 additional ABSOLUTE 3D renders** at different angles (hero close-up, dusk wide, corner cantilever, lobby, top-down) so the model has variety to select from per mood.
- Tag each asset with a distinct label (Hero-Dusk, Corner-Cantilever, Facade-Detail, etc.) so multi-asset selection produces different-looking creatives.

### E. Reference discipline (Studio behavior, per generation)

- **Never** upload the ABSOLUTE building itself as a reference. References must be *other people's ads* whose layout structure you want to borrow.
- Curate a small "Absolute reference library" (5–7 ads from luxury real estate / auto / watches) with strong editorial layouts and use those on rotation.

## What I will do when you approve

Because ABSOLUTE's brand row is user-owned data, I can't rewrite it for you from plan mode. Once approved I'll switch to build mode and:

1. Open ABSOLUTE in Brand Hub and apply cleanup A–C directly to the brand row (I have write access via the app).
2. Add the visual/content nevers to `negative_prompts`.
3. Leave asset upload (D) and reference curation (E) as a short checklist for you — I can't upload new 3D renders or ad screenshots on your behalf.

## Not touching

- `generate-creative` edge function, prompts, model config, fallback logic — all stay as-is.
- Other brands' setups.
- Credit / auth / security surfaces.

Approve and I'll apply A–C directly; D–F I'll hand back as a checklist for the team.