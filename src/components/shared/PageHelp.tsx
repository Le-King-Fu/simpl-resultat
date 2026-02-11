import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CircleHelp, X } from "lucide-react";

export function PageHelp({ helpKey }: { helpKey: string }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click (same pattern as CategoryCombobox)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const tips = t(`${helpKey}.help.tips`, { returnObjects: true }) as string[];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        aria-label={t(`${helpKey}.help.title`)}
      >
        <CircleHelp size={20} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-40 w-[calc(100vw-var(--sidebar-width,16rem)-6rem)] max-w-3xl bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 shadow-lg">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="font-semibold text-[var(--foreground)]">
              {t(`${helpKey}.help.title`)}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
          <ul className="space-y-1.5 text-sm text-[var(--muted-foreground)]">
            {Array.isArray(tips) &&
              tips.map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0">•</span>
                  <span>{tip}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
