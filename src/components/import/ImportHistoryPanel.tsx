import { useTranslation } from "react-i18next";
import { Trash2, Inbox } from "lucide-react";
import { useImportHistory } from "../../hooks/useImportHistory";

interface ImportHistoryPanelProps {
  onChanged?: () => void;
}

export default function ImportHistoryPanel({
  onChanged,
}: ImportHistoryPanelProps) {
  const { t } = useTranslation();
  const { state, handleDelete, handleDeleteAll } = useImportHistory(onChanged);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {t("import.history.title")}
        </h2>
        {state.files.length > 0 && (
          <button
            onClick={handleDeleteAll}
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
                      onClick={() => handleDelete(file.id, file.row_count)}
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
    </div>
  );
}
