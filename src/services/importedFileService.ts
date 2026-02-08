import { getDb } from "./db";
import type { ImportedFile } from "../shared/types";

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
  sourceId: number,
  fileHash: string
): Promise<ImportedFile | null> {
  const db = await getDb();
  const rows = await db.select<ImportedFile[]>(
    "SELECT * FROM imported_files WHERE source_id = $1 AND file_hash = $2",
    [sourceId, fileHash]
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
