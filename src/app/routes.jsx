import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import Transactions from "../pages/Transactions/Transactions";
import Analytics from "../pages/Analytics/Analytics";
import Budget from "../pages/Budget/Budget";
import Goals from "../pages/Goals/Goals";
import Cards from "../pages/Cards/Cards";
import Alerts from "../pages/Alerts/Alerts";
import Settings from "../pages/Settings/Settings";
import Help from "../pages/Help/Help";
import EmptyState from "../components/ui/EmptyState";
import Auth from "../pages/Auth/Auth";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

function Protected({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function NotFound() {
  return (
    <main className="content">
      <EmptyState title="Página não encontrada" description="Verifique o endereço ou volte para o Dashboard." />
    </main>
  );
}

export default function AppRoutes({ onMobileMenu }) {
  return (
    <Routes>
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/cadastro" element={<Auth mode="register" />} />
      <Route path="/" element={<Protected><Dashboard onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/dashboard" element={<Protected><Dashboard onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/transacoes" element={<Protected><Transactions onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/analises" element={<Protected><Analytics onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/orcamento" element={<Protected><Budget onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/metas" element={<Protected><Goals onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/cartoes" element={<Protected><Cards onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/alertas" element={<Protected><Alerts onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/configuracoes" element={<Protected><Settings onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="/ajuda" element={<Protected><Help onMobileMenu={onMobileMenu} /></Protected>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
