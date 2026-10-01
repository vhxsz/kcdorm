-- Run this after creating the user under Authentication > Users.
-- This finds the user by email and registers their UUID as an administrator.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('luccagrings70@gmail.com')
on conflict (user_id) do nothing;

-- Verification: this must return exactly one row.
select au.user_id, u.email, au.created_at
from public.admin_users au
join auth.users u on u.id = au.user_id
where lower(u.email) = lower('luccagrings70@gmail.com');
