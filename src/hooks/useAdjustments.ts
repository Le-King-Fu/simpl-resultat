import { useReducer, useCallback, useEffect, useRef } from "react";
import type { Adjustment, Category } from "../shared/types";
import type { AdjustmentEntryWithCategory } from "../services/adjustmentService";
import {
  getAllAdjustments,
  getEntriesByAdjustmentId,
  createAdjustment,
  updateAdjustment,
  deleteAdjustment as deleteAdj,
  createEntry,
  updateEntry,
  deleteEntry,
} from "../services/adjustmentService";
import { getDb } from "../services/db";

export interface AdjustmentFormData {
  name: string;
  description: string;
  date: string;
  is_recurring: boolean;
}

export interface EntryFormData {
  id?: number;
  category_id: number;
  amount: number;
  description: string;
}

interface AdjustmentsState {
  adjustments: Adjustment[];
  selectedAdjustmentId: number | null;
  entries: AdjustmentEntryWithCategory[];
  categories: Category[];
  editingAdjustment: AdjustmentFormData | null;
  editingEntries: EntryFormData[];
  isCreating: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

type AdjustmentsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_ADJUSTMENTS"; payload: Adjustment[] }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SELECT_ADJUSTMENT"; payload: number | null }
  | { type: "SET_ENTRIES"; payload: AdjustmentEntryWithCategory[] }
  | { type: "START_CREATING" }
  | { type: "START_EDITING"; payload: { adjustment: AdjustmentFormData; entries: EntryFormData[] } }
  | { type: "CANCEL_EDITING" }
  | { type: "SET_EDITING_ENTRIES"; payload: EntryFormData[] };

const initialState: AdjustmentsState = {
  adjustments: [],
  selectedAdjustmentId: null,
  entries: [],
  categories: [],
  editingAdjustment: null,
  editingEntries: [],
  isCreating: false,
  isLoading: false,
  isSaving: false,
  error: null,
};

function reducer(state: AdjustmentsState, action: AdjustmentsAction): AdjustmentsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false, isSaving: false };
    case "SET_ADJUSTMENTS":
      return { ...state, adjustments: action.payload, isLoading: false };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SELECT_ADJUSTMENT":
      return {
        ...state,
        selectedAdjustmentId: action.payload,
        editingAdjustment: null,
        editingEntries: [],
        isCreating: false,
        entries: [],
      };
    case "SET_ENTRIES":
      return { ...state, entries: action.payload };
    case "START_CREATING":
      return {
        ...state,
        isCreating: true,
        selectedAdjustmentId: null,
        entries: [],
        editingAdjustment: {
          name: "",
          description: "",
          date: new Date().toISOString().slice(0, 10),
          is_recurring: false,
        },
        editingEntries: [],
      };
    case "START_EDITING":
      return {
        ...state,
        isCreating: false,
        editingAdjustment: action.payload.adjustment,
        editingEntries: action.payload.entries,
      };
    case "CANCEL_EDITING":
      return { ...state, editingAdjustment: null, editingEntries: [], isCreating: false };
    case "SET_EDITING_ENTRIES":
      return { ...state, editingEntries: action.payload };
    default:
      return state;
  }
}

export function useAdjustments() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);

  const loadCategories = useCallback(async () => {
    try {
      const db = await getDb();
      const rows = await db.select<Category[]>(
        "SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order, name"
      );
      dispatch({ type: "SET_CATEGORIES", payload: rows });
    } catch (e) {
      dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  const loadAdjustments = useCallback(async () => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const rows = await getAllAdjustments();
      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_ADJUSTMENTS", payload: rows });
    } catch (e) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    loadAdjustments();
    loadCategories();
  }, [loadAdjustments, loadCategories]);

  const selectAdjustment = useCallback(async (id: number | null) => {
    dispatch({ type: "SELECT_ADJUSTMENT", payload: id });
    if (id !== null) {
      try {
        const entries = await getEntriesByAdjustmentId(id);
        dispatch({ type: "SET_ENTRIES", payload: entries });
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    }
  }, []);

  const startCreating = useCallback(() => {
    dispatch({ type: "START_CREATING" });
  }, []);

  const startEditing = useCallback(() => {
    const adj = state.adjustments.find((a) => a.id === state.selectedAdjustmentId);
    if (!adj) return;
    dispatch({
      type: "START_EDITING",
      payload: {
        adjustment: {
          name: adj.name,
          description: adj.description ?? "",
          date: adj.date,
          is_recurring: adj.is_recurring,
        },
        entries: state.entries.map((e) => ({
          id: e.id,
          category_id: e.category_id,
          amount: e.amount,
          description: e.description ?? "",
        })),
      },
    });
  }, [state.adjustments, state.selectedAdjustmentId, state.entries]);

  const cancelEditing = useCallback(() => {
    dispatch({ type: "CANCEL_EDITING" });
  }, []);

  const saveAdjustment = useCallback(
    async (formData: AdjustmentFormData, entries: EntryFormData[]) => {
      dispatch({ type: "SET_SAVING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      try {
        if (state.isCreating) {
          const newId = await createAdjustment({
            name: formData.name,
            description: formData.description || undefined,
            date: formData.date,
            is_recurring: formData.is_recurring,
          });
          for (const entry of entries) {
            await createEntry({
              adjustment_id: newId,
              category_id: entry.category_id,
              amount: entry.amount,
              description: entry.description || undefined,
            });
          }
          await loadAdjustments();
          await selectAdjustment(newId);
        } else if (state.selectedAdjustmentId !== null) {
          await updateAdjustment(state.selectedAdjustmentId, {
            name: formData.name,
            description: formData.description || undefined,
            date: formData.date,
            is_recurring: formData.is_recurring,
          });

          // Determine which entries to create, update, or delete
          const existingIds = new Set(state.entries.map((e) => e.id));
          const keptIds = new Set<number>();

          for (const entry of entries) {
            if (entry.id && existingIds.has(entry.id)) {
              await updateEntry(entry.id, {
                category_id: entry.category_id,
                amount: entry.amount,
                description: entry.description || undefined,
              });
              keptIds.add(entry.id);
            } else {
              await createEntry({
                adjustment_id: state.selectedAdjustmentId,
                category_id: entry.category_id,
                amount: entry.amount,
                description: entry.description || undefined,
              });
            }
          }

          // Delete removed entries
          for (const id of existingIds) {
            if (!keptIds.has(id)) {
              await deleteEntry(id);
            }
          }

          await loadAdjustments();
          await selectAdjustment(state.selectedAdjustmentId);
        }
        dispatch({ type: "SET_SAVING", payload: false });
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    },
    [state.isCreating, state.selectedAdjustmentId, state.entries, loadAdjustments, selectAdjustment]
  );

  const removeAdjustment = useCallback(
    async (id: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await deleteAdj(id);
        dispatch({ type: "SELECT_ADJUSTMENT", payload: null });
        await loadAdjustments();
        dispatch({ type: "SET_SAVING", payload: false });
      } catch (e) {
        dispatch({ type: "SET_ERROR", payload: e instanceof Error ? e.message : String(e) });
      }
    },
    [loadAdjustments]
  );

  return {
    state,
    selectAdjustment,
    startCreating,
    startEditing,
    cancelEditing,
    saveAdjustment,
    deleteAdjustment: removeAdjustment,
  };
}
