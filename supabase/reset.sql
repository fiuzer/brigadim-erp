-- Reset total do banco para ambiente de desenvolvimento/homologacao.
-- ATENCAO: este script apaga TODOS os dados de autenticacao e do schema public.

-- 1) Remove todos os usuarios do Auth (inclui identidades/sessoes via cascata).
delete from auth.users;

-- 2) Recria o schema public do zero.
drop schema if exists public cascade;
create schema public;

-- 3) Restaura grants basicos esperados pelo Supabase.
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres;

-- 4) Extensoes usadas no projeto.
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Depois deste script:
-- - Rode todo o arquivo supabase/schema.sql
-- - Se surgir "permission denied for table ...", rode supabase/fix-permissions.sql
-- - Crie seu primeiro usuario
-- - Promova para administrador na tabela public.profiles
