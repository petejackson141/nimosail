-- =====================================================================
-- NimoSail: remove things the app never uses (22 November 2026)
-- Run ONCE in Supabase > SQL Editor on the Frankfurt project.
--
-- 1. Sails can no longer be marked "public". The app only ever saves
--    "private" (Only me) or "friends". A "public" sail could have been read
--    by ANY signed-in user, so this closes a door nothing uses.
-- 2. profiles loses two old columns, avatar_url and boat_name, left over
--    from the first version. The app keeps the whole profile in
--    profile_data. (public_profiles.avatar_url, the small photo friends
--    see, is a different column and stays.)
--
-- Checked first on 22 Nov 2026: no "public" sails, both columns empty,
-- nothing depends on them. The script checks again and stops, changing
-- nothing, if that's no longer true. Everything runs as one transaction.
-- =====================================================================

begin;

do $$
begin
  if exists (select 1 from public.trips where visibility = 'public') then
    raise exception 'Stopped: some sails are marked public. Nothing was changed. Send this to Claude.';
  end if;
  if exists (select 1 from public.profiles where avatar_url is not null or boat_name is not null) then
    raise exception 'Stopped: profiles.avatar_url or boat_name has data. Nothing was changed. Send this to Claude.';
  end if;
end $$;

-- 1. Only "private" and "friends" allowed
alter table public.trips drop constraint if exists trips_visibility_check;
alter table public.trips add constraint trips_visibility_check
  check (visibility in ('private', 'friends'));

-- The trips read rule, without the "public" part.
-- Owner sees everything; friends see sails marked "friends". Unchanged otherwise.
drop policy if exists trips_select on public.trips;
create policy trips_select on public.trips
  for select to authenticated using (
    user_id = (select auth.uid())
    or (deleted_at is null
        and visibility = 'friends'
        and private.are_friends((select auth.uid()), user_id))
  );

-- 2. The two old profile columns
alter table public.profiles drop column if exists avatar_url;
alter table public.profiles drop column if exists boat_name;

commit;

-- Check: should show the new rule, the new check, and no old columns.
select 'trips_select rule' as item, pg_get_expr(pol.polqual, pol.polrelid) as now
from pg_policy pol where pol.polrelid = 'public.trips'::regclass and pol.polname = 'trips_select'
union all
select 'trips visibility check', pg_get_constraintdef(c.oid)
from pg_constraint c where c.conrelid = 'public.trips'::regclass and c.conname = 'trips_visibility_check'
union all
select 'profiles columns', string_agg(column_name, ', ' order by ordinal_position)
from information_schema.columns where table_schema = 'public' and table_name = 'profiles';
