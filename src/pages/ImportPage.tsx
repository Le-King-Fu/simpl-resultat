import { useTranslation } from "react-i18next";
import { Upload } from "lucide-react";

export default function ImportPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("import.title")}</h1>
      <div className="bg-[var(--card)] rounded-xl p-12 border-2 border-dashed border-[var(--border)] text-center">
        <Upload size={40} className="mx-auto mb-4 text-[var(--muted-foreground)]" />
        <p className="text-[var(--muted-foreground)]">{t("import.dropzone")}</p>
      </div>
    </div>
  );
}
