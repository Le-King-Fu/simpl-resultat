import { invoke } from "@tauri-apps/api/core";

export interface Profile {
  id: string;
  name: string;
  color: string;
  pin_hash: string | null;
  db_filename: string;
  created_at: string;
}

export interface ProfilesConfig {
  active_profile_id: string;
  profiles: Profile[];
}

export async function loadProfiles(): Promise<ProfilesConfig> {
  return invoke<ProfilesConfig>("load_profiles");
}

export async function saveProfiles(config: ProfilesConfig): Promise<void> {
  return invoke("save_profiles", { config });
}

export async function deleteProfileDb(dbFilename: string): Promise<void> {
  return invoke("delete_profile_db", { dbFilename });
}

export async function getNewProfileInitSql(): Promise<string[]> {
  return invoke<string[]>("get_new_profile_init_sql");
}

export async function hashPin(pin: string): Promise<string> {
  return invoke<string>("hash_pin", { pin });
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  return invoke<boolean>("verify_pin", { pin, storedHash });
}
