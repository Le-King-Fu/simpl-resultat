import { useTranslation } from "react-i18next";
import { FolderOpen, RefreshCw } from "lucide-react";

interface ImportFolderConfigProps {
  folderPath: string | null;
  onBrowse: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export default function ImportFolderConfig({
  folderPath,
  onBrowse,
  onRefresh,
  isLoading,
}: ImportFolderConfigProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--card)] rounded-xl p-4 border border-[var(--border)] mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <FolderOpen size={20} className="text-[var(--primary)] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {t("import.folder.label")}
            </p>
            {folderPath ? (
              <p className="text-sm text-[var(--muted-foreground)] truncate">
                {folderPath}
              </p>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] italic">
                {t("import.folder.notConfigured")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {folderPath && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin" : ""}
              />
              {t("import.folder.refresh")}
            </button>
          )}
          <button
            onClick={onBrowse}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
          >
            <FolderOpen size={14} />
            {t("import.folder.browse")}
          </button>
        </div>
      </div>
    </div>
  );
}
