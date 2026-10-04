alter table public.products
add column if not exists cost_price numeric(10,2) not null default 0
check (cost_price >= 0);

alter table public.orders
add column if not exists cost_total numeric(10,2) not null default 0,
add column if not exists payment_status text not null default 'pending'
  check (payment_status in ('pending', 'confirmed')),
add column if not exists confirmed_at timestamptz,
add column if not exists confirmed_by uuid references auth.users(id);

alter table public.order_items
add column if not exists purchase_cost_snapshot numeric(10,2) not null default 0
check (purchase_cost_snapshot >= 0);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  type text not null check (type in ('bank', 'cash')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.orders
add column if not exists bank_account_id uuid references public.bank_accounts(id);

alter table public.bank_accounts enable row level security;
create index if not exists idx_orders_finance on public.orders (business_id, payment_status, confirmed_at desc);
create index if not exists idx_bank_accounts_business on public.bank_accounts (business_id, active);

insert into public.bank_accounts (business_id, name, type)
select id, 'Cash', 'cash' from public.businesses
where not exists (select 1 from public.bank_accounts where bank_accounts.business_id = businesses.id and type = 'cash');

create or replace function private.create_default_cash_account() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.bank_accounts (business_id, name, type)
  values (new.id, 'Cash', 'cash');
  return new;
end $$;

drop trigger if exists create_default_cash_account on public.businesses;
create trigger create_default_cash_account after insert on public.businesses
for each row execute function private.create_default_cash_account();

create or replace function private.validate_order_payment() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.payment_status = 'confirmed' then
      raise exception 'Confirmed payments cannot be deleted';
    end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and old.payment_status = 'confirmed' and (
    new.payment_status is distinct from old.payment_status or
    new.confirmed_at is distinct from old.confirmed_at or
    new.confirmed_by is distinct from old.confirmed_by or
    new.bank_account_id is distinct from old.bank_account_id or
    new.total is distinct from old.total or
    new.cost_total is distinct from old.cost_total
  ) then
    raise exception 'Confirmed payment records cannot be changed';
  end if;
  if new.payment_status = 'confirmed' then
    if new.confirmed_at is null or new.confirmed_by is null or new.bank_account_id is null then
      raise exception 'Payment confirmation details are required';
    end if;
    if not exists (
      select 1 from public.bank_accounts
      where id = new.bank_account_id
        and business_id = new.business_id
        and active = true
    ) then
      raise exception 'Payment account does not belong to this business';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists validate_order_payment on public.orders;
create trigger validate_order_payment before update or delete on public.orders
for each row execute function private.validate_order_payment();

drop policy if exists "business admins delete orders" on public.orders;
create policy "business admins delete pending orders" on public.orders
for delete to authenticated
using (business_id = private.current_business_id() and payment_status = 'pending');

create or replace function private.capture_item_cost() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select cost_price into new.purchase_cost_snapshot from public.products where id = new.product_id;
  return new;
end $$;

drop trigger if exists capture_order_item_cost on public.order_items;
create trigger capture_order_item_cost before insert on public.order_items
for each row execute function private.capture_item_cost();

create or replace function private.update_order_cost() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.orders
  set cost_total = coalesce((select sum(purchase_cost_snapshot * quantity) from public.order_items where order_id = new.order_id), 0)
  where id = new.order_id;
  return new;
end $$;

drop trigger if exists update_order_cost_after_item on public.order_items;
create trigger update_order_cost_after_item after insert or update on public.order_items
for each row execute function private.update_order_cost();

update public.order_items oi
set purchase_cost_snapshot = p.cost_price
from public.products p
where p.id = oi.product_id and oi.purchase_cost_snapshot = 0;

update public.orders o
set cost_total = coalesce((select sum(oi.purchase_cost_snapshot * oi.quantity) from public.order_items oi where oi.order_id = o.id), 0);
