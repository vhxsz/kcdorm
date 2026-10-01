# Configuração para Vercel + Supabase

1. No Supabase SQL Editor, execute `supabase/migrations/20261001000000_room_service.sql`.
2. Em Authentication > Users, crie o usuário administrador com e-mail e senha.
3. Para definir `vitorheniqueamaral@gmail.com` como administrador, execute `supabase/set-admin-email.sql`.
4. Na Vercel, configure as cinco variáveis listadas em `.env.example`.
5. Faça o deploy com o framework preset **Next.js**.

O painel não aparece no cardápio público. Acesse diretamente `https://seu-dominio/admin`.

Use a chave pública/publishable no navegador e a secret key somente em `SUPABASE_SECRET_KEY`. Nunca prefixe a chave secreta com `NEXT_PUBLIC_`.
