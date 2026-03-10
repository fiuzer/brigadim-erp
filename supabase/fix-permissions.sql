-- Reparo de permissoes apos reset/migracao.
-- Rode no SQL Editor do Supabase quando ocorrer:
-- "permission denied for table ..."

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant all on all sequences in schema public to postgres, service_role;
grant all on all routines in schema public to postgres, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select, update on all sequences in schema public to authenticated;
grant execute on all routines in schema public to authenticated;

alter default privileges for role postgres in schema public
grant select, insert, update, delete on tables to authenticated;
alter default privileges for role postgres in schema public
grant usage, select, update on sequences to authenticated;
alter default privileges for role postgres in schema public
grant execute on routines to authenticated;
