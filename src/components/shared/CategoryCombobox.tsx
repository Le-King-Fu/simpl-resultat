import { useState, useRef, useEffect, useCallback } from "react";
import type { Category } from "../../shared/types";

interface CategoryComboboxProps {
  categories: Category[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder?: string;
  compact?: boolean;
  /** Extra options shown before the category list (e.g. "All categories", "Uncategorized") */
  extraOptions?: Array<{ value: string; label: string }>;
  /** Called when an extra option is selected */
  onExtraSelect?: (value: string) => void;
  /** Currently active extra option value (for display) */
  activeExtra?: string | null;
}

export default function CategoryCombobox({
  categories,
  value,
  onChange,
  placeholder = "",
  compact = false,
  extraOptions,
  onExtraSelect,
  activeExtra,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build display label
  const selectedCategory = categories.find((c) => c.id === value);
  const displayLabel =
    activeExtra != null
      ? extraOptions?.find((o) => o.value === activeExtra)?.label ?? ""
      : selectedCategory?.name ?? "";

  // Strip accents + lowercase for accent-insensitive matching
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  // Filter categories
  const normalizedQuery = normalize(query);
  const filtered = query
    ? categories.filter((c) => normalize(c.name).includes(normalizedQuery))
    : categories;

  const filteredExtras = extraOptions
    ? query
      ? extraOptions.filter((o) => normalize(o.label).includes(normalizedQuery))
      : extraOptions
    : [];

  const totalItems = filteredExtras.length + filtered.length;

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex, open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectItem = useCallback(
    (index: number) => {
      if (index < filteredExtras.length) {
        onExtraSelect?.(filteredExtras[index].value);
      } else {
        const cat = filtered[index - filteredExtras.length];
        if (cat) onChange(cat.id);
      }
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    },
    [filteredExtras, filtered, onChange, onExtraSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % totalItems);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => (i - 1 + totalItems) % totalItems);
        break;
      case "Enter":
        e.preventDefault();
        if (totalItems > 0) selectItem(highlightIndex);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setQuery("");
        inputRef.current?.blur();
        break;
    }
  };

  const py = compact ? "py-1" : "py-2";
  const px = compact ? "px-2" : "px-3";

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={open ? query : displayLabel}
        placeholder={placeholder || displayLabel}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlightIndex(0);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
          setHighlightIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className={`w-full ${px} ${py} text-sm rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
      />
      {open && totalItems > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg"
        >
          {filteredExtras.map((opt, i) => (
            <li
              key={`extra-${opt.value}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectItem(i)}
              onMouseEnter={() => setHighlightIndex(i)}
              className={`${px} ${py} text-sm cursor-pointer ${
                i === highlightIndex
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--muted)]"
              }`}
            >
              {opt.label}
            </li>
          ))}
          {filtered.map((cat, i) => {
            const idx = filteredExtras.length + i;
            return (
              <li
                key={cat.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectItem(idx)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`${px} ${py} text-sm cursor-pointer ${
                  idx === highlightIndex
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                {cat.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
