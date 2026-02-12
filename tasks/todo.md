# Task: Fix 3 Desjardins CSV Import Bugs

## Root Cause Analysis

### Bug 1: No-header columns show "0: Col 0" for every column
**Root cause:** `loadHeadersWithConfig` doesn't call `preprocessQuotedCSV()` before parsing. For Desjardins-style quoted CSVs, PapaParse sees each line as a single column. So `firstDataRow` has only 1 element → generates only `["Col 0"]`.

### Bug 2: Going back from preview loses column mapping
**Root cause:** `parsePreview` only populates `headers` when `hasHeader: true`. When `hasHeader: false`, it leaves `headers = []`, overwriting `previewHeaders`. On source-config, `{headers.length > 0 && <ColumnMappingEditor />}` renders nothing.

### Bug 3: Auto-detect amount picks account number column
**Root cause:** Constant numeric columns (account number, transit number) pass the "≥50% numeric" check. If the debit/credit columns have 0 instead of empty, `isSparseComplementary` fails. Falls back to first numeric candidate = account number.

## Plan
- [x] Bug 1: Add `preprocessQuotedCSV()` in `loadHeadersWithConfig` before PapaParse
- [x] Bug 2: In `parsePreview`, generate synthetic headers when `hasHeader: false`
- [x] Bug 3a: Exclude constant-value numeric columns from amount candidates
- [x] Bug 3b: Treat 0 values as empty in `isSparseComplementary`
- [x] Build verification
- [x] Update lessons.md

## Progress Notes
- Bug 1: Added `preprocessQuotedCSV(preview)` call in `loadHeadersWithConfig` (useImportWizard.ts:341)
- Bug 2: Added else-if branch in `parsePreview` to generate `Col N` headers when hasHeader is false (useImportWizard.ts:450-453)
- Bug 3a: Added `distinctValues` tracking in `detectNumericColumns`, skip columns with ≤1 distinct value and >2 rows (csvAutoDetect.ts:227-236)
- Bug 3b: Changed `isSparseComplementary` to parse values and treat `0` as empty (csvAutoDetect.ts:452-455)

## Review
Build passes. 2 files changed: useImportWizard.ts, csvAutoDetect.ts. All fixes are minimal and targeted.
