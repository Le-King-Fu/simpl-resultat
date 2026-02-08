use encoding_rs::{UTF_8, WINDOWS_1252, ISO_8859_15};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::fs;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Clone)]
pub struct ScannedFile {
    pub filename: String,
    pub file_path: String,
    pub size_bytes: u64,
    pub modified_at: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct ScannedSource {
    pub folder_name: String,
    pub folder_path: String,
    pub files: Vec<ScannedFile>,
}

#[tauri::command]
pub fn scan_import_folder(folder_path: String) -> Result<Vec<ScannedSource>, String> {
    let root = Path::new(&folder_path);
    if !root.is_dir() {
        return Err(format!("Folder does not exist: {}", folder_path));
    }

    let mut sources: Vec<ScannedSource> = Vec::new();

    let entries = fs::read_dir(root).map_err(|e| format!("Cannot read folder: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading entry: {}", e))?;
        let path = entry.path();

        if !path.is_dir() {
            continue;
        }

        let folder_name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        // Skip hidden folders
        if folder_name.starts_with('.') {
            continue;
        }

        let mut files: Vec<ScannedFile> = Vec::new();

        for file_entry in WalkDir::new(&path).max_depth(1).into_iter().flatten() {
            let file_path = file_entry.path();
            if !file_path.is_file() {
                continue;
            }

            let ext = file_path
                .extension()
                .unwrap_or_default()
                .to_string_lossy()
                .to_lowercase();

            if ext != "csv" && ext != "txt" {
                continue;
            }

            let metadata = fs::metadata(file_path)
                .map_err(|e| format!("Cannot read metadata: {}", e))?;

            let modified_at = metadata
                .modified()
                .map(|t| {
                    let duration = t
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default();
                    duration.as_secs().to_string()
                })
                .unwrap_or_default();

            files.push(ScannedFile {
                filename: file_path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string(),
                file_path: file_path.to_string_lossy().to_string(),
                size_bytes: metadata.len(),
                modified_at,
            });
        }

        files.sort_by(|a, b| a.filename.cmp(&b.filename));

        sources.push(ScannedSource {
            folder_name,
            folder_path: path.to_string_lossy().to_string(),
            files,
        });
    }

    sources.sort_by(|a, b| a.folder_name.cmp(&b.folder_name));

    Ok(sources)
}

#[tauri::command]
pub fn read_file_content(file_path: String, encoding: String) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Cannot read file: {}", e))?;

    let content = decode_bytes(&bytes, &encoding)?;
    Ok(content)
}

#[tauri::command]
pub fn hash_file(file_path: String) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Cannot read file: {}", e))?;
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
}

#[tauri::command]
pub fn detect_encoding(file_path: String) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Cannot read file: {}", e))?;

    // Check BOM
    if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        return Ok("utf-8".to_string());
    }
    if bytes.starts_with(&[0xFF, 0xFE]) {
        return Ok("utf-16le".to_string());
    }
    if bytes.starts_with(&[0xFE, 0xFF]) {
        return Ok("utf-16be".to_string());
    }

    // Try UTF-8 first
    if std::str::from_utf8(&bytes).is_ok() {
        return Ok("utf-8".to_string());
    }

    // Default to windows-1252 for French bank CSVs
    Ok("windows-1252".to_string())
}

#[tauri::command]
pub fn get_file_preview(
    file_path: String,
    encoding: String,
    max_lines: usize,
) -> Result<String, String> {
    let bytes = fs::read(&file_path).map_err(|e| format!("Cannot read file: {}", e))?;
    let content = decode_bytes(&bytes, &encoding)?;

    let lines: Vec<&str> = content.lines().take(max_lines).collect();
    Ok(lines.join("\n"))
}

#[tauri::command]
pub async fn pick_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let folder = app
        .dialog()
        .file()
        .blocking_pick_folder();

    Ok(folder.map(|f| f.to_string()))
}

fn decode_bytes(bytes: &[u8], encoding: &str) -> Result<String, String> {
    // Strip BOM if present
    let bytes = if bytes.starts_with(&[0xEF, 0xBB, 0xBF]) {
        &bytes[3..]
    } else {
        bytes
    };

    match encoding.to_lowercase().as_str() {
        "utf-8" | "utf8" => {
            String::from_utf8(bytes.to_vec()).map_err(|e| format!("UTF-8 decode error: {}", e))
        }
        "windows-1252" | "cp1252" => {
            let (cow, _, had_errors) = WINDOWS_1252.decode(bytes);
            if had_errors {
                Err("Windows-1252 decode error".to_string())
            } else {
                Ok(cow.into_owned())
            }
        }
        "iso-8859-1" | "iso-8859-15" | "latin1" | "latin9" => {
            let (cow, _, had_errors) = ISO_8859_15.decode(bytes);
            if had_errors {
                Err("ISO-8859-15 decode error".to_string())
            } else {
                Ok(cow.into_owned())
            }
        }
        _ => {
            // Fallback to UTF-8
            let (cow, _, _) = UTF_8.decode(bytes);
            Ok(cow.into_owned())
        }
    }
}
