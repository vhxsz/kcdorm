# Vercel + Supabase setup

1. Run `supabase/migrations/20261001000000_room_service.sql` in the Supabase SQL Editor.
2. Create the administrator's email and password under Authentication > Users.
3. Run `supabase/set-admin-email.sql` to make `luccagrings70@gmail.com` an administrator.
4. Add the five variables listed in `.env.example` to Vercel.
5. Deploy using the **Next.js** framework preset.

The admin panel is not linked from the public menu. Open `https://your-domain/admin` directly.

Use the publishable key in the browser and the secret key only in `SUPABASE_SECRET_KEY`. Never prefix the secret key with `NEXT_PUBLIC_`.
