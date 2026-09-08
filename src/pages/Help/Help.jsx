import Header from "../../components/layout/Header";
import EmptyState from "../../components/ui/EmptyState";

export default function Help() {
  return (
    <>
      <Header eyebrow="AJUDA" title="Central de ajuda" />
      <main className="content">
        <EmptyState
          title="Central de ajuda"
          description="A central de ajuda será desenvolvida nas próximas etapas do projeto."
        />
      </main>
    </>
  );
}
