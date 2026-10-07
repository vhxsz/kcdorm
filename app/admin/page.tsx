"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminPanel, type MenuItem } from "../page";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";

export default function AdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [configurationMissing, setConfigurationMissing] = useState(false);
  const [productsError, setProductsError] = useState("");

  const loadProducts = useCallback(async () => {
    let supabase;
    try {
      supabase = createSupabaseClient();
    } catch {
      setConfigurationMissing(true);
      return false;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setItems([]);
      setProductsError("");
      return false;
    }
    const response = await fetch("/api/products", {
      headers: { authorization: `Bearer ${data.session.access_token}` },
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => ({}))) as {
      products?: unknown;
      error?: string;
    };
    if (!response.ok) {
      setItems([]);
      setProductsError(
        response.status === 401
          ? "This Google account is not an administrator. Sign in with the business administrator account."
          : payload.error || "Menu and stock could not be loaded.",
      );
      return false;
    }
    const products = payload.products;
    setItems(
      (Array.isArray(products) ? products : []).map(
        (product: Record<string, unknown>, index: number) => ({
          ...(product as unknown as MenuItem),
          price: Number(product.price),
          time: Number(product.delivery_minutes),
          pos: ["20% 22%", "72% 78%", "84% 18%"][index % 3],
          tag: String(product.category || "Available"),
        }),
      ),
    );
    setProductsError("");
    return true;
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadProducts());
    const interval = window.setInterval(() => void loadProducts(), 15000);
    const refresh = () => void loadProducts();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [loadProducts]);

  if (configurationMissing)
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f8fc] px-5 text-[#172039]">
        <section className="w-full max-w-lg rounded-[28px] border bg-white p-8 shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#2457ff]">
            Local configuration
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Connect Supabase to access the dashboard
          </h1>
          <p className="mt-4 leading-relaxed text-[#6d7893]">
            Create a <code>.env.local</code> file and add your Supabase project URL, publishable key, and secret key. The homepage remains available without this connection.
          </p>
          <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-full bg-[#2457ff] px-6 font-bold text-white">
            Back to homepage
          </Link>
        </section>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#172039]">
      <AdminPanel
        items={items}
        onProductAdded={(item) => setItems((current) => [...current, item])}
        onProductUpdated={(item) =>
          setItems((current) =>
            current.map((existing) => (existing.id === item.id ? item : existing)),
          )
        }
        onProductDeleted={(id) =>
          setItems((current) => current.filter((item) => item.id !== id))
        }
        onRefreshProducts={loadProducts}
        productsError={productsError}
        onBack={() => window.location.assign("/")}
      />
    </main>
  );
}
