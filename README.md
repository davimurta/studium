# Estudos

App pessoal para controlar tópicos de estudo e roadmaps. Next.js (App Router), Prisma com PostgreSQL e Auth.js v5.

## Rodando localmente

Requisitos: Node 20+ e um PostgreSQL (local, Docker ou Railway).

```bash
# Postgres local com Docker (opcional)
docker run -d --name studium-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=studium -p 5432:5432 postgres:17-alpine

cp .env.example .env          # preencha DATABASE_URL e AUTH_SECRET
npm install                   # também gera o Prisma Client
npx prisma migrate dev        # aplica as migrations
npm run seed                  # opcional: dados de exemplo do protótipo
npm run dev
```

O seed cria (ou recria) o usuário `demo@estudos.dev` com senha `estudos123`. Pode trocar com `SEED_EMAIL` e `SEED_PASSWORD`.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão do PostgreSQL |
| `AUTH_SECRET` | Segredo do Auth.js. Gere com `openssl rand -base64 32` |
| `ALLOW_SIGNUP` | `true` libera `/cadastro`. Qualquer outro valor desativa |

## Scripts

- `npm run dev`, `npm run build`, `npm run start`
- `npm run lint`, `npm run typecheck`
- `npm run db:migrate`: cria e aplica migrations em desenvolvimento
- `npm run seed`: popula com os dados do protótipo

## Design

As telas de referência ficam em `referencia-design/`. O deploy no Railway é documentado na Fase 5.
