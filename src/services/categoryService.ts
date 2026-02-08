import { getDb } from "./db";
import type { Keyword } from "../shared/types";

interface CategoryRow {
  id: number;
  name: string;
  parent_id: number | null;
  color: string | null;
  icon: string | null;
  type: "expense" | "income" | "transfer";
  is_active: boolean;
  sort_order: number;
  keyword_count: number;
}

export async function getAllCategoriesWithCounts(): Promise<CategoryRow[]> {
  const db = await getDb();
  return db.select<CategoryRow[]>(
    `SELECT c.*, COUNT(k.id) AS keyword_count
     FROM categories c
     LEFT JOIN keywords k ON k.category_id = c.id AND k.is_active = 1
     WHERE c.is_active = 1
     GROUP BY c.id
     ORDER BY c.sort_order, c.name`
  );
}

export async function createCategory(data: {
  name: string;
  type: string;
  color: string;
  parent_id: number | null;
  sort_order: number;
}): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO categories (name, type, color, parent_id, sort_order) VALUES ($1, $2, $3, $4, $5)`,
    [data.name, data.type, data.color, data.parent_id, data.sort_order]
  );
  return result.lastInsertId as number;
}

export async function updateCategory(
  id: number,
  data: {
    name: string;
    type: string;
    color: string;
    parent_id: number | null;
    sort_order: number;
  }
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE categories SET name = $1, type = $2, color = $3, parent_id = $4, sort_order = $5 WHERE id = $6`,
    [data.name, data.type, data.color, data.parent_id, data.sort_order, id]
  );
}

export async function deactivateCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE categories SET is_active = 0 WHERE id = $1 OR parent_id = $1`,
    [id]
  );
}

export async function getCategoryUsageCount(id: number): Promise<number> {
  const db = await getDb();
  const rows = await db.select<Array<{ cnt: number }>>(
    `SELECT COUNT(*) AS cnt FROM transactions WHERE category_id = $1`,
    [id]
  );
  return rows[0]?.cnt ?? 0;
}

export async function getKeywordsByCategoryId(
  categoryId: number
): Promise<Keyword[]> {
  const db = await getDb();
  return db.select<Keyword[]>(
    `SELECT * FROM keywords WHERE category_id = $1 AND is_active = 1 ORDER BY priority DESC, keyword`,
    [categoryId]
  );
}

export async function createKeyword(
  categoryId: number,
  keyword: string,
  priority: number
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO keywords (keyword, category_id, priority) VALUES ($1, $2, $3)`,
    [keyword, categoryId, priority]
  );
  return result.lastInsertId as number;
}

export async function updateKeyword(
  id: number,
  keyword: string,
  priority: number
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE keywords SET keyword = $1, priority = $2 WHERE id = $3`,
    [keyword, priority, id]
  );
}

export async function deactivateKeyword(id: number): Promise<void> {
  const db = await getDb();
  await db.execute(`UPDATE keywords SET is_active = 0 WHERE id = $1`, [id]);
}
