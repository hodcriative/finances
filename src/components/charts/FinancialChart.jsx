import { ChevronDown } from "lucide-react";
import { formatCurrency } from "../../utils/currency";

function compactLabel(value) {
  if (value >= 1000) return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
}

export default function FinancialChart({ series }) {
  const max = Math.max(1, ...series.flatMap((item) => [item.income, item.expense])) * 1.15;

  function handleParallax(event) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    event.currentTarget.style.setProperty("--chart-tilt-x", `${-y * 3.5}deg`);
    event.currentTarget.style.setProperty("--chart-tilt-y", `${x * 4}deg`);
    event.currentTarget.style.setProperty("--chart-glow-x", `${(x + 0.5) * 100}%`);
    event.currentTarget.style.setProperty("--chart-glow-y", `${(y + 0.5) * 100}%`);
  }

  function resetParallax(event) {
    event.currentTarget.style.removeProperty("--chart-tilt-x");
    event.currentTarget.style.removeProperty("--chart-tilt-y");
  }

  return (
    <section className="panel chart-panel chart-panel--interactive" onMouseMove={handleParallax} onMouseLeave={resetParallax}>
      <div className="panel-heading">
        <div><h2>Evolução financeira</h2><p>Receitas e despesas nos últimos {series.length} meses</p></div>
        <button type="button" className="select-btn" disabled>
          Últimos {series.length} meses <ChevronDown size={15} />
        </button>
      </div>
      <div className="legend"><span><i className="legend-income" /> Receitas</span><span><i className="legend-expense" /> Despesas</span></div>
      <div className="chart">
        <div className="y-axis">
          <span>{compactLabel(max)}</span>
          <span>{compactLabel(max * 0.66)}</span>
          <span>{compactLabel(max * 0.33)}</span>
          <span>0</span>
        </div>
        <div className="chart-area">
          <div className="grid-lines"><i /><i /><i /><i /></div>
          <div className="bars">
            {series.map((item, index) => (
              <div className="bar-group" key={item.key}>
                <div className="bars-wrap" style={{ "--chart-delay": `${index * 75}ms` }}>
                  <span className="bar income" style={{ height: `${(item.income / max) * 100}%` }} title={`Receitas: ${formatCurrency(item.income)}`} aria-label={`Receitas em ${item.month}: ${formatCurrency(item.income)}`} />
                  <span className="bar expense" style={{ height: `${(item.expense / max) * 100}%` }} title={`Despesas: ${formatCurrency(item.expense)}`} aria-label={`Despesas em ${item.month}: ${formatCurrency(item.expense)}`} />
                </div>
                <small>{item.month}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
