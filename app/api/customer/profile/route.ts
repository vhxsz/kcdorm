import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, requireUser } from "@/lib/supabase/admin";

const profileSchema = z.object({
  business_slug: z.string().trim().min(2).max(80),
  full_name: z.string().trim().min(2).max(80),
  room_number: z.string().trim().min(1).max(20),
});

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const slug = new URL(request.url).searchParams.get("business");
  if (!slug) return NextResponse.json({ error: "Business is required" }, { status: 400 });
  try {
    const db = createAdminClient();
    const { data: business, error: businessError } = await db.from("businesses")
      .select("id").eq("slug", slug).eq("active", true).maybeSingle();
    if (businessError) throw businessError;
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    const { data: profile, error } = await db.from("customer_profiles")
      .select("full_name,room_number").eq("business_id", business.id)
      .eq("user_id", user.id).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("customer_profile_read_failed", error);
    return NextResponse.json({ error: "Could not load your profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await requireUser(request);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please enter your name and room" }, { status: 400 });
  try {
    const db = createAdminClient();
    const { data: business, error: businessError } = await db.from("businesses")
      .select("id").eq("slug", parsed.data.business_slug).eq("active", true).maybeSingle();
    if (businessError) throw businessError;
    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    const { data, error } = await db.from("customer_profiles").upsert({
      business_id: business.id, user_id: user.id,
      full_name: parsed.data.full_name, room_number: parsed.data.room_number,
      updated_at: new Date().toISOString(),
    }, { onConflict: "business_id,user_id" }).select("full_name,room_number").single();
    if (error) throw error;
    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("customer_profile_save_failed", error);
    return NextResponse.json({ error: "Could not save your details" }, { status: 500 });
  }
}
