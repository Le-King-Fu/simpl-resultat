import { useReducer, useCallback, useEffect, useRef } from "react";
import type {
  DashboardPeriod,
  DashboardSummary,
  CategoryBreakdownItem,
  RecentTransaction,
} from "../shared/types";
import {
  getDashboardSummary,
  getExpensesByCategory,
  getRecentTransactions,
} from "../services/dashboardService";

interface DashboardState {
  summary: DashboardSummary;
  categoryBreakdown: CategoryBreakdownItem[];
  recentTransactions: RecentTransaction[];
  period: DashboardPeriod;
  customDateFrom: string;
  customDateTo: string;
  isLoading: boolean;
  error: string | null;
}

type DashboardAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_DATA";
      payload: {
        summary: DashboardSummary;
        categoryBreakdown: CategoryBreakdownItem[];
        recentTransactions: RecentTransaction[];
      };
    }
  | { type: "SET_PERIOD"; payload: DashboardPeriod }
  | { type: "SET_CUSTOM_DATES"; payload: { dateFrom: string; dateTo: string } };

const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

const initialState: DashboardState = {
  summary: { totalCount: 0, totalAmount: 0, incomeTotal: 0, expenseTotal: 0 },
  categoryBreakdown: [],
  recentTransactions: [],
  period: "month",
  customDateFrom: monthStartStr,
  customDateTo: todayStr,
  isLoading: false,
  error: null,
};

function reducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_DATA":
      return {
        ...state,
        summary: action.payload.summary,
        categoryBreakdown: action.payload.categoryBreakdown,
        recentTransactions: action.payload.recentTransactions,
        isLoading: false,
      };
    case "SET_PERIOD":
      return { ...state, period: action.payload };
    case "SET_CUSTOM_DATES":
      return { ...state, period: "custom" as DashboardPeriod, customDateFrom: action.payload.dateFrom, customDateTo: action.payload.dateTo };
    default:
      return state;
  }
}

function computeDateRange(
  period: DashboardPeriod,
  customDateFrom?: string,
  customDateTo?: string,
): { dateFrom?: string; dateTo?: string } {
  if (period === "all") return {};
  if (period === "custom" && customDateFrom && customDateTo) {
    return { dateFrom: customDateFrom, dateTo: customDateTo };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const dateTo = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  let from: Date;
  switch (period) {
    case "month":
      from = new Date(year, month, 1);
      break;
    case "3months":
      from = new Date(year, month - 2, 1);
      break;
    case "6months":
      from = new Date(year, month - 5, 1);
      break;
    case "year":
      from = new Date(year, 0, 1);
      break;
    case "12months":
      from = new Date(year, month - 11, 1);
      break;
    default:
      from = new Date(year, month, 1);
      break;
  }

  const dateFrom = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;

  return { dateFrom, dateTo };
}

export function useDashboard() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async (period: DashboardPeriod, customFrom?: string, customTo?: string) => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const { dateFrom, dateTo } = computeDateRange(period, customFrom, customTo);
      const [summary, categoryBreakdown, recentTransactions] = await Promise.all([
        getDashboardSummary(dateFrom, dateTo),
        getExpensesByCategory(dateFrom, dateTo),
        getRecentTransactions(10),
      ]);

      if (fetchId !== fetchIdRef.current) return;
      dispatch({ type: "SET_DATA", payload: { summary, categoryBreakdown, recentTransactions } });
    } catch (e) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  useEffect(() => {
    fetchData(state.period, state.customDateFrom, state.customDateTo);
  }, [state.period, state.customDateFrom, state.customDateTo, fetchData]);

  const setPeriod = useCallback((period: DashboardPeriod) => {
    dispatch({ type: "SET_PERIOD", payload: period });
  }, []);

  const setCustomDates = useCallback((dateFrom: string, dateTo: string) => {
    dispatch({ type: "SET_CUSTOM_DATES", payload: { dateFrom, dateTo } });
  }, []);

  return { state, setPeriod, setCustomDates };
}
