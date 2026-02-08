import { getDb } from "./db";
import type { Keyword } from "../shared/types";

/**
 * Normalize a description for keyword matching:
 * - lowercase
 * - strip accents via NFD decomposition
 * - collapse whitespace
 */
function normalizeDescription(desc: string): string {
  return desc
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

interface CategorizationResult {
  category_id: number | null;
  supplier_id: number | null;
}

/**
 * Auto-categorize a single transaction description.
 * Returns matching category_id and supplier_id, or nulls if no match.
 */
export async function categorizeDescription(
  description: string
): Promise<CategorizationResult> {
  const db = await getDb();
  const keywords = await db.select<Keyword[]>(
    "SELECT * FROM keywords WHERE is_active = 1 ORDER BY priority DESC"
  );

  const normalized = normalizeDescription(description);

  for (const kw of keywords) {
    const normalizedKeyword = normalizeDescription(kw.keyword);
    if (normalized.includes(normalizedKeyword)) {
      return {
        category_id: kw.category_id,
        supplier_id: kw.supplier_id ?? null,
      };
    }
  }

  return { category_id: null, supplier_id: null };
}

/**
 * Auto-categorize a batch of transactions (by their descriptions).
 * Returns an array of results in the same order.
 */
export async function categorizeBatch(
  descriptions: string[]
): Promise<CategorizationResult[]> {
  const db = await getDb();
  const keywords = await db.select<Keyword[]>(
    "SELECT * FROM keywords WHERE is_active = 1 ORDER BY priority DESC"
  );

  return descriptions.map((desc) => {
    const normalized = normalizeDescription(desc);
    for (const kw of keywords) {
      const normalizedKeyword = normalizeDescription(kw.keyword);
      if (normalized.includes(normalizedKeyword)) {
        return {
          category_id: kw.category_id,
          supplier_id: kw.supplier_id ?? null,
        };
      }
    }
    return { category_id: null, supplier_id: null };
  });
}
