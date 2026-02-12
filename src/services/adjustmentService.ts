import { getDb } from "./db";
import type { Adjustment, AdjustmentEntry } from "../shared/types";

export type AdjustmentEntryWithCategory = AdjustmentEntry & {
  category_name: string;
  category_color: string;
};

export async function getAllAdjustments(): Promise<Adjustment[]> {
  const db = await getDb();
  return db.select<Adjustment[]>(
    "SELECT * FROM adjustments ORDER BY date DESC"
  );
}

export async function getAdjustmentById(
  id: number
): Promise<Adjustment | null> {
  const db = await getDb();
  const rows = await db.select<Adjustment[]>(
    "SELECT * FROM adjustments WHERE id = $1",
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createAdjustment(data: {
  name: string;
  description?: string;
  date: string;
  is_recurring: boolean;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO adjustments (name, description, date, is_recurring)
     VALUES ($1, $2, $3, $4)`,
    [data.name, data.description || null, data.date, data.is_recurring ? 1 : 0]
  );
  return result.lastInsertId as number;
}

export async function updateAdjustment(
  id: number,
  data: { name: string; description?: string; date: string; is_recurring: boolean }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE adjustments SET name = $1, description = $2, date = $3, is_recurring = $4, updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [data.name, data.description || null, data.date, data.is_recurring ? 1 : 0, id]
  );
}

export async function deleteAdjustment(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM adjustments WHERE id = $1", [id]);
}

export async function getEntriesByAdjustmentId(
  adjustmentId: number
): Promise<AdjustmentEntryWithCategory[]> {
  const db = await getDb();
  return db.select<AdjustmentEntryWithCategory[]>(
    `SELECT ae.*, c.name AS category_name, COALESCE(c.color, '#9ca3af') AS category_color
     FROM adjustment_entries ae
     JOIN categories c ON c.id = ae.category_id
     WHERE ae.adjustment_id = $1
     ORDER BY ae.id`,
    [adjustmentId]
  );
}

export async function createEntry(entry: {
  adjustment_id: number;
  category_id: number;
  amount: number;
  description?: string;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO adjustment_entries (adjustment_id, category_id, amount, description)
     VALUES ($1, $2, $3, $4)`,
    [entry.adjustment_id, entry.category_id, entry.amount, entry.description || null]
  );
  return result.lastInsertId as number;
}

export async function updateEntry(
  id: number,
  data: { category_id: number; amount: number; description?: string }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE adjustment_entries SET category_id = $1, amount = $2, description = $3 WHERE id = $4`,
    [data.category_id, data.amount, data.description || null, id]
  );
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM adjustment_entries WHERE id = $1", [id]);
}
