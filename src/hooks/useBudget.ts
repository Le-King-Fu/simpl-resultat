import { useReducer, useCallback, useEffect, useRef } from "react";
import type { BudgetYearRow, BudgetTemplate } from "../shared/types";
import {
  getActiveCategories,
  getBudgetEntriesForYear,
  upsertBudgetEntry,
  upsertBudgetEntriesForYear,
  getAllTemplates,
  saveAsTemplate as saveAsTemplateSvc,
  applyTemplate as applyTemplateSvc,
  deleteTemplate as deleteTemplateSvc,
} from "../services/budgetService";

interface BudgetState {
  year: number;
  rows: BudgetYearRow[];
  templates: BudgetTemplate[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

type BudgetAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_SAVING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_DATA"; payload: { rows: BudgetYearRow[]; templates: BudgetTemplate[] } }
  | { type: "SET_YEAR"; payload: number };

function initialState(): BudgetState {
  return {
    year: new Date().getFullYear(),
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
    case "SET_YEAR":
      return { ...state, year: action.payload };
    default:
      return state;
  }
}

const TYPE_ORDER: Record<string, number> = { expense: 0, income: 1, transfer: 2 };

export function useBudget() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const fetchIdRef = useRef(0);

  const refreshData = useCallback(async (year: number) => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const [categories, entries, templates] = await Promise.all([
        getActiveCategories(),
        getBudgetEntriesForYear(year),
        getAllTemplates(),
      ]);

      if (fetchId !== fetchIdRef.current) return;

      // Build a map: categoryId -> month(1-12) -> amount
      const entryMap = new Map<number, Map<number, number>>();
      for (const e of entries) {
        if (!entryMap.has(e.category_id)) entryMap.set(e.category_id, new Map());
        entryMap.get(e.category_id)!.set(e.month, e.amount);
      }

      const rows: BudgetYearRow[] = categories.map((cat) => {
        const monthMap = entryMap.get(cat.id);
        const months: number[] = [];
        let annual = 0;
        for (let m = 1; m <= 12; m++) {
          const val = monthMap?.get(m) ?? 0;
          months.push(val);
          annual += val;
        }
        return {
          category_id: cat.id,
          category_name: cat.name,
          category_color: cat.color || "#9ca3af",
          category_type: cat.type,
          months,
          annual,
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
    refreshData(state.year);
  }, [state.year, refreshData]);

  const navigateYear = useCallback((delta: -1 | 1) => {
    dispatch({ type: "SET_YEAR", payload: state.year + delta });
  }, [state.year]);

  const updatePlanned = useCallback(
    async (categoryId: number, month: number, amount: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await upsertBudgetEntry(categoryId, state.year, month, amount);
        await refreshData(state.year);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, refreshData]
  );

  const splitEvenly = useCallback(
    async (categoryId: number, annualAmount: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        const base = Math.floor((annualAmount / 12) * 100) / 100;
        const remainder = Math.round((annualAmount - base * 12) * 100);
        const amounts: number[] = [];
        for (let m = 0; m < 12; m++) {
          amounts.push(m < remainder ? base + 0.01 : base);
        }
        await upsertBudgetEntriesForYear(categoryId, state.year, amounts);
        await refreshData(state.year);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, refreshData]
  );

  const saveTemplate = useCallback(
    async (name: string, description?: string) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        // Save template from January values (template is a single-month snapshot)
        const entries = state.rows
          .filter((r) => r.months[0] !== 0)
          .map((r) => ({ category_id: r.category_id, amount: r.months[0] }));
        await saveAsTemplateSvc(name, description, entries);
        await refreshData(state.year);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.rows, state.year, refreshData]
  );

  const applyTemplate = useCallback(
    async (templateId: number, month: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await applyTemplateSvc(templateId, state.year, month);
        await refreshData(state.year);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, refreshData]
  );

  const applyTemplateAllMonths = useCallback(
    async (templateId: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        for (let m = 1; m <= 12; m++) {
          await applyTemplateSvc(templateId, state.year, m);
        }
        await refreshData(state.year);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, refreshData]
  );

  const deleteTemplate = useCallback(
    async (templateId: number) => {
      dispatch({ type: "SET_SAVING", payload: true });
      try {
        await deleteTemplateSvc(templateId);
        await refreshData(state.year);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      } finally {
        dispatch({ type: "SET_SAVING", payload: false });
      }
    },
    [state.year, refreshData]
  );

  return {
    state,
    navigateYear,
    updatePlanned,
    splitEvenly,
    saveTemplate,
    applyTemplate,
    applyTemplateAllMonths,
    deleteTemplate,
  };
}
