# Brigadim

Plataforma SaaS de gestão para doçaria com autenticação, controle de estoque, vendas, despesas, relatórios e dashboard personalizável.

## Visão geral

- Multiusuário online com Supabase Auth
- Controle por perfil (`administrador`, `financeiro`, `vendas`, `estoque`, `visualizador`)
- Banco relacional com RLS (Row Level Security)
- Dashboard com widgets e preferências por usuário
- Relatórios com filtros e exportação CSV

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui + Base UI
- Supabase (PostgreSQL, Auth, RLS)
- React Hook Form + Zod
- TanStack Table
- Recharts
- dnd-kit
- Sonner

## Estrutura do projeto

```text
app/
  (auth)/
    login/
  (dashboard)/
    dashboard/
    produtos/
    estoque/
    vendas/
    despesas/
    relatorios/
    configuracoes/
    usuarios/
  api/
    export/
      vendas/
      despesas/

components/
  dashboard/
  forms/
  layout/
  shared/
  tables/
  ui/

features/
  auth/
  dashboard-builder/
  products/
  inventory/
  sales/
  expenses/
  reports/
  users/
  settings/

lib/
  constants/
  services/
  supabase/
  types/
  utils/
  validators/

supabase/
  schema.sql
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Projeto Supabase criado

## Configuração local

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo de ambiente:

```bash
cp .env.example .env.local
```

3. Configure as variáveis em `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

4. No Supabase (SQL Editor), execute o arquivo `supabase/schema.sql`.

5. Rode o projeto:

```bash
npm run dev
```

## Primeiro usuário administrador

Fluxo recomendado para bootstrap:

1. Crie um usuário pelo app (`/login`).
2. No Supabase SQL Editor, promova o usuário para `administrador`:

```sql
update public.profiles
set role = 'administrador'
where id = (
  select id
  from auth.users
  where email = 'seu-email@dominio.com'
);
```

3. Faça logout/login no sistema.

## Scripts

- `npm run dev`: ambiente de desenvolvimento
- `npm run build`: build de produção
- `npm run start`: inicia build de produção
- `npm run lint`: validação com ESLint

## Rotas principais

- `/` (redireciona para `/vendas` para perfis com permissão de vendas; caso contrário, `/dashboard`)
- `/login`
- `/dashboard`
- `/produtos`
- `/estoque`
- `/vendas`
- `/despesas`
- `/relatorios`
- `/configuracoes`
- `/usuarios`

## Segurança e autorização

- Autenticação via Supabase Auth
- Controle de permissão por papel no frontend e backend
- RLS ativa nas tabelas sensíveis
- `dashboard_layouts` isolado por `auth.uid()`
- Ações críticas (cancelamento de venda e auditoria) com regras de negócio no banco

## Banco de dados

Tabelas principais:

- `profiles`
- `products`
- `product_categories`
- `inventory_movements`
- `sales`
- `sale_items`
- `expenses`
- `expense_categories`
- `dashboard_layouts`
- `app_settings`
- `audit_logs`

Views e funções:

- `v_low_stock_products`
- `v_product_performance`
- `v_financial_summary`
- `cancel_sale(sale_id_param uuid)`

## Troubleshooting

- Erro `supabaseUrl is required`:
  - Verifique se `.env.local` existe e contém `NEXT_PUBLIC_SUPABASE_URL`.
  - Reinicie o `npm run dev` após editar variáveis de ambiente.

- Erros de relacionamento no Supabase (`schema cache`):
  - Reexecute o SQL do schema.
  - Reabra o projeto após aplicar migrações.

- Texto com caracteres estranhos:
  - Garanta que os arquivos estejam em UTF-8.

## Boas práticas para evolução

- Validar entradas com Zod antes de persistir
- Manter regras de permissão no backend, não só no frontend
- Revalidar rotas afetadas (`revalidatePath`) após ações server-side
- Criar migrations SQL incrementais para mudanças de schema
- Testar fluxos por papel de usuário antes de publicar
