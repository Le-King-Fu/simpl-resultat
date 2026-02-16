import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Trash2 } from "lucide-react";
import type { TransactionRow, Category, SplitChild } from "../../shared/types";
import CategoryCombobox from "../shared/CategoryCombobox";

interface SplitEntry {
  category_id: number | null;
  amount: string;
  description: string;
}

interface Props {
  transaction: TransactionRow;
  categories: Category[];
  onLoadChildren: (parentId: number) => Promise<SplitChild[]>;
  onSave: (
    parentId: number,
    entries: Array<{ category_id: number; amount: number; description: string }>
  ) => Promise<void>;
  onDelete: (parentId: number) => Promise<void>;
  onClose: () => void;
}

export default function SplitAdjustmentModal({
  transaction,
  categories,
  onLoadChildren,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<SplitEntry[]>([
    { category_id: null, amount: "", description: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isExpense = transaction.amount < 0;
  const absOriginal = Math.abs(transaction.amount);

  // Load existing children if this is already split
  useEffect(() => {
    if (!transaction.is_split) return;
    setLoading(true);
    onLoadChildren(transaction.id).then((children) => {
      // Filter out the offset child (same category as parent)
      const splitEntries = children.filter(
        (c) => c.category_id !== transaction.category_id || Math.sign(c.amount) === Math.sign(transaction.amount)
      );
      if (splitEntries.length > 0) {
        setEntries(
          splitEntries.map((c) => ({
            category_id: c.category_id,
            amount: Math.abs(c.amount).toFixed(2),
            description: c.description,
          }))
        );
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const parsedAmounts = useMemo(
    () => entries.map((e) => parseFloat(e.amount) || 0),
    [entries]
  );
  const splitTotal = useMemo(
    () => parsedAmounts.reduce((s, a) => s + a, 0),
    [parsedAmounts]
  );
  const remainder = +(absOriginal - splitTotal).toFixed(2);

  const isValid =
    entries.length > 0 &&
    entries.every((e) => e.category_id !== null && (parseFloat(e.amount) || 0) > 0) &&
    splitTotal > 0 &&
    remainder >= 0;

  const updateEntry = (index: number, field: keyof SplitEntry, value: string | number | null) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { category_id: null, amount: "", description: "" }]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave(
        transaction.id,
        entries.map((e) => ({
          category_id: e.category_id!,
          amount: isExpense
            ? -Math.abs(parseFloat(e.amount))
            : Math.abs(parseFloat(e.amount)),
          description: e.description || transaction.description,
        }))
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await onDelete(transaction.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--card)] rounded-xl shadow-xl w-full max-w-lg border border-[var(--border)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold">{t("transactions.splitAdjustment")}</h2>
            <p className="text-sm text-[var(--muted-foreground)] truncate max-w-xs">
              {transaction.description}
              <span
                className={`ml-2 font-mono ${
                  transaction.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                }`}
              >
                {transaction.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-[var(--muted-foreground)]">{t("common.loading")}</p>
          ) : (
            <>
              {/* Original category remainder row */}
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[var(--muted)] text-sm">
                <span className="shrink-0 text-[var(--muted-foreground)]">
                  {t("transactions.splitBase")}:
                </span>
                {transaction.category_color && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: transaction.category_color }}
                  />
                )}
                <span className="truncate">{transaction.category_name}</span>
                <span className="ml-auto font-mono whitespace-nowrap">
                  {isExpense ? "-" : ""}
                  {remainder.toFixed(2)}
                </span>
              </div>

              {/* Split entry rows */}
              {entries.map((entry, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <CategoryCombobox
                      categories={categories}
                      value={entry.category_id}
                      onChange={(id) => updateEntry(index, "category_id", id)}
                      placeholder={t("transactions.splitCategory")}
                      compact
                    />
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={entry.amount}
                    onChange={(e) => updateEntry(index, "amount", e.target.value)}
                    placeholder={t("transactions.splitAmount")}
                    className="w-24 px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] text-right font-mono focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <input
                    type="text"
                    value={entry.description}
                    onChange={(e) => updateEntry(index, "description", e.target.value)}
                    placeholder={t("transactions.splitDescription")}
                    className="w-32 px-2 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                  <button
                    onClick={() => removeEntry(index)}
                    className="p-1.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--negative)] transition-colors shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {/* Add row */}
              <button
                onClick={addEntry}
                className="flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
              >
                <Plus size={14} />
                {t("transactions.splitAddRow")}
              </button>

              {/* Validation message */}
              {remainder < 0 && (
                <p className="text-xs text-[var(--negative)]">
                  {t("transactions.splitTotal")}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
          <div>
            {transaction.is_split && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-[var(--negative)] hover:underline"
              >
                {t("transactions.splitRemove")}
              </button>
            )}
            {confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--negative)]">
                  {t("transactions.splitDeleteConfirm")}
                </span>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-2 py-1 text-xs rounded bg-[var(--negative)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {t("common.delete")}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 text-xs rounded border border-[var(--border)] hover:bg-[var(--muted)]"
                >
                  {t("common.cancel")}
                </button>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="px-4 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {t("common.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
