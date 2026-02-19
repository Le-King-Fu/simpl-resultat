# Architecture technique — Simpl'Résultat

> Document généré le 2026-02-19 — Version 0.3.7

## Stack technique

| Couche | Technologie | Version |
|--------|------------|---------|
| Framework desktop | Tauri | v2 |
| Frontend | React | 19.1 |
| Langage frontend | TypeScript | 5.8 |
| Bundler | Vite | 6.4 |
| CSS | Tailwind CSS | v4 |
| Backend | Rust (via Tauri) | stable |
| Base de données | SQLite (tauri-plugin-sql) | — |
| Graphiques | Recharts | 3.7 |
| Icônes | Lucide React | 0.563 |
| i18n | i18next + react-i18next | 25.8 / 16.5 |
| Drag & Drop | @dnd-kit | 6.3 / 10.0 |
| CSV | PapaParse | 5.5 |
| Chiffrement | aes-gcm (Rust) | 0.10 |
| Hachage PIN | Argon2 (Rust) | 0.5 |

## Structure du projet

```
simpl-resultat/
├── src/                          # Frontend React/TypeScript
│   ├── components/               # 49 composants organisés par domaine
│   │   ├── adjustments/          # 3 composants
│   │   ├── budget/               # 5 composants
│   │   ├── categories/           # 5 composants
│   │   ├── dashboard/            # 3 composants
│   │   ├── import/               # 13 composants (wizard d'import)
│   │   ├── layout/               # AppShell, Sidebar
│   │   ├── profile/              # 3 composants (PIN, formulaire, switcher)
│   │   ├── reports/              # 4 composants (graphiques)
│   │   ├── settings/             # 2 composants
│   │   ├── shared/               # 4 composants réutilisables
│   │   └── transactions/         # 5 composants
│   ├── contexts/                 # ProfileContext (état global profil)
│   ├── hooks/                    # 12 hooks custom (useReducer)
│   ├── pages/                    # 10 pages
│   ├── services/                 # 14 services métier
│   ├── shared/                   # Types et constantes partagés
│   ├── utils/                    # 4 utilitaires (parsing, CSV, charts)
│   ├── i18n/                     # Config i18next + locales FR/EN
│   ├── App.tsx                   # Router principal
│   └── main.tsx                  # Point d'entrée
├── src-tauri/                    # Backend Rust
│   ├── src/
│   │   ├── commands/             # 3 modules de commandes Tauri
│   │   │   ├── fs_commands.rs
│   │   │   ├── export_import_commands.rs
│   │   │   └── profile_commands.rs
│   │   ├── database/             # Schémas SQL et migrations
│   │   │   ├── schema.sql
│   │   │   ├── seed_categories.sql
│   │   │   └── consolidated_schema.sql
│   │   ├── lib.rs                # Point d'entrée, migrations, plugins
│   │   └── main.rs
│   ├── capabilities/             # Permissions Tauri
│   └── Cargo.toml
├── .github/workflows/            # CI/CD
│   └── release.yml
├── docs/                         # Documentation technique
└── config/                       # Configuration
```

## Base de données

### Tables (13)

| Table | Description |
|-------|-------------|
| `import_sources` | Configuration des sources d'import CSV |
| `imported_files` | Suivi des fichiers importés (hash anti-doublons) |
| `categories` | Catégories hiérarchiques (dépenses/revenus) |
| `suppliers` | Fournisseurs avec auto-catégorisation |
| `keywords` | Mots-clés pour catégorisation automatique |
| `transactions` | Transactions individuelles |
| `adjustments` | Ajustements manuels (ponctuels ou récurrents) |
| `adjustment_entries` | Montants par catégorie pour chaque ajustement |
| `budget_entries` | Allocations budgétaires mensuelles par catégorie |
| `budget_templates` | Modèles de budget réutilisables |
| `budget_template_entries` | Catégories et montants dans les modèles |
| `import_config_templates` | Modèles prédéfinis de config d'import |
| `user_preferences` | Préférences applicatives (clé-valeur) |

### Index (9)

Index sur : `transactions` (date, category, supplier, source, file, parent), `categories` (parent, type), `suppliers` (category, normalized_name), `keywords` (category, keyword), `budget_entries` (year, month), `adjustment_entries` (adjustment_id), `imported_files` (source).

## Système de migrations

Les migrations sont définies inline dans `src-tauri/src/lib.rs` via `tauri_plugin_sql::Migration` :

| # | Version | Description |
|---|---------|-------------|
| 1 | v1 | Schéma initial (13 tables) |
| 2 | v2 | Seed des catégories et mots-clés |
| 3 | v3 | Ajout `has_header` sur `import_sources` |
| 4 | v4 | Ajout `is_inputable` sur `categories` |
| 5 | v5 | Création de `import_config_templates` |
| 6 | v6 | Changement contrainte unique `imported_files` (hash → filename) |

