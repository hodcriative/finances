import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Plus, Search, Settings, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePreferences } from "../../app/PreferencesContext";
import { useAuth } from "../../app/AuthContext";
import { useAlerts } from "../../hooks/useAlerts";
import Modal from "../ui/Modal";

function preview(text, limit = 92) {
  return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

const SEVERITY_LABEL = { high: "Atenção", medium: "Acompanhar", success: "Concluído" };

export default function Header({
  eyebrow,
  title,
  onNewTransaction,
  newTransactionLabel = "Nova transação",
  search,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  onMobileMenu,
}) {
  const { preferences } = usePreferences();
  const { logout } = useAuth();
  const { alerts, monthKey } = useAlerts({
    includeBudget: preferences.notifyBudgetAlerts,
    includeGoals: preferences.notifyGoalAlerts,
    includeIncomeExpense: preferences.notifyIncomeExpenseAlerts,
  });
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [readAlertIds, setReadAlertIds] = useState([]);
  const [openedAt] = useState(() => new Date());
  const initial = preferences.name?.trim()?.[0]?.toUpperCase() || "F";
  const firstName = preferences.name?.trim()?.split(" ")[0] || "Fellipe";
  const unreadAlerts = alerts.filter((alert) => !readAlertIds.includes(alert.id));
  const alertDate = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(openedAt);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) setOpenMenu(null);
    }
    function closeOnEscape(event) {
      if (event.key !== "Escape") return;
      if (selectedAlert) setSelectedAlert(null);
      else setOpenMenu(null);
    }
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedAlert]);

  function toggleMenu(menu) {
    setOpenMenu((current) => (current === menu ? null : menu));
  }

  function openAlert(alert) {
    setReadAlertIds((current) => [...new Set([...current, alert.id])]);
    setOpenMenu(null);
    setSelectedAlert(alert);
  }

  function goToProfile() {
    setOpenMenu(null);
    navigate("/configuracoes#perfil");
  }

  function goToSettings() {
    setOpenMenu(null);
    navigate("/configuracoes");
  }

  async function handleLogout() {
    setOpenMenu(null);
    await logout();
  }

  return (
    <>
    <header className="header" ref={headerRef}>
      <div className="header-title">
        {onMobileMenu && <button className="mobile-menu-btn" onClick={onMobileMenu} aria-label="Abrir menu"><Menu size={20} /></button>}
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
        </div>
      </div>
      <div className="header-actions">
        {onSearchChange && (
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        )}
        <div className="header-popover-anchor">
          <button type="button" className="icon-btn header-alerts-btn" onClick={() => toggleMenu("alerts")} aria-label="Abrir notificações" aria-haspopup="menu" aria-expanded={openMenu === "alerts"} title="Notificações">
            <Bell size={19} />
            {unreadAlerts.length > 0 && <i />}
          </button>
          {openMenu === "alerts" && (
            <div className="navbar-dropdown notifications-dropdown" role="menu" aria-label="Notificações">
              <div className="navbar-dropdown-head"><div><strong>Notificações</strong><span>{unreadAlerts.length ? `${unreadAlerts.length} não lida(s)` : "Tudo em dia"}</span></div></div>
              <div className="notification-preview-list">
                {alerts.length === 0 ? <p className="navbar-empty">Nenhuma notificação para este mês.</p> : alerts.slice(0, 3).map((alert) => (
                  <button type="button" className={`notification-preview ${readAlertIds.includes(alert.id) ? "read" : ""}`} key={alert.id} onClick={() => openAlert(alert)} role="menuitem">
                    <span className={`notification-severity ${alert.severity}`} />
                    <span><strong>{alert.title}</strong><small>{preview(alert.message)}</small><em>{alertDate}</em></span>
                  </button>
                ))}
              </div>
              <button type="button" className="navbar-dropdown-link" onClick={() => { setOpenMenu(null); navigate("/alertas"); }}>Ver todas as notificações</button>
            </div>
          )}
        </div>
        <div className="header-popover-anchor">
          <button type="button" className={`user-menu${openMenu === "user" ? " is-open" : ""}`} onClick={() => toggleMenu("user")} aria-label="Abrir menu do usuário" aria-haspopup="menu" aria-expanded={openMenu === "user"}>
            <div className="avatar">{initial}</div><span>{firstName}</span><ChevronDown size={15} />
          </button>
          {openMenu === "user" && (
            <div className="navbar-dropdown user-dropdown" role="menu" aria-label="Menu do usuário">
              <div className="user-dropdown-profile"><div className="avatar">{initial}</div><div><strong>{preferences.name || "Seu perfil"}</strong><span>Conta e preferências</span></div></div>
              <button type="button" onClick={goToProfile} role="menuitem"><UserRound size={16} /> Acessar perfil</button>
              <button type="button" onClick={goToSettings} role="menuitem"><Settings size={16} /> Configurações de Conta</button>
              <hr />
              <button type="button" className="user-menu-logout" onClick={handleLogout} role="menuitem"><LogOut size={16} /> Sair</button>
            </div>
          )}
        </div>
        {onNewTransaction && (
          <button className="primary-btn" onClick={onNewTransaction}>
            <Plus size={18} /> {newTransactionLabel}
          </button>
        )}
      </div>
    </header>
    {selectedAlert && (
      <Modal eyebrow={SEVERITY_LABEL[selectedAlert.severity] || "NOTIFICAÇÃO"} title={selectedAlert.title} onClose={() => setSelectedAlert(null)}>
        <div className="notification-detail">
          <p>{selectedAlert.message}</p>
          <small>{alertDate} · {monthKey}</small>
          <div className="modal-actions"><button type="button" className="primary-btn" onClick={() => setSelectedAlert(null)}>Fechar</button></div>
        </div>
      </Modal>
    )}
    </>
  );
}
