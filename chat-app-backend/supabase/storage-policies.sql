-- Storage access policies for the `avatars` and `groups` buckets.
--
-- Run in the Supabase SQL editor (Dashboard → SQL Editor). Not a Prisma
-- migration: these live on `storage.objects` and in a `private` schema, neither
-- of which Prisma manages — `prisma migrate` would try to drop what it cannot see.
--
-- Both buckets must be created as PUBLIC. The app stores and renders
-- `getPublicUrl(...)`, so a private bucket yields broken images rather than an
-- error — the read policies below are the belt to that braces.
--
-- Re-runnable: every policy is dropped before it is created.

-- ---------------------------------------------------------------------------
-- Why the two buckets need different rules
--
--   avatars/<userId>/<timestamp>.webp     written by the user who owns the path
--   groups/<channelId>/<timestamp>.webp   written by an admin of that channel
--
-- A single bucket keyed on the uploader's id could not express the second case,
-- which is why group photos were split into their own bucket.
--
-- `users.id` is the Supabase auth uid (auth.service.ts mirrors it at sign-up),
-- so `auth.uid()` can be compared to the avatars folder name directly.
-- ---------------------------------------------------------------------------

begin;

-- ===========================================================================
-- Admin check
--
-- Postgres evaluates EVERY permissive policy for a command, not only the one
-- whose bucket matches — so an avatar upload also runs the groups policy. If
-- that policy read `channel_members` directly, every upload would fail with
-- "permission denied for table channel_members", because `authenticated` has no
-- grant on the app's tables.
--
-- Granting one would fix the error and open a hole: the app's tables are
-- currently unreachable through PostgREST precisely because those grants are
-- absent, and a GRANT SELECT here would publish the whole membership graph to
-- any signed-in user via /rest/v1/channel_members.
--
-- A SECURITY DEFINER function runs as its owner, so it can read the table while
-- exposing only a boolean. It lives in `private`, a schema PostgREST does not
-- serve, so it cannot be called as an RPC either.
-- ===========================================================================

create schema if not exists private;

create or replace function private.is_channel_admin(channel_id text, user_id text)
returns boolean
language sql
security definer
-- Pinned so the function cannot be redirected at a caller-controlled schema.
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1
    from public.channel_members
    where "channelId" = channel_id
      and "userId" = user_id
      and role = 'ADMIN'
  );
$$;

-- Reachable by signed-in users (the policies run as them) and nobody else.
revoke all on function private.is_channel_admin(text, text) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_channel_admin(text, text) to authenticated;

-- ===========================================================================
-- avatars
-- ===========================================================================

drop policy if exists "avatars: public read" on storage.objects;
create policy "avatars: public read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars: owner insert" on storage.objects;
create policy "avatars: owner insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- The client uploads with `x-upsert: true`, so an overwrite is an UPDATE rather
-- than an INSERT. Paths are timestamped and collisions are effectively
-- impossible, but without this a retry landing on the same name would 403.
drop policy if exists "avatars: owner update" on storage.objects;
create policy "avatars: owner update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- ===========================================================================
-- groups
--
-- Storage enforces the same rule the API does (channels.policy), rather than
-- trusting that nobody calls the storage endpoint directly. The folder name is
-- the channel id, which is what makes this expressible at all.
-- ===========================================================================

drop policy if exists "groups: public read" on storage.objects;
create policy "groups: public read"
on storage.objects for select
to public
using (bucket_id = 'groups');

drop policy if exists "groups: admin insert" on storage.objects;
create policy "groups: admin insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'groups'
  and private.is_channel_admin((storage.foldername(name))[1], auth.uid()::text)
);

drop policy if exists "groups: admin update" on storage.objects;
create policy "groups: admin update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'groups'
  and private.is_channel_admin((storage.foldername(name))[1], auth.uid()::text)
)
with check (
  bucket_id = 'groups'
  and private.is_channel_admin((storage.foldername(name))[1], auth.uid()::text)
);

drop policy if exists "groups: admin delete" on storage.objects;
create policy "groups: admin delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'groups'
  and private.is_channel_admin((storage.foldername(name))[1], auth.uid()::text)
);

commit;

-- ---------------------------------------------------------------------------
-- Verify
--
--   select policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'storage' and tablename = 'objects'
--   order by policyname;
--
-- Expect eight rows: four per bucket.
--
-- The function answers without exposing the table:
--
--   select private.is_channel_admin('<channelId>', '<userId>');
-- ---------------------------------------------------------------------------
