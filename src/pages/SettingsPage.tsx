import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Info,
  RefreshCw,
  Download,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Loader2,
  ShieldCheck,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import { useUpdater } from "../hooks/useUpdater";
import { Link } from "react-router-dom";
import { APP_NAME } from "../shared/constants";
import { PageHelp } from "../components/shared/PageHelp";
import DataManagementCard from "../components/settings/DataManagementCard";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { state, checkForUpdate, downloadAndInstall, installAndRestart } =
    useUpdater();
  const [version, setVersion] = useState("");

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const progressPercent =
    state.contentLength && state.contentLength > 0
      ? Math.round((state.progress / state.contentLength) * 100)
      : null;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="relative flex items-center gap-3">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        <PageHelp helpKey="settings" />
      </div>

      {/* About card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
            S
          </div>
          <div>
            <h2 className="text-lg font-semibold">{APP_NAME}</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              {t("settings.version", { version })}
            </p>
          </div>
        </div>
      </div>

      {/* User guide card */}
      <Link
        to="/docs"
        className="block bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <BookOpen size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t("settings.userGuide.title")}</h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                {t("settings.userGuide.description")}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors" />
        </div>
      </Link>

      {/* Update card */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Info size={18} />
          {t("settings.updates.title")}
        </h2>

        {/* idle */}
        {state.status === "idle" && (
          <button
            onClick={checkForUpdate}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} />
            {t("settings.updates.checkButton")}
          </button>
        )}

        {/* checking */}
        {state.status === "checking" && (
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <Loader2 size={16} className="animate-spin" />
            {t("settings.updates.checking")}
          </div>
        )}

        {/* up to date */}
        {state.status === "upToDate" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--positive)]">
              <CheckCircle size={16} />
              {t("settings.updates.upToDate")}
            </div>
            <button
              onClick={checkForUpdate}
              className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        )}

        {/* available */}
        {state.status === "available" && (
          <div className="space-y-3">
            <p>
              {t("settings.updates.available", { version: state.version })}
            </p>
            {state.body && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--foreground)]">
                  {t("settings.updates.releaseNotes")}
                </h3>
                <div className="max-h-48 overflow-y-auto rounded-lg bg-[var(--background)] border border-[var(--border)] p-3 text-sm text-[var(--muted-foreground)] space-y-1">
                  {state.body.split("\n").map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} className="h-2" />;
                    if (trimmed.startsWith("### "))
                      return <p key={i} className="font-semibold text-[var(--foreground)] mt-2">{trimmed.slice(4)}</p>;
                    if (trimmed.startsWith("## "))
                      return <p key={i} className="font-bold text-[var(--foreground)] mt-2">{trimmed.slice(3)}</p>;
                    if (trimmed.startsWith("- "))
                      return <p key={i} className="pl-3">{"\u2022 "}{trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, "$1")}</p>;
                    return <p key={i}>{trimmed}</p>;
                  })}
                </div>
              </div>
            )}
            <button
              onClick={downloadAndInstall}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Download size={16} />
              {t("settings.updates.downloadButton")}
            </button>
          </div>
        )}

        {/* downloading */}
        {state.status === "downloading" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
              <Loader2 size={16} className="animate-spin" />
              {t("settings.updates.downloading")}
              {progressPercent !== null && <span>{progressPercent}%</span>}
            </div>
            <div className="w-full bg-[var(--border)] rounded-full h-2">
              <div
                className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* ready to install */}
        {state.status === "readyToInstall" && (
          <div className="space-y-3">
            <p className="text-[var(--positive)]">
              {t("settings.updates.readyToInstall")}
            </p>
            <button
              onClick={installAndRestart}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--positive)] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={16} />
              {t("settings.updates.installButton")}
            </button>
          </div>
        )}

        {/* installing */}
        {state.status === "installing" && (
          <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
            <Loader2 size={16} className="animate-spin" />
            {t("settings.updates.installing")}
          </div>
        )}

        {/* error */}
        {state.status === "error" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[var(--negative)]">
              <AlertCircle size={16} />
              {t("settings.updates.error")}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{state.error}</p>
            <button
              onClick={checkForUpdate}
              className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors"
            >
              <RotateCcw size={16} />
              {t("settings.updates.retryButton")}
            </button>
          </div>
        )}
      </div>

      {/* Data management */}
      <DataManagementCard />

      {/* Data safety notice */}
      <div className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]">
        <ShieldCheck size={16} className="mt-0.5 shrink-0" />
        <p>{t("settings.dataSafeNotice")}</p>
      </div>
    </div>
  );
}
