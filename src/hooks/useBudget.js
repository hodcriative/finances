import { useCallback, useEffect, useState } from "react";
import { budgets as budgetService } from "../services/domainApiService";

// Estado central do orçamento de um mês. `monthKey` segue o mesmo formato
// usado em Transações/Dashboard ("2026-09"). Se ainda não existir um
// registro para o mês, expõe um orçamento vazio (sem limites) até que o
// usuário defina algum.
export function useBudget(monthKey) {
  const [budget, setBudget] = useState({ id: null, month: monthKey, totalLimit: 0, categories: [] });
  useEffect(() => { budgetService.get(monthKey).then(setBudget).catch(console.error); }, [monthKey]);

  const saveTotalLimit = useCallback(
    async (totalLimit) => {
      setBudget(await budgetService.total(monthKey, totalLimit));
    },
    [monthKey]
  );

  const saveCategoryLimit = useCallback(
    async (categoryId, limit) => {
      setBudget(await budgetService.category(monthKey, categoryId, limit));
    },
    [monthKey]
  );

  const removeCategoryLimit = useCallback(
    async (categoryId) => {
      setBudget(await budgetService.removeCategory(monthKey, categoryId));
    },
    [monthKey]
  );

  return { budget, saveTotalLimit, saveCategoryLimit, removeCategoryLimit };
}
