-- Row-level security and server-side money movement.
--
-- Run this once in the Supabase dashboard (SQL Editor -> New query -> Run).
-- It is safe to re-run.
--
-- Before this migration both tables were readable and writable by anyone
-- holding the public anon key. Afterwards:
--   * each signed-in user can only read and change their own rows;
--   * transfers between users happen in one database transaction via
--     transfer_money(), which validates the amount, balance and receiver;
--   * get_receiver() exposes only a receiver's name and avatar.

-- 1. Row-level security ------------------------------------------------------

alter table public."accountsTrx" enable row level security;
alter table public.owners enable row level security;

drop policy if exists "Users read own account" on public."accountsTrx";
drop policy if exists "Users create own account" on public."accountsTrx";
drop policy if exists "Users update own account" on public."accountsTrx";
drop policy if exists "Users delete own account" on public."accountsTrx";

create policy "Users read own account" on public."accountsTrx"
  for select to authenticated
  using (owners_id::text = auth.uid()::text);

create policy "Users create own account" on public."accountsTrx"
  for insert to authenticated
  with check (owners_id::text = auth.uid()::text);

create policy "Users update own account" on public."accountsTrx"
  for update to authenticated
  using (owners_id::text = auth.uid()::text)
  with check (owners_id::text = auth.uid()::text);

create policy "Users delete own account" on public."accountsTrx"
  for delete to authenticated
  using (owners_id::text = auth.uid()::text);

drop policy if exists "Users read own profile" on public.owners;
drop policy if exists "Users create own profile" on public.owners;
drop policy if exists "Users update own profile" on public.owners;

create policy "Users read own profile" on public.owners
  for select to authenticated
  using (user_id::text = auth.uid()::text);

create policy "Users create own profile" on public.owners
  for insert to authenticated
  with check (user_id::text = auth.uid()::text);

create policy "Users update own profile" on public.owners
  for update to authenticated
  using (user_id::text = auth.uid()::text)
  with check (user_id::text = auth.uid()::text);

-- 2. Receiver lookup for transfers -------------------------------------------

create or replace function public.get_receiver(receiver_id text)
returns table (user_id text, name text, avatar text)
language sql
stable
security definer
set search_path = public
as $$
  select o.user_id::text, o.name::text, o.avatar::text
  from public.owners o
  where o.user_id::text = receiver_id
    and auth.uid() is not null;
$$;

revoke all on function public.get_receiver(text) from public, anon;
grant execute on function public.get_receiver(text) to authenticated;

-- 3. Atomic transfers ----------------------------------------------------------

create or replace function public.transfer_money(
  receiver_id text,
  amount numeric,
  category text default 'General'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  sender_id text := auth.uid()::text;
  sender_trx jsonb;
  sender_bal jsonb;
  receiver_trx jsonb;
  receiver_bal jsonb;
  sender_name text;
  sender_avatar text;
  receiver_name text;
  receiver_avatar text;
  trx_type text;
  bal_type text;
  now_iso text := to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
begin
  if sender_id is null then
    raise exception 'Not signed in' using errcode = '28000';
  end if;
  if amount is null or amount <= 0 or amount > 1000000 then
    raise exception 'Enter an amount greater than zero' using errcode = '22023';
  end if;
  if receiver_id = sender_id then
    raise exception 'You can''t send money to yourself' using errcode = '22023';
  end if;

  -- Lock both accounts in a fixed order so concurrent transfers can't deadlock
  -- or both spend the same balance.
  perform 1 from public."accountsTrx"
  where owners_id::text in (sender_id, receiver_id)
  order by owners_id::text
  for update;

  select to_jsonb(a.transactions), to_jsonb(a.balance)
    into sender_trx, sender_bal
  from public."accountsTrx" a where a.owners_id::text = sender_id;

  select to_jsonb(a.transactions), to_jsonb(a.balance)
    into receiver_trx, receiver_bal
  from public."accountsTrx" a where a.owners_id::text = receiver_id;

  if sender_bal is null then
    raise exception 'Your account was not found' using errcode = 'P0002';
  end if;
  if receiver_bal is null then
    raise exception 'Receiver not found' using errcode = 'P0002';
  end if;
  if coalesce((sender_bal->>'current')::numeric, 0) < amount then
    raise exception 'Insufficient balance' using errcode = '22023';
  end if;

  select o.name::text, coalesce(o.avatar::text, '')
    into sender_name, sender_avatar
  from public.owners o where o.user_id::text = sender_id;

  select o.name::text, coalesce(o.avatar::text, '')
    into receiver_name, receiver_avatar
  from public.owners o where o.user_id::text = receiver_id;

  sender_trx := coalesce(sender_trx, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', coalesce(receiver_name, 'Transfer'),
      'avatar', receiver_avatar,
      'category', coalesce(category, 'General'),
      'date', now_iso,
      'amount', -amount,
      'recurring', false
    )
  );
  sender_bal := sender_bal || jsonb_build_object(
    'current', (sender_bal->>'current')::numeric - amount,
    'expenses', coalesce((sender_bal->>'expenses')::numeric, 0) + amount
  );

  receiver_trx := coalesce(receiver_trx, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'id', gen_random_uuid()::text,
      'name', coalesce(sender_name, 'Transfer'),
      'avatar', sender_avatar,
      'category', coalesce(category, 'General'),
      'date', now_iso,
      'amount', amount,
      'recurring', false
    )
  );
  receiver_bal := receiver_bal || jsonb_build_object(
    'current', coalesce((receiver_bal->>'current')::numeric, 0) + amount,
    'income', coalesce((receiver_bal->>'income')::numeric, 0) + amount
  );

  -- The columns may be json or jsonb depending on how the table was created,
  -- so cast to whichever type they actually are.
  select c.data_type into trx_type from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'accountsTrx'
    and c.column_name = 'transactions';
  select c.data_type into bal_type from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'accountsTrx'
    and c.column_name = 'balance';

  if trx_type not in ('json', 'jsonb') or bal_type not in ('json', 'jsonb') then
    raise exception 'Unsupported column types: transactions=%, balance=%',
      trx_type, bal_type;
  end if;

  execute format(
    'update public."accountsTrx" set transactions = $1::%s, balance = $2::%s where owners_id::text = $3',
    trx_type, bal_type
  ) using sender_trx, sender_bal, sender_id;

  execute format(
    'update public."accountsTrx" set transactions = $1::%s, balance = $2::%s where owners_id::text = $3',
    trx_type, bal_type
  ) using receiver_trx, receiver_bal, receiver_id;
end;
$$;

revoke all on function public.transfer_money(text, numeric, text) from public, anon;
grant execute on function public.transfer_money(text, numeric, text) to authenticated;
