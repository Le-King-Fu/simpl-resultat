import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar } from "lucide-react";
import type { DashboardPeriod } from "../../shared/types";

const PERIODS: DashboardPeriod[] = ["month", "3months", "6months", "year", "12months", "all"];

interface PeriodSelectorProps {
  value: DashboardPeriod;
  onChange: (period: DashboardPeriod) => void;
  customDateFrom?: string;
  customDateTo?: string;
  onCustomDateChange?: (dateFrom: string, dateTo: string) => void;
}

export default function PeriodSelector({
  value,
  onChange,
  customDateFrom,
  customDateTo,
  onCustomDateChange,
}: PeriodSelectorProps) {
  const { t } = useTranslation();
  const [showCustom, setShowCustom] = useState(false);
  const [localFrom, setLocalFrom] = useState(customDateFrom ?? "");
  const [localTo, setLocalTo] = useState(customDateTo ?? "");
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (customDateFrom) setLocalFrom(customDateFrom);
    if (customDateTo) setLocalTo(customDateTo);
  }, [customDateFrom, customDateTo]);

  // Close panel on outside click
  useEffect(() => {
    if (!showCustom) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowCustom(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showCustom]);

  const handleApply = () => {
    if (localFrom && localTo && localFrom <= localTo && onCustomDateChange) {
      onCustomDateChange(localFrom, localTo);
      setShowCustom(false);
    }
  };

  const isValid = localFrom && localTo && localFrom <= localTo;

  return (
    <div className="flex flex-wrap gap-2 items-center relative">
      {PERIODS.map((p) => (
        <button
          key={p}
          onClick={() => {
            onChange(p);
            setShowCustom(false);
          }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            p === value
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
          }`}
        >
          {t(`dashboard.period.${p}`)}
        </button>
      ))}

      {onCustomDateChange && (
        <div ref={panelRef} className="relative">
          <button
            onClick={() => setShowCustom((prev) => !prev)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
              value === "custom"
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)]"
            }`}
          >
            <Calendar size={14} />
            {t("dashboard.period.custom")}
          </button>

          {showCustom && (
            <div className="absolute right-0 top-full mt-2 z-50 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-4 flex flex-col gap-3 min-w-[280px]">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  {t("dashboard.dateFrom")}
                </label>
                <input
                  type="date"
                  value={localFrom}
                  onChange={(e) => setLocalFrom(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-[var(--muted-foreground)]">
                  {t("dashboard.dateTo")}
                </label>
                <input
                  type="date"
                  value={localTo}
                  onChange={(e) => setLocalTo(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-sm border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>
              <button
                onClick={handleApply}
                disabled={!isValid}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isValid
                    ? "bg-[var(--primary)] text-white hover:opacity-90"
                    : "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                }`}
              >
                {t("dashboard.apply")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
