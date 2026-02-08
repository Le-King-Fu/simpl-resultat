import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import type { CategoryTreeNode, CategoryFormData, Keyword } from "../../shared/types";
import CategoryForm from "./CategoryForm";
import KeywordList from "./KeywordList";

interface Props {
  categories: CategoryTreeNode[];
  selectedCategory: CategoryTreeNode | null;
  keywords: Keyword[];
  editingCategory: CategoryFormData | null;
  isCreating: boolean;
  isSaving: boolean;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onSave: (data: CategoryFormData) => void;
  onDelete: (id: number) => Promise<{ blocked: boolean; count: number }>;
  onAddKeyword: (keyword: string, priority: number) => void;
  onUpdateKeyword: (id: number, keyword: string, priority: number) => void;
  onRemoveKeyword: (id: number) => void;
}

export default function CategoryDetailPanel({
  categories,
  selectedCategory,
  keywords,
  editingCategory,
  isCreating,
  isSaving,
  onStartEditing,
  onCancelEditing,
  onSave,
  onDelete,
  onAddKeyword,
  onUpdateKeyword,
  onRemoveKeyword,
}: Props) {
  const { t } = useTranslation();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!selectedCategory) return;
    if (!confirm(t("categories.deleteConfirm"))) return;
    setDeleteError(null);
    const result = await onDelete(selectedCategory.id);
    if (result.blocked) {
      setDeleteError(t("categories.deleteBlocked", { count: result.count }));
    }
  };

  // No selection and not creating
  if (!selectedCategory && !isCreating) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--card)] rounded-xl border border-[var(--border)] p-8">
        <p className="text-[var(--muted-foreground)]">{t("categories.selectCategory")}</p>
      </div>
    );
  }

  // Creating new
  if (isCreating && editingCategory) {
    return (
      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{t("categories.addCategory")}</h2>
        <CategoryForm
          initialData={editingCategory}
          categories={categories}
          isCreating
          isSaving={isSaving}
          onSave={onSave}
          onCancel={onCancelEditing}
        />
      </div>
    );
  }

  if (!selectedCategory) return null;

  // Editing existing
  if (editingCategory) {
    return (
      <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">{t("categories.editCategory")}</h2>
        {deleteError && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--negative)]/10 text-[var(--negative)] text-sm">
            {deleteError}
          </div>
        )}
        <CategoryForm
          initialData={editingCategory}
          categories={categories}
          isCreating={false}
          isSaving={isSaving}
          onSave={onSave}
          onCancel={onCancelEditing}
          onDelete={handleDelete}
        />
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <KeywordList
            keywords={keywords}
            onAdd={onAddKeyword}
            onUpdate={onUpdateKeyword}
            onRemove={onRemoveKeyword}
          />
        </div>
      </div>
    );
  }

  // Read-only view
  return (
    <div className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: selectedCategory.color ?? "#9ca3af" }}
          />
          <h2 className="text-lg font-semibold">{selectedCategory.name}</h2>
        </div>
        <button
          onClick={onStartEditing}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--muted)]"
        >
          <Pencil size={14} />
          {t("common.edit")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div>
          <span className="text-[var(--muted-foreground)]">{t("categories.type")}</span>
          <p className="font-medium capitalize">{t(`categories.${selectedCategory.type}`)}</p>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">{t("categories.sortOrder")}</span>
          <p className="font-medium">{selectedCategory.sort_order}</p>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">{t("categories.parent")}</span>
          <p className="font-medium">
            {selectedCategory.parent_id
              ? categories.find((c) => c.id === selectedCategory.parent_id)?.name ?? "—"
              : t("categories.noParent")}
          </p>
        </div>
        <div>
          <span className="text-[var(--muted-foreground)]">{t("categories.keywordCount")}</span>
          <p className="font-medium">{selectedCategory.keyword_count}</p>
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-4">
        <KeywordList
          keywords={keywords}
          onAdd={onAddKeyword}
          onUpdate={onUpdateKeyword}
          onRemove={onRemoveKeyword}
        />
      </div>
    </div>
  );
}
