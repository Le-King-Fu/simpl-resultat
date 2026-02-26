import { useState, useRef, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ArrowUpDown } from "lucide-react";
import type { BudgetYearRow } from "../../shared/types";

const fmt = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const MONTH_KEYS = [
  "months.jan", "months.feb", "months.mar", "months.apr",
  "months.may", "months.jun", "months.jul", "months.aug",
  "months.sep", "months.oct", "months.nov", "months.dec",
] as const;

const STORAGE_KEY = "subtotals-position";

function reorderRows<T extends { is_parent: boolean; parent_id: number | null; category_id: number; depth?: 0 | 1 | 2 }>(
  rows: T[],
  subtotalsOnTop: boolean,
): T[] {
  if (subtotalsOnTop) return rows;
  // Group depth-0 parents with all their descendants, then move subtotals to bottom
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
    // Also move intermediate subtotals (depth-1 parents) to bottom of their sub-groups
    const reorderedChildren: T[] = [];
    let subParent: T | null = null;
    const subChildren: T[] = [];
    for (const child of children) {
      if (child.is_parent && (child.depth ?? 0) === 1) {
        // Flush previous sub-group
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

interface BudgetTableProps {
  rows: BudgetYearRow[];
  onUpdatePlanned: (categoryId: number, month: number, amount: number) => void;
  onSplitEvenly: (categoryId: number, annualAmount: number) => void;
}

export default function BudgetTable({ rows, onUpdatePlanned, onSplitEvenly }: BudgetTableProps) {
  const { t } = useTranslation();
  const [editingCell, setEditingCell] = useState<{ categoryId: number; monthIdx: number } | null>(null);
  const [editingAnnual, setEditingAnnual] = useState<{ categoryId: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
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
  const inputRef = useRef<HTMLInputElement>(null);
  const annualInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    if (editingAnnual && annualInputRef.current) {
      annualInputRef.current.focus();
      annualInputRef.current.select();
    }
  }, [editingAnnual]);

  const handleStartEdit = (categoryId: number, monthIdx: number, currentValue: number) => {
    setEditingAnnual(null);
    setEditingCell({ categoryId, monthIdx });
    setEditingValue(currentValue === 0 ? "" : String(currentValue));
  };

  const handleStartEditAnnual = (categoryId: number, currentValue: number) => {
    setEditingCell(null);
    setEditingAnnual({ categoryId });
    setEditingValue(currentValue === 0 ? "" : String(currentValue));
  };

  const handleSave = () => {
    if (!editingCell) return;
    const amount = parseFloat(editingValue) || 0;
    onUpdatePlanned(editingCell.categoryId, editingCell.monthIdx + 1, amount);
    setEditingCell(null);
  };

  const handleSaveAnnual = () => {
    if (!editingAnnual) return;
    const amount = parseFloat(editingValue) || 0;
    onSplitEvenly(editingAnnual.categoryId, amount);
    setEditingAnnual(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditingAnnual(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
    if (e.key === "Tab") {
      e.preventDefault();
      if (!editingCell) return;
      const amount = parseFloat(editingValue) || 0;
      onUpdatePlanned(editingCell.categoryId, editingCell.monthIdx + 1, amount);
      // Move to next month cell
      const nextMonth = editingCell.monthIdx + (e.shiftKey ? -1 : 1);
      if (nextMonth >= 0 && nextMonth < 12) {
        const row = rows.find((r) => r.category_id === editingCell.categoryId && !r.is_parent);
        if (row) {
          handleStartEdit(editingCell.categoryId, nextMonth, row.months[nextMonth]);
        }
      } else {
        setEditingCell(null);
      }
    }
  };

  const handleAnnualKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveAnnual();
    if (e.key === "Escape") handleCancel();
  };

  // Sign multiplier: expenses negative, income/transfer positive
  const signFor = (type: string) => (type === "expense" ? -1 : 1);

  // Group rows by type
  const grouped: Record<string, BudgetYearRow[]> = {};
  for (const row of rows) {
    const key = row.category_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }

  const typeOrder = ["expense", "income", "transfer"] as const;
  const typeLabelKeys: Record<string, string> = {
    expense: "budget.expenses",
    income: "budget.income",
    transfer: "budget.transfers",
  };

  // Column totals with sign convention (only count leaf rows to avoid double-counting parents)
  const monthTotals: number[] = Array(12).fill(0);
  let annualTotal = 0;
  for (const row of rows) {
    if (row.is_parent) continue; // skip parent subtotals to avoid double-counting
    const sign = signFor(row.category_type);
    for (let m = 0; m < 12; m++) {
      monthTotals[m] += row.months[m] * sign;
    }
    annualTotal += row.annual * sign;
  }

  const totalCols = 14; // category + annual + 12 months

  if (rows.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("budget.noCategories")}</p>
      </div>
    );
  }

  const formatSigned = (value: number) => {
    if (value === 0) return <span className="text-[var(--muted-foreground)]">—</span>;
    const color = value > 0 ? "text-[var(--positive)]" : "text-[var(--negative)]";
    return <span className={color}>{fmt.format(value)}</span>;
  };

  const renderRow = (row: BudgetYearRow) => {
    const sign = signFor(row.category_type);
    const isChild = row.parent_id !== null && !row.is_parent;
    const depth = row.depth ?? (isChild ? 1 : 0);
    // Unique key: parent rows and "(direct)" fake children can share the same category_id
    const rowKey = row.is_parent ? `parent-${row.category_id}` : `leaf-${row.category_id}-${row.category_name}`;

    if (row.is_parent) {
      // Parent subtotal row: read-only, bold, distinct background
      const parentDepth = row.depth ?? 0;
      const isIntermediateParent = parentDepth === 1;
      return (
        <tr
          key={rowKey}
          className={`border-b border-[var(--border)] ${isIntermediateParent ? "bg-[var(--muted)]/15" : "bg-[var(--muted)]/30"}`}
        >
          <td className={`py-2 sticky left-0 z-10 ${isIntermediateParent ? "pl-8 pr-3 bg-[var(--muted)]/15" : "px-3 bg-[var(--muted)]/30"}`}>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: row.category_color }}
              />
              <span className={`truncate text-xs ${isIntermediateParent ? "font-medium" : "font-semibold"}`}>{row.category_name}</span>
            </div>
          </td>
          <td className={`py-2 px-2 text-right text-xs ${isIntermediateParent ? "font-medium" : "font-semibold"}`}>
            {formatSigned(row.annual * sign)}
          </td>
          {row.months.map((val, mIdx) => (
            <td key={mIdx} className={`py-2 px-2 text-right text-xs ${isIntermediateParent ? "font-medium" : "font-semibold"}`}>
              {formatSigned(val * sign)}
            </td>
          ))}
        </tr>
      );
    }

    // Leaf / child row: editable
    return (
      <tr
        key={rowKey}
        className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/50 transition-colors"
      >
        {/* Category name - sticky */}
        <td className={`py-2 sticky left-0 bg-[var(--card)] z-10 ${depth === 2 ? "pl-14 pr-3" : depth === 1 ? "pl-8 pr-3" : "px-3"}`}>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: row.category_color }}
            />
            <span className="truncate text-xs">{row.category_name}</span>
          </div>
        </td>
        {/* Annual total — editable */}
        <td className="py-2 px-2 text-right">
          {editingAnnual?.categoryId === row.category_id ? (
            <input
              ref={annualInputRef}
              type="number"
              step="0.01"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onBlur={handleSaveAnnual}
              onKeyDown={handleAnnualKeyDown}
              className="w-full text-right bg-[var(--background)] border border-[var(--border)] rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          ) : (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleStartEditAnnual(row.category_id, row.annual)}
                className="font-medium text-xs hover:text-[var(--primary)] transition-colors cursor-text"
              >
                {formatSigned(row.annual * sign)}
              </button>
              {(() => {
                const monthSum = row.months.reduce((s, v) => s + v, 0);
                return row.annual !== 0 && Math.abs(row.annual - monthSum) > 0.01 ? (
                  <span title={t("budget.annualMismatch")} className="text-[var(--negative)]">
                    <AlertTriangle size={13} />
                  </span>
                ) : null;
              })()}
            </div>
          )}
        </td>
        {/* 12 month cells */}
        {row.months.map((val, mIdx) => (
          <td key={mIdx} className="py-2 px-2 text-right">
            {editingCell?.categoryId === row.category_id && editingCell.monthIdx === mIdx ? (
              <input
                ref={inputRef}
                type="number"
                step="0.01"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="w-full text-right bg-[var(--background)] border border-[var(--border)] rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            ) : (
              <button
                onClick={() => handleStartEdit(row.category_id, mIdx, val)}
                className="w-full text-right hover:text-[var(--primary)] transition-colors cursor-text text-xs"
              >
                {formatSigned(val * sign)}
              </button>
            )}
          </td>
        ))}
      </tr>
    );
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
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
      <table className="w-full text-sm whitespace-nowrap">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-2.5 px-3 font-medium text-[var(--muted-foreground)] sticky left-0 bg-[var(--card)] z-10 min-w-[140px]">
              {t("budget.category")}
            </th>
            <th className="text-right py-2.5 px-2 font-medium text-[var(--muted-foreground)] min-w-[90px]">
              {t("budget.annual")}
            </th>
            {MONTH_KEYS.map((key) => (
              <th key={key} className="text-right py-2.5 px-2 font-medium text-[var(--muted-foreground)] min-w-[70px]">
                {t(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {typeOrder.map((type) => {
            const group = grouped[type];
            if (!group || group.length === 0) return null;
            return (
              <Fragment key={type}>
                <tr>
                  <td
                    colSpan={totalCols}
                    className="py-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] bg-[var(--muted)]"
                  >
                    {t(typeLabelKeys[type])}
                  </td>
                </tr>
                {reorderRows(group, subtotalsOnTop).map((row) => renderRow(row))}
              </Fragment>
            );
          })}
          {/* Totals row */}
          <tr className="bg-[var(--muted)] font-semibold">
            <td className="py-2.5 px-3 sticky left-0 bg-[var(--muted)] z-10 text-xs">{t("common.total")}</td>
            <td className="py-2.5 px-2 text-right text-xs">{formatSigned(annualTotal)}</td>
            {monthTotals.map((total, mIdx) => (
              <td key={mIdx} className="py-2.5 px-2 text-right text-xs">
                {formatSigned(total)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  );
}
