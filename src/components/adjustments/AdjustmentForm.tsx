import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import type { Category } from "../../shared/types";
import type { AdjustmentFormData, EntryFormData } from "../../hooks/useAdjustments";

interface Props {
  initialData: AdjustmentFormData;
  initialEntries: EntryFormData[];
  categories: Category[];
  isCreating: boolean;
  isSaving: boolean;
  onSave: (data: AdjustmentFormData, entries: EntryFormData[]) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

export default function AdjustmentForm({
  initialData,
  initialEntries,
  categories,
  isCreating,
  isSaving,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AdjustmentFormData>(initialData);
  const [entries, setEntries] = useState<EntryFormData[]>(initialEntries);

  useEffect(() => {
    setForm(initialData);
    setEntries(initialEntries);
  }, [initialData, initialEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() }, entries);
  };

  const addEntry = () => {
    const defaultCategoryId = categories.length > 0 ? categories[0].id : 0;
    setEntries([...entries, { category_id: defaultCategoryId, amount: 0, description: "" }]);
  };

  const updateEntryField = (index: number, field: keyof EntryFormData, value: unknown) => {
    setEntries(entries.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t("adjustments.name")}</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("adjustments.date")}</label>
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t("adjustments.description")}</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.is_recurring}
          onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          className="rounded border-[var(--border)]"
        />
        {t("adjustments.recurring")}
      </label>

      {/* Entries */}
      <div className="border-t border-[var(--border)] pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{t("adjustments.entries")}</h3>
          <button
            type="button"
            onClick={addEntry}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10"
          >
            <Plus size={14} />
            {t("adjustments.addEntry")}
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="text-xs text-[var(--muted-foreground)]">{t("adjustments.noEntries")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <select
                  value={entry.category_id}
                  onChange={(e) => updateEntryField(index, "category_id", Number(e.target.value))}
                  className="flex-1 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={entry.amount}
                  onChange={(e) => updateEntryField(index, "amount", Number(e.target.value))}
                  className="w-28 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-right focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder={t("adjustments.amount")}
                />
                <input
                  type="text"
                  value={entry.description}
                  onChange={(e) => updateEntryField(index, "description", e.target.value)}
                  className="w-36 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  placeholder={t("adjustments.description")}
                />
                <button
                  type="button"
                  onClick={() => removeEntry(index)}
                  className="p-1.5 rounded-lg text-[var(--negative)] hover:bg-[var(--negative)]/10"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
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
