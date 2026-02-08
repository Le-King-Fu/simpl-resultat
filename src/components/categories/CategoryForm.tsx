import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import type { CategoryFormData, CategoryTreeNode } from "../../shared/types";

const PRESET_COLORS = [
  "#4A90A4",
  "#C17767",
  "#22c55e",
  "#ef4444",
  "#a855f7",
  "#f59e0b",
  "#6366f1",
  "#64748b",
  "#9ca3af",
];

interface Props {
  initialData: CategoryFormData;
  categories: CategoryTreeNode[];
  isCreating: boolean;
  isSaving: boolean;
  onSave: (data: CategoryFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function CategoryForm({
  initialData,
  categories,
  isCreating,
  isSaving,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CategoryFormData>(initialData);

  useEffect(() => {
    setForm(initialData);
  }, [initialData]);

  const parentOptions = categories.filter(
    (c) => c.parent_id === null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t("categories.name")}</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("categories.type")}</label>
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value as CategoryFormData["type"] })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="expense">{t("categories.expense")}</option>
          <option value="income">{t("categories.income")}</option>
          <option value="transfer">{t("categories.transfer")}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("categories.color")}</label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, color: c })}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                form.color === c ? "border-[var(--foreground)] scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="w-7 h-7 rounded-full border border-[var(--border)] cursor-pointer"
            title={t("categories.customColor")}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("categories.parent")}</label>
        <select
          value={form.parent_id ?? ""}
          onChange={(e) =>
            setForm({ ...form, parent_id: e.target.value ? Number(e.target.value) : null })
          }
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">{t("categories.noParent")}</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("categories.sortOrder")}</label>
        <input
          type="number"
          value={form.sort_order}
          onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
          className="w-24 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="submit"
          disabled={isSaving || !form.name.trim()}
          className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]"
        >
          {t("common.cancel")}
        </button>
        {!isCreating && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="ml-auto px-3 py-2 rounded-lg text-[var(--negative)] hover:bg-[var(--negative)]/10 text-sm flex items-center gap-1"
          >
            <Trash2 size={14} />
            {t("common.delete")}
          </button>
        )}
      </div>
    </form>
  );
}
