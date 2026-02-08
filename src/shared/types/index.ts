export interface ImportSource {
  id: number;
  name: string;
  description?: string;
  date_format: string;
  delimiter: string;
  encoding: string;
  column_mapping: string;
  skip_lines: number;
  created_at: string;
  updated_at: string;
}

export interface ImportedFile {
  id: number;
  source_id: number;
  filename: string;
  file_hash: string;
  import_date: string;
  row_count: number;
  status: "completed" | "partial" | "error";
  notes?: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  color?: string;
  icon?: string;
  type: "expense" | "income" | "transfer";
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  normalized_name: string;
  category_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Keyword {
  id: number;
  keyword: string;
  category_id: number;
  supplier_id?: number;
  priority: number;
  is_active: boolean;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id?: number;
  supplier_id?: number;
  source_id?: number;
  file_id?: number;
  original_description?: string;
  notes?: string;
  is_manually_categorized: boolean;
  is_split: boolean;
  parent_transaction_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Adjustment {
  id: number;
  name: string;
  description?: string;
  date: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  created_at: string;
  updated_at: string;
}

export interface AdjustmentEntry {
  id: number;
  adjustment_id: number;
  category_id: number;
  amount: number;
  description?: string;
}

export interface BudgetEntry {
  id: number;
  category_id: number;
  year: number;
  month: number;
  amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetTemplate {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

export interface BudgetTemplateEntry {
  id: number;
  template_id: number;
  category_id: number;
  amount: number;
}

export interface UserPreference {
  key: string;
  value: string;
  updated_at: string;
}

export interface NavItem {
  key: string;
  path: string;
  icon: string;
  labelKey: string;
}

// --- Import Wizard Types ---

export interface ScannedFile {
  filename: string;
  file_path: string;
  size_bytes: number;
  modified_at: string;
}

export interface ScannedSource {
  folder_name: string;
  folder_path: string;
  files: ScannedFile[];
}

export interface ColumnMapping {
  date: number;
  description: number;
  amount?: number;
  debitAmount?: number;
  creditAmount?: number;
}

export type AmountMode = "single" | "debit_credit";
export type SignConvention = "negative_expense" | "positive_expense";

export interface SourceConfig {
  name: string;
  delimiter: string;
  encoding: string;
  dateFormat: string;
  skipLines: number;
  columnMapping: ColumnMapping;
  amountMode: AmountMode;
  signConvention: SignConvention;
  hasHeader: boolean;
}

export interface ParsedRow {
  rowIndex: number;
  raw: string[];
  parsed: {
    date: string;
    description: string;
    amount: number;
  } | null;
  error?: string;
}

export interface DuplicateRow {
  rowIndex: number;
  date: string;
  description: string;
  amount: number;
  existingTransactionId: number;
}

export interface DuplicateCheckResult {
  fileAlreadyImported: boolean;
  existingFileId?: number;
  duplicateRows: DuplicateRow[];
  newRows: ParsedRow[];
}

export interface ImportReport {
  totalRows: number;
  importedCount: number;
  skippedDuplicates: number;
  errorCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  errors: Array<{ rowIndex: number; message: string }>;
}

export type ImportWizardStep =
  | "source-list"
  | "source-config"
  | "file-preview"
  | "duplicate-check"
  | "confirm"
  | "importing"
  | "report";
