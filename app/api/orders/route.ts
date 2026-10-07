import { NextResponse } from "next/server";
import { createAdminClient, requireUser } from "@/lib/supabase/admin";
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
        variant: z.string().max(80).optional().nullable(),
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
    const customer = parsed.data.business_slug ? await requireUser(request) : null;
    if (parsed.data.business_slug && !customer)
      return NextResponse.json({ error: "Sign in to place your order" }, { status: 401 });
    let businessQuery = supabase
      .from("businesses")
      .select("id,name,slug,telegram_bot_token,telegram_chat_id")
      .eq("active", true);
    businessQuery = parsed.data.business_slug
      ? businessQuery.eq("slug", parsed.data.business_slug)
      : businessQuery.eq("id", admin!.businessId);
    const { data: business, error: businessError } =
      await businessQuery.maybeSingle();
    if (businessError) throw businessError;
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    if (customer) {
      const { error: profileError } = await supabase.from("customer_profiles").upsert({
        business_id: business.id,
        user_id: customer.id,
        full_name: parsed.data.customer_name,
        room_number: parsed.data.room_number,
        updated_at: new Date().toISOString(),
      }, { onConflict: "business_id,user_id" });
      if (profileError) throw profileError;
    }
    const { data: order, error } = customer
      ? await supabase.rpc("place_customer_order", {
          payload: { ...parsed.data, business_id: business.id },
          customer_id: customer.id,
        })
      : await supabase.rpc("place_order", {
          payload: { ...parsed.data, business_id: business.id },
        });
    if (error) throw error;
    // The principal business keeps using the Telegram credentials already
    // configured in Vercel. Other businesses use their own saved credentials.
    const token =
        business.telegram_bot_token ||
        (business.slug === "main"
          ? process.env.TELEGRAM_BOT_TOKEN
          : null),
      chatId =
        business.telegram_chat_id ||
        (business.slug === "main"
          ? process.env.TELEGRAM_CHAT_ID
          : null);
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
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "";
    if (message.includes("Item unavailable")) {
      return NextResponse.json(
        { error: "One or more items are sold out or no longer have enough stock. Please update your cart." },
        { status: 409 },
      );
    }
    if (message.includes("Invalid variant")) {
      return NextResponse.json(
        { error: "A selected size or variant is no longer available. Please update your cart." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "We could not place your order. Please try again." },
      { status: 500 },
    );
  }
}
