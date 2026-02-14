-- Simpl'Résultat Database Schema

CREATE TABLE IF NOT EXISTS import_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    date_format TEXT NOT NULL DEFAULT '%d/%m/%Y',
    delimiter TEXT NOT NULL DEFAULT ';',
    encoding TEXT NOT NULL DEFAULT 'utf-8',
    column_mapping TEXT NOT NULL, -- JSON mapping
    skip_lines INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imported_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    import_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    row_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'partial', 'error'
    notes TEXT,
    FOREIGN KEY (source_id) REFERENCES import_sources(id) ON DELETE CASCADE,
    UNIQUE(source_id, file_hash)
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    color TEXT,
    icon TEXT,
    type TEXT NOT NULL DEFAULT 'expense', -- 'expense', 'income', 'transfer'
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);
-- NOTE: is_inputable column added by migration 4

CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    normalized_name TEXT NOT NULL,
    category_id INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    supplier_id INTEGER,
    priority INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    UNIQUE(keyword, category_id)
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    supplier_id INTEGER,
    source_id INTEGER,
    file_id INTEGER,
    original_description TEXT,
    notes TEXT,
    is_manually_categorized INTEGER NOT NULL DEFAULT 0,
    is_split INTEGER NOT NULL DEFAULT 0,
    parent_transaction_id INTEGER,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    FOREIGN KEY (source_id) REFERENCES import_sources(id) ON DELETE SET NULL,
    FOREIGN KEY (file_id) REFERENCES imported_files(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS adjustments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    is_recurring INTEGER NOT NULL DEFAULT 0,
    recurrence_rule TEXT, -- JSON rule for recurring adjustments
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adjustment_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adjustment_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    FOREIGN KEY (adjustment_id) REFERENCES adjustments(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS budget_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL, -- 1-12
    amount REAL NOT NULL,
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(category_id, year, month)
);

CREATE TABLE IF NOT EXISTS budget_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS budget_template_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (template_id) REFERENCES budget_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(template_id, category_id)
);

-- NOTE: import_config_templates table created by migration 5

CREATE TABLE IF NOT EXISTS user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_supplier ON transactions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_transactions_source ON transactions(source_id);
CREATE INDEX IF NOT EXISTS idx_transactions_file ON transactions(file_id);
CREATE INDEX IF NOT EXISTS idx_transactions_parent ON transactions(parent_transaction_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_normalized ON suppliers(normalized_name);
CREATE INDEX IF NOT EXISTS idx_keywords_category ON keywords(category_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_budget_entries_period ON budget_entries(year, month);
CREATE INDEX IF NOT EXISTS idx_adjustment_entries_adjustment ON adjustment_entries(adjustment_id);
CREATE INDEX IF NOT EXISTS idx_imported_files_source ON imported_files(source_id);

-- Default preferences
INSERT OR IGNORE INTO user_preferences (key, value) VALUES ('language', 'fr');
INSERT OR IGNORE INTO user_preferences (key, value) VALUES ('theme', 'light');
INSERT OR IGNORE INTO user_preferences (key, value) VALUES ('currency', 'EUR');
INSERT OR IGNORE INTO user_preferences (key, value) VALUES ('date_format', 'DD/MM/YYYY');
