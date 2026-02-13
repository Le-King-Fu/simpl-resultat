import { useReducer, useCallback, useEffect, useRef } from "react";
import type {
  ReportTab,
  DashboardPeriod,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  CategoryOverTimeData,
} from "../shared/types";
import { getMonthlyTrends, getCategoryOverTime } from "../services/reportService";
import { getExpensesByCategory } from "../services/dashboardService";

interface ReportsState {
  tab: ReportTab;
  period: DashboardPeriod;
  monthlyTrends: MonthlyTrendItem[];
  categorySpending: CategoryBreakdownItem[];
  categoryOverTime: CategoryOverTimeData;
  isLoading: boolean;
  error: string | null;
}

type ReportsAction =
  | { type: "SET_TAB"; payload: ReportTab }
  | { type: "SET_PERIOD"; payload: DashboardPeriod }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_MONTHLY_TRENDS"; payload: MonthlyTrendItem[] }
  | { type: "SET_CATEGORY_SPENDING"; payload: CategoryBreakdownItem[] }
  | { type: "SET_CATEGORY_OVER_TIME"; payload: CategoryOverTimeData };

const initialState: ReportsState = {
  tab: "trends",
  period: "6months",
  monthlyTrends: [],
  categorySpending: [],
  categoryOverTime: { categories: [], data: [], colors: {}, categoryIds: {} },
  isLoading: false,
  error: null,
};

function reducer(state: ReportsState, action: ReportsAction): ReportsState {
  switch (action.type) {
    case "SET_TAB":
      return { ...state, tab: action.payload };
    case "SET_PERIOD":
      return { ...state, period: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_MONTHLY_TRENDS":
      return { ...state, monthlyTrends: action.payload, isLoading: false };
    case "SET_CATEGORY_SPENDING":
      return { ...state, categorySpending: action.payload, isLoading: false };
    case "SET_CATEGORY_OVER_TIME":
      return { ...state, categoryOverTime: action.payload, isLoading: false };
    default:
      return state;
  }
}

function computeDateRange(period: DashboardPeriod): { dateFrom?: string; dateTo?: string } {
  if (period === "all") return {};

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
    case "12months":
      from = new Date(year, month - 11, 1);
      break;
  }

  const dateFrom = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}-${String(from.getDate()).padStart(2, "0")}`;

  return { dateFrom, dateTo };
}

export function useReports() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async (tab: ReportTab, period: DashboardPeriod) => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      const { dateFrom, dateTo } = computeDateRange(period);

      switch (tab) {
        case "trends": {
          const data = await getMonthlyTrends(dateFrom, dateTo);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_MONTHLY_TRENDS", payload: data });
          break;
        }
        case "byCategory": {
          const data = await getExpensesByCategory(dateFrom, dateTo);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_CATEGORY_SPENDING", payload: data });
          break;
        }
        case "overTime": {
          const data = await getCategoryOverTime(dateFrom, dateTo);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_CATEGORY_OVER_TIME", payload: data });
          break;
        }
      }
    } catch (e) {
      if (fetchId !== fetchIdRef.current) return;
      dispatch({
        type: "SET_ERROR",
        payload: e instanceof Error ? e.message : String(e),
      });
    }
  }, []);

  useEffect(() => {
    fetchData(state.tab, state.period);
  }, [state.tab, state.period, fetchData]);

  const setTab = useCallback((tab: ReportTab) => {
    dispatch({ type: "SET_TAB", payload: tab });
  }, []);

  const setPeriod = useCallback((period: DashboardPeriod) => {
    dispatch({ type: "SET_PERIOD", payload: period });
  }, []);

  return { state, setTab, setPeriod };
}
