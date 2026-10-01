-- Adds sale deletion and server-side pricing for selected extras to existing projects.
drop policy if exists "admins delete orders" on public.orders;
create policy "admins delete orders" on public.orders for delete to authenticated using (private.is_admin());
grant delete on public.orders to authenticated;

create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare new_order public.orders; line jsonb; product public.products; amount numeric(10,2) := 0;
begin
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products where id = (line->>'product_id')::uuid and active = true for update;
    if product.id is null or product.stock < (line->>'quantity')::integer then raise exception 'Item unavailable'; end if;
    amount := amount + (product.price + coalesce((
      select sum((extra->>'price')::numeric)
      from jsonb_array_elements(product.extras) extra
      where extra->>'name' in (select jsonb_array_elements_text(coalesce(line->'extras','[]'::jsonb)))
    ),0)) * (line->>'quantity')::integer;
  end loop;
  insert into public.orders(customer_name,room_number,scheduled_for,payment_method,status,total)
  values(payload->>'customer_name',payload->>'room_number',nullif(payload->>'scheduled_for','')::timestamptz,payload->>'payment_method',case when payload->>'scheduled_for' is null then 'new' else 'scheduled' end,amount) returning * into new_order;
  for line in select * from jsonb_array_elements(payload->'items') loop
    select * into product from public.products where id = (line->>'product_id')::uuid for update;
    insert into public.order_items(order_id,product_id,title_snapshot,unit_price,quantity,extras)
    values(new_order.id,product.id,product.title,product.price,(line->>'quantity')::integer,coalesce(line->'extras','[]'::jsonb));
    update public.products set stock = stock - (line->>'quantity')::integer, updated_at = now() where id = product.id;
  end loop;
  return jsonb_build_object('id',new_order.id,'order_number',new_order.order_number,'total',new_order.total,'status',new_order.status);
end $$;
revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;
