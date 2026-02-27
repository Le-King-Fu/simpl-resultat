import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { useProfile } from "./contexts/ProfileContext";
import AppShell from "./components/layout/AppShell";
import DashboardPage from "./pages/DashboardPage";
import ImportPage from "./pages/ImportPage";
import TransactionsPage from "./pages/TransactionsPage";
import CategoriesPage from "./pages/CategoriesPage";
import AdjustmentsPage from "./pages/AdjustmentsPage";
import BudgetPage from "./pages/BudgetPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import DocsPage from "./pages/DocsPage";
import ProfileSelectionPage from "./pages/ProfileSelectionPage";

export default function App() {
  const { activeProfile, isLoading, refreshKey, connectActiveProfile } = useProfile();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    if (activeProfile && !isLoading) {
      setDbReady(false);
      connectActiveProfile()
        .then(() => setDbReady(true))
        .catch((err) => console.error("Failed to connect profile:", err));
    }
  }, [activeProfile, isLoading, connectActiveProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!activeProfile) {
    return <ProfileSelectionPage />;
  }

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--background)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  return (
    <BrowserRouter key={refreshKey}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/adjustments" element={<AdjustmentsPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
