import { getDb } from "./db";
import type { ImportedFile, ImportedFileWithSource } from "../shared/types";

export async function getFilesBySourceId(
  sourceId: number
): Promise<ImportedFile[]> {
  const db = await getDb();
  return db.select<ImportedFile[]>(
    "SELECT * FROM imported_files WHERE source_id = $1 ORDER BY import_date DESC",
    [sourceId]
  );
}

export async function existsByHash(
  fileHash: string
): Promise<ImportedFile | null> {
  const db = await getDb();
  const rows = await db.select<ImportedFile[]>(
    "SELECT * FROM imported_files WHERE file_hash = $1",
    [fileHash]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createImportedFile(file: {
  source_id: number;
  filename: string;
  file_hash: string;
  row_count: number;
  status: string;
  notes?: string;
}): Promise<number> {
  const db = await getDb();
  // Check if file already exists (e.g. from a previous failed import)
  const existing = await db.select<ImportedFile[]>(
    "SELECT id FROM imported_files WHERE source_id = $1 AND file_hash = $2",
    [file.source_id, file.file_hash]
  );
  if (existing.length > 0) {
    await db.execute(
      `UPDATE imported_files SET filename = $1, row_count = $2, status = $3, notes = $4, import_date = CURRENT_TIMESTAMP WHERE id = $5`,
      [file.filename, file.row_count, file.status, file.notes || null, existing[0].id]
    );
    return existing[0].id;
  }

  const result = await db.execute(
    `INSERT INTO imported_files (source_id, filename, file_hash, row_count, status, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      file.source_id,
      file.filename,
      file.file_hash,
      file.row_count,
      file.status,
      file.notes || null,
    ]
  );
  return result.lastInsertId as number;
}

export async function updateFileStatus(
  id: number,
  status: string,
  rowCount?: number,
  notes?: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE imported_files SET status = $1, row_count = COALESCE($2, row_count), notes = COALESCE($3, notes) WHERE id = $4`,
    [status, rowCount ?? null, notes ?? null, id]
  );
}

export async function getAllImportedFiles(): Promise<ImportedFileWithSource[]> {
  const db = await getDb();
  return db.select<ImportedFileWithSource[]>(
    `SELECT f.*, s.name AS source_name
     FROM imported_files f
     JOIN import_sources s ON s.id = f.source_id
     ORDER BY f.import_date DESC`
  );
}

export async function deleteImportWithTransactions(
  fileId: number
): Promise<number> {
  const db = await getDb();

  // Look up the source_id before deleting
  const files = await db.select<ImportedFile[]>(
    "SELECT source_id FROM imported_files WHERE id = $1",
    [fileId]
  );
  const sourceId = files.length > 0 ? files[0].source_id : null;

  const result = await db.execute(
    "DELETE FROM transactions WHERE file_id = $1",
    [fileId]
  );
  await db.execute("DELETE FROM imported_files WHERE id = $1", [fileId]);

  // Clean up orphaned source if no files remain
  if (sourceId) {
    const remaining = await db.select<Array<{ cnt: number }>>(
      "SELECT COUNT(*) AS cnt FROM imported_files WHERE source_id = $1",
      [sourceId]
    );
    if (remaining[0]?.cnt === 0) {
      await db.execute("DELETE FROM import_sources WHERE id = $1", [sourceId]);
    }
  }

  return result.rowsAffected;
}

export async function deleteAllImportsWithTransactions(): Promise<number> {
  const db = await getDb();
  const result = await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM imported_files");
  await db.execute("DELETE FROM import_sources");
  return result.rowsAffected;
}
