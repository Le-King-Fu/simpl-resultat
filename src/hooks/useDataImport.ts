import { useReducer, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  parseImportedJson,
  parseImportedCsv,
  importCategoriesOnly,
  importTransactionsWithCategories,
  importTransactionsOnly,
  type ExportEnvelope,
  type ImportSummary,
} from "../services/dataExportService";

type ImportStatus =
  | "idle"
  | "reading"
  | "needsPassword"
  | "confirming"
  | "importing"
  | "success"
  | "error";

interface ImportState {
  status: ImportStatus;
  filePath: string | null;
  summary: ImportSummary | null;
  parsedData: ExportEnvelope["data"] | null;
  importType: ExportEnvelope["export_type"] | null;
  error: string | null;
}

type ImportAction =
  | { type: "READ_START" }
  | { type: "NEEDS_PASSWORD"; filePath: string }
  | {
      type: "CONFIRMING";
      filePath: string;
      summary: ImportSummary;
      data: ExportEnvelope["data"];
      importType: ExportEnvelope["export_type"];
    }
  | { type: "IMPORT_START" }
  | { type: "IMPORT_SUCCESS" }
  | { type: "IMPORT_ERROR"; error: string }
  | { type: "RESET" };

const initialState: ImportState = {
  status: "idle",
  filePath: null,
  summary: null,
  parsedData: null,
  importType: null,
  error: null,
};

function reducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "READ_START":
      return { ...initialState, status: "reading" };
    case "NEEDS_PASSWORD":
      return { ...initialState, status: "needsPassword", filePath: action.filePath };
    case "CONFIRMING":
      return {
        ...state,
        status: "confirming",
        filePath: action.filePath,
        summary: action.summary,
        parsedData: action.data,
        importType: action.importType,
        error: null,
      };
    case "IMPORT_START":
      return { ...state, status: "importing", error: null };
    case "IMPORT_SUCCESS":
      return { ...state, status: "success", error: null };
    case "IMPORT_ERROR":
      return { ...state, status: "error", error: action.error };
    case "RESET":
      return initialState;
  }
}

function parseContent(
  content: string,
  filePath: string
): { summary: ImportSummary; data: ExportEnvelope["data"]; importType: ExportEnvelope["export_type"] } {
  const isCsv =
    filePath.toLowerCase().endsWith(".csv") ||
    (!filePath.toLowerCase().endsWith(".json") &&
      !filePath.toLowerCase().endsWith(".sref") &&
      content.trimStart().charAt(0) !== "{");

  if (isCsv) {
    const { transactions, summary } = parseImportedCsv(content);
    return {
      summary,
      data: { transactions },
      importType: "transactions_only",
    };
  }

  const { envelope, summary } = parseImportedJson(content);
  return {
    summary,
    data: envelope.data,
    importType: envelope.export_type,
  };
}

export function useDataImport() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const pickAndRead = useCallback(async () => {
    dispatch({ type: "READ_START" });
    try {
      const filePath = await invoke<string | null>("pick_import_file", {
        filters: [["Simpl'Result Files", ["json", "csv", "sref"]]],
      });

      if (!filePath) {
        dispatch({ type: "RESET" });
        return;
      }

      const encrypted = await invoke<boolean>("is_file_encrypted", { filePath });

      if (encrypted) {
        dispatch({ type: "NEEDS_PASSWORD", filePath });
        return;
      }

      const content = await invoke<string>("read_import_file", {
        filePath,
        password: null,
      });

      const { summary, data, importType } = parseContent(content, filePath);
      dispatch({ type: "CONFIRMING", filePath, summary, data, importType });
    } catch (e) {
      dispatch({
        type: "IMPORT_ERROR",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  const readWithPassword = useCallback(
    async (password: string) => {
      if (!state.filePath) return;
      dispatch({ type: "READ_START" });
      try {
        const content = await invoke<string>("read_import_file", {
          filePath: state.filePath,
          password,
        });

        const { summary, data, importType } = parseContent(content, state.filePath);
        dispatch({ type: "CONFIRMING", filePath: state.filePath, summary, data, importType });
      } catch (e) {
        dispatch({
          type: "IMPORT_ERROR",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    [state.filePath]
  );

  const executeImport = useCallback(async () => {
    if (!state.parsedData || !state.importType) return;
    dispatch({ type: "IMPORT_START" });
    const filename = state.filePath?.split(/[/\\]/).pop() ?? "unknown";
    try {
      switch (state.importType) {
        case "categories_only":
          await importCategoriesOnly(state.parsedData);
          break;
        case "transactions_with_categories":
          await importTransactionsWithCategories(state.parsedData, filename);
          break;
        case "transactions_only":
          await importTransactionsOnly(state.parsedData, filename);
          break;
      }
      dispatch({ type: "IMPORT_SUCCESS" });
    } catch (e) {
      dispatch({
        type: "IMPORT_ERROR",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [state.parsedData, state.importType, state.filePath]);

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, pickAndRead, readWithPassword, executeImport, reset };
}
