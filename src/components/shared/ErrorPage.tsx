import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw, Download, Mail, Bug } from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";

interface ErrorPageProps {
  error?: string;
}

export default function ErrorPage({ error }: ErrorPageProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "available" | "upToDate" | "error">("idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    setUpdateError(null);
    try {
      const update = await check();
      if (update) {
        setUpdateStatus("available");
        setUpdateVersion(update.version);
      } else {
        setUpdateStatus("upToDate");
      }
    } catch (e) {
      setUpdateStatus("error");
      setUpdateError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)] p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-[var(--destructive)]" />

        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {t("error.title")}
        </h1>

        {error && (
          <div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {showDetails ? t("error.hideDetails") : t("error.showDetails")}
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {showDetails && (
              <pre className="mt-2 p-3 bg-[var(--muted)] rounded-md text-xs text-left text-[var(--muted-foreground)] overflow-auto max-h-40">
                {error}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="h-4 w-4" />
            {t("error.refresh")}
          </button>

          <button
            onClick={handleCheckUpdate}
            disabled={updateStatus === "checking"}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {updateStatus === "checking" ? t("common.loading") : t("error.checkUpdate")}
          </button>

          {updateStatus === "available" && updateVersion && (
            <p className="text-sm text-[var(--primary)]">
              {t("error.updateAvailable", { version: updateVersion })}
            </p>
          )}
          {updateStatus === "upToDate" && (
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("error.upToDate")}
            </p>
          )}
          {updateStatus === "error" && updateError && (
            <p className="text-sm text-[var(--destructive)]">{updateError}</p>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">
            {t("error.contactUs")}
          </p>
          <div className="flex flex-col gap-2 text-sm">
            <a
              href="mailto:lacompagniemaximus@protonmail.com"
              className="inline-flex items-center justify-center gap-2 text-[var(--primary)] hover:underline"
            >
              <Mail className="h-4 w-4" />
              {t("error.contactEmail")} lacompagniemaximus@protonmail.com
            </a>
            <a
              href="https://git.lacompagniemaximus.com/maximus/simpl-resultat/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-[var(--primary)] hover:underline"
            >
              <Bug className="h-4 w-4" />
              {t("error.reportIssue")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
