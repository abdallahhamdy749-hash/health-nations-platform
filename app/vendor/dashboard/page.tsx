"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  MessageSquare,
  Package,
  Settings,
  ShoppingCart,
  Store,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VendorProfile = {
  id: string;
  account_type: string | null;
  account_status: string | null;
  company_name_en: string | null;
  company_name_ar: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  country_code: string | null;
  country_name: string | null;
  city: string | null;
  currency: string | null;
  store_slug: string | null;
  store_description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  store_is_active: boolean | null;
  is_verified: boolean | null;
  can_publish_products: boolean | null;
};

type ProductSummary = {
  id: number;
  status: string | null;
  stock: number | null;
};

type DashboardStats = {
  products: number;
  activeProducts: number;
  pendingProducts: number;
  outOfStockProducts: number;
  orders: number;
  quotations: number;
  messages: number;
};

const initialStats: DashboardStats = {
  products: 0,
  activeProducts: 0,
  pendingProducts: 0,
  outOfStockProducts: 0,
  orders: 0,
  quotations: 0,
  messages: 0,
};

export default function VendorDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [errorMessage, setErrorMessage] = useState("");

  const loadVendorDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const [
        profileResult,
        productsResult,
        ordersResult,
        quotationsResult,
        messagesResult,
      ] = await Promise.all([
        supabase
          .from("vendor_profiles")
          .select("*")
          .eq("id", user.id)
          .single(),

        supabase
          .from("supplier_products")
          .select("id, status, stock")
          .eq("supplier_id", user.id),

        supabase
          .from("marketplace_orders")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("vendor_id", user.id),

        supabase
          .from("vendor_quotations")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("vendor_id", user.id),

        supabase
          .from("vendor_messages")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("vendor_id", user.id),
      ]);

      if (profileResult.error || !profileResult.data) {
        console.error(
          "Vendor profile error:",
          profileResult.error
        );

        throw new Error(
          "تعذر تحميل بيانات المورد. تأكد أن الحساب مسجل كمورد."
        );
      }

      if (productsResult.error) {
        console.error(
          "Products loading error:",
          productsResult.error
        );
      }

      if (ordersResult.error) {
        console.error(
          "Orders loading error:",
          ordersResult.error
        );
      }

      if (quotationsResult.error) {
        console.error(
          "Quotations loading error:",
          quotationsResult.error
        );
      }

      if (messagesResult.error) {
        console.error(
          "Messages loading error:",
          messagesResult.error
        );
      }

      const products =
        (productsResult.data ?? []) as ProductSummary[];

      const activeProducts = products.filter((product) => {
        const status = product.status?.toLowerCase();

        return status === "approved" || status === "active";
      }).length;

      const pendingProducts = products.filter((product) => {
        return product.status?.toLowerCase() === "pending";
      }).length;

      const outOfStockProducts = products.filter((product) => {
        return (product.stock ?? 0) <= 0;
      }).length;

      setProfile(profileResult.data as VendorProfile);

      setStats({
        products: products.length,
        activeProducts,
        pendingProducts,
        outOfStockProducts,
        orders: ordersResult.count ?? 0,
        quotations: quotationsResult.count ?? 0,
        messages: messagesResult.count ?? 0,
      });
    } catch (error: unknown) {
      console.error("Vendor dashboard error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل لوحة تحكم المورد."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadVendorDashboard();
  }, [loadVendorDashboard]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-blue-700" />

          <span className="font-bold text-slate-700">
            Loading vendor dashboard...
          </span>
        </div>
      </main>
    );
  }

  if (errorMessage || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <Building2
            className="mx-auto text-red-600"
            size={40}
          />

          <h1 className="mt-4 text-2xl font-black text-slate-900">
            Vendor profile not found
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() => router.push("/supplier/register")}
            className="mt-6 rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            Register as Vendor
          </button>
        </div>
      </main>
    );
  }

  const isApproved =
    profile.account_status?.toLowerCase() === "approved";

  const companyName =
    profile.company_name_en?.trim() ||
    profile.company_name_ar?.trim() ||
    "Vendor";

  const country =
    profile.country_name?.trim() ||
    profile.country_code?.trim() ||
    "Not specified";

  const city =
    profile.city?.trim() ||
    "Not specified";

  const currency =
    profile.currency?.trim() ||
    "Not specified";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[270px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-950 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-400">
              <Store size={24} />
            </div>

            <div>
              <strong className="block text-lg">
                Health Nations
              </strong>

              <span className="text-sm text-slate-400">
                Vendor Dashboard
              </span>
            </div>
          </div>

          <nav className="mt-10 space-y-2">
            <SidebarItem
              icon={<BarChart3 size={19} />}
              active
              onClick={() => router.push("/vendor/dashboard")}
            >
              Dashboard
            </SidebarItem>

            <SidebarItem
              icon={<Store size={19} />}
              onClick={() => router.push("/vendor/store-settings")}
            >
              Store Settings
            </SidebarItem>

            <SidebarItem
              icon={<Package size={19} />}
              onClick={() => router.push("/vendor/products")}
            >
              Products
            </SidebarItem>

            <SidebarItem
              icon={<Boxes size={19} />}
              onClick={() => router.push("/vendor/products")}
            >
              Inventory
            </SidebarItem>

            <SidebarItem
              icon={<ShoppingCart size={19} />}
              onClick={() => router.push("/vendor/orders")}
            >
              Orders
            </SidebarItem>

            <SidebarItem
              icon={<FileText size={19} />}
              onClick={() => router.push("/vendor/quotations")}
            >
              Quotations
            </SidebarItem>

            <SidebarItem
              icon={<MessageSquare size={19} />}
              onClick={() => router.push("/vendor/messages")}
            >
              Messages
            </SidebarItem>

            <SidebarItem
              icon={<Settings size={19} />}
              onClick={() => router.push("/vendor/settings")}
            >
              Settings
            </SidebarItem>
          </nav>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-10 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </aside>

        <section className="p-5 md:p-8">
          <header className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                Vendor Portal
              </p>

              <h1 className="mt-1 text-3xl font-black">
                {companyName}
              </h1>

              {profile.company_name_ar && (
                <p
                  className="mt-1 text-slate-600"
                  dir="rtl"
                >
                  {profile.company_name_ar}
                </p>
              )}
            </div>

            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <CheckCircle2 size={17} />

              {isApproved
                ? "Approved | تم اعتماد الحساب"
                : "Pending Review | قيد المراجعة"}
            </div>
          </header>

          {!isApproved && (
            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <strong className="block text-lg">
                حسابك ما زال قيد المراجعة
              </strong>

              <p className="mt-2 leading-7">
                يمكنك تجهيز بيانات متجرك، لكن إضافة المنتجات
                ونشرها لن يكونا متاحين حتى توافق الإدارة على
                الحساب.
              </p>
            </div>
          )}

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Products"
              value={stats.products.toString()}
              subtitle="إجمالي المنتجات"
              icon={<Package size={23} />}
              onClick={() => router.push("/vendor/products")}
            />

            <StatCard
              title="Active Products"
              value={stats.activeProducts.toString()}
              subtitle="المنتجات النشطة"
              icon={<CheckCircle2 size={23} />}
              onClick={() => router.push("/vendor/products")}
            />

            <StatCard
              title="Orders"
              value={stats.orders.toString()}
              subtitle="طلبات المورد"
              icon={<ShoppingCart size={23} />}
              onClick={() => router.push("/vendor/orders")}
            />

            <StatCard
              title="Quotations"
              value={stats.quotations.toString()}
              subtitle="طلبات عروض الأسعار"
              icon={<FileText size={23} />}
              onClick={() => router.push("/vendor/quotations")}
            />

            <StatCard
              title="Pending Products"
              value={stats.pendingProducts.toString()}
              subtitle="في انتظار الاعتماد"
              icon={<FileText size={23} />}
              onClick={() => router.push("/vendor/products")}
            />

            <StatCard
              title="Out of Stock"
              value={stats.outOfStockProducts.toString()}
              subtitle="منتجات نفد مخزونها"
              icon={<Boxes size={23} />}
              onClick={() => router.push("/vendor/products")}
            />

            <StatCard
              title="Messages"
              value={stats.messages.toString()}
              subtitle="الرسائل"
              icon={<MessageSquare size={23} />}
              onClick={() => router.push("/vendor/messages")}
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black">
                    Complete Your Store
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    أكمل بيانات متجرك ليظهر بشكل احترافي
                  </p>
                </div>

                <Store className="text-blue-700" />
              </div>

              <div className="mt-6 space-y-4">
                <StoreTask
                  title="Choose your store URL"
                  arabicTitle="اختر رابط المتجر"
                  completed={Boolean(profile.store_slug)}
                />

                <StoreTask
                  title="Upload company logo"
                  arabicTitle="ارفع شعار المنشأة"
                  completed={Boolean(profile.logo_url)}
                />

                <StoreTask
                  title="Add store description"
                  arabicTitle="أضف نبذة عن المتجر"
                  completed={Boolean(profile.store_description)}
                />

                <StoreTask
                  title="Add WhatsApp number"
                  arabicTitle="أضف رقم واتساب"
                  completed={Boolean(profile.whatsapp_number)}
                />
              </div>

              <button
                type="button"
                onClick={() => router.push("/vendor/store-settings")}
                className="mt-6 w-full rounded-2xl bg-blue-700 px-5 py-4 font-bold text-white transition hover:bg-blue-800"
              >
                Complete Store Settings | إعداد المتجر
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black">
                Account Information
              </h2>

              <div className="mt-5 space-y-4 text-sm">
                <InfoRow
                  label="Account Type"
                  value={profile.account_type || "Not specified"}
                />

                <InfoRow
                  label="Country"
                  value={country}
                />

                <InfoRow
                  label="City"
                  value={city}
                />

                <InfoRow
                  label="Currency"
                  value={currency}
                />

                <InfoRow
                  label="Publishing"
                  value={
                    profile.can_publish_products
                      ? "Enabled"
                      : "Disabled"
                  }
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function SidebarItem({
  icon,
  children,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
        active
          ? "bg-blue-700 text-white"
          : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  onClick,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-3xl bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {title}
          </p>

          <strong className="mt-2 block text-3xl font-black">
            {value}
          </strong>

          <span className="mt-1 block text-sm text-slate-500">
            {subtitle}
          </span>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </button>
  );
}

function StoreTask({
  title,
  arabicTitle,
  completed,
}: {
  title: string;
  arabicTitle: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
      <div>
        <strong className="block text-sm">
          {title}
        </strong>

        <span className="mt-1 block text-sm text-slate-500">
          {arabicTitle}
        </span>
      </div>

      <span
        className={`rounded-full px-3 py-1 text-xs font-bold ${
          completed
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600"
        }`}
      >
        {completed ? "Completed" : "Required"}
      </span>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
      <span className="font-semibold text-slate-500">
        {label}
      </span>

      <strong className="text-right text-slate-900">
        {value}
      </strong>
    </div>
  );
}