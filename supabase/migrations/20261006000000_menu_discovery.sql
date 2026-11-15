create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, slug)
);

alter table public.product_categories enable row level security;

insert into public.product_categories (business_id, name, slug, sort_order)
select distinct
  business_id,
  category,
  trim(both '-' from regexp_replace(lower(category), '[^a-z0-9]+', '-', 'g')),
  case category
    when 'Pizzas' then 10
    when 'Snacks' then 20
    when 'Sides' then 30
    when 'Drinks' then 40
    else 100
  end
from public.products
where category is not null and char_length(trim(category)) >= 2
on conflict (business_id, slug) do nothing;

alter table public.products
  add column if not exists category_id uuid references public.product_categories(id) on delete set null,
  add column if not exists featured boolean not null default false;

update public.products p
set category_id = c.id
from public.product_categories c
where c.business_id = p.business_id
  and lower(c.name) = lower(p.category)
  and p.category_id is null;

create index if not exists idx_product_categories_business
  on public.product_categories (business_id, active, sort_order, name);
create index if not exists idx_products_category
  on public.products (category_id, active, created_at desc);

create policy "public reads active product categories" on public.product_categories
  for select to anon, authenticated
  using (active = true or business_id = private.current_business_id());
create policy "business admins insert product categories" on public.product_categories
  for insert to authenticated
  with check (business_id = private.current_business_id());
create policy "business admins update product categories" on public.product_categories
  for update to authenticated
  using (business_id = private.current_business_id())
  with check (business_id = private.current_business_id());
create policy "business admins delete product categories" on public.product_categories
  for delete to authenticated
  using (business_id = private.current_business_id());

grant select on public.product_categories to anon, authenticated;
grant insert, update, delete on public.product_categories to authenticated;
