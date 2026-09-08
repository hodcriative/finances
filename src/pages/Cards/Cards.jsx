import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "../../components/layout/Header";
import Modal from "../../components/ui/Modal";
import EmptyState from "../../components/ui/EmptyState";
import CardTile from "../../components/finance/CardTile";
import CardForm from "../../components/finance/CardForm";
import AccountRow from "../../components/finance/AccountRow";
import AccountForm from "../../components/finance/AccountForm";
import CategoryRow from "../../components/finance/CategoryRow";
import CategoryForm from "../../components/finance/CategoryForm";
import { useAccounts } from "../../hooks/useAccounts";
import { useCategories } from "../../hooks/useCategories";

const TABS = [
  { id: "cards", label: "Cartões" },
  { id: "accounts", label: "Contas" },
  { id: "categories", label: "Categorias" },
];

export default function Cards() {
  const [tab, setTab] = useState("cards");
  const { cards, bankAccounts, addCard, addAccount, editAccount, deactivateAccount } = useAccounts();
  const { categories, addCategory, editCategory, deactivateCategory, deleteCategory } = useCategories();
  const [modalState, setModalState] = useState(null); // { domain, mode, record? }

  function closeModal() {
    setModalState(null);
  }

  function handleSubmit(data) {
    if (modalState.domain === "card") {
      if (modalState.mode === "edit") editAccount(modalState.record.id, data);
      else addCard(data);
    } else if (modalState.domain === "account") {
      if (modalState.mode === "edit") editAccount(modalState.record.id, data);
      else addAccount(data);
    } else if (modalState.domain === "category") {
      if (modalState.mode === "edit") editCategory(modalState.record.id, data);
      else addCategory(data);
    }
    closeModal();
  }

  function handleDeactivate(record) {
    const confirmed = window.confirm(
      `Desativar "${record.name}"? Lançamentos já existentes continuam mostrando o histórico normalmente.`
    );
    if (confirmed) deactivateAccount(record.id);
  }

  function handleDeleteCategory(category) {
    const confirmed = window.confirm(
      `Desativar a categoria "${category.name}"? Lançamentos já existentes continuam mostrando o histórico normalmente.`
    );
    if (confirmed) deactivateCategory(category.id);
  }

  return (
    <>
      <Header eyebrow="DOMÍNIOS DE APOIO" title="Cartões, contas e categorias" />
      <main className="content">
        <p className="page-lead">
          Cartões e contas aqui são registros representativos, atualizados manualmente por você — nenhuma cobrança,
          transferência ou fatura real é processada por esta plataforma.
        </p>

        <div className="tabs-bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab-btn ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "cards" && (
          <section className="panel" style={{ marginTop: 15 }}>
            <div className="panel-heading">
              <div><h2>Cartões representativos</h2><p>Limite e fatura são informados manualmente</p></div>
              <button type="button" className="primary-btn" onClick={() => setModalState({ domain: "card", mode: "create" })}>
                <Plus size={18} /> Novo cartão
              </button>
            </div>
            {cards.length === 0 ? (
              <EmptyState
                icon="💳"
                title="Nenhum cartão cadastrado"
                description="Cadastre seus cartões para organizar limite e fatura manualmente."
              />
            ) : (
              <div className="card-grid">
                {cards.map((card) => (
                  <CardTile
                    key={card.id}
                    card={card}
                    onEdit={(c) => setModalState({ domain: "card", mode: "edit", record: c })}
                    onDelete={handleDeactivate}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "accounts" && (
          <section className="panel" style={{ marginTop: 15 }}>
            <div className="panel-heading">
              <div><h2>Contas</h2><p>Registros informativos, sem conexão bancária</p></div>
              <button type="button" className="primary-btn" onClick={() => setModalState({ domain: "account", mode: "create" })}>
                <Plus size={18} /> Nova conta
              </button>
            </div>
            {bankAccounts.length === 0 ? (
              <EmptyState
                icon="🏦"
                title="Nenhuma conta cadastrada"
                description="Cadastre uma conta para organizar seus lançamentos."
              />
            ) : (
              <div className="transaction-list padded">
                {bankAccounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    onEdit={(a) => setModalState({ domain: "account", mode: "edit", record: a })}
                    onDelete={handleDeactivate}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "categories" && (
          <section className="panel" style={{ marginTop: 15 }}>
            <div className="panel-heading">
              <div><h2>Categorias</h2><p>Usadas para classificar receitas e despesas</p></div>
              <button type="button" className="primary-btn" onClick={() => setModalState({ domain: "category", mode: "create" })}>
                <Plus size={18} /> Nova categoria
              </button>
            </div>
            {categories.length === 0 ? (
              <EmptyState
                icon="🏷️"
                title="Nenhuma categoria cadastrada"
                description="Cadastre categorias para organizar seus lançamentos."
              />
            ) : (
              <div className="transaction-list padded">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    onEdit={(c) => setModalState({ domain: "category", mode: "edit", record: c })}
                    onDelete={handleDeleteCategory}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {modalState?.domain === "card" && (
        <Modal
          eyebrow={modalState.mode === "edit" ? "EDITAR CARTÃO" : "NOVO CARTÃO"}
          title="Dados do cartão"
          onClose={closeModal}
        >
          <CardForm
            initialValue={modalState.mode === "edit" ? modalState.record : undefined}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modalState?.domain === "account" && (
        <Modal
          eyebrow={modalState.mode === "edit" ? "EDITAR CONTA" : "NOVA CONTA"}
          title="Dados da conta"
          onClose={closeModal}
        >
          <AccountForm
            initialValue={modalState.mode === "edit" ? modalState.record : undefined}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {modalState?.domain === "category" && (
        <Modal
          eyebrow={modalState.mode === "edit" ? "EDITAR CATEGORIA" : "NOVA CATEGORIA"}
          title="Dados da categoria"
          onClose={closeModal}
        >
          <CategoryForm
            initialValue={modalState.mode === "edit" ? modalState.record : undefined}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        </Modal>
      )}
    </>
  );
}
