import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") || 30)));
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);
  const supabase = createAdminClient();
  const [{ data: confirmedOrders, error }, { data: pendingOrders, error: pendingError }, { data: accounts, error: accountsError }] = await Promise.all([
    supabase.from("orders").select("id,order_number,customer_name,total,cost_total,payment_method,payment_status,created_at,confirmed_at,bank_account_id").eq("business_id", admin.businessId).eq("payment_status", "confirmed").gte("confirmed_at", since.toISOString()).order("confirmed_at", { ascending: false }),
    supabase.from("orders").select("id,order_number,customer_name,total,cost_total,payment_method,payment_status,created_at,confirmed_at,bank_account_id").eq("business_id", admin.businessId).eq("payment_status", "pending").order("created_at", { ascending: false }).limit(200),
    supabase.from("bank_accounts").select("id,name,type,active").eq("business_id", admin.businessId).eq("active", true).order("created_at"),
  ]);
  if (error || pendingError || accountsError) return NextResponse.json({ error: error?.message || pendingError?.message || accountsError?.message }, { status: 500 });
  const confirmed = confirmedOrders || [];
  const revenue = confirmed.reduce((sum, order) => sum + Number(order.total), 0);
  const costs = confirmed.reduce((sum, order) => sum + Number(order.cost_total || 0), 0);
  const daily = new Map<string, { date: string; revenue: number; profit: number }>();
  for (const order of confirmed) {
    const date = String(order.confirmed_at || order.created_at).slice(0, 10);
    const entry = daily.get(date) || { date, revenue: 0, profit: 0 };
    entry.revenue += Number(order.total);
    entry.profit += Number(order.total) - Number(order.cost_total || 0);
    daily.set(date, entry);
  }
  return NextResponse.json({
    summary: { revenue, costs, profit: revenue - costs, margin: revenue ? ((revenue - costs) / revenue) * 100 : 0, confirmed_sales: confirmed.length },
    daily: Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date)),
    pending: pendingOrders || [],
    accounts,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ name: z.string().trim().min(2).max(80), type: z.enum(["bank", "cash"]) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid account" }, { status: 400 });
  const { data, error } = await createAdminClient().from("bank_accounts").insert({ ...parsed.data, business_id: admin.businessId }).select("id,name,type,active").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ order_id: z.string().uuid(), bank_account_id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Select a payment account" }, { status: 400 });
  const supabase = createAdminClient();
  const { data: account } = await supabase.from("bank_accounts").select("id").eq("id", parsed.data.bank_account_id).eq("business_id", admin.businessId).eq("active", true).maybeSingle();
  if (!account) return NextResponse.json({ error: "Invalid payment account" }, { status: 400 });
  const { data, error } = await supabase.from("orders").update({ payment_status: "confirmed", confirmed_at: new Date().toISOString(), confirmed_by: admin.user.id, bank_account_id: account.id }).eq("id", parsed.data.order_id).eq("business_id", admin.businessId).eq("payment_status", "pending").neq("status", "cancelled").select("id").single();
  return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json(data);
}
