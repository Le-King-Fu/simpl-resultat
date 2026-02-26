import { getDb } from "./db";
import type {
  Category,
  BudgetEntry,
  BudgetTemplate,
  BudgetTemplateEntry,
  BudgetVsActualRow,
} from "../shared/types";

function computeMonthDateRange(year: number, month: number) {
  const dateFrom = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dateTo = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { dateFrom, dateTo };
}

export async function getActiveCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.select<Category[]>(
    "SELECT * FROM categories WHERE is_active = 1 AND is_inputable = 1 ORDER BY sort_order, name"
  );
}

export async function getAllActiveCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.select<Category[]>(
    "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name"
  );
}

export async function getBudgetEntriesForMonth(
  year: number,
  month: number
): Promise<BudgetEntry[]> {
  const db = await getDb();
  return db.select<BudgetEntry[]>(
    "SELECT * FROM budget_entries WHERE year = $1 AND month = $2",
    [year, month]
  );
}

export async function upsertBudgetEntry(
  categoryId: number,
  year: number,
  month: number,
  amount: number,
  notes?: string
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO budget_entries (category_id, year, month, amount, notes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT(category_id, year, month) DO UPDATE SET amount = $4, notes = $5, updated_at = CURRENT_TIMESTAMP`,
    [categoryId, year, month, amount, notes || null]
  );
}

export async function deleteBudgetEntry(
  categoryId: number,
  year: number,
  month: number
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM budget_entries WHERE category_id = $1 AND year = $2 AND month = $3",
    [categoryId, year, month]
  );
}

export async function getActualsByCategory(
  year: number,
  month: number
): Promise<Array<{ category_id: number | null; actual: number }>> {
  const db = await getDb();
  const { dateFrom, dateTo } = computeMonthDateRange(year, month);
  return db.select<Array<{ category_id: number | null; actual: number }>>(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS actual
     FROM transactions
     WHERE date BETWEEN $1 AND $2
     GROUP BY category_id`,
    [dateFrom, dateTo]
  );
}

export async function getBudgetEntriesForYear(
  year: number
): Promise<BudgetEntry[]> {
  const db = await getDb();
  return db.select<BudgetEntry[]>(
    "SELECT * FROM budget_entries WHERE year = $1",
    [year]
  );
}

export async function upsertBudgetEntriesForYear(
  categoryId: number,
  year: number,
  amounts: number[]
): Promise<void> {
  const db = await getDb();
  for (let m = 0; m < 12; m++) {
    const month = m + 1;
    const amount = amounts[m] ?? 0;
    if (amount === 0) {
      await db.execute(
        "DELETE FROM budget_entries WHERE category_id = $1 AND year = $2 AND month = $3",
        [categoryId, year, month]
      );
    } else {
      await db.execute(
        `INSERT INTO budget_entries (category_id, year, month, amount)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT(category_id, year, month) DO UPDATE SET amount = $4, updated_at = CURRENT_TIMESTAMP`,
        [categoryId, year, month, amount]
      );
    }
  }
}

// Templates

export async function getAllTemplates(): Promise<BudgetTemplate[]> {
  const db = await getDb();
  return db.select<BudgetTemplate[]>(
    "SELECT * FROM budget_templates ORDER BY name"
  );
}

export async function getTemplateEntries(
  templateId: number
): Promise<BudgetTemplateEntry[]> {
  const db = await getDb();
  return db.select<BudgetTemplateEntry[]>(
    "SELECT * FROM budget_template_entries WHERE template_id = $1",
    [templateId]
  );
}

export async function saveAsTemplate(
  name: string,
  description: string | undefined,
  entries: Array<{ category_id: number; amount: number }>
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    "INSERT INTO budget_templates (name, description) VALUES ($1, $2)",
    [name, description || null]
  );
  const templateId = result.lastInsertId as number;

  for (const entry of entries) {
    await db.execute(
      "INSERT INTO budget_template_entries (template_id, category_id, amount) VALUES ($1, $2, $3)",
      [templateId, entry.category_id, entry.amount]
    );
  }

  return templateId;
}

export async function applyTemplate(
  templateId: number,
  year: number,
  month: number
): Promise<void> {
  const entries = await getTemplateEntries(templateId);
  for (const entry of entries) {
    await upsertBudgetEntry(entry.category_id, year, month, entry.amount);
  }
}

export async function deleteTemplate(templateId: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    "DELETE FROM budget_template_entries WHERE template_id = $1",
    [templateId]
  );
  await db.execute("DELETE FROM budget_templates WHERE id = $1", [templateId]);
}

// --- Budget vs Actual ---

