import { useCallback, useEffect, useMemo, useState } from "react";
import { accounts as accountService } from "../services/domainApiService";

// Estado central do domínio de contas e cartões representativos, no
// mesmo padrão de useTransactions.js.
export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  useEffect(() => { accountService.all().then(setAccounts).catch(console.error); }, []);

  const bankAccounts = useMemo(() => accounts.filter((a) => a.kind === "account"), [accounts]);
  const cards = useMemo(() => accounts.filter((a) => a.kind === "card"), [accounts]);

  const addAccount = useCallback(async (input) => {
    const created = await accountService.create({ ...input, kind: "account" });
    setAccounts((prev) => [...prev, created]);
    return created;
  }, []);

  const addCard = useCallback(async (input) => {
    const created = await accountService.create({ ...input, kind: "card" });
    setAccounts((prev) => [...prev, created]);
    return created;
  }, []);

  const editAccount = useCallback(async (id, patch) => {
    const updated = await accountService.update(id, patch);
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const deactivateAccount = useCallback(async (id) => {
    const updated = await accountService.update(id, { active: false });
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const deleteAccount = useCallback(async (id) => {
    await accountService.remove(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    accounts,
    bankAccounts,
    cards,
    addAccount,
    addCard,
    editAccount,
    deactivateAccount,
    deleteAccount,
  };
}
