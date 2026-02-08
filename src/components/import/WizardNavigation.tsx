import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface WizardNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
  showNext?: boolean;
  showCancel?: boolean;
}

export default function WizardNavigation({
  onBack,
  onNext,
  onCancel,
  nextLabel,
  backLabel,
  nextDisabled = false,
  showBack = true,
  showNext = true,
  showCancel = true,
}: WizardNavigationProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between pt-6 border-t border-[var(--border)]">
      <div>
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X size={16} />
            {t("common.cancel")}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <ChevronLeft size={16} />
            {backLabel || t("import.wizard.back")}
          </button>
        )}
        {showNext && onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="flex items-center gap-1 px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLabel || t("import.wizard.next")}
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
