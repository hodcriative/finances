import { Router } from "express";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";

const router = Router();

function serialize(row) {
  return { id: row.id, name: row.name, type: row.type, icon: row.icon, color: row.color, active: Boolean(row.active) };
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM categories WHERE user_id = ? ORDER BY rowid").all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { name, type, icon, color } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "Nome é obrigatório." });
  if (!["income", "expense", "both"].includes(type)) return res.status(400).json({ error: "Tipo inválido." });

  const id = generateId("cat");
  db.prepare(
    "INSERT INTO categories (id, user_id, name, type, icon, color, active) VALUES (?, ?, ?, ?, ?, ?, 1)"
  ).run(id, req.userId, name.trim(), type, icon || "", color || "#6c5ce7");

  res.status(201).json(serialize(db.prepare("SELECT * FROM categories WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const current = db.prepare("SELECT * FROM categories WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Categoria não encontrada." });

  const { name, type, icon, color, active } = req.body || {};
  const next = {
    name: name !== undefined ? String(name).trim() || current.name : current.name,
    type: type !== undefined ? type : current.type,
    icon: icon !== undefined ? icon : current.icon,
    color: color !== undefined ? color : current.color,
    active: active !== undefined ? (active ? 1 : 0) : current.active,
  };

  db.prepare("UPDATE categories SET name = ?, type = ?, icon = ?, color = ?, active = ? WHERE id = ?").run(
    next.name,
    next.type,
    next.icon,
    next.color,
    next.active,
    current.id
  );

  res.json(serialize({ ...current, ...next }));
});

router.delete("/:id", (req, res) => {
  const current = db.prepare("SELECT id FROM categories WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Categoria não encontrada." });
  db.prepare("DELETE FROM categories WHERE id = ?").run(current.id);
  res.status(204).end();
});

export default router;
