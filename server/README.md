# FINANCE API (Fase 6)

Backend Node.js + Express + SQLite (`node:sqlite`, nativo do Node ≥22.5 —
sem dependência externa nem build nativo) com autenticação por e-mail e
senha (JWT). Implementa a mesma modelagem de dados que hoje vive no
`localStorage` do frontend (`docs/04-DATA-MODEL.md`), agora por usuário.

`node:sqlite` ainda é marcado "experimental" pelo próprio Node — funciona
bem para este estágio, mas se isso virar um problema, a troca para
`better-sqlite3` é direta (mesma API síncrona de `.prepare()/.run()/.get()/.all()`).

## Como rodar

```bash
cd server
cp .env.example .env   # ajuste JWT_SECRET antes de qualquer uso real
npm install
npm run dev             # ou "npm start" sem watch
```

Sobe em `http://localhost:4000` (porta configurável via `PORT`). O banco
SQLite é criado automaticamente em `server/data/finance.sqlite` (arquivo
git-ignorado) na primeira execução.

## Autenticação

Todas as rotas abaixo de `/api/auth` exigem o header
`Authorization: Bearer <token>`, obtido em `/api/auth/register` ou
`/api/auth/login`. O token expira em 7 dias. Cada rota de domínio filtra
tudo por `req.userId` — um usuário nunca enxerga nem edita dados de outro
(testado manualmente, ver `docs/01-CURRENT-STATE.md`).

Ao registrar, o usuário recebe automaticamente as mesmas categorias padrão
usadas hoje como seed do `localStorage` (`src/data/mockData.js`).

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ email, password, name }` → cria usuário + preferências + categorias padrão |
| POST | `/api/auth/login` | `{ email, password }` → token |
| POST | `/api/auth/logout` | revoga a sessão do token em uso |
| POST | `/api/auth/logout-all` | revoga todas as sessões do usuário |
| GET | `/api/auth/me` | dados do usuário logado |
| GET/PATCH | `/api/preferences` | preferências (nome, tema, notificações) |
| GET/POST | `/api/categories` | listar/criar categoria |
| PATCH/DELETE | `/api/categories/:id` | editar/excluir categoria |
| GET/POST | `/api/accounts` | listar/criar conta ou cartão (`kind: "account"\|"card"`) |
| PATCH/DELETE | `/api/accounts/:id` | editar/excluir conta ou cartão |
| GET/POST | `/api/card-purchases` | listar (`?cardId=`)/criar compra parcelada |
| PATCH/DELETE | `/api/card-purchases/:id` | editar/excluir compra parcelada |
| GET/POST | `/api/transactions` | listar/criar transação |
| PATCH/DELETE | `/api/transactions/:id` | editar/excluir transação |
| GET | `/api/budgets/:month` | orçamento do mês (`"2026-09"`), cria vazio se não existir |
| PUT | `/api/budgets/:month/total-limit` | define limite geral |
| PUT/DELETE | `/api/budgets/:month/categories/:categoryId` | define/remove limite por categoria |
| GET/POST | `/api/goals` | listar/criar meta |
| PATCH/DELETE | `/api/goals/:id` | editar/excluir meta |
| POST | `/api/goals/:id/contribute` | `{ amount }` — soma ao valor acumulado (nunca transferência real) |

## Segurança — o que está coberto e o que não está

**Coberto:**
- senha nunca fica em texto puro (hash `bcryptjs`, 10 rounds);
- todas as queries usam parâmetros (`?`) do `node:sqlite` — sem concatenação de string, sem SQL injection;
- toda rota de domínio exige token válido e filtra por `user_id` — testado manualmente com dois usuários, incluindo tentativa de um acessar/editar/excluir dado do outro (ver `docs/01-CURRENT-STATE.md`);
- mensagem de erro de login não revela se o e-mail existe;
- servidor recusa subir com `JWT_SECRET` ausente, igual ao placeholder de `.env.example`, ou menor que 32 caracteres;
- rate limit (20 requisições/15min por IP) em `/api/auth/*`, mitigando força bruta de senha e criação em massa de contas;
- `npm audit` limpo (0 vulnerabilidades conhecidas nas dependências, checado nesta etapa);
- **revogação de sessão/logout**: tokens carregam um `jti` e só são válidos enquanto existir a sessão correspondente na tabela `sessions` — `POST /api/auth/logout` apaga a sessão do token em uso, `POST /api/auth/logout-all` apaga todas as sessões do usuário (útil se suspeitar de vazamento). Testado com múltiplas sessões simultâneas: revogar uma não afeta as outras; `logout-all` derruba todas de uma vez, inclusive a que o chamou.

**Não coberto ainda — importante saber antes de expor isso fora do seu computador:**
- **sem HTTPS** — hoje é HTTP puro, pensado para rodar em `localhost`. Colocar isso na internet sem TLS na frente (reverse proxy, certificado) expõe senha e token em texto puro no tráfego de rede;
- **sem verificação de e-mail** — qualquer texto no formato de e-mail é aceito no registro, sem confirmar que o dono existe. Isso exigiria um provedor de envio de e-mail (SendGrid, Resend, SMTP...), que este ambiente não tem acesso de rede para testar de verdade;
- arquivo SQLite (`data/finance.sqlite`) fica sem criptografia em disco — se a máquina/host for comprometido, o banco inteiro (hashes de senha + todos os dados financeiros de todos os usuários) fica exposto;
- `node:sqlite` ainda é experimental no Node — estável para prototipagem, mas vale reavaliar antes de produção real;
- sem testes automatizados de segurança (só os testes manuais via curl descritos acima).

Em resumo: seguro o suficiente para desenvolvimento local e para a próxima etapa (integrar o frontend), mas **não está pronto para expor na internet** sem pelo menos resolver HTTPS e revisar os pontos acima.

## O que ainda falta (próxima etapa)

O frontend (`src/`) ainda lê/escreve em `localStorage`, sem chamar esta
API. Integrar significa: trocar `services/*.js` de `localStorage` para
`fetch`, guardar o token (ex.: `localStorage` só para o token, não mais
para os dados), criar telas de login/registro e proteger as rotas do
`react-router`. Combinado no chat: sem migração automática dos dados que
já existem no `localStorage` — o backend começa zerado por usuário.
