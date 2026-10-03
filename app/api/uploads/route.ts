import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  if (
    !(file instanceof File) ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    return NextResponse.json(
      { error: "Choose a JPG, PNG, or WebP image up to 5 MB" },
      { status: 400 },
    );
  }
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${admin.businessId}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl }, { status: 201 });
}
