"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Building2,
  CheckCircle2,
  ChevronRight,
  ImageIcon,
  Loader2,
  MessageCircle,
  Package,
  Search,
  ShoppingBag,
  Star,
  Store,
  Tag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const HEALTH_NATIONS_WHATSAPP = "966568697530";

type SupplierProfile = {
  user_id: string;
  company_name_en: string | null;
  company_name_ar: string | null;
  slug: string;
  country: string | null;
  city: string | null;
  logo_url: string | null;
  verified: boolean | null;
  status: string | null;
};

type SupplierProduct = {
  id: number;
  supplier_id: string;
  name_en: string | null;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  image_url: string | null;
  catalog_url: string | null;
  alibaba_url: string | null;
  sale_price: number | null;
  currency: string | null;
  minimum_order_quantity: number | null;
  stock: number | null;
  available_for_sale: boolean | null;
  available_for_rental: boolean | null;
  monthly_rental_price: number | null;
  status: string | null;
  featured: boolean | null;
  created_at: string | null;
};

type ProductWithSupplier = SupplierProduct & {
  supplier?: SupplierProfile;
};

function formatPrice(
  price: number | null,
  currency: string | null
): string {
  if (price === null || price === undefined) {
    return "Contact for price";
  }

  try {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(price)} ${currency || "SAR"}`;
  } catch {
    return `${price} ${currency || "SAR"}`;
  }
}

export default function StorePage() {
  const [products, setProducts] =
    useState<SupplierProduct[]>([]);

  const [suppliers, setSuppliers] =
    useState<SupplierProfile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [homepageSearch, setHomepageSearch] =
    useState("");

  const [selectedCategory, setSelectedCategory] =
    useState("all");

  const [selectedType, setSelectedType] = useState<
    "all" | "sale" | "rental"
  >("all");

  const whatsappRedirected =
    useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(
        window.location.search
      );

      const query =
        params.get("search")?.trim() || "";

      if (query) {
        setSearch(query);
        setHomepageSearch(query);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const loadMarketplace =
    useCallback(async () => {
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
              country,
              city,
              logo_url,
              verified,
              status
            `),

          supabase
            .from("supplier_products")
            .select(`
              id,
              supplier_id,
              name_en,
              name_ar,
              description_en,
              description_ar,
              category,
              brand,
              model,
              image_url,
              catalog_url,
              alibaba_url,
              sale_price,
              currency,
              minimum_order_quantity,
              stock,
              available_for_sale,
              available_for_rental,
              monthly_rental_price,
              status,
              featured,
              created_at
            `)
            .eq("status", "approved")
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

        setSuppliers(
          (supplierData ?? []) as SupplierProfile[]
        );

        setProducts(
          (productData ?? []) as SupplierProduct[]
        );
      } catch (error) {
        console.error(
          "Marketplace loading error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load marketplace."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMarketplace();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMarketplace]);

  const supplierMap = useMemo(() => {
    return new Map(
      suppliers.map((supplier) => [
        supplier.user_id,
        supplier,
      ])
    );
  }, [suppliers]);

  const marketplaceProducts =
    useMemo<ProductWithSupplier[]>(() => {
      return products.map((product) => ({
        ...product,
        supplier: supplierMap.get(
          product.supplier_id
        ),
      }));
    }, [products, supplierMap]);

  const categories = useMemo(() => {
    const values = products
      .map((product) =>
        product.category?.trim()
      )
      .filter(
        (category): category is string =>
          Boolean(category)
      );

    return Array.from(
      new Set(values)
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    const searchTerms = normalizedSearch
      .split(/\s+/)
      .map((term) => term.trim())
      .filter((term) => term.length > 1);

    return marketplaceProducts
      .map((product) => {
        const supplier =
          product.supplier;

        const matchesCategory =
          selectedCategory === "all" ||
          product.category ===
            selectedCategory;

        const matchesType =
          selectedType === "all" ||
          (selectedType === "sale" &&
            product.available_for_sale) ||
          (selectedType === "rental" &&
            product.available_for_rental);

        if (!matchesCategory || !matchesType) {
          return {
            product,
            score: -1,
          };
        }

        if (searchTerms.length === 0) {
          return {
            product,
            score: product.featured ? 1 : 0,
          };
        }

        const searchableValues = [
          product.name_en,
          product.name_ar,
          product.description_en,
          product.description_ar,
          product.brand,
          product.model,
          product.category,
          supplier?.company_name_en,
          supplier?.company_name_ar,
        ]
          .filter(
            (value): value is string =>
              typeof value === "string" &&
              value.trim().length > 0
          )
          .map((value) =>
            value.trim().toLowerCase()
          );

        let score = 0;

        for (const term of searchTerms) {
          for (const value of searchableValues) {
            if (value === term) {
              score += 12;
              continue;
            }

            if (value.startsWith(term)) {
              score += 8;
              continue;
            }

            if (value.includes(term)) {
              score += 4;
            }
          }
        }

        const productNameValues = [
          product.name_en,
          product.name_ar,
        ]
          .filter(
            (value): value is string =>
              typeof value === "string" &&
              value.trim().length > 0
          )
          .map((value) =>
            value.toLowerCase()
          );

        const brandValue =
          product.brand
            ?.trim()
            .toLowerCase() || "";

        const modelValue =
          product.model
            ?.trim()
            .toLowerCase() || "";

        for (const term of searchTerms) {
          if (
            productNameValues.some((name) =>
              name.includes(term)
            )
          ) {
            score += 6;
          }

          if (
            brandValue &&
            brandValue.includes(term)
          ) {
            score += 7;
          }

          if (
            modelValue &&
            modelValue.includes(term)
          ) {
            score += 9;
          }
        }

        const fullProductText = [
          product.name_en,
          product.name_ar,
          product.brand,
          product.model,
          product.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (
          normalizedSearch &&
          fullProductText.includes(
            normalizedSearch
          )
        ) {
          score += 20;
        }

        if (product.featured) {
          score += 1;
        }

        return {
          product,
          score,
        };
      })
      .filter(({ score }) =>
        searchTerms.length === 0
          ? score >= 0
          : score > 0
      )
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  }, [
    marketplaceProducts,
    search,
    selectedCategory,
    selectedType,
  ]);

  const saleCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.available_for_sale
      ).length,
    [products]
  );

  const rentalCount = useMemo(
    () =>
      products.filter(
        (product) =>
          product.available_for_rental
      ).length,
    [products]
  );

  const missingProductWhatsappUrl =
    useMemo(() => {
      const requestedProduct =
        search.trim();

      if (!requestedProduct) {
        return "";
      }

      return createWhatsAppUrl(
        HEALTH_NATIONS_WHATSAPP,
        `طلب منتج جديد من منصة صحة الأمم

المنتج المطلوب: ${requestedProduct}

نتيجة البحث: المنتج غير موجود حاليًا ضمن المنتجات المعروضة على المنصة.

أرغب في معرفة السعر وإمكانية التوفير.

New Product Request
Product: ${requestedProduct}
Source: Health Nations Marketplace`
      );
    }, [search]);

  useEffect(() => {
    if (
      loading ||
      errorMessage ||
      !homepageSearch ||
      filteredProducts.length > 0 ||
      !missingProductWhatsappUrl ||
      whatsappRedirected.current
    ) {
      return;
    }

    whatsappRedirected.current = true;

    window.location.href =
      missingProductWhatsappUrl;
  }, [
    loading,
    errorMessage,
    homepageSearch,
    filteredProducts.length,
    missingProductWhatsappUrl,
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                <Store className="h-4 w-4" />
                Health Nations Marketplace
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Medical Equipment Marketplace
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Discover medical equipment and
                supplies from healthcare suppliers
                in one marketplace.
              </p>

              <p
                className="mt-2 text-slate-400"
                dir="rtl"
              >
                اكتشف الأجهزة والمستلزمات الطبية من
                الموردين المسجلين في منصة صحة الأمم.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/supplier/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Become a Supplier
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/suppliers"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
                >
                  Browse Suppliers
                  <Building2 className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Products"
                value={products.length}
                icon={<Package className="h-5 w-5" />}
              />

              <StatCard
                label="Suppliers"
                value={suppliers.length}
                icon={<Building2 className="h-5 w-5" />}
              />

              <StatCard
                label="For Sale"
                value={saleCount}
                icon={<ShoppingBag className="h-5 w-5" />}
              />

              <StatCard
                label="For Rental"
                value={rentalCount}
                icon={<Tag className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(
                    event.target.value
                  );

                  setHomepageSearch("");

                  whatsappRedirected.current =
                    false;
                }}
                placeholder="Search products, brands, models or suppliers..."
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
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                All Categories
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>

            <select
              value={selectedType}
              onChange={(event) =>
                setSelectedType(
                  event.target.value as
                    | "all"
                    | "sale"
                    | "rental"
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                Sale & Rental
              </option>

              <option value="sale">
                For Sale
              </option>

              <option value="rental">
                For Rental
              </option>
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              Marketplace Products
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {filteredProducts.length} product
              {filteredProducts.length === 1
                ? ""
                : "s"}{" "}
              found
            </p>

            {search.trim() && (
              <p className="mt-1 text-sm font-medium text-blue-700">
                Search: &quot;{search.trim()}&quot;
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              void loadMarketplace()
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-3 text-slate-500">
                Loading marketplace...
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Unable to load marketplace
            </p>

            <p className="mt-2 text-sm">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadMarketplace()
              }
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length ===
          0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50">
              <Package className="h-8 w-8 text-blue-700" />
            </div>

            {search.trim() ? (
              <>
                <h3 className="mt-5 text-2xl font-black text-slate-900">
                  المنتج غير موجود حاليًا
                </h3>

                <p
                  className="mx-auto mt-3 max-w-xl text-slate-600"
                  dir="rtl"
                >
                  لم نجد &quot;
                  <strong>
                    {search.trim()}
                  </strong>
                  &quot; ضمن المنتجات الحالية.
                  تواصل مع صحة الأمم وسنساعدك في
                  توفيره.
                </p>

                <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
                  Product not listed? Health Nations
                  can help source it for you.
                </p>

                {missingProductWhatsappUrl && (
                  <a
                    href={
                      missingProductWhatsappUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mx-auto mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-black text-white transition hover:bg-emerald-700"
                  >
                    <MessageCircle className="h-5 w-5" />

                    طلب المنتج عبر واتساب
                  </a>
                )}
              </>
            ) : (
              <>
                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  No products found
                </h3>

                <p className="mx-auto mt-2 max-w-lg text-slate-500">
                  No marketplace products currently
                  match your filters.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <div className="flex items-center gap-2 text-slate-300">
        {icon}

        <span className="text-sm">
          {label}
        </span>
      </div>

      <p className="mt-3 text-3xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function ProductCard({
  product,
}: {
  product: ProductWithSupplier;
}) {
  const supplier =
    product.supplier;

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/store/product/${product.id}`}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={
                product.name_en ||
                product.name_ar ||
                "Medical product"
              }
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-slate-300" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Star className="h-3 w-3" />
                Featured
              </span>
            )}

            {product.available_for_rental && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                Rental
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-5">
        {product.category && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            {product.category}
          </p>
        )}

        <Link
          href={`/store/product/${product.id}`}
          className="block"
        >
          <h3 className="line-clamp-2 text-lg font-bold text-slate-950 transition hover:text-blue-700">
            {product.name_en ||
              product.name_ar ||
              "Medical Product"}
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

        {(product.brand ||
          product.model) && (
          <p className="mt-3 text-sm text-slate-500">
            {[
              product.brand,
              product.model,
            ]
              .filter(Boolean)
              .join(" • ")}
          </p>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          {product.available_for_sale && (
            <div>
              <p className="text-xs text-slate-500">
                Sale price
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {formatPrice(
                  product.sale_price,
                  product.currency
                )}
              </p>
            </div>
          )}

          {product.available_for_rental &&
            product.monthly_rental_price !==
              null && (
              <div className="mt-3 rounded-xl bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-600">
                  Monthly rental
                </p>

                <p className="mt-1 font-bold text-blue-900">
                  {formatPrice(
                    product.monthly_rental_price,
                    product.currency
                  )}
                </p>
              </div>
            )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
          {product.stock !== null && (
            <span>
              Stock:{" "}
              <strong className="text-slate-700">
                {product.stock}
              </strong>
            </span>
          )}

          {product.minimum_order_quantity !==
            null && (
            <span>
              MOQ:{" "}
              <strong className="text-slate-700">
                {
                  product.minimum_order_quantity
                }
              </strong>
            </span>
          )}
        </div>

        <Link
          href={`/store/product/${product.id}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          View Product Details

          <ChevronRight className="h-4 w-4" />
        </Link>

        {supplier && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {supplier.logo_url ? (
                  <img
                    src={supplier.logo_url}
                    alt={
                      supplier.company_name_en ||
                      supplier.company_name_ar ||
                      "Supplier"
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-5 w-5 text-slate-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {supplier.company_name_en ||
                      supplier.company_name_ar ||
                      "Supplier"}
                  </p>

                  {supplier.verified && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </div>

                {(supplier.city ||
                  supplier.country) && (
                  <p className="truncate text-xs text-slate-500">
                    {[
                      supplier.city,
                      supplier.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </div>

            {supplier.slug && (
              <Link
                href={`/store/${supplier.slug}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View Supplier Store

                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function createWhatsAppUrl(
  phone: string,
  message: string
) {
  const normalizedPhone =
    phone.replace(/\D/g, "");

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    message
  )}`;
}