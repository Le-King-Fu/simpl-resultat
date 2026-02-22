import { getDb } from "./db";
import type {
  MonthlyTrendItem,
  CategoryBreakdownItem,
  CategoryOverTimeData,
  CategoryOverTimeItem,
  PivotConfig,
  PivotFieldId,
  PivotResult,
  PivotResultRow,
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

// --- Dynamic Report (Pivot Table) ---

const FIELD_SQL: Record<PivotFieldId, { select: string; alias: string }> = {
  year:   { select: "strftime('%Y', t.date)", alias: "year" },
  month:  { select: "strftime('%Y-%m', t.date)", alias: "month" },
  type:   { select: "COALESCE(c.type, 'expense')", alias: "type" },
  level1: { select: "COALESCE(parent_cat.name, c.name, 'Uncategorized')", alias: "level1" },
  level2: { select: "COALESCE(CASE WHEN c.parent_id IS NOT NULL THEN c.name ELSE NULL END, 'Uncategorized')", alias: "level2" },
};

function needsCategoryJoin(fields: PivotFieldId[]): boolean {
  return fields.some((f) => f === "type" || f === "level1" || f === "level2");
}

export async function getDynamicReportData(
  config: PivotConfig,
): Promise<PivotResult> {
  const db = await getDb();

  const allDimensions = [...config.rows, ...config.columns];
  const filterFields = Object.keys(config.filters) as PivotFieldId[];
  const allFields = [...new Set([...allDimensions, ...filterFields])];

  const useCatJoin = needsCategoryJoin(allFields);

  // Build SELECT columns
  const selectParts: string[] = [];
  const groupByParts: string[] = [];

  for (const fieldId of allDimensions) {
    const def = FIELD_SQL[fieldId];
    selectParts.push(`${def.select} AS ${def.alias}`);
    groupByParts.push(def.alias);
  }

  // Measures
  const hasPeriodic = config.values.includes("periodic");
  const hasYtd = config.values.includes("ytd");

  if (hasPeriodic) {
    selectParts.push("ABS(SUM(t.amount)) AS periodic");
  }

  // Build WHERE
  const whereClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  // Apply filter values (include / exclude)
  for (const fieldId of filterFields) {
    const entry = config.filters[fieldId];
    if (!entry) continue;
    const def = FIELD_SQL[fieldId as PivotFieldId];
    if (entry.include && entry.include.length > 0) {
      const placeholders = entry.include.map(() => {
        const p = `$${paramIndex}`;
        paramIndex++;
        return p;
      });
      whereClauses.push(`${def.select} IN (${placeholders.join(", ")})`);
      params.push(...entry.include);
    }
    if (entry.exclude && entry.exclude.length > 0) {
      const placeholders = entry.exclude.map(() => {
        const p = `$${paramIndex}`;
        paramIndex++;
        return p;
      });
      whereClauses.push(`${def.select} NOT IN (${placeholders.join(", ")})`);
      params.push(...entry.exclude);
    }
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const groupBySQL = groupByParts.length > 0 ? `GROUP BY ${groupByParts.join(", ")}` : "";
  const orderBySQL = groupByParts.length > 0 ? `ORDER BY ${groupByParts.join(", ")}` : "";

  const joinSQL = useCatJoin
    ? `LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id`
    : "";

  const sql = `SELECT ${selectParts.join(", ")}
    FROM transactions t
    ${joinSQL}
    ${whereSQL}
    ${groupBySQL}
    ${orderBySQL}`;

  const rawRows = await db.select<Array<Record<string, unknown>>>(sql, params);

  // Build PivotResultRow array
  const rows: PivotResultRow[] = rawRows.map((raw) => {
    const keys: Record<string, string> = {};
    for (const fieldId of allDimensions) {
      keys[fieldId] = String(raw[FIELD_SQL[fieldId].alias] ?? "");
    }
    const measures: Record<string, number> = {};
    if (hasPeriodic) {
      measures.periodic = Number(raw.periodic) || 0;
    }
    return { keys, measures };
  });

  // Compute YTD if requested
  if (hasYtd && rows.length > 0) {
    // YTD = cumulative sum from January of the year, grouped by row dimensions (excluding month)
    const rowDims = config.rows.filter((f) => f !== "month");
    const colDims = config.columns.filter((f) => f !== "month");
    const groupDims = [...rowDims, ...colDims];

    // Sort rows by year then month for accumulation
    const sorted = [...rows].sort((a, b) => {
      const aKey = (a.keys.year || a.keys.month?.slice(0, 4) || "") + (a.keys.month || "");
      const bKey = (b.keys.year || b.keys.month?.slice(0, 4) || "") + (b.keys.month || "");
      return aKey.localeCompare(bKey);
    });

    // Accumulate by group key + year
    const accumulators = new Map<string, number>();
    for (const row of sorted) {
      const year = row.keys.year || row.keys.month?.slice(0, 4) || "";
      const groupKey = groupDims.map((d) => row.keys[d] || "").join("|") + "|" + year;
      const prev = accumulators.get(groupKey) || 0;
      const current = prev + (row.measures.periodic || 0);
      accumulators.set(groupKey, current);
      row.measures.ytd = current;
    }

    // Restore original order
    const rowMap = new Map(sorted.map((r) => {
      const key = Object.values(r.keys).join("|");
      return [key, r];
    }));
    for (let i = 0; i < rows.length; i++) {
      const key = Object.values(rows[i].keys).join("|");
      const updated = rowMap.get(key);
      if (updated) {
        rows[i].measures.ytd = updated.measures.ytd;
      }
    }
  }

  // Extract distinct column values (composite key when multiple column dimensions)
  const colDims = config.columns;
  const columnValues = colDims.length > 0
    ? [...new Set(rows.map((r) => colDims.map((d) => r.keys[d] || "").join("\0")))].sort()
    : [];

  // Dimension labels
  const dimensionLabels: Record<string, string> = {
    year: "Année",
    month: "Mois",
    type: "Type",
    level1: "Catégorie (Niveau 1)",
    level2: "Catégorie (Niveau 2)",
    periodic: "Montant périodique",
    ytd: "Cumul annuel (YTD)",
  };

  return { rows, columnValues, dimensionLabels };
}

export async function getDynamicFilterValues(
  fieldId: PivotFieldId,
): Promise<string[]> {
  const db = await getDb();
  const def = FIELD_SQL[fieldId];
  const useCatJoin = needsCategoryJoin([fieldId]);

  const joinSQL = useCatJoin
    ? `LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN categories parent_cat ON c.parent_id = parent_cat.id`
    : "";

  const rows = await db.select<Array<{ val: string }>>(
    `SELECT DISTINCT ${def.select} AS val FROM transactions t ${joinSQL} ORDER BY val`,
    [],
  );
  return rows.map((r) => r.val);
}
