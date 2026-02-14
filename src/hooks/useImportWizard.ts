import { useReducer, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Papa from "papaparse";
import type {
  ImportWizardStep,
  ScannedSource,
  ScannedFile,
  SourceConfig,
  ParsedRow,
  DuplicateCheckResult,
  ImportReport,
  ImportSource,
  ImportConfigTemplate,
  ColumnMapping,
} from "../shared/types";
import {
  getImportFolder,
  setImportFolder,
} from "../services/userPreferenceService";
import {
  getAllSources,
  getSourceByName,
  createSource,
  updateSource,
} from "../services/importSourceService";
import {
  existsByHash,
  createImportedFile,
  updateFileStatus,
  getFilesBySourceId,
} from "../services/importedFileService";
import {
  insertBatch,
  findDuplicates,
} from "../services/transactionService";
import { categorizeBatch } from "../services/categorizationService";
import {
  getAllTemplates,
  createTemplate,
  deleteTemplate as deleteTemplateService,
} from "../services/importConfigTemplateService";
import { parseDate } from "../utils/dateParser";
import { parseFrenchAmount } from "../utils/amountParser";
import {
  preprocessQuotedCSV,
  autoDetectConfig as runAutoDetect,
} from "../utils/csvAutoDetect";

interface WizardState {
  step: ImportWizardStep;
  importFolder: string | null;
  scannedSources: ScannedSource[];
  selectedSource: ScannedSource | null;
  selectedFiles: ScannedFile[];
  sourceConfig: SourceConfig;
  existingSource: ImportSource | null;
  parsedPreview: ParsedRow[];
  previewHeaders: string[];
  duplicateResult: DuplicateCheckResult | null;
  excludedDuplicateIndices: Set<number>;
  importReport: ImportReport | null;
  importProgress: { current: number; total: number; file: string };
  isLoading: boolean;
  error: string | null;
  configuredSourceNames: Set<string>;
  importedFilesBySource: Map<string, Set<string>>;
  configTemplates: ImportConfigTemplate[];
}

type WizardAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_STEP"; payload: ImportWizardStep }
  | { type: "SET_IMPORT_FOLDER"; payload: string | null }
  | { type: "SET_SCANNED_SOURCES"; payload: ScannedSource[] }
  | { type: "SET_SELECTED_SOURCE"; payload: ScannedSource }
  | { type: "SET_SELECTED_FILES"; payload: ScannedFile[] }
  | { type: "SET_SOURCE_CONFIG"; payload: SourceConfig }
  | { type: "SET_EXISTING_SOURCE"; payload: ImportSource | null }
  | { type: "SET_PARSED_PREVIEW"; payload: { rows: ParsedRow[]; headers: string[] } }
  | { type: "SET_DUPLICATE_RESULT"; payload: DuplicateCheckResult }
  | { type: "TOGGLE_DUPLICATE_ROW"; payload: number }
  | { type: "SET_SKIP_ALL_DUPLICATES"; payload: boolean }
  | { type: "SET_IMPORT_REPORT"; payload: ImportReport }
  | { type: "SET_IMPORT_PROGRESS"; payload: { current: number; total: number; file: string } }
  | { type: "SET_CONFIGURED_SOURCES"; payload: { names: Set<string>; files: Map<string, Set<string>> } }
  | { type: "SET_CONFIG_TEMPLATES"; payload: ImportConfigTemplate[] }
  | { type: "RESET" };

const defaultConfig: SourceConfig = {
  name: "",
  delimiter: ";",
  encoding: "utf-8",
  dateFormat: "DD/MM/YYYY",
  skipLines: 0,
  columnMapping: { date: 0, description: 1, amount: 2 },
  amountMode: "single",
  signConvention: "negative_expense",
  hasHeader: true,
};

const initialState: WizardState = {
  step: "source-list",
  importFolder: null,
  scannedSources: [],
  selectedSource: null,
  selectedFiles: [],
  sourceConfig: { ...defaultConfig },
  existingSource: null,
  parsedPreview: [],
  previewHeaders: [],
  duplicateResult: null,
  excludedDuplicateIndices: new Set(),
  importReport: null,
  importProgress: { current: 0, total: 0, file: "" },
  isLoading: false,
  error: null,
  configuredSourceNames: new Set(),
  importedFilesBySource: new Map(),
  configTemplates: [],
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_STEP":
      return { ...state, step: action.payload };
    case "SET_IMPORT_FOLDER":
      return { ...state, importFolder: action.payload };
    case "SET_SCANNED_SOURCES":
      return { ...state, scannedSources: action.payload, isLoading: false };
    case "SET_SELECTED_SOURCE":
      return { ...state, selectedSource: action.payload };
    case "SET_SELECTED_FILES":
      return { ...state, selectedFiles: action.payload };
    case "SET_SOURCE_CONFIG":
      return { ...state, sourceConfig: action.payload };
    case "SET_EXISTING_SOURCE":
      return { ...state, existingSource: action.payload };
    case "SET_PARSED_PREVIEW":
      return {
        ...state,
        parsedPreview: action.payload.rows,
        previewHeaders: action.payload.headers,
        isLoading: false,
      };
    case "SET_DUPLICATE_RESULT":
      return {
        ...state,
        duplicateResult: action.payload,
        excludedDuplicateIndices: new Set(action.payload.duplicateRows.map((d) => d.rowIndex)),
        isLoading: false,
      };
    case "TOGGLE_DUPLICATE_ROW": {
      const next = new Set(state.excludedDuplicateIndices);
      if (next.has(action.payload)) {
        next.delete(action.payload);
      } else {
        next.add(action.payload);
      }
      return { ...state, excludedDuplicateIndices: next };
    }
    case "SET_SKIP_ALL_DUPLICATES":
      return {
        ...state,
        excludedDuplicateIndices: action.payload
          ? new Set(state.duplicateResult?.duplicateRows.map((d) => d.rowIndex) ?? [])
          : new Set(),
      };
    case "SET_IMPORT_REPORT":
      return { ...state, importReport: action.payload, isLoading: false };
    case "SET_IMPORT_PROGRESS":
      return { ...state, importProgress: action.payload };
    case "SET_CONFIGURED_SOURCES":
      return {
        ...state,
        configuredSourceNames: action.payload.names,
        importedFilesBySource: action.payload.files,
      };
    case "SET_CONFIG_TEMPLATES":
      return { ...state, configTemplates: action.payload };
    case "RESET":
      return {
        ...initialState,
        importFolder: state.importFolder,
        scannedSources: state.scannedSources,
        configuredSourceNames: state.configuredSourceNames,
        importedFilesBySource: state.importedFilesBySource,
        configTemplates: state.configTemplates,
      };
    default:
      return state;
  }
}

