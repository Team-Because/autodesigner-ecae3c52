## Problem

History page shows only the newest ~1,000 generations. Older ones (from before ~June) appear "missing," but they're all safe:
- 3,597 completed generations exist in the database going back to March 12
- Every image file is intact in Supabase Storage and serves correctly
- Nothing has ever deleted a row or a file

The root cause is that `src/pages/History.tsx` uses a single unbounded `SELECT *` on `generations`, and Supabase's Data API silently caps responses at 1,000 rows. So the client never receives the older 2,500+ rows.

## Fix: paginated fetch with infinite scroll

Replace the single-shot query with a paginated one using TanStack Query's `useInfiniteQuery` and Supabase's `.range()`.

### Implementation

**1. `src/pages/History.tsx`**
- Swap `useQuery` → `useInfiniteQuery`
- Page size: 60 rows per page (fits 3 rows × 20 cards, cheap to fetch)
- Query: `.select("*", { count: "exact" }).order("created_at", { ascending: false }).range(from, to)`
- `getNextPageParam`: return next offset if `data.length === pageSize`, else `undefined`
- Flatten pages into the existing `generations` array used by `filtered`
- Add a sentinel `<div ref>` at the bottom of the grid that triggers `fetchNextPage()` via `IntersectionObserver` (or a simple "Load more" button — both work; infinite scroll is smoother)
- Show a small skeleton row while `isFetchingNextPage`
- Display total count in the header: "Generation History (3,597)"

**2. Handle filters correctly**
Client-side filters (brand, date range, search) currently run on the loaded array. With pagination this only filters what's already fetched, which is misleading. Two options:
- **Recommended:** push filters into the query itself (`.eq("brand_id", …)`, `.gte("created_at", …)`, `.ilike` join on brand name) so filtering searches the full history, not just the loaded pages.
- Simpler fallback: keep filters client-side but auto-fetch more pages until either the filter has results or all pages are loaded. Slower for narrow filters but no query rewrite.

Pick the server-side path — it's the correct behavior and only ~15 extra lines.

**3. `src/pages/AdminHistory.tsx`**
Apply the same pagination pattern here; the admin view has the same query shape and the same silent cap.

## Out of scope

- No database migration
- No storage changes
- No changes to `generate-creative` or any edge function
- No changes to retention (there is no retention policy today; nothing is being deleted)

## Verification

After the change:
1. Open History → scroll to the bottom → confirm older pages load
2. Filter by a brand that has old creatives → confirm March/April results appear
3. Confirm the header count matches the DB total (~3,597)

## Technical notes

- TanStack Query v5 `useInfiniteQuery` requires `initialPageParam` (start at 0) and `getNextPageParam`
- `count: "exact"` adds one COUNT query per fetch — fine at this scale; switch to `"estimated"` if it ever gets slow
- `IntersectionObserver` sentinel should have `rootMargin: "400px"` so the next page starts loading before the user hits the end
