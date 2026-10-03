import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const orderSchema = z.object({
  business_slug: z.string().trim().min(2).max(80).optional(),
  customer_name: z.string().trim().min(2).max(80),
  room_number: z.string().trim().min(1).max(20),
  scheduled_for: z.string().datetime().nullable().optional(),
  payment_method: z.enum(["etransfer", "cash"]),
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
        extras: z.array(z.string().max(80)).default([]),
      }),
    )
    .min(1)
    .max(30),
});

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please review your order details" },
      { status: 400 },
    );
  try {
    const supabase = createAdminClient();
    const admin = parsed.data.business_slug
      ? null
      : await import("@/lib/supabase/admin").then(({ requireAdmin }) =>
          requireAdmin(request),
        );
    if (!parsed.data.business_slug && !admin)
      return NextResponse.json({ error: "Business is required" }, { status: 400 });
    let businessQuery = supabase
      .from("businesses")
      .select("id,name,telegram_bot_token,telegram_chat_id")
      .eq("active", true);
    businessQuery = parsed.data.business_slug
      ? businessQuery.eq("slug", parsed.data.business_slug)
      : businessQuery.eq("id", admin!.businessId);
    const { data: business, error: businessError } =
      await businessQuery.maybeSingle();
    if (businessError) throw businessError;
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    const { data: order, error } = await supabase.rpc("place_order", {
      payload: { ...parsed.data, business_id: business.id },
    });
    if (error) throw error;
    const token = business.telegram_bot_token,
      chatId = business.telegram_chat_id;
    if (token && chatId) {
      const { data: orderItems, error: orderItemsError } = await supabase
        .from("order_items")
        .select("title_snapshot,quantity,extras")
        .eq("order_id", order.id);
      if (orderItemsError) throw orderItemsError;

      const when = parsed.data.scheduled_for
        ? new Date(parsed.data.scheduled_for).toLocaleString("en-CA", {
            timeZone: "America/Toronto",
          })
        : "As soon as possible";
      const itemLines = (orderItems ?? []).map((item) => {
        const extras = Array.isArray(item.extras)
          ? item.extras.filter(
              (extra): extra is string => typeof extra === "string",
            )
          : [];
        const extrasText = extras.length
          ? `\n   + ${extras.join(", ")}`
          : "";
        return `• ${item.quantity}× ${item.title_snapshot}${extrasText}`;
      });
      const text = `🔔 New order #${order.order_number}\n👤 ${parsed.data.customer_name} · Room ${parsed.data.room_number}\n\n🍽️ Order\n${itemLines.join("\n")}\n\n🕒 ${when}\n💳 ${parsed.data.payment_method === "cash" ? "Cash" : "Interac e-Transfer"}\n💰 $${Number(order.total).toFixed(2)} CAD`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
    }
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("order_create_failed", error);
    return NextResponse.json(
      { error: "We could not place your order. Please try again." },
      { status: 500 },
    );
  }
}
