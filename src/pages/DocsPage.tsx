import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  Rocket,
  LayoutDashboard,
  Upload,
  ArrowLeftRight,
  Tags,
  SlidersHorizontal,
  PiggyBank,
  BarChart3,
  Settings,
  ArrowLeft,
  Lightbulb,
  ListChecks,
  Footprints,
  Printer,
} from "lucide-react";

const SECTIONS = [
  { key: "gettingStarted", icon: Rocket },
  { key: "dashboard", icon: LayoutDashboard },
  { key: "import", icon: Upload },
  { key: "transactions", icon: ArrowLeftRight },
  { key: "categories", icon: Tags },
  { key: "adjustments", icon: SlidersHorizontal },
  { key: "budget", icon: PiggyBank },
  { key: "reports", icon: BarChart3 },
  { key: "settings", icon: Settings },
] as const;

export default function DocsPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].key);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll spy via IntersectionObserver
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      {
        root: container,
        rootMargin: "-10% 0px -80% 0px",
        threshold: 0,
      }
    );

    for (const { key } of SECTIONS) {
      const el = sectionRefs.current[key];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  // Handle initial anchor from URL
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && sectionRefs.current[hash]) {
      requestAnimationFrame(() => {
        sectionRefs.current[hash]?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [location.hash]);

  const scrollToSection = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar TOC */}
      <nav className="w-56 shrink-0 border-r border-[var(--border)] p-4 overflow-y-auto">
        <Link
          to="/settings"
          className="flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          {t("docs.backToSettings")}
        </Link>

        <h2 className="text-sm font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
          {t("docs.title")}
        </h2>

        <ul className="space-y-1">
          {SECTIONS.map(({ key, icon: Icon }) => (
            <li key={key}>
              <button
                onClick={() => scrollToSection(key)}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === key
                    ? "bg-[var(--primary)] text-white font-medium"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--border)] hover:text-[var(--foreground)]"
                }`}
              >
                <Icon size={15} />
                {t(`docs.${key}.title`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Scrollable content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{t("docs.title")}</h1>
            <button
              onClick={() => window.print()}
              className="print:hidden flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
              title={t("docs.print")}
            >
              <Printer size={16} />
              {t("docs.print")}
            </button>
          </div>

          {SECTIONS.map(({ key, icon: Icon }) => (
            <section
              key={key}
              id={key}
              ref={(el) => {
                sectionRefs.current[key] = el;
              }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4"
            >
              {/* Section header */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
                  <Icon size={20} />
                </div>
                <h2 className="text-lg font-semibold">
                  {t(`docs.${key}.title`)}
                </h2>
              </div>

              {/* Overview */}
              <p className="text-[var(--muted-foreground)]">
                {t(`docs.${key}.overview`)}
              </p>

              {/* Features */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  <ListChecks size={14} />
                  {t("docs.features")}
                </h3>
                <ul className="space-y-1">
                  {(
                    t(`docs.${key}.features`, {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-[var(--primary)] mt-0.5 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  <Footprints size={14} />
                  {key === "gettingStarted"
                    ? t("docs.quickStart")
                    : t("docs.howTo")}
                </h3>
                <ol className="space-y-1 list-decimal list-inside">
                  {(
                    t(`docs.${key}.steps`, {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, i) => (
                    <li key={i} className="text-sm">
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Tips */}
              <div className="bg-[var(--background)] rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                  <Lightbulb size={14} />
                  {t("docs.tipsHeader")}
                </h3>
                <ul className="space-y-1">
                  {(
                    t(`docs.${key}.tips`, {
                      returnObjects: true,
                    }) as string[]
                  ).map((item, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--muted-foreground)]"
                    >
                      <Lightbulb size={13} className="text-[var(--primary)] mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
