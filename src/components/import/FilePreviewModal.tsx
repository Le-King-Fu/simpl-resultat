import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import FilePreviewTable from "./FilePreviewTable";
import type { ParsedRow } from "../../shared/types";

interface FilePreviewModalProps {
  rows: ParsedRow[];
  totalCount: number;
  onClose: () => void;
}

export default function FilePreviewModal({
  rows,
  totalCount,
  onClose,
}: FilePreviewModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">{t("import.preview.title")}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-6">
          <FilePreviewTable rows={rows} />
          {totalCount > rows.length && (
            <p className="text-sm text-[var(--muted-foreground)] text-center mt-4">
              {t("import.preview.moreRows", {
                count: totalCount - rows.length,
              })}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
