import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(
      "id,order_number,customer_name,room_number,payment_method,status,total,scheduled_for,created_at,order_items(title_snapshot,quantity,unit_price,extras)",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing sale ID" }, { status: 400 });
  const { error } = await createAdminClient()
    .from("orders")
    .delete()
    .eq("id", id);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ deleted: true });
}
