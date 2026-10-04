"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  BarChart3,
  BellRing,
  Clock3,
  ImagePlus,
  Minus,
  Package,
  Pizza,
  Plus,
  Settings2,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
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
  extras?: { name: string; price: number }[];
  variants?: { name: string; price: number; measure_value?: number | null; measure_unit?: "g" | "ml" | null }[];
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

function getProductImage(item: MenuItem) {
  return item.image_url || demoProductImages[item.id] || "/menu-food.jpg";
}

function getProductMeasure(item: MenuItem) {
  const value = item.measure_value ?? item.weight_grams;
  if (!value) return "";
  return ` · ${value} ${item.measure_unit || "g"}`;
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

function VariantEditor({ name, initial = [], drinks = false }: { name: string; initial?: NonNullable<MenuItem["variants"]>; drinks?: boolean }) {
  const [rows, setRows] = useState(initial);
  const update = (index: number, patch: Partial<NonNullable<MenuItem["variants"]>[number]>) =>
    setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div key={index} className="grid gap-2 rounded-2xl border bg-[#f7f9fd] p-3 sm:grid-cols-[1.4fr_.8fr_.8fr_.7fr_auto]">
          <Input aria-label="Variant name" placeholder="e.g. Large" value={row.name} onChange={(event) => update(index, { name: event.target.value })} />
          <Input aria-label="Additional price" type="number" step="0.01" min="0" placeholder="+$0.00" value={row.price} onChange={(event) => update(index, { price: Number(event.target.value) })} />
          <Input aria-label="Amount" type="number" min="1" placeholder={drinks ? "355" : "450"} value={row.measure_value || ""} onChange={(event) => update(index, { measure_value: event.target.value ? Number(event.target.value) : null })} />
          <select aria-label="Unit" value={row.measure_unit || (drinks ? "ml" : "g")} onChange={(event) => update(index, { measure_unit: event.target.value as "g" | "ml" })} className="h-11 rounded-xl border bg-white px-2">
            {drinks && <option value="ml">mL</option>}<option value="g">grams</option>
          </select>
          <Button type="button" variant="ghost" aria-label="Remove variant" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRows((current) => [...current, { name: "", price: 0, measure_value: null, measure_unit: drinks ? "ml" : "g" }])}><Plus className="size-4" /> Add size or variant</Button>
    </div>
  );
}

