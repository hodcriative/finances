import { Router } from "express";
import { db } from "../db.js";

const router = Router();

function serialize(row) {
  return {
    name: row.name,
    theme: row.theme,
    notifyBudgetAlerts: Boolean(row.notify_budget_alerts),
    notifyGoalAlerts: Boolean(row.notify_goal_alerts),
  };
}

router.get("/", (req, res) => {
  const row = db.prepare("SELECT * FROM preferences WHERE user_id = ?").get(req.userId);
  if (!row) return res.status(404).json({ error: "Preferências não encontradas." });
  res.json(serialize(row));
});

router.patch("/", (req, res) => {
  const current = db.prepare("SELECT * FROM preferences WHERE user_id = ?").get(req.userId);
  if (!current) return res.status(404).json({ error: "Preferências não encontradas." });

  const { name, theme, notifyBudgetAlerts, notifyGoalAlerts } = req.body || {};
  const next = {
    name: name !== undefined ? String(name).trim() || current.name : current.name,
    theme: theme === "dark" ? "dark" : theme === "light" ? "light" : current.theme,
    notify_budget_alerts:
      notifyBudgetAlerts !== undefined ? (notifyBudgetAlerts ? 1 : 0) : current.notify_budget_alerts,
    notify_goal_alerts: notifyGoalAlerts !== undefined ? (notifyGoalAlerts ? 1 : 0) : current.notify_goal_alerts,
  };

  db.prepare(
    "UPDATE preferences SET name = ?, theme = ?, notify_budget_alerts = ?, notify_goal_alerts = ? WHERE user_id = ?"
  ).run(next.name, next.theme, next.notify_budget_alerts, next.notify_goal_alerts, req.userId);

  res.json(serialize({ ...current, ...next }));
});

export default router;
