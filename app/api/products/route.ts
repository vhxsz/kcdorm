import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const productSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().max(500),
  price: z.number().positive().max(10000),
  stock: z.number().int().min(0).max(10000),
  delivery_minutes: z.number().int().min(1).max(240),
  image_url: z.string().url().optional().nullable(),
  category: z.string().min(2).max(50).default("Pizzas"),
  extras: z
    .array(z.object({ name: z.string(), price: z.number().min(0) }))
    .default([]),
});

export async function GET() {
  try {
    const { data, error } = await createAdminClient()
      .from("products")
      .select(
        "id,title,description,price,stock,delivery_minutes,image_url,category,extras",
      )
      .eq("active", true)
      .order("created_at");
    if (error) throw error;
    return NextResponse.json(data, {
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
  if (!(await requireAdmin(request)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid product details", issues: parsed.error.flatten() },
      { status: 400 },
    );
  const { data, error } = await createAdminClient()
    .from("products")
    .insert(parsed.data)
    .select()
    .single();
  return error
    ? NextResponse.json({ error: error.message }, { status: 500 })
    : NextResponse.json(data, { status: 201 });
}
