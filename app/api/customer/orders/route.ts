import { NextResponse } from "next/server";
import { createAdminClient, requireUser } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const slug = new URL(request.url).searchParams.get("business");
  if (!slug) return NextResponse.json({ error: "Business is required" }, { status: 400 });
  try {
    const db = createAdminClient();
    const { data: business, error: businessError } = await db.from("businesses")
      .select("id").eq("slug", slug).eq("active", true).maybeSingle();
    if (businessError) throw businessError;
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    const { data: orders, error } = await db.from("orders")
      .select("id,order_number,total,status,payment_status,created_at,order_items(title_snapshot,quantity)")
      .eq("business_id", business.id).eq("customer_user_id", user.id)
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    let totalSpent = 0;
    let from = 0;
    while (true) {
      const { data: page, error: totalError } = await db.from("orders")
        .select("total").eq("business_id", business.id)
        .eq("customer_user_id", user.id).eq("payment_status", "confirmed")
        .range(from, from + 999);
      if (totalError) throw totalError;
      totalSpent += (page || []).reduce((sum, order) => sum + Number(order.total), 0);
      if (!page || page.length < 1000) break;
      from += 1000;
    }
    return NextResponse.json({ orders, total_spent: totalSpent });
  } catch (error) {
    console.error("customer_orders_read_failed", error);
    return NextResponse.json({ error: "Could not load your orders" }, { status: 500 });
  }
}
