import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpDown } from "lucide-react";
import type { BudgetVsActualRow } from "../../shared/types";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(value);

const pctFormatter = (value: number | null) =>
  value == null ? "—" : `${(value * 100).toFixed(1)}%`;

function variationColor(value: number): string {
  if (value > 0) return "text-[var(--positive)]";
  if (value < 0) return "text-[var(--negative)]";
  return "";
}

interface BudgetVsActualTableProps {
  data: BudgetVsActualRow[];
}

const STORAGE_KEY = "subtotals-position";

function reorderRows<T extends { is_parent: boolean; parent_id: number | null; category_id: number; depth?: 0 | 1 | 2 }>(
  rows: T[],
  subtotalsOnTop: boolean,
): T[] {
  if (subtotalsOnTop) return rows;
  const groups: { parent: T | null; children: T[] }[] = [];
  let current: { parent: T | null; children: T[] } | null = null;
  for (const row of rows) {
    if (row.is_parent && (row.depth ?? 0) === 0) {
      if (current) groups.push(current);
      current = { parent: row, children: [] };
    } else if (current) {
      current.children.push(row);
    } else {
      if (current) groups.push(current);
      current = { parent: null, children: [row] };
    }
  }
  if (current) groups.push(current);
  return groups.flatMap(({ parent, children }) => {
    if (!parent) return children;
    const reorderedChildren: T[] = [];
    let subParent: T | null = null;
    const subChildren: T[] = [];
    for (const child of children) {
      if (child.is_parent && (child.depth ?? 0) === 1) {
        if (subParent) {
          reorderedChildren.push(...subChildren, subParent);
          subChildren.length = 0;
        }
        subParent = child;
      } else if (subParent && child.parent_id === subParent.category_id) {
        subChildren.push(child);
      } else {
        if (subParent) {
          reorderedChildren.push(...subChildren, subParent);
          subParent = null;
          subChildren.length = 0;
        }
        reorderedChildren.push(child);
      }
    }
    if (subParent) {
      reorderedChildren.push(...subChildren, subParent);
    }
    return [...reorderedChildren, parent];
  });
}

