import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { EyeOff, List } from "lucide-react";

export interface ChartContextMenuProps {
  x: number;
  y: number;
  categoryName: string;
  onHide: () => void;
  onViewDetails: () => void;
  onClose: () => void;
}

export default function ChartContextMenu({
  x,
  y,
  categoryName,
  onHide,
  onViewDetails,
  onClose,
}: ChartContextMenuProps) {
  const { t } = useTranslation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menuRef.current.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      menuRef.current.style.top = `${y - rect.height}px`;
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-xs font-medium text-[var(--muted-foreground)] truncate border-b border-[var(--border)]">
        {categoryName}
      </div>
      <button
        onClick={() => { onViewDetails(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <List size={14} />
        {t("charts.viewTransactions")}
      </button>
      <button
        onClick={() => { onHide(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
      >
        <EyeOff size={14} />
        {t("charts.hideCategory")}
      </button>
    </div>
  );
}
