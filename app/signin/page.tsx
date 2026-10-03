"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Pizza } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";

export default function SignInPage() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function signIn(form: FormData) {
    setSubmitting(true);
    setMessage("");
    try {
      const supabase = createSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error || !data.session) throw new Error("Invalid email or password.");

      const response = await fetch("/api/account/business", {
        headers: { authorization: `Bearer ${data.session.access_token}` },
      });
      const business = (await response.json()) as { slug?: string; error?: string };
      if (!response.ok || !business.slug)
        throw new Error(business.error || "No business is linked to this account.");

      window.location.assign(`/${encodeURIComponent(business.slug)}`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "We could not sign you in.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f8fc] px-5 py-10 text-[#172039]">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="size-4" /> Back to homepage
        </Link>
        <form action={signIn} className="rounded-[30px] border bg-white p-8 shadow-xl">
          <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-[#2457ff] text-white">
            <Pizza />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Business sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#6d7893]">
            Sign in to open your business page and view your menu.
          </p>
          <div className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required className="h-12 rounded-xl" />
            </div>
            {message && <p className="text-sm font-bold text-red-600">{message}</p>}
            <Button disabled={submitting} type="submit" className="h-12 w-full rounded-xl bg-[#2457ff] font-bold">
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
