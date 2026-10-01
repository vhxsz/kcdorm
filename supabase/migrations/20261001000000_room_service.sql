create extension if not exists pgcrypto;
create schema if not exists private;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  price numeric(10,2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  delivery_minutes integer not null check (delivery_minutes between 1 and 240),
  image_url text,
  category text not null default 'Pizzas',
  extras jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null,
  room_number text not null,
  scheduled_for timestamptz,
  payment_method text not null check (payment_method in ('etransfer','cash')),
  status text not null default 'new' check (status in ('new','scheduled','preparing','ready','delivered','cancelled')),
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  title_snapshot text not null,
  unit_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0),
  extras jsonb not null default '[]'::jsonb
);

create index idx_products_active_category on public.products (active, category) where active = true;
create index idx_orders_status_created on public.orders (status, created_at desc);
create index idx_order_items_order on public.order_items (order_id);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

create policy "public reads active products" on public.products for select to anon, authenticated using (active = true or private.is_admin());
create policy "admins insert products" on public.products for insert to authenticated with check (private.is_admin());
create policy "admins update products" on public.products for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admins read orders" on public.orders for select to authenticated using (private.is_admin());
create policy "admins update orders" on public.orders for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admins read order items" on public.order_items for select to authenticated using (private.is_admin());

create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare new_order public.orders; line jsonb; product public.products; amount numeric(10,2) := 0;
begin
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products where id = (line->>'product_id')::uuid and active = true for update;
    if product.id is null or product.stock < (line->>'quantity')::integer then raise exception 'Item indisponível'; end if;
    amount := amount + product.price * (line->>'quantity')::integer;
  end loop;
  insert into public.orders(customer_name,room_number,scheduled_for,payment_method,status,total)
  values(payload->>'customer_name',payload->>'room_number',nullif(payload->>'scheduled_for','')::timestamptz,payload->>'payment_method',case when payload->>'scheduled_for' is null then 'new' else 'scheduled' end,amount) returning * into new_order;
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products where id = (line->>'product_id')::uuid for update;
    insert into public.order_items(order_id,product_id,title_snapshot,unit_price,quantity,extras) values(new_order.id,product.id,product.title,product.price,(line->>'quantity')::integer,coalesce(line->'extras','[]'::jsonb));
    update public.products set stock = stock - (line->>'quantity')::integer, updated_at = now() where id = product.id;
  end loop;
  return jsonb_build_object('id',new_order.id,'order_number',new_order.order_number,'total',new_order.total,'status',new_order.status);
end $$;
revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
create policy "public reads product images" on storage.objects for select to anon, authenticated using (bucket_id = 'product-images');
create policy "admins upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and private.is_admin());
create policy "admins update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and private.is_admin()) with check (bucket_id = 'product-images' and private.is_admin());
create policy "admins delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and private.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select on public.admin_users to authenticated;
