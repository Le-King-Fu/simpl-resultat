import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import {
  getAllKeywordsWithCategory,
  type KeywordWithCategory,
} from "../../services/categoryService";

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface AllKeywordsPanelProps {
  onSelectCategory: (id: number) => void;
}

export default function AllKeywordsPanel({
  onSelectCategory,
}: AllKeywordsPanelProps) {
  const { t } = useTranslation();
  const [keywords, setKeywords] = useState<KeywordWithCategory[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      const data = await getAllKeywordsWithCategory();
      if (!cancelled) {
        setKeywords(data);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedSearch = normalize(search);
  const filtered = search
    ? keywords.filter(
        (k) =>
          normalize(k.keyword).includes(normalizedSearch) ||
          normalize(k.category_name).includes(normalizedSearch)
      )
    : keywords;

  if (isLoading) {
    return (
      <p className="text-[var(--muted-foreground)]">{t("common.loading")}</p>
    );
  }

  return (
    <div
      className="flex-1 bg-[var(--card)] rounded-xl border border-[var(--border)] p-4 overflow-y-auto"
      style={{ minHeight: "calc(100vh - 180px)" }}
    >
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-[var(--muted-foreground)] text-sm text-center py-8">
          {keywords.length === 0
            ? t("categories.allKeywordsEmpty")
            : t("common.noResults")}
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--muted-foreground)] border-b border-[var(--border)]">
              <th className="pb-2 font-medium">
                {t("categories.keywords")}
              </th>
              <th className="pb-2 font-medium">{t("categories.priority")}</th>
              <th className="pb-2 font-medium">{t("transactions.category")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((k) => (
              <tr
                key={k.id}
                className="border-b border-[var(--border)] last:border-0"
              >
                <td className="py-2 font-mono">{k.keyword}</td>
                <td className="py-2">{k.priority}</td>
                <td className="py-2">
                  <button
                    onClick={() => onSelectCategory(k.category_id)}
                    className="flex items-center gap-2 hover:underline"
                  >
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: k.category_color || "#6b7280" }}
                    />
                    {k.category_name}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
