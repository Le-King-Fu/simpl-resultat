import { useTranslation } from "react-i18next";
import { RefreshCw } from "lucide-react";
import type { Adjustment } from "../../shared/types";
import type { AdjustmentEntryWithCategory } from "../../services/adjustmentService";

interface Props {
  adjustments: Adjustment[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  entriesByAdjustment: Map<number, AdjustmentEntryWithCategory[]>;
}

export default function AdjustmentListPanel({
  adjustments,
  selectedId,
  onSelect,
  entriesByAdjustment,
}: Props) {
  const { t } = useTranslation();

  if (adjustments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--muted-foreground)] text-sm">
        {t("common.noResults")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {adjustments.map((adj) => {
        const isSelected = adj.id === selectedId;
        const entries = entriesByAdjustment.get(adj.id);
        const total = entries
          ? entries.reduce((sum, e) => sum + e.amount, 0)
          : null;

        return (
          <button
            key={adj.id}
            onClick={() => onSelect(adj.id)}
            className={`w-full flex flex-col gap-1 px-3 py-2.5 text-left rounded-lg transition-colors
              ${isSelected ? "bg-[var(--muted)] border-l-2 border-[var(--primary)]" : "hover:bg-[var(--muted)]/50"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm truncate">{adj.name}</span>
              {adj.is_recurring && (
                <RefreshCw size={12} className="text-[var(--primary)] flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[var(--muted-foreground)]">{adj.date}</span>
              {total !== null && (
                <span
                  className={`text-xs font-medium ${
                    total >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  }`}
                >
                  {total >= 0 ? "+" : ""}
                  {total.toFixed(2)}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
