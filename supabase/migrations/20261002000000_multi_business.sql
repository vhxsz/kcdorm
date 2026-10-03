-- Multi-business isolation. Apply after the existing room_service migrations.
create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  telegram_bot_token text,
  telegram_chat_id text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.businesses enable row level security;

insert into public.businesses (id, name, slug, telegram_bot_token, telegram_chat_id)
values (
  '00000000-0000-4000-8000-000000000001',
  'Pizza Next Door',
  'main',
  null,
  null
)
on conflict (slug) do nothing;

alter table public.admin_users add column business_id uuid references public.businesses(id) on delete cascade;
alter table public.products add column business_id uuid references public.businesses(id) on delete cascade;
alter table public.orders add column business_id uuid references public.businesses(id) on delete cascade;

update public.admin_users set business_id = '00000000-0000-4000-8000-000000000001' where business_id is null;
update public.products set business_id = '00000000-0000-4000-8000-000000000001' where business_id is null;
update public.orders set business_id = '00000000-0000-4000-8000-000000000001' where business_id is null;

alter table public.admin_users alter column business_id set not null;
alter table public.products alter column business_id set not null;
alter table public.orders alter column business_id set not null;

create index idx_products_business_active on public.products (business_id, active, category);
create index idx_orders_business_created on public.orders (business_id, created_at desc);
create index idx_admin_users_business on public.admin_users (business_id);

create or replace function private.current_business_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select business_id from public.admin_users where user_id = (select auth.uid());
$$;
revoke all on function private.current_business_id() from public;
grant execute on function private.current_business_id() to authenticated;

drop policy if exists "public reads active products" on public.products;
drop policy if exists "admins insert products" on public.products;
drop policy if exists "admins update products" on public.products;
drop policy if exists "admins read orders" on public.orders;
drop policy if exists "admins update orders" on public.orders;
drop policy if exists "admins delete orders" on public.orders;
drop policy if exists "admins read order items" on public.order_items;

create policy "public reads active products" on public.products
  for select to anon, authenticated using (active = true or business_id = private.current_business_id());
create policy "business admins insert products" on public.products
  for insert to authenticated with check (business_id = private.current_business_id());
create policy "business admins update products" on public.products
  for update to authenticated using (business_id = private.current_business_id()) with check (business_id = private.current_business_id());
create policy "business admins read orders" on public.orders
  for select to authenticated using (business_id = private.current_business_id());
create policy "business admins update orders" on public.orders
  for update to authenticated using (business_id = private.current_business_id()) with check (business_id = private.current_business_id());
create policy "business admins delete orders" on public.orders
  for delete to authenticated using (business_id = private.current_business_id());
create policy "business admins read order items" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.business_id = private.current_business_id()
    )
  );

create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  new_order public.orders;
  line jsonb;
  product public.products;
  amount numeric(10,2) := 0;
  requested_business uuid := (payload->>'business_id')::uuid;
begin
  if not exists (select 1 from public.businesses where id = requested_business and active = true) then
    raise exception 'Business unavailable';
  end if;
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products
      where id = (line->>'product_id')::uuid
        and business_id = requested_business and active = true for update;
    if product.id is null or product.stock < (line->>'quantity')::integer then
      raise exception 'Item unavailable';
    end if;
    amount := amount + (product.price + coalesce((
      select sum((extra->>'price')::numeric)
      from jsonb_array_elements(product.extras) extra
      where extra->>'name' in (select jsonb_array_elements_text(coalesce(line->'extras','[]'::jsonb)))
    ),0)) * (line->>'quantity')::integer;
  end loop;
  insert into public.orders(business_id,customer_name,room_number,scheduled_for,payment_method,status,total)
  values(requested_business,payload->>'customer_name',payload->>'room_number',nullif(payload->>'scheduled_for','')::timestamptz,payload->>'payment_method',case when payload->>'scheduled_for' is null then 'new' else 'scheduled' end,amount)
  returning * into new_order;
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products
      where id = (line->>'product_id')::uuid and business_id = requested_business for update;
    insert into public.order_items(order_id,product_id,title_snapshot,unit_price,quantity,extras)
    values(new_order.id,product.id,product.title,product.price,(line->>'quantity')::integer,coalesce(line->'extras','[]'::jsonb));
    update public.products set stock = stock - (line->>'quantity')::integer, updated_at = now()
      where id = product.id and business_id = requested_business;
  end loop;
  return jsonb_build_object('id',new_order.id,'order_number',new_order.order_number,'total',new_order.total,'status',new_order.status);
end $$;

revoke all on table public.businesses from anon, authenticated;
