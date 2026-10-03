"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bot, Building2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [message, setMessage] = useState("");
  const [created, setCreated] = useState<{ store_url: string } | null>(null);

  async function register(form: FormData) {
    setMessage("Creating your account...");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    const result = (await response.json()) as { error?: string; store_url?: string };
    if (!response.ok) {
      setMessage(result.error || "We could not create your account.");
      return;
    }
    setCreated({ store_url: result.store_url || "/" });
    setMessage("Account created successfully.");
  }

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-5 py-10 text-[#172039]">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold">
          <ArrowLeft className="size-4" /> Back to homepage
        </Link>
        <form action={register} className="rounded-[32px] border bg-white p-7 shadow-xl md:p-10">
          <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#2457ff] text-white">
            <Building2 />
          </div>
          <h1 className="text-4xl font-black tracking-[-.05em]">Create a new business</h1>
          <p className="mt-2 text-[#6d7893]">
            Each account gets its own menu, orders, and Telegram integration.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="Business name" name="business_name" placeholder="Central Pizza" />
            <Field label="Store address" name="slug" placeholder="central-pizza" pattern="[a-z0-9-]+" />
            <Field label="Administrator email" name="email" type="email" placeholder="you@company.com" />
            <Field label="Password" name="password" type="password" minLength={8} placeholder="At least 8 characters" />
            <Field label="Telegram bot token" name="telegram_bot_token" placeholder="123456:ABC..." icon={<Bot className="size-4" />} />
            <Field label="Telegram chat ID" name="telegram_chat_id" placeholder="-100123456789" />
          </div>
          <div className="mt-5">
            <Field label="Platform owner authorization code" name="owner_code" type="password" placeholder="Code provided by the platform owner" icon={<KeyRound className="size-4" />} />
          </div>
          {message && <p className={`mt-5 text-sm font-bold ${created ? "text-green-700" : "text-[#6d7893]"}`}>{message}</p>}
          {created ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild className="h-12 rounded-xl bg-[#2457ff]"><a href="/admin">Sign in to dashboard</a></Button>
              <Button asChild variant="outline" className="h-12 rounded-xl"><a href={created.store_url}>Open my store</a></Button>
            </div>
          ) : (
            <Button type="submit" className="mt-7 h-12 w-full rounded-xl bg-[#2457ff] font-bold">Create account</Button>
          )}
        </form>
      </div>
    </main>
  );
}

function Field({ label, icon, ...props }: React.ComponentProps<typeof Input> & { label: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={String(props.name)}>{label}</Label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7893]">{icon}</span>}
        <Input {...props} id={String(props.name)} required className={`h-12 rounded-xl ${icon ? "pl-10" : ""}`} />
      </div>
    </div>
  );
}
