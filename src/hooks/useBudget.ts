import { useReducer, useCallback, useEffect, useRef } from "react";
import type { BudgetYearRow, BudgetTemplate } from "../shared/types";
import {
  getAllActiveCategories,
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
      const [allCategories, entries, templates] = await Promise.all([
        getAllActiveCategories(),
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

      // Helper: build months array from entryMap
      const buildMonths = (catId: number) => {
        const monthMap = entryMap.get(catId);
        const months: number[] = [];
        let annual = 0;
        for (let m = 1; m <= 12; m++) {
          const val = monthMap?.get(m) ?? 0;
          months.push(val);
          annual += val;
        }
        return { months, annual };
      };

      // Index categories by id and group children by parent_id
      const catById = new Map(allCategories.map((c) => [c.id, c]));
      const childrenByParent = new Map<number, typeof allCategories>();
      for (const cat of allCategories) {
        if (cat.parent_id) {
          if (!childrenByParent.has(cat.parent_id)) childrenByParent.set(cat.parent_id, []);
          childrenByParent.get(cat.parent_id)!.push(cat);
        }
      }

      const rows: BudgetYearRow[] = [];

      // Identify top-level parents and standalone leaves
      const topLevel = allCategories.filter((c) => !c.parent_id);

      for (const cat of topLevel) {
        const children = (childrenByParent.get(cat.id) || []).filter((c) => c.is_inputable);

        if (children.length === 0 && cat.is_inputable) {
          // Standalone leaf (no children) — regular editable row
          const { months, annual } = buildMonths(cat.id);
          rows.push({
            category_id: cat.id,
            category_name: cat.name,
            category_color: cat.color || "#9ca3af",
            category_type: cat.type,
            parent_id: null,
            is_parent: false,
            months,
            annual,
          });
        } else if (children.length > 0) {
          // Parent with children — build child rows first, then parent subtotal
          const childRows: BudgetYearRow[] = [];

          // If parent is also inputable, create a "(direct)" fake-child row
          if (cat.is_inputable) {
            const { months, annual } = buildMonths(cat.id);
            childRows.push({
              category_id: cat.id,
              category_name: `${cat.name} (direct)`,
              category_color: cat.color || "#9ca3af",
              category_type: cat.type,
              parent_id: cat.id,
              is_parent: false,
              months,
              annual,
            });
          }

          for (const child of children) {
            const { months, annual } = buildMonths(child.id);
            childRows.push({
              category_id: child.id,
              category_name: child.name,
              category_color: child.color || cat.color || "#9ca3af",
              category_type: child.type,
              parent_id: cat.id,
              is_parent: false,
              months,
              annual,
            });
          }

          // Parent subtotal row: sum of all children (+ direct if inputable)
          const parentMonths = Array(12).fill(0) as number[];
          let parentAnnual = 0;
          for (const cr of childRows) {
            for (let m = 0; m < 12; m++) parentMonths[m] += cr.months[m];
            parentAnnual += cr.annual;
          }

          rows.push({
            category_id: cat.id,
            category_name: cat.name,
            category_color: cat.color || "#9ca3af",
            category_type: cat.type,
            parent_id: null,
            is_parent: true,
            months: parentMonths,
            annual: parentAnnual,
          });

          // Sort children alphabetically, but keep "(direct)" first
          childRows.sort((a, b) => {
            if (a.category_id === cat.id) return -1;
            if (b.category_id === cat.id) return 1;
            return a.category_name.localeCompare(b.category_name);
          });

          rows.push(...childRows);
        }
        // else: non-inputable parent with no inputable children — skip
      }

      // Sort by type, then within each type: parent rows first (with children following), then standalone
      rows.sort((a, b) => {
        const typeA = TYPE_ORDER[a.category_type] ?? 9;
        const typeB = TYPE_ORDER[b.category_type] ?? 9;
        if (typeA !== typeB) return typeA - typeB;
        // Within same type, keep parent+children groups together
        const groupA = a.is_parent ? a.category_id : (a.parent_id ?? a.category_id);
        const groupB = b.is_parent ? b.category_id : (b.parent_id ?? b.category_id);
        if (groupA !== groupB) {
          // Find the sort_order of the group's parent category
          const catA = catById.get(groupA);
          const catB = catById.get(groupB);
          const orderA = catA?.sort_order ?? 999;
          const orderB = catB?.sort_order ?? 999;
          if (orderA !== orderB) return orderA - orderB;
          return (catA?.name ?? "").localeCompare(catB?.name ?? "");
        }
        // Same group: parent row first, then children
        if (a.is_parent !== b.is_parent) return a.is_parent ? -1 : 1;
        // Children: "(direct)" first, then alphabetical
        if (a.parent_id && a.category_id === a.parent_id) return -1;
        if (b.parent_id && b.category_id === b.parent_id) return 1;
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
        // Exclude parent subtotal rows (they're computed, not real entries)
        const entries = state.rows
          .filter((r) => !r.is_parent && r.months[0] !== 0)
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
