"use client";

import { useEffect, useState } from "react";
import { AdminPanel, type MenuItem } from "../page";

export default function AdminPage() {
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((response) => (response.ok ? response.json() : []))
      .then((products: unknown) =>
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
        ),
      );
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#172039]">
      <AdminPanel
        items={items}
        onProductAdded={(item) => setItems((current) => [...current, item])}
        onBack={() => window.location.assign("/")}
      />
    </main>
  );
}
