import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CategoryTreeNode } from "../../shared/types";

interface FlatItem {
  id: number;
  node: CategoryTreeNode;
  depth: number;
  parentId: number | null;
  isExpanded: boolean;
  hasChildren: boolean;
}

interface Props {
  tree: CategoryTreeNode[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onMoveCategory: (id: number, newParentId: number | null, newIndex: number) => Promise<void>;
}

function getSubtreeDepth(node: CategoryTreeNode): number {
  if (node.children.length === 0) return 0;
  return 1 + Math.max(...node.children.map(getSubtreeDepth));
}

function flattenTree(tree: CategoryTreeNode[], expandedSet: Set<number>): FlatItem[] {
  const items: FlatItem[] = [];
  function recurse(nodes: CategoryTreeNode[], depth: number, parentId: number | null) {
    for (const node of nodes) {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedSet.has(node.id);
      items.push({ id: node.id, node, depth, parentId, isExpanded, hasChildren });
      if (isExpanded && hasChildren) {
        recurse(node.children, depth + 1, node.id);
      }
    }
  }
  recurse(tree, 0, null);
  return items;
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

function TreeRowContent({
  node,
  depth,
  selectedId,
  onSelect,
  expanded,
  onToggle,
  hasChildren,
  dragHandleProps,
  isDragging,
}: {
  node: CategoryTreeNode;
  depth: number;
  selectedId: number | null;
  onSelect?: (id: number) => void;
  expanded: boolean;
  onToggle?: () => void;
  hasChildren: boolean;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
}) {
  const { t } = useTranslation();
  const isSelected = node.id === selectedId;

  return (
    <div
      className={`w-full flex items-center gap-1.5 px-2 py-2 text-sm rounded-lg transition-colors
        ${isSelected ? "bg-[var(--muted)] border-l-2 border-[var(--primary)]" : "hover:bg-[var(--muted)]/50"}
        ${isDragging ? "opacity-40" : ""}`}
      style={{ paddingLeft: `${depth * 20 + 4}px` }}
    >
      <span
        {...dragHandleProps}
        className="w-5 h-5 flex items-center justify-center cursor-grab text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0"
        title={t("categories.dragToReorder")}
      >
        <GripVertical size={14} />
      </span>
      {hasChildren ? (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="w-4 h-4 flex items-center justify-center cursor-pointer text-[var(--muted-foreground)] flex-shrink-0"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      ) : (
        <span className="w-4 flex-shrink-0" />
      )}
      <button
        onClick={() => onSelect?.(node.id)}
        className="flex items-center gap-2 flex-1 min-w-0 text-left"
      >
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
    </div>
  );
}

function SortableTreeRow({
  item,
  selectedId,
  onSelect,
  onToggle,
  isDragActive,
}: {
  item: FlatItem;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onToggle: (id: number) => void;
  isDragActive: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TreeRowContent
        node={item.node}
        depth={item.depth}
        selectedId={isDragActive ? null : selectedId}
        onSelect={onSelect}
        expanded={item.isExpanded}
        onToggle={() => onToggle(item.id)}
        hasChildren={item.hasChildren}
        dragHandleProps={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

export default function CategoryTree({ tree, selectedId, onSelect, onMoveCategory }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const ids = new Set<number>();
    function collectExpandable(nodes: CategoryTreeNode[]) {
      for (const node of nodes) {
        if (node.children.length > 0) {
          ids.add(node.id);
          collectExpandable(node.children);
        }
      }
    }
    collectExpandable(tree);
    return ids;
  });
  const [activeId, setActiveId] = useState<number | null>(null);

  // Update expanded set when tree changes (new parents appear)
  const flatItems = useMemo(() => flattenTree(tree, expanded), [tree, expanded]);

  const activeItem = useMemo(
    () => (activeId !== null ? flatItems.find((i) => i.id === activeId) ?? null : null),
    [activeId, flatItems]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const toggle = useCallback((id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeIdx = flatItems.findIndex((i) => i.id === active.id);
      const overIdx = flatItems.findIndex((i) => i.id === over.id);
      if (activeIdx === -1 || overIdx === -1) return;

      const activeItem = flatItems[activeIdx];
      const overItem = flatItems[overIdx];

      // Compute the depth of the active item's subtree
      const activeSubtreeDepth = getSubtreeDepth(activeItem.node);

      // Determine the new parent and index
      let newParentId: number | null;
      let newIndex: number;

      if (overItem.depth === 0) {
        // Dropping onto/near a root item — same depth reorder or moving to root
        newParentId = null;
        const rootItems = flatItems.filter((i) => i.depth === 0);
        const overRootIdx = rootItems.findIndex((i) => i.id === over.id);
        if (activeItem.depth === 0) {
          newIndex = overRootIdx;
        } else {
          newIndex = overIdx > activeIdx ? overRootIdx + 1 : overRootIdx;
        }
      } else {
        // Dropping onto/near a non-root item — adopt same parent
        newParentId = overItem.parentId;
        const siblings = flatItems.filter(
          (i) => i.depth === overItem.depth && i.parentId === overItem.parentId
        );
        const overSiblingIdx = siblings.findIndex((i) => i.id === over.id);
        newIndex = overIdx > activeIdx ? overSiblingIdx + 1 : overSiblingIdx;
        if (activeItem.parentId === newParentId) {
          const activeSiblingIdx = siblings.findIndex((i) => i.id === active.id);
          if (activeSiblingIdx < overSiblingIdx) {
            newIndex = overSiblingIdx;
          } else {
            newIndex = overSiblingIdx;
          }
        }
      }

      // Validate 3-level constraint: targetDepth + subtreeDepth must be <= 2 (max index)
      const targetDepth = newParentId === null ? 0 : overItem.depth;
      if (targetDepth + activeSubtreeDepth > 2) {
        return;
      }

      onMoveCategory(active.id as number, newParentId, newIndex);
    },
    [flatItems, onMoveCategory]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={flatItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-0.5">
          {flatItems.map((item) => (
            <SortableTreeRow
              key={item.id}
              item={item}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggle={toggle}
              isDragActive={activeId !== null}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>
        {activeItem && (
          <div className="bg-[var(--card)] rounded-lg shadow-lg border border-[var(--primary)] opacity-90">
            <TreeRowContent
              node={activeItem.node}
              depth={0}
              selectedId={null}
              expanded={false}
              hasChildren={activeItem.hasChildren}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
