-- Normalizes existing installations so the original store is always /main.
-- Existing Telegram credentials remain in Vercel and are used as a server-side
-- fallback for this principal business.
insert into public.businesses (id, name, slug, active)
values (
  '00000000-0000-4000-8000-000000000001',
  'Pizza Next Door',
  'main',
  true
)
on conflict (id) do update
set name = excluded.name, slug = excluded.slug, active = true;

update public.admin_users
set business_id = '00000000-0000-4000-8000-000000000001'
where business_id is null;

update public.products
set business_id = '00000000-0000-4000-8000-000000000001'
where business_id is null;

update public.orders
set business_id = '00000000-0000-4000-8000-000000000001'
where business_id is null;
