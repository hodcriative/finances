// Teste de seguranÃ§a local, sem dependÃªncias externas.
// Requer a API em execuÃ§Ã£o (npm start ou npm run dev) e remove seus dados temporÃ¡rios ao final.
import { db } from "../src/db.js";

const baseUrl = process.env.API_URL || "http://localhost:4000/api";
const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emails = [`security-a-${suffix}@example.test`, `security-b-${suffix}@example.test`];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function api(path, { method = "GET", token, body, origin } = {}) {
  const headers = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (origin) headers.Origin = origin;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { response, body: await response.json().catch(() => null) };
}

async function register(email, name) {
  const result = await api("/auth/register", {
    method: "POST",
    body: { email, name, password: "security-test-password-123" },
  });
  assert(result.response.status === 201, `registro deveria retornar 201; recebeu ${result.response.status}`);
  return result.body.token;
}

try {
  // AutenticaÃ§Ã£o ausente, invÃ¡lida e validaÃ§Ã£o bÃ¡sica de credenciais.
  assert((await api("/categories")).response.status === 401, "rota privada aceita acesso sem token");
  assert((await api("/categories", { token: "Bearer-invalido" })).response.status === 401, "rota privada aceita token invÃ¡lido");
  assert((await api("/auth/register", { method: "POST", body: { name: "x", email: "invalido", password: "curta" } })).response.status === 400, "registro aceita credenciais invÃ¡lidas");

  const tokenA = await register(emails[0], "Security A");
  const tokenB = await register(emails[1], "Security B");

  // ParÃ¢metros SQL e autorizaÃ§Ã£o por objeto (BOLA).
  const injectionName = "teste'); DROP TABLE users;--";
  const category = await api("/categories", {
    method: "POST",
    token: tokenA,
    body: { name: injectionName, type: "expense", icon: "x", color: "#000000", userId: "forged" },
  });
  assert(category.response.status === 201, "criaÃ§Ã£o de categoria falhou");
  const categoryId = category.body.id;
  assert((await api(`/categories/${categoryId}`, { method: "PATCH", token: tokenB, body: { name: "indevido" } })).response.status === 404, "usuÃ¡rio B alterou objeto do usuÃ¡rio A");
  assert((await api(`/categories/${categoryId}`, { method: "DELETE", token: tokenB })).response.status === 404, "usuÃ¡rio B excluiu objeto do usuÃ¡rio A");
  assert((await api("/auth/me", { token: tokenA })).response.status === 200, "entrada maliciosa afetou a tabela de usuÃ¡rios");

  // RevogaÃ§Ã£o de sessÃ£o e CORS da porta ativa do Vite.
  assert((await api("/auth/logout", { method: "POST", token: tokenB })).response.status === 204, "logout nÃ£o revogou a sessÃ£o");
  assert((await api("/preferences", { token: tokenB })).response.status === 401, "token revogado ainda acessa dados");
  const cors = await api("/health", { origin: "http://localhost:5174" });
  assert(cors.response.headers.get("access-control-allow-origin") === "http://localhost:5174", "CORS nÃ£o libera o Vite na porta 5174");

  console.log("Security smoke: aprovado (autenticaÃ§Ã£o, BOLA, injeÃ§Ã£o, logout e CORS).");
} finally {
  for (const email of emails) {
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (user) db.prepare("DELETE FROM users WHERE id = ?").run(user.id);
  }
}
