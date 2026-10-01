import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const orderSchema = z.object({
  customer_name: z.string().trim().min(2).max(80), room_number: z.string().trim().min(1).max(20),
  scheduled_for: z.string().datetime().nullable().optional(), payment_method: z.enum(["etransfer", "cash"]),
  items: z.array(z.object({ product_id: z.string().uuid(), quantity: z.number().int().min(1).max(20), extras: z.array(z.string().max(80)).default([]) })).min(1).max(30),
});

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Confira os dados do pedido" }, { status: 400 });
  try {
    const supabase = createAdminClient();
    const { data: order, error } = await supabase.rpc("place_order", { payload: parsed.data });
    if (error) throw error;
    const token = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const when = parsed.data.scheduled_for ? new Date(parsed.data.scheduled_for).toLocaleString("pt-BR", { timeZone: "America/Toronto" }) : "O mais rápido possível";
      const text = `🔔 Novo pedido #${order.order_number}\n👤 ${parsed.data.customer_name} · Quarto ${parsed.data.room_number}\n🕒 ${when}\n💳 ${parsed.data.payment_method === "cash" ? "Dinheiro" : "e-Transfer"}\n💰 $${Number(order.total).toFixed(2)} CAD`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text }) });
    }
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("order_create_failed", error);
    return NextResponse.json({ error: "Não foi possível enviar o pedido. Tente novamente." }, { status: 500 });
  }
}
