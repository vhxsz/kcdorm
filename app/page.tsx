"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BellRing,
  Clock3,
  ImagePlus,
  Minus,
  Package,
  Plus,
  Settings2,
  ShoppingBag,
  Sparkles,
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
import { createClient as createSupabaseClient } from "@/lib/supabase/browser";

export type MenuItem = {
  id: string;
  title: string;
  description: string;
  price: number;
  time: number;
  stock: number;
  pos: string;
  tag: string;
  image_url?: string | null;
  category?: string;
};
const demoItems: MenuItem[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Pepperoni Hot Honey",
    description: "Tomato sauce, mozzarella, crispy pepperoni, and hot honey.",
    price: 19,
    time: 25,
    stock: 8,
    pos: "20% 22%",
    tag: "Most popular",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Burrata Garden",
    description: "Creamy burrata, cherry tomatoes, pesto, and fresh basil.",
    price: 22,
    time: 30,
    stock: 5,
    pos: "72% 78%",
    tag: "New",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Truffle Parm Fries",
    description: "Crispy fries, Parmesan, herbs, and truffle mayo.",
    price: 11,
    time: 15,
    stock: 12,
    pos: "84% 18%",
    tag: "Great for sharing",
  },
];

export default function Home() {
  const [items, setItems] = useState<MenuItem[]>(demoItems);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("All");
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0),
    [cart],
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
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (Array.isArray(data) && data.length)
          setItems(
            data.map((p, i) => ({
              ...p,
              price: Number(p.price),
              time: p.delivery_minutes,
              pos: ["20% 22%", "72% 78%", "84% 18%"][i % 3],
              tag: p.category || "Available",
            })),
          );
      })
      .catch(() => undefined);
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8fc] text-[#172039]">
      <header className="sticky top-0 z-40 border-b border-[#dfe5f1] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#2457ff] text-xl text-white shadow-[0_8px_24px_rgba(36,87,255,.25)]">
              ◒
            </div>
            <div>
              <div className="font-black tracking-[-.04em]">
                PIZZA NEXT DOOR
              </div>
              <div className="text-xs font-medium text-[#6d7893]">
                Toronto · open until 11 p.m.
              </div>
            </div>
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
                  items={items}
                  total={total}
                  cart={cart}
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
              <p className="text-6xl font-black tracking-[-.07em]">15–30</p>
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
          {["All", "Pizzas", "Sides", "Drinks"].map((name) => (
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
          {items.map((item) => (
            <article
              key={item.id}
              className="group overflow-hidden rounded-[26px] border border-[#dfe5f1] bg-white shadow-[0_8px_30px_rgba(25,39,78,.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(25,39,78,.10)]"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={item.image_url || "/menu-food.jpg"}
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
                    </p>
                  </div>
                  {cart[item.id] ? (
                    <div className="flex items-center gap-3 rounded-full bg-[#edf1ff] p-1">
                      <button
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.title}`}
                        className="grid size-9 place-items-center rounded-full bg-white"
                      >
                        <Minus className="size-4" />
                      </button>
                      <b>{cart[item.id]}</b>
                      <button
                        onClick={() => add(item.id)}
                        aria-label={`Add ${item.title}`}
                        className="grid size-9 place-items-center rounded-full bg-[#2457ff] text-white"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => add(item.id)}
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
  items,
  total,
  cart,
  add,
  remove,
}: {
  items: MenuItem[];
  total: number;
  cart: Record<string, number>;
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
                    src={item.image_url || "/menu-food.jpg"}
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
          <Checkout items={items} cart={cart} total={total} />
        </div>
      )}
    </div>
  );
}

function Checkout({
  items,
  cart,
  total,
}: {
  items: MenuItem[];
  cart: Record<string, number>;
  total: number;
}) {
  const [sent, setSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  async function submit(form: FormData) {
    setError("");
    const body = {
      customer_name: form.get("name"),
      room_number: form.get("room"),
      scheduled_for: null,
      payment_method: form.get("payment"),
      items: items
        .filter((i) => cart[i.id])
        .map((i) => ({ product_id: i.id, quantity: cart[i.id], extras: [] })),
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
  onBack,
}: {
  items: MenuItem[];
  onProductAdded: (item: MenuItem) => void;
  onBack: () => void;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
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
    } catch {
      setLoginError("Invalid email or password");
    }
  }
  async function saveProduct(form: FormData) {
    setSaveMessage("Salvando...");
    try {
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error();
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
          stock: Number(form.get("stock")),
          delivery_minutes: Number(form.get("delivery_minutes")),
          category: String(form.get("category") || "Pizzas"),
          extras: [],
          image_url: null,
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
    } catch {
      setSaveMessage("We could not save this item.");
    }
  }
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
                <Plus /> Novo item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[92vh] overflow-auto rounded-[28px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">
                  Add a menu item
                </DialogTitle>
              </DialogHeader>
              <form action={saveProduct} className="grid gap-4 pt-2">
                <div className="grid h-32 place-items-center rounded-2xl border-2 border-dashed border-[#cfd7e8] bg-[#f7f9fd] text-center text-sm text-[#6d7893]">
                  <div>
                    <ImagePlus className="mx-auto mb-2" />
                    Add product photo
                  </div>
                </div>
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
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Price (CAD)</Label>
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
                  <Label>Adicionais</Label>
                  <Input name="category" placeholder="Pizzas" />
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
          value="18"
          detail="4 being prepared"
          color="bg-[#edf1ff] text-[#2457ff]"
        />
        <Stat
          icon={<BarChart3 />}
          label="Sales today"
          value="$428"
          detail="+12% vs. ontem"
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
        </TabsList>
        <TabsContent value="orders">
          <div className="overflow-hidden rounded-[26px] border bg-white">
            {[
              [
                "#1048",
                "Mariana · 407",
                "2 items · $41.00",
                "19:30",
                "Scheduled",
              ],
              ["#1047", "Lucas · 212", "1 item · $22.00", "Now", "Preparing"],
              ["#1046", "Sophie · 815", "3 items · $49.00", "Now", "Ready"],
            ].map((o, i) => (
              <div
                key={o[0]}
                className="grid gap-3 border-b p-5 last:border-0 sm:grid-cols-[80px_1fr_1fr_100px_120px] sm:items-center"
              >
                <b>{o[0]}</b>
                <span>{o[1]}</span>
                <span className="text-[#6d7893]">{o[2]}</span>
                <span className="font-bold">{o[3]}</span>
                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${i === 2 ? "bg-[#eaf8ed] text-[#27803c]" : i === 1 ? "bg-[#fff6cd] text-[#8a6c00]" : "bg-[#edf1ff] text-[#2457ff]"}`}
                >
                  {o[4]}
                </span>
              </div>
            ))}
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
                  src={item.image_url || "/menu-food.jpg"}
                  alt=""
                  className="size-16 rounded-xl object-cover"
                  style={{ objectPosition: item.pos }}
                />
                <div className="min-w-0 flex-1">
                  <b>{item.title}</b>
                  <p className="text-sm text-[#6d7893]">
                    ${item.price.toFixed(2)} · {item.time} min
                  </p>
                </div>
                <div className="text-right">
                  <b>{item.stock} un.</b>
                  <p className="text-xs text-[#6d7893]">in stock</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-full">
                  Edit
                </Button>
              </div>
            ))}
          </div>
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
      </Tabs>
    </section>
  );
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
