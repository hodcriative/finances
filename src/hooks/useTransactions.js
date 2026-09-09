import { useCallback, useEffect, useState } from "react";
import { transactions as transactionService } from "../services/domainApiService";

// Estado central do domínio de transações. Qualquer página que precise
// ler ou alterar lançamentos deve usar este hook, para que Dashboard,
// Transações e Análises fiquem sempre sincronizados.
export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  useEffect(() => { transactionService.all().then(setTransactions).catch(console.error); }, []);

  const addTransaction = useCallback(async (input) => {
    const created = await transactionService.create(input);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const editTransaction = useCallback(async (id, patch) => {
    const updated = await transactionService.update(id, patch);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTransaction = useCallback(async (id) => {
    await transactionService.remove(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { transactions, addTransaction, editTransaction, deleteTransaction };
}