export function useImportWizard() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load import folder on mount
  useEffect(() => {
    (async () => {
      try {
        const folder = await getImportFolder();
        dispatch({ type: "SET_IMPORT_FOLDER", payload: folder });
        if (folder) {
          await scanFolderInternal(folder);
        }
      } catch {
        // No folder configured yet
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadConfiguredSources = useCallback(async () => {
    const sources = await getAllSources();
    const names = new Set(sources.map((s) => s.name));
    const files = new Map<string, Set<string>>();

    for (const source of sources) {
      const imported = await getFilesBySourceId(source.id);
      files.set(
        source.name,
        new Set(imported.map((f) => f.filename))
      );
    }

    dispatch({ type: "SET_CONFIGURED_SOURCES", payload: { names, files } });

    const templates = await getAllTemplates();
    dispatch({ type: "SET_CONFIG_TEMPLATES", payload: templates });
  }, []);

  const scanFolderInternal = useCallback(
    async (folder: string) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const sources = await invoke<ScannedSource[]>("scan_import_folder", {
          folderPath: folder,
        });
        dispatch({ type: "SET_SCANNED_SOURCES", payload: sources });
        await loadConfiguredSources();
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [loadConfiguredSources]
  );

  const browseFolder = useCallback(async () => {
    try {
      const folder = await invoke<string | null>("pick_folder");
      if (folder) {
        await setImportFolder(folder);
        dispatch({ type: "SET_IMPORT_FOLDER", payload: folder });
        await scanFolderInternal(folder);
      }
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, [scanFolderInternal]);

  const refreshFolder = useCallback(async () => {
    if (state.importFolder) {
      await scanFolderInternal(state.importFolder);
    }
  }, [state.importFolder, scanFolderInternal]);

  const selectSource = useCallback(
    async (source: ScannedSource) => {
      // Sort files: new files first, then already-imported
      const importedNames = state.importedFilesBySource.get(source.folder_name);
      const sorted = [...source.files].sort((a, b) => {
        const aImported = importedNames?.has(a.filename) ?? false;
        const bImported = importedNames?.has(b.filename) ?? false;
        if (aImported !== bImported) return aImported ? 1 : -1;
        return a.filename.localeCompare(b.filename);
      });
      const sortedSource = { ...source, files: sorted };

      // Pre-select only new files
      const newFiles = sorted.filter((f) => !importedNames?.has(f.filename));

      dispatch({ type: "SET_SELECTED_SOURCE", payload: sortedSource });
      dispatch({ type: "SET_SELECTED_FILES", payload: newFiles });

      // Check if this source already has config in DB
      const existing = await getSourceByName(source.folder_name);
      dispatch({ type: "SET_EXISTING_SOURCE", payload: existing });

      let activeDelimiter = defaultConfig.delimiter;
      let activeEncoding = "utf-8";
      let activeSkipLines = 0;
      let activeHasHeader = true;

      if (existing) {
        // Restore config from DB
        const mapping = JSON.parse(existing.column_mapping) as ColumnMapping;
        const config: SourceConfig = {
          name: existing.name,
          delimiter: existing.delimiter,
          encoding: existing.encoding,
          dateFormat: existing.date_format,
          skipLines: existing.skip_lines,
          columnMapping: mapping,
          amountMode:
            mapping.debitAmount !== undefined ? "debit_credit" : "single",
          signConvention: "negative_expense",
          hasHeader: !!existing.has_header,
        };
        dispatch({ type: "SET_SOURCE_CONFIG", payload: config });
        activeDelimiter = existing.delimiter;
        activeEncoding = existing.encoding;
        activeSkipLines = existing.skip_lines;
        activeHasHeader = !!existing.has_header;
      } else {
        // Auto-detect encoding for first file
        if (source.files.length > 0) {
          try {
            activeEncoding = await invoke<string>("detect_encoding", {
              filePath: source.files[0].file_path,
            });
          } catch {
            // fallback to utf-8
          }
        }

        dispatch({
          type: "SET_SOURCE_CONFIG",
          payload: {
            ...defaultConfig,
            name: source.folder_name,
            encoding: activeEncoding,
          },
        });
      }

      // Load preview headers from first file
      if (source.files.length > 0) {
        await loadHeadersWithConfig(
          source.files[0].file_path,
          activeDelimiter,
          activeEncoding,
          activeSkipLines,
          activeHasHeader
        );
      }

      dispatch({ type: "SET_STEP", payload: "source-config" });
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const loadHeadersWithConfig = useCallback(
    async (filePath: string, delimiter: string, encoding: string, skipLines: number, hasHeader: boolean) => {
      try {
        const preview = await invoke<string>("get_file_preview", {
          filePath,
          encoding,
          maxLines: skipLines + 5,
        });
        const preprocessed = preprocessQuotedCSV(preview);
        const parsed = Papa.parse(preprocessed, { delimiter, skipEmptyLines: true });
        const data = parsed.data as string[][];
        const headerRow = hasHeader && data.length > skipLines ? skipLines : -1;
        if (headerRow >= 0 && data[headerRow]) {
          dispatch({
            type: "SET_PARSED_PREVIEW",
            payload: {
              rows: [],
              headers: data[headerRow].map((h) => h.trim()),
            },
          });
        } else if (data.length > 0) {
          // No header row — generate column indices as headers
          const firstDataRow = data[skipLines] || data[0];
          dispatch({
            type: "SET_PARSED_PREVIEW",
            payload: {
              rows: [],
              headers: firstDataRow.map((_, i) => `Col ${i}`),
            },
          });
        }
      } catch {
        // ignore preview errors
      }
    },
    []
  );

  const updateConfig = useCallback(
    (config: SourceConfig) => {
      dispatch({ type: "SET_SOURCE_CONFIG", payload: config });

      // Reload headers when delimiter, encoding, skipLines, or hasHeader changes
      if (state.selectedFiles.length > 0) {
        loadHeadersWithConfig(
          state.selectedFiles[0].file_path,
          config.delimiter,
          config.encoding,
          config.skipLines,
          config.hasHeader
        );
      }
    },
    [state.selectedFiles, loadHeadersWithConfig]
  );

  const toggleFile = useCallback(
    (file: ScannedFile) => {
      const exists = state.selectedFiles.some(
        (f) => f.file_path === file.file_path
      );
      if (exists) {
        dispatch({
          type: "SET_SELECTED_FILES",
          payload: state.selectedFiles.filter(
            (f) => f.file_path !== file.file_path
          ),
        });
      } else {
        dispatch({
          type: "SET_SELECTED_FILES",
          payload: [...state.selectedFiles, file],
        });
      }
    },
    [state.selectedFiles]
  );

  const selectAllFiles = useCallback(() => {
    if (state.selectedSource) {
      dispatch({
        type: "SET_SELECTED_FILES",
        payload: state.selectedSource.files,
      });
    }
  }, [state.selectedSource]);

  // Internal helper: parses selected files and returns rows + headers
  const parseFilesInternal = useCallback(async (): Promise<{ rows: ParsedRow[]; headers: string[] }> => {
    const config = state.sourceConfig;
    const allRows: ParsedRow[] = [];
    let headers: string[] = [];

    for (const file of state.selectedFiles) {
      const content = await invoke<string>("read_file_content", {
        filePath: file.file_path,
        encoding: config.encoding,
      });

      const preprocessed = preprocessQuotedCSV(content);

      const parsed = Papa.parse(preprocessed, {
        delimiter: config.delimiter,
        skipEmptyLines: true,
      });

      const data = parsed.data as string[][];
      const startIdx = config.skipLines + (config.hasHeader ? 1 : 0);

      if (config.hasHeader && data.length > config.skipLines) {
        headers = data[config.skipLines].map((h) => h.trim());
      } else if (!config.hasHeader && headers.length === 0 && data.length > config.skipLines) {
        const firstDataRow = data[config.skipLines];
        headers = firstDataRow.map((_, i) => `Col ${i}`);
      }

      for (let i = startIdx; i < data.length; i++) {
        const raw = data[i];
        if (raw.length <= 1 && raw[0]?.trim() === "") continue;

        try {
          const date = parseDate(
            raw[config.columnMapping.date]?.trim() || "",
            config.dateFormat
          );
          const description =
            raw[config.columnMapping.description]?.trim() || "";

          let amount: number;
          if (config.amountMode === "debit_credit") {
            const debit = parseFrenchAmount(
              raw[config.columnMapping.debitAmount ?? 0] || ""
            );
            const credit = parseFrenchAmount(
              raw[config.columnMapping.creditAmount ?? 0] || ""
            );
            amount = isNaN(credit) ? -(isNaN(debit) ? 0 : debit) : credit;
          } else {
            amount = parseFrenchAmount(
              raw[config.columnMapping.amount ?? 0] || ""
            );
            if (config.signConvention === "positive_expense" && !isNaN(amount)) {
              amount = -amount;
            }
          }

          if (!date) {
            allRows.push({
              rowIndex: allRows.length,
              raw,
              parsed: null,
              error: "Invalid date",
            });
          } else if (isNaN(amount)) {
            allRows.push({
              rowIndex: allRows.length,
              raw,
              parsed: null,
              error: "Invalid amount",
            });
          } else {
            allRows.push({
              rowIndex: allRows.length,
              raw,
              parsed: { date, description, amount },
            });
          }
        } catch {
          allRows.push({
            rowIndex: allRows.length,
            raw,
            parsed: null,
            error: "Parse error",
          });
        }
      }
    }

    return { rows: allRows, headers };
  }, [state.selectedFiles, state.sourceConfig]);

  // Parse files and store preview (does NOT change wizard step)
  const parsePreview = useCallback(async () => {
    if (state.selectedFiles.length === 0) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await parseFilesInternal();
      dispatch({
        type: "SET_PARSED_PREVIEW",
        payload: result,
      });
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, [state.selectedFiles, parseFilesInternal]);

  // Internal helper: runs duplicate checking against parsed rows
  const checkDuplicatesInternal = useCallback(async (parsedRows: ParsedRow[]) => {
    // Save/update source config in DB
    const config = state.sourceConfig;
    const mappingJson = JSON.stringify(config.columnMapping);

    let sourceId: number;
    if (state.existingSource) {
      sourceId = state.existingSource.id;
      await updateSource(sourceId, {
        name: config.name,
        delimiter: config.delimiter,
        encoding: config.encoding,
        date_format: config.dateFormat,
        column_mapping: mappingJson,
        skip_lines: config.skipLines,
        has_header: config.hasHeader,
      });
    } else {
      sourceId = await createSource({
        name: config.name,
        delimiter: config.delimiter,
        encoding: config.encoding,
        date_format: config.dateFormat,
        column_mapping: mappingJson,
        skip_lines: config.skipLines,
        has_header: config.hasHeader,
      });
    }

    // Check file-level duplicates
    let fileAlreadyImported = false;
    let existingFileId: number | undefined;

    if (state.selectedFiles.length > 0) {
      const hash = await invoke<string>("hash_file", {
        filePath: state.selectedFiles[0].file_path,
      });
      const existing = await existsByHash(hash);
      if (existing) {
        fileAlreadyImported = true;
        existingFileId = existing.id;
      }
    }

    // Check row-level duplicates
    const validRows = parsedRows.filter((r) => r.parsed);
    const duplicateMatches = await findDuplicates(
      validRows.map((r) => ({
        date: r.parsed!.date,
        description: r.parsed!.description,
        amount: r.parsed!.amount,
      }))
    );

    const duplicateIndices = new Set(duplicateMatches.map((d) => d.rowIndex));
    const newRows = validRows.filter(
      (_, i) => !duplicateIndices.has(i)
    );
    const duplicateRows = duplicateMatches.map((d) => ({
      rowIndex: d.rowIndex,
      date: d.date,
      description: d.description,
      amount: d.amount,
      existingTransactionId: d.existingTransactionId,
    }));

    dispatch({
      type: "SET_DUPLICATE_RESULT",
      payload: {
        fileAlreadyImported,
        existingFileId,
        duplicateRows,
        newRows,
      },
    });
    dispatch({ type: "SET_STEP", payload: "duplicate-check" });
  }, [state.sourceConfig, state.existingSource, state.selectedFiles]);

  // Check duplicates using already-parsed preview data
  const checkDuplicates = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      await checkDuplicatesInternal(state.parsedPreview);
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, [state.parsedPreview, checkDuplicatesInternal]);

  // Parse files then check duplicates in one step (skips preview step)
  const parseAndCheckDuplicates = useCallback(async () => {
    if (state.selectedFiles.length === 0) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await parseFilesInternal();
      dispatch({
        type: "SET_PARSED_PREVIEW",
        payload: result,
      });
      await checkDuplicatesInternal(result.rows);
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, [state.selectedFiles, parseFilesInternal, checkDuplicatesInternal]);

  const executeImport = useCallback(async () => {
    if (!state.duplicateResult) return;

    dispatch({ type: "SET_STEP", payload: "importing" });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const config = state.sourceConfig;

      // Get or create source ID
      const dbSource = await getSourceByName(config.name);
      if (!dbSource) throw new Error("Source not found in database");
      const sourceId = dbSource.id;

      // Determine rows to import: new rows + non-excluded duplicates
      const includedDuplicates = state.duplicateResult.duplicateRows
        .filter((d) => !state.excludedDuplicateIndices.has(d.rowIndex));
      const rowsToImport = [
        ...state.duplicateResult.newRows,
        ...state.parsedPreview.filter(
          (r) =>
            r.parsed &&
            includedDuplicates.some((d) => d.rowIndex === r.rowIndex)
        ),
      ];

      const validRows = rowsToImport.filter((r) => r.parsed);
      const totalRows = validRows.length;

      dispatch({
        type: "SET_IMPORT_PROGRESS",
        payload: { current: 0, total: totalRows, file: state.selectedFiles[0]?.filename || "" },
      });

      // Create imported file record
      let fileHash = "";
      if (state.selectedFiles.length > 0) {
        fileHash = await invoke<string>("hash_file", {
          filePath: state.selectedFiles[0].file_path,
        });
      }

      const fileId = await createImportedFile({
        source_id: sourceId,
        filename: state.selectedFiles.map((f) => f.filename).join(", "),
        file_hash: fileHash,
        row_count: totalRows,
        status: "completed",
      });

      // Auto-categorize
      const descriptions = validRows.map((r) => r.parsed!.description);
      const categorizations = await categorizeBatch(descriptions);

      let categorizedCount = 0;
      let uncategorizedCount = 0;
      const errors: Array<{ rowIndex: number; message: string }> = [];

      // Build transaction records
      const transactions = validRows.map((row, i) => {
        const cat = categorizations[i];
        if (cat.category_id) {
          categorizedCount++;
        } else {
          uncategorizedCount++;
        }
        return {
          date: row.parsed!.date,
          description: row.parsed!.description,
          amount: row.parsed!.amount,
          source_id: sourceId,
          file_id: fileId,
          original_description: row.raw.join(config.delimiter),
          category_id: cat.category_id,
          supplier_id: cat.supplier_id,
        };
      });

      // Insert with progress
      let importedCount = 0;
      try {
        importedCount = await insertBatch(transactions, (inserted) => {
          dispatch({
            type: "SET_IMPORT_PROGRESS",
            payload: { current: inserted, total: totalRows, file: state.selectedFiles[0]?.filename || "" },
          });
        });

        dispatch({
          type: "SET_IMPORT_PROGRESS",
          payload: { current: importedCount, total: totalRows, file: "done" },
        });
      } catch (e) {
        await updateFileStatus(fileId, "error", 0, String(e));
        errors.push({
          rowIndex: 0,
          message: e instanceof Error ? e.message : String(e),
        });
      }

      // Count errors from parsing
      const parseErrors = state.parsedPreview.filter((r) => r.error);
      for (const err of parseErrors) {
        errors.push({ rowIndex: err.rowIndex, message: err.error || "Parse error" });
      }

      const report: ImportReport = {
        totalRows: state.parsedPreview.length,
        importedCount,
        skippedDuplicates: state.excludedDuplicateIndices.size,
        errorCount: errors.length,
        categorizedCount,
        uncategorizedCount,
        errors,
      };

      dispatch({ type: "SET_IMPORT_REPORT", payload: report });
      dispatch({ type: "SET_STEP", payload: "report" });

      // Refresh configured sources
      await loadConfiguredSources();
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
      dispatch({ type: "SET_STEP", payload: "confirm" });
    }
  }, [
    state.duplicateResult,
    state.sourceConfig,
    state.excludedDuplicateIndices,
    state.parsedPreview,
    state.selectedFiles,
    loadConfiguredSources,
  ]);

  const goToStep = useCallback((step: ImportWizardStep) => {
    dispatch({ type: "SET_STEP", payload: step });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const autoDetectConfig = useCallback(async () => {
    if (state.selectedFiles.length === 0) return;

    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const content = await invoke<string>("read_file_content", {
        filePath: state.selectedFiles[0].file_path,
        encoding: state.sourceConfig.encoding,
      });

      const preprocessed = preprocessQuotedCSV(content);
      const result = runAutoDetect(preprocessed);

      if (result) {
        const newConfig = {
          ...state.sourceConfig,
          delimiter: result.delimiter,
          hasHeader: result.hasHeader,
          skipLines: result.skipLines,
          dateFormat: result.dateFormat,
          columnMapping: result.columnMapping,
          amountMode: result.amountMode,
          signConvention: result.signConvention,
        };
        dispatch({ type: "SET_SOURCE_CONFIG", payload: newConfig });
        dispatch({ type: "SET_LOADING", payload: false });

        // Refresh column headers with new config
        await loadHeadersWithConfig(
          state.selectedFiles[0].file_path,
          newConfig.delimiter,
          newConfig.encoding,
          newConfig.skipLines,
          newConfig.hasHeader
        );
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: "Auto-detection failed. Please configure manually.",
        });
      }
    } catch (e) {
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, [state.selectedFiles, state.sourceConfig, loadHeadersWithConfig]);

  const saveConfigAsTemplate = useCallback(async (name: string) => {
    const config = state.sourceConfig;
    await createTemplate({
      name,
      delimiter: config.delimiter,
      encoding: config.encoding,
      date_format: config.dateFormat,
      skip_lines: config.skipLines,
      has_header: config.hasHeader ? 1 : 0,
      column_mapping: JSON.stringify(config.columnMapping),
      amount_mode: config.amountMode,
      sign_convention: config.signConvention,
    });
    const templates = await getAllTemplates();
    dispatch({ type: "SET_CONFIG_TEMPLATES", payload: templates });
  }, [state.sourceConfig]);

  const applyConfigTemplate = useCallback((templateId: number) => {
    const template = state.configTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const mapping = JSON.parse(template.column_mapping) as ColumnMapping;
    const newConfig: SourceConfig = {
      name: state.sourceConfig.name,
      delimiter: template.delimiter,
      encoding: template.encoding,
      dateFormat: template.date_format,
      skipLines: template.skip_lines,
      columnMapping: mapping,
      amountMode: template.amount_mode,
      signConvention: template.sign_convention,
      hasHeader: !!template.has_header,
    };
    dispatch({ type: "SET_SOURCE_CONFIG", payload: newConfig });

    // Reload headers with new config
    if (state.selectedFiles.length > 0) {
      loadHeadersWithConfig(
        state.selectedFiles[0].file_path,
        newConfig.delimiter,
        newConfig.encoding,
        newConfig.skipLines,
        newConfig.hasHeader
      );
    }
  }, [state.configTemplates, state.sourceConfig.name, state.selectedFiles, loadHeadersWithConfig]);

  const deleteConfigTemplate = useCallback(async (id: number) => {
    await deleteTemplateService(id);
    const templates = await getAllTemplates();
    dispatch({ type: "SET_CONFIG_TEMPLATES", payload: templates });
  }, []);

  return {
    state,
    browseFolder,
    refreshFolder,
    selectSource,
    updateConfig,
    toggleFile,
    selectAllFiles,
    parsePreview,
    checkDuplicates,
    parseAndCheckDuplicates,
    executeImport,
    goToStep,
    reset,
    autoDetectConfig,
    saveConfigAsTemplate,
    applyConfigTemplate,
    deleteConfigTemplate,
    toggleDuplicateRow: (index: number) =>
      dispatch({ type: "TOGGLE_DUPLICATE_ROW", payload: index }),
    setSkipAllDuplicates: (skipAll: boolean) =>
      dispatch({ type: "SET_SKIP_ALL_DUPLICATES", payload: skipAll }),
  };
}
