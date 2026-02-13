import { getDb } from "./db";
import type {
  MonthlyTrendItem,
  CategoryBreakdownItem,
  CategoryOverTimeData,
  CategoryOverTimeItem,
} from "../shared/types";

export async function getMonthlyTrends(
  dateFrom?: string,
  dateTo?: string
): Promise<MonthlyTrendItem[]> {
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

  return db.select<MonthlyTrendItem[]>(
    `SELECT
       strftime('%Y-%m', date) AS month,
       COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) AS income,
       ABS(COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0)) AS expenses
     FROM transactions
     ${whereSQL}
     GROUP BY month
     ORDER BY month ASC`,
    params
  );
}

export async function getCategoryOverTime(
  dateFrom?: string,
  dateTo?: string,
  topN: number = 8
): Promise<CategoryOverTimeData> {
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

  // Get top N categories by total spend
  const topCategories = await db.select<CategoryBreakdownItem[]>(
    `SELECT
       t.category_id,
       COALESCE(c.name, 'Uncategorized') AS category_name,
       COALESCE(c.color, '#9ca3af') AS category_color,
       ABS(SUM(t.amount)) AS total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ${whereSQL}
     GROUP BY t.category_id
     ORDER BY total DESC
     LIMIT $${paramIndex}`,
    [...params, topN]
  );

  const topCategoryIds = new Set(topCategories.map((c) => c.category_id));
  const colors: Record<string, string> = {};
  const categoryIds: Record<string, number | null> = {};
  for (const cat of topCategories) {
    colors[cat.category_name] = cat.category_color;
    categoryIds[cat.category_name] = cat.category_id;
  }

  // Get monthly breakdown for all categories
  const monthlyRows = await db.select<
    Array<{
      month: string;
      category_id: number | null;
      category_name: string;
      total: number;
    }>
  >(
    `SELECT
       strftime('%Y-%m', t.date) AS month,
       t.category_id,
       COALESCE(c.name, 'Uncategorized') AS category_name,
       ABS(SUM(t.amount)) AS total
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ${whereSQL}
     GROUP BY month, t.category_id
     ORDER BY month ASC`,
    params
  );

  // Build pivot data
  const monthMap = new Map<string, CategoryOverTimeItem>();
  let hasOther = false;

  for (const row of monthlyRows) {
    if (!monthMap.has(row.month)) {
      monthMap.set(row.month, { month: row.month });
    }
    const item = monthMap.get(row.month)!;

    if (topCategoryIds.has(row.category_id)) {
      item[row.category_name] = ((item[row.category_name] as number) || 0) + row.total;
    } else {
      item["Other"] = ((item["Other"] as number) || 0) + row.total;
      hasOther = true;
    }
  }

  if (hasOther) {
    colors["Other"] = "#9ca3af";
  }

  const categories = topCategories.map((c) => c.category_name);
  if (hasOther) {
    categories.push("Other");
  }

  return {
    categories,
    data: Array.from(monthMap.values()),
    colors,
    categoryIds,
  };
}
