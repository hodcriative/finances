import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";

const SECRET = process.env.JWT_SECRET;
const PLACEHOLDER = "troque-este-valor-por-um-segredo-longo-e-aleatorio";
const EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias, mesmo prazo do JWT abaixo

if (!SECRET) {
  // Falha alto e cedo: rodar com um segredo ausente/fraco é pior do que
  // não subir o servidor.
  throw new Error("JWT_SECRET não definido. Copie server/.env.example para server/.env e defina um valor.");
}
if (SECRET === PLACEHOLDER || SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET está fraco ou é o valor de exemplo do .env.example. Gere um segredo longo e aleatório " +
      '(ex.: `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"`) antes de subir o servidor.'
  );
}

// Cada token carrega um `jti` (id único da sessão). Diferente de um JWT
// puramente stateless, a validade também depende de existir uma linha
// correspondente em `sessions` — é isso que torna logout/logout-all
// possíveis (um token assinado corretamente mas com sessão apagada é
// rejeitado). O trade-off é uma consulta a mais por requisição, aceitável
// no volume desta aplicação.
export function signToken(userId) {
  const jti = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRES_IN_MS);

  db.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    jti,
    userId,
    now.toISOString(),
    expiresAt.toISOString()
  );

  return jwt.sign({ sub: userId, jti }, SECRET, { expiresIn: "7d" });
}

// Lança se a assinatura/expiração do JWT for inválida OU se a sessão já
// tiver sido revogada (logout/logout-all). Retorna { userId, jti }.
export function verifyToken(token) {
  const payload = jwt.verify(token, SECRET);
  const session = db.prepare("SELECT 1 FROM sessions WHERE id = ? AND user_id = ?").get(payload.jti, payload.sub);
  if (!session) throw new Error("Sessão revogada.");
  return { userId: payload.sub, jti: payload.jti };
}

export function revokeSession(jti) {
  db.prepare("DELETE FROM sessions WHERE id = ?").run(jti);
}

export function revokeAllSessions(userId) {
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
}

// Faxina de sessões já expiradas pelo próprio prazo (o JWT já as
// rejeitaria de qualquer forma via `exp`) — evita que a tabela cresça
// indefinidamente. Chamado na subida do servidor.
export function cleanupExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
}
