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

const WORD_CHAR = /\w/;

/**
 * Build a regex pattern for a keyword with smart boundaries.
 * Uses \b when the keyword edge is a word character (a-z, 0-9, _),
 * and uses (?<=\s|^) / (?=\s|$) when the edge is a non-word character
 * (e.g., brackets, parentheses, dashes). This ensures keywords like
 * "[VIREMENT]" or "(INTERAC)" can match correctly.
 */
function buildKeywordRegex(normalizedKeyword: string): RegExp {
  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const left = WORD_CHAR.test(normalizedKeyword[0])
    ? "\\b"
    : "(?<=\\s|^)";
  const right = WORD_CHAR.test(normalizedKeyword[normalizedKeyword.length - 1])
    ? "\\b"
    : "(?=\\s|$)";
  return new RegExp(`${left}${escaped}${right}`);
}

interface CategorizationResult {
  category_id: number | null;
  supplier_id: number | null;
}

interface CompiledKeyword {
  regex: RegExp;
  category_id: number;
  supplier_id: number | null;
}

/**
 * Compile keywords into regex patterns once for reuse across multiple matches.
 */
function compileKeywords(keywords: Keyword[]): CompiledKeyword[] {
  return keywords.map((kw) => ({
    regex: buildKeywordRegex(normalizeDescription(kw.keyword)),
    category_id: kw.category_id,
    supplier_id: kw.supplier_id ?? null,
  }));
}

/**
 * Match a normalized description against compiled keywords.
 */
function matchDescription(
  normalized: string,
  compiled: CompiledKeyword[]
): CategorizationResult {
  for (const kw of compiled) {
    if (kw.regex.test(normalized)) {
      return {
        category_id: kw.category_id,
        supplier_id: kw.supplier_id,
      };
    }
  }
  return { category_id: null, supplier_id: null };
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

  const compiled = compileKeywords(keywords);
  const normalized = normalizeDescription(description);
  return matchDescription(normalized, compiled);
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

  const compiled = compileKeywords(keywords);

  return descriptions.map((desc) => {
    const normalized = normalizeDescription(desc);
    return matchDescription(normalized, compiled);
  });
}
