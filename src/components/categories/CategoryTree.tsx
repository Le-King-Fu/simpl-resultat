import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { CategoryTreeNode } from "../../shared/types";

interface Props {
  tree: CategoryTreeNode[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const colors: Record<string, string> = {
    expense: "bg-[var(--negative)]/15 text-[var(--negative)]",
    income: "bg-[var(--positive)]/15 text-[var(--positive)]",
    transfer: "bg-[var(--primary)]/15 text-[var(--primary)]",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${colors[type] ?? ""}`}>
      {t(`categories.${type}`)}
    </span>
  );
}

function TreeRow({
  node,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  hasChildren,
}: {
  node: CategoryTreeNode;
  depth: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
  expanded: boolean;
  onToggle: () => void;
  hasChildren: boolean;
}) {
  const isSelected = node.id === selectedId;

  return (
    <button
      onClick={() => onSelect(node.id)}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left rounded-lg transition-colors
        ${isSelected ? "bg-[var(--muted)] border-l-2 border-[var(--primary)]" : "hover:bg-[var(--muted)]/50"}`}
      style={{ paddingLeft: `${depth * 20 + 12}px` }}
    >
      {hasChildren ? (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="w-4 h-4 flex items-center justify-center cursor-pointer text-[var(--muted-foreground)]"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      ) : (
        <span className="w-4" />
      )}
      <span
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: node.color ?? "#9ca3af" }}
      />
      <span className="flex-1 truncate">{node.name}</span>
      <TypeBadge type={node.type} />
      {node.keyword_count > 0 && (
        <span className="text-[11px] text-[var(--muted-foreground)]">
          {node.keyword_count}
        </span>
      )}
    </button>
  );
}

export default function CategoryTree({ tree, selectedId, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const ids = new Set<number>();
    for (const node of tree) {
      if (node.children.length > 0) ids.add(node.id);
    }
    return ids;
  });

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-0.5">
      {tree.map((parent) => (
        <div key={parent.id}>
          <TreeRow
            node={parent}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            expanded={expanded.has(parent.id)}
            onToggle={() => toggle(parent.id)}
            hasChildren={parent.children.length > 0}
          />
          {expanded.has(parent.id) &&
            parent.children.map((child) => (
              <TreeRow
                key={child.id}
                node={child}
                depth={1}
                selectedId={selectedId}
                onSelect={onSelect}
                expanded={false}
                onToggle={() => {}}
                hasChildren={false}
              />
            ))}
        </div>
      ))}
    </div>
  );
}
