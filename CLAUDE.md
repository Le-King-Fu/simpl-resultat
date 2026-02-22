# CLAUDE.md — Simpl'Résultat

## Contexte du projet

**Simpl'Résultat** est une application de bureau desktop **privacy-first** pour la gestion des finances personnelles. Elle traite localement les fichiers CSV bancaires sans aucune dépendance cloud. Projet solo entrepreneurial, en développement par Max.

**Stack technique :** Tauri v2 + React 19 + TypeScript + Tailwind CSS v4
**Backend :** Rust (commandes Tauri)
**Stockage :** SQLite local (tauri-plugin-sql)
**Langues supportées :** Français (FR) et Anglais (EN)
**Plateformes :** Windows, Linux
**Version actuelle :** 0.3.11

---

## Principes fondamentaux

### Privacy-first — NON NÉGOCIABLE
- Zéro donnée envoyée vers un serveur tiers
- Tout le traitement CSV et toutes les données financières restent en local
- Aucune télémétrie, aucun analytics cloud

### Précision financière
- Toujours valider les montants selon les règles de parsing configurables (gestion des virgules/points, espaces, symboles monétaires)
- Gérer l'encodage des fichiers CSV (UTF-8, Windows-1252, ISO-8859-15)

### Internationalisation (i18n)
- Toute chaîne affichée à l'utilisateur doit passer par le système i18n (i18next + react-i18next)
- Jamais de texte en dur dans les composants React
- Fichiers de traduction : `src/i18n/locales/fr.json` et `src/i18n/locales/en.json`

---

## Architecture & structure du code

```
src/
├── components/          # 49 composants React organisés par domaine
│   ├── adjustments/     # Ajustements
│   ├── budget/          # Budget
│   ├── categories/      # Catégories hiérarchiques
│   ├── dashboard/       # Tableau de bord
│   ├── import/          # Wizard d'import (13 composants)
│   ├── layout/          # AppShell, Sidebar
│   ├── profile/         # Profils (PIN, formulaire, switcher)
│   ├── reports/         # Graphiques et rapports
│   ├── settings/        # Paramètres
│   ├── shared/          # Composants réutilisables
│   └── transactions/    # Transactions
├── contexts/            # ProfileContext (état global profil)
├── hooks/               # 12 hooks custom (useReducer)
├── pages/               # 10 pages
├── services/            # 14 services métier
├── shared/              # Types et constantes partagés
├── utils/               # Utilitaires (parsing, CSV, charts)
├── i18n/                # Config i18next + locales FR/EN
├── App.tsx              # Router principal (react-router-dom)
└── main.tsx             # Point d'entrée

src-tauri/
├── src/
│   ├── commands/        # 3 modules, 17 commandes Tauri
│   │   ├── fs_commands.rs           # Système de fichiers (6 commandes)
│   │   ├── export_import_commands.rs # Export/import chiffré (5 commandes)
│   │   └── profile_commands.rs      # Gestion des profils (6 commandes)
│   ├── database/        # Schémas SQL et migrations
│   │   ├── schema.sql               # Schéma initial (v1)
│   │   ├── seed_categories.sql      # Seed catégories (v2)
│   │   └── consolidated_schema.sql  # Schéma complet (nouveaux profils)
│   ├── lib.rs           # Point d'entrée, 6 migrations inline, plugins
│   └── main.rs
└── Cargo.toml
```

**Règles d'architecture :**
- La logique métier va dans `services/`, jamais directement dans les composants
- L'état de chaque domaine est géré par un hook `useReducer` dédié dans `hooks/`
- Les composants React sont responsables de l'affichage uniquement
- Toute opération sur les fichiers système passe par les commandes Tauri (Rust)
- Les requêtes SQL passent par les services TypeScript via `tauri-plugin-sql`

---

## Fonctionnalités principales

