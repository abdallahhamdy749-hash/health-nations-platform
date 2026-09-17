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
  Globe2,
  ImageIcon,
  Loader2,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Tag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const HEALTH_NATIONS_WHATSAPP = "966568697530";

type ProductKind =
  | "equipment"
  | "consumable"
  | "spare_part";

type PartCondition =
  | "new"
  | "refurbished"
  | "used";

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

  product_kind: ProductKind | null;

  name_en: string | null;
  name_ar: string | null;

  description_en: string | null;
  description_ar: string | null;

  category: string | null;
  brand: string | null;
  model: string | null;

  part_number: string | null;
  manufacturer: string | null;
  compatible_device: string | null;
  part_condition: PartCondition | null;

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

type ProductWithSupplier =
  SupplierProduct & {
    supplier?: SupplierProfile;
  };

type MarketplaceType =
  | "all"
  | "sale"
  | "rental"
  | "spare-parts";

function formatPrice(
  price: number | null,
  currency: string | null
): string {
  if (
    price === null ||
    price === undefined
  ) {
    return "Contact for price";
  }

  try {
    return `${new Intl.NumberFormat(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    ).format(price)} ${
      currency || "USD"
    }`;
  } catch {
    return `${price} ${
      currency || "USD"
    }`;
  }
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

/*
 * Structured spare-part detection is the main rule.
 *
 * Legacy text matching remains as a fallback because
 * products created before product_kind was introduced
 * may still have product_kind = equipment.
 */
function isSparePartProduct(
  product: ProductWithSupplier
) {
  if (
    product.product_kind ===
    "spare_part"
  ) {
    return true;
  }

  const text = [
    product.category,
    product.name_en,
    product.name_ar,
    product.description_en,
    product.description_ar,
  ]
    .filter(
      (value): value is string =>
        typeof value === "string"
    )
    .join(" ")
    .toLowerCase();

  const sparePartTerms = [
    "spare part",
    "spare parts",
    "medical spare",
    "equipment spare",
    "replacement part",
    "replacement parts",
    "قطع غيار",
    "قطعة غيار",
  ];

  return sparePartTerms.some(
    (term) => text.includes(term)
  );
}

function formatCondition(
  condition: PartCondition | null
) {
  if (condition === "new") {
    return "New";
  }

  if (condition === "refurbished") {
    return "Refurbished";
  }

  if (condition === "used") {
    return "Used";
  }

  return "";
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

  const [
    homepageSearch,
    setHomepageSearch,
  ] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("all");

  const [
    selectedCountry,
    setSelectedCountry,
  ] = useState("all");

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<MarketplaceType>("all");

  const whatsappRedirected =
    useRef(false);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const query =
          params
            .get("search")
            ?.trim() || "";

        const type = params
          .get("type")
          ?.trim()
          .toLowerCase();

        const country =
          params
            .get("country")
            ?.trim() || "";

        if (query) {
          setSearch(query);
          setHomepageSearch(query);
        }

        if (country) {
          setSelectedCountry(
            country
          );
        }

        if (type === "rental") {
          setSelectedType(
            "rental"
          );
        } else if (
          type === "sale"
        ) {
          setSelectedType("sale");
        } else if (
          type ===
            "spare-parts" ||
          type === "spareparts"
        ) {
          setSelectedType(
            "spare-parts"
          );
        } else {
          setSelectedType("all");
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
            .from(
              "supplier_profiles"
            )
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
            .from(
              "supplier_products"
            )
            .select(`
              id,
              supplier_id,
              product_kind,
              name_en,
              name_ar,
              description_en,
              description_ar,
              category,
              brand,
              model,
              part_number,
              manufacturer,
              compatible_device,
              part_condition,
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
            .eq(
              "status",
              "approved"
            )
            .order(
              "featured",
              {
                ascending: false,
              }
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),
        ]);

        if (supplierError) {
          throw supplierError;
        }

        if (productError) {
          throw productError;
        }

        setSuppliers(
          (supplierData ??
            []) as SupplierProfile[]
        );

        setProducts(
          (productData ??
            []) as SupplierProduct[]
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Marketplace loading error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load marketplace."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadMarketplace();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadMarketplace]);

  const supplierMap =
    useMemo(() => {
      return new Map(
        suppliers.map(
          (supplier) => [
            supplier.user_id,
            supplier,
          ]
        )
      );
    }, [suppliers]);

  const marketplaceProducts =
    useMemo<
      ProductWithSupplier[]
    >(() => {
      return products.map(
        (product) => ({
          ...product,
          supplier:
            supplierMap.get(
              product.supplier_id
            ),
        })
      );
    }, [
      products,
      supplierMap,
    ]);

  const countries =
    useMemo(() => {
      const countryMap =
        new Map<
          string,
          string
        >();

      suppliers.forEach(
        (supplier) => {
          const country =
            supplier.country?.trim();

          if (!country) {
            return;
          }

          const key =
            country.toLowerCase();

          if (
            !countryMap.has(key)
          ) {
            countryMap.set(
              key,
              country
            );
          }
        }
      );

      return Array.from(
        countryMap.values()
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [suppliers]);

  const categories =
    useMemo(() => {
      const values = products
        .map((product) =>
          product.category?.trim()
        )
        .filter(
          (
            category
          ): category is string =>
            Boolean(category)
        );

      return Array.from(
        new Set(values)
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [products]);

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      const searchTerms =
        normalizedSearch
          .split(/\s+/)
          .map((term) =>
            term.trim()
          )
          .filter(
            (term) =>
              term.length > 1
          );

      return marketplaceProducts
        .map((product) => {
          const supplier =
            product.supplier;

          const matchesCategory =
            selectedCategory ===
              "all" ||
            product.category ===
              selectedCategory;

          const supplierCountry =
            supplier?.country?.trim() ||
            "";

          const matchesCountry =
            selectedCountry ===
              "all" ||
            supplierCountry.toLowerCase() ===
              selectedCountry
                .trim()
                .toLowerCase();

          const matchesType =
            selectedType ===
              "all" ||
            (selectedType ===
              "sale" &&
              product.available_for_sale ===
                true) ||
            (selectedType ===
              "rental" &&
              product.available_for_rental ===
                true) ||
            (selectedType ===
              "spare-parts" &&
              isSparePartProduct(
                product
              ));

          if (
            !matchesCategory ||
            !matchesCountry ||
            !matchesType
          ) {
            return {
              product,
              score: -1,
            };
          }

          if (
            searchTerms.length ===
            0
          ) {
            return {
              product,
              score:
                product.featured
                  ? 1
                  : 0,
            };
          }

          const searchableValues =
            [
              product.name_en,
              product.name_ar,
              product.description_en,
              product.description_ar,
              product.brand,
              product.model,
              product.category,

              product.part_number,
              product.manufacturer,
              product.compatible_device,
              product.part_condition,

              supplier?.company_name_en,
              supplier?.company_name_ar,
              supplier?.country,
              supplier?.city,
            ]
              .filter(
                (
                  value
                ): value is string =>
                  typeof value ===
                    "string" &&
                  value.trim()
                    .length > 0
              )
              .map((value) =>
                value
                  .trim()
                  .toLowerCase()
              );

          let score = 0;

          for (const term of searchTerms) {
            for (const value of searchableValues) {
              if (
                value === term
              ) {
                score += 12;
                continue;
              }

              if (
                value.startsWith(
                  term
                )
              ) {
                score += 8;
                continue;
              }

              if (
                value.includes(
                  term
                )
              ) {
                score += 4;
              }
            }
          }

          const productNameValues =
            [
              product.name_en,
              product.name_ar,
            ]
              .filter(
                (
                  value
                ): value is string =>
                  typeof value ===
                    "string" &&
                  value.trim()
                    .length > 0
              )
              .map((value) =>
                value.toLowerCase()
              );

          const brandValue =
            product.brand
              ?.trim()
              .toLowerCase() ||
            "";

          const modelValue =
            product.model
              ?.trim()
              .toLowerCase() ||
            "";

          const partNumberValue =
            product.part_number
              ?.trim()
              .toLowerCase() ||
            "";

          const manufacturerValue =
            product.manufacturer
              ?.trim()
              .toLowerCase() ||
            "";

          const compatibleDeviceValue =
            product.compatible_device
              ?.trim()
              .toLowerCase() ||
            "";

          for (const term of searchTerms) {
            if (
              productNameValues.some(
                (name) =>
                  name.includes(
                    term
                  )
              )
            ) {
              score += 6;
            }

            if (
              brandValue &&
              brandValue.includes(
                term
              )
            ) {
              score += 7;
            }

            if (
              modelValue &&
              modelValue.includes(
                term
              )
            ) {
              score += 9;
            }

            if (
              manufacturerValue &&
              manufacturerValue.includes(
                term
              )
            ) {
              score += 10;
            }

            if (
              compatibleDeviceValue &&
              compatibleDeviceValue.includes(
                term
              )
            ) {
              score += 11;
            }

            if (
              partNumberValue &&
              partNumberValue.includes(
                term
              )
            ) {
              score += 20;
            }
          }

          /*
           * Exact Part Number gets the strongest
           * ranking in the marketplace.
           */
          if (
            partNumberValue &&
            normalizedSearch ===
              partNumberValue
          ) {
            score += 100;
          }

          const fullProductText =
            [
              product.name_en,
              product.name_ar,
              product.brand,
              product.model,
              product.category,
              product.part_number,
              product.manufacturer,
              product.compatible_device,
              supplier?.country,
              supplier?.city,
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

          if (
            product.featured
          ) {
            score += 1;
          }

          return {
            product,
            score,
          };
        })
        .filter(({ score }) =>
          searchTerms.length ===
          0
            ? score >= 0
            : score > 0
        )
        .sort(
          (a, b) =>
            b.score - a.score
        )
        .map(
          ({ product }) =>
            product
        );
    }, [
      marketplaceProducts,
      search,
      selectedCategory,
      selectedCountry,
      selectedType,
    ]);

  const sparePartsCount =
    useMemo(() => {
      return marketplaceProducts.filter(
        (product) =>
          isSparePartProduct(
            product
          )
      ).length;
    }, [
      marketplaceProducts,
    ]);

  const missingProductWhatsappUrl =
    useMemo(() => {
      const requestedProduct =
        search.trim();

      if (!requestedProduct) {
        return "";
      }

      const countryText =
        selectedCountry ===
        "all"
          ? "All Countries"
          : selectedCountry;

      return createWhatsAppUrl(
        HEALTH_NATIONS_WHATSAPP,
        `طلب منتج أو قطعة غيار من منصة صحة الأمم

المنتج / القطعة المطلوبة: ${requestedProduct}
الدولة / السوق: ${countryText}

نتيجة البحث: المنتج غير موجود حاليًا ضمن المنتجات المعروضة على المنصة.

أرغب في معرفة السعر وإمكانية التوفير عالميًا.

New Product / Spare Part Request
Search: ${requestedProduct}
Market: ${countryText}
Source: Health Nations Global Marketplace`
      );
    }, [
      search,
      selectedCountry,
    ]);

  useEffect(() => {
    if (
      loading ||
      errorMessage ||
      !homepageSearch ||
      filteredProducts.length >
        0 ||
      !missingProductWhatsappUrl ||
      whatsappRedirected.current
    ) {
      return;
    }

    whatsappRedirected.current =
      true;

    window.location.href =
      missingProductWhatsappUrl;
  }, [
    loading,
    errorMessage,
    homepageSearch,
    filteredProducts.length,
    missingProductWhatsappUrl,
  ]);

  const clearFilters = () => {
    setSearch("");
    setHomepageSearch("");
    setSelectedCategory("all");
    setSelectedCountry("all");
    setSelectedType("all");

    whatsappRedirected.current =
      false;
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                <Globe2 className="h-4 w-4" />
                Health Nations Global Marketplace
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Global Medical Equipment Marketplace
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Search medical equipment,
                consumables and spare parts
                by product name, brand, model,
                manufacturer or Part Number.
              </p>

              <p
                className="mt-2 max-w-2xl text-slate-400"
                dir="rtl"
              >
                ابحث عن الأجهزة الطبية
                والمستهلكات وقطع الغيار بالاسم
                أو الماركة أو الموديل أو الشركة
                المصنعة أو رقم القطعة Part Number.
              </p>

              {selectedCountry !==
                "all" && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100">
                  <Globe2 className="h-4 w-4" />
                  Market:{" "}
                  {selectedCountry}
                </div>
              )}

              {selectedType ===
                "rental" && (
                <div className="mt-6 ml-2 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100">
                  <Tag className="h-4 w-4" />
                  Medical Equipment Rental
                </div>
              )}

              {selectedType ===
                "sale" && (
                <div className="mt-6 ml-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100">
                  <ShoppingBag className="h-4 w-4" />
                  Medical Equipment For Sale
                </div>
              )}

              {selectedType ===
                "spare-parts" && (
                <div className="mt-6 ml-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100">
                  <Settings className="h-4 w-4" />
                  Medical Equipment Spare Parts
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/supplier/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  Become a Global Supplier
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/suppliers"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
                >
                  Browse Global Suppliers
                  <Building2 className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Products"
                value={products.length}
                icon={
                  <Package className="h-5 w-5" />
                }
              />

              <StatCard
                label="Suppliers"
                value={suppliers.length}
                icon={
                  <Building2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="Countries"
                value={countries.length}
                icon={
                  <Globe2 className="h-5 w-5" />
                }
              />

              <StatCard
                label="Spare Parts"
                value={
                  sparePartsCount
                }
                icon={
                  <Settings className="h-5 w-5" />
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-30 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) => {
                  setSearch(
                    event.target
                      .value
                  );

                  setHomepageSearch(
                    ""
                  );

                  whatsappRedirected.current =
                    false;
                }}
                placeholder="Search product name, Part Number, manufacturer, model..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={
                selectedCountry
              }
              onChange={(
                event
              ) => {
                setSelectedCountry(
                  event.target
                    .value
                );

                setHomepageSearch(
                  ""
                );

                whatsappRedirected.current =
                  false;
              }}
              className="min-w-[190px] rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                🌍 All Countries
              </option>

              {countries.map(
                (country) => (
                  <option
                    key={country}
                    value={country}
                  >
                    {country}
                  </option>
                )
              )}
            </select>

            <select
              value={
                selectedCategory
              }
              onChange={(
                event
              ) => {
                setSelectedCategory(
                  event.target
                    .value
                );

                setHomepageSearch(
                  ""
                );

                whatsappRedirected.current =
                  false;
              }}
              className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
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
              onChange={(
                event
              ) => {
                setSelectedType(
                  event.target
                    .value as MarketplaceType
                );

                setHomepageSearch(
                  ""
                );

                whatsappRedirected.current =
                  false;
              }}
              className="min-w-[180px] rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                All Products
              </option>

              <option value="sale">
                For Sale
              </option>

              <option value="rental">
                For Rental
              </option>

              <option value="spare-parts">
                Spare Parts
              </option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <Globe2 className="h-3.5 w-3.5" />

              {selectedCountry ===
              "all"
                ? "Global Marketplace"
                : selectedCountry}
            </span>

            {selectedType !==
              "all" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                {selectedType ===
                "sale"
                  ? "For Sale"
                  : selectedType ===
                      "rental"
                    ? "For Rental"
                    : "Spare Parts"}
              </span>
            )}

            {selectedCategory !==
              "all" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                {
                  selectedCategory
                }
              </span>
            )}

            {(search ||
              selectedCountry !==
                "all" ||
              selectedCategory !==
                "all" ||
              selectedType !==
                "all") && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="ml-auto text-xs font-bold text-blue-700 hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {selectedType ===
              "rental"
                ? "Medical Equipment Rental"
                : selectedType ===
                    "sale"
                  ? "Medical Equipment For Sale"
                  : selectedType ===
                      "spare-parts"
                    ? "Medical Equipment Spare Parts"
                    : selectedCountry !==
                        "all"
                      ? `Medical Products in ${selectedCountry}`
                      : "Global Marketplace Products"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {
                filteredProducts.length
              }{" "}
              product
              {filteredProducts.length ===
              1
                ? ""
                : "s"}{" "}
              found
            </p>

            {search.trim() && (
              <p className="mt-1 text-sm font-medium text-blue-700">
                Search: &quot;
                {search.trim()}
                &quot;
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
                Loading global
                marketplace...
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              Unable to load
              marketplace
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
          <EmptyMarketplace
            search={search}
            selectedType={
              selectedType
            }
            selectedCountry={
              selectedCountry
            }
            missingProductWhatsappUrl={
              missingProductWhatsappUrl
            }
          />
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

function EmptyMarketplace({
  search,
  selectedType,
  selectedCountry,
  missingProductWhatsappUrl,
}: {
  search: string;
  selectedType: MarketplaceType;
  selectedCountry: string;
  missingProductWhatsappUrl: string;
}) {
  const requestedProduct =
    search.trim();

  if (requestedProduct) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50">
          <Globe2 className="h-8 w-8 text-blue-700" />
        </div>

        <h3 className="mt-5 text-2xl font-black text-slate-900">
          المنتج غير موجود حاليًا
        </h3>

        <p
          className="mx-auto mt-3 max-w-xl text-slate-600"
          dir="rtl"
        >
          لم نجد &quot;
          <strong>
            {requestedProduct}
          </strong>
          &quot; ضمن المنتجات
          الحالية
          {selectedCountry !==
          "all"
            ? ` في ${selectedCountry}`
            : " في السوق العالمي"}
          . تواصل مع صحة الأمم
          وسنساعدك في البحث عنه
          وتوفيره.
        </p>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          Search by product name,
          Part Number, manufacturer
          or compatible device.
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
      </div>
    );
  }

  if (
    selectedType === "rental"
  ) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Tag className="mx-auto h-12 w-12 text-slate-300" />

        <h3 className="mt-4 text-xl font-bold text-slate-900">
          No rental equipment
          available
        </h3>

        <p
          className="mx-auto mt-2 max-w-lg text-slate-500"
          dir="rtl"
        >
          لا توجد معدات متاحة
          للتأجير حاليًا ضمن
          الفلاتر المحددة.
        </p>

        <a
          href={createWhatsAppUrl(
            HEALTH_NATIONS_WHATSAPP,
            `طلب تأجير معدات طبية من منصة صحة الأمم

السوق: ${
              selectedCountry ===
              "all"
                ? "Global"
                : selectedCountry
            }

أرغب في الاستفسار عن الأجهزة والمعدات الطبية المتاحة للتأجير.

Medical Equipment Rental Request
Source: Health Nations Global Marketplace`
          )}
          target="_blank"
          rel="noreferrer"
          className="mx-auto mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-bold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-5 w-5" />
          استفسار عن التأجير
        </a>
      </div>
    );
  }

  if (
    selectedType ===
    "spare-parts"
  ) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Settings className="mx-auto h-12 w-12 text-slate-300" />

        <h3 className="mt-4 text-xl font-bold text-slate-900">
          No spare parts found
        </h3>

        <p
          className="mx-auto mt-2 max-w-lg text-slate-500"
          dir="rtl"
        >
          لا توجد قطع غيار مطابقة
          للفلاتر الحالية. يمكنك
          البحث باسم القطعة أو رقم
          Part Number أو الجهاز
          المتوافق.
        </p>

        <a
          href={createWhatsAppUrl(
            HEALTH_NATIONS_WHATSAPP,
            `طلب قطعة غيار جهاز طبي

الدولة / السوق: ${
              selectedCountry ===
              "all"
                ? "جميع الدول"
                : selectedCountry
            }

أرغب في البحث عن قطعة غيار لجهاز طبي.

يرجى طلب:
- اسم الجهاز
- الشركة المصنعة
- الموديل
- Part Number إن وجد

Source: Health Nations Global Marketplace`
          )}
          target="_blank"
          rel="noreferrer"
          className="mx-auto mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-4 font-bold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-5 w-5" />
          اطلب قطعة غيار
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Package className="mx-auto h-12 w-12 text-slate-300" />

      <h3 className="mt-4 text-xl font-bold text-slate-900">
        No products found
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        No global marketplace
        products currently match
        your filters.
      </p>
    </div>
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

  const productName =
    product.name_en ||
    product.name_ar ||
    "Medical Product";

  const supplierName =
    supplier?.company_name_en ||
    supplier?.company_name_ar ||
    "Supplier";

  const supplierLocation = [
    supplier?.city,
    supplier?.country,
  ]
    .filter(Boolean)
    .join(", ");

  const sparePart =
    isSparePartProduct(
      product
    );

  const condition =
    formatCondition(
      product.part_condition
    );

  const whatsappUrl =
    createWhatsAppUrl(
      HEALTH_NATIONS_WHATSAPP,
      sparePart
        ? `استفسار عن قطعة غيار من منصة صحة الأمم

قطعة الغيار: ${productName}
رقم المنتج: ${product.id}
Part Number: ${product.part_number || "غير محدد"}
Manufacturer: ${product.manufacturer || product.brand || "غير محدد"}
Compatible Device: ${product.compatible_device || "غير محدد"}
Compatible Model: ${product.model || "غير محدد"}
Condition: ${condition || "غير محدد"}

المورد: ${supplierName}
دولة المورد: ${supplier?.country || "غير محدد"}

أرغب في معرفة السعر والتوفر والتفاصيل.

Medical Spare Part Inquiry
Product: ${productName}
Product ID: ${product.id}
Part Number: ${product.part_number || "Not specified"}
Manufacturer: ${product.manufacturer || product.brand || "Not specified"}
Compatible Device: ${product.compatible_device || "Not specified"}
Model: ${product.model || "Not specified"}
Supplier: ${supplierName}
Supplier Country: ${supplier?.country || "Not specified"}
Source: Health Nations Global Marketplace`
        : `استفسار عن منتج من منصة صحة الأمم

المنتج: ${productName}
رقم المنتج: ${product.id}
المورد: ${supplierName}
دولة المورد: ${supplier?.country || "غير محدد"}

أرغب في معرفة السعر والتوفر والتفاصيل.

Product Inquiry
Product: ${productName}
Product ID: ${product.id}
Supplier: ${supplierName}
Supplier Country: ${supplier?.country || "Not specified"}
Source: Health Nations Global Marketplace`
    );

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/store/product/${product.id}`}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {product.image_url ? (
            <img
              src={
                product.image_url
              }
              alt={productName}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              {sparePart ? (
                <Settings className="h-12 w-12 text-slate-300" />
              ) : (
                <ImageIcon className="h-12 w-12 text-slate-300" />
              )}
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

            {sparePart && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
                <Settings className="h-3 w-3" />
                Spare Part
              </span>
            )}
          </div>

          {supplier?.country && (
            <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <Globe2 className="h-3 w-3" />
              {supplier.country}
            </div>
          )}
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

        {sparePart ? (
          <div className="mt-4 space-y-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
            {product.part_number && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  Part No.
                </span>

                <strong className="break-all text-right text-slate-900">
                  {
                    product.part_number
                  }
                </strong>
              </div>
            )}

            {(product.manufacturer ||
              product.brand) && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  Manufacturer
                </span>

                <strong className="text-right text-slate-900">
                  {product.manufacturer ||
                    product.brand}
                </strong>
              </div>
            )}

            {product.compatible_device && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  Compatible
                </span>

                <strong className="text-right text-slate-900">
                  {
                    product.compatible_device
                  }
                </strong>
              </div>
            )}

            {product.model && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  Model
                </span>

                <strong className="text-right text-slate-900">
                  {product.model}
                </strong>
              </div>
            )}

            {condition && (
              <div className="flex items-start justify-between gap-3 text-sm">
                <span className="text-slate-500">
                  Condition
                </span>

                <strong className="text-right text-amber-800">
                  {condition}
                </strong>
              </div>
            )}
          </div>
        ) : (
          (product.brand ||
            product.model) && (
            <p className="mt-3 text-sm text-slate-500">
              {[
                product.brand,
                product.model,
              ]
                .filter(Boolean)
                .join(" • ")}
            </p>
          )
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
          {product.stock !==
            null && (
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

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          Contact Health Nations
        </a>

        {supplier && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                {supplier.logo_url ? (
                  <img
                    src={
                      supplier.logo_url
                    }
                    alt={
                      supplierName
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
                    {supplierName}
                  </p>

                  {supplier.verified && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                  )}
                </div>

                {supplierLocation && (
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                    <Globe2 className="h-3 w-3 shrink-0" />
                    {
                      supplierLocation
                    }
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

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    error instanceof Error
  ) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message?: unknown;
        }
      ).message
    );
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  return fallback;
}