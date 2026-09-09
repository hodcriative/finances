import { useCallback, useEffect, useMemo, useState } from "react";
import { purchases as cardPurchaseService } from "../services/domainApiService";

// Estado central das compras parceladas representativas por cartão, no
// mesmo padrão de useAccounts.js / useGoals.js.
export function useCardPurchases() {
  const [purchases, setPurchases] = useState([]);
  useEffect(() => { cardPurchaseService.all().then(setPurchases).catch(console.error); }, []);

  const byCard = useMemo(() => {
    const map = new Map();
    for (const purchase of purchases) {
      const list = map.get(purchase.cardId) || [];
      list.push(purchase);
      map.set(purchase.cardId, list);
    }
    return map;
  }, [purchases]);

  const getPurchasesByCard = useCallback((cardId) => byCard.get(cardId) || [], [byCard]);

  const addPurchase = useCallback(async (input) => {
    const created = await cardPurchaseService.create(input);
    setPurchases((prev) => [created, ...prev]);
    return created;
  }, []);

  const editPurchase = useCallback(async (id, patch) => {
    const updated = await cardPurchaseService.update(id, patch);
    setPurchases((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const deletePurchase = useCallback(async (id) => {
    await cardPurchaseService.remove(id);
    setPurchases((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const deletePurchasesByCard = useCallback(async (cardId) => {
    await Promise.all(purchases.filter((p) => p.cardId === cardId).map((p) => cardPurchaseService.remove(p.id)));
    setPurchases((prev) => prev.filter((p) => p.cardId !== cardId));
  }, [purchases]);

  return {
    purchases,
    getPurchasesByCard,
    addPurchase,
    editPurchase,
    deletePurchase,
    deletePurchasesByCard,
  };
}
