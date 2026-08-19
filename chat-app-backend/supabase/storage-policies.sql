-- Storage access policies for the `avatars` and `groups` buckets.
--
-- Run in the Supabase SQL editor (Dashboard → SQL Editor). Not a Prisma
-- migration: these live on `storage.objects`, a schema Prisma does not manage,
-- and `prisma migrate` would try to drop what it cannot see.
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
-- ===========================================================================

drop policy if exists "groups: public read" on storage.objects;
create policy "groups: public read"
on storage.objects for select
to public
using (bucket_id = 'groups');

-- Admin status is checked against the app's own membership table, so storage
-- enforces the same rule the API does (channels.policy) rather than trusting
-- that nobody calls the storage endpoint directly.
--
-- The folder name is the channel id, which is what makes this expressible.
drop policy if exists "groups: admin insert" on storage.objects;
create policy "groups: admin insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'groups'
  and exists (
    select 1
    from public.channel_members cm
    where cm."channelId" = (storage.foldername(name))[1]
      and cm."userId" = auth.uid()::text
      and cm.role = 'ADMIN'
  )
);

drop policy if exists "groups: admin update" on storage.objects;
create policy "groups: admin update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'groups'
  and exists (
    select 1
    from public.channel_members cm
    where cm."channelId" = (storage.foldername(name))[1]
      and cm."userId" = auth.uid()::text
      and cm.role = 'ADMIN'
  )
)
with check (
  bucket_id = 'groups'
  and exists (
    select 1
    from public.channel_members cm
    where cm."channelId" = (storage.foldername(name))[1]
      and cm."userId" = auth.uid()::text
      and cm.role = 'ADMIN'
  )
);

drop policy if exists "groups: admin delete" on storage.objects;
create policy "groups: admin delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'groups'
  and exists (
    select 1
    from public.channel_members cm
    where cm."channelId" = (storage.foldername(name))[1]
      and cm."userId" = auth.uid()::text
      and cm.role = 'ADMIN'
  )
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
-- ---------------------------------------------------------------------------
