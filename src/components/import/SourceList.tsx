import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import type { ScannedSource } from "../../shared/types";
import SourceCard from "./SourceCard";

interface SourceListProps {
  sources: ScannedSource[];
  configuredSourceNames: Set<string>;
  importedFileNames: Map<string, Set<string>>;
  onSelectSource: (source: ScannedSource) => void;
}

export default function SourceList({
  sources,
  configuredSourceNames,
  importedFileNames,
  onSelectSource,
}: SourceListProps) {
  const { t } = useTranslation();

  if (sources.length === 0) {
    return (
      <div className="bg-[var(--card)] rounded-xl p-12 border-2 border-dashed border-[var(--border)] text-center">
        <Inbox
          size={40}
          className="mx-auto mb-4 text-[var(--muted-foreground)]"
        />
        <p className="text-[var(--muted-foreground)]">
          {t("import.sources.empty")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">
        {t("import.sources.title")}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => {
          const isConfigured = configuredSourceNames.has(source.folder_name);
          // Count files not yet imported for this source
          const sourceHashes = importedFileNames.get(source.folder_name);
          const newFileCount = sourceHashes
            ? source.files.filter(
                (f) => !sourceHashes.has(f.filename)
              ).length
            : source.files.length;

          return (
            <SourceCard
              key={source.folder_path}
              source={source}
              isConfigured={isConfigured}
              newFileCount={newFileCount}
              onClick={() => onSelectSource(source)}
            />
          );
        })}
      </div>
    </div>
  );
}
