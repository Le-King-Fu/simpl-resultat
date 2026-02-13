# Task: Import preview as popup + direct skip to duplicate check

## Plan
- [x] Create `FilePreviewModal.tsx` — portal modal wrapping `FilePreviewTable`
- [x] Update `useImportWizard.ts` — extract `parseFilesInternal` helper, make `parsePreview` not change step, add `parseAndCheckDuplicates` combined function
- [x] Update `ImportPage.tsx` — source-config step has Preview button (opens modal) + Check Duplicates button (main action); remove file-preview step; duplicate-check back goes to source-config
- [x] Verify TypeScript compiles

## Progress Notes
- Extracted parsing logic into `parseFilesInternal` helper to avoid state closure issues when combining parse + duplicate check
- `checkDuplicatesInternal` takes parsed rows as parameter so `parseAndCheckDuplicates` can pass them directly
- No new i18n keys needed — reused existing ones

## Review
4 files changed/created. Preview is now a popup modal, file-preview wizard step is removed, "Check Duplicates" goes directly from source-config to duplicate-check (parsing files on the fly). Back navigation from duplicate-check returns to source-config.
