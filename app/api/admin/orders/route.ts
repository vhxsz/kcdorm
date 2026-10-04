import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(
      "id,order_number,customer_name,room_number,payment_method,status,total,scheduled_for,created_at,order_items(title_snapshot,quantity,unit_price,extras)",
    )
    .eq("business_id", admin.businessId)
    .order("created_at", { ascending: false })
    .limit(100);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing sale ID" }, { status: 400 });
  const supabase = createAdminClient();
  const { data: sale, error: lookupError } = await supabase
    .from("orders")
    .select("payment_status")
    .eq("id", id)
    .eq("business_id", admin.businessId)
    .maybeSingle();
  if (lookupError)
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!sale)
    return NextResponse.json({ error: "Sale not found" }, { status: 404 });
  if (sale.payment_status === "confirmed")
    return NextResponse.json(
      { error: "Confirmed payments cannot be deleted." },
      { status: 409 },
    );
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id)
    .eq("business_id", admin.businessId)
    .eq("payment_status", "pending");
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json({ deleted: true });
}
