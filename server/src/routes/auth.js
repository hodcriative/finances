import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db } from "../db.js";
import { generateId } from "../utils/id.js";
import { signToken, revokeSession, revokeAllSessions } from "../utils/token.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Limite de tentativas por IP — mitigação básica contra força bruta de
// senha e criação em massa de contas. Um proxy/CDN na frente em produção
// pode reforçar isso por outras dimensões (ex.: por conta), mas isso já
// cobre o cenário mais comum de ataque automatizado direto na API.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
});

router.use(authLimiter);

// Mesmas categorias padrão usadas como seed do localStorage em
// src/data/mockData.js — cada novo usuário começa com este conjunto,
// podendo editar/desativar/criar as suas depois.
const DEFAULT_CATEGORIES = [
  { name: "Alimentação", type: "expense", icon: "🍴", color: "#6c5ce7" },
  { name: "Casa", type: "expense", icon: "🏠", color: "#00a878" },
  { name: "Transporte", type: "expense", icon: "🚗", color: "#ef5b63" },
  { name: "Compras", type: "expense", icon: "🛍️", color: "#f2a93b" },
  { name: "Outros", type: "both", icon: "✨", color: "#858a9a" },
  { name: "Renda", type: "income", icon: "💼", color: "#00a878" },
];

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/register", (req, res) => {
  const { email, password, name } = req.body || {};

  if (!isValidEmail(email)) return res.status(400).json({ error: "Informe um e-mail válido." });
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: "A senha precisa ter pelo menos 8 caracteres." });
  }
  if (!name || !name.trim()) return res.status(400).json({ error: "Informe um nome." });

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) return res.status(409).json({ error: "Já existe uma conta com este e-mail." });

  const userId = generateId("user");
  const passwordHash = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();

  db.prepare("INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)").run(
    userId,
    normalizedEmail,
    passwordHash,
    now
  );

  db.prepare(
    "INSERT INTO preferences (user_id, name, theme, notify_budget_alerts, notify_goal_alerts) VALUES (?, ?, 'light', 1, 1)"
  ).run(userId, name.trim());

  const insertCategory = db.prepare(
    "INSERT INTO categories (id, user_id, name, type, icon, color, active) VALUES (?, ?, ?, ?, ?, ?, 1)"
  );
  for (const category of DEFAULT_CATEGORIES) {
    insertCategory.run(generateId("cat"), userId, category.name, category.type, category.icon, category.color);
  }

  const token = signToken(userId);
  res.status(201).json({ token, user: { id: userId, email: normalizedEmail, name: name.trim() } });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!isValidEmail(email) || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha." });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare("SELECT id, email, password_hash FROM users WHERE email = ?").get(normalizedEmail);
  const passwordOk = user && bcrypt.compareSync(password, user.password_hash);

  if (!passwordOk) {
    // Mensagem genérica de propósito: não revelar se o e-mail existe ou não.
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  const prefs = db.prepare("SELECT name FROM preferences WHERE user_id = ?").get(user.id);
  const token = signToken(user.id);
  res.json({ token, user: { id: user.id, email: user.email, name: prefs?.name || "" } });
});

router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
  const prefs = db.prepare("SELECT name FROM preferences WHERE user_id = ?").get(req.userId);
  res.json({ user: { id: user.id, email: user.email, name: prefs?.name || "" } });
});

// Revoga só a sessão do token em uso (este dispositivo/aba).
router.post("/logout", requireAuth, (req, res) => {
  revokeSession(req.tokenJti);
  res.status(204).end();
});

// Revoga todas as sessões do usuário — útil se ele suspeitar que um
// token vazou em algum lugar (ex.: dispositivo perdido).
router.post("/logout-all", requireAuth, (req, res) => {
  revokeAllSessions(req.userId);
  res.status(204).end();
});

export default router;
