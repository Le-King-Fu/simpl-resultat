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

export async function updateTemplate(
  id: number,
  template: Omit<ImportConfigTemplate, "id" | "created_at">
): Promise<void> {
  const db = await getDb();
  await db.execute(
    `UPDATE import_config_templates
     SET name=$1, delimiter=$2, encoding=$3, date_format=$4, skip_lines=$5,
         has_header=$6, column_mapping=$7, amount_mode=$8, sign_convention=$9
     WHERE id=$10`,
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
      id,
    ]
  );
}

export async function deleteTemplate(id: number): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM import_config_templates WHERE id = $1", [id]);
}
