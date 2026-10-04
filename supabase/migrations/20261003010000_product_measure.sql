alter table public.products
add column if not exists measure_value integer
check (measure_value is null or measure_value > 0);

alter table public.products
add column if not exists measure_unit text not null default 'g'
check (measure_unit in ('g', 'ml'));

update public.products
set measure_value = weight_grams,
    measure_unit = 'g'
where measure_value is null and weight_grams is not null;

alter table public.products
add column if not exists variants jsonb not null default '[]'::jsonb;

create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  new_order public.orders;
  line jsonb;
  product public.products;
  selected_variant jsonb;
  saved_extras jsonb;
  amount numeric(10,2) := 0;
  requested_business uuid := (payload->>'business_id')::uuid;
begin
  if not exists (select 1 from public.businesses where id = requested_business and active = true) then
    raise exception 'Business unavailable';
  end if;
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products where id = (line->>'product_id')::uuid and business_id = requested_business and active = true for update;
    if product.id is null or product.stock < (line->>'quantity')::integer then raise exception 'Item unavailable'; end if;
    selected_variant := null;
    if nullif(line->>'variant','') is not null then
      select variant into selected_variant from jsonb_array_elements(product.variants) variant where variant->>'name' = line->>'variant' limit 1;
      if selected_variant is null then raise exception 'Invalid variant'; end if;
    end if;
    amount := amount + (
      product.price + coalesce((selected_variant->>'price')::numeric, 0) +
      coalesce((select sum((extra->>'price')::numeric) from jsonb_array_elements(product.extras) extra where extra->>'name' in (select jsonb_array_elements_text(coalesce(line->'extras','[]'::jsonb)))),0)
    ) * (line->>'quantity')::integer;
  end loop;
  insert into public.orders(business_id,customer_name,room_number,scheduled_for,payment_method,status,total)
  values(requested_business,payload->>'customer_name',payload->>'room_number',nullif(payload->>'scheduled_for','')::timestamptz,payload->>'payment_method',case when payload->>'scheduled_for' is null then 'new' else 'scheduled' end,amount) returning * into new_order;
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products where id = (line->>'product_id')::uuid and business_id = requested_business for update;
    saved_extras := coalesce(line->'extras','[]'::jsonb);
    if nullif(line->>'variant','') is not null then saved_extras := saved_extras || jsonb_build_array('Size: ' || (line->>'variant')); end if;
    insert into public.order_items(order_id,product_id,title_snapshot,unit_price,quantity,extras)
    values(new_order.id,product.id,product.title,product.price,(line->>'quantity')::integer,saved_extras);
    update public.products set stock = stock - (line->>'quantity')::integer, updated_at = now() where id = product.id and business_id = requested_business;
  end loop;
  return jsonb_build_object('id',new_order.id,'order_number',new_order.order_number,'total',new_order.total,'status',new_order.status);
end $$;
