import type { NavItem } from "../types";

export const APP_NAME = "Simpl'Résultat";
export const DB_NAME = "sqlite:simpl_resultat.db";

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    path: "/",
    icon: "LayoutDashboard",
    labelKey: "nav.dashboard",
  },
  {
    key: "import",
    path: "/import",
    icon: "Upload",
    labelKey: "nav.import",
  },
  {
    key: "transactions",
    path: "/transactions",
    icon: "ArrowLeftRight",
    labelKey: "nav.transactions",
  },
  {
    key: "categories",
    path: "/categories",
    icon: "Tags",
    labelKey: "nav.categories",
  },
  {
    key: "adjustments",
    path: "/adjustments",
    icon: "SlidersHorizontal",
    labelKey: "nav.adjustments",
  },
  {
    key: "budget",
    path: "/budget",
    icon: "PiggyBank",
    labelKey: "nav.budget",
  },
  {
    key: "reports",
    path: "/reports",
    icon: "BarChart3",
    labelKey: "nav.reports",
  },
];
