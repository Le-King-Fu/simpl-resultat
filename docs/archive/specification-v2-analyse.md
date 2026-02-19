# Simpl-Résultat - Spécification Détaillée v2

## Table des matières
1. [Résumé exécutif](#résumé-exécutif)
2. [Description générale enrichie](#description-générale-enrichie)
3. [Architecture proposée](#architecture-proposée)
4. [Spécifications fonctionnelles détaillées](#spécifications-fonctionnelles-détaillées)
5. [Modèle de données](#modèle-de-données)
6. [Interface utilisateur](#interface-utilisateur)
7. [Points faibles identifiés et recommandations](#points-faibles-identifiés-et-recommandations)
8. [Considérations techniques](#considérations-techniques)
9. [Plan de développement suggéré](#plan-de-développement-suggéré)

---

## Résumé exécutif

**Simpl-Résultat** est une application de bureau locale permettant aux utilisateurs de suivre leurs dépenses personnelles à partir d'exports CSV bancaires. L'application vise à catégoriser automatiquement les transactions, permettre des ajustements manuels, et fournir des rapports visuels pour le suivi budgétaire.

### Objectifs principaux
- Centraliser les données financières de multiples sources (comptes chèques, épargne, cartes de crédit)
- Automatiser la catégorisation des dépenses via mots-clés
- Permettre un suivi budgétaire mensuel avec comparaisons historiques
- Offrir une expérience utilisateur simple et locale (pas de cloud)

---

## Description générale enrichie

### Vision du produit
Une application de finances personnelles **100% locale** (privacy-first) qui transforme des exports CSV bancaires bruts en insights financiers actionnables, sans nécessiter de connexion à des services tiers ou de partage de données sensibles.

### Proposition de valeur
| Aspect | Description |
|--------|-------------|
| **Confidentialité** | Données stockées localement uniquement |
| **Simplicité** | Import CSV sans configuration bancaire complexe |
| **Flexibilité** | Support multi-sources, multi-formats |
| **Automatisation** | Catégorisation intelligente par mots-clés |
| **Contrôle** | Écritures d'ajustement et personnalisation complète |

### Utilisateurs cibles
- Particuliers souhaitant suivre leur budget sans services cloud
- Utilisateurs soucieux de la confidentialité de leurs données financières
- Personnes ayant plusieurs comptes bancaires à consolider

---

## Architecture proposée

### Stack technologique recommandé

```
┌─────────────────────────────────────────────────────────────┐
│                        PRÉSENTATION                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Electron / Tauri (Frontend)             │    │
│  │         React/Vue/Svelte + TailwindCSS              │    │
│  │              Charts: Recharts / Chart.js             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         LOGIQUE                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Service Layer (TypeScript)              │    │
│  │  • ImportService    • CategoryService               │    │
│  │  • TransactionService • BudgetService               │    │
│  │  • ReportingService  • AdjustmentService            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        DONNÉES                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SQLite (Base locale)                    │    │
│  │         + better-sqlite3 / sql.js                   │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Fichiers de configuration                  │    │
│  │              JSON (préférences)                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Justification des choix

| Composant | Option recommandée | Raison |
|-----------|-------------------|--------|
| **Framework desktop** | **Tauri** (P1) ou Electron | Tauri = plus léger, Rust backend, meilleure sécurité. Electron = écosystème plus mature |
| **Frontend** | Svelte ou React | Svelte = bundle léger, React = plus de ressources/libs |
| **Base de données** | SQLite | Locale, performante, pas de serveur, portable |
| **Charts** | Recharts ou Chart.js | Intégration React facile, bonne personnalisation |
| **Parsing CSV** | PapaParse | Robuste, gère les edge cases (quotes, encoding) |

### Architecture des fichiers

```
simpl-resultat/
├── src/
│   ├── main/                    # Process principal (Electron/Tauri)
│   │   ├── database/
│   │   │   ├── schema.sql
│   │   │   ├── migrations/
│   │   │   └── repository/
│   │   ├── services/
│   │   │   ├── import.service.ts
│   │   │   ├── category.service.ts
│   │   │   ├── transaction.service.ts
│   │   │   ├── budget.service.ts
│   │   │   ├── adjustment.service.ts
│   │   │   └── report.service.ts
│   │   └── ipc/                 # Communication main/renderer
│   │
│   ├── renderer/                # Interface utilisateur
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── utils/
│   │
│   └── shared/                  # Types partagés
│       ├── types/
│       └── constants/
│
├── data/                        # Données utilisateur (gitignored)
│   ├── database.sqlite
│   └── backups/
│
├── imports/                     # Dossiers d'import configurés
│   ├── carte_credit/
│   ├── compte_cheque/
│   └── epargne/
│
└── config/
    ├── categories_default.json
    └── import_profiles.json
```

---

## Spécifications fonctionnelles détaillées

### 1. Module d'importation

#### 1.1 Configuration des sources

```typescript
interface ImportSource {
  id: string;
  name: string;                    // Ex: "Carte de crédit Visa"
  directoryPath: string;           // Chemin du répertoire surveillé
  filePattern: string;             // Ex: "export_cc*.csv"
  encoding: 'utf-8' | 'iso-8859-1' | 'windows-1252';
  delimiter: ',' | ';' | '\t';
  hasHeader: boolean;
  dateFormat: string;              // Ex: "YYYY-MM-DD", "DD/MM/YYYY"
  columnMapping: ColumnMapping;
  amountRule: AmountRule;
  skipLines?: number;              // Lignes à ignorer en début de fichier
  lastImportDate?: Date;
}

interface ColumnMapping {
  date: number | string;           // Index ou nom de colonne
  description: number | string;
  transactionCode?: number | string;
  debitAmount?: number | string;
  creditAmount?: number | string;
  amount?: number | string;        // Si montant unique
}

interface AmountRule {
  type: 'separate' | 'combined';
  // Si combined:
  signConvention?: 'negative_is_debit' | 'negative_is_credit';
}
```

#### 1.2 Processus d'importation

```
[Sélection source] → [Détection fichiers] → [Preview données]
        ↓                                          ↓
[Validation mapping] ← [Ajustement mapping si nécessaire]
        ↓
[Détection doublons] → [Confirmation import]
        ↓
[Import en base] → [Catégorisation auto] → [Rapport d'import]
```

#### 1.3 Gestion des doublons

**Critères de détection de doublon:**
- Date + Description + Montant identiques
- Ou: Hash SHA256 de la ligne complète déjà présent

**Options utilisateur:**
- Ignorer les doublons (défaut)
- Forcer l'import
- Demander confirmation pour chaque

### 2. Module de catégorisation

#### 2.1 Structure hiérarchique

```typescript
interface Category {
  id: string;
  name: string;
  type: 'recurring' | 'occasional' | 'special' | 'transfer' | 'income';
  parentId?: string;              // Pour sous-catégories
  color?: string;                 // Pour les graphiques
  icon?: string;
  isSystem: boolean;              // Non supprimable si true
}

interface Supplier {
  id: string;
  name: string;
  categoryId: string;
  keywords: string[];             // Mots-clés pour matching
  priority: number;               // En cas de conflit de matching
}
```

#### 2.2 Algorithme de matching

```
Pour chaque transaction non catégorisée:
  1. Normaliser la description (minuscules, sans accents, trim)
  2. Pour chaque fournisseur (trié par priorité DESC):
     a. Pour chaque mot-clé du fournisseur:
        - Si description.contains(keyword) → MATCH
     b. Si MATCH → Assigner catégorie du fournisseur, STOP
  3. Si aucun match → Catégorie "Autres dépenses"
```

**Améliorations suggérées:**
- Support des expressions régulières
- Matching par montant (ex: "Netflix" toujours ~15.99$)
- Apprentissage des assignations manuelles

#### 2.3 Interface de gestion des non-matchés

| Élément | Description |
|---------|-------------|
| Liste des transactions | Triées par date, regroupables par description similaire |
| Recherche rapide | Filtrer par texte dans description |
| Action rapide | Créer mot-clé à partir de la sélection |
| Action groupée | Catégoriser plusieurs transactions similaires en un clic |

### 3. Module d'ajustements

#### 3.1 Types d'écritures

```typescript
interface Adjustment {
  id: string;
  originalTransactionId: string;
  adjustmentDate: Date;           // Fin du mois concerné
  effectiveMonth: string;         // Format "YYYY-MM"
  entries: AdjustmentEntry[];
  reason?: string;
  createdAt: Date;
}

interface AdjustmentEntry {
  categoryId: string;
  amount: number;                 // Positif = augmente cette catégorie
}
```

#### 3.2 Exemple d'usage

Transaction Amazon de 150$:
- Original: 100% → "Achats divers"
- Ajustement:
  - -150$ "Achats divers"
  - +80$ "Sport"
  - +70$ "Musique"

### 4. Module Budget

#### 4.1 Structure

```typescript
interface BudgetEntry {
  id: string;
  categoryId: string;
  month: string;                  // "YYYY-MM"
  plannedAmount: number;
  notes?: string;
}

interface BudgetTemplate {
  id: string;
  name: string;
  entries: Omit<BudgetEntry, 'id' | 'month'>[];
}
```

#### 4.2 Fonctionnalités

- **Templates**: Créer des budgets types réutilisables
- **Copie**: Dupliquer le budget d'un mois vers un autre
- **Alertes**: Notification visuelle si dépassement (>80%, >100%)
- **Carry-over**: Option pour reporter le surplus/déficit

### 5. Module Reporting

#### 5.1 Rapports disponibles

| Rapport | Description | Visualisation |
|---------|-------------|---------------|
| Suivi mensuel 12 mois | Évolution des dépenses par catégorie | Graphique barres empilées |
| Mois courant vs précédent | Comparaison détaillée | Tableau + barres horizontales |
| Cumulatif YTD | Année courante vs précédente | Graphique ligne + aires |
| Répartition | Distribution par catégorie | Pie chart / Treemap |
| Tendances | Évolution sur période personnalisée | Graphique ligne |
| Budget vs Réel | Écarts budgétaires | Barres avec indicateurs |

#### 5.2 Filtres et dimensions

- Par source (compte)
- Par catégorie / sous-catégorie
- Par type de dépense
- Par période personnalisée
- Inclusion/exclusion des transferts

---

## Modèle de données

### Schéma SQL

```sql
-- Sources d'import
CREATE TABLE import_sources (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    directory_path TEXT NOT NULL,
    file_pattern TEXT DEFAULT '*.csv',
    encoding TEXT DEFAULT 'utf-8',
    delimiter TEXT DEFAULT ',',
    has_header INTEGER DEFAULT 1,
    date_format TEXT NOT NULL,
    column_mapping TEXT NOT NULL,        -- JSON
    amount_rule TEXT NOT NULL,           -- JSON
    skip_lines INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fichiers importés (pour éviter les doublons)
CREATE TABLE imported_files (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES import_sources(id),
    filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,             -- SHA256
    row_count INTEGER NOT NULL,
    imported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, file_hash)
);

-- Catégories
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('recurring','occasional','special','transfer','income')),
    parent_id TEXT REFERENCES categories(id),
    color TEXT,
    icon TEXT,
    is_system INTEGER DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fournisseurs
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id),
    priority INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mots-clés
CREATE TABLE keywords (
    id TEXT PRIMARY KEY,
    supplier_id TEXT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    is_regex INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supplier_id, keyword)
);

-- Transactions
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL REFERENCES import_sources(id),
    imported_file_id TEXT NOT NULL REFERENCES imported_files(id),
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    transaction_code TEXT,
    debit_amount REAL DEFAULT 0,          -- Note: SQLite REAL = 8 bytes IEEE float
    credit_amount REAL DEFAULT 0,         -- Pour précision crypto, stocker en INTEGER (satoshis/cents)
    -- Alternative crypto-safe:
    -- debit_amount_raw INTEGER DEFAULT 0,   -- Montant × 10^8
    -- credit_amount_raw INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'CAD',
    supplier_id TEXT REFERENCES suppliers(id),
    category_id TEXT REFERENCES categories(id),
    is_manually_categorized INTEGER DEFAULT 0,
    raw_data TEXT,                       -- Ligne CSV originale
    row_hash TEXT NOT NULL,              -- Pour détection doublons
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(row_hash)
);

-- Index pour performance
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_month ON transactions(strftime('%Y-%m', transaction_date));

-- Écritures d'ajustement
CREATE TABLE adjustments (
    id TEXT PRIMARY KEY,
    original_transaction_id TEXT NOT NULL REFERENCES transactions(id),
    adjustment_date DATE NOT NULL,
    effective_month TEXT NOT NULL,       -- Format YYYY-MM
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE adjustment_entries (
    id TEXT PRIMARY KEY,
    adjustment_id TEXT NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id),
    amount REAL NOT NULL
);

-- Budget
CREATE TABLE budget_entries (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id),
    month TEXT NOT NULL,                 -- Format YYYY-MM
    planned_amount REAL NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, month)
);

-- Templates de budget
CREATE TABLE budget_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE budget_template_entries (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL REFERENCES budget_templates(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id),
    planned_amount REAL NOT NULL
);

-- Préférences utilisateur
CREATE TABLE user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Valeurs par défaut suggérées:
-- 'language' : 'fr' | 'en'
-- 'fiscal_year_start_month' : '1' (janvier par défaut, '4' pour avril, etc.)
-- 'fiscal_year_start_day' : '1'
-- 'default_currency' : 'CAD'
-- 'date_format' : 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY'
-- 'decimal_separator' : ',' | '.'
-- 'theme' : 'light' | 'dark' | 'system'
```

---

## Interface utilisateur

### Navigation principale

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Simpl-Résultat          [⚙️ Paramètres] [?]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Tableau de bord                                         │
│  📥 Importation                                             │
│  💳 Transactions                                            │
│  🏷️ Catégories                                              │
│  📝 Ajustements                                             │
│  💰 Budget                                                  │
│  📈 Rapports                                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Version Free/Premium]                                     │
└─────────────────────────────────────────────────────────────┘
```

### Écrans principaux

#### Tableau de bord
- Résumé du mois courant
- Graphique dépenses vs budget
- Alertes (transactions non catégorisées, dépassements)
- Raccourcis actions fréquentes

#### Importation
- Liste des sources configurées
- Bouton "Nouvelle source"
- Pour chaque source: dernière import, fichiers en attente
- Assistant d'import avec preview

#### Transactions
- Liste paginée avec recherche/filtres
- Colonnes: Date, Description, Catégorie, Débit, Crédit, Source
- Actions: Modifier catégorie, Voir détails, Créer ajustement

---

## Points faibles identifiés et recommandations

### 🔴 Points critiques

| # | Problème | Impact | Recommandation |
|---|----------|--------|----------------|
| 1 | **Pas de gestion des devises** | Impossible de consolider des comptes multi-devises | Ajouter un champ `currency` aux sources et transactions, prévoir conversion |
| 2 | **Pas de backup/export** | Perte de données si crash | Implémenter export SQLite + JSON, backup auto |
| 3 | **Pas de gestion des revenus** | Budget incomplet sans les entrées | Ajouter type "income" aux catégories, rapport balance |
| 4 | **Règle montant unique simpliste** | Banques ont des formats variés | Support regex, formules personnalisées |
| 5 | **Pas de gestion de l'encodage** | CSV corrompus si mauvais encoding | Détection auto (chardet) + sélection manuelle |

### 🟠 Points importants

| # | Problème | Impact | Recommandation |
|---|----------|--------|----------------|
| 6 | **Pas de détection de doublons explicite** | Imports multiples du même fichier | Hash des lignes, table des fichiers importés |
| 7 | **Matching mots-clés basique** | Faux positifs/négatifs fréquents | Priorités, regex, matching partiel pondéré |
| 8 | **Pas de gestion des dates de valeur** | Date opération ≠ date valeur | Ajouter champ optionnel `value_date` |
| 9 | **Forfait freemium flou** | Confusion utilisateur | Détailler précisément les limitations |
| 10 | **Pas de recherche/filtre** | Difficile de retrouver une transaction | Recherche full-text, filtres avancés |

### 🟡 Améliorations suggérées

| # | Amélioration | Bénéfice |
|---|--------------|----------|
| 11 | **Import récurrent automatisé** | Surveiller les dossiers, import auto |
| 12 | **Règles de catégorisation avancées** | Combinaison montant + description + source |
| 13 | **Mode sombre** | Confort utilisateur |
| 14 | **Raccourcis clavier** | Productivité power users |
| 15 | **Export PDF des rapports** | Partage/archivage facile |
| 16 | **Graphiques interactifs** | Drill-down par clic |
| 17 | **Objectifs d'épargne** | Fonctionnalité motivante |
| 18 | **Tags personnalisés** | Catégorisation orthogonale (ex: "Vacances 2024") |
| 19 | **Notes sur transactions** | Contexte personnel |
| 20 | **Historique des modifications** | Audit trail |

### 🔵 Décisions prises

| Question | Décision | Notes |
|----------|----------|-------|
| **Multilinguisme** | ✅ Français + Anglais | i18n dès le départ |
| **Période fiscale** | ✅ Configurable | Année calendaire par défaut, option personnalisée |
| **Précision décimale** | ✅ 8 décimales | Support crypto-friendly |
| **Pièces jointes** | ❌ V2 | Hors scope pour MVP |
| **Licence freemium** | ✅ Code d'activation + serveur | Validation en ligne |

### 🔵 Questions encore ouvertes

1. **Synchronisation multi-appareils?** Local seulement ou option sync future?
2. **Comptes joints?** Gestion multi-utilisateurs sur mêmes données?
3. **API/Plugins?** Extensibilité future?
4. **Format date système?** Respect des préférences OS ou configurable?
5. **Transactions programmées?** Dépenses récurrentes futures?

---

## Considérations techniques

### Internationalisation (i18n)

Structure recommandée pour le support FR/EN :

```
src/
└── locales/
    ├── fr.json
    ├── en.json
    └── index.ts
```

```json
// fr.json
{
  "app.name": "Simpl-Résultat",
  "nav.dashboard": "Tableau de bord",
  "nav.import": "Importation",
  "nav.transactions": "Transactions",
  "transaction.date": "Date",
  "transaction.description": "Description",
  "transaction.debit": "Débit",
  "transaction.credit": "Crédit",
  "category.other": "Autres dépenses",
  "budget.planned": "Prévu",
  "budget.actual": "Réel",
  "budget.remaining": "Restant"
}
```

```json
// en.json
{
  "app.name": "Simpl-Result",
  "nav.dashboard": "Dashboard",
  "nav.import": "Import",
  "nav.transactions": "Transactions",
  "transaction.date": "Date",
  "transaction.description": "Description",
  "transaction.debit": "Debit",
  "transaction.credit": "Credit",
  "category.other": "Other expenses",
  "budget.planned": "Planned",
  "budget.actual": "Actual",
  "budget.remaining": "Remaining"
}
```

Librairies recommandées :
- **Svelte** : svelte-i18n
- **React** : react-i18next
- **Python/Flet** : gettext ou babel

### Architecture de licence Freemium

```
┌─────────────────┐     ┌──────────────────────┐
│   Application   │────▶│   Serveur licence    │
│   (locale)      │◀────│   (ton serveur)      │
└─────────────────┘     └──────────────────────┘
        │                         │
        │ POST /api/activate      │
        │ {license_key, hw_id}    │
        │                         │
        │ Response:               │
        │ {valid, features,       │
        │  expires_at}            │
        │                         │
        ▼                         ▼
┌─────────────────┐     ┌──────────────────────┐
│ License cache   │     │   Base de données    │
│ (local, chiffré)│     │   - licenses         │
│                 │     │   - activations      │
└─────────────────┘     └──────────────────────┘
```

#### Schéma serveur (PostgreSQL/SQLite)

```sql
-- Licences générées à l'achat
CREATE TABLE licenses (
    id UUID PRIMARY KEY,
    license_key VARCHAR(32) UNIQUE NOT NULL,  -- Ex: XXXX-XXXX-XXXX-XXXX
    email VARCHAR(255),
    plan VARCHAR(20) NOT NULL,                -- 'premium', 'lifetime'
    max_activations INT DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,                      -- NULL = lifetime
    is_revoked BOOLEAN DEFAULT FALSE
);

-- Activations (machines)
CREATE TABLE activations (
    id UUID PRIMARY KEY,
    license_id UUID REFERENCES licenses(id),
    hardware_id VARCHAR(64) NOT NULL,         -- Hash unique de la machine
    app_version VARCHAR(20),
    os_info VARCHAR(100),
    activated_at TIMESTAMP DEFAULT NOW(),
    last_seen_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(license_id, hardware_id)
);
```

#### Génération du Hardware ID

```typescript
// Côté client - génère un ID unique par machine
import { machineIdSync } from 'node-machine-id';
import * as crypto from 'crypto';

function getHardwareId(): string {
  const machineId = machineIdSync();
  // Hash pour anonymisation
  return crypto
    .createHash('sha256')
    .update(machineId + 'simpl-resultat-salt')
    .digest('hex')
    .substring(0, 32);
}
```

#### API Serveur (exemple Node/Express)

```typescript
// POST /api/license/activate
app.post('/api/license/activate', async (req, res) => {
  const { licenseKey, hardwareId, appVersion, osInfo } = req.body;
  
  // 1. Vérifier la licence
  const license = await db.licenses.findByKey(licenseKey);
  if (!license || license.is_revoked) {
    return res.status(400).json({ error: 'invalid_license' });
  }
  
  // 2. Vérifier expiration
  if (license.expires_at && license.expires_at < new Date()) {
    return res.status(400).json({ error: 'license_expired' });
  }
  
  // 3. Vérifier nombre d'activations
  const activeCount = await db.activations.countActive(license.id);
  const existing = await db.activations.findByHardware(license.id, hardwareId);
  
  if (!existing && activeCount >= license.max_activations) {
    return res.status(400).json({ 
      error: 'max_activations_reached',
      max: license.max_activations 
    });
  }
  
  // 4. Créer ou mettre à jour l'activation
  await db.activations.upsert({
    licenseId: license.id,
    hardwareId,
    appVersion,
    osInfo,
    lastSeenAt: new Date()
  });
  
  // 5. Retourner le token de session
  const token = generateSignedToken({
    licenseId: license.id,
    plan: license.plan,
    features: getPlanFeatures(license.plan),
    expiresAt: license.expires_at
  });
  
  res.json({ 
    valid: true,
    token,
    plan: license.plan,
    features: getPlanFeatures(license.plan)
  });
});

function getPlanFeatures(plan: string): string[] {
  const features = {
    free: ['import', 'basic_categories', 'monthly_report'],
    premium: ['import', 'custom_categories', 'adjustments', 
              'all_reports', 'export_pdf', 'budget_templates']
  };
  return features[plan] || features.free;
}
```

#### Côté client - Vérification

```typescript
class LicenseManager {
  private cache: LicenseCache;
  
  async checkLicense(): Promise<LicenseStatus> {
    // 1. Vérifier le cache local d'abord
    const cached = await this.cache.get();
    if (cached && !this.isExpired(cached) && !this.needsRevalidation(cached)) {
      return cached;
    }
    
    // 2. Sinon, valider en ligne
    try {
      const response = await this.validateOnline();
      await this.cache.set(response);
      return response;
    } catch (e) {
      // 3. Mode hors-ligne : grace period de 7 jours
      if (cached && this.withinGracePeriod(cached)) {
        return { ...cached, offline: true };
      }
      return { valid: false, plan: 'free' };
    }
  }
  
  private needsRevalidation(cached: LicenseCache): boolean {
    // Revalider toutes les 72h
    const lastCheck = new Date(cached.lastValidated);
    const hoursSince = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60);
    return hoursSince > 72;
  }
  
  private withinGracePeriod(cached: LicenseCache): boolean {
    const lastCheck = new Date(cached.lastValidated);
    const daysSince = (Date.now() - lastCheck.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }
}
```

#### Sécurité

| Risque | Mitigation |
|--------|------------|
| Clé partagée | Limite d'activations (3 machines) |
| Crack local | Fonctionnalités premium côté validation, pas juste UI |
| Man-in-the-middle | HTTPS + signature des tokens |
| Reverse engineering | Obfuscation (limité mais aide) |
| Serveur down | Grace period 7 jours + mode dégradé |

**Note réaliste** : Aucune protection n'est parfaite pour une app desktop. L'objectif est de rendre le crack plus difficile que l'achat pour l'utilisateur moyen, pas d'être inviolable.

### Précision décimale (8 décimales)

Pour supporter les cryptomonnaies (Bitcoin = 8 décimales, certains tokens = plus), deux approches :

**Approche 1 : Stockage INTEGER (recommandé)**

```typescript
// Stocker les montants en plus petite unité (satoshis, cents × 10^6)
const DECIMAL_PLACES = 8;
const MULTIPLIER = 10 ** DECIMAL_PLACES;  // 100_000_000

function toStorageAmount(displayAmount: number): bigint {
  return BigInt(Math.round(displayAmount * MULTIPLIER));
}

function toDisplayAmount(storageAmount: bigint): number {
  return Number(storageAmount) / MULTIPLIER;
}

// Exemple
const btcAmount = 0.00123456;
const stored = toStorageAmount(btcAmount);  // 123456n
const display = toDisplayAmount(stored);     // 0.00123456
```

Avantages :
- Pas de floating point errors (0.1 + 0.2 ≠ 0.3)
- Calculs exacts
- SQLite INTEGER = 64 bits signés = jusqu'à ~92 milliards en unités de base

**Approche 2 : TEXT avec Decimal.js**

```typescript
import Decimal from 'decimal.js';

Decimal.set({ precision: 20 });

const amount = new Decimal('0.12345678');
const total = amount.plus('0.00000001');  // Exact: 0.12345679

// Stockage en TEXT dans SQLite
db.run('INSERT INTO transactions (amount_text) VALUES (?)', 
       [amount.toString()]);
```

**Formatage d'affichage**

```typescript
function formatAmount(amount: number, currency: string): string {
  const decimals = currency === 'BTC' ? 8 
                 : currency === 'ETH' ? 8
                 : 2;  // CAD, USD, EUR
  
  return new Intl.NumberFormat('fr-CA', {
    minimumFractionDigits: decimals > 2 ? 2 : decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

// 0.00123456 BTC → "0,00123456"
// 1234.50 CAD → "1 234,50"
```

### Performance

```typescript
// Indexes recommandés pour queries fréquentes
const CRITICAL_QUERIES = {
  // Dashboard: dépenses du mois courant par catégorie
  monthlyByCategory: `
    SELECT category_id, SUM(debit_amount) as total
    FROM transactions
    WHERE strftime('%Y-%m', transaction_date) = ?
    GROUP BY category_id
  `,
  // Budget vs Réel
  budgetComparison: `
    SELECT 
      b.category_id,
      b.planned_amount,
      COALESCE(SUM(t.debit_amount), 0) as actual_amount
    FROM budget_entries b
    LEFT JOIN transactions t 
      ON t.category_id = b.category_id
      AND strftime('%Y-%m', t.transaction_date) = b.month
    WHERE b.month = ?
    GROUP BY b.category_id
  `
};
```

### Sécurité

| Risque | Mitigation |
|--------|------------|
| Données sensibles en clair | Chiffrement SQLite optionnel (SQLCipher) |
| Injection CSV | Sanitization des imports |
| Accès fichiers arbitraires | Sandbox des chemins d'import |

### Tests

```
tests/
├── unit/
│   ├── services/
│   │   ├── import.service.test.ts
│   │   └── categorization.service.test.ts
│   └── utils/
│       └── csv-parser.test.ts
├── integration/
│   ├── database.test.ts
│   └── import-flow.test.ts
└── e2e/
    ├── import-wizard.test.ts
    └── reporting.test.ts
```

---

## Plan de développement suggéré

### Phase 1 - MVP (4-6 semaines)

**Objectif**: Import et visualisation basique

- [ ] Setup projet (Tauri + React/Svelte)
- [ ] Schéma BDD SQLite
- [ ] Import CSV basique (1 format fixe)
- [ ] Liste transactions
- [ ] Catégories par défaut
- [ ] Matching mots-clés simple
- [ ] Rapport mensuel simple (tableau)

### Phase 2 - Core (4-6 semaines)

**Objectif**: Fonctionnalités complètes freemium

- [ ] Configuration sources multiples
- [ ] Assistant mapping colonnes
- [ ] Gestion catégories/fournisseurs
- [ ] Interface transactions non-matchées
- [ ] Budget mensuel
- [ ] 3 rapports de base
- [ ] Graphiques simples

### Phase 3 - Premium (4-6 semaines)

**Objectif**: Différenciation payant

- [ ] Écritures d'ajustement
- [ ] Personnalisation catégories
- [ ] Rapports avancés
- [ ] Export PDF
- [ ] Graphiques interactifs
- [ ] Templates budget

### Phase 4 - Polish (2-4 semaines)

**Objectif**: Production-ready

- [ ] Tests complets
- [ ] Installateurs (Windows, macOS, Linux)
- [ ] Documentation utilisateur
- [ ] Système de licence
- [ ] Backup/restore
- [ ] Performance tuning

---

## Annexe: Catégories par défaut suggérées

```json
{
  "categories": [
    {
      "name": "Logement",
      "type": "recurring",
      "subcategories": ["Loyer/Hypothèque", "Électricité", "Chauffage", "Internet", "Assurance habitation", "Taxes"]
    },
    {
      "name": "Transport",
      "type": "recurring",
      "subcategories": ["Essence", "Transport en commun", "Assurance auto", "Entretien véhicule", "Stationnement"]
    },
    {
      "name": "Alimentation",
      "type": "recurring",
      "subcategories": ["Épicerie", "Restaurant", "Livraison", "Café"]
    },
    {
      "name": "Santé",
      "type": "occasional",
      "subcategories": ["Pharmacie", "Médecin", "Dentiste", "Optométriste", "Assurance santé"]
    },
    {
      "name": "Loisirs",
      "type": "occasional",
      "subcategories": ["Sport", "Culture", "Streaming", "Jeux", "Hobbies"]
    },
    {
      "name": "Shopping",
      "type": "occasional",
      "subcategories": ["Vêtements", "Électronique", "Maison", "Cadeaux"]
    },
    {
      "name": "Services",
      "type": "recurring",
      "subcategories": ["Téléphone", "Abonnements", "Banque"]
    },
    {
      "name": "Transferts",
      "type": "transfer",
      "subcategories": ["Entre comptes", "Épargne", "Investissement"]
    },
    {
      "name": "Revenus",
      "type": "income",
      "subcategories": ["Salaire", "Freelance", "Remboursements", "Autres revenus"]
    },
    {
      "name": "Autres dépenses",
      "type": "occasional",
      "subcategories": []
    }
  ]
}
```
