"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams } from "next/navigation";

import {
  AlertCircle,
  BadgeCheck,
  Boxes,
  Building2,
  ChevronRight,
  Globe2,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const HEALTH_NATIONS_WHATSAPP =
  "966568697530";

type ProductKind =
  | "equipment"
  | "consumable"
  | "spare_part";

type PartCondition =
  | "new"
  | "refurbished"
  | "used";

type ProductTypeFilter =
  | "all"
  | ProductKind;

type SupplierProfile = {
  user_id: string;
  company_name_en: string;
  company_name_ar: string | null;
  slug: string;
  country: string | null;
  city: string | null;
  supplier_type: string | null;
  description_en: string | null;
  description_ar: string | null;
  logo_url: string | null;
  cover_url: string | null;
  categories: string[] | null;
  status: string | null;
  verified: boolean | null;
};

type Product = {
  id: number;
  supplier_id: string;

  product_kind: ProductKind | null;

  name_en: string;
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
};

export default function PublicStorePage() {
  const params =
    useParams<{ slug: string }>();

  const slug =
    decodeURIComponent(params.slug);

  const [supplier, setSupplier] =
    useState<SupplierProfile | null>(
      null
    );

  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState("all");

  const [
    productTypeFilter,
    setProductTypeFilter,
  ] =
    useState<ProductTypeFilter>("all");

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadStore =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: supplierData,
          error: supplierError,
        } = await supabase
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
            supplier_type,
            description_en,
            description_ar,
            logo_url,
            cover_url,
            categories,
            status,
            verified
          `)
          .eq("slug", slug)
          .maybeSingle();

        if (supplierError) {
          throw new Error(
            `${supplierError.message}${
              supplierError.code
                ? ` — Code: ${supplierError.code}`
                : ""
            }`
          );
        }

        if (!supplierData) {
          throw new Error(
            "Store not found."
          );
        }

        const supplierProfile =
          supplierData as SupplierProfile;

        setSupplier(
          supplierProfile
        );

        const {
          data: productData,
          error: productError,
        } = await supabase
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
            featured
          `)
          .eq(
            "supplier_id",
            supplierProfile.user_id
          )
          .eq(
            "status",
            "approved"
          )
          .order("featured", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });

        if (productError) {
          throw new Error(
            `${productError.message}${
              productError.code
                ? ` — Code: ${productError.code}`
                : ""
            }`
          );
        }

        setProducts(
          (productData ??
            []) as Product[]
        );
      } catch (
        error: unknown
      ) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load this store."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [slug]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadStore();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStore]);

  const categories =
    useMemo(() => {
      const values = products
        .map((product) =>
          product.category?.trim()
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        );

      return Array.from(
        new Set(values)
      ).sort((a, b) =>
        a.localeCompare(b)
      );
    }, [products]);

  const equipmentCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            getEffectiveProductKind(
              product
            ) === "equipment"
        ).length,
      [products]
    );

  const consumablesCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            getEffectiveProductKind(
              product
            ) === "consumable"
        ).length,
      [products]
    );

  const sparePartsCount =
    useMemo(
      () =>
        products.filter(
          (product) =>
            getEffectiveProductKind(
              product
            ) === "spare_part"
        ).length,
      [products]
    );

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !normalizedSearch ||
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
            ].some((value) =>
              value
                ?.toLowerCase()
                .includes(
                  normalizedSearch
                )
            );

          const matchesCategory =
            categoryFilter ===
              "all" ||
            product.category ===
              categoryFilter;

          const effectiveKind =
            getEffectiveProductKind(
              product
            );

          const matchesType =
            productTypeFilter ===
              "all" ||
            effectiveKind ===
              productTypeFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesType
          );
        }
      );
    }, [
      products,
      search,
      categoryFilter,
      productTypeFilter,
    ]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-blue-700" />

          <span className="font-bold text-slate-700">
            Loading store...
          </span>
        </div>
      </main>
    );
  }

  if (!supplier) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto text-red-600"
            size={44}
          />

          <h1 className="mt-4 text-3xl font-black">
            Store not found
          </h1>

          <p className="mt-3 text-slate-600">
            {errorMessage}
          </p>

          <Link
            href="/store"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white"
          >
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const storeWhatsappUrl =
    createWhatsAppUrl(
      HEALTH_NATIONS_WHATSAPP,
      `استفسار عن متجر مورد من منصة صحة الأمم

المورد: ${supplier.company_name_en}
الدولة: ${supplier.country || "غير محدد"}

أرغب في الاستفسار عن المنتجات المتوفرة من هذا المورد والتنسيق من خلال صحة الأمم.

Supplier Store Inquiry
Supplier: ${supplier.company_name_en}
Country: ${supplier.country || "Not specified"}
Source: Health Nations Global Marketplace`
    );

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="relative min-h-[360px] overflow-hidden bg-slate-950">
        {supplier.cover_url ? (
          <img
            src={
              supplier.cover_url
            }
            alt={`${supplier.company_name_en} cover`}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900" />
        )}

        <div className="relative mx-auto flex min-h-[360px] max-w-7xl items-end px-4 py-10 md:px-8">
          <div className="flex w-full flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[30px] border-4 border-white bg-white shadow-xl">
                {supplier.logo_url ? (
                  <img
                    src={
                      supplier.logo_url
                    }
                    alt={
                      supplier.company_name_en
                    }
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2
                    size={48}
                    className="text-blue-700"
                  />
                )}
              </div>

              <div className="text-white">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-bold uppercase tracking-wider text-blue-300">
                    Health Nations
                    Global Supplier
                  </p>

                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                      <BadgeCheck
                        size={15}
                      />
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="mt-2 text-4xl font-black md:text-5xl">
                  {
                    supplier.company_name_en
                  }
                </h1>

                {supplier.company_name_ar && (
                  <p
                    className="mt-2 text-xl text-slate-200"
                    dir="rtl"
                  >
                    {
                      supplier.company_name_ar
                    }
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-300">
                  {(supplier.city ||
                    supplier.country) && (
                    <span className="inline-flex items-center gap-2">
                      <MapPin
                        size={17}
                      />

                      {[
                        supplier.city,
                        supplier.country,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(", ")}
                    </span>
                  )}

                  {supplier.supplier_type && (
                    <span className="inline-flex items-center gap-2">
                      <ShoppingBag
                        size={17}
                      />

                      {formatSupplierType(
                        supplier.supplier_type
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Globe2
                  size={18}
                />
                Global Marketplace
              </Link>

              <a
                href={
                  storeWhatsappUrl
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle
                  size={19}
                />
                Contact Health Nations
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              About the Store
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Company Information
            </h2>

            {supplier.description_en ? (
              <p className="mt-5 leading-8 text-slate-600">
                {
                  supplier.description_en
                }
              </p>
            ) : (
              <p className="mt-5 text-slate-500">
                No English
                description has been
                added yet.
              </p>
            )}

            {supplier.description_ar && (
              <p
                className="mt-5 border-t border-slate-100 pt-5 leading-8 text-slate-600"
                dir="rtl"
              >
                {
                  supplier.description_ar
                }
              </p>
            )}
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <MessageCircle
                size={22}
              />
            </div>

            <h2 className="mt-5 text-xl font-black">
              Need This
              Supplier&apos;s
              Products?
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Send your request to
              Health Nations. We will
              review it and coordinate
              with the supplier on your
              behalf.
            </p>

            <p
              dir="rtl"
              className="mt-4 leading-7 text-slate-500"
            >
              أرسل طلبك إلى صحة الأمم،
              وسنقوم بمراجعته والتنسيق
              مع المورد نيابةً عنك.
            </p>

            <a
              href={
                storeWhatsappUrl
              }
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle
                size={18}
              />
              Contact Health Nations
            </a>
          </aside>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StoreStat
            label="All Products"
            value={products.length}
            icon={
              <Package
                size={21}
              />
            }
          />

          <StoreStat
            label="Equipment"
            value={
              equipmentCount
            }
            icon={
              <Store
                size={21}
              />
            }
          />

          <StoreStat
            label="Consumables"
            value={
              consumablesCount
            }
            icon={
              <ShoppingBag
                size={21}
              />
            }
          />

          <StoreStat
            label="Spare Parts"
            value={
              sparePartsCount
            }
            icon={
              <Settings
                size={21}
              />
            }
          />
        </section>

        <section className="mt-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                  Product Catalog
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  Store Products
                </h2>

                <p className="mt-2 text-slate-500">
                  {
                    filteredProducts.length
                  }{" "}
                  of{" "}
                  {products.length}{" "}
                  approved product
                  {products.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="grid w-full gap-3 xl:w-auto xl:grid-cols-[320px_220px_210px]">
                <label className="relative block">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Product, Part Number, Device..."
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                  />
                </label>

                <select
                  value={
                    productTypeFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setProductTypeFilter(
                      event.target
                        .value as ProductTypeFilter
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">
                    All Product Types
                  </option>

                  <option value="equipment">
                    Medical Equipment
                  </option>

                  <option value="consumable">
                    Consumables
                  </option>

                  <option value="spare_part">
                    Spare Parts
                  </option>
                </select>

                <select
                  value={
                    categoryFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setCategoryFilter(
                      event.target
                        .value
                    )
                  }
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">
                    All Categories
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category
                        }
                        value={
                          category
                        }
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {filteredProducts.length ===
          0 ? (
            <div className="mt-6 flex min-h-72 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                {productTypeFilter ===
                "spare_part" ? (
                  <Settings
                    size={30}
                  />
                ) : (
                  <Package
                    size={30}
                  />
                )}
              </div>

              <h3 className="mt-5 text-2xl font-black">
                No products found
              </h3>

              <p className="mt-2 max-w-lg text-slate-500">
                There are currently
                no approved products
                matching your search
                and filters.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter(
                    "all"
                  );
                  setProductTypeFilter(
                    "all"
                  );
                }}
                className="mt-5 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={
                      product.id
                    }
                    product={
                      product
                    }
                    supplier={
                      supplier
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductCard({
  product,
  supplier,
}: {
  product: Product;
  supplier: SupplierProfile;
}) {
  const productKind =
    getEffectiveProductKind(
      product
    );

  const sparePart =
    productKind ===
    "spare_part";

  const condition =
    formatCondition(
      product.part_condition
    );

  const whatsappUrl =
    createWhatsAppUrl(
      HEALTH_NATIONS_WHATSAPP,
      sparePart
        ? `استفسار عن قطعة غيار من متجر مورد على منصة صحة الأمم

قطعة الغيار: ${product.name_en}
رقم المنتج: ${product.id}
Part Number: ${product.part_number || "غير محدد"}
Manufacturer: ${product.manufacturer || product.brand || "غير محدد"}
Compatible Device: ${product.compatible_device || "غير محدد"}
Compatible Model: ${product.model || "غير محدد"}
Condition: ${condition || "غير محدد"}

المورد: ${supplier.company_name_en}
دولة المورد: ${supplier.country || "غير محدد"}

أرغب في معرفة السعر والتوفر.

Medical Spare Part Inquiry
Product: ${product.name_en}
Product ID: ${product.id}
Part Number: ${product.part_number || "Not specified"}
Manufacturer: ${product.manufacturer || product.brand || "Not specified"}
Compatible Device: ${product.compatible_device || "Not specified"}
Model: ${product.model || "Not specified"}
Supplier: ${supplier.company_name_en}
Supplier Country: ${supplier.country || "Not specified"}
Source: Health Nations Supplier Store`
        : `استفسار عن منتج من متجر مورد على منصة صحة الأمم

المنتج: ${product.name_en}
رقم المنتج: ${product.id}
المورد: ${supplier.company_name_en}
دولة المورد: ${supplier.country || "غير محدد"}
Brand: ${product.brand || "غير محدد"}
Model: ${product.model || "غير محدد"}

أرغب في معرفة السعر والتوفر والتفاصيل.

Product Inquiry
Product: ${product.name_en}
Product ID: ${product.id}
Supplier: ${supplier.company_name_en}
Supplier Country: ${supplier.country || "Not specified"}
Source: Health Nations Supplier Store`
    );

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/store/product/${product.id}`}
        className="block"
      >
        <div className="relative flex h-60 items-center justify-center overflow-hidden bg-slate-100">
          {product.image_url ? (
            <img
              src={
                product.image_url
              }
              alt={
                product.name_en
              }
              className="h-full w-full object-cover transition duration-300 hover:scale-105"
            />
          ) : sparePart ? (
            <Settings
              size={56}
              className="text-slate-300"
            />
          ) : (
            <Package
              size={56}
              className="text-slate-300"
            />
          )}

          <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
            {product.featured && (
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                Featured
              </span>
            )}

            <ProductKindBadge
              kind={
                productKind
              }
            />
          </div>

          <span
            className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold ${
              (product.stock ??
                0) > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {(product.stock ??
              0) > 0
              ? "In Stock"
              : "Out of Stock"}
          </span>
        </div>
      </Link>

      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          {product.category ||
            "Medical Product"}
        </p>

        <Link
          href={`/store/product/${product.id}`}
          className="block"
        >
          <h3 className="mt-2 text-xl font-black transition hover:text-blue-700">
            {
              product.name_en
            }
          </h3>
        </Link>

        {product.name_ar && (
          <p
            className="mt-1 text-slate-500"
            dir="rtl"
          >
            {
              product.name_ar
            }
          </p>
        )}

        {sparePart ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            {product.part_number && (
              <ProductMeta
                label="Part No."
                value={
                  product.part_number
                }
              />
            )}

            {(product.manufacturer ||
              product.brand) && (
              <ProductMeta
                label="Manufacturer"
                value={
                  product.manufacturer ||
                  product.brand ||
                  ""
                }
              />
            )}

            {product.compatible_device && (
              <ProductMeta
                label="Compatible"
                value={
                  product.compatible_device
                }
              />
            )}

            {product.model && (
              <ProductMeta
                label="Model"
                value={
                  product.model
                }
              />
            )}

            {condition && (
              <ProductMeta
                label="Condition"
                value={
                  condition
                }
              />
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            {[
              product.brand,
              product.model,
            ]
              .filter(Boolean)
              .join(" • ") ||
              "Brand information unavailable"}
          </p>
        )}

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            {product.available_for_sale &&
            product.sale_price !==
              null ? (
              <>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Sale Price
                </p>

                <p className="mt-1 text-2xl font-black text-blue-700">
                  {Number(
                    product.sale_price
                  ).toLocaleString()}{" "}
                  {product.currency ||
                    ""}
                </p>
              </>
            ) : product.available_for_rental &&
              product.monthly_rental_price !==
                null ? (
              <>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Monthly Rental
                </p>

                <p className="mt-1 text-2xl font-black text-blue-700">
                  {Number(
                    product.monthly_rental_price
                  ).toLocaleString()}{" "}
                  {product.currency ||
                    ""}
                </p>
              </>
            ) : (
              <p className="text-lg font-black text-blue-700">
                Contact for price
              </p>
            )}
          </div>

          <div className="inline-flex items-center gap-2 text-sm font-bold text-slate-500">
            <Boxes
              size={17}
            />
            {product.stock ??
              0}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <Link
            href={`/store/product/${product.id}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 font-bold text-white transition hover:bg-blue-800"
          >
            View Product Details
            <ChevronRight
              size={18}
            />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-center font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle
              size={18}
            />

            {sparePart
              ? "Request Spare Part"
              : "Contact Health Nations"}
          </a>
        </div>
      </div>
    </article>
  );
}

function StoreStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black text-slate-950">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProductKindBadge({
  kind,
}: {
  kind: ProductKind;
}) {
  const styles: Record<
    ProductKind,
    string
  > = {
    equipment:
      "bg-blue-100 text-blue-800",
    consumable:
      "bg-cyan-100 text-cyan-800",
    spare_part:
      "bg-amber-500 text-white",
  };

  const labels: Record<
    ProductKind,
    string
  > = {
    equipment: "Equipment",
    consumable: "Consumable",
    spare_part: "Spare Part",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${styles[kind]}`}
    >
      {labels[kind]}
    </span>
  );
}

function ProductMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-slate-500">
        {label}
      </span>

      <strong className="break-words text-right text-slate-900">
        {value}
      </strong>
    </div>
  );
}

function getEffectiveProductKind(
  product: Product
): ProductKind {
  if (
    product.product_kind ===
      "spare_part" ||
    isLegacySparePart(
      product
    )
  ) {
    return "spare_part";
  }

  if (
    product.product_kind ===
    "consumable"
  ) {
    return "consumable";
  }

  return "equipment";
}

function isLegacySparePart(
  product: Product
) {
  const text = [
    product.category,
    product.name_en,
    product.name_ar,
    product.description_en,
    product.description_ar,
  ]
    .filter(
      (value): value is string =>
        typeof value ===
        "string"
    )
    .join(" ")
    .toLowerCase();

  const terms = [
    "spare part",
    "spare parts",
    "medical spare",
    "equipment spare",
    "replacement part",
    "replacement parts",
    "قطع غيار",
    "قطعة غيار",
  ];

  return terms.some((term) =>
    text.includes(term)
  );
}

function formatCondition(
  value: PartCondition | null
) {
  if (value === "new") {
    return "New";
  }

  if (
    value === "refurbished"
  ) {
    return "Refurbished";
  }

  if (value === "used") {
    return "Used";
  }

  return "";
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
      (
        error as {
          message?: unknown;
        }
      ).message
    );
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  return fallback;
}