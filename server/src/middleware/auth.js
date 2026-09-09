import { verifyToken } from "../utils/token.js";

// Cada rota de domínio (transações, contas, orçamento...) confia em
// `req.userId` para filtrar tudo por usuário — nenhuma query de domínio
// roda sem esse middleware antes. `req.tokenJti` fica disponível para as
// rotas de logout revogarem a sessão do próprio token em uso.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token ausente. Faça login novamente." });
  }

  try {
    const { userId, jti } = verifyToken(token);
    req.userId = userId;
    req.tokenJti = jti;
    next();
  } catch {
    return res.status(401).json({ error: "Sessão inválida, expirada ou encerrada. Faça login novamente." });
  }
}
