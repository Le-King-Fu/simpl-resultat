import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { PivotConfig, PivotFieldId, PivotFilterEntry, PivotMeasureId, PivotZone } from "../../shared/types";
import { getDynamicFilterValues } from "../../services/reportService";

const ALL_FIELDS: PivotFieldId[] = ["year", "month", "type", "level1", "level2", "level3"];
const ALL_MEASURES: PivotMeasureId[] = ["periodic", "ytd"];

interface DynamicReportPanelProps {
  config: PivotConfig;
  onChange: (config: PivotConfig) => void;
}

export default function DynamicReportPanel({ config, onChange }: DynamicReportPanelProps) {
  const { t } = useTranslation();
  const [menuTarget, setMenuTarget] = useState<{ id: string; type: "field" | "measure"; x: number; y: number } | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  // A field is only "exhausted" if it's in all 3 zones (rows + columns + filters)
  const inRows = new Set(config.rows);
  const inColumns = new Set(config.columns);
  const inFilters = new Set(Object.keys(config.filters) as PivotFieldId[]);
  const assignedFields = new Set(
    ALL_FIELDS.filter((f) => inRows.has(f) && inColumns.has(f) && inFilters.has(f))
  );
  const assignedMeasures = new Set(config.values);
  const availableFields = ALL_FIELDS.filter((f) => !assignedFields.has(f));
  const availableMeasures = ALL_MEASURES.filter((m) => !assignedMeasures.has(m));

  // Load filter values when a field is added to filters
  const filterFieldIds = Object.keys(config.filters) as PivotFieldId[];
  useEffect(() => {
    for (const fieldId of filterFieldIds) {
      if (!filterValues[fieldId]) {
        getDynamicFilterValues(fieldId as PivotFieldId).then((vals) => {
          setFilterValues((prev) => ({ ...prev, [fieldId]: vals }));
        });
      }
    }
  }, [filterFieldIds.join(",")]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuTarget) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuTarget(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuTarget]);

  const handleFieldClick = (id: string, type: "field" | "measure", e: React.MouseEvent) => {
    setMenuTarget({ id, type, x: e.clientX, y: e.clientY });
  };

  const assignTo = useCallback((zone: PivotZone) => {
    if (!menuTarget) return;
    const next = { ...config, rows: [...config.rows], columns: [...config.columns], filters: { ...config.filters }, values: [...config.values] };

    if (menuTarget.type === "measure") {
      if (zone === "values") {
        next.values = [...next.values, menuTarget.id as PivotMeasureId];
      }
    } else {
      const fieldId = menuTarget.id as PivotFieldId;
      if (zone === "rows") next.rows = [...next.rows, fieldId];
      else if (zone === "columns") next.columns = [...next.columns, fieldId];
      else if (zone === "filters") next.filters = { ...next.filters, [fieldId]: { include: [], exclude: [] } };
    }

    setMenuTarget(null);
    onChange(next);
  }, [menuTarget, config, onChange]);

  const removeFrom = (zone: PivotZone, id: string) => {
    const next = { ...config, rows: [...config.rows], columns: [...config.columns], filters: { ...config.filters }, values: [...config.values] };
    if (zone === "rows") next.rows = next.rows.filter((f) => f !== id);
    else if (zone === "columns") next.columns = next.columns.filter((f) => f !== id);
    else if (zone === "filters") {
      const { [id]: _, ...rest } = next.filters;
      next.filters = rest;
    } else if (zone === "values") next.values = next.values.filter((m) => m !== id);
    onChange(next);
  };

  const toggleFilterInclude = (fieldId: string, value: string) => {
    const entry: PivotFilterEntry = config.filters[fieldId] || { include: [], exclude: [] };
    const isIncluded = entry.include.includes(value);
    const newInclude = isIncluded ? entry.include.filter((v) => v !== value) : [...entry.include, value];
    // Remove from exclude if adding to include
    const newExclude = isIncluded ? entry.exclude : entry.exclude.filter((v) => v !== value);
    onChange({ ...config, filters: { ...config.filters, [fieldId]: { include: newInclude, exclude: newExclude } } });
  };

  const toggleFilterExclude = (fieldId: string, value: string) => {
    const entry: PivotFilterEntry = config.filters[fieldId] || { include: [], exclude: [] };
    const isExcluded = entry.exclude.includes(value);
    const newExclude = isExcluded ? entry.exclude.filter((v) => v !== value) : [...entry.exclude, value];
    // Remove from include if adding to exclude
    const newInclude = isExcluded ? entry.include : entry.include.filter((v) => v !== value);
    onChange({ ...config, filters: { ...config.filters, [fieldId]: { include: newInclude, exclude: newExclude } } });
  };

  const fieldLabel = (id: string) => t(`reports.pivot.${id === "level1" ? "level1" : id === "level2" ? "level2" : id === "level3" ? "level3" : id === "type" ? "categoryType" : id}`);
  const measureLabel = (id: string) => t(`reports.pivot.${id}`);

  // Context menu only shows zones where the field is NOT already assigned
  const getAvailableZones = (fieldId: string): PivotZone[] => {
    const zones: PivotZone[] = [];
    if (!inRows.has(fieldId as PivotFieldId)) zones.push("rows");
    if (!inColumns.has(fieldId as PivotFieldId)) zones.push("columns");
    if (!inFilters.has(fieldId as PivotFieldId)) zones.push("filters");
    return zones;
  };

  const zoneLabels: Record<PivotZone, string> = {
    rows: t("reports.pivot.rows"),
    columns: t("reports.pivot.columns"),
    filters: t("reports.pivot.filters"),
    values: t("reports.pivot.values"),
  };

  return (
    <div className="w-64 shrink-0 bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-4 text-sm h-fit sticky top-4">
      {/* Available Fields */}
      <div>
        <h3 className="font-medium text-[var(--muted-foreground)] mb-2">{t("reports.pivot.availableFields")}</h3>
        <div className="flex flex-wrap gap-1.5">
          {availableFields.map((f) => (
            <button
              key={f}
              onClick={(e) => handleFieldClick(f, "field", e)}
              className="px-2.5 py-1 rounded-lg bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)] transition-colors text-xs"
            >
              {fieldLabel(f)}
            </button>
          ))}
          {availableMeasures.map((m) => (
            <button
              key={m}
              onClick={(e) => handleFieldClick(m, "measure", e)}
              className="px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors text-xs"
            >
              {measureLabel(m)}
            </button>
          ))}
          {availableFields.length === 0 && availableMeasures.length === 0 && (
            <span className="text-xs text-[var(--muted-foreground)]">—</span>
          )}
        </div>
      </div>

      {/* Rows */}
      <ZoneSection
        label={t("reports.pivot.rows")}
        items={config.rows}
        getLabel={fieldLabel}
        onRemove={(id) => removeFrom("rows", id)}
      />

      {/* Columns */}
      <ZoneSection
        label={t("reports.pivot.columns")}
        items={config.columns}
        getLabel={fieldLabel}
        onRemove={(id) => removeFrom("columns", id)}
      />

      {/* Filters */}
      <div>
        <h3 className="font-medium text-[var(--muted-foreground)] mb-1">{t("reports.pivot.filters")}</h3>
        {filterFieldIds.length === 0 ? (
          <span className="text-xs text-[var(--muted-foreground)]">—</span>
        ) : (
          <div className="space-y-2">
            {filterFieldIds.map((fieldId) => {
              const entry = config.filters[fieldId] || { include: [], exclude: [] };
              const hasActive = entry.include.length > 0 || entry.exclude.length > 0;
              return (
                <div key={fieldId}>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs font-medium">{fieldLabel(fieldId)}</span>
                    <button onClick={() => removeFrom("filters", fieldId)} className="text-[var(--muted-foreground)] hover:text-[var(--negative)]">
                      <X size={12} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(filterValues[fieldId] || []).map((val) => {
                      const isIncluded = entry.include.includes(val);
                      const isExcluded = entry.exclude.includes(val);
                      return (
                        <button
                          key={val}
                          onClick={() => toggleFilterInclude(fieldId, val)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            toggleFilterExclude(fieldId, val);
                          }}
                          className={`px-2 py-0.5 rounded text-xs transition-colors ${
                            isIncluded
                              ? "bg-[var(--primary)] text-white"
                              : isExcluded
                                ? "bg-[var(--negative)] text-white line-through"
                                : hasActive
                                  ? "bg-[var(--muted)] text-[var(--muted-foreground)] opacity-50"
                                  : "bg-[var(--muted)] text-[var(--foreground)]"
                          }`}
                          title={t("reports.pivot.rightClickExclude")}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Values */}
      <ZoneSection
        label={t("reports.pivot.values")}
        items={config.values}
        getLabel={measureLabel}
        onRemove={(id) => removeFrom("values", id)}
        accent
      />

      {/* Context menu */}
      {menuTarget && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg py-1 min-w-[140px]"
          style={{ left: menuTarget.x, top: menuTarget.y }}
        >
          <div className="px-3 py-1 text-xs text-[var(--muted-foreground)]">{t("reports.pivot.addTo")}</div>
          {menuTarget.type === "measure" ? (
            <button
              onClick={() => assignTo("values")}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
            >
              {zoneLabels.values}
            </button>
          ) : (
            getAvailableZones(menuTarget.id).map((zone) => (
              <button
                key={zone}
                onClick={() => assignTo(zone)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--muted)] transition-colors"
              >
                {zoneLabels[zone]}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ZoneSection({
  label,
  items,
  getLabel,
  onRemove,
  accent,
}: {
  label: string;
  items: string[];
  getLabel: (id: string) => string;
  onRemove: (id: string) => void;
  accent?: boolean;
}) {
  return (
    <div>
      <h3 className="font-medium text-[var(--muted-foreground)] mb-1">{label}</h3>
      {items.length === 0 ? (
        <span className="text-xs text-[var(--muted-foreground)]">—</span>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((id) => (
            <span
              key={id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs ${
                accent
                  ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "bg-[var(--muted)] text-[var(--foreground)]"
              }`}
            >
              {getLabel(id)}
              <button onClick={() => onRemove(id)} className="hover:text-[var(--negative)]">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
