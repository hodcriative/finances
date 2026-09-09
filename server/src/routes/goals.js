import { Router } from "express";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";

const router = Router();

function serialize(row) {
  return {
    id: row.id,
    title: row.title,
    targetAmount: row.target_amount,
    currentAmount: row.current_amount,
    deadline: row.deadline,
    icon: row.icon,
    color: row.color,
    status: row.status,
  };
}

router.get("/", (req, res) => {
  const rows = db.prepare("SELECT * FROM goals WHERE user_id = ? ORDER BY rowid").all(req.userId);
  res.json(rows.map(serialize));
});

router.post("/", (req, res) => {
  const { title, targetAmount, currentAmount, deadline, icon, color, status } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: "Título é obrigatório." });

  const id = generateId("goal");
  db.prepare(
    `INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, icon, color, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.userId,
    title.trim(),
    Math.abs(Number(targetAmount) || 0),
    Math.abs(Number(currentAmount) || 0),
    deadline || null,
    icon?.trim() || "🎯",
    color || "#6c5ce7",
    status || "active"
  );

  res.status(201).json(serialize(db.prepare("SELECT * FROM goals WHERE id = ?").get(id)));
});

router.patch("/:id", (req, res) => {
  const current = db.prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Meta não encontrada." });

  const patch = req.body || {};
  const next = {
    title: patch.title !== undefined ? String(patch.title).trim() || current.title : current.title,
    target_amount: patch.targetAmount !== undefined ? Math.abs(Number(patch.targetAmount) || 0) : current.target_amount,
    current_amount:
      patch.currentAmount !== undefined ? Math.abs(Number(patch.currentAmount) || 0) : current.current_amount,
    deadline: patch.deadline !== undefined ? patch.deadline : current.deadline,
    icon: patch.icon !== undefined ? patch.icon?.trim() || current.icon : current.icon,
    color: patch.color !== undefined ? patch.color : current.color,
    status: patch.status !== undefined ? patch.status : current.status,
  };

  db.prepare(
    "UPDATE goals SET title = ?, target_amount = ?, current_amount = ?, deadline = ?, icon = ?, color = ?, status = ? WHERE id = ?"
  ).run(
    next.title,
    next.target_amount,
    next.current_amount,
    next.deadline,
    next.icon,
    next.color,
    next.status,
    current.id
  );

  res.json(serialize({ ...current, ...next }));
});

// Aporte é sempre um registro/planejamento manual de progresso — nunca uma
// transferência real entre contas (mesma regra de goalService.js no
// frontend). Soma ao valor já acumulado e promove a meta a "completed"
// automaticamente ao atingir o alvo, a menos que esteja pausada.
router.post("/:id/contribute", (req, res) => {
  const current = db.prepare("SELECT * FROM goals WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Meta não encontrada." });

  const amount = Number(req.body?.amount) || 0;
  const nextAmount = Math.max(0, current.current_amount + amount);
  const status =
    current.status === "paused" ? current.status : current.target_amount > 0 && nextAmount >= current.target_amount ? "completed" : "active";

  db.prepare("UPDATE goals SET current_amount = ?, status = ? WHERE id = ?").run(nextAmount, status, current.id);
  res.json(serialize({ ...current, current_amount: nextAmount, status }));
});

router.delete("/:id", (req, res) => {
  const current = db.prepare("SELECT id FROM goals WHERE id = ? AND user_id = ?").get(req.params.id, req.userId);
  if (!current) return res.status(404).json({ error: "Meta não encontrada." });
  db.prepare("DELETE FROM goals WHERE id = ?").run(current.id);
  res.status(204).end();
});

export default router;
