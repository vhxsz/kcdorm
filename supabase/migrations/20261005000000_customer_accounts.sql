alter table public.orders
add column if not exists customer_user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_orders_customer_history
on public.orders (business_id, customer_user_id, created_at desc);

create table if not exists public.customer_profiles (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  room_number text not null check (char_length(room_number) between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

alter table public.customer_profiles enable row level security;

-- Customer identity is verified in the API. This wrapper keeps the order and
-- its user link in one transaction; manual admin sales still use place_order.
create or replace function public.place_customer_order(payload jsonb, customer_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare created jsonb;
begin
  if customer_id is null or not exists (select 1 from auth.users where id = customer_id) then
    raise exception 'A valid customer account is required';
  end if;
  created := public.place_order(payload);
  update public.orders
  set customer_user_id = customer_id
  where id = (created->>'id')::uuid
    and business_id = (payload->>'business_id')::uuid;
  if not found then raise exception 'Order could not be linked to the customer'; end if;
  return created;
end $$;

revoke all on function public.place_customer_order(jsonb, uuid) from public, anon, authenticated;
grant execute on function public.place_customer_order(jsonb, uuid) to service_role;
