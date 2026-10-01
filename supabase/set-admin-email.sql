-- Execute depois de criar o usuário em Authentication > Users.
-- O comando procura o usuário pelo e-mail e registra seu UUID como administrador.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('vitorheniqueamaral@gmail.com')
on conflict (user_id) do nothing;

-- Confirmação: deve retornar exatamente uma linha.
select au.user_id, u.email, au.created_at
from public.admin_users au
join auth.users u on u.id = au.user_id
where lower(u.email) = lower('vitorheniqueamaral@gmail.com');
