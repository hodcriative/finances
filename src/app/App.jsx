import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import AppRoutes from "./routes";
import { PreferencesProvider } from "./PreferencesContext";
import { AuthProvider, useAuth } from "./AuthContext";

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading } = useAuth();
  if (loading) return <main className="auth-page">Carregando...</main>;
  if (!user) return <AppRoutes />;
  return (
    <PreferencesProvider>
      <div className="app-shell">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="page"><AppRoutes /></div>
      </div>
    </PreferencesProvider>
  );
}

export default function App() {
  return <AuthProvider><AppContent /></AuthProvider>;
}
