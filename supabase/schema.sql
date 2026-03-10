-- Brigadim - Schema base para Supabase (PostgreSQL)

create extension if not exists "uuid-ossp";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('administrador', 'financeiro', 'vendas', 'estoque', 'visualizador');
  end if;
  if not exists (select 1 from pg_type where typname = 'inventory_movement_type') then
    create type inventory_movement_type as enum ('Entrada', 'Saída', 'Ajuste', 'Venda', 'Cancelamento');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method_type') then
    create type payment_method_type as enum ('Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência', 'Outro');
  end if;
  if not exists (select 1 from pg_type where typname = 'sale_status_type') then
    create type sale_status_type as enum ('Ativa', 'Cancelada');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'visualizador',
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category_id uuid references public.product_categories(id) on delete set null,
  description text,
  sku text unique,
  production_cost numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sold_at timestamptz not null default now(),
  discount_amount numeric(12,2) not null default 0,
  subtotal_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_method payment_method_type not null,
  notes text,
  status sale_status_type not null default 'Ativa',
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price > 0),
  production_cost numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  movement_type inventory_movement_type not null,
  quantity integer not null check (quantity > 0),
  reason text,
  notes text,
  user_id uuid references auth.users(id) on delete set null,
  sale_item_id uuid references public.sale_items(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  category_id uuid references public.expense_categories(id) on delete set null,
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  notes text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.dashboard_layouts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  layout jsonb not null default '[]'::jsonb,
  default_filters jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  company_name text not null default 'Brigadim',
  company_logo_url text,
  default_currency text not null default 'BRL',
  timezone text not null default 'America/Sao_Paulo',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  action text not null,
  record_id text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'visualizador'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns user_role
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.has_any_role(required_roles user_role[])
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = any(required_roles), false);
$$;

