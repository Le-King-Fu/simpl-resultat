import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  ArrowLeftRight,
  Tags,
  SlidersHorizontal,
  PiggyBank,
  BarChart3,
  Settings,
  Languages,
  Moon,
  Sun,
} from "lucide-react";
import { NAV_ITEMS, APP_NAME } from "../../shared/constants";
import { useTheme } from "../../hooks/useTheme";

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  LayoutDashboard,
  Upload,
  ArrowLeftRight,
  Tags,
  SlidersHorizontal,
  PiggyBank,
  BarChart3,
  Settings,
};

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const toggleLanguage = () => {
    const next = i18n.language === "fr" ? "en" : "fr";
    i18n.changeLanguage(next);
  };

  return (
    <aside className="flex flex-col w-60 h-screen bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)]">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-lg font-bold tracking-tight">{APP_NAME}</h1>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--sidebar-active)] text-white"
                    : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-hover)]"
                }`
              }
            >
              {Icon && <Icon size={18} />}
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? t("common.lightMode") : t("common.darkMode")}</span>
        </button>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <Languages size={18} />
          <span>{i18n.language === "fr" ? "English" : "Français"}</span>
        </button>
      </div>
    </aside>
  );
}
