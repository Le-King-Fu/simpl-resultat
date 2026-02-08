import { useReducer, useCallback, useEffect, useRef } from "react";
import type {
  TransactionRow,
  TransactionFilters,
  TransactionSort,
  TransactionPageResult,
  Category,
  ImportSource,
} from "../shared/types";
import {
  getTransactionPage,
  updateTransactionCategory,
  updateTransactionNotes,
  getAllCategories,
  getAllImportSources,
} from "../services/transactionService";

interface TransactionsState {
  rows: TransactionRow[];
  totalCount: number;
  totalAmount: number;
  incomeTotal: number;
  expenseTotal: number;
  filters: TransactionFilters;
  sort: TransactionSort;
  page: number;
  pageSize: number;
  categories: Category[];
  sources: ImportSource[];
  isLoading: boolean;
  error: string | null;
}

type TransactionsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PAGE_RESULT"; payload: TransactionPageResult }
  | { type: "SET_FILTER"; payload: { key: keyof TransactionFilters; value: unknown } }
  | { type: "SET_SORT"; payload: TransactionSort }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_CATEGORIES"; payload: Category[] }
  | { type: "SET_SOURCES"; payload: ImportSource[] }
  | { type: "UPDATE_ROW_CATEGORY"; payload: { txId: number; categoryId: number | null; categoryName: string | null; categoryColor: string | null } }
  | { type: "UPDATE_ROW_NOTES"; payload: { txId: number; notes: string } };

const initialFilters: TransactionFilters = {
  search: "",
  categoryId: null,
  sourceId: null,
  dateFrom: null,
  dateTo: null,
  uncategorizedOnly: false,
};

const initialState: TransactionsState = {
  rows: [],
  totalCount: 0,
  totalAmount: 0,
  incomeTotal: 0,
  expenseTotal: 0,
  filters: initialFilters,
  sort: { column: "date", direction: "desc" },
  page: 1,
  pageSize: 50,
  categories: [],
  sources: [],
  isLoading: false,
  error: null,
};

function reducer(state: TransactionsState, action: TransactionsAction): TransactionsState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_PAGE_RESULT":
      return {
        ...state,
        rows: action.payload.rows,
        totalCount: action.payload.totalCount,
        totalAmount: action.payload.totalAmount,
        incomeTotal: action.payload.incomeTotal,
        expenseTotal: action.payload.expenseTotal,
        isLoading: false,
      };
    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value },
        page: 1,
      };
    case "SET_SORT":
      return { ...state, sort: action.payload };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };
    case "SET_SOURCES":
      return { ...state, sources: action.payload };
    case "UPDATE_ROW_CATEGORY":
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === action.payload.txId
            ? {
                ...r,
                category_id: action.payload.categoryId,
                category_name: action.payload.categoryName,
                category_color: action.payload.categoryColor,
                is_manually_categorized: true,
              }
            : r
        ),
      };
    case "UPDATE_ROW_NOTES":
      return {
        ...state,
        rows: state.rows.map((r) =>
          r.id === action.payload.txId ? { ...r, notes: action.payload.notes } : r
        ),
      };
    default:
      return state;
  }
}

export function useTransactions() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedFiltersRef = useRef(state.filters);

  // Load categories and sources once on mount
  useEffect(() => {
    (async () => {
      try {
        const [cats, srcs] = await Promise.all([
          getAllCategories(),
          getAllImportSources(),
        ]);
        dispatch({ type: "SET_CATEGORIES", payload: cats });
        dispatch({ type: "SET_SOURCES", payload: srcs });
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
      }
    })();
  }, []);

  // Fetch transactions when filters/sort/page change
  const fetchData = useCallback(async (
    filters: TransactionFilters,
    sort: TransactionSort,
    page: number,
    pageSize: number
  ) => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const result = await getTransactionPage(filters, sort, page, pageSize);
      // Ignore stale responses
      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_PAGE_RESULT", payload: result });
    } catch (e) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  // Auto-fetch when sort, page, or non-search filters change
  useEffect(() => {
    fetchData(debouncedFiltersRef.current, state.sort, state.page, state.pageSize);
  }, [state.sort, state.page, state.pageSize, fetchData]);

  // Debounced search — trigger fetch after 300ms
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = setTimeout(() => {
      debouncedFiltersRef.current = state.filters;
      fetchData(state.filters, state.sort, state.page, state.pageSize);
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [state.filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = useCallback(
    (key: keyof TransactionFilters, value: unknown) => {
      dispatch({ type: "SET_FILTER", payload: { key, value } });
    },
    []
  );

  const setSort = useCallback(
    (column: TransactionSort["column"]) => {
      dispatch({
        type: "SET_SORT",
        payload: {
          column,
          direction:
            state.sort.column === column && state.sort.direction === "desc"
              ? "asc"
              : "desc",
        },
      });
    },
    [state.sort]
  );

  const setPage = useCallback((page: number) => {
    dispatch({ type: "SET_PAGE", payload: page });
  }, []);

  const updateCategory = useCallback(
    async (txId: number, categoryId: number | null) => {
      const cat = state.categories.find((c) => c.id === categoryId) ?? null;
      dispatch({
        type: "UPDATE_ROW_CATEGORY",
        payload: {
          txId,
          categoryId,
          categoryName: cat?.name ?? null,
          categoryColor: cat?.color ?? null,
        },
      });

      try {
        await updateTransactionCategory(txId, categoryId, true);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
        // Refetch to restore correct state
        fetchData(debouncedFiltersRef.current, state.sort, state.page, state.pageSize);
      }
    },
    [state.categories, state.sort, state.page, state.pageSize, fetchData]
  );

  const saveNotes = useCallback(
    async (txId: number, notes: string) => {
      dispatch({ type: "UPDATE_ROW_NOTES", payload: { txId, notes } });

      try {
        await updateTransactionNotes(txId, notes);
      } catch (e) {
        dispatch({
          type: "SET_ERROR",
          payload: e instanceof Error ? e.message : String(e),
        });
        fetchData(debouncedFiltersRef.current, state.sort, state.page, state.pageSize);
      }
    },
    [state.sort, state.page, state.pageSize, fetchData]
  );

  return {
    state,
    setFilter,
    setSort,
    setPage,
    updateCategory,
    saveNotes,
  };
}
