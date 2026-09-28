# O! Pudim — plataforma multiempresa para confeitarias

Sistema web completo para empresas de pudim artesanal: **vitrine pública premium**, **painel da empresa** e **console master**, com isolamento total por `companyId`.

Não é só uma loja. É a base de um SaaS em que cada cliente tem o próprio site, o próprio painel e os próprios dados.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS + Framer Motion
- Backend: Node.js + Express + TypeScript
- Banco: Prisma ORM (SQLite no desenvolvimento local, PostgreSQL em produção)
- Auth: JWT + senha com bcrypt

## Estrutura

```
/frontend     vitrine, painel admin e console master
/backend      API, Prisma e uploads
```

Em desenvolvimento nesta máquina o banco é **SQLite** (`backend/prisma/dev.db`), para não depender de instalar PostgreSQL. O modelo de dados é o mesmo de um SaaS multiempresa. Em produção, altere o `provider` do Prisma para `postgresql` e use o `docker-compose.yml`.

## Requisitos

- Node.js 20+
- npm

## Instalação

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Variáveis de ambiente

Copie os exemplos:

```bash
cd backend
copy .env.example .env
```

Principais variáveis:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | SQLite local (`file:./prisma/dev.db`) ou PostgreSQL em produção |
| `JWT_SECRET` | Chave do token — nunca commitar valor de produção |
| `FRONTEND_URL` | Origem liberada no CORS |
| `PORT` | Porta da API (3333) |

O frontend usa o proxy do Vite (`/api` e `/uploads` → `http://localhost:3333`).

## Banco, Prisma, migrations e seed

No Windows, a partir da pasta `backend`:

```bash
npm run db:setup
```

Esse comando:

1. Sobe o PostgreSQL embutido
2. Gera o client Prisma
3. Aplica o schema (`prisma db push`)
4. Popula dados de demonstração

Comandos avulsos:

```bash
npx prisma generate
npx prisma db push
npx prisma migrate dev
npx prisma db seed
npx prisma studio
```

## Como iniciar

Terminal 1 — API:

```bash
cd backend
npm run dev
```

Terminal 2 — interface:

```bash
cd frontend
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

## Credenciais de desenvolvimento

Somente para ambiente local. Troque em produção.

| Perfil | E-mail | Senha | Destino |
|---|---|---|---|
| Master | `admin@sistema.com` | `123456` | `/master` |
| Empresa (Ana) | `ana@pudins.com` | `123456` | `/admin` |

Vitrine da empresa demo: [http://localhost:5173/pudins-da-ana](http://localhost:5173/pudins-da-ana)

## Como criar uma nova empresa

1. Entre no console master (`/master`)
2. Abra **Empresas**
3. Clique em **+ Nova empresa**
4. Informe nome, responsável, e-mail, telefone, senha e slug (`doces-da-maria`)
5. O sistema cria automaticamente:
   - conta admin
   - configurações e textos da vitrine
   - categorias padrão
   - diferenciais iniciais
6. A vitrine fica em `seusite.com/{slug}`
7. Use **Entrar como administrador** para abrir o painel daquela empresa (o acesso é gravado em log)

## Isolamento multiempresa

Toda tabela de negócio tem `companyId`. As rotas `/api/admin` leem a empresa do JWT. Um admin nunca consulta dados de outro tenant.

## Produção com PostgreSQL

```bash
docker compose up -d
```

No `.env` do backend:

```
USE_EMBEDDED_PG=false
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/o_pudim"
JWT_SECRET="uma-chave-longa-e-secreta"
NODE_ENV=production
```

Depois:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
npm run build
npm start
```

## Arquitetura pronta para o futuro

O modelo `Company` já tem `plan` e `planExpiresAt` para assinaturas. Pedidos, estoque e WhatsApp por link estão prontos para evoluir para API oficial, cupons, entregas e app mobile sem quebrar o isolamento por tenant.
