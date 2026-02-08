import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus } from "lucide-react";
import type { Keyword } from "../../shared/types";

interface Props {
  keywords: Keyword[];
  onAdd: (keyword: string, priority: number) => void;
  onUpdate: (id: number, keyword: string, priority: number) => void;
  onRemove: (id: number) => void;
}

export default function KeywordList({ keywords, onAdd, onUpdate, onRemove }: Props) {
  const { t } = useTranslation();
  const [newKeyword, setNewKeyword] = useState("");
  const [newPriority, setNewPriority] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editPriority, setEditPriority] = useState(0);

  const handleAdd = () => {
    if (!newKeyword.trim()) return;
    onAdd(newKeyword.trim(), newPriority);
    setNewKeyword("");
    setNewPriority(0);
  };

  const startEdit = (kw: Keyword) => {
    setEditingId(kw.id);
    setEditText(kw.keyword);
    setEditPriority(kw.priority);
  };

  const saveEdit = () => {
    if (editingId === null || !editText.trim()) return;
    onUpdate(editingId, editText.trim(), editPriority);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium">{t("categories.keywords")}</h3>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("categories.keywordText")}
          className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
        <input
          type="number"
          value={newPriority}
          onChange={(e) => setNewPriority(Number(e.target.value))}
          className="w-16 px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-center focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
          title={t("categories.priority")}
        />
        <button
          onClick={handleAdd}
          disabled={!newKeyword.trim()}
          className="p-1.5 rounded-lg bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {keywords.map((kw) =>
          editingId === kw.id ? (
            <div key={kw.id} className="flex items-center gap-1 bg-[var(--muted)] rounded-full px-2 py-1">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit();
                  if (e.key === "Escape") cancelEdit();
                }}
                className="w-24 px-1 py-0 rounded border border-[var(--border)] bg-[var(--card)] text-xs focus:outline-none"
                autoFocus
              />
              <input
                type="number"
                value={editPriority}
                onChange={(e) => setEditPriority(Number(e.target.value))}
                className="w-10 px-1 py-0 rounded border border-[var(--border)] bg-[var(--card)] text-xs text-center focus:outline-none"
              />
              <button onClick={saveEdit} className="text-[var(--positive)] text-xs font-medium px-1">
                OK
              </button>
              <button onClick={cancelEdit} className="text-[var(--muted-foreground)] text-xs px-1">
                ESC
              </button>
            </div>
          ) : (
            <span
              key={kw.id}
              onClick={() => startEdit(kw)}
              className="inline-flex items-center gap-1 bg-[var(--muted)] rounded-full px-3 py-1 text-sm cursor-pointer hover:bg-[var(--muted)]/80"
            >
              {kw.keyword}
              {kw.priority > 0 && (
                <span className="text-[10px] bg-[var(--primary)]/15 text-[var(--primary)] px-1 rounded-full font-medium">
                  {kw.priority}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(kw.id);
                }}
                className="ml-0.5 text-[var(--muted-foreground)] hover:text-[var(--negative)]"
              >
                <X size={12} />
              </button>
            </span>
          )
        )}
        {keywords.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">{t("common.noResults")}</p>
        )}
      </div>
    </div>
  );
}
