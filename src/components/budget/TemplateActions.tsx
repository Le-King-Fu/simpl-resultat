import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BookTemplate, Save, Trash2 } from "lucide-react";
import type { BudgetTemplate } from "../../shared/types";

interface TemplateActionsProps {
  templates: BudgetTemplate[];
  onApply: (templateId: number, month: number) => void;
  onApplyAllMonths: (templateId: number) => void;
  onSave: (name: string, description?: string) => void;
  onDelete: (templateId: number) => void;
  disabled?: boolean;
}

const MONTH_KEYS = [
  "months.jan", "months.feb", "months.mar", "months.apr",
  "months.may", "months.jun", "months.jul", "months.aug",
  "months.sep", "months.oct", "months.nov", "months.dec",
] as const;

export default function TemplateActions({
  templates,
  onApply,
  onApplyAllMonths,
  onSave,
  onDelete,
  disabled,
}: TemplateActionsProps) {
  const { t } = useTranslation();
  const [showApply, setShowApply] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const applyRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showApply && !showSave) return;
    const handler = (e: MouseEvent) => {
      if (showApply && applyRef.current && !applyRef.current.contains(e.target as Node)) {
        setShowApply(false);
        setSelectedTemplate(null);
      }
      if (showSave && saveRef.current && !saveRef.current.contains(e.target as Node)) {
        setShowSave(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showApply, showSave]);

  const handleSave = () => {
    if (!templateName.trim()) return;
    onSave(templateName.trim());
    setTemplateName("");
    setShowSave(false);
  };

  const handleDelete = (e: React.MouseEvent, templateId: number) => {
    e.stopPropagation();
    if (confirm(t("budget.deleteTemplateConfirm"))) {
      onDelete(templateId);
    }
  };

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyToMonth = (month: number) => {
    if (selectedTemplate === null) return;
    onApply(selectedTemplate, month);
    setShowApply(false);
    setSelectedTemplate(null);
  };

  const handleApplyAll = () => {
    if (selectedTemplate === null) return;
    onApplyAllMonths(selectedTemplate);
    setShowApply(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Apply template */}
      <div ref={applyRef} className="relative">
        <button
          onClick={() => { setShowApply(!showApply); setShowSave(false); setSelectedTemplate(null); }}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          <BookTemplate size={16} />
          {t("budget.applyTemplate")}
        </button>
        {showApply && (
          <div className="absolute right-0 top-full mt-1 z-40 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1">
            {selectedTemplate === null ? (
              // Step 1: Pick a template
              templates.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[var(--muted-foreground)]">
                  {t("budget.noTemplates")}
                </p>
              ) : (
                templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="flex items-center justify-between px-4 py-2 hover:bg-[var(--muted)] cursor-pointer transition-colors"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                  >
                    <span className="text-sm truncate">{tmpl.name}</span>
                    <button
                      onClick={(e) => handleDelete(e, tmpl.id)}
                      className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--negative)] transition-colors ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )
            ) : (
              // Step 2: Pick which month(s) to apply to
              <div>
                <p className="px-4 py-2 text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">
                  {t("budget.applyToMonth")}
                </p>
                <div
                  className="px-4 py-2 hover:bg-[var(--muted)] cursor-pointer transition-colors text-sm font-medium text-[var(--primary)]"
                  onClick={handleApplyAll}
                >
                  {t("budget.allMonths")}
                </div>
                {MONTH_KEYS.map((key, idx) => (
                  <div
                    key={key}
                    className="px-4 py-1.5 hover:bg-[var(--muted)] cursor-pointer transition-colors text-sm"
                    onClick={() => handleApplyToMonth(idx + 1)}
                  >
                    {t(key)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save as template */}
      <div ref={saveRef} className="relative">
        <button
          onClick={() => { setShowSave(!showSave); setShowApply(false); }}
          disabled={disabled}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {t("budget.saveAsTemplate")}
        </button>
        {showSave && (
          <div className="absolute right-0 top-full mt-1 z-40 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg p-4">
            <label className="block text-sm font-medium mb-1.5">
              {t("budget.templateName")}
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder={t("budget.templateName")}
              className="w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setShowSave(false); setTemplateName(""); }}
                className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] hover:bg-[var(--muted)] transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={!templateName.trim()}
                className="px-3 py-1.5 text-sm rounded-lg bg-[var(--primary)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