export default function BudgetVsActualTable({ data }: BudgetVsActualTableProps) {
  const { t } = useTranslation();
  const [subtotalsOnTop, setSubtotalsOnTop] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "top";
  });

  const toggleSubtotals = () => {
    setSubtotalsOnTop((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "top" : "bottom");
      return next;
    });
  };

  if (data.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center text-[var(--muted-foreground)]">
        {t("reports.bva.noData")}
      </div>
    );
  }

  // Group rows by type for section headers
  type SectionType = "expense" | "income" | "transfer";
  const sections: { type: SectionType; label: string; rows: BudgetVsActualRow[] }[] = [];
  const typeLabels: Record<SectionType, string> = {
    expense: t("budget.expenses"),
    income: t("budget.income"),
    transfer: t("budget.transfers"),
  };

  let currentType: SectionType | null = null;
  for (const row of data) {
    if (row.category_type !== currentType) {
      currentType = row.category_type;
      sections.push({ type: currentType, label: typeLabels[currentType], rows: [] });
    }
    sections[sections.length - 1].rows.push(row);
  }

  // Grand totals (leaf rows only)
  const leaves = data.filter((r) => !r.is_parent);
  const totals = leaves.reduce(
    (acc, r) => ({
      monthActual: acc.monthActual + r.monthActual,
      monthBudget: acc.monthBudget + r.monthBudget,
      monthVariation: acc.monthVariation + r.monthVariation,
      ytdActual: acc.ytdActual + r.ytdActual,
      ytdBudget: acc.ytdBudget + r.ytdBudget,
      ytdVariation: acc.ytdVariation + r.ytdVariation,
    }),
    { monthActual: 0, monthBudget: 0, monthVariation: 0, ytdActual: 0, ytdBudget: 0, ytdVariation: 0 }
  );
  const totalMonthPct = totals.monthBudget !== 0 ? totals.monthVariation / Math.abs(totals.monthBudget) : null;
  const totalYtdPct = totals.ytdBudget !== 0 ? totals.ytdVariation / Math.abs(totals.ytdBudget) : null;

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div className="flex justify-end px-3 py-2 border-b border-[var(--border)]">
        <button
          onClick={toggleSubtotals}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
        >
          <ArrowUpDown size={13} />
          {subtotalsOnTop ? t("reports.subtotalsOnTop") : t("reports.subtotalsOnBottom")}
        </button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th rowSpan={2} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)] align-bottom">
              {t("budget.category")}
            </th>
            <th colSpan={4} className="text-center px-3 py-1 font-medium text-[var(--muted-foreground)] border-l border-[var(--border)]">
              {t("reports.bva.monthly")}
            </th>
            <th colSpan={4} className="text-center px-3 py-1 font-medium text-[var(--muted-foreground)] border-l border-[var(--border)]">
              {t("reports.bva.ytd")}
            </th>
          </tr>
          <tr className="border-b border-[var(--border)]">
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)] border-l border-[var(--border)]">
              {t("budget.actual")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)]">
              {t("budget.planned")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)]">
              {t("reports.bva.dollarVar")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)]">
              {t("reports.bva.pctVar")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)] border-l border-[var(--border)]">
              {t("budget.actual")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)]">
              {t("budget.planned")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)]">
              {t("reports.bva.dollarVar")}
            </th>
            <th className="text-right px-3 py-1 font-medium text-[var(--muted-foreground)]">
              {t("reports.bva.pctVar")}
            </th>
          </tr>
        </thead>
        <tbody>
          {sections.map((section) => (
            <Fragment key={section.type}>
              <tr className="bg-[var(--muted)]/50">
                <td colSpan={9} className="px-3 py-1.5 font-semibold text-[var(--muted-foreground)] uppercase text-xs tracking-wider">
                  {section.label}
                </td>
              </tr>
              {reorderRows(section.rows, subtotalsOnTop).map((row) => {
                const isParent = row.is_parent;
                const depth = row.depth ?? (row.parent_id !== null && !row.is_parent ? 1 : 0);
                const isIntermediateParent = isParent && depth === 1;
                const paddingClass = depth === 2 ? "pl-14" : depth === 1 ? "pl-8" : "px-3";
                return (
                  <tr
                    key={`${row.category_id}-${row.is_parent}-${depth}`}
                    className={`border-b border-[var(--border)]/50 ${
                      isParent && !isIntermediateParent ? "bg-[var(--muted)]/30 font-semibold" :
                      isIntermediateParent ? "bg-[var(--muted)]/15 font-medium" : ""
                    }`}
                  >
                    <td className={`py-1.5 ${isParent && !isIntermediateParent ? "px-3" : paddingClass}`}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: row.category_color }}
                        />
                        {row.category_name}
                      </span>
                    </td>
                    <td className={`text-right px-3 py-1.5 border-l border-[var(--border)]/50`}>
                      {cadFormatter(row.monthActual)}
                    </td>
                    <td className="text-right px-3 py-1.5">{cadFormatter(row.monthBudget)}</td>
                    <td className={`text-right px-3 py-1.5 ${variationColor(row.monthVariation)}`}>
                      {cadFormatter(row.monthVariation)}
                    </td>
                    <td className={`text-right px-3 py-1.5 ${variationColor(row.monthVariation)}`}>
                      {pctFormatter(row.monthVariationPct)}
                    </td>
                    <td className={`text-right px-3 py-1.5 border-l border-[var(--border)]/50`}>
                      {cadFormatter(row.ytdActual)}
                    </td>
                    <td className="text-right px-3 py-1.5">{cadFormatter(row.ytdBudget)}</td>
                    <td className={`text-right px-3 py-1.5 ${variationColor(row.ytdVariation)}`}>
                      {cadFormatter(row.ytdVariation)}
                    </td>
                    <td className={`text-right px-3 py-1.5 ${variationColor(row.ytdVariation)}`}>
                      {pctFormatter(row.ytdVariationPct)}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
          {/* Grand totals */}
          <tr className="border-t-2 border-[var(--border)] font-bold bg-[var(--muted)]/20">
            <td className="px-3 py-2">{t("common.total")}</td>
            <td className="text-right px-3 py-2 border-l border-[var(--border)]/50">
              {cadFormatter(totals.monthActual)}
            </td>
            <td className="text-right px-3 py-2">{cadFormatter(totals.monthBudget)}</td>
            <td className={`text-right px-3 py-2 ${variationColor(totals.monthVariation)}`}>
              {cadFormatter(totals.monthVariation)}
            </td>
            <td className={`text-right px-3 py-2 ${variationColor(totals.monthVariation)}`}>
              {pctFormatter(totalMonthPct)}
            </td>
            <td className="text-right px-3 py-2 border-l border-[var(--border)]/50">
              {cadFormatter(totals.ytdActual)}
            </td>
            <td className="text-right px-3 py-2">{cadFormatter(totals.ytdBudget)}</td>
            <td className={`text-right px-3 py-2 ${variationColor(totals.ytdVariation)}`}>
              {cadFormatter(totals.ytdVariation)}
            </td>
            <td className={`text-right px-3 py-2 ${variationColor(totals.ytdVariation)}`}>
              {pctFormatter(totalYtdPct)}
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
