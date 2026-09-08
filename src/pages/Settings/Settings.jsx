import Header from "../../components/layout/Header";
import EmptyState from "../../components/ui/EmptyState";

export default function Settings() {
  return (
    <>
      <Header eyebrow="CONFIGURAÇÕES" title="Configurações" />
      <main className="content">
        <EmptyState
          title="Configurações"
          description="As configurações de conta e preferências serão desenvolvidas junto com a definição de backend/autenticação (Fase 6)."
        />
      </main>
    </>
  );
}
