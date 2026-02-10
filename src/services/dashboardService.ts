import { getDb } from "./db";
import type {
  DashboardSummary,
  CategoryBreakdownItem,
  RecentTransaction,
} from "../shared/types";

export async function getDashboardSummary(
  dateFrom?: string,
  dateTo?: string
): Promise<DashboardSummary> {
  const db = await getDb();

  const whereClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (dateFrom) {
    whereClauses.push(`date >= $${paramIndex}`);
    params.push(dateFrom);
    paramIndex++;
  }
  if (dateTo) {
    whereClauses.push(`date <= $${paramIndex}`);
    params.push(dateTo);
    paramIndex++;
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const rows = await db.select<
    Array<{
      totalCount: number;
      totalAmount: number;
      incomeTotal: number;
      expenseTotal: number;
    }>
  >(
    `SELECT
       COUNT(*) AS totalCount,
       COALESCE(SUM(amount), 0) AS totalAmount,
       COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS incomeTotal,
       COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) AS expenseTotal
     FROM transactions
     ${whereSQL}`,
    params
  );

  return rows[0] ?? { totalCount: 0, totalAmount: 0, incomeTotal: 0, expenseTotal: 0 };
}

export async function getExpensesByCategory(
  dateFrom?: string,
  dateTo?: string
): Promise<CategoryBreakdownItem[]> {
  const db = await getDb();

  const whereClauses: string[] = ["t.amount < 0"];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (dateFrom) {
    whereClauses.push(`t.date >= $${paramIndex}`);
    params.push(dateFrom);
    paramIndex++;
  }
  if (dateTo) {
    whereClauses.push(`t.date <= $${paramIndex}`);
    params.push(dateTo);
    paramIndex++;
  }

  const whereSQL = `WHERE ${whereClauses.join(" AND ")}`;

  return db.select<CategoryBreakdownItem[]>(
    `SELECT
       t.category_id,
       COALESCE(c.name, 'Uncategorized') AS category_name,
       COALESCE(c.color, '#9ca3af') AS category_color,
       ABS(SUM(t.amount)) AS total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ${whereSQL}
     GROUP BY t.category_id
     ORDER BY total DESC`,
    params
  );
}

export async function getRecentTransactions(
  limit: number = 10
): Promise<RecentTransaction[]> {
  const db = await getDb();

  return db.select<RecentTransaction[]>(
    `SELECT
       t.id, t.date, t.description, t.amount,
       c.name AS category_name, c.color AS category_color
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     WHERE t.amount < 0
     ORDER BY t.date DESC, t.id DESC
     LIMIT $1`,
    [limit]
  );
}
