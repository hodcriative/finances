import { Router } from "express";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";

const router = Router();

// Contas e cartões continuam na mesma tabela, diferenciados por `kind`,
// no mesmo espírito de src/services/accountService.js no frontend.
function serialize(row) {
  const base = { id: row.id, kind: row.kind, name: row.name, color: row.color, active: Boolean(row.active) };
  if (row.kind === "card") {
    return {
      ...base,
      brand: row.brand || "",
      limit: row.card_limit || 0,
      currentInvoice: row.current_invoice || 0,
      closingDay: row.closing_day,
      dueDay: row.due_day,
    };
  }
  return { ...base, type: row.type || "checking", initialBalance: row.initial_balance || 0 };
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM accounts WHERE user_id = ? ORDER BY rowid").all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { kind, name, color } = req.body || {};
  if (!["account", "card"].includes(kind)) return res.status(400).json({ error: "kind deve ser 'account' ou 'card'." });
  if (!name || !name.trim()) return res.status(400).json({ error: "Nome é obrigatório." });

  const id = generateId(kind === "card" ? "cartao" : "conta");

  if (kind === "card") {
    const { brand, limit, currentInvoice, closingDay, dueDay } = req.body;
    db.prepare(
      `INSERT INTO accounts (id, user_id, kind, name, brand, card_limit, current_invoice, closing_day, due_day, color, active)
       VALUES (?, ?, 'card', ?, ?, ?, ?, ?, ?, ?, 1)`
    ).run(
      id,
      req.userId,
      name.trim(),
      brand?.trim() || "",
      Math.abs(Number(limit) || 0),
      Math.abs(Number(currentInvoice) || 0),
      closingDay ? Number(closingDay) : null,
      dueDay ? Number(dueDay) : null,
      color || "#6c5ce7"
    );
  } else {
    const { type, initialBalance } = req.body;
    db.prepare(
      `INSERT INTO accounts (id, user_id, kind, name, type, initial_balance, color, active)
       VALUES (?, ?, 'account', ?, ?, ?, ?, 1)`
    ).run(id, req.userId, name.trim(), type || "checking", Math.abs(Number(initialBalance) || 0), color || "#6c5ce7");
  }

  res.status(201).json(serialize(db.prepare("SELECT * FROM accounts WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const current = db.prepare("SELECT * FROM accounts WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Registro não encontrado." });

  const patch = req.body || {};
  const next = {
    name: patch.name !== undefined ? String(patch.name).trim() || current.name : current.name,
    color: patch.color !== undefined ? patch.color : current.color,
    active: patch.active !== undefined ? (patch.active ? 1 : 0) : current.active,
    type: patch.type !== undefined ? patch.type : current.type,
    initial_balance:
      patch.initialBalance !== undefined ? Math.abs(Number(patch.initialBalance) || 0) : current.initial_balance,
    brand: patch.brand !== undefined ? patch.brand?.trim() || "" : current.brand,
    card_limit: patch.limit !== undefined ? Math.abs(Number(patch.limit) || 0) : current.card_limit,
    current_invoice:
      patch.currentInvoice !== undefined ? Math.abs(Number(patch.currentInvoice) || 0) : current.current_invoice,
    closing_day: patch.closingDay !== undefined ? (patch.closingDay ? Number(patch.closingDay) : null) : current.closing_day,
    due_day: patch.dueDay !== undefined ? (patch.dueDay ? Number(patch.dueDay) : null) : current.due_day,
  };

  db.prepare(
    `UPDATE accounts SET name = ?, color = ?, active = ?, type = ?, initial_balance = ?, brand = ?,
       card_limit = ?, current_invoice = ?, closing_day = ?, due_day = ? WHERE id = ?`
  ).run(
    next.name,
    next.color,
    next.active,
    next.type,
    next.initial_balance,
    next.brand,
    next.card_limit,
    next.current_invoice,
    next.closing_day,
    next.due_day,
    current.id
  );

  res.json(serialize({ ...current, ...next }));
});

router.delete("/:id", (req, res) => {
  const current = db.prepare("SELECT id FROM accounts WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Registro não encontrado." });
  db.prepare("DELETE FROM accounts WHERE id = ?").run(current.id);
  res.status(204).end();
});

export default router;
