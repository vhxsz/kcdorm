import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500),
  price: z.number().positive().max(10000),
  stock: z.number().int().min(0).max(10000),
  weight_grams: z.number().int().positive().max(100000).optional().nullable(),
  delivery_minutes: z.number().int().min(1).max(240),
  image_url: z.string().url().optional().nullable(),
  category: z.string().min(2).max(50).default("Pizzas"),
  extras: z
    .array(z.object({ name: z.string(), price: z.number().min(0) }))
    .default([]),
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
    const { data, error } = await createAdminClient()
      .from("products")
      .select(
        "id,title,description,price,stock,weight_grams,delivery_minutes,image_url,category,extras",
      )
      .eq("business_id", business.id)
      .eq("active", true)
      .order("created_at");
    if (error) throw error;
    return NextResponse.json({ business, products: data }, {
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
  const { data, error } = await createAdminClient()
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
  const { data, error } = await createAdminClient()
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
