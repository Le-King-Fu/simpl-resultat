import { getDb } from "./db";
import type { Transaction } from "../shared/types";

export async function insertBatch(
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    source_id: number;
    file_id: number;
    original_description: string;
    category_id?: number | null;
    supplier_id?: number | null;
  }>
): Promise<number> {
  const db = await getDb();
  let insertedCount = 0;

  for (const tx of transactions) {
    await db.execute(
      `INSERT INTO transactions (date, description, amount, source_id, file_id, original_description, category_id, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tx.date,
        tx.description,
        tx.amount,
        tx.source_id,
        tx.file_id,
        tx.original_description,
        tx.category_id ?? null,
        tx.supplier_id ?? null,
      ]
    );
    insertedCount++;
  }

  return insertedCount;
}

export async function findDuplicates(
  rows: Array<{ date: string; description: string; amount: number }>
): Promise<
  Array<{
    rowIndex: number;
    existingTransactionId: number;
    date: string;
    description: string;
    amount: number;
  }>
> {
  const db = await getDb();
  const duplicates: Array<{
    rowIndex: number;
    existingTransactionId: number;
    date: string;
    description: string;
    amount: number;
  }> = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const existing = await db.select<Transaction[]>(
      `SELECT id FROM transactions WHERE date = $1 AND description = $2 AND amount = $3 LIMIT 1`,
      [row.date, row.description, row.amount]
    );
    if (existing.length > 0) {
      duplicates.push({
        rowIndex: i,
        existingTransactionId: existing[0].id,
        date: row.date,
        description: row.description,
        amount: row.amount,
      });
    }
  }

  return duplicates;
}
