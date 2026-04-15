-- Keep-alive cron job — prevents the Supabase free-tier database from
-- sleeping after 7 days of inactivity by running a lightweight query
-- every 5 days via pg_cron.
--
-- NOTE: pg_cron must be enabled first in the Supabase dashboard:
--   Dashboard → Database → Extensions → pg_cron → Enable
--
-- The job runs at midnight UTC on days 1, 6, 11, 16, 21, 26, 31 of each
-- month (every ~5 days), which keeps the project well within the 7-day
-- inactivity window on the free tier.

-- Enable the extension (idempotent — safe to re-run)
create extension if not exists pg_cron with schema extensions;

-- Grant pg_cron usage to the postgres role (required by Supabase)
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

-- Remove any existing job with the same name before (re-)creating it
select cron.unschedule('pawtaker-keep-alive')
where exists (
  select 1 from cron.job where jobname = 'pawtaker-keep-alive'
);

-- Schedule: midnight UTC, every 5 days (1st, 6th, 11th, 16th, 21st, 26th, 31st)
select cron.schedule(
  'pawtaker-keep-alive',          -- job name
  '0 0 1,6,11,16,21,26 * *',     -- cron expression: every ~5 days at midnight UTC
  $$select count(*) from public.users limit 1$$
);
