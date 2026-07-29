# Phase 1 — Transfer data + add Google sign-in (nothing deleted)

Safe first pass. All existing accounts, admin pages, and password login stay exactly as they are. We just copy data into your target account and let you sign in with Google.

## What will change

### 1. Data transfer to `web@teambecause.com`
Target user: `6cb85228-ae31-4707-9170-3e84da5ac6f6` (web@teambecause.com).

Reassign every row's `user_id` from the five source accounts to the target — for these tables:
- `brands` (138 rows)
- `campaigns` (17 rows)
- `brand_assets` (611 rows)
- `generations` (4,318 rows)
- `activity_logs` (whatever exists)

`user_credits`: sum `credits_remaining` and `credits_used` from source rows into the target's row, then remove the now-orphaned source `user_credits` rows so the unique-per-user constraint holds.

Grant the target account the `admin` role so nothing in the app breaks while the old admin pages are still around.

**Nothing is deleted:**
- The five source auth users stay (they'll just own zero rows).
- All admin pages, account vault, and password login continue to work.
- Extension keeps working via the existing session bridge.

If you ever want to log back in as one of the old accounts to verify, you still can.

### 2. Google sign-in added alongside password login
- Enable managed Google OAuth (`configure_social_auth(providers: ["google"])`, no providers disabled).
- Add a "Continue with Google" button on `src/pages/Login.tsx` above the existing username/password form using `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.
- No email restriction yet — any Google account can sign in. (We'll lock it down to `web@teambecause.com` in a later phase once you've confirmed the transfer looks right.)
- After Google returns, the account vault stores that session just like a password login, so multi-account switching still works.

## Technical notes

- Transfer runs as a single service-role data statement — bypasses RLS while rewriting `user_id`. No schema changes.
- `campaigns.name` and `brands.name` may have duplicates across old accounts. They stay as separate rows in the target account (nothing is merged by name), so no creative history is lost. You can manually archive dupes later.
- The Google button uses the standard Lovable Cloud managed OAuth flow, so no extra client-ID setup is needed.

## After this phase

- Sign in at bdesign.teambecause.com with either your old password OR "Continue with Google" (using web@teambecause.com).
- Once signed into `web@teambecause.com`, you'll see all 138 brands and 4,318 generations from every old account in one place.
- Nothing has been removed. If any transferred data looks wrong, we can reverse it because the source accounts are untouched.

## Later phases (only after you approve this one)

- Phase 2: lock Google sign-in to `web@teambecause.com` only, delete password login and admin pages.
- Phase 3: delete the now-empty source auth users.
