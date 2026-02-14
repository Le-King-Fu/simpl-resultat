import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, Inbox, AlertTriangle } from "lucide-react";
import { useImportHistory } from "../../hooks/useImportHistory";

interface ImportHistoryPanelProps {
  onChanged?: () => void;
}

export default function ImportHistoryPanel({
  onChanged,
}: ImportHistoryPanelProps) {
  const { t } = useTranslation();
  const { state, handleDelete, handleDeleteAll } = useImportHistory(onChanged);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; filename: string; rowCount: number } | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {t("import.history.title")}
        </h2>
        {state.files.length > 0 && (
          <button
            onClick={() => setConfirmDeleteAll(true)}
            disabled={state.isDeleting}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--negative)] text-white hover:opacity-90 disabled:opacity-50"
          >
            {t("import.history.deleteAll")}
          </button>
        )}
      </div>

      {state.error && (
        <p className="text-sm text-[var(--negative)] mb-2">{state.error}</p>
      )}

      {state.isLoading ? (
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("common.loading")}
        </p>
      ) : state.files.length === 0 ? (
        <div className="bg-[var(--card)] rounded-xl p-8 border-2 border-dashed border-[var(--border)] text-center">
          <Inbox
            size={32}
            className="mx-auto mb-3 text-[var(--muted-foreground)]"
          />
          <p className="text-[var(--muted-foreground)]">
            {t("import.history.empty")}
          </p>
        </div>
      ) : (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[var(--muted-foreground)]">
                <th className="px-4 py-2 font-medium">
                  {t("import.history.source")}
                </th>
                <th className="px-4 py-2 font-medium">
                  {t("import.history.filename")}
                </th>
                <th className="px-4 py-2 font-medium">
                  {t("import.history.date")}
                </th>
                <th className="px-4 py-2 font-medium text-right">
                  {t("import.history.rows")}
                </th>
                <th className="px-4 py-2 font-medium">
                  {t("import.history.status")}
                </th>
                <th className="px-4 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {state.files.map((file) => (
                <tr
                  key={file.id}
                  className="border-b border-[var(--border)] last:border-b-0"
                >
                  <td className="px-4 py-2">{file.source_name}</td>
                  <td className="px-4 py-2 truncate max-w-[200px]">
                    {file.filename}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {new Date(file.import_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">{file.row_count}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        file.status === "completed"
                          ? "text-[var(--positive)]"
                          : file.status === "error"
                            ? "text-[var(--negative)]"
                            : "text-[var(--muted-foreground)]"
                      }
                    >
                      {file.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setConfirmDelete({ id: file.id, filename: file.filename, rowCount: file.row_count })}
                      disabled={state.isDeleting}
                      className="p-1 rounded hover:bg-[var(--muted)] text-[var(--negative)] disabled:opacity-50"
                      title={t("common.delete")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm delete single import */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-[var(--negative)]/10">
                <AlertTriangle size={20} className="text-[var(--negative)]" />
              </div>
              <h2 className="text-lg font-semibold">{t("common.delete")}</h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-1">
              <span className="font-medium text-[var(--foreground)]">{confirmDelete.filename}</span>
            </p>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              {t("import.history.deleteConfirm", { count: confirmDelete.rowCount })}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  handleDelete(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--negative)] text-white hover:opacity-90 transition-opacity"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete all imports */}
      {confirmDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-[var(--negative)]/10">
                <AlertTriangle size={20} className="text-[var(--negative)]" />
              </div>
              <h2 className="text-lg font-semibold">{t("import.history.deleteAll")}</h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">
              {t("import.history.deleteAllConfirm")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="px-4 py-2 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  handleDeleteAll();
                  setConfirmDeleteAll(false);
                }}
                className="px-4 py-2 text-sm rounded-lg bg-[var(--negative)] text-white hover:opacity-90 transition-opacity"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
