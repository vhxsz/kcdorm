import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const registrationSchema = z.object({
  business_name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  email: z.string().email().max(200),
  password: z.string().min(8).max(100),
  owner_code: z.string().min(1).max(200),
  telegram_bot_token: z.string().trim().min(20).max(200),
  telegram_chat_id: z.string().trim().min(1).max(100),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Please review the registration details.", issues: parsed.error.flatten() },
      { status: 400 },
    );

  const expectedCode = process.env.ADMIN_REGISTRATION_CODE;
  if (!expectedCode || parsed.data.owner_code !== expectedCode)
    return NextResponse.json(
      { error: "Invalid authorization code." },
      { status: 403 },
    );

  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", parsed.data.slug)
    .maybeSingle();
  if (existing)
    return NextResponse.json(
      { error: "This store address is already in use." },
      { status: 409 },
    );

  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { business_name: parsed.data.business_name },
    });
  if (authError || !authData.user)
    return NextResponse.json(
      { error: authError?.message || "We could not create the user." },
      { status: 400 },
    );

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .insert({
      name: parsed.data.business_name,
      slug: parsed.data.slug,
      telegram_bot_token: parsed.data.telegram_bot_token,
      telegram_chat_id: parsed.data.telegram_chat_id,
    })
    .select("id,name,slug")
    .single();

  if (businessError || !business) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: businessError?.message || "We could not create the business." },
      { status: 500 },
    );
  }

  const { error: membershipError } = await supabase
    .from("admin_users")
    .insert({ user_id: authData.user.id, business_id: business.id });
  if (membershipError) {
    await supabase.from("businesses").delete().eq("id", business.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json(
      { error: "We could not link the administrator to the business." },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { business, admin_url: "/admin", store_url: `/?business=${business.slug}` },
    { status: 201 },
  );
}
