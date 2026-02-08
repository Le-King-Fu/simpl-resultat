import { useTranslation } from "react-i18next";
import type { ColumnMapping, AmountMode } from "../../shared/types";

interface ColumnMappingEditorProps {
  headers: string[];
  mapping: ColumnMapping;
  amountMode: AmountMode;
  onMappingChange: (mapping: ColumnMapping) => void;
  onAmountModeChange: (mode: AmountMode) => void;
}

export default function ColumnMappingEditor({
  headers,
  mapping,
  amountMode,
  onMappingChange,
  onAmountModeChange,
}: ColumnMappingEditorProps) {
  const { t } = useTranslation();

  const columnOptions = headers.map((h, i) => (
    <option key={i} value={i}>
      {i}: {h}
    </option>
  ));

  const selectClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]";

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">
        {t("import.config.columnMapping")}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.dateColumn")}
          </label>
          <select
            value={mapping.date}
            onChange={(e) =>
              onMappingChange({ ...mapping, date: parseInt(e.target.value) })
            }
            className={selectClass}
          >
            {columnOptions}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.descriptionColumn")}
          </label>
          <select
            value={mapping.description}
            onChange={(e) =>
              onMappingChange({
                ...mapping,
                description: parseInt(e.target.value),
              })
            }
            className={selectClass}
          >
            {columnOptions}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm text-[var(--muted-foreground)] mb-1">
          {t("import.config.amountMode")}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="amountMode"
              value="single"
              checked={amountMode === "single"}
              onChange={() => onAmountModeChange("single")}
              className="accent-[var(--primary)]"
            />
            {t("import.config.singleAmount")}
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="amountMode"
              value="debit_credit"
              checked={amountMode === "debit_credit"}
              onChange={() => onAmountModeChange("debit_credit")}
              className="accent-[var(--primary)]"
            />
            {t("import.config.debitCredit")}
          </label>
        </div>
      </div>

      {amountMode === "single" ? (
        <div>
          <label className="block text-sm text-[var(--muted-foreground)] mb-1">
            {t("import.config.amountColumn")}
          </label>
          <select
            value={mapping.amount ?? 0}
            onChange={(e) =>
              onMappingChange({
                ...mapping,
                amount: parseInt(e.target.value),
                debitAmount: undefined,
                creditAmount: undefined,
              })
            }
            className={selectClass}
          >
            {columnOptions}
          </select>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">
              {t("import.config.debitColumn")}
            </label>
            <select
              value={mapping.debitAmount ?? 0}
              onChange={(e) =>
                onMappingChange({
                  ...mapping,
                  debitAmount: parseInt(e.target.value),
                  amount: undefined,
                })
              }
              className={selectClass}
            >
              {columnOptions}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted-foreground)] mb-1">
              {t("import.config.creditColumn")}
            </label>
            <select
              value={mapping.creditAmount ?? 0}
              onChange={(e) =>
                onMappingChange({
                  ...mapping,
                  creditAmount: parseInt(e.target.value),
                  amount: undefined,
                })
              }
              className={selectClass}
            >
              {columnOptions}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
