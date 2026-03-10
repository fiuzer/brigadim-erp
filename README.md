# Brigadim - Plataforma de Gestão para Doçaria

Sistema online multiusuário para gestão completa de produtos, estoque, vendas, despesas, relatórios e dashboard personalizável.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Auth + PostgreSQL + RLS)
- React Hook Form + Zod
- TanStack Table
- Recharts
- Lucide React
- dnd-kit (dashboard drag and drop)
- sonner (feedback/toasts)

## Arquitetura

### 1. Camadas principais

- `app/`: rotas e layouts (Auth + Dashboard + APIs de exportação)
- `components/`: UI reutilizável (layout, formulários, tabelas, widgets)
- `features/`: regras de negócio por domínio (`products`, `inventory`, `sales`, `expenses`, `reports`, `dashboard-builder`, `users`, `settings`)
- `lib/`: integração Supabase, constantes, tipos, validações e utilitários
- `supabase/`: schema SQL completo com tabelas, views, funções e RLS

### 2. Estratégia de autenticação e RBAC

- Login via Supabase Auth (`/login`)
- Middleware para proteção de rotas privadas
- Perfil do usuário em `profiles` com papel:
  - `administrador`
  - `financeiro`
  - `vendas`
  - `estoque`
  - `visualizador`
- Permissões aplicadas no frontend e no backend (server actions e rotas API)
- RLS no banco reforçando acesso por função/usuário

### 3. Estratégia do dashboard personalizável

- Registry de widgets tipados (`widget-registry`)
- Layout por usuário em `dashboard_layouts`
- Drag-and-drop com dnd-kit
- Ações:
  - adicionar widget
  - remover widget
  - reordenar widget
  - redimensionar widget
  - salvar layout e filtros
- Drilldown por widget em modal

## Estrutura de pastas

```text
app
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

components
  dashboard/
  forms/
  layout/
  shared/
  tables/
  ui/

features
  auth/
  dashboard-builder/
  products/
  inventory/
  sales/
  expenses/
  reports/
  users/
  settings/

lib
  constants/
  services/
  supabase/
  types/
  utils/
  validators/

supabase/
  schema.sql
```

## Banco de dados (Supabase)

Arquivo: `supabase/schema.sql`

### Tabelas principais

- `profiles`
- `product_categories`
- `products`
- `inventory_movements`
- `sales`
- `sale_items`
- `expense_categories`
- `expenses`
- `dashboard_layouts`
- `app_settings`
- `audit_logs`

### Extras de negócio

- Função `cancel_sale(sale_id_param uuid)` para estorno
- Trigger de criação de perfil ao criar usuário no Auth
- Trigger de `updated_at`
- Trigger de auditoria
- Views:
  - `v_low_stock_products`
  - `v_product_performance`
  - `v_financial_summary`

### RLS

Políticas por papel e por propriedade de registro (ex.: `dashboard_layouts` somente do usuário logado).

## Módulos entregues

- Dashboard (customizável, com widgets e analytics)
- Produtos (CRUD, margem, estoque mínimo)
- Estoque (entrada, saída, ajuste, histórico)
- Vendas (multi-item, validação de estoque, cancelamento com estorno)
- Despesas (CRUD, categorias, análise)
- Relatórios (filtros avançados + export CSV)
- Usuários (admin: papel e status)
- Configurações

## Plano por fases (implementado)

1. Base do projeto, design system e layout SaaS responsivo
2. Auth, sessões protegidas e RBAC
3. Modelagem SQL Supabase com RLS e funções
4. Módulos operacionais (produtos, estoque, vendas, despesas)
5. Dashboard builder personalizável com persistência
6. Relatórios avançados e exportações CSV
7. Área administrativa (usuários e configurações)

## Rodando localmente

1. Instale dependências:

```bash
npm install
```

2. Configure variáveis:

```bash
cp .env.example .env.local
```

3. Preencha `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.

4. Execute o SQL em `supabase/schema.sql` no editor SQL do Supabase.

5. Rode a aplicação:

```bash
npm run dev
```

## Rotas principais

- `/login`
- `/dashboard`
- `/produtos`
- `/estoque`
- `/vendas`
- `/despesas`
- `/relatorios`
- `/configuracoes`
- `/usuarios`

