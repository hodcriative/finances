import { Router } from "express";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";

const router = Router();

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: row.amount,
    categoryId: row.category_id,
    accountId: row.account_id,
    date: row.date,
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC, rowid DESC").all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { type, description, amount, categoryId, accountId, date, notes } = req.body || {};
  if (!["income", "expense"].includes(type)) return res.status(400).json({ error: "Tipo inválido." });
  if (!date) return res.status(400).json({ error: "Data é obrigatória." });

  const id = generateId("t");
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO transactions (id, user_id, type, amount, description, category_id, account_id, date, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.userId,
    type,
    Math.abs(Number(amount) || 0),
    description?.trim() || "",
    categoryId || null,
    accountId || null,
    date,
    notes?.trim() || "",
    now,
    now
  );

  res.status(201).json(serialize(db.prepare("SELECT * FROM transactions WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const current = db.prepare("SELECT * FROM transactions WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Transação não encontrada." });

  const patch = req.body || {};
  const next = {
    type: patch.type !== undefined ? patch.type : current.type,
    amount: patch.amount !== undefined ? Math.abs(Number(patch.amount) || 0) : current.amount,
    description: patch.description !== undefined ? String(patch.description).trim() || current.description : current.description,
    category_id: patch.categoryId !== undefined ? patch.categoryId : current.category_id,
    account_id: patch.accountId !== undefined ? patch.accountId : current.account_id,
    date: patch.date !== undefined ? patch.date : current.date,
    notes: patch.notes !== undefined ? patch.notes?.trim() || "" : current.notes,
  };

  db.prepare(
    `UPDATE transactions SET type = ?, amount = ?, description = ?, category_id = ?, account_id = ?, date = ?, notes = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    next.type,
    next.amount,
    next.description,
    next.category_id,
    next.account_id,
    next.date,
    next.notes,
    new Date().toISOString(),
    current.id
  );

  res.json(serialize(db.prepare("SELECT * FROM transactions WHERE id = ?").get(current.id)));
});

router.delete("/:id", (req, res) => {
  const current = db.prepare("SELECT id FROM transactions WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Transação não encontrada." });
  db.prepare("DELETE FROM transactions WHERE id = ?").run(current.id);
  res.status(204).end();
});

export default router;
