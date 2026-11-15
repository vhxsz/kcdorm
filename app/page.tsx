"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  BellRing,
  Clock3,
  CreditCard,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Minus,
  Package,
  Pizza,
  Plus,
  Send,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
  UtensilsCrossed,
  UserRound,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";
import { ProductCustomizer } from "@/components/product-customizer";

export type MenuItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  cost_price?: number;
  time: number;
  stock: number;
  weight_grams?: number | null;
  measure_value?: number | null;
  measure_unit?: "g" | "ml";
  pos: string;
  tag: string;
  image_url?: string | null;
  category?: string;
  category_id?: string | null;
  featured?: boolean;
  sales_count?: number;
  created_at?: string | null;
  extras?: { name: string; price: number; image_url?: string | null }[];
  variants?: { name: string; price: number; measure_value?: number | null; measure_unit?: "g" | "ml" | null; image_url?: string | null }[];
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

const demoProductImages: Record<string, string> = {
  "d0000000-0000-4000-8000-000000000001": "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000002": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000003": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000004": "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000005": "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000006": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000007": "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000008": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000009": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000010": "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000011": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000012": "https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000013": "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000014": "https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000015": "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000016": "https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000017": "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000018": "https://images.unsplash.com/photo-1527960471264-932f39eb5846?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000019": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=900&q=80",
  "d0000000-0000-4000-8000-000000000020": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80",
};

export const presentationMenu: MenuItem[] = [
  { id: "d0000000-0000-4000-8000-000000000001", title: "Classic Margherita", description: "Tomato, fior di latte, basil, and extra-virgin olive oil.", price: 16, time: 20, stock: 12, pos: "50% 48%", tag: "Pizzas", category: "Pizzas", featured: true, created_at: "2026-10-29T12:00:00Z",
    variants: [
      { name: "Margherita", price: 0, image_url: demoProductImages["d0000000-0000-4000-8000-000000000003"] },
      { name: "Pepperoni", price: 3, image_url: "/products/classic-pepperoni.png" },
      { name: "Chicken", price: 2, image_url: demoProductImages["d0000000-0000-4000-8000-000000000002"] },
    ],
    extras: [
      { name: "Extra cheese", price: 1.5, image_url: demoProductImages["d0000000-0000-4000-8000-000000000001"] },
      { name: "Fries", price: 3, image_url: demoProductImages["d0000000-0000-4000-8000-000000000008"] },
      { name: "Chicken nuggets", price: 4, image_url: demoProductImages["d0000000-0000-4000-8000-000000000006"] },
    ] },
  { id: "d0000000-0000-4000-8000-000000000002", title: "Pepperoni Hot Honey", description: "Cup-and-char pepperoni, mozzarella, tomato, and a touch of hot honey.", price: 19, time: 25, stock: 9, pos: "50% 52%", tag: "Pizzas", category: "Pizzas", featured: true, created_at: "2026-10-30T12:00:00Z" },
  { id: "d0000000-0000-4000-8000-000000000003", title: "Garden Veggie", description: "Roasted peppers, mushrooms, red onion, olives, and mozzarella.", price: 18, time: 22, stock: 7, pos: "50% 50%", tag: "Pizzas", category: "Pizzas", created_at: "2026-10-22T12:00:00Z" },
  { id: "d0000000-0000-4000-8000-000000000006", title: "Crispy Chicken Bites", description: "Golden chicken bites served with your choice of dipping sauce.", price: 12, time: 15, stock: 10, pos: "50% 50%", tag: "Snacks", category: "Snacks", created_at: "2026-10-27T12:00:00Z" },
  { id: "d0000000-0000-4000-8000-000000000008", title: "Sea Salt Fries", description: "Crispy skin-on fries finished with sea salt.", price: 7, time: 12, stock: 15, pos: "50% 50%", tag: "Sides", category: "Sides", created_at: "2026-10-20T12:00:00Z" },
  { id: "d0000000-0000-4000-8000-000000000014", title: "Kung Pao Chicken", description: "Wok-fired chicken, peppers, peanuts, and a savoury chilli sauce.", price: 17, time: 20, stock: 8, pos: "50% 50%", tag: "Chinese Food", category: "Chinese Food", featured: true, created_at: "2026-10-31T12:00:00Z" },
  { id: "d0000000-0000-4000-8000-000000000013", title: "Vegetable Fried Rice", description: "Jasmine rice, seasonal vegetables, egg, scallions, and soy.", price: 13, time: 16, stock: 11, pos: "50% 50%", tag: "Chinese Food", category: "Chinese Food", created_at: "2026-10-28T12:00:00Z" },
  { id: "d0000000-0000-4000-8000-000000000016", title: "Coca-Cola", description: "Chilled Coca-Cola to complete your order.", price: 3.5, time: 5, stock: 24, measure_value: 355, measure_unit: "ml", pos: "50% 50%", tag: "Drinks", category: "Drinks" },
];

export const presentationCategories: MenuCategory[] = [
  { id: "demo-pizzas", name: "Pizzas", slug: "pizzas", sort_order: 10 },
  { id: "demo-snacks", name: "Snacks", slug: "snacks", sort_order: 20 },
  { id: "demo-sides", name: "Sides", slug: "sides", sort_order: 30 },
  { id: "demo-chinese", name: "Chinese Food", slug: "chinese-food", sort_order: 40 },
  { id: "demo-drinks", name: "Drinks", slug: "drinks", sort_order: 50 },
];

function getProductImage(item: MenuItem) {
  return item.image_url || demoProductImages[item.id] || "/menu-food.jpg";
}

function getProductMeasure(item: MenuItem) {
  const value = item.measure_value ?? item.weight_grams;
  if (!value) return "";
  return ` · ${value} ${item.measure_unit || "g"}`;
}

