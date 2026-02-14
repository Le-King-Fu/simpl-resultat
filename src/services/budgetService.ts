import { getDb } from "./db";
import type {
  Category,
  BudgetEntry,
  BudgetTemplate,
  BudgetTemplateEntry,
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
