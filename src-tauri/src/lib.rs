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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