- **Import CSV** : wizard multi-étapes, détection auto de l'encodage/délimiteur, templates de config, déduplication par fichier
- **Catégorisation** : automatique (mots-clés avec priorité) et manuelle, drag-and-drop pour réorganiser
- **Transactions** : filtrage, tri, split sur plusieurs catégories, notes
- **Budget** : grille 12 mois, templates réutilisables, budget vs réel
- **Rapports** : tendances mensuelles, répartition par catégorie, évolution dans le temps, graphiques interactifs (SVG patterns, menu contextuel)
- **Multi-profils** : bases de données séparées, protection par PIN (Argon2), switching rapide
- **Export/Import** : JSON/CSV avec chiffrement AES-256-GCM optionnel (format SREF)
- **Mises à jour** : auto-updater intégré (tauri-plugin-updater)

---

## Conventions de code

### React / TypeScript
- Un composant = un fichier `.tsx`, nommé en PascalCase
- Hooks custom dans `hooks/`, services dans `services/`
- État local via `useReducer` dans les hooks de domaine

### Rust / Tauri
- Toutes les commandes Tauri retournent `Result<T, String>` pour la gestion d'erreurs
- Documenter chaque commande avec un commentaire sur son rôle

### Général
- Commits en anglais, commentaires de code en anglais
- Messages d'interface en français ET anglais (via i18n)
- Tester les cas limites de parsing CSV (montants négatifs, cellules vides, formats inattendus)

---

## Base de données

- **13 tables** SQLite, **9 index** (voir `docs/architecture.md` pour le détail)
- **6 migrations inline** dans `lib.rs` (via `tauri_plugin_sql::Migration`)
- **Schéma consolidé** (`consolidated_schema.sql`) pour l'initialisation des nouveaux profils
- Les migrations appliquées sont protégées par checksum — ne jamais modifier une migration existante, toujours en créer une nouvelle

---

## Documentation technique

La documentation technique est centralisée dans `docs/` :
- `docs/architecture.md` — Architecture technique complète (stack, BDD, services, hooks, commandes Tauri, routing, i18n, CI/CD)
- `docs/adr/` — Architecture Decision Records (décisions techniques structurantes)
- `docs/guide-utilisateur.md` — Guide utilisateur
- `docs/archive/` — Anciennes spécifications archivées

**Règle : quand un changement touche l'architecture, mettre à jour la documentation :**
- Nouveau service, hook, commande Tauri, page/route, ou table SQL → mettre à jour `docs/architecture.md`
- Décision technique structurante (choix de librairie, pattern architectural, changement de stratégie) → créer un nouvel ADR dans `docs/adr/`
- Changement affectant l'utilisation de l'app → mettre à jour `docs/guide-utilisateur.md` et les traductions i18n correspondantes (`src/i18n/locales/fr.json`, `src/i18n/locales/en.json`, clés sous `docs.*`)

**Règle CHANGELOG :** tout changement affectant le comportement utilisateur → ajouter une entrée sous `## [Unreleased]` dans `CHANGELOG.md`
- Catégories : Added, Changed, Fixed, Removed
- Format [Keep a Changelog](https://keepachangelog.com/). Le contenu est extrait automatiquement par le CI pour les release notes GitHub et affiché dans l'app.

---

## Points d'attention RS&DE / CRIC

Pour maintenir l'éligibilité aux crédits d'impôt R&D (RS&DE fédéral + CRIC Québec) :
- Documenter les **incertitudes technologiques** rencontrées pendant le développement
- Noter les expérimentations et les approches alternatives testées
- Garder un journal des avancées techniques (dans `/docs/rnd-journal/`)
- Les algorithmes de catégorisation automatique et le parsing multi-format sont des activités R&D éligibles

---

## CI/CD

- GitHub Actions (`release.yml`) déclenché par tags `v*`
- Build Windows (NSIS `.exe`) + Linux (`.deb`, `.AppImage`)
- Signature des binaires + JSON d'updater pour mises à jour automatiques

---

## Ressources clés

- [Tauri v2 Docs](https://v2.tauri.app/)
- [React Docs](https://react.dev/)
- [SQLite via Tauri](https://github.com/tauri-apps/tauri-plugin-sql)
- Architecture détaillée : `docs/architecture.md`
- Décisions techniques : `docs/adr/`
