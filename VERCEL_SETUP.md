# Vercel + Supabase setup

1. Run `supabase/migrations/20261001000000_room_service.sql` in the Supabase SQL Editor.
2. Create the administrator's email and password under Authentication > Users.
3. Run `supabase/set-admin-email.sql` to make `vitorheniqueamaral@gmail.com` an administrator.
4. Run `supabase/migrations/20261002000000_multi_business.sql`.
5. Run `supabase/migrations/20261003000000_principal_business.sql` to assign
   the original administrator, products, and orders to `/main`.
6. Run `supabase/migrations/20261003010000_product_measure.sql` to add product
   units and variants.
7. Run `supabase/migrations/20261004000000_finance.sql` to add product costs,
   payment confirmations, and bank or cash accounts. Existing orders start as
   pending; finance totals include them only after an administrator confirms
   payment. Historical costs use current product costs as an estimate.
8. Add the variables listed in `.env.example` to Vercel. Generate a long,
   random value for `ADMIN_REGISTRATION_CODE` and only share it with approved
   businesses.
9. Deploy using the **Next.js** framework preset.

New businesses register at `/signup`; the admin panel is at `/admin`. Telegram
credentials now belong to each business and are entered during registration.

Use the publishable key in the browser and the secret key only in `SUPABASE_SECRET_KEY`. Never prefix the secret key with `NEXT_PUBLIC_`.
