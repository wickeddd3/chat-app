-- Storage access policies for the `avatars` and `groups` buckets.
--
-- Run in the Supabase SQL editor (Dashboard → SQL Editor). Not a Prisma
-- migration: these live on `storage.objects`, a schema Prisma does not manage —
-- `prisma migrate` would try to drop what it cannot see.
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
--   groups/<channelId>/<timestamp>.webp   written by any signed-in user
--
-- A single bucket keyed on the uploader's id could not express the second case,
-- which is why group photos were split into their own bucket.
--
-- `users.id` is the Supabase auth uid (auth.service.ts mirrors it at sign-up),
-- so `auth.uid()` can be compared to the avatars folder name directly.
-- ---------------------------------------------------------------------------

begin;

-- ===========================================================================
-- Retired: the storage-side admin check
--
-- An earlier version of this file checked group-admin status from the policy,
-- via a SECURITY DEFINER function over `channel_members`. It was correct, and
-- unusable: storage policies evaluate against the SUPABASE database, while
-- local development runs on its own Postgres. A group created locally does not
-- exist there, so the check answered "no admin" and every local upload failed
-- with "new row violates row-level security policy".
--
-- Group writes are now authorised by being signed in, and the admin rule is
-- enforced where it can see the right data — the API (channels.policy), which
-- rejects a non-admin's PATCH of the channel image with a 403.
--
-- What that concedes: a signed-in non-admin could PUT a file into the groups
-- bucket. They cannot attach it to any channel, so nothing renders it and
-- nobody sees it. The exposure is an orphaned object, not access to data.
-- ===========================================================================

-- The policies from the earlier version depend on the function, so they have to
-- go first — dropping a function still referenced by a policy errors out.
drop policy if exists "groups: admin insert" on storage.objects;
drop policy if exists "groups: admin update" on storage.objects;
drop policy if exists "groups: admin delete" on storage.objects;

drop function if exists private.is_channel_admin(text, text);

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
-- Signed-in writes only. Who may actually give a channel a photo is decided by
-- the API, which can see the membership table this database cannot be relied on
-- to hold (see the retired check above).
-- ===========================================================================

drop policy if exists "groups: public read" on storage.objects;
create policy "groups: public read"
on storage.objects for select
to public
using (bucket_id = 'groups');

drop policy if exists "groups: authenticated insert" on storage.objects;
create policy "groups: authenticated insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'groups'
);

drop policy if exists "groups: authenticated update" on storage.objects;
create policy "groups: authenticated update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'groups'
)
with check (
  bucket_id = 'groups'
);

drop policy if exists "groups: authenticated delete" on storage.objects;
create policy "groups: authenticated delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'groups'
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
-- ---------------------------------------------------------------------------
