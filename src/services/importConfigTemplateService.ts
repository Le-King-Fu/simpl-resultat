import { getDb } from "./db";
import type { ImportConfigTemplate } from "../shared/types";

export async function getAllTemplates(): Promise<ImportConfigTemplate[]> {
  const db = await getDb();
  return db.select<ImportConfigTemplate[]>(
    "SELECT * FROM import_config_templates ORDER BY name"
  );
}

export async function createTemplate(
  template: Omit<ImportConfigTemplate, "id" | "created_at">
): Promise<number> {
  const db = await getDb();
  const result = await db.execute(
    `INSERT INTO import_config_templates (name, delimiter, encoding, date_format, skip_lines, has_header, column_mapping, amount_mode, sign_convention)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      template.name,
      template.delimiter,
      template.encoding,
      template.date_format,
      template.skip_lines,
      template.has_header,
      template.column_mapping,
      template.amount_mode,
      template.sign_convention,
    ]
  );
  return result.lastInsertId as number;
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM import_config_templates WHERE id = $1", [id]);
}
