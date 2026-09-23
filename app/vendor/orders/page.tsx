"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  Loader2,
  Package,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type MarketplaceOrder = {
  id: string;
  order_number: string | null;
  vendor_id: string;
  product_id: number | null;
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
  currency: string | null;
  status: string | null;
  vendor_notes: string | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function VendorOrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadOrders() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("marketplace_orders")
        .select(
          `
            id,
            order_number,
            vendor_id,
            product_id,
            product_name,
            quantity,
            unit_price,
            total_amount,
            currency,
            status,
            vendor_notes,
            admin_notes,
            created_at,
            updated_at
          `
        )
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Orders error:", error);
        setErrorMessage(error.message);
        setOrders([]);
        return;
      }

      setOrders((data ?? []) as MarketplaceOrder[]);
    } catch (error) {
      console.error(error);
      setErrorMessage("Unable to load your orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function formatMoney(value: number | null, currency: string | null) {
    if (value === null || value === undefined) return "—";

    return `${Number(value).toLocaleString()} ${currency || ""}`.trim();
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  }

  function statusStyle(status: string | null) {
    switch ((status || "").toLowerCase()) {
      case "approved":
      case "confirmed":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "processing":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "cancelled":
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-semibold">Loading orders...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/vendor/dashboard")}
          className="mb-6 inline-flex items-center gap-2 font-semibold text-slate-700 transition hover:text-blue-600"
        >
          <ArrowLeft className="h-5 w-5" />
          Vendor Dashboard
        </button>

        <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
                <Package className="h-8 w-8" />
              </div>

              <div>
                <p className="mb-1 text-sm font-bold tracking-[0.16em] text-sky-300">
                  HEALTH NATIONS VENDOR
                </p>

                <h1 className="text-3xl font-black md:text-4xl">
                  Orders
                </h1>

                <p className="mt-2 text-slate-300">
                  Manage orders assigned to your store.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-bold text-red-700">
              Could not load orders
            </p>
            <p className="mt-1 text-sm text-red-600">
              {errorMessage}
            </p>
          </section>
        ) : null}

        {!errorMessage && orders.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
              <Box className="h-10 w-10 text-slate-400" />
            </div>

            <h2 className="mt-6 text-2xl font-black text-slate-900">
              No orders yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-slate-500">
              Orders assigned to your company through Health Nations will
              appear here.
            </p>

            <div className="mx-auto mt-4 flex max-w-xl items-center justify-center gap-2 text-sm font-semibold text-slate-500">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Customer communication remains managed through Health Nations.
            </div>

            <button
              type="button"
              onClick={() => router.push("/vendor/products")}
              className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700"
            >
              Manage Products
            </button>
          </section>
        ) : null}

        {!errorMessage && orders.length > 0 ? (
          <section className="mt-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Your Orders
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {orders.length} {orders.length === 1 ? "order" : "orders"}
                </p>
              </div>
            </div>

            {orders.map((order) => (
              <article
                key={order.id}
                className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Order Number
                    </p>

                    <h3 className="mt-1 text-xl font-black text-slate-900">
                      {order.order_number || "Order"}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-bold capitalize ${statusStyle(
                      order.status
                    )}`}
                  >
                    {order.status || "Pending"}
                  </span>
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Product
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {order.product_name || "Medical Product"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Quantity
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {order.quantity ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Unit Price
                    </p>
                    <p className="mt-2 font-bold text-slate-900">
                      {formatMoney(order.unit_price, order.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Total
                    </p>
                    <p className="mt-2 text-lg font-black text-blue-600">
                      {formatMoney(order.total_amount, order.currency)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(order.created_at)}
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Managed through Health Nations
                  </div>
                </div>

                {order.vendor_notes ? (
                  <div className="border-t border-slate-100 px-6 py-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Vendor Notes
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {order.vendor_notes}
                    </p>
                  </div>
                ) : null}

                {order.admin_notes ? (
                  <div className="border-t border-blue-100 bg-blue-50/60 px-6 py-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                      Health Nations Notes
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {order.admin_notes}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}