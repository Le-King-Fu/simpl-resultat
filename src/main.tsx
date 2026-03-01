import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ProfileProvider } from "./contexts/ProfileContext";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import "./i18n/config";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ProfileProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ProfileProvider>
  </React.StrictMode>,
);
