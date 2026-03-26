-- PostgREST connects as `anon` (no JWT) or `authenticated` (valid JWT).
-- RLS policies only apply AFTER the role has table-level privileges.
-- Without GRANT, Postgres returns: "permission denied for table <name>".
--
-- Apply in Supabase SQL Editor (as postgres) if the app shows that error on
-- pets, contracts, taker_profiles, threads, etc.

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public to anon, authenticated;
grant all on all sequences in schema public to service_role;

-- Objects created later via migrations (optional convenience)
alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated;
alter default privileges in schema public grant all on sequences to service_role;
