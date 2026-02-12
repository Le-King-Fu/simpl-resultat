import { useReducer, useCallback, useEffect, useRef } from "react";
import type { BudgetRow, BudgetTemplate } from "../shared/types";
import {
  getActiveCategories,
  getBudgetEntriesForMonth,
  getActualsByCategory,
  upsertBudgetEntry,
  deleteBudgetEntry,
  getAllTemplates,
  saveAsTemplate as saveAsTemplateSvc,
  applyTemplate as applyTemplateSvc,
  deleteTemplate as deleteTemplateSvc,
} from "../services/budgetService";

interface BudgetState {
  year: number;
  month: number;
  rows: BudgetRow[];
  templates: BudgetTemplate[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

type BudgetAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: { rows: BudgetRow[]; templates: BudgetTemplate[] } }
  | { type: "NAVIGATE_MONTH"; payload: { year: number; month: number } };

function initialState(): BudgetState {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    rows: [],
    templates: [],
    isLoading: false,
    isSaving: false,
    error: null,
  };
}

function reducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SAVING":
      return { ...state, isSaving: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false, isSaving: false };
    case "SET_DATA":
      return {
        ...state,
        rows: action.payload.rows,
        templates: action.payload.templates,
        isLoading: false,
      };
    case "NAVIGATE_MONTH":
      return { ...state, year: action.payload.year, month: action.payload.month };
    default:
      return state;
  }
}

const TYPE_ORDER: Record<string, number> = { expense: 0, income: 1, transfer: 2 };

export function useBudget() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const fetchIdRef = useRef(0);

  const refreshData = useCallback(async (year: number, month: number) => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const [categories, entries, actuals, templates] = await Promise.all([
        getActiveCategories(),
        getBudgetEntriesForMonth(year, month),
        getActualsByCategory(year, month),
        getAllTemplates(),
      ]);

      if (fetchId !== fetchIdRef.current) return;

      const entryMap = new Map(entries.map((e) => [e.category_id, e]));
      const actualMap = new Map(actuals.map((a) => [a.category_id, a.actual]));

      const rows: BudgetRow[] = categories.map((cat) => {
        const entry = entryMap.get(cat.id);
        const planned = entry?.amount ?? 0;
        const actual = actualMap.get(cat.id) ?? 0;

        let difference: number;
        if (cat.type === "income") {
          difference = actual - planned;
        } else {
          difference = planned - Math.abs(actual);
        }

        return {
          category_id: cat.id,
          category_name: cat.name,
          category_color: cat.color || "#9ca3af",
          category_type: cat.type,
          planned,
          actual,
          difference,
          notes: entry?.notes,
        };
      });

      rows.sort((a, b) => {
        const typeA = TYPE_ORDER[a.category_type] ?? 9;
        const typeB = TYPE_ORDER[b.category_type] ?? 9;
        if (typeA !== typeB) return typeA - typeB;
        return a.category_name.localeCompare(b.category_name);
      });

      dispatch({ type: "SET_DATA", payload: { rows, templates } });
    } catch (e) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  useEffect(() => {
    refreshData(state.year, state.month);
  }, [state.year, state.month, refreshData]);

  const navigateMonth = useCallback((delta: -1 | 1) => {
    let newMonth = state.month + delta;
    let newYear = state.year;
    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }
    dispatch({ type: "NAVIGATE_MONTH", payload: { year: newYear, month: newMonth } });
  }, [state.year, state.month]);

  const updatePlanned = useCallback(
    async (categoryId: number, amount: number, notes?: string) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await upsertBudgetEntry(categoryId, state.year, state.month, amount, notes);
        await refreshData(state.year, state.month);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, state.month, refreshData]
  );

  const removePlanned = useCallback(
    async (categoryId: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await deleteBudgetEntry(categoryId, state.year, state.month);
        await refreshData(state.year, state.month);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, state.month, refreshData]
  );

  const saveTemplate = useCallback(
    async (name: string, description?: string) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        const entries = state.rows
          .filter((r) => r.planned !== 0)
          .map((r) => ({ category_id: r.category_id, amount: r.planned }));
        await saveAsTemplateSvc(name, description, entries);
        await refreshData(state.year, state.month);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.rows, state.year, state.month, refreshData]
  );

  const applyTemplate = useCallback(
    async (templateId: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await applyTemplateSvc(templateId, state.year, state.month);
        await refreshData(state.year, state.month);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, state.month, refreshData]
  );

  const deleteTemplate = useCallback(
    async (templateId: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await deleteTemplateSvc(templateId);
        await refreshData(state.year, state.month);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, state.month, refreshData]
  );

  return {
    state,
    navigateMonth,
    updatePlanned,
    removePlanned,
    saveTemplate,
    applyTemplate,
    deleteTemplate,
  };
}
