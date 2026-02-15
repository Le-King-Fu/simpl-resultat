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

## 2026-02-12 - Config fields must be persisted to DB, not hardcoded on restore
**Mistake**: `hasHeader` was part of the SourceConfig in-memory object but was never stored in the `import_sources` DB table. When restoring config from DB, it was hardcoded to `true`, causing the first data row of headerless CSVs (Desjardins) to be treated as column headers.
**Pattern**: When adding a config field to an in-memory interface, you must also add the column to the DB schema and update all CRUD paths (create, update, restore). Hardcoding a default on restore silently loses user preferences.
**Rule**: For every field in a config interface: (1) verify it has a corresponding DB column, (2) verify it's included in INSERT/UPDATE queries, (3) verify it's restored from the DB row — never hardcoded. Use a grep for the field name across service, hook, and schema files.
**Applied**: Import source config, any settings/preferences that need to survive across sessions

## 2026-02-14 - Never modify schema.sql after initial release (migration checksum)
**Mistake**: Added `is_inputable` column and `import_config_templates` table directly to `schema.sql` (migration 1), in addition to creating proper migrations 4+5 for them. This changed migration 1's SQL content.
**Pattern**: `tauri-plugin-sql` uses `sqlx::migrate::Migrator` which stores SHA-256 checksums of each migration's SQL. Since `schema.sql` is `include_str!`'d into migration 1, any change to schema.sql changes the checksum. Sqlx then refuses to apply any new migrations because it detects the integrity violation.
**Rule**: NEVER modify schema.sql (or any file used by migration 1) after it has been applied to user databases — not even comments. sqlx uses SHA-384 checksums, so even adding `-- NOTE:` comments changes the hash. New columns and tables must ONLY be added via new migrations. Schema.sql is frozen once deployed.
**Applied**: Any Tauri app using tauri-plugin-sql with sqlx migrations, any system using file-based migration checksums

## 2026-02-14 - Comments in SQL migration files change checksums
**Mistake**: After reverting schema.sql content, added `-- NOTE:` comment lines for documentation. These changed the SHA-384 checksum, so the fix didn't actually work.
**Pattern**: sqlx checksums the ENTIRE SQL string byte-for-byte, including comments and whitespace. Any modification — even a single comment or blank line — produces a different hash.
**Rule**: When restoring a migration file to match its original, use `git show <commit>:<path> > <file>` to get an exact byte-for-byte copy. Never manually edit and "eyeball" the match. Verify with `diff` before committing.
**Applied**: Any fix involving migration file restoration, any checksum-sensitive file

## 2026-02-15 - gh issue view fails with Projects (classic) deprecation error
**Mistake**: Used `gh issue view 1` without `--json` flag, which triggers the default GraphQL query that includes `projectCards` — a deprecated field. GitHub returns an error: `GraphQL: Projects (classic) is being deprecated`.
**Pattern**: The `gh` CLI's default issue view fetches all fields including legacy Projects (classic) data. If the repo or org ever had classic projects, this query fails.
**Rule**: Always use `gh issue view <number> --json <fields>` (e.g. `--json title,body,state,number`) instead of the bare `gh issue view`. This avoids the deprecated `projectCards` field and is also faster since it only fetches what you need.
**Applied**: Any `gh issue view`, `gh pr view`, or similar GitHub CLI commands that may touch deprecated GraphQL fields
