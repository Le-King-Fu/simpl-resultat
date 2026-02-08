import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";

interface ImportProgressProps {
  currentFile: string;
  progress: number;
  total: number;
}

export default function ImportProgress({
  currentFile,
  progress,
  total,
}: ImportProgressProps) {
  const { t } = useTranslation();

  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">
        {t("import.progress.title")}
      </h2>

      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center">
        <Loader2
          size={40}
          className="mx-auto mb-4 text-[var(--primary)] animate-spin"
        />
        <p className="text-sm font-medium text-[var(--foreground)] mb-2">
          {t("import.progress.importing")}
        </p>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          {currentFile}
        </p>

        {/* Progress bar */}
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] mb-1">
            <span>
              {progress} / {total} {t("import.progress.rows")}
            </span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--muted)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
