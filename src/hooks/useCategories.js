import { useCallback, useEffect, useState } from "react";
import { categories as categoryService } from "../services/domainApiService";

// Estado central do domínio de categorias, no mesmo padrão de
// useTransactions.js, para manter Transações, Dashboard e a tela de
// Categorias sincronizadas.
export function useCategories() {
  const [categories, setCategories] = useState([]);
  useEffect(() => { categoryService.all().then(setCategories).catch(console.error); }, []);

  const addCategory = useCallback(async (input) => {
    const created = await categoryService.create(input);
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  const editCategory = useCallback(async (id, patch) => {
    const updated = await categoryService.update(id, patch);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deactivateCategory = useCallback(async (id) => {
    const updated = await categoryService.update(id, { active: false });
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await categoryService.remove(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { categories, addCategory, editCategory, deactivateCategory, deleteCategory };
}
