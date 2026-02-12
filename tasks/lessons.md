# Lessons Learned

## 2026-02-10 - NSIS / Tauri productName
**Mistake**: Used apostrophe in `productName` (`Simpl'Résultat`) which broke the NSIS installer script on Windows CI
**Pattern**: NSIS uses single quotes as string delimiters — special characters in `productName` get interpolated into NSIS scripts and can break the build
**Rule**: Keep `productName` in `tauri.conf.json` free of apostrophes and other shell/script-special characters. Use `app.windows[].title` for the display name with special characters.
**Applied**: Tauri v2 Windows builds, any NSIS-based packaging

## 2026-02-10 - GitHub Actions GITHUB_TOKEN permissions
**Mistake**: Workflow failed with `Resource not accessible by integration` when tauri-action tried to create a GitHub Release
**Pattern**: By default, `GITHUB_TOKEN` has read-only `contents` permission in newer repos / org settings. Creating releases requires write access.
**Rule**: Always add `permissions: contents: write` at the top level of any GitHub Actions workflow that creates releases or pushes tags/artifacts.
**Applied**: Any workflow using `tauri-apps/tauri-action`, `softprops/action-gh-release`, or direct GitHub Release API calls

## 2026-02-11 - Write tool requires Read first
**Mistake**: Tried to overwrite the plan file with the Write tool without reading it first, causing an error: "File has not been read yet. Read it first before writing to it."
**Pattern**: The Write tool enforces a safety check — you must Read a file at least once in the conversation before you can Write to it. This prevents accidental overwrites of files you haven't seen.
**Rule**: Always Read a file before using Write on it, even if you intend to completely replace its contents. This applies to plan files, config files, and any existing file.
**Applied**: All file editing workflows, especially plan mode where you repeatedly update the plan file

## 2026-02-11 - CSV preprocessing must be applied everywhere
**Mistake**: `preprocessQuotedCSV()` was only called in `parsePreview`, not in `loadHeadersWithConfig`. Desjardins CSVs parsed as single-column in header loading.
**Pattern**: When a preprocessing step is needed for data parsing, it must be applied at EVERY code path that parses the same data — not just the main one.
**Rule**: When adding a preprocessing step, grep for all call sites that parse the same data format and apply the step consistently.
**Applied**: CSV import, any file format with a normalization/preprocessing layer

## 2026-02-11 - Synthetic headers needed for no-header CSVs in all dispatches
**Mistake**: `parsePreview` left `headers = []` when `hasHeader: false`, overwriting previously loaded synthetic headers. Column mapping editor disappeared on back-navigation.
**Pattern**: State dispatches can overwrite previous state. If a component depends on state set by an earlier step, later dispatches must preserve or regenerate that state.
**Rule**: When dispatching state updates that include derived data (like headers), always populate ALL fields — don't leave arrays empty assuming they'll persist from a previous dispatch.
**Applied**: Wizard-style multi-step UIs with back-navigation

## 2026-02-11 - Constant numeric columns are identifiers, not amounts
**Mistake**: Account number and transit number columns passed numeric detection because they contain valid numbers, but they're identifiers not amounts.
**Pattern**: Identifier columns have very low cardinality relative to row count (often a single repeated value). Amount columns vary per transaction.
**Rule**: When detecting "amount" columns in CSV auto-detect, exclude numeric columns with ≤1 distinct value. Also treat 0 as "empty" in sparse-complementary detection for debit/credit pairs.
**Applied**: CSV auto-detection, any heuristic column type inference
