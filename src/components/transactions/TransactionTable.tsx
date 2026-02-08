import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import type {
  TransactionRow,
  TransactionSort,
  Category,
} from "../../shared/types";

interface TransactionTableProps {
  rows: TransactionRow[];
  sort: TransactionSort;
  categories: Category[];
  onSort: (column: TransactionSort["column"]) => void;
  onCategoryChange: (txId: number, categoryId: number | null) => void;
  onNotesChange: (txId: number, notes: string) => void;
}

function SortIcon({
  column,
  sort,
}: {
  column: TransactionSort["column"];
  sort: TransactionSort;
}) {
  if (sort.column !== column)
    return <span className="ml-1 text-[var(--muted-foreground)] opacity-30">&#8597;</span>;
  return sort.direction === "asc" ? (
    <ChevronUp size={14} className="ml-1 inline" />
  ) : (
    <ChevronDown size={14} className="ml-1 inline" />
  );
}

export default function TransactionTable({
  rows,
  sort,
  categories,
  onSort,
  onCategoryChange,
  onNotesChange,
}: TransactionTableProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState("");

  if (rows.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-8 border border-[var(--border)] text-center text-[var(--muted-foreground)]">
        <p>{t("transactions.noTransactions")}</p>
      </div>
    );
  }

  const columns: Array<{
    key: TransactionSort["column"];
    label: string;
    align: string;
  }> = [
    { key: "date", label: t("transactions.date"), align: "text-left" },
    { key: "description", label: t("transactions.description"), align: "text-left" },
    { key: "amount", label: t("transactions.amount"), align: "text-right" },
    { key: "category_name", label: t("transactions.category"), align: "text-left" },
  ];

  const toggleNotes = (row: TransactionRow) => {
    if (expandedId === row.id) {
      setExpandedId(null);
    } else {
      setExpandedId(row.id);
      setEditingNotes(row.notes ?? "");
    }
  };

  const handleNotesSave = (txId: number) => {
    onNotesChange(txId, editingNotes);
    setExpandedId(null);
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--muted)]">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className={`px-3 py-2 ${col.align} text-xs font-medium text-[var(--muted-foreground)] cursor-pointer select-none hover:text-[var(--foreground)] transition-colors`}
              >
                {col.label}
                <SortIcon column={col.key} sort={sort} />
              </th>
            ))}
            <th className="px-3 py-2 w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {rows.map((row) => (
            <Fragment key={row.id}>
              <tr
                className="hover:bg-[var(--muted)] transition-colors"
              >
                <td className="px-3 py-2 whitespace-nowrap">{row.date}</td>
                <td className="px-3 py-2 max-w-xs truncate" title={row.description}>
                  {row.description}
                </td>
                <td
                  className={`px-3 py-2 text-right font-mono whitespace-nowrap ${
                    row.amount >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  }`}
                >
                  {row.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2">
                  <select
                    value={row.category_id?.toString() ?? ""}
                    onChange={(e) =>
                      onCategoryChange(
                        row.id,
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    className="w-full px-2 py-1 text-sm rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  >
                    <option value="">
                      {t("transactions.table.noCategory")}
                    </option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => toggleNotes(row)}
                    className={`p-1 rounded hover:bg-[var(--muted)] transition-colors ${
                      row.notes
                        ? "text-[var(--primary)]"
                        : "text-[var(--muted-foreground)]"
                    }`}
                    title={t("transactions.notes.placeholder")}
                  >
                    <MessageSquare size={14} />
                  </button>
                </td>
              </tr>
              {expandedId === row.id && (
                <tr>
                  <td colSpan={5} className="px-3 py-2 bg-[var(--muted)]">
                    <div className="flex gap-2">
                      <textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder={t("transactions.notes.placeholder")}
                        rows={2}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                      />
                      <button
                        onClick={() => handleNotesSave(row.id)}
                        className="px-4 py-2 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity self-end"
                      >
                        {t("common.save")}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
