import Database from "@tauri-apps/plugin-sql";

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    throw new Error("No database connection. Call connectToProfile() first.");
  }
  return dbInstance;
}

export async function connectToProfile(dbFilename: string): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
  dbInstance = await Database.load(`sqlite:${dbFilename}`);
}

export async function initializeNewProfileDb(dbFilename: string, sqlStatements: string[]): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
  dbInstance = await Database.load(`sqlite:${dbFilename}`);
  for (const sql of sqlStatements) {
    await dbInstance.execute(sql);
  }
}

export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
}
