import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

type FinanceOrder = {
  id: string;
  order_number: number;
  customer_name: string;
  total: number;
  cost_total: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  confirmed_at: string | null;
  bank_account_id: string | null;
};

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get("days") || 30)));
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);
  const supabase = createAdminClient();
  const businessId = admin.businessId;
  async function readOrders(status: "confirmed" | "pending") {
    const result: FinanceOrder[] = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      let query = supabase.from("orders")
        .select("id,order_number,customer_name,total,cost_total,payment_method,payment_status,created_at,confirmed_at,bank_account_id")
        .eq("business_id", businessId)
        .eq("payment_status", status);
      if (status === "confirmed") query = query.gte("confirmed_at", since.toISOString());
      if (status === "pending") query = query.neq("status", "cancelled");
      const { data, error } = await query
        .order(status === "confirmed" ? "confirmed_at" : "created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      result.push(...((data || []) as FinanceOrder[]));
      if (!data || data.length < pageSize) return result;
    }
  }
  let confirmed: FinanceOrder[];
  let pending: FinanceOrder[];
  let accounts: Array<{ id: string; name: string; type: string; active: boolean }>;
  try {
    const [confirmedResult, pendingResult, accountsResult] = await Promise.all([
      readOrders("confirmed"),
      readOrders("pending"),
      supabase.from("bank_accounts").select("id,name,type,active").eq("business_id", admin.businessId).eq("active", true).order("created_at"),
    ]);
    if (accountsResult.error) throw accountsResult.error;
    confirmed = confirmedResult;
    pending = pendingResult;
    accounts = accountsResult.data || [];
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Finance data could not be loaded" }, { status: 500 });
  }
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
    pending,
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
  const { data, error } = await supabase.from("orders").update({ payment_status: "confirmed", confirmed_at: new Date().toISOString(), confirmed_by: admin.user.id, bank_account_id: account.id }).eq("id", parsed.data.order_id).eq("business_id", admin.businessId).eq("payment_status", "pending").neq("status", "cancelled").select("id").maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "This order is no longer awaiting payment." }, { status: 409 });
  return NextResponse.json(data);
}
