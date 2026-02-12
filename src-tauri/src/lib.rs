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
