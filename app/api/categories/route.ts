import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = categorySchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Enter a category name between 2 and 60 characters." }, { status: 400 });

  const slug = slugify(parsed.data.name);
  if (!slug)
    return NextResponse.json({ error: "The category name must contain letters or numbers." }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("product_categories")
    .insert({ business_id: admin.businessId, name: parsed.data.name, slug })
    .select("id,name,slug,sort_order")
    .single();

  return error
    ? NextResponse.json({ error: error.code === "23505" ? "This category already exists." : error.message }, { status: 400 })
    : NextResponse.json(data, { status: 201 });
}
