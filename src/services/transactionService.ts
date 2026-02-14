import { getDb } from "./db";
import { categorizeBatch } from "./categorizationService";
import type {
  Transaction,
  TransactionRow,
  TransactionFilters,
  TransactionSort,
  TransactionPageResult,
  Category,
  ImportSource,
} from "../shared/types";

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
  }>,
  onProgress?: (inserted: number) => void
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
    if (onProgress && insertedCount % 10 === 0) {
      onProgress(insertedCount);
    }
  }

  if (onProgress && insertedCount % 10 !== 0) {
    onProgress(insertedCount);
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

export async function getTransactionPage(
  filters: TransactionFilters,
  sort: TransactionSort,
  page: number,
  pageSize: number
): Promise<TransactionPageResult> {
  const db = await getDb();

  const whereClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.search) {
    whereClauses.push(`t.description LIKE $${paramIndex}`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.uncategorizedOnly) {
    whereClauses.push(`t.category_id IS NULL`);
  } else if (filters.categoryId !== null) {
    whereClauses.push(`t.category_id = $${paramIndex}`);
    params.push(filters.categoryId);
    paramIndex++;
  }

  if (filters.sourceId !== null) {
    whereClauses.push(`t.source_id = $${paramIndex}`);
    params.push(filters.sourceId);
    paramIndex++;
  }

  if (filters.dateFrom) {
    whereClauses.push(`t.date >= $${paramIndex}`);
    params.push(filters.dateFrom);
    paramIndex++;
  }

  if (filters.dateTo) {
    whereClauses.push(`t.date <= $${paramIndex}`);
    params.push(filters.dateTo);
    paramIndex++;
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Map sort column to SQL
  const sortColumnMap: Record<string, string> = {
    date: "t.date",
    description: "t.description",
    amount: "t.amount",
    category_name: "c.name",
  };
  const orderSQL = `ORDER BY ${sortColumnMap[sort.column]} ${sort.direction}`;

  const offset = (page - 1) * pageSize;

  // Rows query
  const rowsSQL = `
    SELECT t.id, t.date, t.description, t.amount, t.category_id,
           c.name AS category_name, c.color AS category_color,
           s.name AS source_name, t.notes, t.is_manually_categorized
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN import_sources s ON t.source_id = s.id
    ${whereSQL}
    ${orderSQL}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  const rowsParams = [...params, pageSize, offset];

  // Totals query
  const totalsSQL = `
    SELECT COUNT(*) AS totalCount,
           COALESCE(SUM(t.amount), 0) AS totalAmount,
           COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS incomeTotal,
           COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END), 0) AS expenseTotal
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN import_sources s ON t.source_id = s.id
    ${whereSQL}
  `;

  const [rows, totals] = await Promise.all([
    db.select<TransactionRow[]>(rowsSQL, rowsParams),
    db.select<
      Array<{
        totalCount: number;
        totalAmount: number;
        incomeTotal: number;
        expenseTotal: number;
      }>
    >(totalsSQL, params),
  ]);

  const t = totals[0] ?? {
    totalCount: 0,
    totalAmount: 0,
    incomeTotal: 0,
    expenseTotal: 0,
  };

  return {
    rows,
    totalCount: t.totalCount,
    totalAmount: t.totalAmount,
    incomeTotal: t.incomeTotal,
    expenseTotal: t.expenseTotal,
  };
}

export async function updateTransactionCategory(
  txId: number,
  categoryId: number | null,
  isManual: boolean
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE transactions SET category_id = $1, is_manually_categorized = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
    [categoryId, isManual, txId]
  );
}

export async function updateTransactionNotes(
  txId: number,
  notes: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE transactions SET notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
    [notes, txId]
  );
}

export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.select<Category[]>(
    `SELECT * FROM categories WHERE is_active = 1 AND is_inputable = 1 ORDER BY sort_order, name`
  );
}

export async function getAllImportSources(): Promise<ImportSource[]> {
  const db = await getDb();
  return db.select<ImportSource[]>(
    `SELECT * FROM import_sources ORDER BY name`
  );
}

export async function autoCategorizeTransactions(): Promise<number> {
  const db = await getDb();
  const uncategorized = await db.select<Array<{ id: number; description: string }>>(
    `SELECT id, description FROM transactions WHERE category_id IS NULL AND is_manually_categorized = 0`
  );

  if (uncategorized.length === 0) return 0;

  const results = await categorizeBatch(uncategorized.map((tx) => tx.description));

  let count = 0;
  for (let i = 0; i < uncategorized.length; i++) {
    const result = results[i];
    if (result.category_id !== null) {
      await db.execute(
        `UPDATE transactions SET category_id = $1, supplier_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [result.category_id, result.supplier_id, uncategorized[i].id]
      );
      count++;
    }
  }

  return count;
}
