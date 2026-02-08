import { getDb } from "./db";
import type { UserPreference } from "../shared/types";

export async function getPreference(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<UserPreference[]>(
    "SELECT * FROM user_preferences WHERE key = $1",
    [key]
  );
  return rows.length > 0 ? rows[0].value : null;
}

export async function setPreference(
  key: string,
  value: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO user_preferences (key, value, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
}

export async function getImportFolder(): Promise<string | null> {
  return getPreference("import_folder");
}

export async function setImportFolder(path: string): Promise<void> {
  return setPreference("import_folder", path);
}
