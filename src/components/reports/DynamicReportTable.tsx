import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUpDown } from "lucide-react";
import type { PivotConfig, PivotResult, PivotResultRow } from "../../shared/types";

const cadFormatter = (value: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);

const STORAGE_KEY = "pivot-subtotals-position";

interface DynamicReportTableProps {
  config: PivotConfig;
  result: PivotResult;
}

interface GroupNode {
  key: string;
  label: string;
  rows: PivotResultRow[];
  children: GroupNode[];
}

function buildGroups(rows: PivotResultRow[], rowDims: string[], depth: number): GroupNode[] {
  if (depth >= rowDims.length) return [];
  const dim = rowDims[depth];
  const map = new Map<string, PivotResultRow[]>();
  for (const row of rows) {
    const key = row.keys[dim] || "";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  const groups: GroupNode[] = [];
  for (const [key, groupRows] of map) {
    groups.push({
      key,
      label: key,
      rows: groupRows,
      children: buildGroups(groupRows, rowDims, depth + 1),
    });
  }
  return groups;
}

function computeSubtotals(rows: PivotResultRow[], measures: string[], colDim: string | undefined): Record<string, Record<string, number>> {
  // colValue → measure → sum
  const result: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const colKey = colDim ? (row.keys[colDim] || "") : "__all__";
    if (!result[colKey]) result[colKey] = {};
    for (const m of measures) {
      result[colKey][m] = (result[colKey][m] || 0) + (row.measures[m] || 0);
    }
  }
  return result;
}

export default function DynamicReportTable({ config, result }: DynamicReportTableProps) {
  const { t } = useTranslation();
  const [subtotalsOnTop, setSubtotalsOnTop] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "top";
  });

  const toggleSubtotals = () => {
    setSubtotalsOnTop((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "top" : "bottom");
      return next;
    });
  };

  if (result.rows.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 text-center text-[var(--muted-foreground)]">
        {t("reports.pivot.noData")}
      </div>
    );
  }

  const rowDims = config.rows;
  const colDim = config.columns[0] || undefined;
  const colValues = colDim ? result.columnValues : ["__all__"];
  const measures = config.values;

  // Build row groups from first row dimension
  const groups = rowDims.length > 0 ? buildGroups(result.rows, rowDims, 0) : [];

  // Grand totals
  const grandTotals = computeSubtotals(result.rows, measures, colDim);

  const fieldLabel = (id: string) => t(`reports.pivot.${id === "level1" ? "level1" : id === "level2" ? "level2" : id === "type" ? "categoryType" : id}`);
  const measureLabel = (id: string) => t(`reports.pivot.${id}`);

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
      {rowDims.length > 1 && (
        <div className="flex justify-end px-3 py-2 border-b border-[var(--border)]">
          <button
            onClick={toggleSubtotals}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-colors"
          >
            <ArrowUpDown size={13} />
            {subtotalsOnTop ? t("reports.subtotalsOnTop") : t("reports.subtotalsOnBottom")}
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {/* Row dimension headers */}
              {rowDims.map((dim) => (
                <th key={dim} className="text-left px-3 py-2 font-medium text-[var(--muted-foreground)]">
                  {fieldLabel(dim)}
                </th>
              ))}
              {/* Column headers: colValue × measure */}
              {colValues.map((colVal) =>
                measures.map((m) => (
                  <th key={`${colVal}-${m}`} className="text-right px-3 py-2 font-medium text-[var(--muted-foreground)] border-l border-[var(--border)]">
                    {colDim ? `${colVal} — ${measureLabel(m)}` : measureLabel(m)}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {rowDims.length === 0 ? (
              // No row dims — single row with totals
              <tr className="border-b border-[var(--border)]/50">
                {colValues.map((colVal) =>
                  measures.map((m) => {
                    const val = grandTotals[colVal]?.[m] || 0;
                    return (
                      <td key={`${colVal}-${m}`} className="text-right px-3 py-1.5 border-l border-[var(--border)]/50">
                        {cadFormatter(val)}
                      </td>
                    );
                  })
                )}
              </tr>
            ) : (
              groups.map((group) => (
                <GroupRows
                  key={group.key}
                  group={group}
                  colDim={colDim}
                  colValues={colValues}
                  measures={measures}
                  rowDims={rowDims}
                  depth={0}
                  subtotalsOnTop={subtotalsOnTop}
                />
              ))
            )}
            {/* Grand total */}
            <tr className="border-t-2 border-[var(--border)] font-bold bg-[var(--muted)]/20">
              <td colSpan={rowDims.length || 1} className="px-3 py-2">
                {t("reports.pivot.total")}
              </td>
              {colValues.map((colVal) =>
                measures.map((m) => (
                  <td key={`total-${colVal}-${m}`} className="text-right px-3 py-2 border-l border-[var(--border)]/50">
                    {cadFormatter(grandTotals[colVal]?.[m] || 0)}
                  </td>
                ))
              )}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GroupRows({
  group,
  colDim,
  colValues,
  measures,
  rowDims,
  depth,
  subtotalsOnTop,
}: {
  group: GroupNode;
  colDim: string | undefined;
  colValues: string[];
  measures: string[];
  rowDims: string[];
  depth: number;
  subtotalsOnTop: boolean;
}) {
  const isLeafLevel = depth === rowDims.length - 1;
  const subtotals = computeSubtotals(group.rows, measures, colDim);

  const subtotalRow = rowDims.length > 1 && !isLeafLevel ? (
    <tr className="bg-[var(--muted)]/30 font-semibold border-b border-[var(--border)]/50">
      <td className="px-3 py-1.5" style={{ paddingLeft: `${depth * 16 + 12}px` }}>
        {group.label}
      </td>
      {depth < rowDims.length - 1 && <td colSpan={rowDims.length - depth - 1} />}
      {colValues.map((colVal) =>
        measures.map((m) => (
          <td key={`sub-${colVal}-${m}`} className="text-right px-3 py-1.5 border-l border-[var(--border)]/50">
            {cadFormatter(subtotals[colVal]?.[m] || 0)}
          </td>
        ))
      )}
    </tr>
  ) : null;

  if (isLeafLevel) {
    // Render leaf rows: one per unique combination of remaining keys
    return (
      <>
        {group.rows.map((row, i) => (
          <tr key={i} className="border-b border-[var(--border)]/50">
            {rowDims.map((dim, di) => (
              <td key={dim} className="px-3 py-1.5" style={di === 0 ? { paddingLeft: `${depth * 16 + 12}px` } : undefined}>
                {di === depth ? row.keys[dim] || "" : di > depth ? row.keys[dim] || "" : ""}
              </td>
            ))}
            {colValues.map((colVal) =>
              measures.map((m) => {
                const matchesCol = !colDim || row.keys[colDim] === colVal;
                return (
                  <td key={`${colVal}-${m}`} className="text-right px-3 py-1.5 border-l border-[var(--border)]/50">
                    {matchesCol ? cadFormatter(row.measures[m] || 0) : ""}
                  </td>
                );
              })
            )}
          </tr>
        ))}
      </>
    );
  }

  const childContent = group.children.map((child) => (
    <GroupRows
      key={child.key}
      group={child}
      colDim={colDim}
      colValues={colValues}
      measures={measures}
      rowDims={rowDims}
      depth={depth + 1}
      subtotalsOnTop={subtotalsOnTop}
    />
  ));

  return (
    <Fragment>
      {subtotalsOnTop && subtotalRow}
      {childContent}
      {!subtotalsOnTop && subtotalRow}
    </Fragment>
  );
}
