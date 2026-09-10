import {
  Bell, ChevronRight, CircleHelp, CreditCard,
  Home, LineChart, Menu, Settings, Target,
  ReceiptText, WalletCards, X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { usePreferences } from "../../app/PreferencesContext";
import { useAlerts } from "../../hooks/useAlerts";

const NAV_ITEMS = [
  ["/", "Dashboard", Home],
  ["/transacoes", "Transações", ReceiptText],
  ["/analises", "Análises", LineChart],
  ["/orcamento", "Orçamento", WalletCards],
  ["/metas", "Metas", Target],
  ["/cartoes", "Cartões", CreditCard],
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const { preferences } = usePreferences();
  const { alerts } = useAlerts({
    includeBudget: preferences.notifyBudgetAlerts,
    includeGoals: preferences.notifyGoalAlerts,
    includeIncomeExpense: preferences.notifyIncomeExpenseAlerts,
  });
  const alertsCount = alerts.length;
  const initial = preferences.name?.trim()?.[0]?.toUpperCase() || "F";
  // No celular, a sidebar vira uma gaveta: mesmo que o modo compacto esteja
  // salvo para desktop, os nomes precisam aparecer ao abrir o menu.
  const isCompact = collapsed && !mobileOpen;

  function toggleSidebar() {
    if (window.innerWidth <= 850) {
      setMobileOpen(false);
      return;
    }
    const nextCollapsed = !collapsed;
    localStorage.setItem("finance:desktop-sidebar", nextCollapsed ? "compact" : "expanded");
    setCollapsed(nextCollapsed);
  }

  return (
    <aside className={`sidebar ${isCompact ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">F</div>
        {!isCompact && <div><strong>FINANCE</strong><span>Seu dinheiro, organizado.</span></div>}
      </div>

      <button className="collapse-btn" onClick={toggleSidebar} aria-label={isCompact ? "Expandir menu" : "Recolher menu"} title={isCompact ? "Expandir menu" : "Recolher menu"}>
        {isCompact ? <Menu size={18} /> : <X size={18} />}
      </button>

      <nav className="nav">
        <div className="nav-label">{!isCompact && "PRINCIPAL"}</div>
        {NAV_ITEMS.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={19} />
            {!isCompact && <span>{label}</span>}
          </NavLink>
        ))}

        <div className="nav-label nav-spacer">{!isCompact && "GERENCIAMENTO"}</div>
        <NavLink to="/alertas" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Bell size={19} />
          {!isCompact && (
            <>
              <span>Alertas</span>
              {alertsCount > 0 && <b className="notification-dot">{alertsCount}</b>}
            </>
          )}
        </NavLink>
      </nav>

      <div className="sidebar-bottom">
        <NavLink to="/configuracoes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Settings size={19} />{!isCompact && <span>Configurações</span>}
        </NavLink>
        <NavLink to="/ajuda" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <CircleHelp size={19} />{!isCompact && <span>Ajuda</span>}
        </NavLink>
        {!isCompact && (
          <div className="profile-mini" title="Gerencie sua conta em Configurações">
            <div className="avatar">{initial}</div>
            <div><strong>{preferences.name || "Seu perfil"}</strong><span>Conta e preferências</span></div>
            <ChevronRight size={16} />
          </div>
        )}
      </div>
    </aside>
  );
}
