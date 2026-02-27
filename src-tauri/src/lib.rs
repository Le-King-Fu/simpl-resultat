mod commands;
mod database;

use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "create initial schema",
            sql: database::SCHEMA,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "seed categories and keywords",
            sql: database::SEED_CATEGORIES,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add has_header to import_sources",
            sql: "ALTER TABLE import_sources ADD COLUMN has_header INTEGER NOT NULL DEFAULT 1;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add is_inputable to categories",
            sql: "ALTER TABLE categories ADD COLUMN is_inputable INTEGER NOT NULL DEFAULT 1;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create import_config_templates table",
            sql: "CREATE TABLE IF NOT EXISTS import_config_templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                delimiter TEXT NOT NULL DEFAULT ';',
                encoding TEXT NOT NULL DEFAULT 'utf-8',
                date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
                skip_lines INTEGER NOT NULL DEFAULT 0,
                has_header INTEGER NOT NULL DEFAULT 1,
                column_mapping TEXT NOT NULL,
                amount_mode TEXT NOT NULL DEFAULT 'single',
                sign_convention TEXT NOT NULL DEFAULT 'negative_expense',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "change imported_files unique constraint from hash to filename",
            sql: "CREATE TABLE imported_files_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_id INTEGER NOT NULL REFERENCES import_sources(id),
                filename TEXT NOT NULL,
                file_hash TEXT NOT NULL,
                import_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                row_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'completed',
                notes TEXT,
                UNIQUE(source_id, filename)
            );
            INSERT INTO imported_files_new SELECT * FROM imported_files;
            DROP TABLE imported_files;
            ALTER TABLE imported_files_new RENAME TO imported_files;",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "add level-3 insurance subcategories",
            sql: "INSERT OR IGNORE INTO categories (id, name, parent_id, type, color, sort_order) VALUES (310, 'Assurance-auto', 31, 'expense', '#14b8a6', 1);
            INSERT OR IGNORE INTO categories (id, name, parent_id, type, color, sort_order) VALUES (311, 'Assurance-habitation', 31, 'expense', '#0d9488', 2);
            INSERT OR IGNORE INTO categories (id, name, parent_id, type, color, sort_order) VALUES (312, 'Assurance-vie', 31, 'expense', '#0f766e', 3);
            UPDATE categories SET is_inputable = 0 WHERE id = 31;
            UPDATE keywords SET category_id = 310 WHERE keyword = 'BELAIR' AND category_id = 31;
            UPDATE keywords SET category_id = 311 WHERE keyword = 'PRYSM' AND category_id = 31;
            UPDATE keywords SET category_id = 312 WHERE keyword = 'INS/ASS' AND category_id = 31;",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:simpl_resultat.db", migrations)
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::scan_import_folder,
            commands::read_file_content,
            commands::hash_file,
            commands::detect_encoding,
            commands::get_file_preview,
            commands::pick_folder,
            commands::pick_save_file,
            commands::pick_import_file,
            commands::write_export_file,
            commands::read_import_file,
            commands::is_file_encrypted,
            commands::load_profiles,
            commands::save_profiles,
            commands::delete_profile_db,
            commands::get_new_profile_init_sql,
            commands::hash_pin,
            commands::verify_pin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
