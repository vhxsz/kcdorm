# Vercel + Supabase setup

1. Run `supabase/migrations/20261001000000_room_service.sql` in the Supabase SQL Editor.
2. Create the administrator's email and password under Authentication > Users.
3. Run `supabase/set-admin-email.sql` to make `vitorheniqueamaral@gmail.com` an administrator.
4. Run `supabase/migrations/20261002000000_multi_business.sql`.
5. Add the four variables listed in `.env.example` to Vercel. Generate a long,
   random value for `ADMIN_REGISTRATION_CODE` and only share it with approved
   businesses.
6. Deploy using the **Next.js** framework preset.

New businesses register at `/signup`; the admin panel is at `/admin`. Telegram
credentials now belong to each business and are entered during registration.

Use the publishable key in the browser and the secret key only in `SUPABASE_SECRET_KEY`. Never prefix the secret key with `NEXT_PUBLIC_`.
