use aes_gcm::aead::{Aead, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use argon2::Argon2;
use rand::RngCore;
use std::fs;
use tauri_plugin_dialog::DialogExt;

const MAGIC: &[u8; 4] = b"SREF";
const VERSION: u8 = 0x01;
const SALT_LEN: usize = 16;
const NONCE_LEN: usize = 12;
const HEADER_LEN: usize = 4 + 1 + SALT_LEN + NONCE_LEN; // 33 bytes

fn derive_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let params = argon2::Params::new(65536, 3, 1, Some(32))
        .map_err(|e| format!("Argon2 params error: {}", e))?;
    let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
    let mut key = [0u8; 32];
    argon2
        .hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Key derivation error: {}", e))?;
    Ok(key)
}

fn encrypt_data(plaintext: &[u8], password: &str) -> Result<Vec<u8>, String> {
    let mut salt = [0u8; SALT_LEN];
    OsRng.fill_bytes(&mut salt);

    let mut nonce_bytes = [0u8; NONCE_LEN];
    OsRng.fill_bytes(&mut nonce_bytes);

    let key = derive_key(password, &salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Cipher init error: {}", e))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| format!("Encryption error: {}", e))?;

    let mut output = Vec::with_capacity(HEADER_LEN + ciphertext.len());
    output.extend_from_slice(MAGIC);
    output.push(VERSION);
    output.extend_from_slice(&salt);
    output.extend_from_slice(&nonce_bytes);
    output.extend_from_slice(&ciphertext);

    Ok(output)
}

fn decrypt_data(data: &[u8], password: &str) -> Result<Vec<u8>, String> {
    if data.len() < HEADER_LEN + 16 {
        return Err("File is too small to be a valid encrypted file".to_string());
    }
    if &data[0..4] != MAGIC {
        return Err("Not a valid SREF encrypted file".to_string());
    }
    if data[4] != VERSION {
        return Err(format!("Unsupported SREF version: {}", data[4]));
    }

    let salt = &data[5..5 + SALT_LEN];
    let nonce_bytes = &data[5 + SALT_LEN..HEADER_LEN];
    let ciphertext = &data[HEADER_LEN..];

    let key = derive_key(password, salt)?;
    let cipher = Aes256Gcm::new_from_slice(&key)
        .map_err(|e| format!("Cipher init error: {}", e))?;
    let nonce = Nonce::from_slice(nonce_bytes);

    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption failed — wrong password or corrupted file".to_string())
}

#[tauri::command]
pub async fn pick_save_file(
    app: tauri::AppHandle,
    default_name: String,
    filters: Vec<(String, Vec<String>)>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file().set_file_name(&default_name);

    for (name, extensions) in &filters {
        let ext_refs: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
        dialog = dialog.add_filter(name, &ext_refs);
    }

    let path = dialog.blocking_save_file();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn pick_import_file(
    app: tauri::AppHandle,
    filters: Vec<(String, Vec<String>)>,
) -> Result<Option<String>, String> {
    let mut dialog = app.dialog().file();

    for (name, extensions) in &filters {
        let ext_refs: Vec<&str> = extensions.iter().map(|s| s.as_str()).collect();
        dialog = dialog.add_filter(name, &ext_refs);
    }

    let path = dialog.blocking_pick_file();
    Ok(path.map(|p| p.to_string()))
}

#[tauri::command]
pub fn write_export_file(
    file_path: String,
    content: String,
    password: Option<String>,
) -> Result<(), String> {
    let bytes = match password {
        Some(ref pw) if !pw.is_empty() => encrypt_data(content.as_bytes(), pw)?,
        _ => content.into_bytes(),
    };

    fs::write(&file_path, bytes).map_err(|e| format!("Failed to write file: {}", e))
}

#[tauri::command]
pub fn read_import_file(file_path: String, password: Option<String>) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let plaintext = if bytes.len() >= 4 && &bytes[0..4] == MAGIC {
        let pw = password
            .filter(|p| !p.is_empty())
            .ok_or_else(|| "This file is encrypted — a password is required".to_string())?;
        decrypt_data(&bytes, &pw)?
    } else {
        bytes
    };

    String::from_utf8(plaintext).map_err(|e| format!("File content is not valid UTF-8: {}", e))
}

#[tauri::command]
pub fn is_file_encrypted(file_path: String) -> Result<bool, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;
    Ok(bytes.len() >= 4 && &bytes[0..4] == MAGIC)
}
