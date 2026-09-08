import Header from "../../components/layout/Header";
import EmptyState from "../../components/ui/EmptyState";
import { useTransactions } from "../../hooks/useTransactions";
import { useCategories } from "../../hooks/useCategories";
import { useBudget } from "../../hooks/useBudget";
import { useGoals } from "../../hooks/useGoals";
import { getBudgetUsage, getBudgetAlerts, getGoalAlerts } from "../../utils/finance";
import { currentMonthKey, monthYearLabel } from "../../utils/dates";

const SEVERITY_ICON = { high: "⚠️", medium: "⏰", success: "✅" };

// Alertas são sempre derivados dos dados já cadastrados (orçamento e
// metas) — nenhum alerta é armazenado ou gerado por movimentação real
// (CLAUDE.md).
export default function Alerts() {
  const monthKey = currentMonthKey();
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { budget } = useBudget(monthKey);
  const { goals } = useGoals();

  const usage = getBudgetUsage(budget, transactions, monthKey);
  const alerts = [...getBudgetAlerts(usage, categories), ...getGoalAlerts(goals)];

  return (
    <>
      <Header eyebrow="ALERTAS" title="Alertas" />
      <main className="content">
        <p className="page-lead">
          Alertas calculados a partir do orçamento e das metas de {monthYearLabel(monthKey)} — nenhum dado extra é
          armazenado, tudo é recalculado a partir dos seus lançamentos, limites e metas.
        </p>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>Alertas do mês</h2><p>{alerts.length} alerta(s) encontrado(s)</p></div>
          </div>
          {alerts.length === 0 ? (
            <EmptyState
              icon="🔔"
              title="Nenhum alerta no momento"
              description="Quando um limite de orçamento for ultrapassado ou uma meta for concluída, os alertas aparecem aqui."
            />
          ) : (
            <div className="alert-list">
              {alerts.map((alert) => (
                <div key={alert.id} className={`alert-row ${alert.severity}`}>
                  <span className="alert-icon">{SEVERITY_ICON[alert.severity] || "🔔"}</span>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
