"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Boxes,
  Building2,
  ExternalLink,
  FileText,
  PackagePlus,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RentalDevice = {
  id: number;
  name_en: string;
  name_ar: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  monthly_rental_price: number | null;
  stock: number | null;
  availability_status: string | null;
  alibaba_url: string | null;
  alibaba_supplier: string | null;
};

type Product = {
  id: string;
  name_en: string | null;
  name_ar: string | null;
  category: string | null;
  stock: number | null;
};

export default function AdminPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [rentalDevices, setRentalDevices] =
    useState<RentalDevice[]>([]);

  const [loading, setLoading] =
    useState(true);

  const loadDashboard = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          productsResult,
          rentalsResult,
        ] = await Promise.all([
          supabase
            .from("products")
            .select(
              "id, name_en, name_ar, category, stock"
            )
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("rental_devices")
            .select(
              `
              id,
              name_en,
              name_ar,
              category,
              brand,
              model,
              monthly_rental_price,
              stock,
              availability_status,
              alibaba_url,
              alibaba_supplier
              `
            )
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (productsResult.error) {
          console.error(
            "Products error:",
            productsResult.error
          );
        }

        if (rentalsResult.error) {
          console.error(
            "Rental devices error:",
            rentalsResult.error
          );
        }

        setProducts(
          (productsResult.data ??
            []) as Product[]
        );

        setRentalDevices(
          (rentalsResult.data ??
            []) as RentalDevice[]
        );
      } catch (error: unknown) {
        console.error(
          "Admin dashboard error:",
          error
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadDashboard();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadDashboard]);

  const availableDevices =
    rentalDevices.filter(
      (device) =>
        device.availability_status ===
        "available"
    ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl bg-slate-950 p-7 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-400">
              Health Nations
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-300">
              إدارة المنتجات، أجهزة
              الإيجار، الموردين
              والكتالوجات
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDashboard()
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-bold text-white transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={19}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            تحديث البيانات
          </button>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            icon={<Boxes />}
            label="إجمالي المنتجات"
            value={products.length}
          />

          <DashboardCard
            icon={<Building2 />}
            label="أجهزة الإيجار"
            value={
              rentalDevices.length
            }
          />

          <DashboardCard
            icon={<Stethoscope />}
            label="الأجهزة المتاحة"
            value={availableDevices}
          />

          <DashboardCard
            icon={<FileText />}
            label="الكتالوجات"
            value="قريبًا"
          />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                أجهزة الإيجار
              </h2>

              <p className="mt-1 text-slate-500">
                البيانات المسجلة في
                Supabase وروابط موردي
                Alibaba
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              <PackagePlus size={18} />
              إضافة جهاز
            </button>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              جاري تحميل البيانات...
            </p>
          ) : rentalDevices.length ===
            0 ? (
            <p className="py-10 text-center text-slate-500">
              لا توجد أجهزة إيجار
              مسجلة.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="px-3 py-4">
                      الجهاز
                    </th>

                    <th className="px-3 py-4">
                      الفئة
                    </th>

                    <th className="px-3 py-4">
                      الماركة / الموديل
                    </th>

                    <th className="px-3 py-4">
                      الإيجار الشهري
                    </th>

                    <th className="px-3 py-4">
                      المخزون
                    </th>

                    <th className="px-3 py-4">
                      الحالة
                    </th>

                    <th className="px-3 py-4">
                      Alibaba
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rentalDevices.map(
                    (device) => (
                      <tr
                        key={device.id}
                        className="border-b border-slate-100"
                      >
                        <td className="px-3 py-4">
                          <strong className="block">
                            {device.name_ar ||
                              device.name_en}
                          </strong>

                          {device.name_ar && (
                            <span className="text-sm text-slate-500">
                              {
                                device.name_en
                              }
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-4">
                          {device.category ||
                            "-"}
                        </td>

                        <td className="px-3 py-4">
                          {device.brand ||
                            "-"}{" "}
                          /{" "}
                          {device.model ||
                            "-"}
                        </td>

                        <td className="px-3 py-4 font-bold text-blue-700">
                          {device.monthly_rental_price !==
                          null
                            ? `${device.monthly_rental_price.toLocaleString()} SAR`
                            : "حسب الطلب"}
                        </td>

                        <td className="px-3 py-4">
                          {device.stock ?? 0}
                        </td>

                        <td className="px-3 py-4">
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                            {device.availability_status ||
                              "available"}
                          </span>
                        </td>

                        <td className="px-3 py-4">
                          {device.alibaba_url ? (
                            <a
                              href={
                                device.alibaba_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-bold text-blue-700"
                            >
                              {device.alibaba_supplier ||
                                "Open Supplier"}

                              <ExternalLink
                                size={16}
                              />
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">
            أحدث المنتجات
          </h2>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              جاري تحميل المنتجات...
            </p>
          ) : products.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              لا توجد منتجات مسجلة.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products
                .slice(0, 6)
                .map((product) => (
                  <article
                    key={product.id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <strong className="block text-lg">
                      {product.name_ar ||
                        product.name_en ||
                        "Unnamed Product"}
                    </strong>

                    <span className="mt-2 block text-sm text-slate-500">
                      {product.category ||
                        "بدون تصنيف"}
                    </span>

                    <span className="mt-4 block font-bold text-blue-700">
                      المخزون:{" "}
                      {product.stock ??
                        0}
                    </span>
                  </article>
                ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
        {icon}
      </div>

      <strong className="mt-5 block text-3xl font-black">
        {value}
      </strong>

      <span className="mt-1 block text-slate-500">
        {label}
      </span>
    </article>
  );
}