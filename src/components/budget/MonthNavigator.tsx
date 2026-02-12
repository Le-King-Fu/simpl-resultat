import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthNavigatorProps {
  year: number;
  month: number;
  onNavigate: (delta: -1 | 1) => void;
}

export default function MonthNavigator({ year, month, onNavigate }: MonthNavigatorProps) {
  const { i18n } = useTranslation();

  const label = new Intl.DateTimeFormat(i18n.language, { month: "long", year: "numeric" }).format(
    new Date(year, month - 1)
  );

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onNavigate(-1)}
        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-[10rem] text-center font-medium capitalize">{label}</span>
      <button
        onClick={() => onNavigate(1)}
        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        aria-label="Next month"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
