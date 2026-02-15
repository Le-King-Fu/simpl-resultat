import { useReducer, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import {
  getExportCategories,
  getExportSuppliers,
  getExportKeywords,
  getExportTransactions,
  serializeToJson,
  serializeTransactionsToCsv,
  type ExportMode,
  type ExportFormat,
} from "../services/dataExportService";

type ExportStatus = "idle" | "exporting" | "success" | "error";

interface ExportState {
  status: ExportStatus;
  error: string | null;
}

type ExportAction =
  | { type: "EXPORT_START" }
  | { type: "EXPORT_SUCCESS" }
  | { type: "EXPORT_ERROR"; error: string }
  | { type: "RESET" };

const initialState: ExportState = {
  status: "idle",
  error: null,
};

function reducer(_state: ExportState, action: ExportAction): ExportState {
  switch (action.type) {
    case "EXPORT_START":
      return { status: "exporting", error: null };
    case "EXPORT_SUCCESS":
      return { status: "success", error: null };
    case "EXPORT_ERROR":
      return { status: "error", error: action.error };
    case "RESET":
      return initialState;
  }
}

export function useDataExport() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const performExport = useCallback(
    async (mode: ExportMode, format: ExportFormat, password?: string) => {
      dispatch({ type: "EXPORT_START" });
      try {
        const appVersion = await getVersion();

        // Gather data based on mode
        const data: Record<string, unknown> = {};
        if (mode === "transactions_with_categories" || mode === "categories_only") {
          data.categories = await getExportCategories();
          data.suppliers = await getExportSuppliers();
          data.keywords = await getExportKeywords();
        }
        if (mode === "transactions_with_categories" || mode === "transactions_only") {
          data.transactions = await getExportTransactions();
        }

        // Serialize
        let content: string;
        let defaultExt: string;
        if (format === "csv") {
          content = serializeTransactionsToCsv(data.transactions as never[]);
          defaultExt = "csv";
        } else {
          content = serializeToJson(mode, data, appVersion);
          defaultExt = "json";
        }

        // Determine file extension and name
        const isEncrypted = !!password && password.length > 0;
        const ext = isEncrypted ? "sref" : defaultExt;
        const timestamp = new Date().toISOString().slice(0, 10);
        const defaultName = `simplresult_${mode}_${timestamp}.${ext}`;

        // Build filters
        const filters: [string, string[]][] = isEncrypted
          ? [["Simpl'Result Encrypted", ["sref"]]]
          : format === "csv"
            ? [["CSV Files", ["csv"]]]
            : [["JSON Files", ["json"]]];

        // Pick save location
        const filePath = await invoke<string | null>("pick_save_file", {
          defaultName,
          filters,
        });

        if (!filePath) {
          dispatch({ type: "RESET" });
          return; // User cancelled
        }

        // Write file
        await invoke("write_export_file", {
          filePath,
          content,
          password: isEncrypted ? password : null,
        });

        dispatch({ type: "EXPORT_SUCCESS" });
      } catch (e) {
        dispatch({
          type: "EXPORT_ERROR",
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    []
  );

  const reset = useCallback(() => dispatch({ type: "RESET" }), []);

  return { state, performExport, reset };
}
