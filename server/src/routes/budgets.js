import { Router } from "express";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";

const router = Router();

function serializeBudget(budgetRow, categoryRows) {
  return {
    id: budgetRow.id,
    month: budgetRow.month,
    totalLimit: budgetRow.total_limit,
    categories: categoryRows.map((c) => ({ categoryId: c.category_id, limit: c.limit_amount })),
  };
}

// Garante que exista um registro de orçamento para o mês, criando um
// vazio quando necessário — mesmo comportamento de
// src/services/budgetService.js#ensureMonth no frontend.
function ensureMonth(userId, month) {
  const existing = db.prepare("SELECT * FROM budgets WHERE user_id = ? AND month = ?").get(userId, month);
  if (existing) return existing;
  const id = generateId("budget");
  db.prepare("INSERT INTO budgets (id, user_id, month, total_limit) VALUES (?, ?, ?, 0)").run(id, userId, month);
  return db.prepare("SELECT * FROM budgets WHERE id = ?").get(id);
}

function loadWithCategories(budgetRow) {
  const categories = db.prepare("SELECT * FROM budget_categories WHERE budget_id = ?").all(budgetRow.id);
  return serializeBudget(budgetRow, categories);
}

router.get("/:month", (req, res) => {
  const budget = ensureMonth(req.userId, req.params.month);
  res.json(loadWithCategories(budget));
});

router.put("/:month/total-limit", (req, res) => {
  const budget = ensureMonth(req.userId, req.params.month);
  const value = Math.max(0, Number(req.body?.totalLimit) || 0);
  db.prepare("UPDATE budgets SET total_limit = ? WHERE id = ?").run(value, budget.id);
  res.json(loadWithCategories({ ...budget, total_limit: value }));
});

router.put("/:month/categories/:categoryId", (req, res) => {
  const budget = ensureMonth(req.userId, req.params.month);
  const value = Math.max(0, Number(req.body?.limit) || 0);
  const { categoryId } = req.params;

  const existing = db
    .prepare("SELECT id FROM budget_categories WHERE budget_id = ? AND category_id = ?")
    .get(budget.id, categoryId);

  if (existing) {
    db.prepare("UPDATE budget_categories SET limit_amount = ? WHERE id = ?").run(value, existing.id);
  } else {
    db.prepare("INSERT INTO budget_categories (id, budget_id, category_id, limit_amount) VALUES (?, ?, ?, ?)").run(
      generateId("budgetcat"),
      budget.id,
      categoryId,
      value
    );
  }

  res.json(loadWithCategories(budget));
});

router.delete("/:month/categories/:categoryId", (req, res) => {
  const budget = ensureMonth(req.userId, req.params.month);
  db.prepare("DELETE FROM budget_categories WHERE budget_id = ? AND category_id = ?").run(
    budget.id,
    req.params.categoryId
  );
  res.json(loadWithCategories(budget));
});

export default router;
