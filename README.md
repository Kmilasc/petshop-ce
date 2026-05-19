# 🐾 PetShop — E-commerce MVP

E-commerce de pets construído com TanStack Start, PostgreSQL e Drizzle ORM.

## Stack

- **Frontend**: React 19 + TanStack Router + TanStack Start
- **Backend**: Nitro (API routes em `api/`) + h3 v2
- **Banco de dados**: PostgreSQL 16 (Docker) + Drizzle ORM
- **Autenticação**: JWT + bcrypt
- **UI**: Tailwind CSS v4 + Lucide React

## Funcionalidades

- Catálogo com filtros por pet, categoria e busca
- Carrinho de compras em tempo real (drawer lateral)
- Autenticação (registro/login com JWT)
- Checkout com endereço de entrega
- Histórico e detalhe de pedidos com tracker de status
- Registro com CPF + endereço completo via ViaCEP
- Checkout em 3 etapas: endereço → pagamento simulado (cartão/PIX) → confirmação
- Painel admin com CRUD completo de produtos e gerenciamento de pedidos
- Frete grátis automático acima de R$ 150
- 25 produtos seed em 12 categorias cobrindo cães, gatos, pássaros, peixes, roedores, répteis e coelhos

## Como rodar

### 1. Pré-requisitos

- Node.js 20+
- Docker Desktop

### 2. Subir o banco e popular dados (tudo de uma vez)

```bash
npm run setup
```

Ou passo a passo:

```bash
docker compose up -d   # sobe PostgreSQL na porta 5432
npm run db:push        # cria as tabelas
npm run db:seed        # insere categorias, produtos e usuário admin
```

### 3. Rodar o projeto

```bash
npm run dev
```

Acesse: **http://localhost:3000**

## Credenciais de teste

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@petshop.com | admin123 |
| Cliente | (criar via /registro) | — |

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de produção |
| `npm run db:push` | Aplica schema no banco |
| `npm run db:seed` | Popula com dados de exemplo |
| `npm run db:studio` | Interface visual Drizzle Studio |
| `npm run docker:up` | Sobe o container PostgreSQL |
| `npm run docker:down` | Para o container |
| `npm run setup` | Docker + push + seed |

## Estrutura do projeto

```
e-commerce-pet/
├── api/                    # API routes (Nitro) -> /api/*
│   ├── auth/               # login, register, me
│   ├── products/           # listagem e detalhe
│   ├── categories/         # listagem
│   ├── cart/               # CRUD do carrinho
│   ├── orders/             # checkout e histórico
│   └── admin/              # admin de pedidos e produtos
├── src/
│   ├── db/                 # Drizzle schema, conexão, seed
│   ├── lib/                # helpers JWT/auth
│   ├── contexts/           # AuthContext + CartContext
│   ├── components/         # Header, CartDrawer, ProductCard
│   └── routes/             # páginas (TanStack Router)
├── docker-compose.yml
├── drizzle.config.ts
└── .env
```

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Cliente)                        │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                React 19 + TanStack Router               │   │
│   │                                                         │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐  │   │
│   │  │ Catálogo │  │ Carrinho │  │ Checkout │  │ Admin │  │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └───────┘  │   │
│   │                                                         │   │
│   │  ┌─────────────────────┐  ┌──────────────────────────┐ │   │
│   │  │    AuthContext      │  │       CartContext         │ │   │
│   │  │  (JWT localStorage) │  │  (estado do carrinho)    │ │   │
│   │  └─────────────────────┘  └──────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────┘   │
│                         │ HTTP/REST                              │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SERVIDOR (Nitro + Node.js)                      │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                   API Routes (/api/*)                   │   │
│   │                                                         │   │
│   │  /auth/login      /auth/register      /auth/me          │   │
│   │  /products        /categories         /cart             │   │
│   │  /orders          /reviews            /admin/products   │   │
│   └──────────────────────────┬──────────────────────────────┘   │
│                              │                                  │
│   ┌──────────────────────────▼──────────────────────────────┐   │
│   │                   Camada de Serviços                    │   │
│   │                                                         │   │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│   │  │  JWT (auth)  │  │bcrypt(senhas)│  │  Zod (valid) │  │   │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│   └──────────────────────────┬──────────────────────────────┘   │
│                              │                                  │
│   ┌──────────────────────────▼──────────────────────────────┐   │
│   │              Drizzle ORM (queries tipadas)              │   │
│   └──────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PostgreSQL 16 (Render)                        │
│                                                                 │
│   users │ products │ categories │ orders │ cart_items           │
│   addresses │ order_items │ reviews                             │
└─────────────────────────────────────────────────────────────────┘

APIs Externas:
  ViaCEP (viacep.com.br) ──► preenchimento automático de endereço
```

## Variáveis de ambiente (.env)

```env
DATABASE_URL=postgresql://petshop:petshop123@localhost:5432/petshop
JWT_SECRET=sua_chave_secreta_aqui   # obrigatório — sem fallback hardcoded
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Deploy (Railway)

1. Crie um projeto no [Railway](https://railway.app) e adicione um serviço PostgreSQL.
2. Conecte este repositório ao Railway.
3. Configure as variáveis de ambiente no painel do Railway:
   - `DATABASE_URL` (copie da aba do serviço Postgres)
   - `JWT_SECRET` (string aleatória longa)
   - `NODE_ENV=production`
4. O `railway.json` já está configurado — o build e start acontecem automaticamente.
5. Após o deploy, rode o seed via Railway CLI:
   ```bash
   railway run npm run db:seed
   ```
