-- Enables row level security on every application table, with no policies.
--
-- Run in the Supabase SQL editor. Re-runnable, and safe to run again after new
-- migrations add tables (it skips ones already enabled).
--
-- ---------------------------------------------------------------------------
-- What this does, and what it deliberately does not
--
-- RLS with zero policies is deny-by-default for everyone EXCEPT the table
-- owner. Prisma connects as `postgres`, which owns these tables, and an owner
-- bypasses RLS unless FORCE ROW LEVEL SECURITY is set — so the API keeps working
-- untouched. Verified: with RLS on and no policies, the owning role still reads
-- rows while a merely-granted role reads none.
--
-- The point is defence in depth. Today the app's tables are unreachable through
-- PostgREST only because `anon`/`authenticated` hold no grants on them — a
-- single mistaken GRANT, or a dashboard action that adds one, would publish the
-- whole schema. With RLS on, such a grant is no longer sufficient to read
-- anything: a policy would also have to be written. One accident stops being
-- enough.
--
-- DO NOT add FORCE ROW LEVEL SECURITY. That subjects the owner to policies too,
-- and since there are none, it would lock the backend out of its own database.
--
-- Adding a policy here is what would *open* access to API clients. There are
-- none on purpose: this app reaches its data through the Express API, never
-- through PostgREST directly.
-- ---------------------------------------------------------------------------

do $$
declare
  target record;
begin
  for target in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'          -- ordinary tables only
      and not c.relrowsecurity     -- skip ones already enabled
  loop
    execute format(
      'alter table public.%I enable row level security',
      target.relname
    );
    raise notice 'RLS enabled on public.%', target.relname;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Verify — every table should report true.
--
--   select relname as table_name, relrowsecurity as rls_enabled
--   from pg_class c
--   join pg_namespace n on n.oid = c.relnamespace
--   where n.nspname = 'public' and c.relkind = 'r'
--   order by relname;
--
-- And confirm nothing was accidentally opened up (expect zero rows):
--
--   select tablename, policyname
--   from pg_policies
--   where schemaname = 'public';
-- ---------------------------------------------------------------------------