Pour les **nouveaux profils**, le fichier `consolidated_schema.sql` contient le schéma complet avec toutes les migrations pré-appliquées (pas besoin de rejouer les migrations).

## Services TypeScript (14)

| Service | Responsabilité |
|---------|---------------|
| `db.ts` | Wrapper de connexion (tauri-plugin-sql) |
| `profileService.ts` | Gestion des profils |
| `categoryService.ts` | CRUD catégories hiérarchiques |
| `transactionService.ts` | CRUD et filtrage des transactions |
| `importSourceService.ts` | Configuration des sources d'import |
| `importedFileService.ts` | Suivi des fichiers importés |
| `importConfigTemplateService.ts` | Modèles de configuration d'import |
| `categorizationService.ts` | Catégorisation automatique |
| `adjustmentService.ts` | Gestion des ajustements |
| `budgetService.ts` | Gestion budgétaire |
| `dashboardService.ts` | Agrégation données tableau de bord |
| `reportService.ts` | Génération de rapports et analytique |
| `dataExportService.ts` | Export de données (chiffré) |
| `userPreferenceService.ts` | Stockage préférences utilisateur |

## Hooks (12)

Chaque hook encapsule la logique d'état via `useReducer` :

| Hook | Domaine |
|------|---------|
| `useCategories` | Catégories avec hiérarchie |
| `useTransactions` | Transactions et filtrage |
| `useDataImport` | Import de données |
| `useImportWizard` | Assistant d'import multi-étapes |
| `useImportHistory` | Historique des imports |
| `useAdjustments` | Ajustements |
| `useBudget` | Budget |
| `useDashboard` | Métriques du tableau de bord |
| `useReports` | Données analytiques |
| `useDataExport` | Export de données |
| `useTheme` | Thème clair/sombre |
| `useUpdater` | Mise à jour de l'application |

## Commandes Tauri (17)

### `fs_commands.rs` — Système de fichiers (6)

- `scan_import_folder` — Scan récursif de dossier pour fichiers CSV/TXT
- `read_file_content` — Lecture avec gestion de l'encodage
- `hash_file` — Hash SHA-256 (détection de doublons)
- `detect_encoding` — Détection auto (UTF-8, Windows-1252, ISO-8859-15)
- `get_file_preview` — Aperçu des N premières lignes
- `pick_folder` — Dialogue de sélection de dossier

### `export_import_commands.rs` — Export/Import de données (5)

- `pick_save_file` — Dialogue de sauvegarde
- `pick_import_file` — Dialogue de sélection de fichier
- `write_export_file` — Écriture fichier chiffré (format SREF)
- `read_import_file` — Lecture fichier chiffré
- `is_file_encrypted` — Vérification magic SREF

### `profile_commands.rs` — Gestion des profils (6)

- `load_profiles` — Chargement depuis `profiles.json`
- `save_profiles` — Sauvegarde de la configuration
- `delete_profile_db` — Suppression du fichier de base de données
- `get_new_profile_init_sql` — Récupération du schéma consolidé
- `hash_pin` — Hachage Argon2 du PIN
- `verify_pin` — Vérification du PIN

## Pages et routing

Le routing est défini dans `App.tsx`. Toutes les pages sont englobées par `AppShell` (sidebar + layout). L'accès est contrôlé par `ProfileContext` (gate).

| Route | Page | Description |
|-------|------|-------------|
| `/` | `DashboardPage` | Tableau de bord avec graphiques |
| `/import` | `ImportPage` | Assistant d'import CSV |
| `/transactions` | `TransactionsPage` | Liste avec filtres |
| `/categories` | `CategoriesPage` | Gestion hiérarchique |
| `/adjustments` | `AdjustmentsPage` | Ajustements manuels |
| `/budget` | `BudgetPage` | Planification budgétaire |
| `/reports` | `ReportsPage` | Analytique et rapports |
| `/settings` | `SettingsPage` | Paramètres |
| `/docs` | `DocsPage` | Documentation in-app |

Page spéciale : `ProfileSelectionPage` (affichée quand aucun profil n'est actif).

## Internationalisation

- **Librairie** : i18next + react-i18next
- **Langue par défaut** : Français (`fr`)
- **Langue de fallback** : Anglais (`en`)
- **Fichiers** : `src/i18n/locales/fr.json`, `src/i18n/locales/en.json`
- **Clés organisées** hiérarchiquement par domaine (`nav.*`, `dashboard.*`, `import.*`, etc.)

## CI/CD

Workflow GitHub Actions (`release.yml`) déclenché par les tags `v*` :

1. **build-windows** (windows-latest) → Installeur `.exe` (NSIS)
2. **build-linux** (ubuntu-22.04) → `.deb` + `.AppImage`

Fonctionnalités :
- Signature des binaires (clés TAURI_SIGNING_PRIVATE_KEY)
- JSON d'updater pour mises à jour automatiques
- Release GitHub automatique avec notes d'installation
