import { getDb } from "./db";
import Papa from "papaparse";
import type { Category, Supplier, Keyword } from "../shared/types";

// --- Export types ---

export type ExportMode =
  | "transactions_with_categories"
  | "transactions_only"
  | "categories_only";

export type ExportFormat = "json" | "csv";

export interface ExportEnvelope {
  export_type: ExportMode;
  app_version: string;
  exported_at: string;
  data: {
    categories?: Category[];
    suppliers?: Supplier[];
    keywords?: Keyword[];
    transactions?: ExportTransaction[];
  };
}

export interface ExportTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id: number | null;
  category_name: string | null;
  original_description: string | null;
  notes: string | null;
  is_manually_categorized: number;
  is_split: number;
  parent_transaction_id: number | null;
}

// --- Import types ---

export interface ImportSummary {
  type: ExportMode;
  categoriesCount: number;
  suppliersCount: number;
  keywordsCount: number;
  transactionsCount: number;
}

// --- Data gathering ---

export async function getExportCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.select<Category[]>("SELECT * FROM categories ORDER BY id");
}

export async function getExportSuppliers(): Promise<Supplier[]> {
  const db = await getDb();
  return db.select<Supplier[]>("SELECT * FROM suppliers ORDER BY id");
}

export async function getExportKeywords(): Promise<Keyword[]> {
  const db = await getDb();
  return db.select<Keyword[]>("SELECT * FROM keywords ORDER BY id");
}

export async function getExportTransactions(): Promise<ExportTransaction[]> {
  const db = await getDb();
  return db.select<ExportTransaction[]>(
    `SELECT t.id, t.date, t.description, t.amount, t.category_id,
            c.name AS category_name, t.original_description, t.notes,
            t.is_manually_categorized, t.is_split, t.parent_transaction_id
     FROM transactions t
     LEFT JOIN categories c ON t.category_id = c.id
     ORDER BY t.date, t.id`
  );
}

// --- Serialization ---

export function serializeToJson(
  exportType: ExportMode,
  data: ExportEnvelope["data"],
  appVersion: string
): string {
  const envelope: ExportEnvelope = {
    export_type: exportType,
    app_version: appVersion,
    exported_at: new Date().toISOString(),
    data,
  };
  return JSON.stringify(envelope, null, 2);
}

export function serializeTransactionsToCsv(
  transactions: ExportTransaction[]
): string {
  return Papa.unparse(
    transactions.map((t) => ({
      date: t.date,
      description: t.description,
      amount: t.amount,
      category_name: t.category_name ?? "",
      category_id: t.category_id ?? "",
      original_description: t.original_description ?? "",
      notes: t.notes ?? "",
      is_manually_categorized: t.is_manually_categorized,
      is_split: t.is_split,
      parent_transaction_id: t.parent_transaction_id ?? "",
    }))
  );
}

// --- Import parsing ---

export function parseImportedJson(content: string): {
  envelope: ExportEnvelope;
  summary: ImportSummary;
} {
  let envelope: ExportEnvelope;
  try {
    envelope = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON file");
  }

  if (
    !envelope.export_type ||
    !envelope.data ||
    typeof envelope.data !== "object"
  ) {
    throw new Error("Invalid export file format — missing required fields");
  }

  const validTypes: ExportMode[] = [
    "transactions_with_categories",
    "transactions_only",
    "categories_only",
  ];
  if (!validTypes.includes(envelope.export_type)) {
    throw new Error(`Unknown export type: ${envelope.export_type}`);
  }

  return {
    envelope,
    summary: {
      type: envelope.export_type,
      categoriesCount: envelope.data.categories?.length ?? 0,
      suppliersCount: envelope.data.suppliers?.length ?? 0,
      keywordsCount: envelope.data.keywords?.length ?? 0,
      transactionsCount: envelope.data.transactions?.length ?? 0,
    },
  };
}

export function parseImportedCsv(content: string): {
  transactions: ExportTransaction[];
  summary: ImportSummary;
} {
  const result = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  const transactions: ExportTransaction[] = result.data.map((row, i) => ({
    id: i,
    date: row.date ?? "",
    description: row.description ?? "",
    amount: parseFloat(row.amount) || 0,
    category_id: row.category_id ? parseInt(row.category_id) : null,
    category_name: row.category_name || null,
    original_description: row.original_description || null,
    notes: row.notes || null,
    is_manually_categorized: parseInt(row.is_manually_categorized) || 0,
    is_split: parseInt(row.is_split) || 0,
    parent_transaction_id: row.parent_transaction_id
      ? parseInt(row.parent_transaction_id)
      : null,
  }));

  return {
    transactions,
    summary: {
      type: "transactions_only",
      categoriesCount: 0,
      suppliersCount: 0,
      keywordsCount: 0,
      transactionsCount: transactions.length,
    },
  };
}