function MenuProductCard({
  item,
  quantity,
  add,
  remove,
  open,
}: {
  item: MenuItem;
  quantity: number;
  add: (id: string) => void;
  remove: (id: string) => void;
  open: (item: MenuItem) => void;
}) {
  const soldOut = item.stock < 1;
  const options = (item.variants?.length || 0) + (item.extras?.length || 0);
  return (
    <article onClick={() => !soldOut && open(item)} className={`lgs-card ${soldOut ? "is-sold-out" : ""}`}>
      <img src={getProductImage(item)} alt="" style={{ objectPosition: item.pos }} />
      <span className="lgs-chip lgs-glass-dark lgs-card-time"><Clock3 className="size-3.5" /> {item.time} min{getProductMeasure(item)}</span>
      {(soldOut || item.stock <= 5) && <span className="lgs-chip lgs-glass-dark lgs-card-stock">{soldOut ? "Sold out" : `${item.stock} left`}</span>}
      <div className="lgs-slab lgs-glass-dark">
        <div className="lgs-slab-copy">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
        <div className="lgs-slab-row">
          <span className="lgs-price">${item.price.toFixed(2)}{options > 0 && <small>customisable</small>}</span>
          {quantity ? (
            <div className="lgs-stepper">
              <button onClick={(event) => { event.stopPropagation(); remove(item.id); }} aria-label={`Remove ${item.title}`}><Minus className="size-4" /></button>
              <b>{quantity}</b>
              <button onClick={(event) => { event.stopPropagation(); add(item.id); }} aria-label={`Add ${item.title}`}><Plus className="size-4" /></button>
            </div>
          ) : (
            <button
              className="lgs-add"
              disabled={soldOut}
              onClick={(event) => {
                event.stopPropagation();
                if (options > 0) open(item);
                else add(item.id);
              }}
              aria-label={soldOut ? `${item.title} is sold out` : `Add ${item.title}`}
            >
              <Plus className="size-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function MenuSection({
  id,
  title,
  description,
  items,
  cart,
  add,
  remove,
  open,
  emptyMessage,
  carousel = false,
}: {
  id?: string;
  title: string;
  description?: string;
  items: MenuItem[];
  cart: Record<string, number>;
  add: (id: string) => void;
  remove: (id: string) => void;
  open: (item: MenuItem) => void;
  emptyMessage?: string;
  carousel?: boolean;
}) {
  return (
    <section id={id} className="menu-discovery-section scroll-mt-32">
      <div className="menu-section-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
      </div>
      {items.length ? (
        <div className={`lgs-grid ${carousel ? "is-carousel" : ""}`}>
          {items.map((item) => <MenuProductCard key={`${title}-${item.id}`} item={item} quantity={cart[item.id] || 0} add={add} remove={remove} open={open} />)}
        </div>
      ) : (
        <p className="menu-section-empty">{emptyMessage || "No items are available in this section yet."}</p>
      )}
    </section>
  );
}

function parseVariants(value: string) {
  if (value.trim().startsWith("[")) {
    try { return JSON.parse(value); } catch { return []; }
  }
  return value.split("\n").map((line) => {
    const [name, price, measureValue, measureUnit] = line.split("|");
    return {
      name: name?.trim(),
      price: Number(price || 0),
      measure_value: measureValue ? Number(measureValue) : null,
      measure_unit: measureUnit?.trim().toLowerCase() === "ml" ? "ml" as const : "g" as const,
      image_url: null as string | null,
    };
  }).filter((variant) => variant.name && Number.isFinite(variant.price));
}

function parseExtras(value: string) {
  if (value.trim().startsWith("[")) {
    try { return JSON.parse(value); } catch { return []; }
  }
  return value.split("\n").map((line) => {
    const [name, price] = line.split("|");
    return { name: name?.trim(), price: Number(price) };
  }).filter((extra) => extra.name && Number.isFinite(extra.price));
}

// Uploads a reference image for a variant or an add-on and returns its public URL.
async function uploadReferenceImage(file: File) {
  const { data } = await createSupabaseClient().auth.getSession();
  if (!data.session) throw new Error("Sign in to upload images.");
  const upload = new FormData();
  upload.append("file", file);
  const response = await fetch("/api/uploads", {
    method: "POST",
    headers: { authorization: `Bearer ${data.session.access_token}` },
    body: upload,
  });
  const body = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !body.url) throw new Error(body.error || "The image could not be uploaded.");
  return body.url;
}

function ReferenceImageInput({ value, label, onChange }: { value?: string | null; label: string; onChange: (url: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="reference-image">
      <label className={busy ? "is-busy" : ""} title={error || label}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-label={label}
          disabled={busy}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setBusy(true);
            setError("");
            try { onChange(await uploadReferenceImage(file)); }
            catch (cause) { setError(cause instanceof Error ? cause.message : "The image could not be uploaded."); }
            finally { setBusy(false); }
          }}
        />
        {value ? <img src={value} alt="" /> : <ImagePlus className="size-4" aria-hidden="true" />}
      </label>
      {value && <button type="button" onClick={() => onChange(null)} aria-label="Remove image">Remove</button>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

function VariantEditor({ name, initial = [], drinks = false }: { name: string; initial?: NonNullable<MenuItem["variants"]>; drinks?: boolean }) {
  const [rows, setRows] = useState(initial);
  const update = (index: number, patch: Partial<NonNullable<MenuItem["variants"]>[number]>) =>
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <p className="text-xs text-[#6d7893]">Customers swipe between variants on the product. Give each one its own image to change what they see.</p>
      {rows.map((row, index) => (
        <div key={index} className="space-y-2 rounded-2xl border bg-[#f7f9fd] p-3">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <ReferenceImageInput label="Variant image" value={row.image_url} onChange={(url) => update(index, { image_url: url })} />
            <Input aria-label="Variant name" placeholder="e.g. Pepperoni" value={row.name} onChange={(event) => update(index, { name: event.target.value })} />
            <Button type="button" variant="ghost" aria-label="Remove variant" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4" /></Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input aria-label="Additional price" type="number" step="0.01" min="0" placeholder="+$0.00" value={row.price} onChange={(event) => update(index, { price: Number(event.target.value) })} />
            <Input aria-label="Amount" type="number" min="1" placeholder={drinks ? "355" : "450"} value={row.measure_value || ""} onChange={(event) => update(index, { measure_value: event.target.value ? Number(event.target.value) : null })} />
            <select aria-label="Unit" value={row.measure_unit || (drinks ? "ml" : "g")} onChange={(event) => update(index, { measure_unit: event.target.value as "g" | "ml" })} className="h-11 rounded-xl border bg-white px-2">
              {drinks && <option value="ml">mL</option>}<option value="g">grams</option>
            </select>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRows((current) => [...current, { name: "", price: 0, measure_value: null, measure_unit: drinks ? "ml" : "g", image_url: null }])}><Plus className="size-4" /> Add size or variant</Button>
    </div>
  );
}

function ExtraEditor({ name, initial = [] }: { name: string; initial?: NonNullable<MenuItem["extras"]> }) {
  const [rows, setRows] = useState(initial);
  const update = (index: number, patch: Partial<NonNullable<MenuItem["extras"]>[number]>) =>
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      <p className="text-xs text-[#6d7893]">The reference image appears on top of the product when a customer adds the extra. A PNG with a transparent background looks best.</p>
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[auto_1fr_90px_auto] items-center gap-2 rounded-2xl border bg-[#f7f9fd] p-3">
          <ReferenceImageInput label="Extra reference image" value={row.image_url} onChange={(url) => update(index, { image_url: url })} />
          <Input aria-label="Extra name" placeholder="e.g. Extra cheese" value={row.name} onChange={(event) => update(index, { name: event.target.value })} />
          <Input aria-label="Extra price" type="number" min="0" step="0.01" placeholder="$0.00" value={row.price} onChange={(event) => update(index, { price: Number(event.target.value) })} />
          <Button type="button" variant="ghost" aria-label="Remove extra" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRows((current) => [...current, { name: "", price: 0, image_url: null }])}><Plus className="size-4" /> Add extra</Button>
    </div>
  );
}
export default function Home() {
  return <Storefront businessSlug="main" />;
}

export function Storefront({ businessSlug }: { businessSlug: string }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [businessName, setBusinessName] = useState("");
  const [customer, setCustomer] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loadedCartKey, setLoadedCartKey] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartExtras, setCartExtras] = useState<Record<string, string[]>>({});
  const [cartVariants, setCartVariants] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [category, setCategory] = useState("All");
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        const extrasTotal = (item.extras || [])
          .filter((extra) => (cartExtras[item.id] || []).includes(extra.name))
          .reduce((value, extra) => value + Number(extra.price), 0);
        const variantPrice = Number((item.variants || []).find((variant) => variant.name === cartVariants[item.id])?.price || 0);
        return sum + (item.price + extrasTotal + variantPrice) * (cart[item.id] || 0);
      }, 0),
    [cart, cartExtras, cartVariants, items],
  );
  const add = (id: string) => {
    const availableStock = items.find((item) => item.id === id)?.stock ?? 0;
    if (availableStock < 1) return;
    setCart((current) => ({
      ...current,
      [id]: Math.min((current[id] || 0) + 1, availableStock),
    }));
  };
  const remove = (id: string) =>
    setCart((current) => ({
      ...current,
      [id]: Math.max(0, (current[id] || 0) - 1),
    }));
  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(
      context.registerTool(
        {
          name: "add_menu_item_to_cart",
          title: "Add menu item to cart",
          description: "Adds one available menu item to the visible cart.",
          inputSchema: {
            type: "object",
            properties: {
              itemId: { type: "string", enum: items.map((item) => item.id) },
            },
            required: ["itemId"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input: unknown) {
            const id = String((input as { itemId?: string })?.itemId || "");
            const item = items.find((candidate) => candidate.id === id);
            if (!item) throw new Error("Invalid item");
            add(id);
            return { itemId: id, title: item.title, status: "added" };
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  useEffect(() => {
    if (!businessSlug) return;
    fetch(`/api/products?business=${encodeURIComponent(businessSlug)}`)
      .then(async (r) =>
        r.ok
          ? ((await r.json()) as {
              business?: { name?: string };
              products?: Array<Record<string, unknown>>;
          categories?: MenuCategory[];
            })
          : Promise.reject(),
      )
      .then((data) => {
        setBusinessName(String(data.business?.name || businessSlug));
        if (Array.isArray(data.products))
          setItems(
            data.products.map((p: Record<string, unknown>, i: number) => ({
              ...p,
              price: Number(p.price),
              time: Number(p.delivery_minutes),
              pos: ["20% 22%", "72% 78%", "84% 18%"][i % 3],
              tag: String(p.category || "Available"),
            }) as unknown as MenuItem),
          );
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch(() => {
        if (businessSlug === "main") {
          setBusinessName("Pizza Next Door");
          setItems(presentationMenu);
          setCategories(presentationCategories);
        }
      });
  }, [businessSlug]);

  useEffect(() => {
    if (!businessSlug) return;
    const supabase = createSupabaseClient();
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) { setCustomer(data.user); setAuthReady(true); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) { setCustomer(session?.user || null); setAuthReady(true); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, [businessSlug]);

  useEffect(() => {
    if (!customer) return;
    const storageKey = `pizza-cart:${businessSlug}:${customer.id}`;
    let storedCart: Record<string, number> = {};
    let storedExtras: Record<string, string[]> = {};
    let storedVariants: Record<string, string> = {};
    try {
      const stored = JSON.parse(window.localStorage.getItem(storageKey) || "null") as {
        cart?: Record<string, number>;
        extras?: Record<string, string[]>;
        variants?: Record<string, string>;
      } | null;
      storedCart = stored?.cart && typeof stored.cart === "object" ? stored.cart : {};
      storedExtras = stored?.extras && typeof stored.extras === "object" ? stored.extras : {};
      storedVariants = stored?.variants && typeof stored.variants === "object" ? stored.variants : {};
    } catch { /* Ignore malformed local cart data. */ }
    const restore = window.setTimeout(() => {
      setCart(storedCart);
      setCartExtras(storedExtras);
      setCartVariants(storedVariants);
      setLoadedCartKey(storageKey);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [businessSlug, customer]);

  useEffect(() => {
    if (!loadedCartKey) return;
    window.localStorage.setItem(
      loadedCartKey,
      JSON.stringify({ cart, extras: cartExtras, variants: cartVariants }),
    );
  }, [cart, cartExtras, cartVariants, loadedCartKey]);

  const clearCart = () => {
    setCart({});
    setCartExtras({});
    setCartVariants({});
  };
  const signInCustomer = async () => {
    await createSupabaseClient().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(businessSlug === "main" ? "/" : `/${businessSlug}`)}`,
      },
    });
  };
  const visibleCategories = categories.length
    ? categories
    : Array.from(new Set(items.map((item) => item.category).filter(Boolean))).map((name, index) => ({
        id: `category-${index}`,
        name: String(name),
        slug: String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        sort_order: index,
      }));
  const bestSellers = [...items]
    .filter((item) => Number(item.sales_count || 0) > 0)
    .sort((a, b) => Number(b.sales_count || 0) - Number(a.sales_count || 0))
    .slice(0, 6);
  const newArrivals = [...items]
    .filter((item) => item.created_at)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
    .slice(0, 6);
  const featuredItems = items.filter((item) => item.featured).slice(0, 6);
  const openProduct = (item: MenuItem) => {
    if (item.stock < 1) return;
    setSelectedProduct(item);
  };
  const categoryNames = ["All", ...visibleCategories.map((entry) => entry.name)];
  const categoryBar = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const active = categoryBar.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (active) setLens({ left: active.offsetLeft, width: active.offsetWidth });
  }, [category, categoryNames.length, authReady]);

  if (!authReady) return <main className="lgs grid min-h-screen place-items-center">Loading your account...</main>;

  const name = businessName || "Pizza Next Door";
  return (
    <main className="lgs">
      <header className="lgs-nav lgs-glass-dark">
        <a href="#top" className="lgs-wordmark" aria-label={`${name} menu`}>
          <span><img src="/pizza-next-door-mark.png?v=2" alt="" aria-hidden="true" /></span>
          <b>{name}</b>
        </a>
        <div className="lgs-nav-actions">
          {customer ? (
            <>
              <CustomerOrders businessSlug={businessSlug} />
              <Button variant="ghost" aria-label="Sign out" className="h-11 rounded-full px-3 sm:px-4" onClick={() => void createSupabaseClient().auth.signOut()}><LogOut className="size-4" /><span className="hidden sm:inline">Sign out</span></Button>
            </>
          ) : (
            <Button variant="ghost" className="h-11 rounded-full px-3 sm:px-4" onClick={() => void signInCustomer()}>
              <UserRound className="size-4" /><span className="hidden sm:inline">Sign in</span>
            </Button>
          )}
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button className="lgs-cart h-11 rounded-full px-4">
                <ShoppingBag className="size-4" /> Cart <span>{count}</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="lg-dialog lg-sheet w-full p-0 sm:max-w-md">
              <Cart
                businessSlug={businessSlug}
                items={items}
                total={total}
                cart={cart}
                cartExtras={cartExtras}
                cartVariants={cartVariants}
                add={add}
                remove={remove}
                clearCart={clearCart}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <section id="top" className="lgs-hero">
        <img src="/menu-food.jpg" alt="Freshly baked pizzas and fries ready to serve" />
        <div className="lgs-hero-row">
          <div className="lgs-hero-copy lgs-glass-dark">
            <h1>
              <span style={{ animationDelay: ".15s" }}>Pizza</span> <span style={{ animationDelay: ".23s" }}>night,</span><br />
              <span style={{ animationDelay: ".34s" }}>without</span> <span style={{ animationDelay: ".42s" }}>the</span> <em style={{ animationDelay: ".5s" }}>wait.</em>
            </h1>
            <p>Oven-fresh favourites, sides, and drinks delivered in 15–30 minutes. No minimum order.</p>
            <a href="#menu" className="lgs-cta">Explore the menu</a>
          </div>
          <div className="lgs-hero-eta lgs-glass-dark">
            <small>Quick delivery</small>
            <b>15–30</b>
            <span>minutes to your door</span>
          </div>
        </div>
      </section>

      <section id="menu" className="lgs-menu">
        <div className="lgs-menu-head">
          <h2>What are you in the mood for?</h2>
          <div className="lgs-cats-scroll">
            <div className="lgs-cats lgs-glass-light" ref={categoryBar}>
              <i aria-hidden="true" style={{ transform: `translateX(${lens.left}px)`, width: lens.width }} />
              {categoryNames.map((entry) => (
                <button key={entry} aria-pressed={category === entry} onClick={() => setCategory(entry)}>{entry}</button>
              ))}
            </div>
          </div>
        </div>
        {category === "All" ? (
          <div className="menu-discovery">
            <MenuSection title="Best sellers" description="Ranked by confirmed customer orders." items={bestSellers} cart={cart} add={add} remove={remove} open={openProduct} emptyMessage="Best sellers will appear after the first confirmed orders." carousel />
            <MenuSection title="New arrivals" description="The latest additions to the menu." items={newArrivals} cart={cart} add={add} remove={remove} open={openProduct} carousel />
            {featuredItems.length > 0 && <MenuSection title="Featured today" description="Selected by the kitchen." items={featuredItems} cart={cart} add={add} remove={remove} open={openProduct} carousel />}
            {visibleCategories.map((entry) => (
              <MenuSection key={entry.id} id={entry.slug} title={entry.name} items={items.filter((item) => item.category_id ? item.category_id === entry.id : item.category === entry.name)} cart={cart} add={add} remove={remove} open={openProduct} />
            ))}
          </div>
        ) : (
          <MenuSection title={category} items={items.filter((item) => item.category === category)} cart={cart} add={add} remove={remove} open={openProduct} />
        )}
      </section>

      {selectedProduct && (
        <ProductCustomizer
          key={selectedProduct.id}
          item={selectedProduct}
          image={getProductImage(selectedProduct)}
          initialVariant={cartVariants[selectedProduct.id] || selectedProduct.variants?.[0]?.name || ""}
          initialExtras={cartExtras[selectedProduct.id] || []}
          onClose={() => setSelectedProduct(null)}
          onAdd={(variant, extras) => {
            setCartExtras((current) => ({ ...current, [selectedProduct.id]: extras }));
            setCartVariants((current) => ({ ...current, [selectedProduct.id]: variant }));
            add(selectedProduct.id);
            setSelectedProduct(null);
          }}
        />
      )}

      {count > 0 && !selectedProduct && (
        <button
          type="button"
          aria-label={`Open cart with ${count} ${count === 1 ? "item" : "items"}`}
          onClick={() => setCartOpen(true)}
          className="lgs-dock lgs-glass-dark"
        >
          <span>{count} {count === 1 ? "item" : "items"}</span>
          <b>${total.toFixed(2)}</b>
          <em>View cart</em>
        </button>
      )}
    </main>
  );
}

function Cart({
  businessSlug,
  items,
  total,
  cart,
  cartExtras,
  cartVariants,
  add,
  remove,
  clearCart,
}: {
  businessSlug: string;
  items: MenuItem[];
  total: number;
  cart: Record<string, number>;
  cartExtras: Record<string, string[]>;
  cartVariants: Record<string, string>;
  add: (id: string) => void;
  remove: (id: string) => void;
  clearCart: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-white">
      <SheetHeader className="border-b border-[#e4e9f2] p-6">
        <SheetTitle className="text-2xl font-black tracking-tight">
          Your order
        </SheetTitle>
      </SheetHeader>
      <div className="flex-1 space-y-5 overflow-auto p-6">
        {total === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div>
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-[#edf1ff]">
                <ShoppingBag className="text-[#2457ff]" />
              </div>
              <p className="font-bold">Your cart is empty</p>
              <p className="mt-1 text-sm text-[#6d7893]">
                Add something delicious from the menu.
              </p>
            </div>
          </div>
        ) : (
          items
            .filter((i) => cart[i.id])
            .map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="size-20 overflow-hidden rounded-2xl">
                  <img
                    src={getProductImage(item)}
                    alt=""
                    className="h-full w-full scale-[1.4] object-cover"
                    style={{ objectPosition: item.pos }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{item.title}</p>
                  <p className="text-sm text-[#6d7893]">
                    ${item.price.toFixed(2)}
                  </p>
                  {(cartExtras[item.id] || []).length > 0 && (
                    <p className="text-xs text-[#2457ff]">
                      + {cartExtras[item.id].join(", ")}
                    </p>
                  )}
                  {cartVariants[item.id] && <p className="text-xs font-bold text-[#6d7893]">{cartVariants[item.id]}</p>}
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      onClick={() => remove(item.id)}
                      className="grid size-7 place-items-center rounded-full border"
                    >
                      <Minus className="size-3" />
                    </button>
                    <b>{cart[item.id]}</b>
                    <button
                      onClick={() => add(item.id)}
                      className="grid size-7 place-items-center rounded-full bg-[#2457ff] text-white"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </div>
                <b>${(item.price * cart[item.id]).toFixed(2)}</b>
              </div>
            ))
        )}
      </div>
      {total > 0 && (
        <div className="border-t border-[#e4e9f2] p-6">
          <div className="mb-4 flex justify-between text-lg">
            <span>Total</span>
            <b className="text-2xl">${total.toFixed(2)} CAD</b>
          </div>
          <Checkout
            businessSlug={businessSlug}
            items={items}
            cart={cart}
            cartExtras={cartExtras}
            cartVariants={cartVariants}
            total={total}
            onOrderPlaced={clearCart}
          />
        </div>
      )}
    </div>
  );
}

type CustomerOrder = {
  id: string; order_number: number; total: number; status: string;
  payment_status: string; created_at: string;
  order_items?: { title_snapshot: string; quantity: number }[];
};

function CustomerOrders({ businessSlug }: { businessSlug: string }) {
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    let active = true;
    void (async () => {
      try {
        const { data } = await createSupabaseClient().auth.getSession();
        if (!data.session) throw new Error("Sign in required");
        const response = await fetch(`/api/customer/orders?business=${encodeURIComponent(businessSlug)}`, {
          headers: { authorization: `Bearer ${data.session.access_token}` }, cache: "no-store",
        });
        const body = (await response.json()) as { error?: string; orders?: CustomerOrder[]; total_spent?: number };
        if (!response.ok) throw new Error(body.error || "Could not load orders");
        if (active) { setOrders(body.orders || []); setTotalSpent(Number(body.total_spent || 0)); setError(""); }
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Could not load orders"); }
    })();
    return () => { active = false; };
  }, [open, businessSlug]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" className="h-11 rounded-full px-4"><UserRound className="size-4" /><span className="hidden sm:inline">My orders</span></Button></DialogTrigger>
      <DialogContent className="lg-dialog max-h-[90vh] overflow-auto rounded-[28px] sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-2xl font-black">My orders</DialogTitle></DialogHeader>
        <div className="rounded-2xl bg-[#edf1ff] p-5"><p className="text-sm text-[#59647e]">Total spent on confirmed orders</p><p className="text-3xl font-black">${totalSpent.toFixed(2)} CAD</p></div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {!error && orders.length === 0 && <p className="py-5 text-center text-sm text-[#6d7893]">No orders yet.</p>}
        <div className="space-y-3">
          {orders.map((order) => <div key={order.id} className="rounded-2xl border border-[#dfe5f1] p-4">
            <div className="flex justify-between gap-3"><div><b>Order #{order.order_number}</b><p className="text-xs text-[#6d7893]">{new Date(order.created_at).toLocaleString("en-CA")}</p></div><b>${Number(order.total).toFixed(2)}</b></div>
            <p className="mt-2 text-xs font-bold text-[#2457ff]">{order.status} · Payment {order.payment_status}</p>
            <p className="mt-2 text-sm text-[#59647e]">{(order.order_items || []).map((item) => `${item.quantity}× ${item.title_snapshot}`).join(", ")}</p>
          </div>)}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Checkout({
  businessSlug,
  items,
  cart,
  cartExtras,
  cartVariants,
  total,
  onOrderPlaced,
}: {
  businessSlug: string;
  items: MenuItem[];
  cart: Record<string, number>;
  cartExtras: Record<string, string[]>;
  cartVariants: Record<string, string>;
  total: number;
  onOrderPlaced: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<{ full_name: string; room_number: string } | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data } = await createSupabaseClient().auth.getSession();
        if (!data.session) return;
        const response = await fetch(`/api/customer/profile?business=${encodeURIComponent(businessSlug)}`, {
          headers: { authorization: `Bearer ${data.session.access_token}` }, cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as { profile?: { full_name: string; room_number: string } | null };
        if (active) setProfile(body.profile || null);
      } catch { /* New customers can still enter delivery details at checkout. */ }
      finally { if (active) setProfileReady(true); }
    })();
    return () => { active = false; };
  }, [businessSlug]);
  async function submit(form: FormData) {
    setError("");
    const { data: sessionData } = await createSupabaseClient().auth.getSession();
    if (!sessionData.session) { setError("Please sign in again to place your order."); return; }
    const body = {
      business_slug: businessSlug,
      customer_name: profile && !editingDetails ? profile.full_name : form.get("name"),
      room_number: profile && !editingDetails ? profile.room_number : form.get("room"),
      scheduled_for: null,
      payment_method: form.get("payment"),
      items: items
        .filter((i) => cart[i.id])
        .map((i) => ({
          product_id: i.id,
          quantity: cart[i.id],
          extras: cartExtras[i.id] || [],
          variant: cartVariants[i.id] || null,
        })),
    };
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessionData.session.access_token}` },
      body: JSON.stringify(body),
    });
    const data = (await response.json()) as {
      error?: string;
      order_number?: string | number;
    };
    if (!response.ok) {
      setError(data.error || "Could not place your order");
      return;
    }
    setOrderNumber(String(data.order_number));
    setProfile({ full_name: String(body.customer_name), room_number: String(body.room_number) });
    setEditingDetails(false);
    setSent(true);
  }
  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && sent) {
      onOrderPlaced();
      setSent(false);
      setOrderNumber("");
    }
  }
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-13 w-full rounded-2xl bg-[#2457ff] text-base font-bold hover:bg-[#1744d4]">
          Continue to checkout
        </Button>
      </DialogTrigger>
      <DialogContent className="lg-dialog max-h-[92vh] overflow-auto rounded-[28px] sm:max-w-lg">
        {sent ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full bg-[#eaf8ed] text-3xl">
              ✓
            </div>
            <DialogTitle className="text-3xl font-black">
              Order received!
            </DialogTitle>
            <p className="mt-3 text-[#6d7893]">
              The kitchen has been notified on Telegram.
              <br />
              Your order will arrive at the selected time.
            </p>
            <div className="mx-auto mt-6 max-w-xs rounded-2xl bg-[#f3f6fb] p-4">
              <span className="text-sm text-[#6d7893]">Order number</span>
              <p className="text-2xl font-black">#{orderNumber}</p>
            </div>
            <Button type="button" className="mt-6 h-12 rounded-2xl bg-[#2457ff] px-8 font-bold" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <form action={submit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                Complete your order
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 pt-2">
              {profile && !editingDetails ? <div className="rounded-2xl bg-[#f3f6fb] p-4">
                <p className="text-sm font-bold">Delivery details</p>
                <p className="mt-1 text-sm text-[#59647e]">{profile.full_name} · Room {profile.room_number}</p>
                <button type="button" className="mt-2 text-sm font-bold text-[#2457ff]" onClick={() => setEditingDetails(true)}>Edit details</button>
              </div> : <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    required
                    name="name"
                    id="name"
                    placeholder="e.g. Alex"
                    defaultValue={profile?.full_name || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room number</Label>
                  <Input
                    required
                    name="room"
                    id="room"
                    placeholder="e.g. 407"
                    defaultValue={profile?.room_number || ""}
                  />
                </div>
              </div>}
              {!profileReady && <p className="text-sm text-[#6d7893]">Loading saved delivery details...</p>}
              <div className="space-y-2">
                <Label htmlFor="time">When would you like it?</Label>
                <select
                  id="time"
                  className="h-11 w-full rounded-xl border border-[#dfe5f1] bg-white px-3 text-sm"
                >
                  <option>As soon as possible · 25 min</option>
                </select>
              </div>
              <div className="space-y-3">
                <Label>Payment method</Label>
                <RadioGroup
                  name="payment"
                  defaultValue="etransfer"
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="etransfer"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"
                  >
                    <RadioGroupItem id="etransfer" value="etransfer" />
                    <b>Interac e-Transfer</b>
                  </Label>
                  <Label
                    htmlFor="cash"
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4"
                  >
                    <RadioGroupItem id="cash" value="cash" />
                    <b>Cash</b>
                  </Label>
                </RadioGroup>
              </div>
              <div className="flex justify-between rounded-2xl bg-[#f3f6fb] p-4 text-lg">
                <span>Total</span>
                <b>${total.toFixed(2)} CAD</b>
              </div>
              {error && (
                <p className="text-sm font-bold text-red-600">{error}</p>
              )}
              <Button
                type="submit"
                disabled={!profileReady}
                className="h-13 rounded-2xl bg-[#2457ff] text-base font-bold"
              >
                Place order
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AdminPanel({
  items,
  categories,
  onCategoryAdded,
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  onRefreshProducts,
  productsError,
  onBack,
  previewMode = false,
}: {
  items: MenuItem[];
  categories: MenuCategory[];
  onCategoryAdded: (category: MenuCategory) => void;
  onProductAdded: (item: MenuItem) => void;
  onProductUpdated: (item: MenuItem) => void;
  onProductDeleted: (id: string) => void;
  onRefreshProducts: () => Promise<boolean>;
  productsError: string;
  onBack: () => void;
  previewMode?: boolean;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const previewOrders = [
    { id: "preview-1", order_number: 1042, customer_name: "Jordan Lee", room_number: "312", total: 38.5, status: "preparing", payment_status: "confirmed" as const, created_at: "2026-10-31T18:42:00Z", order_items: [{ title_snapshot: "Pepperoni Hot Honey", quantity: 2 }] },
    { id: "preview-2", order_number: 1041, customer_name: "Sam Rivera", room_number: "Lobby", total: 17, status: "new", payment_status: "pending" as const, created_at: "2026-10-31T18:30:00Z", order_items: [{ title_snapshot: "Kung Pao Chicken", quantity: 1 }] },
    { id: "preview-3", order_number: 1040, customer_name: "Taylor Morgan", room_number: "208", total: 23, status: "ready", payment_status: "confirmed" as const, created_at: "2026-10-31T18:14:00Z", order_items: [{ title_snapshot: "Classic Margherita", quantity: 1 }, { title_snapshot: "Coca-Cola", quantity: 2 }] },
  ];
  const [orders, setOrders] = useState<
    Array<{
      id: string;
      order_number: number;
      customer_name: string;
      room_number: string;
      total: number;
      status: string;
      payment_status: "pending" | "confirmed";
      created_at: string;
      order_items?: Array<{ title_snapshot: string; quantity: number }>;
    }>
  >(previewMode ? previewOrders : []);
  const [createCategory, setCreateCategory] = useState("");
  const [createCostPrice, setCreateCostPrice] = useState("");
  const [createSellingPrice, setCreateSellingPrice] = useState("");
  const [adminSection, setAdminSection] = useState("orders");
  const activeCreateCategory = createCategory || categories[0]?.name || "Pizzas";
  useEffect(() => {
    if (previewMode) return;
    void (async () => {
      try {
        const { data } = await createSupabaseClient().auth.getSession();
        if (!data.session) {
          setAuthenticated(false);
          return;
        }
        const response = await fetch("/api/account/business", {
          headers: { authorization: `Bearer ${data.session.access_token}` },
          cache: "no-store",
        });
        setAuthenticated(response.ok);
        if (!response.ok)
          setLoginError("Sign in with the business administrator email and password.");
      } finally {
        setAuthChecked(true);
      }
    })();
  }, [previewMode]);
  async function login(form: FormData) {
    setLoginError("");
    try {
      const { data, error } = await createSupabaseClient().auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error || !data.session) throw error || new Error("Invalid email or password");
      const accessResponse = await fetch("/api/account/business", {
        headers: { authorization: `Bearer ${data.session.access_token}` },
        cache: "no-store",
      });
      if (!accessResponse.ok) {
        await createSupabaseClient().auth.signOut();
        throw new Error("This account is not linked to a business administrator.");
      }
      setAuthenticated(true);
      await Promise.all([onRefreshProducts(), loadOrders()]);
    } catch (error) {
      setAuthenticated(false);
      setLoginError(error instanceof Error ? error.message : "Invalid email or password");
    }
  }
  async function saveProduct(form: FormData) {
    setSaveMessage("Saving...");
    try {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error();
      let imageUrl: string | null = null;
      const image = form.get("image");
      if (image instanceof File && image.size) {
        const upload = new FormData();
        upload.append("file", image);
        const uploadResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { authorization: `Bearer ${data.session.access_token}` },
          body: upload,
        });
        const uploadData = (await uploadResponse.json()) as {
          url?: string;
          error?: string;
        };
        if (!uploadResponse.ok || !uploadData.url)
          throw new Error(uploadData.error || "The image could not be uploaded.");
        imageUrl = uploadData.url;
      }
      const extras = parseExtras(String(form.get("extras") || ""));
      const variants = parseVariants(String(form.get("variants") || ""));
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          title: String(form.get("title")),
          description: String(form.get("description")),
          price: Number(form.get("price")),
          cost_price: Number(form.get("cost_price") || 0),
          stock: Number(form.get("stock")),
          weight_grams: form.get("measure_unit") === "g" && form.get("measure_value")
            ? Number(form.get("measure_value"))
            : null,
          measure_value: form.get("measure_value")
            ? Number(form.get("measure_value"))
            : null,
          measure_unit: String(form.get("measure_unit") || "g"),
          delivery_minutes: Number(form.get("delivery_minutes")),
          category: String(form.get("category") || "Pizzas"),
          category_id: String(form.get("category_id") || "") || null,
          featured: form.get("featured") === "on",
          extras,
          variants,
          image_url: imageUrl,
        }),
      });
      const product = (await response.json()) as Record<string, unknown>;
      if (!response.ok) throw new Error();
      onProductAdded({
        ...(product as unknown as MenuItem),
        price: Number(product.price),
        time: Number(product.delivery_minutes),
        pos: "50% 50%",
        tag: String(product.category || "Available"),
      });
      setSaveMessage("Item published to the menu.");
      setCreateImagePreview("");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "We could not save this item.",
      );
    }
  }
  async function createMenuCategory(form: FormData) {
    setSaveMessage("Creating category...");
    try {
      const { data } = await createSupabaseClient().auth.getSession();
      if (!data.session) throw new Error("Your session has expired.");
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ name: String(form.get("name") || "") }),
      });
      const payload = (await response.json()) as MenuCategory & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The category could not be created.");
      onCategoryAdded(payload);
      setCreateCategory(payload.name);
      setSaveMessage(`${payload.name} is ready for products.`);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "The category could not be created.");
    }
  }
  async function loadOrders() {
    const { data } = await createSupabaseClient().auth.getSession();
    if (!data.session) return;
    const response = await fetch("/api/admin/orders", {
      headers: { authorization: `Bearer ${data.session.access_token}` },
    });
    const payload = await response.json().catch(() => null) as
      | Array<{
          id: string;
          order_number: number;
          customer_name: string;
          room_number: string;
          total: number;
          status: string;
          payment_status: "pending" | "confirmed";
          created_at: string;
          order_items?: Array<{ title_snapshot: string; quantity: number }>;
        }>
      | { error?: string }
      | null;
    if (response.ok) {
      setOrders(Array.isArray(payload) ? payload : []);
      setOrdersError("");
    } else {
      setOrdersError(
        response.status === 401
          ? "Administrator access is required to view orders."
          : String((payload && !Array.isArray(payload) ? payload.error : "") || "Orders could not be loaded."),
      );
    }
  }
  async function updateProduct(form: FormData) {
    if (!editingItem) return;
    setEditMessage("Saving...");
    try {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Your session has expired.");
      let imageUrl = editingItem.image_url || null;
      const image = form.get("image");
      if (image instanceof File && image.size) {
        const upload = new FormData();
        upload.append("file", image);
        const uploadResponse = await fetch("/api/uploads", {
          method: "POST",
          headers: { authorization: `Bearer ${data.session.access_token}` },
          body: upload,
        });
        const uploadData = (await uploadResponse.json()) as {
          url?: string;
          error?: string;
        };
        if (!uploadResponse.ok || !uploadData.url)
          throw new Error(uploadData.error || "The image could not be uploaded.");
        imageUrl = uploadData.url;
      }
      const extras = parseExtras(String(form.get("extras") || ""));
      const variants = parseVariants(String(form.get("variants") || ""));
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({
          id: editingItem.id,
          title: String(form.get("title")),
          description: String(form.get("description")),
          price: Number(form.get("price")),
          cost_price: Number(form.get("cost_price") || 0),
          stock: Number(form.get("stock")),
          weight_grams: form.get("measure_unit") === "g" && form.get("measure_value")
            ? Number(form.get("measure_value"))
            : null,
          measure_value: form.get("measure_value")
            ? Number(form.get("measure_value"))
            : null,
          measure_unit: String(form.get("measure_unit") || "g"),
          delivery_minutes: Number(form.get("delivery_minutes")),
          category: String(form.get("category") || "Pizzas"),
          category_id: String(form.get("category_id") || "") || null,
          featured: form.get("featured") === "on",
          extras,
          variants,
          image_url: imageUrl,
        }),
      });
      const product = (await response.json()) as Record<string, unknown>;
      if (!response.ok)
        throw new Error(String(product.error || "The item could not be saved."));
      onProductUpdated({
        ...(product as unknown as MenuItem),
        price: Number(product.price),
        time: Number(product.delivery_minutes),
        pos: editingItem.pos,
        tag: String(product.category || "Available"),
      });
      setEditImagePreview("");
      setEditingItem(null);
    } catch (error) {
      setEditMessage(
        error instanceof Error ? error.message : "The item could not be saved.",
      );
    }
  }
  async function deleteProduct(item: MenuItem) {
    if (!confirm(`Remove ${item.title} from the menu?`)) return;
    const { data } = await createSupabaseClient().auth.getSession();
    if (!data.session) return;
    const response = await fetch(`/api/products?id=${item.id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${data.session.access_token}` },
    });
    if (response.ok) onProductDeleted(item.id);
    else alert("The item could not be removed. Please try again.");
  }
  async function deleteOrder(id: string) {
    if (!confirm("Delete this sale permanently?")) return;
    const { data } = await createSupabaseClient().auth.getSession();
    if (!data.session) return;
    const response = await fetch(`/api/admin/orders?id=${id}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${data.session.access_token}` },
    });
    if (response.ok)
      setOrders((current) => current.filter((order) => order.id !== id));
  }
  async function recordSale(form: FormData) {
    const { data } = await createSupabaseClient().auth.getSession();
    if (!data.session) return;
    const productId = String(form.get("product"));
    const quantity = Number(form.get("quantity"));
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${data.session.access_token}`,
      },
      body: JSON.stringify({
        customer_name: String(form.get("customer") || "Walk-in"),
        room_number: String(form.get("room") || "Counter"),
        scheduled_for: null,
        payment_method: String(form.get("payment") || "cash"),
        items: [{ product_id: productId, quantity, extras: [] }],
      }),
    });
    const payload = await response.json().catch(() => ({})) as { error?: string };
    if (response.ok) {
      setOrdersError("");
      await Promise.all([loadOrders(), onRefreshProducts()]);
    } else {
      setOrdersError(String(payload.error || "The order could not be created."));
    }
  }
  useEffect(() => {
    if (previewMode || !authenticated) return;
    void loadOrders();
    const interval = window.setInterval(() => void loadOrders(), 15000);
    const refresh = () => void loadOrders();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [authenticated, previewMode]);
  if (!previewMode && !authChecked)
    return <section className="grid min-h-[75vh] place-items-center text-[#6d7893]">Checking administrator access...</section>;
  if (!previewMode && !authenticated)
    return (
      <section className="mx-auto grid min-h-[75vh] max-w-md place-items-center px-5">
        <form
          action={login}
          className="w-full rounded-[28px] border bg-white p-7 shadow-xl"
        >
          <div className="mb-6 grid size-14 place-items-center rounded-2xl bg-[#2457ff] text-white">
            <Settings2 />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Admin sign-in</h1>
          <p className="mt-2 text-sm text-[#6d7893]">
            Sign in with the administrator account created in Supabase.
          </p>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                required
                name="email"
                type="email"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                required
                name="password"
                type="password"
                autoComplete="current-password"
              />
            </div>
            {loginError && (
              <p className="text-sm font-bold text-red-600">{loginError}</p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#2457ff] font-bold"
            >
              Sign in
            </Button>
            <Button
              type="button"
              onClick={onBack}
              variant="ghost"
              className="w-full"
            >
              Back to menu
            </Button>
          </div>
        </form>
      </section>
    );
  const adminNavigation = [
    { value: "orders", label: "Orders", icon: LayoutDashboard },
    { value: "menu", label: "Menu & stock", icon: UtensilsCrossed },
    { value: "finance", label: "Finance", icon: CreditCard },
    { value: "settings", label: "Telegram", icon: Send },
  ];
  return (
    <div className="admin-app">
      <img src="/menu-food.jpg" alt="" aria-hidden="true" className="admin-ambient" />
      <aside className="admin-rail" aria-label="Administrator navigation">
        <div className="admin-rail-brand" aria-label="Pizza Next Door">
          <img src="/pizza-next-door-mark.png?v=2" alt="" aria-hidden="true" className="size-11 max-h-11 max-w-11 object-contain" />
        </div>
        <nav>
          {adminNavigation.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              className={adminSection === value ? "is-active" : ""}
              onClick={() => setAdminSection(value)}
              aria-label={label}
              aria-current={adminSection === value ? "page" : undefined}
              title={label}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button type="button" onClick={onBack} className="admin-rail-exit" title="Open storefront">
          <ShoppingBag />
          <span>Storefront</span>
        </button>
      </aside>
      <main className="admin-workspace">
    <section className="mx-auto max-w-7xl px-5 pb-24 pt-8 lg:px-8">
      {previewMode && <div className="admin-preview-notice">Read-only local preview · sample operational data</div>}
      {(productsError || ordersError) && (
        <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {productsError || ordersError}
        </div>
      )}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="admin-kicker">Live operations</p>
          <h1 className="mt-1 text-4xl font-black tracking-[-.05em]">
            Today’s operations
          </h1>
          <p className="admin-subtitle">Orders, stock, and payments in one working view.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="rounded-full sm:hidden"
          >
            Menu
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-full bg-[#2457ff]">
                <Plus /> New item
              </Button>
            </DialogTrigger>
            <DialogContent className="lg-dialog max-h-[92vh] overflow-auto rounded-[28px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Add a menu item
                </DialogTitle>
              </DialogHeader>
              <form action={saveProduct} className="grid gap-4 pt-2">
                <label className="relative grid h-40 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-[#cfd7e8] bg-[#f7f9fd] text-center text-sm text-[#6d7893]">
                  {createImagePreview ? (
                    <>
                      <img
                        src={createImagePreview}
                        alt="Selected product preview"
                        className="absolute inset-0 size-full object-cover"
                      />
                      <span className="absolute bottom-3 rounded-full bg-[#172039]/85 px-4 py-2 font-bold text-white">
                        Photo selected · click to replace
                      </span>
                    </>
                  ) : (
                    <div>
                      <ImagePlus className="mx-auto mb-2" />
                      Add product photo
                      <br />
                      <small>JPG, PNG, or WebP · max 5 MB</small>
                    </div>
                  )}
                  <input
                    name="image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setSaveMessage("Choose an image up to 5 MB.");
                        event.target.value = "";
                        return;
                      }
                      if (createImagePreview.startsWith("blob:"))
                        URL.revokeObjectURL(createImagePreview);
                      setCreateImagePreview(URL.createObjectURL(file));
                      setSaveMessage("Photo selected and ready to upload.");
                    }}
                  />
                </label>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    required
                    name="title"
                    placeholder="e.g. Margherita Special"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    required
                    name="description"
                    placeholder="Ingredients and details"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Purchase cost (CAD)</Label>
                    <Input required name="cost_price" type="number" min="0" step="0.01" placeholder="6.00" value={createCostPrice} onChange={(event) => setCreateCostPrice(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling price (CAD)</Label>
                    <Input
                      required
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="18.00"
                      value={createSellingPrice}
                      onChange={(event) => setCreateSellingPrice(event.target.value)}
                    />
                  </div>
                  <MarginPreview cost={Number(createCostPrice)} price={Number(createSellingPrice)} />
                  <div className="space-y-2">
                    <Label>Stock</Label>
                    <Input
                      required
                      name="stock"
                      type="number"
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{activeCreateCategory === "Drinks" ? "Volume / weight" : "Weight"}</Label>
                    <div className="grid grid-cols-[minmax(100px,1fr)_120px] gap-2">
                      <Input className="min-w-0" name="measure_value" type="number" min="1" placeholder={activeCreateCategory === "Drinks" ? "355" : "450"} />
                      <select name="measure_unit" defaultValue={activeCreateCategory === "Drinks" ? "ml" : "g"} key={activeCreateCategory} className="h-11 w-full rounded-xl border bg-white px-2">
                        {activeCreateCategory === "Drinks" && <option value="ml">mL</option>}
                        <option value="g">grams</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Prep time</Label>
                    <Input
                      required
                      name="delivery_minutes"
                      type="number"
                      placeholder="25"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <input type="hidden" name="category" value={activeCreateCategory} />
                  <select
                    name="category_id"
                    value={categories.find((entry) => entry.name === activeCreateCategory)?.id || ""}
                    onChange={(event) => setCreateCategory(categories.find((entry) => entry.id === event.target.value)?.name || activeCreateCategory)}
                    className="h-11 w-full rounded-xl border bg-white px-3"
                  >
                    {!categories.length && <option value="">Create a category first</option>}
                    {categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 text-sm font-semibold">
                  <input name="featured" type="checkbox" className="size-4" />
                  Feature this product on the storefront
                </label>
                <div className="space-y-2">
                  <Label>Sizes and variants</Label>
                  <VariantEditor name="variants" drinks={activeCreateCategory === "Drinks"} />
                </div>
                <div className="space-y-2">
                  <Label>Extras and prices</Label>
                  <ExtraEditor name="extras" />
                </div>
                {saveMessage && (
                  <p className="text-sm font-bold text-[#2457ff]">
                    {saveMessage}
                  </p>
                )}
                <Button
                  type="submit"
                  className="h-12 rounded-2xl bg-[#2457ff] font-bold"
                >
                  Publish item
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="admin-stats mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<ShoppingBag />}
          label="Orders today"
          value={String(orders.length)}
          detail={`${orders.filter((order) => order.status === "preparing").length} being prepared`}
          color="bg-[#edf1ff] text-[#2457ff]"
        />
        <Stat
          icon={<BarChart3 />}
          label="Pending payments"
          value={String(orders.filter((order) => order.payment_status === "pending").length)}
          detail="Confirm them in Finance"
          color="bg-[#fff6cd] text-[#8a6c00]"
        />
        <Stat
          icon={<Package />}
          label="Low stock"
          value={`${items.filter((item) => item.stock <= 3).length} items`}
          detail="need attention"
          color="bg-[#fff0f1] text-[#d73546]"
        />
      </div>
      <Tabs value={adminSection} onValueChange={setAdminSection}>
        <TabsList className="admin-tabs-list mb-5 rounded-full bg-[#e9edf5] p-1">
          <TabsTrigger value="orders" className="rounded-full px-5">
            Orders
          </TabsTrigger>
          <TabsTrigger value="menu" className="rounded-full px-5">
            Menu and stock
          </TabsTrigger>
          <TabsTrigger value="settings" className="rounded-full px-5">
            Telegram
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-full px-5">
            Finance
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <form
            action={recordSale}
            className="mb-5 grid gap-3 rounded-[26px] border bg-white p-5 sm:grid-cols-6"
          >
            <Input required name="customer" placeholder="Customer name" />
            <Input name="room" placeholder="Room" />
            <select
              required
              name="product"
              className="h-9 rounded-lg border bg-white px-3 text-sm"
            >
              <option value="">Select product</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <Input
              required
              name="quantity"
              type="number"
              min="1"
              defaultValue="1"
            />
            <select
              name="payment"
              className="h-9 rounded-lg border bg-white px-3 text-sm"
            >
              <option value="cash">Cash</option>
              <option value="etransfer">Interac e-Transfer</option>
            </select>
            <Button type="submit" className="bg-[#2457ff]">
              Create order
            </Button>
          </form>
          <div className="overflow-hidden rounded-[26px] border bg-white">
            {ordersError ? (
              <p className="p-8 text-center font-bold text-red-600">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="p-8 text-center text-[#6d7893]">
                No sales recorded yet.
              </p>
            ) : (
              orders.map((order, i) => (
                <div
                  key={order.id}
                  className="grid gap-3 border-b p-5 last:border-0 sm:grid-cols-[80px_1fr_1fr_100px_120px_80px] sm:items-center"
                >
                  <b>#{order.order_number}</b>
                  <span>
                    {order.customer_name} · {order.room_number}
                  </span>
                  <span className="text-[#6d7893]">
                    {order.order_items?.reduce(
                      (sum, item) => sum + item.quantity,
                      0,
                    ) || 0}{" "}
                    items · ${Number(order.total).toFixed(2)}
                  </span>
                  <span className="font-bold">
                    {new Date(order.created_at).toLocaleDateString("en-CA")}
                  </span>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${i === 2 ? "bg-[#eaf8ed] text-[#27803c]" : i === 1 ? "bg-[#fff6cd] text-[#8a6c00]" : "bg-[#edf1ff] text-[#2457ff]"}`}
                  >
                    {order.payment_status === "confirmed" ? "Paid" : "Awaiting payment"}
                  </span>
                  {order.payment_status !== "confirmed" && <Button
                    type="button"
                    onClick={() => deleteOrder(order.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    Delete
                  </Button>}
                </div>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="menu">
          <div className="admin-category-manager mb-5 rounded-[26px] border bg-white p-5">
            <div>
              <h3 className="text-lg font-black">Menu categories</h3>
              <p className="mt-1 text-sm text-[#6d7893]">Create categories such as Chinese Food, Desserts, or Combos, then assign products to them.</p>
            </div>
            <form action={createMenuCategory} className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Input required name="name" minLength={2} maxLength={60} placeholder="New category name" />
              <Button type="submit" className="shrink-0 bg-[#2457ff]"><Plus className="size-4" /> Create category</Button>
            </form>
            {categories.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{categories.map((entry) => <span key={entry.id} className="rounded-lg border px-3 py-1.5 text-xs font-bold">{entry.name}</span>)}</div>}
            {saveMessage && <p className="mt-3 text-sm font-bold text-[#2457ff]">{saveMessage}</p>}
          </div>
          <div className="overflow-hidden rounded-[26px] border bg-white">
            {productsError ? (
              <p className="p-8 text-center font-bold text-red-600">{productsError}</p>
            ) : items.length === 0 ? (
              <p className="p-8 text-center text-[#6d7893]">No menu items found for this business.</p>
            ) : items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 border-b p-4 last:border-0"
              >
                <img
                  src={getProductImage(item)}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                  style={{ objectPosition: item.pos }}
                />
                <div className="min-w-0 flex-1">
                  <b>{item.title}</b>
                  <p className="text-sm text-[#6d7893]">
                    ${item.price.toFixed(2)} · {item.time} min
                    {getProductMeasure(item)}
                  </p>
                  <p className="text-xs font-bold text-[#2457ff]">
                    Cost ${Number(item.cost_price || 0).toFixed(2)} · Margin {item.price > 0 ? (((item.price - Number(item.cost_price || 0)) / item.price) * 100).toFixed(1) : "0.0"}%
                  </p>
                </div>
                <div className="text-right">
                  <b>{item.stock} units</b>
                  <p className="text-xs text-[#6d7893]">in stock</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    setEditMessage("");
                    setEditImagePreview("");
                    setEditingItem(item);
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={() => deleteProduct(item)}
                  variant="outline"
                  size="icon-sm"
                  className="rounded-full text-red-600"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
          <Dialog
            open={Boolean(editingItem)}
            onOpenChange={(open) => !open && setEditingItem(null)}
          >
            <DialogContent className="lg-dialog max-h-[92vh] overflow-auto rounded-[28px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Edit menu item
                </DialogTitle>
              </DialogHeader>
              {editingItem && (
                <form action={updateProduct} className="grid gap-4 pt-2">
                  <label className="relative grid h-40 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-[#cfd7e8] bg-[#f7f9fd] text-center text-sm text-[#6d7893]">
                    {editImagePreview || getProductImage(editingItem) ? (
                      <>
                        <img
                          src={editImagePreview || getProductImage(editingItem)}
                          alt="Product photo preview"
                          className="absolute inset-0 size-full object-cover"
                        />
                        <span className="absolute bottom-3 rounded-full bg-[#172039]/85 px-4 py-2 font-bold text-white">
                          {editImagePreview
                            ? "New photo selected · click to replace"
                            : "Click to replace photo"}
                        </span>
                      </>
                    ) : (
                      <span>Choose a product photo</span>
                    )}
                    <input
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (file.size > 5 * 1024 * 1024) {
                          setEditMessage("Choose an image up to 5 MB.");
                          event.target.value = "";
                          return;
                        }
                        if (editImagePreview.startsWith("blob:"))
                          URL.revokeObjectURL(editImagePreview);
                        setEditImagePreview(URL.createObjectURL(file));
                        setEditMessage("New photo selected and ready to upload.");
                      }}
                    />
                  </label>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input required name="title" defaultValue={editingItem.title} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input required name="description" defaultValue={editingItem.description} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Purchase cost (CAD)</Label>
                      <Input required name="cost_price" type="number" min="0" step="0.01" value={editingItem.cost_price ?? 0} onChange={(event) => setEditingItem({ ...editingItem, cost_price: Number(event.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling price (CAD)</Label>
                      <Input required name="price" type="number" step="0.01" value={editingItem.price} onChange={(event) => setEditingItem({ ...editingItem, price: Number(event.target.value) })} />
                    </div>
                    <MarginPreview cost={Number(editingItem.cost_price || 0)} price={Number(editingItem.price)} />
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input required name="stock" type="number" defaultValue={editingItem.stock} />
                    </div>
                    <div className="space-y-2">
                      <Label>{editingItem.category === "Drinks" ? "Volume / weight" : "Weight"}</Label>
                      <div className="grid grid-cols-[minmax(100px,1fr)_120px] gap-2">
                        <Input className="min-w-0" name="measure_value" type="number" min="1" defaultValue={editingItem.measure_value || editingItem.weight_grams || ""} />
                        <select name="measure_unit" value={editingItem.measure_unit || (editingItem.category === "Drinks" ? "ml" : "g")} onChange={(event) => setEditingItem({ ...editingItem, measure_unit: event.target.value as "g" | "ml" })} className="h-11 rounded-xl border bg-white px-2">
                          {editingItem.category === "Drinks" && <option value="ml">mL</option>}
                          <option value="g">grams</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Prep time</Label>
                      <Input required name="delivery_minutes" type="number" defaultValue={editingItem.time} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <input type="hidden" name="category" value={editingItem.category || editingItem.tag} />
                    <select name="category_id" value={editingItem.category_id || ""} onChange={(event) => { const selected = categories.find((entry) => entry.id === event.target.value); if (selected) setEditingItem({ ...editingItem, category_id: selected.id, category: selected.name, measure_unit: selected.name === "Drinks" ? "ml" : "g" }); }} className="h-11 w-full rounded-xl border bg-white px-3">
                      <option value="">Select a category</option>
                      {categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-semibold">
                    <input name="featured" type="checkbox" className="size-4" defaultChecked={Boolean(editingItem.featured)} />
                    Feature this product on the storefront
                  </label>
                  <div className="space-y-2">
                    <Label>Sizes and variants</Label>
                    <VariantEditor key={`variants-${editingItem.id}`} name="variants" initial={editingItem.variants || []} drinks={editingItem.category === "Drinks"} />
                  </div>
                  <div className="space-y-2">
                    <Label>Extras and prices</Label>
                    <ExtraEditor key={`extras-${editingItem.id}`} name="extras" initial={editingItem.extras || []} />
                  </div>
                  {editMessage && <p className="text-sm font-bold text-red-600">{editMessage}</p>}
                  <Button type="submit" className="h-12 rounded-2xl bg-[#2457ff] font-bold">
                    Save changes
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="settings">
          <div className="rounded-[26px] border bg-white p-7">
            <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-[#2aabee] text-white">
              <BellRing />
            </div>
            <h3 className="text-2xl font-black">Telegram notifications</h3>
            <p className="mt-2 max-w-xl text-[#6d7893]">
              Connect your bot to receive the customer name, room, items,
              payment method, and delivery time for every new order.
            </p>
            <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-[1fr_auto]">
              <Input placeholder="Telegram bot token" type="password" />
              <Button className="rounded-xl bg-[#172039]">Connect bot</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="finance">
          <FinanceDashboard />
        </TabsContent>
      </Tabs>
    </section>
      </main>
    </div>
  );
}

type FinanceData = {
  summary: { revenue: number; costs: number; profit: number; margin: number; confirmed_sales: number };
  daily: Array<{ date: string; revenue: number; profit: number }>;
  pending: Array<{ id: string; order_number: number; customer_name: string; total: number; created_at: string }>;
  accounts: Array<{ id: string; name: string; type: "bank" | "cash" }>;
};

function MarginPreview({ cost, price }: { cost: number; price: number }) {
  const profit = price - cost;
  const margin = price > 0 ? (profit / price) * 100 : 0;
  return (
    <div className="col-span-2 rounded-2xl bg-[#edf1ff] px-4 py-3 text-sm font-semibold text-[#172039]">
      Estimated profit: <b>${profit.toFixed(2)}</b> per unit · Margin: <b>{margin.toFixed(1)}%</b>
      <p className="mt-1 text-xs font-normal text-[#6d7893]">Based on the purchase cost and selling price, before other operating expenses.</p>
    </div>
  );
}

function FinanceDashboard() {
  const [days, setDays] = useState("30");
  const [data, setData] = useState<FinanceData | null>(null);
  const [message, setMessage] = useState("");
  async function authorizedFetch(url: string, init?: RequestInit) {
    const { data: sessionData } = await createSupabaseClient().auth.getSession();
    if (!sessionData.session) throw new Error("Your session has expired.");
    return fetch(url, { ...init, headers: { ...(init?.headers || {}), authorization: `Bearer ${sessionData.session.access_token}` } });
  }
  async function load() {
    const response = await authorizedFetch(`/api/admin/finance?days=${days}`);
    const payload = (await response.json()) as FinanceData & { error?: string };
    if (response.ok) setData(payload); else setMessage(payload.error || "Finance data could not be loaded.");
  }
  useEffect(() => {
    let active = true;
    async function loadSelectedPeriod() {
      try {
        const { data: sessionData } = await createSupabaseClient().auth.getSession();
        if (!sessionData.session) throw new Error("Your session has expired.");
        const response = await fetch(`/api/admin/finance?days=${days}`, {
          headers: { authorization: `Bearer ${sessionData.session.access_token}` },
        });
        const payload = (await response.json()) as FinanceData & { error?: string };
        if (!active) return;
        if (response.ok) setData(payload);
        else setMessage(payload.error || "Finance data could not be loaded.");
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Finance data could not be loaded.");
      }
    }
    void loadSelectedPeriod();
    return () => { active = false; };
  }, [days]);
  async function addAccount(form: FormData) {
    setMessage("Saving account...");
    const response = await authorizedFetch("/api/admin/finance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), type: form.get("type") }) });
    setMessage(response.ok ? "Account added." : "The account could not be added.");
    if (response.ok) await load();
  }
  async function confirmPayment(orderId: string, accountId: string) {
    if (!accountId) { setMessage("Select the account that received the payment."); return; }
    const response = await authorizedFetch("/api/admin/finance", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ order_id: orderId, bank_account_id: accountId }) });
    setMessage(response.ok ? "Payment confirmed and included in finance totals." : "Payment could not be confirmed.");
    if (response.ok) await load();
  }
  if (!data) return <div className="rounded-[26px] border bg-white p-8">{message || "Loading finance dashboard..."}</div>;
  const money = (value: number) => `$${Number(value).toFixed(2)}`;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="text-3xl font-black">Finance dashboard</h3><p className="text-sm text-[#6d7893]">Only administrator-confirmed payments are included. Product costs are recorded when each order is placed.</p></div>
        <select value={days} onChange={(event) => setDays(event.target.value)} className="h-11 rounded-xl border bg-white px-4"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Revenue', money(data.summary.revenue)], ['Total costs', money(data.summary.costs)], ['Profit', money(data.summary.profit)], ['Overall margin', `${data.summary.margin.toFixed(1)}%`]].map(([label, value]) => <div key={label} className="rounded-3xl border bg-white p-5"><p className="text-sm font-bold text-[#6d7893]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
      </div>
      <div className="rounded-[26px] border bg-white p-6"><h4 className="mb-5 text-xl font-black">Revenue and profit</h4><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.daily}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="revenue" fill="#f6efe2" radius={[6,6,0,0]} /><Bar dataKey="profit" fill="#ff8a5c" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_.8fr]">
        <div className="rounded-[26px] border bg-white p-6"><h4 className="text-xl font-black">Payments awaiting confirmation</h4><div className="mt-4 space-y-3">{data.pending.length === 0 ? <p className="text-sm text-[#6d7893]">No pending payments.</p> : data.pending.map((order) => <PendingPayment key={order.id} order={order} accounts={data.accounts} onConfirm={confirmPayment} />)}</div></div>
        <div className="rounded-[26px] border bg-white p-6"><h4 className="text-xl font-black">Payment accounts</h4><div className="my-4 space-y-2">{data.accounts.map((account) => <div key={account.id} className="rounded-xl bg-[#f3f6fb] px-4 py-3 text-sm font-bold">{account.name} · {account.type}</div>)}</div><form action={addAccount} className="space-y-3"><Input required name="name" placeholder="Partner bank account" /><select name="type" className="h-11 w-full rounded-xl border bg-white px-3"><option value="bank">Bank account</option><option value="cash">Cash</option></select><Button type="submit" className="w-full rounded-xl bg-[#172039]"><Plus className="size-4" /> Add account</Button></form></div>
      </div>
      {message && <p className="rounded-xl bg-[#edf1ff] p-4 text-sm font-bold text-[#2457ff]">{message}</p>}
    </div>
  );
}

function PendingPayment({ order, accounts, onConfirm }: { order: FinanceData["pending"][number]; accounts: FinanceData["accounts"]; onConfirm: (orderId: string, accountId: string) => void }) {
  const [accountId, setAccountId] = useState("");
  return <div className="flex flex-wrap items-center gap-3 rounded-2xl border p-4"><div className="min-w-44 flex-1"><b>#{order.order_number} · {order.customer_name}</b><p className="text-sm text-[#6d7893]">${Number(order.total).toFixed(2)} CAD</p></div><select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="h-10 rounded-xl border bg-white px-3"><option value="">Select destination</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><Button type="button" onClick={() => onConfirm(order.id, accountId)} className="rounded-xl bg-[#2457ff]">Confirm payment</Button></div>;
}

function Stat({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-[24px] border bg-white p-5">
      <div
        className={`mb-5 grid size-11 place-items-center rounded-xl ${color}`}
      >
        {icon}
      </div>
      <p className="text-sm font-semibold text-[#6d7893]">{label}</p>
      <p className="mt-1 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#6d7893]">{detail}</p>
    </div>
  );
}

export function BusinessLandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fc] text-[#172039]">
      <header className="border-b border-[#dfe5f1] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#2457ff] text-white shadow-[0_8px_24px_rgba(36,87,255,.25)]">
              <Pizza className="size-6" />
            </div>
            <span className="font-black tracking-[-.04em]">DIRECT ORDERS</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" className="rounded-full">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild className="rounded-full bg-[#2457ff] px-5">
              <Link href="/signup">Create a business</Link>
            </Button>
          </div>
        </div>
      </header>
      <section className="mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.1fr_.9fr] lg:px-8">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e9eeff] px-4 py-2 text-sm font-bold text-[#2457ff]">
            <Sparkles className="size-4" /> Online ordering for your business
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.94] tracking-[-.065em] md:text-7xl">
            Your menu, your orders, your Telegram.
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#6d7893]">
            Create an independent online store, manage products, and receive every new order directly in your company&apos;s Telegram.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Button asChild className="h-13 rounded-full bg-[#2457ff] px-7 text-base font-bold">
              <Link href="/signup">Register my business</Link>
            </Button>
            <Button asChild variant="outline" className="h-13 rounded-full px-7 text-base font-bold">
              <Link href="/signin">Open my store</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-[#6d7893]">
            New registrations require a code provided by the platform owner.
          </p>
        </div>
        <div className="relative">
          <div className="absolute -inset-12 rounded-full bg-[#2457ff]/10 blur-3xl" />
          <div className="relative rotate-2 rounded-[36px] bg-[#172039] p-7 text-white shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-black">Business dashboard</span>
              <span className="rounded-full bg-green-400/15 px-3 py-1 text-xs font-bold text-green-300">Online</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/8 p-5"><p className="text-sm text-white/60">Orders today</p><p className="mt-2 text-4xl font-black">24</p></div>
              <div className="rounded-3xl bg-[#2457ff] p-5"><p className="text-sm text-blue-100">Revenue</p><p className="mt-2 text-3xl font-black">$486</p></div>
            </div>
            <div className="mt-4 rounded-3xl bg-white p-5 text-[#172039]">
              <div className="flex items-center gap-4"><div className="grid size-12 place-items-center rounded-2xl bg-[#ffdf57]"><BellRing /></div><div><p className="font-black">New order received</p><p className="text-sm text-[#6d7893]">Sent to the correct Telegram account</p></div></div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
