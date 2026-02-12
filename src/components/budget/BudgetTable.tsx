import { useState, useRef, useEffect, Fragment } from "react";
import { useTranslation } from "react-i18next";
import type { BudgetRow } from "../../shared/types";

const fmt = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" });

interface BudgetTableProps {
  rows: BudgetRow[];
  onUpdatePlanned: (categoryId: number, amount: number) => void;
}

export default function BudgetTable({ rows, onUpdatePlanned }: BudgetTableProps) {
  const { t } = useTranslation();
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCategoryId !== null && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCategoryId]);

  const handleStartEdit = (row: BudgetRow) => {
    setEditingCategoryId(row.category_id);
    setEditingValue(row.planned === 0 ? "" : String(row.planned));
  };

  const handleSave = () => {
    if (editingCategoryId === null) return;
    const amount = parseFloat(editingValue) || 0;
    onUpdatePlanned(editingCategoryId, amount);
    setEditingCategoryId(null);
  };

  const handleCancel = () => {
    setEditingCategoryId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  // Group rows by type
  const grouped: Record<string, BudgetRow[]> = {};
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

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalActual = rows.reduce((s, r) => s + Math.abs(r.actual), 0);
  const totalDifference = totalPlanned - totalActual;

  if (rows.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("budget.noCategories")}</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th className="text-left py-3 px-4 font-medium text-[var(--muted-foreground)]">
              {t("budget.category")}
            </th>
            <th className="text-right py-3 px-4 font-medium text-[var(--muted-foreground)] w-36">
              {t("budget.planned")}
            </th>
            <th className="text-right py-3 px-4 font-medium text-[var(--muted-foreground)] w-36">
              {t("budget.actual")}
            </th>
            <th className="text-right py-3 px-4 font-medium text-[var(--muted-foreground)] w-36">
              {t("budget.difference")}
            </th>
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
                    colSpan={4}
                    className="py-2 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] bg-[var(--muted)]"
                  >
                    {t(typeLabelKeys[type])}
                  </td>
                </tr>
                {group.map((row) => (
                  <tr
                    key={row.category_id}
                    className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--muted)] transition-colors"
                  >
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: row.category_color }}
                        />
                        <span>{row.category_name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {editingCategoryId === row.category_id ? (
                        <input
                          ref={inputRef}
                          type="number"
                          step="0.01"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={handleSave}
                          onKeyDown={handleKeyDown}
                          className="w-full text-right bg-[var(--background)] border border-[var(--border)] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      ) : (
                        <button
                          onClick={() => handleStartEdit(row)}
                          className="w-full text-right hover:text-[var(--primary)] transition-colors cursor-text"
                        >
                          {row.planned === 0 ? (
                            <span className="text-[var(--muted-foreground)]">—</span>
                          ) : (
                            fmt.format(row.planned)
                          )}
                        </button>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {row.actual === 0 ? (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      ) : (
                        fmt.format(Math.abs(row.actual))
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {row.planned === 0 && row.actual === 0 ? (
                        <span className="text-[var(--muted-foreground)]">—</span>
                      ) : (
                        <span
                          className={
                            row.difference >= 0
                              ? "text-[var(--positive)]"
                              : "text-[var(--negative)]"
                          }
                        >
                          {fmt.format(row.difference)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </Fragment>
            );
          })}
          <tr className="bg-[var(--muted)] font-semibold">
            <td className="py-3 px-4">{t("common.total")}</td>
            <td className="py-3 px-4 text-right">{fmt.format(totalPlanned)}</td>
            <td className="py-3 px-4 text-right">{fmt.format(totalActual)}</td>
            <td className="py-3 px-4 text-right">
              <span
                className={
                  totalDifference >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                }
              >
                {fmt.format(totalDifference)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
