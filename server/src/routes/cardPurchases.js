import { Router } from "express";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";

const router = Router();

function serialize(row) {
  return {
    id: row.id,
    cardId: row.card_id,
    description: row.description,
    installmentAmount: row.installment_amount,
    installments: row.installments,
  };
}

router.get("/", (req, res) => {
  const { cardId } = req.query;
  const rows = cardId
    ? db.prepare("SELECT * FROM card_purchases WHERE user_id = ? AND card_id = ? ORDER BY rowid").all(req.userId, cardId)
    : db.prepare("SELECT * FROM card_purchases WHERE user_id = ? ORDER BY rowid").all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { cardId, description, installmentAmount, installments } = req.body || {};
  const card = db.prepare("SELECT id FROM accounts WHERE id = ? AND user_id = ? AND kind = 'card'").get(cardId, req.userId);
  if (!card) return res.status(400).json({ error: "Cartão inválido." });
  if (!description || !description.trim()) return res.status(400).json({ error: "Descreva a compra." });

  const id = generateId("compra");
  db.prepare(
    "INSERT INTO card_purchases (id, user_id, card_id, description, installment_amount, installments) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(
    id,
    req.userId,
    cardId,
    description.trim(),
    Math.abs(Number(installmentAmount) || 0),
    Math.max(1, Math.round(Number(installments) || 1))
  );

  res.status(201).json(serialize(db.prepare("SELECT * FROM card_purchases WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const current = db.prepare("SELECT * FROM card_purchases WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Compra não encontrada." });

  const { description, installmentAmount, installments } = req.body || {};
  const next = {
    description: description !== undefined ? String(description).trim() || current.description : current.description,
    installment_amount:
      installmentAmount !== undefined ? Math.abs(Number(installmentAmount) || 0) : current.installment_amount,
    installments:
      installments !== undefined ? Math.max(1, Math.round(Number(installments) || 1)) : current.installments,
  };

  db.prepare("UPDATE card_purchases SET description = ?, installment_amount = ?, installments = ? WHERE id = ?").run(
    next.description,
    next.installment_amount,
    next.installments,
    current.id
  );

  res.json(serialize({ ...current, ...next }));
});

router.delete("/:id", (req, res) => {
  const current = db.prepare("SELECT id FROM card_purchases WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Compra não encontrada." });
  db.prepare("DELETE FROM card_purchases WHERE id = ?").run(current.id);
  res.status(204).end();
});

export default router;
