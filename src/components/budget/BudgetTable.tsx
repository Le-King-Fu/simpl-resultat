import { useState, useRef, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
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
        const row = rows.find((r) => r.category_id === editingCell.categoryId);
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

  // Column totals
  const monthTotals: number[] = Array(12).fill(0);
  let annualTotal = 0;
  for (const row of rows) {
    for (let m = 0; m < 12; m++) {
      monthTotals[m] += row.months[m];
    }
    annualTotal += row.annual;
  }

  const totalCols = 14; // category + annual + 12 months

  if (rows.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("budget.noCategories")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-x-auto">
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
                {group.map((row) => (
                  <tr
                    key={row.category_id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)]/50 transition-colors"
                  >
                    {/* Category name - sticky */}
                    <td className="py-2 px-3 sticky left-0 bg-[var(--card)] z-10">
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
                            {row.annual === 0 ? (
                              <span className="text-[var(--muted-foreground)]">—</span>
                            ) : (
                              fmt.format(row.annual)
                            )}
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
                            {val === 0 ? (
                              <span className="text-[var(--muted-foreground)]">—</span>
                            ) : (
                              fmt.format(val)
                            )}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            );
          })}
          {/* Totals row */}
          <tr className="bg-[var(--muted)] font-semibold">
            <td className="py-2.5 px-3 sticky left-0 bg-[var(--muted)] z-10 text-xs">{t("common.total")}</td>
            <td className="py-2.5 px-2 text-right text-xs">{fmt.format(annualTotal)}</td>
            {monthTotals.map((total, mIdx) => (
              <td key={mIdx} className="py-2.5 px-2 text-right text-xs">
                {fmt.format(total)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
