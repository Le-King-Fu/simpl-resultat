import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RotateCcw, List } from "lucide-react";
import { PageHelp } from "../components/shared/PageHelp";
import { useCategories } from "../hooks/useCategories";
import CategoryTree from "../components/categories/CategoryTree";
import CategoryDetailPanel from "../components/categories/CategoryDetailPanel";
import AllKeywordsPanel from "../components/categories/AllKeywordsPanel";

export default function CategoriesPage() {
  const { t } = useTranslation();
  const [showAllKeywords, setShowAllKeywords] = useState(false);
  const {
    state,
    selectCategory,
    startCreating,
    startEditing,
    cancelEditing,
    saveCategory,
    deleteCategory,
    addKeyword,
    editKeyword,
    removeKeyword,
    reinitializeCategories,
  } = useCategories();

  const handleReinitialize = async () => {
    if (confirm(t("categories.reinitializeConfirm"))) {
      await reinitializeCategories();
    }
  };

  const selectedCategory =
    state.selectedCategoryId !== null
      ? state.categories.find((c) => c.id === state.selectedCategoryId) ?? null
      : null;

  return (
    <div>
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{t("categories.title")}</h1>
          <PageHelp helpKey="categories" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllKeywords((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              showAllKeywords
                ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                : "border-[var(--border)] hover:bg-[var(--muted)]"
            }`}
          >
            <List size={16} />
            {t("categories.allKeywords")}
          </button>
          <button
            onClick={handleReinitialize}
            disabled={state.isSaving}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            <RotateCcw size={16} />
            {t("categories.reinitialize")}
          </button>
          <button
            onClick={startCreating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
          >
            <Plus size={16} />
            {t("categories.addCategory")}
          </button>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--negative)]/10 text-[var(--negative)] text-sm">
          {state.error}
        </div>
      )}

      {state.isLoading ? (
        <p className="text-[var(--muted-foreground)]">{t("common.loading")}</p>
      ) : showAllKeywords ? (
        <AllKeywordsPanel
          onSelectCategory={(id) => {
            setShowAllKeywords(false);
            selectCategory(id);
          }}
        />
      ) : (
        <div className="flex gap-6" style={{ minHeight: "calc(100vh - 180px)" }}>
          <div className="w-1/3 bg-[var(--card)] rounded-xl border border-[var(--border)] p-3 overflow-y-auto">
            <CategoryTree
              tree={state.tree}
              selectedId={state.selectedCategoryId}
              onSelect={selectCategory}
            />
          </div>
          <CategoryDetailPanel
            categories={state.categories}
            selectedCategory={selectedCategory}
            keywords={state.keywords}
            editingCategory={state.editingCategory}
            isCreating={state.isCreating}
            isSaving={state.isSaving}
            onStartEditing={startEditing}
            onCancelEditing={cancelEditing}
            onSave={saveCategory}
            onDelete={deleteCategory}
            onAddKeyword={addKeyword}
            onUpdateKeyword={editKeyword}
            onRemoveKeyword={removeKeyword}
          />
        </div>
      )}
    </div>
  );
}
