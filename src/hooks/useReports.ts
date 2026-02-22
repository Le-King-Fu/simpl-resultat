import { useReducer, useCallback, useEffect, useRef } from "react";
import type {
  ReportTab,
  DashboardPeriod,
  MonthlyTrendItem,
  CategoryBreakdownItem,
  CategoryOverTimeData,
  BudgetVsActualRow,
  PivotConfig,
  PivotResult,
} from "../shared/types";
import { getMonthlyTrends, getCategoryOverTime, getDynamicReportData } from "../services/reportService";
import { getExpensesByCategory } from "../services/dashboardService";
import { getBudgetVsActualData } from "../services/budgetService";

interface ReportsState {
  tab: ReportTab;
  period: DashboardPeriod;
  customDateFrom: string;
  customDateTo: string;
  monthlyTrends: MonthlyTrendItem[];
  categorySpending: CategoryBreakdownItem[];
  categoryOverTime: CategoryOverTimeData;
  budgetYear: number;
  budgetMonth: number;
  budgetVsActual: BudgetVsActualRow[];
  pivotConfig: PivotConfig;
  pivotResult: PivotResult;
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
  | { type: "SET_CATEGORY_OVER_TIME"; payload: CategoryOverTimeData }
  | { type: "SET_BUDGET_MONTH"; payload: { year: number; month: number } }
  | { type: "SET_BUDGET_VS_ACTUAL"; payload: BudgetVsActualRow[] }
  | { type: "SET_PIVOT_CONFIG"; payload: PivotConfig }
  | { type: "SET_PIVOT_RESULT"; payload: PivotResult }
  | { type: "SET_CUSTOM_DATES"; payload: { dateFrom: string; dateTo: string } };

const now = new Date();
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

const initialState: ReportsState = {
  tab: "trends",
  period: "6months",
  customDateFrom: monthStartStr,
  customDateTo: todayStr,
  monthlyTrends: [],
  categorySpending: [],
  categoryOverTime: { categories: [], data: [], colors: {}, categoryIds: {} },
  budgetYear: now.getFullYear(),
  budgetMonth: now.getMonth() + 1,
  budgetVsActual: [],
  pivotConfig: { rows: [], columns: [], filters: {}, values: [] },
  pivotResult: { rows: [], columnValues: [], dimensionLabels: {} },
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
    case "SET_BUDGET_MONTH":
      return { ...state, budgetYear: action.payload.year, budgetMonth: action.payload.month };
    case "SET_BUDGET_VS_ACTUAL":
      return { ...state, budgetVsActual: action.payload, isLoading: false };
    case "SET_PIVOT_CONFIG":
      return { ...state, pivotConfig: action.payload };
    case "SET_PIVOT_RESULT":
      return { ...state, pivotResult: action.payload, isLoading: false };
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

export function useReports() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const fetchIdRef = useRef(0);

  const fetchData = useCallback(async (
    tab: ReportTab,
    period: DashboardPeriod,
    budgetYear: number,
    budgetMonth: number,
    customFrom?: string,
    customTo?: string,
    pivotCfg?: PivotConfig,
  ) => {
    const fetchId = ++fetchIdRef.current;
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });

    try {
      switch (tab) {
        case "trends": {
          const { dateFrom, dateTo } = computeDateRange(period, customFrom, customTo);
          const data = await getMonthlyTrends(dateFrom, dateTo);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_MONTHLY_TRENDS", payload: data });
          break;
        }
        case "byCategory": {
          const { dateFrom, dateTo } = computeDateRange(period, customFrom, customTo);
          const data = await getExpensesByCategory(dateFrom, dateTo);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_CATEGORY_SPENDING", payload: data });
          break;
        }
        case "overTime": {
          const { dateFrom, dateTo } = computeDateRange(period, customFrom, customTo);
          const data = await getCategoryOverTime(dateFrom, dateTo);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_CATEGORY_OVER_TIME", payload: data });
          break;
        }
        case "budgetVsActual": {
          const data = await getBudgetVsActualData(budgetYear, budgetMonth);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_BUDGET_VS_ACTUAL", payload: data });
          break;
        }
        case "dynamic": {
          if (!pivotCfg || (pivotCfg.rows.length === 0 && pivotCfg.columns.length === 0) || pivotCfg.values.length === 0) {
            dispatch({ type: "SET_PIVOT_RESULT", payload: { rows: [], columnValues: [], dimensionLabels: {} } });
            break;
          }
          const data = await getDynamicReportData(pivotCfg);
          if (fetchId !== fetchIdRef.current) return;
          dispatch({ type: "SET_PIVOT_RESULT", payload: data });
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
    fetchData(state.tab, state.period, state.budgetYear, state.budgetMonth, state.customDateFrom, state.customDateTo, state.pivotConfig);
  }, [state.tab, state.period, state.budgetYear, state.budgetMonth, state.customDateFrom, state.customDateTo, state.pivotConfig, fetchData]);

  const setTab = useCallback((tab: ReportTab) => {
    dispatch({ type: "SET_TAB", payload: tab });
  }, []);

  const setPeriod = useCallback((period: DashboardPeriod) => {
    dispatch({ type: "SET_PERIOD", payload: period });
  }, []);

  const navigateBudgetMonth = useCallback((delta: -1 | 1) => {
    let newMonth = state.budgetMonth + delta;
    let newYear = state.budgetYear;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    dispatch({ type: "SET_BUDGET_MONTH", payload: { year: newYear, month: newMonth } });
  }, [state.budgetYear, state.budgetMonth]);

  const setCustomDates = useCallback((dateFrom: string, dateTo: string) => {
    dispatch({ type: "SET_CUSTOM_DATES", payload: { dateFrom, dateTo } });
  }, []);

  const setPivotConfig = useCallback((config: PivotConfig) => {
    dispatch({ type: "SET_PIVOT_CONFIG", payload: config });
  }, []);

  return { state, setTab, setPeriod, setCustomDates, navigateBudgetMonth, setPivotConfig };
}