// --- Import execution ---

export async function importCategoriesOnly(data: ExportEnvelope["data"]): Promise<void> {
  const db = await getDb();

  // Wipe keywords, suppliers, categories
  await db.execute("DELETE FROM keywords");
  await db.execute("DELETE FROM suppliers");
  await db.execute("DELETE FROM categories");

  // Nullify category/supplier references on transactions
  await db.execute(
    "UPDATE transactions SET category_id = NULL, supplier_id = NULL, is_manually_categorized = 0"
  );

  // Re-insert categories
  if (data.categories) {
    for (const cat of data.categories) {
      await db.execute(
        `INSERT INTO categories (id, name, parent_id, color, icon, type, is_active, is_inputable, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          cat.id,
          cat.name,
          cat.parent_id ?? null,
          cat.color ?? null,
          cat.icon ?? null,
          cat.type,
          cat.is_active ? 1 : 0,
          cat.is_inputable ? 1 : 0,
          cat.sort_order,
        ]
      );
    }
  }

  // Re-insert suppliers
  if (data.suppliers) {
    for (const sup of data.suppliers) {
      await db.execute(
        `INSERT INTO suppliers (id, name, normalized_name, category_id, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [sup.id, sup.name, sup.normalized_name, sup.category_id ?? null, sup.is_active ? 1 : 0]
      );
    }
  }

  // Re-insert keywords
  if (data.keywords) {
    for (const kw of data.keywords) {
      await db.execute(
        `INSERT INTO keywords (id, keyword, category_id, supplier_id, priority, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [kw.id, kw.keyword, kw.category_id, kw.supplier_id ?? null, kw.priority, kw.is_active ? 1 : 0]
      );
    }
  }
}

export async function importTransactionsWithCategories(
  data: ExportEnvelope["data"]
): Promise<void> {
  const db = await getDb();

  // Wipe everything
  await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM imported_files");
  await db.execute("DELETE FROM keywords");
  await db.execute("DELETE FROM suppliers");
  await db.execute("DELETE FROM categories");

  // Re-insert categories
  if (data.categories) {
    for (const cat of data.categories) {
      await db.execute(
        `INSERT INTO categories (id, name, parent_id, color, icon, type, is_active, is_inputable, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          cat.id,
          cat.name,
          cat.parent_id ?? null,
          cat.color ?? null,
          cat.icon ?? null,
          cat.type,
          cat.is_active ? 1 : 0,
          cat.is_inputable ? 1 : 0,
          cat.sort_order,
        ]
      );
    }
  }

  // Re-insert suppliers
  if (data.suppliers) {
    for (const sup of data.suppliers) {
      await db.execute(
        `INSERT INTO suppliers (id, name, normalized_name, category_id, is_active)
         VALUES ($1, $2, $3, $4, $5)`,
        [sup.id, sup.name, sup.normalized_name, sup.category_id ?? null, sup.is_active ? 1 : 0]
      );
    }
  }

  // Re-insert keywords
  if (data.keywords) {
    for (const kw of data.keywords) {
      await db.execute(
        `INSERT INTO keywords (id, keyword, category_id, supplier_id, priority, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [kw.id, kw.keyword, kw.category_id, kw.supplier_id ?? null, kw.priority, kw.is_active ? 1 : 0]
      );
    }
  }

  // Re-insert transactions
  if (data.transactions) {
    for (const tx of data.transactions) {
      await db.execute(
        `INSERT INTO transactions (date, description, amount, category_id, original_description, notes, is_manually_categorized, is_split, parent_transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tx.date,
          tx.description,
          tx.amount,
          tx.category_id,
          tx.original_description,
          tx.notes,
          tx.is_manually_categorized,
          tx.is_split,
          tx.parent_transaction_id,
        ]
      );
    }
  }
}

export async function importTransactionsOnly(
  data: ExportEnvelope["data"]
): Promise<void> {
  const db = await getDb();

  // Wipe transactions and import history
  await db.execute("DELETE FROM transactions");
  await db.execute("DELETE FROM imported_files");

  // Re-insert transactions
  if (data.transactions) {
    for (const tx of data.transactions) {
      await db.execute(
        `INSERT INTO transactions (date, description, amount, category_id, original_description, notes, is_manually_categorized, is_split, parent_transaction_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          tx.date,
          tx.description,
          tx.amount,
          tx.category_id,
          tx.original_description,
          tx.notes,
          tx.is_manually_categorized,
          tx.is_split,
          tx.parent_transaction_id,
        ]
      );
    }
  }
}