function ExtraEditor({ name, initial = [] }: { name: string; initial?: NonNullable<MenuItem["extras"]> }) {
  const [rows, setRows] = useState(initial);
  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
      {rows.map((row, index) => (
        <div key={index} className="grid grid-cols-[1fr_130px_auto] gap-2 rounded-2xl border bg-[#f7f9fd] p-3">
          <Input aria-label="Extra name" placeholder="e.g. Extra cheese" value={row.name} onChange={(event) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, name: event.target.value } : item))} />
          <Input aria-label="Extra price" type="number" min="0" step="0.01" placeholder="$0.00" value={row.price} onChange={(event) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, price: Number(event.target.value) } : item))} />
          <Button type="button" variant="ghost" aria-label="Remove extra" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}><Trash2 className="size-4" /></Button>
        </div>
      ))}
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setRows((current) => [...current, { name: "", price: 0 }])}><Plus className="size-4" /> Add extra</Button>
    </div>
  );
}
export default function Home() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const businessSlug = useSyncExternalStore(
    () => () => undefined,
    () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
      return path || new URLSearchParams(window.location.search).get("business");
    },
    () => null,
  );
  const [businessName, setBusinessName] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartExtras, setCartExtras] = useState<Record<string, string[]>>({});
  const [cartVariants, setCartVariants] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [selectedVariant, setSelectedVariant] = useState("");
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
  const add = (id: string) =>
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
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
      })
      .catch(() => undefined);
  }, [businessSlug]);

  if (!businessSlug) return <LandingPage />;

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#172039]">
      <header className="sticky top-0 z-40 border-b border-[#dfe5f1] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#2457ff] text-white shadow-[0_8px_24px_rgba(36,87,255,.25)]">
              <Pizza className="size-6" />
            </div>
            <div className="font-black tracking-[-.04em]">{businessName || "LOADING MENU"}</div>
          </div>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button className="h-11 rounded-full bg-[#172039] px-5 text-white hover:bg-[#2457ff]">
                  <ShoppingBag className="size-4" /> Cart{" "}
                  <span className="rounded-full bg-white/15 px-2 py-0.5">
                    {count}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full border-0 p-0 sm:max-w-md">
                <Cart
                  businessSlug={businessSlug}
                  items={items}
                  total={total}
                  cart={cart}
                  cartExtras={cartExtras}
                  cartVariants={cartVariants}
                  add={add}
                  remove={remove}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-28 pt-7 lg:px-8 lg:pt-10">
        <div className="mb-8 grid gap-5 lg:grid-cols-[1.55fr_.85fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-[#2457ff] p-7 text-white shadow-[0_20px_70px_rgba(36,87,255,.18)] md:p-10">
            <div className="relative z-10 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/14 px-3 py-1.5 text-sm font-semibold">
                <Sparkles className="size-4" /> Delivered to your room
              </div>
              <h1 className="text-4xl font-black leading-[.95] tracking-[-.06em] md:text-6xl">
                Hungry now?
                <br />
                We’re next door.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-blue-100">
                Choose your favourites, pick a time, and relax. There’s no
                minimum order.
              </p>
            </div>
            <div className="absolute -bottom-24 -right-16 size-72 rounded-full border-[48px] border-[#ffdf57] opacity-90" />
          </div>
          <div className="flex min-h-56 flex-col justify-between rounded-[32px] bg-[#ffdf57] p-7 md:p-8">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold uppercase tracking-widest">
                Quick delivery
              </span>
              <Clock3 className="size-6" />
            </div>
            <div>
              <p className="flex items-baseline gap-3 text-6xl font-black tracking-[-.04em]">
                <span>15</span>
                <span aria-hidden="true">–</span>
                <span>30</span>
              </p>
              <p className="mt-1 text-lg font-bold">minutes to your door</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-[#2457ff]">
              Fresh from the oven
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-[-.04em]">
              What are you craving?
            </h2>
          </div>
          <button className="hidden text-sm font-bold text-[#6d7893] md:block">
            Delivery information
          </button>
        </div>
        <div className="mb-7 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {["All", "Pizzas", "Snacks", "Sides", "Drinks"].map((name) => (
            <button
              key={name}
              onClick={() => setCategory(name)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-bold transition ${category === name ? "bg-[#172039] text-white" : "border border-[#dfe5f1] bg-white text-[#59647e] hover:border-[#2457ff]"}`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items
            .filter((item) => category === "All" || item.category === category)
            .map((item) => (
              <article
                key={item.id}
                onClick={() => {
                  setSelectedProduct(item);
                  setSelectedExtras(cartExtras[item.id] || []);
                }}
                className="group overflow-hidden rounded-[26px] border border-[#dfe5f1] bg-white shadow-[0_8px_30px_rgba(25,39,78,.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(25,39,78,.10)]"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={getProductImage(item)}
                    alt={item.title}
                    className="h-full w-full scale-[1.35] object-cover transition duration-500 group-hover:scale-[1.42]"
                    style={{ objectPosition: item.pos }}
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black shadow-sm">
                    {item.tag}
                  </span>
                  <span className="absolute bottom-4 right-4 rounded-full bg-[#172039]/90 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                    {item.stock} available
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black tracking-[-.025em]">
                    {item.title}
                  </h3>
                  <p className="mt-2 min-h-12 text-sm leading-relaxed text-[#6d7893]">
                    {item.description}
                  </p>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black">
                        ${item.price.toFixed(2)}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-[#6d7893]">
                        <Clock3 className="size-3.5" /> {item.time} min
                        {getProductMeasure(item)}
                      </p>
                    </div>
                    {cart[item.id] ? (
                      <div className="flex items-center gap-3 rounded-full bg-[#edf1ff] p-1">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            remove(item.id);
                          }}
                          aria-label={`Remove ${item.title}`}
                          className="grid size-9 place-items-center rounded-full bg-white"
                        >
                          <Minus className="size-4" />
                        </button>
                        <b>{cart[item.id]}</b>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            add(item.id);
                          }}
                          aria-label={`Add ${item.title}`}
                          className="grid size-9 place-items-center rounded-full bg-[#2457ff] text-white"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <Button
                        onClick={(event) => {
                          event.stopPropagation();
                          if (item.extras?.length || item.variants?.length) {
                            setSelectedProduct(item);
                            setSelectedExtras([]);
                            setSelectedVariant(item.variants?.[0]?.name || "");
                          } else add(item.id);
                        }}
                        className="size-11 rounded-full bg-[#2457ff] p-0 hover:bg-[#1744d4]"
                        aria-label={`Add ${item.title}`}
                      >
                        <Plus className="size-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>
      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="rounded-[28px] sm:max-w-lg">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Customize {selectedProduct.title}
                </DialogTitle>
              </DialogHeader>
              <p className="text-sm text-[#6d7893]">
                Choose a size or variant and any extras you would like to add.
              </p>
              <div className="space-y-2 py-3">
                {selectedProduct.variants?.map((variant) => (
                  <label key={variant.name} className="flex cursor-pointer items-center justify-between rounded-2xl border p-4">
                    <span className="flex items-center gap-3">
                      <input type="radio" name="variant" checked={selectedVariant === variant.name} onChange={() => setSelectedVariant(variant.name)} />
                      <b>{variant.name}</b>
                      {variant.measure_value && <span className="text-sm text-[#6d7893]">{variant.measure_value} {variant.measure_unit}</span>}
                    </span>
                    <span>{Number(variant.price) ? `+$${Number(variant.price).toFixed(2)}` : "Included"}</span>
                  </label>
                ))}
                {selectedProduct.extras?.length ? (
                  selectedProduct.extras.map((extra) => (
                    <label
                      key={extra.name}
                      className="flex cursor-pointer items-center justify-between rounded-2xl border p-4"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(extra.name)}
                          onChange={() =>
                            setSelectedExtras((current) =>
                              current.includes(extra.name)
                                ? current.filter((name) => name !== extra.name)
                                : [...current, extra.name],
                            )
                          }
                        />
                        <b>{extra.name}</b>
                      </span>
                      <span>+${Number(extra.price).toFixed(2)}</span>
                    </label>
                  ))
                ) : (
                  <p className="rounded-2xl bg-[#f3f6fb] p-4">
                    No extras are available for this item.
                  </p>
                )}
              </div>
              <Button
                className="h-12 w-full rounded-2xl bg-[#2457ff] font-bold"
                onClick={() => {
                  setCartExtras((current) => ({
                    ...current,
                    [selectedProduct.id]: selectedExtras,
                  }));
                  setCartVariants((current) => ({
                    ...current,
                    [selectedProduct.id]: selectedVariant,
                  }));
                  add(selectedProduct.id);
                  setSelectedProduct(null);
                }}
              >
                Add to order · $
                {(
                  selectedProduct.price +
                  (selectedProduct.extras || [])
                    .filter((extra) => selectedExtras.includes(extra.name))
                    .reduce((sum, extra) => sum + Number(extra.price), 0) +
                  Number((selectedProduct.variants || []).find((variant) => variant.name === selectedVariant)?.price || 0)
                ).toFixed(2)}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
      {count > 0 && (
        <div className="fixed bottom-5 left-1/2 z-30 flex w-[calc(100%-40px)] max-w-md -translate-x-1/2 items-center justify-between rounded-2xl bg-[#172039] px-5 py-4 text-white shadow-2xl md:hidden">
          <span className="font-bold">
            Cart · {count} {count === 1 ? "item" : "items"}
          </span>
          <b>${total.toFixed(2)}</b>
        </div>
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
}: {
  businessSlug: string;
  items: MenuItem[];
  total: number;
  cart: Record<string, number>;
  cartExtras: Record<string, string[]>;
  cartVariants: Record<string, string>;
  add: (id: string) => void;
  remove: (id: string) => void;
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
          />
        </div>
      )}
    </div>
  );
}

function Checkout({
  businessSlug,
  items,
  cart,
  cartExtras,
  cartVariants,
  total,
}: {
  businessSlug: string;
  items: MenuItem[];
  cart: Record<string, number>;
  cartExtras: Record<string, string[]>;
  cartVariants: Record<string, string>;
  total: number;
}) {
  const [sent, setSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setError("");
    const body = {
      business_slug: businessSlug,
      customer_name: form.get("name"),
      room_number: form.get("room"),
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
      headers: { "content-type": "application/json" },
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
    setSent(true);
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-13 w-full rounded-2xl bg-[#2457ff] text-base font-bold hover:bg-[#1744d4]">
          Continue to checkout
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-[28px] sm:max-w-lg">
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
          </div>
        ) : (
          <form action={submit}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                Complete your order
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Your name</Label>
                  <Input
                    required
                    name="name"
                    id="name"
                    placeholder="e.g. Alex"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">Room number</Label>
                  <Input
                    required
                    name="room"
                    id="room"
                    placeholder="e.g. 407"
                  />
                </div>
              </div>
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
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
  onBack,
}: {
  items: MenuItem[];
  onProductAdded: (item: MenuItem) => void;
  onProductUpdated: (item: MenuItem) => void;
  onProductDeleted: (id: string) => void;
  onBack: () => void;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editImagePreview, setEditImagePreview] = useState("");
  const [orders, setOrders] = useState<
    Array<{
      id: string;
      order_number: number;
      customer_name: string;
      room_number: string;
      total: number;
      status: string;
      created_at: string;
      order_items?: Array<{ title_snapshot: string; quantity: number }>;
    }>
  >([]);
  const [createCategory, setCreateCategory] = useState("Pizzas");
  useEffect(() => {
    try {
      createSupabaseClient()
        .auth.getUser()
        .then(({ data }) => setAuthenticated(Boolean(data.user)));
    } catch {}
  }, []);
  async function login(form: FormData) {
    setLoginError("");
    try {
      const { error } = await createSupabaseClient().auth.signInWithPassword({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      if (error) throw error;
      setAuthenticated(true);
      window.location.reload();
    } catch {
      setLoginError("Invalid email or password");
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
  async function loadOrders() {
    const { data } = await createSupabaseClient().auth.getSession();
    if (!data.session) return;
    const response = await fetch("/api/admin/orders", {
      headers: { authorization: `Bearer ${data.session.access_token}` },
    });
    if (response.ok) setOrders(await response.json());
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
    if (response.ok) await loadOrders();
  }
  useEffect(() => {
    // Loading is intentionally tied to the transition from signed-out to signed-in.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (authenticated) void loadOrders();
  }, [authenticated]);
  if (!authenticated)
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
  return (
    <section className="mx-auto max-w-7xl px-5 pb-24 pt-8 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#2457ff]">
            Admin dashboard
          </p>
          <h1 className="mt-1 text-4xl font-black tracking-[-.05em]">
            Today’s operations
          </h1>
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
            <DialogContent className="max-h-[92vh] overflow-auto rounded-[28px]">
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
                    <Input required name="cost_price" type="number" min="0" step="0.01" placeholder="6.00" />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling price (CAD)</Label>
                    <Input
                      required
                      name="price"
                      type="number"
                      step="0.01"
                      placeholder="18.00"
                    />
                  </div>
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
                    <Label>{createCategory === "Drinks" ? "Volume / weight" : "Weight"}</Label>
                    <div className="grid grid-cols-[minmax(100px,1fr)_120px] gap-2">
                      <Input className="min-w-0" name="measure_value" type="number" min="1" placeholder={createCategory === "Drinks" ? "355" : "450"} />
                      <select name="measure_unit" defaultValue={createCategory === "Drinks" ? "ml" : "g"} key={createCategory} className="h-11 w-full rounded-xl border bg-white px-2">
                        {createCategory === "Drinks" && <option value="ml">mL</option>}
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
                  <select
                    name="category"
                    value={createCategory}
                    onChange={(event) => setCreateCategory(event.target.value)}
                    className="h-11 w-full rounded-xl border bg-white px-3"
                  >
                    <option>Pizzas</option>
                    <option>Snacks</option>
                    <option>Sides</option>
                    <option>Drinks</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Sizes and variants</Label>
                  <VariantEditor name="variants" drinks={createCategory === "Drinks"} />
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
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          icon={<ShoppingBag />}
          label="Orders today"
          value={String(orders.length)}
          detail={`${orders.filter((order) => order.status === "preparing").length} being prepared`}
          color="bg-[#edf1ff] text-[#2457ff]"
        />
        <Stat
          icon={<BarChart3 />}
          label="Sales today"
          value={`$${orders.reduce((sum, order) => sum + Number(order.total), 0).toFixed(2)}`}
          detail="Recorded sales"
          color="bg-[#fff6cd] text-[#8a6c00]"
        />
        <Stat
          icon={<Package />}
          label="Low stock"
          value="2 items"
          detail="need attention"
          color="bg-[#fff0f1] text-[#d73546]"
        />
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="mb-5 rounded-full bg-[#e9edf5] p-1">
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
            Profit margin
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
              Record sale
            </Button>
          </form>
          <div className="overflow-hidden rounded-[26px] border bg-white">
            {orders.length === 0 ? (
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
                    {order.status}
                  </span>
                  <Button
                    type="button"
                    onClick={() => deleteOrder(order.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="menu">
          <div className="overflow-hidden rounded-[26px] border bg-white">
            {items.map((item) => (
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
            <DialogContent className="max-h-[92vh] overflow-auto rounded-[28px]">
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
                      <Input required name="cost_price" type="number" min="0" step="0.01" defaultValue={editingItem.cost_price || 0} />
                    </div>
                    <div className="space-y-2">
                      <Label>Selling price (CAD)</Label>
                      <Input required name="price" type="number" step="0.01" defaultValue={editingItem.price} />
                    </div>
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
                    <select name="category" value={editingItem.category || editingItem.tag} onChange={(event) => setEditingItem({ ...editingItem, category: event.target.value, measure_unit: event.target.value === "Drinks" ? "ml" : "g" })} className="h-11 w-full rounded-xl border bg-white px-3">
                      <option>Pizzas</option>
                      <option>Snacks</option>
                      <option>Sides</option>
                      <option>Drinks</option>
                    </select>
                  </div>
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
  );
}

type FinanceData = {
  summary: { revenue: number; costs: number; profit: number; margin: number; confirmed_sales: number };
  daily: Array<{ date: string; revenue: number; profit: number }>;
  pending: Array<{ id: string; order_number: number; customer_name: string; total: number; created_at: string }>;
  accounts: Array<{ id: string; name: string; type: "bank" | "cash" }>;
};

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
  useEffect(() => { void load(); }, [days]);
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
        <div><h3 className="text-3xl font-black">Finance dashboard</h3><p className="text-sm text-[#6d7893]">Only administrator-confirmed payments are included.</p></div>
        <select value={days} onChange={(event) => setDays(event.target.value)} className="h-11 rounded-xl border bg-white px-4"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Revenue', money(data.summary.revenue)], ['Total costs', money(data.summary.costs)], ['Profit', money(data.summary.profit)], ['Overall margin', `${data.summary.margin.toFixed(1)}%`]].map(([label, value]) => <div key={label} className="rounded-3xl border bg-white p-5"><p className="text-sm font-bold text-[#6d7893]">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
      </div>
      <div className="rounded-[26px] border bg-white p-6"><h4 className="mb-5 text-xl font-black">Revenue and profit</h4><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.daily}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="revenue" fill="#2457ff" radius={[6,6,0,0]} /><Bar dataKey="profit" fill="#42b883" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div>
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

function LandingPage() {
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
              <a href="/signin">Sign in</a>
            </Button>
            <Button asChild className="rounded-full bg-[#2457ff] px-5">
              <a href="/signup">Create a business</a>
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
              <a href="/signup">Register my business</a>
            </Button>
            <Button asChild variant="outline" className="h-13 rounded-full px-7 text-base font-bold">
              <a href="/signin">Open my store</a>
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
