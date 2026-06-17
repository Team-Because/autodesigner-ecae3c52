## What I found

The current failures are **not caused by file size** and do not look like a Kie credit issue.

Recent data shows:
- **The Universe** and **Vaikunth** are failing.
- **Absolute** completed successfully with the same 1.29 MB reference-image pattern.
- The failed rows have `layout_guide` stored as an **empty string** (`length = 0`), while completed rows have a full JSON framework (`length ~1500`).
- The edge function then reuses that empty stored framework and crashes in Adapt with:

```text
Cannot convert undefined or null to object
at sanitizeFramework(...)
```

So the likely root cause is: **some generation rows are being created or left with an empty `layout_guide`; the backend treats that as an existing framework and skips proper framework analysis, then Adapt crashes.**

## Plan to fix

1. **Make framework parsing strict**
   - Treat `null`, empty string, whitespace, `{}`, and invalid/partial framework objects as “no saved framework”.
   - Only reuse a saved framework if it has the required structure: `layout`, `style`, `text_elements`, and `composition_notes`.

2. **Make `sanitizeFramework` defensive**
   - If it receives missing/invalid input, return a safe minimal framework instead of throwing.
   - This prevents the user-facing failure from being a raw TypeError.

3. **Ensure newly analyzed frameworks are valid before saving**
   - After framework analysis, validate the framework before writing it to the generation row.
   - If invalid, fail cleanly with a useful reason instead of saving empty/invalid data.

4. **Improve failure logging**
   - Log whether Adapt used a stored framework or freshly analyzed one.
   - Log when an empty/invalid saved framework is ignored and re-analysis is triggered.

5. **Optional cleanup migration**
   - Normalize existing broken rows where `layout_guide = ''` so future retries re-analyze instead of reusing empty data.
   - This would only affect failed/incomplete generation rows, not completed creatives.

## Expected result

After this, small assets/references should work normally because the backend will no longer reuse an empty framework. If a specific asset truly fails later, logs will show the real asset/image error instead of this masking TypeError.