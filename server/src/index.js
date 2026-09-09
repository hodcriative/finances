import "dotenv/config";
import express from "express";
import cors from "cors";
import { requireAuth } from "./middleware/auth.js";
import { cleanupExpiredSessions } from "./utils/token.js";
import authRoutes from "./routes/auth.js";
import preferencesRoutes from "./routes/preferences.js";
import categoriesRoutes from "./routes/categories.js";
import accountsRoutes from "./routes/accounts.js";
import cardPurchasesRoutes from "./routes/cardPurchases.js";
import transactionsRoutes from "./routes/transactions.js";
import budgetsRoutes from "./routes/budgets.js";
import goalsRoutes from "./routes/goals.js";

const app = express();
// Aceita mais de uma origem local (separadas por vÃ­rgula), pois o Vite usa
// a prÃ³xima porta livre quando jÃ¡ existe outro servidor de desenvolvimento.
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Rotas de autenticação são as únicas públicas — tudo abaixo delas exige
// um token válido (requireAuth), que preenche req.userId e é o que
// garante que cada usuário só veja seus próprios dados.
app.use("/api/auth", authRoutes);
app.use("/api/preferences", requireAuth, preferencesRoutes);
app.use("/api/categories", requireAuth, categoriesRoutes);
app.use("/api/accounts", requireAuth, accountsRoutes);
app.use("/api/card-purchases", requireAuth, cardPurchasesRoutes);
app.use("/api/transactions", requireAuth, transactionsRoutes);
app.use("/api/budgets", requireAuth, budgetsRoutes);
app.use("/api/goals", requireAuth, goalsRoutes);

app.use((req, res) => res.status(404).json({ error: "Rota não encontrada." }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

const port = process.env.PORT || 4000;
cleanupExpiredSessions();
app.listen(port, () => {
  console.log(`FINANCE API rodando em http://localhost:${port}`);
});
