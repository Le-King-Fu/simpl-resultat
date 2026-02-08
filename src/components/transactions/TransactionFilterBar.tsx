import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import type { TransactionFilters, Category, ImportSource } from "../../shared/types";

interface TransactionFilterBarProps {
  filters: TransactionFilters;
  categories: Category[];
  sources: ImportSource[];
  onFilterChange: (key: keyof TransactionFilters, value: unknown) => void;
}

export default function TransactionFilterBar({
  filters,
  categories,
  sources,
  onFilterChange,
}: TransactionFilterBarProps) {
  const { t } = useTranslation();

  const activeCount = [
    filters.search,
    filters.categoryId !== null || filters.uncategorizedOnly,
    filters.sourceId !== null,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
          />
          <input
            type="text"
            placeholder={t("transactions.filters.searchPlaceholder")}
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Category */}
        <select
          value={
            filters.uncategorizedOnly
              ? "uncategorized"
              : filters.categoryId?.toString() ?? ""
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "uncategorized") {
              onFilterChange("uncategorizedOnly", true);
              onFilterChange("categoryId", null);
            } else {
              onFilterChange("uncategorizedOnly", false);
              onFilterChange("categoryId", val ? Number(val) : null);
            }
          }}
          className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">{t("transactions.filters.allCategories")}</option>
          <option value="uncategorized">
            {t("transactions.filters.uncategorized")}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Source */}
        <select
          value={filters.sourceId?.toString() ?? ""}
          onChange={(e) =>
            onFilterChange("sourceId", e.target.value ? Number(e.target.value) : null)
          }
          className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        >
          <option value="">{t("transactions.filters.allSources")}</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) =>
              onFilterChange("dateFrom", e.target.value || null)
            }
            placeholder={t("transactions.filters.dateFrom")}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
          <span className="text-[var(--muted-foreground)] text-sm">—</span>
          <input
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) =>
              onFilterChange("dateTo", e.target.value || null)
            }
            placeholder={t("transactions.filters.dateTo")}
            className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          />
        </div>

        {/* Active filter count */}
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-[var(--primary)] text-white">
            {activeCount}
          </span>
        )}
      </div>
    </div>
  );
}
