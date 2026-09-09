import { useCallback, useEffect, useState } from "react";
import { goals as goalService } from "../services/domainApiService";

export function useGoals() {
  const [goals, setGoals] = useState([]);
  useEffect(() => { goalService.all().then(setGoals).catch(console.error); }, []);

  const addGoal = useCallback(async (input) => {
    const created = await goalService.create(input);
    setGoals((prev) => [...prev, created]);
    return created;
  }, []);

  const editGoal = useCallback(async (id, patch) => {
    const updated = await goalService.update(id, patch);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  // Aporte é registro/planejamento de progresso, nunca transferência real.
  const contributeToGoal = useCallback(async (id, amount) => {
    const updated = await goalService.contribute(id, amount);
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const setGoalStatus = useCallback(async (id, status) => {
    const updated = await goalService.update(id, { status });
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const deleteGoal = useCallback(async (id) => {
    await goalService.remove(id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  return { goals, addGoal, editGoal, contributeToGoal, setGoalStatus, deleteGoal };
}
