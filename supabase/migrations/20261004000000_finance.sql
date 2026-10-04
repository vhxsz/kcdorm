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
