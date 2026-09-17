"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  BookOpen,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  PackageSearch,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type SupplierProfile = {
  user_id: string;
  company_name_en: string | null;
  company_name_ar: string | null;
  slug: string;
  logo_url: string | null;
  verified: boolean | null;
};

type CatalogProduct = {
  id: number;
  supplier_id: string;
  name_en: string | null;
  name_ar: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  catalog_url: string | null;
  status: string | null;
  featured: boolean | null;
  created_at: string | null;
};

type CatalogProductWithSupplier = CatalogProduct & {
  supplier?: SupplierProfile;
};

export default function CatalogsPage() {
  const [products, setProducts] = useState<
    CatalogProduct[]
  >([]);

  const [suppliers, setSuppliers] = useState<
    SupplierProfile[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const loadCatalogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        {
          data: supplierData,
          error: supplierError,
        },
        {
          data: productData,
          error: productError,
        },
      ] = await Promise.all([
        supabase
          .from("supplier_profiles")
          .select(`
            user_id,
            company_name_en,
            company_name_ar,
            slug,
            logo_url,
            verified
          `),

        supabase
          .from("supplier_products")
          .select(`
            id,
            supplier_id,
            name_en,
            name_ar,
            category,
            brand,
            model,
            image_url,
            catalog_url,
            status,
            featured,
            created_at
          `)
          .eq("status", "approved")
          .not("catalog_url", "is", null)
          .order("featured", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          }),
      ]);

      if (supplierError) {
        throw supplierError;
      }

      if (productError) {
        throw productError;
      }

      const validProducts = (
        (productData ?? []) as CatalogProduct[]
      ).filter(
        (product) =>
          typeof product.catalog_url === "string" &&
          product.catalog_url.trim().length > 0
      );

      setSuppliers(
        (supplierData ?? []) as SupplierProfile[]
      );

      setProducts(validProducts);
    } catch (error: unknown) {
      console.error(
        "Catalog library loading error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load catalog library."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCatalogs();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadCatalogs]);

  const supplierMap = useMemo(() => {
    return new Map(
      suppliers.map((supplier) => [
        supplier.user_id,
        supplier,
      ])
    );
  }, [suppliers]);

  const catalogProducts =
    useMemo<CatalogProductWithSupplier[]>(() => {
      return products.map((product) => ({
        ...product,
        supplier: supplierMap.get(
          product.supplier_id
        ),
      }));
    }, [products, supplierMap]);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category?.trim())
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(new Set(values)).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    const terms = query
      .split(/\s+/)
      .filter((term) => term.length > 1);

    return catalogProducts.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (terms.length === 0) {
        return true;
      }

      const searchableText = [
        product.name_en,
        product.name_ar,
        product.brand,
        product.model,
        product.category,
        product.supplier?.company_name_en,
        product.supplier?.company_name_ar,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return terms.some((term) =>
        searchableText.includes(term)
      );
    });
  }, [
    catalogProducts,
    search,
    selectedCategory,
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-blue-100 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Health Nations
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                <BookOpen className="h-4 w-4" />
                Health Nations Catalog Library
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Digital Catalog Library
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
                Browse medical equipment catalogs,
                brochures and technical product
                information from suppliers on Health
                Nations.
              </p>

              <p
                className="mt-3 max-w-2xl text-lg leading-8 text-blue-100"
                dir="rtl"
              >
                تصفح كتالوجات الأجهزة الطبية والبروشورات
                والمعلومات الفنية للمنتجات والموردين على
                منصة صحة الأمم.
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-7 text-center backdrop-blur">
              <FileText className="mx-auto h-10 w-10 text-teal-300" />

              <p className="mt-4 text-4xl font-black">
                {products.length}
              </p>

              <p className="mt-1 text-sm text-blue-100">
                Available Catalogs
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-6 md:grid-cols-[1fr_auto] lg:px-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product, brand, model or supplier..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 outline-none focus:border-blue-500"
          >
            <option value="all">
              All Categories
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">
              Medical Catalogs
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {filteredProducts.length} catalog
              {filteredProducts.length === 1
                ? ""
                : "s"}{" "}
              found
            </p>
          </div>

          <Link
            href="/store"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            <PackageSearch className="h-4 w-4" />
            Browse Marketplace
          </Link>
        </div>

        {loading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-700" />

              <p className="mt-4 text-slate-500">
                Loading catalogs...
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700">
            <p className="font-black">
              Unable to load catalog library
            </p>

            <p className="mt-2 text-sm">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadCatalogs()
              }
              className="mt-5 rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <BookOpen className="mx-auto h-14 w-14 text-slate-300" />

            <h3 className="mt-5 text-2xl font-black text-slate-900">
              No catalogs found
            </h3>

            <p
              className="mx-auto mt-3 max-w-xl text-slate-500"
              dir="rtl"
            >
              لا توجد كتالوجات مطابقة للبحث حاليًا.
              الكتالوجات ستظهر هنا تلقائيًا عند إضافتها
              إلى المنتجات المعتمدة.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <CatalogCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function CatalogCard({
  product,
}: {
  product: CatalogProductWithSupplier;
}) {
  const productName =
    product.name_en ||
    product.name_ar ||
    "Medical Product";

  const supplierName =
    product.supplier?.company_name_en ||
    product.supplier?.company_name_ar ||
    "Medical Supplier";

  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <Link
        href={`/store/product/${product.id}`}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={productName}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-14 w-14 text-slate-300" />
            </div>
          )}

          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-xs font-black text-blue-700 shadow-sm">
              <FileText className="h-3.5 w-3.5" />
              Catalog
            </span>
          </div>
        </div>
      </Link>

      <div className="p-5">
        {product.category && (
          <p className="text-xs font-black uppercase tracking-wide text-blue-600">
            {product.category}
          </p>
        )}

        <Link
          href={`/store/product/${product.id}`}
        >
          <h3 className="mt-2 line-clamp-2 text-lg font-black text-slate-950 transition hover:text-blue-700">
            {productName}
          </h3>
        </Link>

        {product.name_ar &&
          product.name_en && (
            <p
              className="mt-1 line-clamp-1 text-sm text-slate-500"
              dir="rtl"
            >
              {product.name_ar}
            </p>
          )}

        {(product.brand || product.model) && (
          <p className="mt-3 text-sm font-medium text-slate-600">
            {[product.brand, product.model]
              .filter(Boolean)
              .join(" • ")}
          </p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
              {product.supplier?.logo_url ? (
                <img
                  src={
                    product.supplier.logo_url
                  }
                  alt={supplierName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5 text-slate-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {supplierName}
                </p>

                {product.supplier?.verified && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                )}
              </div>

              <p className="text-xs text-slate-500">
                Supplier
              </p>
            </div>
          </div>
        </div>

        {product.catalog_url && (
          <a
            href={product.catalog_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-800"
          >
            <FileText className="h-4 w-4" />
            View Catalog
            <ExternalLink className="h-4 w-4" />
          </a>
        )}

        <Link
          href={`/store/product/${product.id}`}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          <PackageSearch className="h-4 w-4" />
          View Product
        </Link>
      </div>
    </article>
  );
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message?: unknown }).message
    );
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}