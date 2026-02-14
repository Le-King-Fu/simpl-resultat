import { ChevronLeft, ChevronRight } from "lucide-react";

interface YearNavigatorProps {
  year: number;
  onNavigate: (delta: -1 | 1) => void;
}

export default function YearNavigator({ year, onNavigate }: YearNavigatorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onNavigate(-1)}
        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        aria-label="Previous year"
      >
        <ChevronLeft size={18} />
      </button>
      <span className="min-w-[5rem] text-center font-medium">{year}</span>
      <button
        onClick={() => onNavigate(1)}
        className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
        aria-label="Next year"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
