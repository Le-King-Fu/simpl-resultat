use rand::RngCore;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use tauri::Manager;

use crate::database;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub color: String,
    pub pin_hash: Option<String>,
    pub db_filename: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfilesConfig {
    pub active_profile_id: String,
    pub profiles: Vec<Profile>,
}

fn get_profiles_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {}", e))?;
    Ok(app_dir.join("profiles.json"))
}

fn make_default_config() -> ProfilesConfig {
    let now = chrono_now();
    let default_id = "default".to_string();
    ProfilesConfig {
        active_profile_id: default_id.clone(),
        profiles: vec![Profile {
            id: default_id,
            name: "Default".to_string(),
            color: "#4A90A4".to_string(),
            pin_hash: None,
            db_filename: "simpl_resultat.db".to_string(),
            created_at: now,
        }],
    }
}

fn chrono_now() -> String {
    // Simple ISO-ish timestamp without pulling in chrono crate
    let dur = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = dur.as_secs();
    // Return as unix timestamp string — frontend can format it
    secs.to_string()
}

#[tauri::command]
pub fn load_profiles(app: tauri::AppHandle) -> Result<ProfilesConfig, String> {
    let path = get_profiles_path(&app)?;

    if !path.exists() {
        let config = make_default_config();
        let json =
            serde_json::to_string_pretty(&config).map_err(|e| format!("JSON error: {}", e))?;

        // Ensure parent dir exists
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Cannot create app data dir: {}", e))?;
        }

        fs::write(&path, json).map_err(|e| format!("Cannot write profiles.json: {}", e))?;
        return Ok(config);
    }

    let content =
        fs::read_to_string(&path).map_err(|e| format!("Cannot read profiles.json: {}", e))?;
    let config: ProfilesConfig =
        serde_json::from_str(&content).map_err(|e| format!("Invalid profiles.json: {}", e))?;
    Ok(config)
}

#[tauri::command]
pub fn save_profiles(app: tauri::AppHandle, config: ProfilesConfig) -> Result<(), String> {
    let path = get_profiles_path(&app)?;
    let json =
        serde_json::to_string_pretty(&config).map_err(|e| format!("JSON error: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Cannot write profiles.json: {}", e))
}

#[tauri::command]
pub fn delete_profile_db(app: tauri::AppHandle, db_filename: String) -> Result<(), String> {
    if db_filename == "simpl_resultat.db" {
        return Err("Cannot delete the default profile database".to_string());
    }

    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot get app data dir: {}", e))?;
    let db_path = app_dir.join(&db_filename);

    if db_path.exists() {
        fs::remove_file(&db_path)
            .map_err(|e| format!("Cannot delete database file: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_new_profile_init_sql() -> Result<Vec<String>, String> {
    Ok(vec![
        database::CONSOLIDATED_SCHEMA.to_string(),
        database::SEED_CATEGORIES.to_string(),
    ])
}

#[tauri::command]
pub fn hash_pin(pin: String) -> Result<String, String> {
    let mut salt = [0u8; 16];
    rand::rngs::OsRng.fill_bytes(&mut salt);
    let salt_hex = hex_encode(&salt);

    let mut hasher = Sha256::new();
    hasher.update(salt_hex.as_bytes());
    hasher.update(pin.as_bytes());
    let result = hasher.finalize();
    let hash_hex = hex_encode(&result);

    // Store as "salt:hash"
    Ok(format!("{}:{}", salt_hex, hash_hex))
}

#[tauri::command]
pub fn verify_pin(pin: String, stored_hash: String) -> Result<bool, String> {
    let parts: Vec<&str> = stored_hash.split(':').collect();
    if parts.len() != 2 {
        return Err("Invalid stored hash format".to_string());
    }
    let salt_hex = parts[0];
    let expected_hash = parts[1];

    let mut hasher = Sha256::new();
    hasher.update(salt_hex.as_bytes());
    hasher.update(pin.as_bytes());
    let result = hasher.finalize();
    let computed_hash = hex_encode(&result);

    Ok(computed_hash == expected_hash)
}

fn hex_encode(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}
