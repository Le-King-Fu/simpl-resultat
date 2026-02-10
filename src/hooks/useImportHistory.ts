import { useReducer, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { ImportedFileWithSource } from "../shared/types";
import {
  getAllImportedFiles,
  deleteImportWithTransactions,
  deleteAllImportsWithTransactions,
} from "../services/importedFileService";

interface ImportHistoryState {
  files: ImportedFileWithSource[];
  isLoading: boolean;
  isDeleting: boolean;
  error: string | null;
}

type ImportHistoryAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_DELETING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FILES"; payload: ImportedFileWithSource[] };

const initialState: ImportHistoryState = {
  files: [],
  isLoading: false,
  isDeleting: false,
  error: null,
};

function reducer(
  state: ImportHistoryState,
  action: ImportHistoryAction
): ImportHistoryState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_DELETING":
      return { ...state, isDeleting: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_FILES":
      return { ...state, files: action.payload };
    default:
      return state;
  }
}

export function useImportHistory(onChanged?: () => void) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);
  const { t } = useTranslation();

  const loadHistory = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const files = await getAllImportedFiles();
      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_FILES", payload: files });
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_ERROR", payload: String(err) });
    } finally {
      if (fetchId === fetchIdRef.current) {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    }
  }, []);

  const handleDelete = useCallback(
    async (fileId: number, rowCount: number) => {
      const ok = confirm(
        t("import.history.deleteConfirm", { count: rowCount })
      );
      if (!ok) return;
      dispatch({ type: "SET_DELETING", payload: true });
      try {
        await deleteImportWithTransactions(fileId);
        await loadHistory();
        onChanged?.();
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: String(err) });
      } finally {
        dispatch({ type: "SET_DELETING", payload: false });
      }
    },
    [loadHistory, onChanged, t]
  );

  const handleDeleteAll = useCallback(async () => {
    const ok = confirm(t("import.history.deleteAllConfirm"));
    if (!ok) return;
    dispatch({ type: "SET_DELETING", payload: true });
    try {
      await deleteAllImportsWithTransactions();
      await loadHistory();
      onChanged?.();
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: String(err) });
    } finally {
      dispatch({ type: "SET_DELETING", payload: false });
    }
  }, [loadHistory, onChanged, t]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    state,
    loadHistory,
    handleDelete,
    handleDeleteAll,
  };
}
