alter table public.products
add column if not exists weight_grams integer
check (weight_grams is null or weight_grams > 0);
