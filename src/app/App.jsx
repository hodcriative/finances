import { useEffect, useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import AppRoutes from "./routes";
import { PreferencesProvider } from "./PreferencesContext";
import { AuthProvider, useAuth } from "./AuthContext";

function AppContent() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("finance:desktop-sidebar") === "compact");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    const applyLayoutPreference = () => {
      if (window.innerWidth > 850) {
        setCollapsed(localStorage.getItem("finance:desktop-sidebar") === "compact");
      }
    };
    window.addEventListener("finance:layout-change", applyLayoutPreference);
    return () => window.removeEventListener("finance:layout-change", applyLayoutPreference);
  }, []);

  useEffect(() => {
    const syncViewport = () => {
      if (window.innerWidth <= 850) {
        setCollapsed(true);
      } else {
        setMobileOpen(false);
        setCollapsed(localStorage.getItem("finance:desktop-sidebar") === "compact");
      }
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", mobileOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [mobileOpen]);

  if (loading) return <main className="auth-page">Carregando...</main>;
  if (!user) return <AppRoutes />;

  return (
    <PreferencesProvider>
      <div className={`app-shell ${mobileOpen ? "mobile-open" : ""}`}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <div className="page">
          <AppRoutes onMobileMenu={() => setMobileOpen(true)} />
        </div>
      </div>
    </PreferencesProvider>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
