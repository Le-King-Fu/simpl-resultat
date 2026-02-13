import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X, Loader2 } from "lucide-react";
import { getTransactionsByCategory } from "../../services/dashboardService";
import type { TransactionRow } from "../../shared/types";

const cadFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

interface TransactionDetailModalProps {
  categoryId: number | null;
  categoryName: string;
  categoryColor: string;
  dateFrom?: string;
  dateTo?: string;
  onClose: () => void;
}

export default function TransactionDetailModal({
  categoryId,
  categoryName,
  categoryColor,
  dateFrom,
  dateTo,
  onClose,
}: TransactionDetailModalProps) {
  const { t } = useTranslation();
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTransactionsByCategory(categoryId, dateFrom, dateTo);
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full inline-block flex-shrink-0"
              style={{ backgroundColor: categoryColor }}
            />
            <h2 className="text-lg font-semibold">{categoryName}</h2>
            <span className="text-sm text-[var(--muted-foreground)]">
              ({rows.length} {t("charts.transactions")})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--muted-foreground)]" />
            </div>
          )}

          {error && (
            <div className="px-6 py-4 text-[var(--negative)]">{error}</div>
          )}

          {!isLoading && !error && rows.length === 0 && (
            <div className="px-6 py-8 text-center text-[var(--muted-foreground)]">
              {t("dashboard.noData")}
            </div>
          )}

          {!isLoading && !error && rows.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                  <th className="text-left px-6 py-2 font-medium">{t("transactions.date")}</th>
                  <th className="text-left px-6 py-2 font-medium">{t("transactions.description")}</th>
                  <th className="text-right px-6 py-2 font-medium">{t("transactions.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] hover:bg-[var(--muted)]">
                    <td className="px-6 py-2 whitespace-nowrap">{row.date}</td>
                    <td className="px-6 py-2 truncate max-w-[300px]">{row.description}</td>
                    <td className={`px-6 py-2 text-right whitespace-nowrap font-medium ${
                      row.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                    }`}>
                      {cadFormatter.format(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className="px-6 py-3" colSpan={2}>{t("charts.total")}</td>
                  <td className={`px-6 py-3 text-right ${
                    total >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  }`}>
                    {cadFormatter.format(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
