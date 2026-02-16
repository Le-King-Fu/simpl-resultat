import { Fragment, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronUp, ChevronDown, MessageSquare, Tag, Split } from "lucide-react";
import type {
  TransactionRow,
  TransactionSort,
  Category,
  SplitChild,
} from "../../shared/types";
import CategoryCombobox from "../shared/CategoryCombobox";
import SplitAdjustmentModal from "./SplitAdjustmentModal";

interface TransactionTableProps {
  rows: TransactionRow[];
  sort: TransactionSort;
  categories: Category[];
  onSort: (column: TransactionSort["column"]) => void;
  onCategoryChange: (txId: number, categoryId: number | null) => void;
  onNotesChange: (txId: number, notes: string) => void;
  onAddKeyword: (categoryId: number, keyword: string) => Promise<void>;
  onLoadSplitChildren: (parentId: number) => Promise<SplitChild[]>;
  onSaveSplit: (parentId: number, entries: Array<{ category_id: number; amount: number; description: string }>) => Promise<void>;
  onDeleteSplit: (parentId: number) => Promise<void>;
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
  onAddKeyword,
  onLoadSplitChildren,
  onSaveSplit,
  onDeleteSplit,
}: TransactionTableProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [keywordRowId, setKeywordRowId] = useState<number | null>(null);
  const [keywordText, setKeywordText] = useState("");
  const [keywordSaved, setKeywordSaved] = useState<number | null>(null);
  const [splitRow, setSplitRow] = useState<TransactionRow | null>(null);
  const noCategoryExtra = useMemo(
    () => [{ value: "", label: t("transactions.table.noCategory") }],
    [t]
  );

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

  const toggleKeyword = (row: TransactionRow) => {
    if (keywordRowId === row.id) {
      setKeywordRowId(null);
    } else {
      setKeywordRowId(row.id);
      setKeywordText(row.description);
    }
  };

  const handleKeywordSave = async (row: TransactionRow) => {
    if (!row.category_id || !keywordText.trim()) return;
    await onAddKeyword(row.category_id, keywordText);
    setKeywordRowId(null);
    setKeywordSaved(row.id);
    setTimeout(() => setKeywordSaved(null), 2000);
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
                  <div className="flex items-center gap-1">
                    <CategoryCombobox
                      categories={categories}
                      value={row.category_id}
                      onChange={(id) => onCategoryChange(row.id, id)}
                      placeholder={t("transactions.table.noCategory")}
                      compact
                      extraOptions={noCategoryExtra}
                      activeExtra={row.category_id === null ? "" : null}
                      onExtraSelect={() => onCategoryChange(row.id, null)}
                    />
                    {row.category_id !== null && (
                      <>
                        <button
                          onClick={() => toggleKeyword(row)}
                          className={`p-1 rounded hover:bg-[var(--muted)] transition-colors shrink-0 ${
                            keywordSaved === row.id
                              ? "text-[var(--positive)]"
                              : "text-[var(--muted-foreground)]"
                          }`}
                          title={keywordSaved === row.id ? t("transactions.keywordAdded") : t("transactions.addKeyword")}
                        >
                          <Tag size={14} />
                        </button>
                        <button
                          onClick={() => setSplitRow(row)}
                          className={`p-1 rounded hover:bg-[var(--muted)] transition-colors shrink-0 ${
                            row.is_split
                              ? "text-[var(--primary)]"
                              : "text-[var(--muted-foreground)]"
                          }`}
                          title={t("transactions.splitAdjustment")}
                        >
                          <Split size={14} />
                        </button>
                      </>
                    )}
                  </div>
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
              {keywordRowId === row.id && row.category_id !== null && (
                <tr>
                  <td colSpan={5} className="px-3 py-2 bg-[var(--muted)]">
                    <div className="flex items-center gap-2">
                      <Tag size={14} className="text-[var(--muted-foreground)] shrink-0" />
                      <span className="text-xs px-2 py-0.5 rounded bg-[var(--border)] text-[var(--foreground)] shrink-0">
                        {row.category_name}
                      </span>
                      <input
                        type="text"
                        value={keywordText}
                        onChange={(e) => setKeywordText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleKeywordSave(row);
                          if (e.key === "Escape") setKeywordRowId(null);
                        }}
                        placeholder={t("transactions.keywordPlaceholder")}
                        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleKeywordSave(row)}
                        disabled={!keywordText.trim()}
                        className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {t("common.save")}
                      </button>
                      <button
                        onClick={() => setKeywordRowId(null)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
      {splitRow && (
        <SplitAdjustmentModal
          transaction={splitRow}
          categories={categories}
          onLoadChildren={onLoadSplitChildren}
          onSave={onSaveSplit}
          onDelete={onDeleteSplit}
          onClose={() => setSplitRow(null)}
        />
      )}
    </div>
  );
}