create or replace function public.cancel_sale(sale_id_param uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  current_stock integer;
begin
  update public.sales
  set status = 'Cancelada', updated_at = now()
  where id = sale_id_param and status = 'Ativa';

  if not found then
    return false;
  end if;

  for item in
    select id, product_id, quantity
    from public.sale_items
    where sale_id = sale_id_param
  loop
    select stock_quantity into current_stock from public.products where id = item.product_id for update;
    update public.products set stock_quantity = current_stock + item.quantity, updated_at = now()
    where id = item.product_id;

    insert into public.inventory_movements (product_id, movement_type, quantity, reason, notes, user_id, sale_item_id)
    values (item.product_id, 'Cancelamento', item.quantity, 'Estorno de venda', 'Cancelamento via função SQL', auth.uid(), item.id);
  end loop;

  return true;
end;
$$;

create or replace function public.audit_log_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payload jsonb;
  row_id text;
begin
  if (tg_op = 'DELETE') then
    payload := to_jsonb(old);
    row_id := old.id::text;
  else
    payload := to_jsonb(new);
    row_id := new.id::text;
  end if;

  insert into public.audit_logs(user_id, table_name, action, record_id, payload)
  values (auth.uid(), tg_table_name, tg_op, row_id, payload);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists sales_updated_at on public.sales;
create trigger sales_updated_at before update on public.sales for each row execute function public.set_updated_at();
drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists app_settings_updated_at on public.app_settings;
create trigger app_settings_updated_at before update on public.app_settings for each row execute function public.set_updated_at();

drop trigger if exists audit_products on public.products;
create trigger audit_products after insert or update or delete on public.products for each row execute function public.audit_log_changes();
drop trigger if exists audit_sales on public.sales;
create trigger audit_sales after insert or update or delete on public.sales for each row execute function public.audit_log_changes();
drop trigger if exists audit_expenses on public.expenses;
create trigger audit_expenses after insert or update or delete on public.expenses for each row execute function public.audit_log_changes();
drop trigger if exists audit_inventory on public.inventory_movements;
create trigger audit_inventory after insert or update or delete on public.inventory_movements for each row execute function public.audit_log_changes();

create or replace view public.v_low_stock_products as
select
  p.id as product_id,
  p.name as product_name,
  p.stock_quantity,
  p.min_stock,
  c.name as category_name
from public.products p
left join public.product_categories c on c.id = p.category_id
where p.stock_quantity <= p.min_stock;

create or replace view public.v_product_performance as
select
  p.id as product_id,
  p.name as product_name,
  coalesce(sum(si.quantity), 0)::int as total_quantity,
  coalesce(sum(si.total_amount), 0)::numeric(12,2) as revenue,
  coalesce(sum(si.production_cost * si.quantity), 0)::numeric(12,2) as cogs,
  (coalesce(sum(si.total_amount), 0) - coalesce(sum(si.production_cost * si.quantity), 0))::numeric(12,2) as gross_profit,
  case
    when coalesce(sum(si.total_amount), 0) > 0
      then ((coalesce(sum(si.total_amount), 0) - coalesce(sum(si.production_cost * si.quantity), 0)) / coalesce(sum(si.total_amount), 0)) * 100
    else 0
  end::numeric(10,2) as gross_margin
from public.products p
left join public.sale_items si on si.product_id = p.id
group by p.id, p.name;

create or replace view public.v_financial_summary as
with sales_agg as (
  select
    date_trunc('day', sold_at)::date as period_date,
    coalesce(sum(total_amount), 0)::numeric(12,2) as revenue,
    count(*)::int as sales_count
  from public.sales
  where status = 'Ativa'
  group by 1
),
cogs_agg as (
  select
    date_trunc('day', s.sold_at)::date as period_date,
    coalesce(sum(si.production_cost * si.quantity), 0)::numeric(12,2) as cogs
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  where s.status = 'Ativa'
  group by 1
),
expenses_agg as (
  select
    expense_date as period_date,
    coalesce(sum(amount), 0)::numeric(12,2) as expenses
  from public.expenses
  group by 1
)
select
  coalesce(sa.period_date, ca.period_date, ea.period_date) as period_date,
  coalesce(sa.revenue, 0)::numeric(12,2) as revenue,
  coalesce(ca.cogs, 0)::numeric(12,2) as cogs,
  (coalesce(sa.revenue, 0) - coalesce(ca.cogs, 0))::numeric(12,2) as gross_profit,
  coalesce(ea.expenses, 0)::numeric(12,2) as expenses,
  (coalesce(sa.revenue, 0) - coalesce(ca.cogs, 0) - coalesce(ea.expenses, 0))::numeric(12,2) as net_profit,
  coalesce(sa.sales_count, 0)::int as sales_count,
  case when coalesce(sa.sales_count, 0) > 0 then (coalesce(sa.revenue, 0) / sa.sales_count)::numeric(12,2) else 0 end as average_ticket
from sales_agg sa
full join cogs_agg ca using (period_date)
full join expenses_agg ea using (period_date);

-- RLS
alter table public.profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.dashboard_layouts enable row level security;
alter table public.app_settings enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select to authenticated
using (id = auth.uid() or public.has_any_role(array['administrador']::user_role[]));

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
for update to authenticated
using (id = auth.uid() or public.has_any_role(array['administrador']::user_role[]))
with check (id = auth.uid() or public.has_any_role(array['administrador']::user_role[]));

drop policy if exists "categories_read" on public.product_categories;
create policy "categories_read" on public.product_categories
for select to authenticated
using (true);

drop policy if exists "categories_write" on public.product_categories;
create policy "categories_write" on public.product_categories
for all to authenticated
using (public.has_any_role(array['administrador','estoque']::user_role[]))
with check (public.has_any_role(array['administrador','estoque']::user_role[]));

drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
for select to authenticated
using (true);

drop policy if exists "products_write" on public.products;
create policy "products_write" on public.products
for all to authenticated
using (public.has_any_role(array['administrador','estoque']::user_role[]))
with check (public.has_any_role(array['administrador','estoque']::user_role[]));

drop policy if exists "inventory_read" on public.inventory_movements;
create policy "inventory_read" on public.inventory_movements
for select to authenticated
using (true);

drop policy if exists "inventory_write" on public.inventory_movements;
create policy "inventory_write" on public.inventory_movements
for all to authenticated
using (public.has_any_role(array['administrador','estoque','vendas']::user_role[]))
with check (public.has_any_role(array['administrador','estoque','vendas']::user_role[]));

drop policy if exists "sales_read" on public.sales;
create policy "sales_read" on public.sales
for select to authenticated
using (true);

drop policy if exists "sales_write" on public.sales;
create policy "sales_write" on public.sales
for all to authenticated
using (public.has_any_role(array['administrador','vendas']::user_role[]))
with check (public.has_any_role(array['administrador','vendas']::user_role[]));

drop policy if exists "sale_items_read" on public.sale_items;
create policy "sale_items_read" on public.sale_items
for select to authenticated
using (true);

drop policy if exists "sale_items_write" on public.sale_items;
create policy "sale_items_write" on public.sale_items
for all to authenticated
using (public.has_any_role(array['administrador','vendas']::user_role[]))
with check (public.has_any_role(array['administrador','vendas']::user_role[]));

drop policy if exists "expense_categories_read" on public.expense_categories;
create policy "expense_categories_read" on public.expense_categories
for select to authenticated
using (true);

drop policy if exists "expense_categories_write" on public.expense_categories;
create policy "expense_categories_write" on public.expense_categories
for all to authenticated
using (public.has_any_role(array['administrador','financeiro']::user_role[]))
with check (public.has_any_role(array['administrador','financeiro']::user_role[]));

drop policy if exists "expenses_read" on public.expenses;
create policy "expenses_read" on public.expenses
for select to authenticated
using (true);

drop policy if exists "expenses_write" on public.expenses;
create policy "expenses_write" on public.expenses
for all to authenticated
using (public.has_any_role(array['administrador','financeiro']::user_role[]))
with check (public.has_any_role(array['administrador','financeiro']::user_role[]));

drop policy if exists "dashboard_layouts_own" on public.dashboard_layouts;
create policy "dashboard_layouts_own" on public.dashboard_layouts
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "app_settings_read" on public.app_settings;
create policy "app_settings_read" on public.app_settings
for select to authenticated
using (true);

drop policy if exists "app_settings_write" on public.app_settings;
create policy "app_settings_write" on public.app_settings
for all to authenticated
using (public.has_any_role(array['administrador']::user_role[]))
with check (public.has_any_role(array['administrador']::user_role[]));

drop policy if exists "audit_logs_read" on public.audit_logs;
create policy "audit_logs_read" on public.audit_logs
for select to authenticated
using (public.has_any_role(array['administrador']::user_role[]));

insert into public.product_categories (name) values
  ('Brigadeiros'),
  ('Trufas'),
  ('Pudins'),
  ('Ovos de Páscoa'),
  ('Sazonais'),
  ('Pedidos Personalizados')
on conflict (name) do nothing;

insert into public.expense_categories (name) values
  ('Ingredientes'),
  ('Embalagens'),
  ('Gás'),
  ('Energia'),
  ('Transporte'),
  ('Marketing'),
  ('Taxas'),
  ('Equipamentos'),
  ('Outros')
on conflict (name) do nothing;

insert into public.app_settings(id, company_name)
values (1, 'Brigadim')
on conflict (id) do nothing;
