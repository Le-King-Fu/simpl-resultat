export interface ImportSource {
  id: number;
  name: string;
  description?: string;
  date_format: string;
  delimiter: string;
  encoding: string;
  column_mapping: string;
  skip_lines: number;
  has_header: boolean;
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

export interface ImportedFileWithSource extends ImportedFile {
  source_name: string;
}

export interface Category {
  id: number;
  name: string;
  parent_id?: number;
  color?: string;
  icon?: string;
  type: "expense" | "income" | "transfer";
  is_active: boolean;
  is_inputable: boolean;
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

export interface BudgetRow {
  category_id: number;
  category_name: string;
  category_color: string;
  category_type: "expense" | "income" | "transfer";
  planned: number;
  actual: number;
  difference: number;
  notes?: string;
}

export interface BudgetYearRow {
  category_id: number;
  category_name: string;
  category_color: string;
  category_type: "expense" | "income" | "transfer";
  parent_id: number | null;
  is_parent: boolean;
  months: number[]; // index 0-11 = Jan-Dec planned amounts
  annual: number;   // computed sum
}

export interface ImportConfigTemplate {
  id: number;
  name: string;
  delimiter: string;
  encoding: string;
  date_format: string;
  skip_lines: number;
  has_header: number;
  column_mapping: string;
  amount_mode: AmountMode;
  sign_convention: SignConvention;
  created_at: string;
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
  sourceFilename?: string;
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

// --- Dashboard Types ---

export type DashboardPeriod = "month" | "3months" | "6months" | "12months" | "all";

export interface DashboardSummary {
  totalCount: number;
  totalAmount: number;
  incomeTotal: number;
  expenseTotal: number;
}

export interface CategoryBreakdownItem {
  category_id: number | null;
  category_name: string;
  category_color: string;
  total: number;
}

export interface RecentTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_name: string | null;
  category_color: string | null;
}

// --- Report Types ---

export type ReportTab = "trends" | "byCategory" | "overTime" | "budgetVsActual";

export interface MonthlyTrendItem {
  month: string;       // "2025-01"
  income: number;
  expenses: number;
}

export interface CategoryOverTimeItem {
  month: string;
  [categoryName: string]: number | string;
}

export interface CategoryOverTimeData {
  categories: string[];
  data: CategoryOverTimeItem[];
  colors: Record<string, string>;
  categoryIds: Record<string, number | null>;
}

export interface BudgetVsActualRow {
  category_id: number;
  category_name: string;
  category_color: string;
  category_type: "expense" | "income" | "transfer";
  parent_id: number | null;
  is_parent: boolean;
  monthActual: number;
  monthBudget: number;
  monthVariation: number;
  monthVariationPct: number | null;
  ytdActual: number;
  ytdBudget: number;
  ytdVariation: number;
  ytdVariationPct: number | null;
}

export type ImportWizardStep =
  | "source-list"
  | "source-config"
  | "file-preview"
  | "duplicate-check"
  | "confirm"
  | "importing"
  | "report";

// --- Category Page Types ---

export interface CategoryTreeNode {
  id: number;
  name: string;
  parent_id: number | null;
  color: string | null;
  icon: string | null;
  type: "expense" | "income" | "transfer";
  is_active: boolean;
  is_inputable: boolean;
  sort_order: number;
  keyword_count: number;
  children: CategoryTreeNode[];
}

export interface CategoryFormData {
  name: string;
  type: "expense" | "income" | "transfer";
  color: string;
  parent_id: number | null;
  is_inputable: boolean;
  sort_order: number;
}

// --- Transaction Page Types ---

export interface TransactionRow {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  source_name: string | null;
  notes: string | null;
  is_manually_categorized: boolean;
  is_split: boolean;
}

export interface SplitChild {
  id: number;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  amount: number;
  description: string;
}

export interface TransactionFilters {
  search: string;
  categoryId: number | null;
  sourceId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  uncategorizedOnly: boolean;
}

export interface TransactionSort {
  column: "date" | "description" | "amount" | "category_name";
  direction: "asc" | "desc";
}

export interface TransactionPageResult {
  rows: TransactionRow[];
  totalCount: number;
  totalAmount: number;
  incomeTotal: number;
  expenseTotal: number;
}
