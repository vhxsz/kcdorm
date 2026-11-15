import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500),
  price: z.number().positive().max(10000),
  cost_price: z.number().min(0).max(10000).default(0),
  stock: z.number().int().min(0).max(10000),
  weight_grams: z.number().int().positive().max(100000).optional().nullable(),
  measure_value: z.number().int().positive().max(100000).optional().nullable(),
  measure_unit: z.enum(["g", "ml"]).default("g"),
  delivery_minutes: z.number().int().min(1).max(240),
  image_url: z.string().url().optional().nullable(),
  category: z.string().min(2).max(50).default("Pizzas"),
  category_id: z.string().uuid().optional().nullable(),
  featured: z.boolean().default(false),
  extras: z
    .array(z.object({ name: z.string(), price: z.number().min(0), image_url: z.string().max(600).optional().nullable() }))
    .default([]),
  variants: z.array(z.object({
    name: z.string().min(1).max(80),
    price: z.number().min(0),
    measure_value: z.number().int().positive().optional().nullable(),
    measure_unit: z.enum(["g", "ml"]).optional().nullable(),
    image_url: z.string().max(600).optional().nullable(),
  })).default([]),
});

export async function GET(request: Request) {
  try {
    const slug = new URL(request.url).searchParams.get("business");
    const admin = slug ? null : await requireAdmin(request);
    if (!slug && !admin)
      return NextResponse.json({ error: "Business is required" }, { status: 400 });
    const supabase = createAdminClient();
    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id,name,slug")
      .eq(slug ? "slug" : "id", slug || admin!.businessId)
      .eq("active", true)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business)
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    let { data, error } = await supabase
      .from("products")
      .select(
        "id,title,description,price,cost_price,stock,weight_grams,measure_value,measure_unit,delivery_minutes,image_url,category,category_id,featured,extras,variants,created_at",
      )
      .eq("business_id", business.id)
      .eq("active", true)
      .order("created_at");
    // Keep the current menu online between deploy and the measure/variant migration.
    if (error?.message.includes("measure_") || error?.message.includes("variants") || error?.message.includes("cost_price")) {
      const legacy = await supabase
        .from("products")
        .select("id,title,description,price,stock,weight_grams,delivery_minutes,image_url,category,extras")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("created_at");
      data = legacy.data?.map((product) => ({ ...product, cost_price: 0, measure_value: product.weight_grams, measure_unit: "g", variants: [], category_id: null, featured: false, created_at: null })) ?? null;
      error = legacy.error;
    }
    if (error) throw error;
    const [{ data: categories }, { data: soldItems }] = await Promise.all([
      supabase
        .from("product_categories")
        .select("id,name,slug,sort_order")
        .eq("business_id", business.id)
        .eq("active", true)
        .order("sort_order")
        .order("name"),
      supabase
        .from("order_items")
        .select("product_id,quantity,orders!inner(business_id,status,payment_status)")
        .eq("orders.business_id", business.id)
        .eq("orders.payment_status", "confirmed")
        .neq("orders.status", "cancelled"),
    ]);
    const sales = new Map<string, number>();
    for (const line of soldItems || [])
      sales.set(line.product_id, (sales.get(line.product_id) || 0) + Number(line.quantity || 0));
    const products = (data || []).map((product) => ({
      ...product,
      sales_count: sales.get(product.id) || 0,
    }));
    return NextResponse.json({ business, products, categories: categories || [] }, {
      headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json(
      { error: "The menu is temporarily unavailable" },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid product details", issues: parsed.error.flatten() },
      { status: 400 },
    );
  const supabase = createAdminClient();
  if (parsed.data.category_id) {
    const { data: category } = await supabase
      .from("product_categories")
      .select("id,name")
      .eq("id", parsed.data.category_id)
      .eq("business_id", admin.businessId)
      .maybeSingle();
    if (!category)
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    parsed.data.category = category.name;
  }
  const { data, error } = await supabase
    .from("products")
    .insert({ ...parsed.data, business_id: admin.businessId })
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productSchema
    .extend({ id: z.string().uuid() })
    .safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid product details", issues: parsed.error.flatten() },
      { status: 400 },
    );
  const { id, ...product } = parsed.data;
  const supabase = createAdminClient();
  if (product.category_id) {
    const { data: category } = await supabase
      .from("product_categories")
      .select("id,name")
      .eq("id", product.category_id)
      .eq("business_id", admin.businessId)
      .maybeSingle();
    if (!category)
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    product.category = category.name;
  }
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .eq("business_id", admin.businessId)
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });

  // Soft deletion preserves references used by previous sales.
  const { error } = await createAdminClient()
    .from("products")
    .update({ active: false })
    .eq("id", id)
    .eq("business_id", admin.businessId);
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : new NextResponse(null, { status: 204 });
}
