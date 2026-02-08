import { useTranslation } from "react-i18next";
import type { DashboardPeriod } from "../../shared/types";

const PERIODS: DashboardPeriod[] = ["month", "3months", "6months", "12months", "all"];

interface PeriodSelectorProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
}

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            p === value
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          {t(`dashboard.period.${p}`)}
        </button>
      ))}
    </div>
  );
}
