import { getDb } from "./db";
import type { ImportSource } from "../shared/types";

export async function getAllSources(): Promise<ImportSource[]> {
  const db = await getDb();
  return db.select<ImportSource[]>("SELECT * FROM import_sources ORDER BY name");
}

export async function getSourceByName(
  name: string
): Promise<ImportSource | null> {
  const db = await getDb();
  const rows = await db.select<ImportSource[]>(
    "SELECT * FROM import_sources WHERE name = $1",
    [name]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function getSourceById(
  id: number
): Promise<ImportSource | null> {
  const db = await getDb();
  const rows = await db.select<ImportSource[]>(
    "SELECT * FROM import_sources WHERE id = $1",
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createSource(
  source: Omit<ImportSource, "id" | "created_at" | "updated_at">
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO import_sources (name, description, date_format, delimiter, encoding, column_mapping, skip_lines)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT(name) DO UPDATE SET
       description = excluded.description,
       date_format = excluded.date_format,
       delimiter = excluded.delimiter,
       encoding = excluded.encoding,
       column_mapping = excluded.column_mapping,
       skip_lines = excluded.skip_lines,
       updated_at = CURRENT_TIMESTAMP`,
    [
      source.name,
      source.description || null,
      source.date_format,
      source.delimiter,
      source.encoding,
      source.column_mapping,
      source.skip_lines,
    ]
  );
  // On conflict, lastInsertId may be 0 — look up the existing row
  if (result.lastInsertId) return result.lastInsertId as number;
  const existing = await getSourceByName(source.name);
  return existing!.id;
}

export async function updateSource(
  id: number,
  source: Partial<Omit<ImportSource, "id" | "created_at" | "updated_at">>
): Promise<void> {
  const db = await getDb();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (source.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(source.name);
  }
  if (source.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(source.description);
  }
  if (source.date_format !== undefined) {
    fields.push(`date_format = $${paramIndex++}`);
    values.push(source.date_format);
  }
  if (source.delimiter !== undefined) {
    fields.push(`delimiter = $${paramIndex++}`);
    values.push(source.delimiter);
  }
  if (source.encoding !== undefined) {
    fields.push(`encoding = $${paramIndex++}`);
    values.push(source.encoding);
  }
  if (source.column_mapping !== undefined) {
    fields.push(`column_mapping = $${paramIndex++}`);
    values.push(source.column_mapping);
  }
  if (source.skip_lines !== undefined) {
    fields.push(`skip_lines = $${paramIndex++}`);
    values.push(source.skip_lines);
  }

  if (fields.length === 0) return;

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  await db.execute(
    `UPDATE import_sources SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteSource(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM import_sources WHERE id = $1", [id]);
}
