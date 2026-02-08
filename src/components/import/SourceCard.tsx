import { useTranslation } from "react-i18next";
import { FolderOpen, FileText, CheckCircle } from "lucide-react";
import type { ScannedSource } from "../../shared/types";

interface SourceCardProps {
  source: ScannedSource;
  isConfigured: boolean;
  newFileCount: number;
  onClick: () => void;
}

export default function SourceCard({
  source,
  isConfigured,
  newFileCount,
  onClick,
}: SourceCardProps) {
  const { t } = useTranslation();

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-[var(--primary)]" />
          <h3 className="font-medium text-[var(--foreground)]">
            {source.folder_name}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {newFileCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[var(--accent)] text-white">
              {newFileCount} {t("import.sources.new")}
            </span>
          )}
          {isConfigured && (
            <CheckCircle
              size={16}
              className="text-emerald-500"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm text-[var(--muted-foreground)]">
        <FileText size={14} />
        <span>
          {source.files.length}{" "}
          {t("import.sources.fileCount", { count: source.files.length })}
        </span>
      </div>
    </button>
  );
}
