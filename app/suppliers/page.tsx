"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  Loader2,
  MapPin,
  Search,
  Store,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type SupplierProfile = {
  user_id: string;
  company_name_en: string | null;
  company_name_ar: string | null;
  slug: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  supplier_type: string | null;
  description_en: string | null;
  description_ar: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  alibaba_url: string | null;
  categories: string[] | null;
  status: string | null;
  verified: boolean | null;
  created_at: string | null;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { data, error } = await supabase
        .from("supplier_profiles")
        .select(`
          user_id,
          company_name_en,
          company_name_ar,
          slug,
          contact_name,
          email,
          phone,
          country,
          city,
          address,
          supplier_type,
          description_en,
          description_ar,
          logo_url,
          cover_url,
          website_url,
          alibaba_url,
          categories,
          status,
          verified,
          created_at
        `)
        .order("verified", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setSuppliers((data ?? []) as SupplierProfile[]);
    } catch (error) {
      console.error("Suppliers loading error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load suppliers."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSuppliers();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSuppliers]);

  const countries = useMemo(() => {
    const values = suppliers
      .map((supplier) => supplier.country?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(values)).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [suppliers]);

  const supplierTypes = useMemo(() => {
    const values = suppliers
      .map((supplier) => supplier.supplier_type?.trim())
      .filter((value): value is string => Boolean(value));

    return Array.from(new Set(values)).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          supplier.company_name_en,
          supplier.company_name_ar,
          supplier.contact_name,
          supplier.country,
          supplier.city,
          supplier.supplier_type,
        ].some((value) =>
          value?.toLowerCase().includes(normalizedSearch)
        );

      const matchesCountry =
        countryFilter === "all" ||
        supplier.country === countryFilter;

      const matchesType =
        typeFilter === "all" ||
        supplier.supplier_type === typeFilter;

      return matchesSearch && matchesCountry && matchesType;
    });
  }, [
    suppliers,
    search,
    countryFilter,
    typeFilter,
  ]);

  const verifiedCount = useMemo(
    () =>
      suppliers.filter((supplier) => supplier.verified).length,
    [suppliers]
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                <Users className="h-4 w-4" />
                Health Nations Suppliers
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Medical Suppliers Directory
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Discover medical equipment suppliers, distributors,
                manufacturers and healthcare companies in one place.
              </p>

              <p className="mt-3 max-w-2xl text-slate-400" dir="rtl">
                اكتشف الموردين وشركات المعدات الطبية والموزعين والمصنعين
                المسجلين في منصة صحة الأمم.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  <Store className="h-4 w-4" />
                  Marketplace
                </Link>

                <Link
                  href="/supplier/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  <Building2 className="h-4 w-4" />
                  Become a Supplier
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Suppliers"
                value={suppliers.length}
              />

              <StatCard
                label="Verified"
                value={verifiedCount}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search suppliers, cities or countries..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={countryFilter}
              onChange={(event) =>
                setCountryFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                All Countries
              </option>

              {countries.map((country) => (
                <option
                  key={country}
                  value={country}
                >
                  {country}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                All Supplier Types
              </option>

              {supplierTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {formatSupplierType(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Registered Suppliers
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredSuppliers.length} supplier
              {filteredSuppliers.length === 1 ? "" : "s"} found
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadSuppliers()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-700" />

              <p className="mt-3 text-slate-500">
                Loading suppliers...
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">
              Unable to load suppliers
            </p>

            <p className="mt-2 text-sm">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadSuppliers()}
              className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-xl font-black text-slate-900">
              No suppliers found
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              No suppliers currently match your search and filters.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.user_id}
                supplier={supplier}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function SupplierCard({
  supplier,
}: {
  supplier: SupplierProfile;
}) {
  const supplierName =
    supplier.company_name_en ||
    supplier.company_name_ar ||
    "Medical Supplier";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800">
        {supplier.cover_url && (
          <img
            src={supplier.cover_url}
            alt={`${supplierName} cover`}
            className="h-full w-full object-cover opacity-40"
          />
        )}
      </div>

      <div className="relative px-6 pb-6">
        <div className="-mt-12 flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white shadow-md">
          {supplier.logo_url ? (
            <img
              src={supplier.logo_url}
              alt={supplierName}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-10 w-10 text-blue-700" />
          )}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-black text-slate-950">
              {supplierName}
            </h3>

            {supplier.verified && (
              <BadgeCheck className="h-5 w-5 shrink-0 text-blue-600" />
            )}
          </div>

          {supplier.company_name_ar &&
            supplier.company_name_en && (
              <p
                dir="rtl"
                className="mt-1 text-slate-500"
              >
                {supplier.company_name_ar}
              </p>
            )}

          {(supplier.city ||
            supplier.country) && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />

              {[
                supplier.city,
                supplier.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {supplier.supplier_type && (
            <p className="mt-2 text-sm font-bold text-blue-700">
              {formatSupplierType(
                supplier.supplier_type
              )}
            </p>
          )}

          {supplier.description_en && (
            <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
              {supplier.description_en}
            </p>
          )}

          {supplier.categories &&
            supplier.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {supplier.categories
                  .slice(0, 4)
                  .map((category) => (
                    <span
                      key={category}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                    >
                      {category}
                    </span>
                  ))}
              </div>
            )}

          <Link
            href={`/store/${supplier.slug}`}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
          >
            View Supplier Store
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <p className="text-sm text-slate-300">
        {label}
      </p>

      <p className="mt-3 text-3xl font-black text-white">
        {value}
      </p>
    </div>
  );
}

function formatSupplierType(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}