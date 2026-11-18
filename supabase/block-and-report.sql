-- =====================================================================
-- NimoSail: BLOCK AND REPORT (18.11.2026)
-- =====================================================================
-- Why: Google Play's user-generated content policy expects apps where users
-- share content with each other to let them BLOCK other users and REPORT
-- users or content. This file adds what the app (js/friends.js) needs.
--
-- What it does:
--   1. A new "blocks" table: one row = "this person blocked that person".
--      Only the person who blocked can see their own rows.
--   2. private.is_blocked(a, b): true if either of the two has blocked the other.
--   3. public.block_user(p_user): blocks someone in one step - adds the block,
--      removes any friendship or friend request between you, and removes any
--      sails either of you has sent the other that haven't been added yet.
--   4. Tightened rules:
--        * no friend requests between blocked people (either way)
--        * no sails sent between blocked people (either way)
--        * someone who blocked you disappears from search and from the
--          "find by email" lookup, and you can't see their public card
--   5. "Contact us" messages (the feedback table) get a new topic, 'report',
--      used by the Report buttons. Reports email Pete through the existing
--      feedback trigger (email-alerts.sql); nothing to redeploy.
--
-- How to run it (once):
--   Supabase -> the NimoSail project (Frankfurt) -> SQL Editor -> New query
--   -> paste this whole file -> Run. "Success. No rows returned" = done.
--   Safe to run again (everything is "if not exists" / "replace" / drop-then-create).
--
-- 00-full-database-setup.sql has been updated with the same changes, so it
-- still describes the real database.
-- =====================================================================

-- 1. the blocks table -------------------------------------------------
create table if not exists public.blocks (
  blocker_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id  uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_id_idx on public.blocks (blocked_id);

revoke all on public.blocks from anon, authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant all on public.blocks to service_role;

alter table public.blocks enable row level security;
drop policy if exists blocks_select on public.blocks;
drop policy if exists blocks_insert on public.blocks;
drop policy if exists blocks_delete on public.blocks;
create policy blocks_select on public.blocks
  for select to authenticated using (blocker_id = (select auth.uid()));
create policy blocks_insert on public.blocks
  for insert to authenticated with check (blocker_id = (select auth.uid()));
create policy blocks_delete on public.blocks
  for delete to authenticated using (blocker_id = (select auth.uid()));

-- 2. is_blocked: has either of these two blocked the other? -----------
--    Only answers if YOU are one of the two (like are_friends).
create or replace function private.is_blocked(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() in (a, b)
     and exists (
       select 1 from public.blocks
        where (blocker_id = a and blocked_id = b)
           or (blocker_id = b and blocked_id = a)
     );
$$;
-- Has this person blocked ME? (used to hide their public card from me)
create or replace function private.has_blocked_me(other uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
     where blocker_id = other and blocked_id = auth.uid()
  );
$$;
revoke all on function private.is_blocked(uuid, uuid)   from public, anon;
revoke all on function private.has_blocked_me(uuid)     from public, anon;
grant execute on function private.is_blocked(uuid, uuid) to authenticated;
grant execute on function private.has_blocked_me(uuid)   to authenticated;

-- 3. block_user: the "Block" button -----------------------------------
create or replace function public.block_user(p_user uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'Not signed in'; end if;
  if p_user is null or p_user = me then raise exception 'Invalid user'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (me, p_user)
    on conflict do nothing;
  delete from public.friendships
   where (requester_id = me and addressee_id = p_user)
      or (requester_id = p_user and addressee_id = me);
  delete from public.sail_shares
   where (sender_id = me and recipient_id = p_user)
      or (sender_id = p_user and recipient_id = me);
end;
$$;
revoke all on function public.block_user(uuid) from public, anon;
grant execute on function public.block_user(uuid) to authenticated;

-- 4. tightened rules ----------------------------------------------------
-- friend requests: not between blocked people
drop policy if exists friendships_insert on public.friendships;
create policy friendships_insert on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending'
              and not private.is_blocked(requester_id, addressee_id));

-- accepting a request: not if one of you has blocked the other since
create or replace function public.accept_friend_request(request_id uuid)
returns void language sql security definer set search_path = 'public'
as $$
  update public.friendships
     set status = 'accepted', updated_at = now()
   where id = request_id
     and addressee_id = auth.uid()
     and status = 'pending'
     and not private.is_blocked(requester_id, addressee_id);
$$;

-- sending a sail: friends only, and not blocked
drop policy if exists sail_shares_insert on public.sail_shares;
create policy sail_shares_insert on public.sail_shares
  for insert to authenticated
  with check (sender_id = (select auth.uid())
              and private.are_friends((select auth.uid()), recipient_id)
              and not private.is_blocked((select auth.uid()), recipient_id));

-- public cards: you can't see the card of someone who has blocked you
-- (people YOU blocked stay readable, so the Blocked sailors list can show them)
drop policy if exists public_profiles_select on public.public_profiles;
create policy public_profiles_select on public.public_profiles
  for select to authenticated
  using (not private.has_blocked_me(user_id));

-- find by email: not someone who has blocked you
create or replace function public.find_sailor_by_email(p_email text)
returns table (user_id uuid, username text, display_name text, avatar_url text)
language sql stable security definer set search_path = ''
as $$
  select p.user_id, p.username, p.display_name, p.avatar_url
  from public.public_profiles p
  join auth.users u on u.id = p.user_id
  where auth.uid() is not null
    and u.id <> auth.uid()
    and lower(u.email) = lower(trim(p_email))
    and not exists (select 1 from public.blocks b
                     where b.blocker_id = p.user_id and b.blocked_id = auth.uid())
  limit 1;
$$;

-- 5. reports arrive as feedback with topic 'report' ---------------------
alter table public.feedback drop constraint if exists feedback_topic_check;
alter table public.feedback add constraint feedback_topic_check
  check (topic in ('feedback', 'problem', 'idea', 'other', 'report'));
