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
  // Promote children to root level so they don't become orphans
  await db.execute(
    `UPDATE categories SET parent_id = NULL WHERE parent_id = $1`,
    [id]
  );
  // Only deactivate the target category itself
  await db.execute(
    `UPDATE categories SET is_active = 0 WHERE id = $1`,
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

export async function getChildrenUsageCount(parentId: number): Promise<number> {
  const db = await getDb();
  const rows = await db.select<Array<{ cnt: number }>>(
    `SELECT COUNT(*) AS cnt FROM transactions WHERE category_id IN
     (SELECT id FROM categories WHERE parent_id = $1 AND is_active = 1)`,
    [parentId]
  );
  return rows[0]?.cnt ?? 0;
}

export async function reinitializeCategories(): Promise<void> {
  const db = await getDb();
  // Clear keywords, unlink transactions, delete all categories
  await db.execute("DELETE FROM keywords");
  await db.execute("UPDATE transactions SET category_id = NULL");
  await db.execute("DELETE FROM categories");

  // Re-seed parent categories
  const parents = [
    [1, "Revenus", "income", 1],
    [2, "Dépenses récurrentes", "expense", 2],
    [3, "Dépenses ponctuelles", "expense", 3],
    [4, "Maison", "expense", 4],
    [5, "Placements", "transfer", 5],
    [6, "Autres", "expense", 6],
  ] as const;
  for (const [id, name, type, sort] of parents) {
    await db.execute(
      "INSERT INTO categories (id, name, type, sort_order) VALUES ($1, $2, $3, $4)",
      [id, name, type, sort]
    );
  }

  // Re-seed child categories
  const children: Array<[number, string, number, string, string, number]> = [
    [10, "Paie", 1, "income", "#22c55e", 1],
    [11, "Autres revenus", 1, "income", "#4ade80", 2],
    [20, "Loyer", 2, "expense", "#ef4444", 1],
    [21, "Électricité", 2, "expense", "#f59e0b", 2],
    [22, "Épicerie", 2, "expense", "#10b981", 3],
    [23, "Dons", 2, "expense", "#ec4899", 4],
    [24, "Restaurant", 2, "expense", "#f97316", 5],
    [25, "Frais bancaires", 2, "expense", "#6b7280", 6],
    [26, "Jeux, Films & Livres", 2, "expense", "#8b5cf6", 7],
    [27, "Abonnements Musique", 2, "expense", "#06b6d4", 8],
    [28, "Transport en commun", 2, "expense", "#3b82f6", 9],
    [29, "Internet & Télécom", 2, "expense", "#6366f1", 10],
    [30, "Animaux", 2, "expense", "#a855f7", 11],
    [31, "Assurances", 2, "expense", "#14b8a6", 12],
    [32, "Pharmacie", 2, "expense", "#f43f5e", 13],
    [33, "Taxes municipales", 2, "expense", "#78716c", 14],
    [40, "Voiture", 3, "expense", "#64748b", 1],
    [41, "Amazon", 3, "expense", "#f59e0b", 2],
    [42, "Électroniques", 3, "expense", "#3b82f6", 3],
    [43, "Alcool", 3, "expense", "#7c3aed", 4],
    [44, "Cadeaux", 3, "expense", "#ec4899", 5],
    [45, "Vêtements", 3, "expense", "#d946ef", 6],
    [46, "CPA", 3, "expense", "#0ea5e9", 7],
    [47, "Voyage", 3, "expense", "#f97316", 8],
    [48, "Sports & Plein air", 3, "expense", "#22c55e", 9],
    [49, "Spectacles & sorties", 3, "expense", "#e11d48", 10],
    [50, "Hypothèque", 4, "expense", "#dc2626", 1],
    [51, "Achats maison", 4, "expense", "#ea580c", 2],
    [52, "Entretien maison", 4, "expense", "#ca8a04", 3],
    [53, "Électroménagers & Meubles", 4, "expense", "#0d9488", 4],
    [54, "Outils", 4, "expense", "#b45309", 5],
    [60, "Placements", 5, "transfer", "#2563eb", 1],
    [61, "Transferts", 5, "transfer", "#7c3aed", 2],
    [70, "Impôts", 6, "expense", "#dc2626", 1],
    [71, "Paiement CC", 6, "transfer", "#6b7280", 2],
    [72, "Retrait cash", 6, "expense", "#57534e", 3],
    [73, "Projets", 6, "expense", "#0ea5e9", 4],
  ];
  for (const [id, name, parentId, type, color, sort] of children) {
    await db.execute(
      "INSERT INTO categories (id, name, parent_id, type, color, sort_order) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, name, parentId, type, color, sort]
    );
  }

  // Re-seed keywords
  const keywords: Array<[string, number]> = [
    ["PAY/PAY", 10],
    ["HYDRO-QUEBEC", 21],
    ["METRO", 22], ["IGA", 22], ["MAXI", 22], ["SUPER C", 22],
    ["BOUCHERIE LAFLECHE", 22], ["BOULANGERIE JARRY", 22], ["DOLLARAMA", 22], ["WALMART", 22],
    ["OXFAM", 23], ["CENTRAIDE", 23], ["FPA", 23],
    ["SUBWAY", 24], ["MCDONALD", 24], ["A&W", 24], ["DD/DOORDASH", 24],
    ["DOORDASH", 24], ["SUSHI", 24], ["DOMINOS", 24], ["BELLE PROVINCE", 24],
    ["PROGRAMME PERFORMANCE", 25],
    ["STEAMGAMES", 26], ["PLAYSTATION", 26], ["PRIMEVIDEO", 26], ["NINTENDO", 26],
    ["RENAUD-BRAY", 26], ["CINEMA DU PARC", 26], ["LEGO", 26],
    ["SPOTIFY", 27],
    ["STM", 28], ["GARE MONT-SAINT", 28], ["GARE SAINT-HUBERT", 28],
    ["GARE CENTRALE", 28], ["REM", 28],
    ["VIDEOTRON", 29], ["ORICOM", 29],
    ["MONDOU", 30],
    ["BELAIR", 31], ["PRYSM", 31], ["INS/ASS", 31],
    ["JEAN COUTU", 32], ["FAMILIPRIX", 32], ["PHARMAPRIX", 32],
    ["M-ST-HILAIRE TX", 33], ["CSS PATRIOT", 33],
    ["SHELL", 40], ["ESSO", 40], ["ULTRAMAR", 40], ["PETRO-CANADA", 40],
    ["SAAQ", 40], ["CREVIER", 40],
    ["AMAZON", 41], ["AMZN", 41],
    ["MICROSOFT", 42], ["ADDISON ELECTRONIQUE", 42],
    ["SAQ", 43], ["SQDC", 43],
    ["DANS UN JARDIN", 44],
    ["UNIQLO", 45], ["WINNERS", 45], ["SIMONS", 45],
    ["ORDRE DES COMPTABL", 46],
    ["NORWEGIAN CRUISE", 47], ["AEROPORTS DE MONTREAL", 47], ["HILTON", 47],
    ["BLOC SHOP", 48], ["SEPAQ", 48], ["LA CORDEE", 48],
    ["MOUNTAIN EQUIPMENT", 48], ["PHYSIOACTIF", 48], ["DECATHLON", 48],
    ["TICKETMASTER", 49], ["CLUB SODA", 49], ["LEPOINTDEVENTE", 49],
    ["MTG/HYP", 50],
    ["CANADIAN TIRE", 51], ["CANAC", 51], ["RONA", 51],
    ["IKEA", 52],
    ["TANGUAY", 53], ["BOUCLAIR", 53],
    ["BMR", 54], ["HOME DEPOT", 54], ["PRINCESS AUTO", 54],
    ["DYNAMIC FUND", 60], ["FIDELITY", 60], ["AGF", 60],
    ["WS INVESTMENTS", 61], ["PEAK INVESTMENT", 61],
    ["GOUV. QUEBEC", 70],
    ["CLAUDE.AI", 73], ["NAME-CHEAP", 73],
  ];
  for (const [kw, catId] of keywords) {
    await db.execute(
      "INSERT INTO keywords (keyword, category_id) VALUES ($1, $2)",
      [kw, catId]
    );
  }
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
