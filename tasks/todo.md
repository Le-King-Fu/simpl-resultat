# Task: Fix import_config_templates "no such table" + category is_inputable default

## Root Cause Analysis

**Both bugs share the same root cause:** `schema.sql` was modified in v0.2.5 to include
`is_inputable` column and `import_config_templates` table. Since `schema.sql` is compiled
into migration 1 via `include_str!("schema.sql")`, this changed migration 1's SQL content.

The `tauri-plugin-sql` uses `sqlx::migrate::Migrator` which stores **SHA-256 checksums**
of each migration's SQL. When the checksum for migration 1 changed, sqlx refused to apply
any new migrations (4 and 5), causing both bugs:

- **Bug 1**: Migration 5 never ran → `import_config_templates` table doesn't exist
- **Bug 2**: Migration 4 never ran → `is_inputable` column doesn't exist → `SELECT *` returns
  `undefined` for that field → checkbox appears unchecked (falsy)

## Plan
- [x] Revert schema.sql to v0.2.4 state (remove is_inputable from categories, remove import_config_templates table)
- [x] Add comments in schema.sql noting later migrations add these
- [x] Verify Rust compiles cleanly
- [x] Confirmed: sqlx Migrator uses SHA-256 checksums → changing schema.sql broke migration chain

## Review
Single file changed: `src-tauri/src/database/schema.sql`. Reverted to match original migration 1
content. After rebuild, the checksum will match and migrations 4+5 will apply automatically.
User just needs to rebuild and restart — no database deletion needed.
