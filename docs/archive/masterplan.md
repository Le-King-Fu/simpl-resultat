# Simpl'Résultat — Masterplan

## Overview
Local desktop personal finance app. Tauri v2 (Rust) + React + TypeScript + Tailwind CSS + SQLite. Bilingual (FR/EN). Windows-only release via GitHub Actions.

---

## Current State (as of v0.1.0)

### Pages (8)
| Page | Status | Description |
|------|--------|-------------|
| Dashboard | Done | Balance/income/expenses cards, category pie chart, recent transactions, period selector |
| Import | Done | Multi-step wizard: folder scan → source config → column mapping → preview → duplicate check → import → report. Import history with delete |
| Transactions | Done | Filterable table (search, category, source, date range), pagination, inline category edit via searchable combobox, auto-categorize, notes |
| Categories | Done | Tree view with create/edit/delete, keyword management (priority-based), supplier mapping, color picker |
| Adjustments | Done | One-time & recurring adjustments by category |
| Budget | Done | Monthly per-category budgets with templates |
| Reports | Done | Monthly trends chart, category bar chart, category-over-time chart |
| Settings | Done | About card (version), in-app updater (check → download → install & restart), data safety notice |

### Backend (Rust Commands)
- `scan_import_folder` — recursive folder scan for CSV/TXT
- `read_file_content` — encoding-aware file read (UTF-8, Windows-1252, ISO-8859-15)
- `hash_file` — SHA256 for duplicate detection
- `detect_encoding` — smart encoding detection
- `get_file_preview` — first N lines preview
- `pick_folder` — native folder picker dialog

### Database (11 tables)
**Core:** transactions, categories, suppliers, keywords
**Import:** import_sources, imported_files
**Planning:** budget_entries, budget_templates, adjustments, adjustment_entries
**User:** user_preferences (key-value: language, theme, currency, date_format)

### Services (9)
db, transactionService, categoryService, importSourceService, importedFileService, dashboardService, reportService, categorizationService, userPreferenceService

### Hooks (7)
useDashboard, useTransactions, useCategories, useReports, useImportWizard, useImportHistory, useUpdater

### CI/CD
- GitHub Actions release workflow on `v*` tag push
- Windows-only (Ubuntu/macOS commented out)
- NSIS + MSI installers
- Tauri updater with signed artifacts (`latest.json` in release assets)
- Signing keys required: `TAURI_SIGNING_PRIVATE_KEY` + `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` secrets

### Infrastructure Done
- Tailwind CSS v4 with CSS custom properties (light mode palette: blue primary, cream background, terracotta accent)
- react-i18next with FR default + EN
- lucide-react icons
- useReducer state management pattern (no Redux)
- Parameterized SQL queries ($1, $2...)
- Seeded categories & keywords in migration

---

## Pending / Not Yet Started

### Updater Setup (One-time manual)
- [ ] Generate signing keys: `npx tauri signer generate -w ~/.tauri/simpl-resultat.key`
- [ ] Add GitHub Secrets: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- [ ] Replace `REPLACE_WITH_PUBLIC_KEY` in `tauri.conf.json` with contents of `.key.pub`
- [ ] Tag + push a release to verify `latest.json` appears in assets

### Features Not Implemented
- **Dark mode** — CSS variables defined but no toggle yet
- **Data export** — Reports page has an "Export" button label but no implementation
- **Transaction splitting** — Schema supports it (`parent_transaction_id`) but no UI
- **Supplier management UI** — Suppliers table exists, auto-linked during import, but no dedicated management page
- **User preferences UI** — Settings page exists but doesn't yet expose language/theme/currency/date format preferences (language toggle is in sidebar)
- **Multi-platform builds** — Ubuntu and macOS targets commented out in release workflow
- **Backup / restore** — No database backup feature yet

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Desktop shell | Tauri v2 (Rust) |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Icons | lucide-react |
| Charts | Recharts |
| CSV parsing | PapaParse |
| i18n | react-i18next (FR + EN) |
| Database | SQLite via @tauri-apps/plugin-sql |
| State | useReducer hooks |
| Build/CI | Vite + GitHub Actions + tauri-action |

## Key File Paths
| Path | Purpose |
|------|---------|
| `src/shared/types/index.ts` | All TypeScript interfaces |
| `src/shared/constants/index.ts` | Nav items, app name, DB name |
| `src/services/*.ts` | Data access layer (getDb + typed queries) |
| `src/hooks/*.ts` | State management (useReducer pattern) |
| `src/pages/*.tsx` | Page components |
| `src/components/` | UI components by feature area |
| `src-tauri/src/lib.rs` | Tauri plugin registration |
| `src-tauri/src/commands/` | Rust IPC commands |
| `src-tauri/src/database/` | Schema + seed migrations |
| `src-tauri/tauri.conf.json` | Tauri config (updater, bundle, window) |
| `.github/workflows/release.yml` | Release CI/CD |