async function getActualsByCategoryRange(
  dateFrom: string,
  dateTo: string
): Promise<Array<{ category_id: number | null; actual: number }>> {
  const db = await getDb();
  return db.select<Array<{ category_id: number | null; actual: number }>>(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS actual
     FROM transactions
     WHERE date BETWEEN $1 AND $2
     GROUP BY category_id`,
    [dateFrom, dateTo]
  );
}

const TYPE_ORDER: Record<string, number> = { expense: 0, income: 1, transfer: 2 };

export async function getBudgetVsActualData(
  year: number,
  month: number
): Promise<BudgetVsActualRow[]> {
  // Date ranges
  const { dateFrom: monthFrom, dateTo: monthTo } = computeMonthDateRange(year, month);
  const ytdFrom = `${year}-01-01`;
  const ytdTo = monthTo;

  // Fetch all data in parallel
  const [allCategories, yearEntries, monthActuals, ytdActuals] = await Promise.all([
    getAllActiveCategories(),
    getBudgetEntriesForYear(year),
    getActualsByCategoryRange(monthFrom, monthTo),
    getActualsByCategoryRange(ytdFrom, ytdTo),
  ]);

  // Build maps
  const entryMap = new Map<number, Map<number, number>>();
  for (const e of yearEntries) {
    if (!entryMap.has(e.category_id)) entryMap.set(e.category_id, new Map());
    entryMap.get(e.category_id)!.set(e.month, e.amount);
  }

  const monthActualMap = new Map<number, number>();
  for (const a of monthActuals) {
    if (a.category_id != null) monthActualMap.set(a.category_id, a.actual);
  }

  const ytdActualMap = new Map<number, number>();
  for (const a of ytdActuals) {
    if (a.category_id != null) ytdActualMap.set(a.category_id, a.actual);
  }

  // Index categories
  const catById = new Map(allCategories.map((c) => [c.id, c]));
  const childrenByParent = new Map<number, Category[]>();
  for (const cat of allCategories) {
    if (cat.parent_id) {
      if (!childrenByParent.has(cat.parent_id)) childrenByParent.set(cat.parent_id, []);
      childrenByParent.get(cat.parent_id)!.push(cat);
    }
  }

  // Sign multiplier: budget stored positive, expenses displayed negative
  const signFor = (type: string) => (type === "expense" ? -1 : 1);

  // Compute leaf row values
  function buildLeaf(cat: Category, parentId: number | null, depth: 0 | 1 | 2): BudgetVsActualRow {
    const sign = signFor(cat.type);
    const monthMap = entryMap.get(cat.id);
    const rawMonthBudget = monthMap?.get(month) ?? 0;
    const monthBudget = rawMonthBudget * sign;

    let rawYtdBudget = 0;
    for (let m = 1; m <= month; m++) {
      rawYtdBudget += monthMap?.get(m) ?? 0;
    }
    const ytdBudget = rawYtdBudget * sign;

    const monthActual = monthActualMap.get(cat.id) ?? 0;
    const ytdActual = ytdActualMap.get(cat.id) ?? 0;

    const monthVariation = monthActual - monthBudget;
    const ytdVariation = ytdActual - ytdBudget;

    return {
      category_id: cat.id,
      category_name: cat.name,
      category_color: cat.color || "#9ca3af",
      category_type: cat.type,
      parent_id: parentId,
      is_parent: false,
      depth,
      monthActual,
      monthBudget,
      monthVariation,
      monthVariationPct: monthBudget !== 0 ? monthVariation / Math.abs(monthBudget) : null,
      ytdActual,
      ytdBudget,
      ytdVariation,
      ytdVariationPct: ytdBudget !== 0 ? ytdVariation / Math.abs(ytdBudget) : null,
    };
  }

  function buildSubtotal(cat: Category, childRows: BudgetVsActualRow[], parentId: number | null, depth: 0 | 1 | 2): BudgetVsActualRow {
    const row: BudgetVsActualRow = {
      category_id: cat.id,
      category_name: cat.name,
      category_color: cat.color || "#9ca3af",
      category_type: cat.type,
      parent_id: parentId,
      is_parent: true,
      depth,
      monthActual: 0,
      monthBudget: 0,
      monthVariation: 0,
      monthVariationPct: null,
      ytdActual: 0,
      ytdBudget: 0,
      ytdVariation: 0,
      ytdVariationPct: null,
    };
    for (const cr of childRows) {
      row.monthActual += cr.monthActual;
      row.monthBudget += cr.monthBudget;
      row.monthVariation += cr.monthVariation;
      row.ytdActual += cr.ytdActual;
      row.ytdBudget += cr.ytdBudget;
      row.ytdVariation += cr.ytdVariation;
    }
    row.monthVariationPct =
      row.monthBudget !== 0 ? row.monthVariation / Math.abs(row.monthBudget) : null;
    row.ytdVariationPct =
      row.ytdBudget !== 0 ? row.ytdVariation / Math.abs(row.ytdBudget) : null;
    return row;
  }

  function isRowAllZero(r: BudgetVsActualRow): boolean {
    return (
      r.monthActual === 0 &&
      r.monthBudget === 0 &&
      r.ytdActual === 0 &&
      r.ytdBudget === 0
    );
  }

  // Build rows for a level-2 parent (intermediate parent with grandchildren)
  function buildLevel2Group(cat: Category, grandparentId: number): BudgetVsActualRow[] {
    const grandchildren = (childrenByParent.get(cat.id) || []).filter((c) => c.is_inputable);
    if (grandchildren.length === 0 && cat.is_inputable) {
      // Leaf at level 2
      const leaf = buildLeaf(cat, grandparentId, 2);
      return isRowAllZero(leaf) ? [] : [leaf];
    }
    if (grandchildren.length === 0) return [];

    const gcRows: BudgetVsActualRow[] = [];
    if (cat.is_inputable) {
      const direct = buildLeaf(cat, cat.id, 2);
      direct.category_name = `${cat.name} (direct)`;
      if (!isRowAllZero(direct)) gcRows.push(direct);
    }
    for (const gc of grandchildren) {
      const leaf = buildLeaf(gc, cat.id, 2);
      if (!isRowAllZero(leaf)) gcRows.push(leaf);
    }
    if (gcRows.length === 0) return [];

    const subtotal = buildSubtotal(cat, gcRows, grandparentId, 1);
    gcRows.sort((a, b) => {
      if (a.category_id === cat.id) return -1;
      if (b.category_id === cat.id) return 1;
      return a.category_name.localeCompare(b.category_name);
    });
    return [subtotal, ...gcRows];
  }

  const rows: BudgetVsActualRow[] = [];
  const topLevel = allCategories.filter((c) => !c.parent_id);

  for (const cat of topLevel) {
    const children = childrenByParent.get(cat.id) || [];
    const inputableChildren = children.filter((c) => c.is_inputable);
    // Also check for non-inputable intermediate parents that have their own children
    const intermediateParents = children.filter((c) => !c.is_inputable && (childrenByParent.get(c.id) || []).length > 0);

    if (inputableChildren.length === 0 && intermediateParents.length === 0 && cat.is_inputable) {
      // Standalone leaf at level 0
      const leaf = buildLeaf(cat, null, 0);
      if (!isRowAllZero(leaf)) rows.push(leaf);
    } else if (inputableChildren.length > 0 || intermediateParents.length > 0) {
      const allChildRows: BudgetVsActualRow[] = [];

      // Direct transactions on the parent itself
      if (cat.is_inputable) {
        const direct = buildLeaf(cat, cat.id, 1);
        direct.category_name = `${cat.name} (direct)`;
        if (!isRowAllZero(direct)) allChildRows.push(direct);
      }

      // Level-2 leaves (direct children that are inputable and have no children)
      for (const child of inputableChildren) {
        const grandchildren = childrenByParent.get(child.id) || [];
        if (grandchildren.length === 0) {
          const leaf = buildLeaf(child, cat.id, 1);
          if (!isRowAllZero(leaf)) allChildRows.push(leaf);
        } else {
          // This child has its own children — it's an intermediate parent at level 1
          const subRows = buildLevel2Group(child, cat.id);
          allChildRows.push(...subRows);
        }
      }

      // Non-inputable intermediate parents at level 1
      for (const ip of intermediateParents) {
        const subRows = buildLevel2Group(ip, cat.id);
        allChildRows.push(...subRows);
      }

      if (allChildRows.length === 0) continue;

      // Collect only leaf rows for parent subtotal (avoid double-counting)
      const leafRows = allChildRows.filter((r) => !r.is_parent);
      const parent = buildSubtotal(cat, leafRows, null, 0);

      rows.push(parent);

      // Sort: "(direct)" first, then subtotals with their children, then alphabetical leaves
      allChildRows.sort((a, b) => {
        if (a.category_id === cat.id && !a.is_parent) return -1;
        if (b.category_id === cat.id && !b.is_parent) return 1;
        return a.category_name.localeCompare(b.category_name);
      });
      rows.push(...allChildRows);
    }
  }

  // Sort by type, then within same type keep parent+children groups together
  rows.sort((a, b) => {
    const typeA = TYPE_ORDER[a.category_type] ?? 9;
    const typeB = TYPE_ORDER[b.category_type] ?? 9;
    if (typeA !== typeB) return typeA - typeB;
    // Find the top-level group id
    function getGroupId(r: BudgetVsActualRow): number {
      if (r.depth === 0) return r.category_id;
      if (r.is_parent && r.parent_id === null) return r.category_id;
      // Walk up to find the root
      let pid = r.parent_id;
      while (pid !== null) {
        const pCat = catById.get(pid);
        if (!pCat || !pCat.parent_id) return pid;
        pid = pCat.parent_id;
      }
      return r.category_id;
    }
    const groupA = getGroupId(a);
    const groupB = getGroupId(b);
    if (groupA !== groupB) {
      const catA = catById.get(groupA);
      const catB = catById.get(groupB);
      const orderA = catA?.sort_order ?? 999;
      const orderB = catB?.sort_order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      return (catA?.name ?? "").localeCompare(catB?.name ?? "");
    }
    // Within same group: sort by depth, then parent before children
    if (a.is_parent !== b.is_parent && (a.depth ?? 0) === (b.depth ?? 0)) return a.is_parent ? -1 : 1;
    if ((a.depth ?? 0) !== (b.depth ?? 0)) return (a.depth ?? 0) - (b.depth ?? 0);
    if (a.parent_id && a.category_id === a.parent_id) return -1;
    if (b.parent_id && b.category_id === b.parent_id) return 1;
    return a.category_name.localeCompare(b.category_name);
  });

  return rows;
}
