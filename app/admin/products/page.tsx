"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe2,
  Loader2,
  Package,
  PackageCheck,
  PauseCircle,
  RefreshCw,
  Search,
  Settings,
  Star,
  Tag,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ProductStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "suspended";

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
  slug: string | null;
  country: string | null;
  city: string | null;
  verified: boolean | null;
};

type SupplierProduct = {
  id: number;
  supplier_id: string;

  product_kind: ProductKind | null;

  name_en: string | null;
  name_ar: string | null;

  category: string | null;
  brand: string | null;
  model: string | null;

  part_number: string | null;
  manufacturer: string | null;
  compatible_device: string | null;
  part_condition: PartCondition | null;

  image_url: string | null;
  catalog_url: string | null;

  sale_price: number | null;
  currency: string | null;

  stock: number | null;

  available_for_sale: boolean | null;
  available_for_rental: boolean | null;

  monthly_rental_price: number | null;

  status: string | null;
  featured: boolean | null;

  created_at: string | null;
  updated_at: string | null;
};

type ProductWithSupplier =
  SupplierProduct & {
    supplier: SupplierProfile | null;
  };

type StatusFilter =
  | "all"
  | ProductStatus;

type KindFilter =
  | "all"
  | ProductKind;

export default function AdminProductsPage() {
  const [products, setProducts] =
    useState<ProductWithSupplier[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<StatusFilter>(
    "pending"
  );

  const [kindFilter, setKindFilter] =
    useState<KindFilter>("all");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          productsResult,
          suppliersResult,
        ] = await Promise.all([
          supabase
            .from("supplier_products")
            .select(`
              id,
              supplier_id,
              product_kind,
              name_en,
              name_ar,
              category,
              brand,
              model,
              part_number,
              manufacturer,
              compatible_device,
              part_condition,
              image_url,
              catalog_url,
              sale_price,
              currency,
              stock,
              available_for_sale,
              available_for_rental,
              monthly_rental_price,
              status,
              featured,
              created_at,
              updated_at
            `)
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("supplier_profiles")
            .select(`
              user_id,
              company_name_en,
              company_name_ar,
              slug,
              country,
              city,
              verified
            `),
        ]);

        if (productsResult.error) {
          throw new Error(
            getSupabaseError(
              productsResult.error,
              "Unable to load products."
            )
          );
        }

        if (suppliersResult.error) {
          throw new Error(
            getSupabaseError(
              suppliersResult.error,
              "Unable to load suppliers."
            )
          );
        }

        const supplierMap =
          new Map<
            string,
            SupplierProfile
          >();

        (
          (suppliersResult.data ??
            []) as SupplierProfile[]
        ).forEach((supplier) => {
          supplierMap.set(
            supplier.user_id,
            supplier
          );
        });

        const combinedProducts = (
          (productsResult.data ??
            []) as SupplierProduct[]
        ).map((product) => ({
          ...product,
          supplier:
            supplierMap.get(
              product.supplier_id
            ) ?? null,
        }));

        setProducts(
          combinedProducts
        );
      } catch (error: unknown) {
        setErrorMessage(
          getErrorMessage(
            error,
            "Unable to load products."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadProducts();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProducts]);

  async function updateProduct(
    product: ProductWithSupplier,
    values: {
      status?: ProductStatus;
      featured?: boolean;
    },
    successText: string
  ) {
    try {
      setUpdatingId(product.id);
      setErrorMessage("");
      setSuccessMessage("");

      const updatedAt =
        new Date().toISOString();

      const { error } =
        await supabase
          .from(
            "supplier_products"
          )
          .update({
            ...values,
            updated_at: updatedAt,
          })
          .eq("id", product.id);

      if (error) {
        throw new Error(
          getSupabaseError(
            error,
            "Unable to update product."
          )
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                ...values,
                updated_at:
                  updatedAt,
              }
            : item
        )
      );

      setSuccessMessage(
        successText
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to update product."
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return products.filter(
        (product) => {
          const status =
            normalizeStatus(
              product.status
            );

          const kind =
            getEffectiveProductKind(
              product
            );

          if (
            statusFilter !==
              "all" &&
            status !== statusFilter
          ) {
            return false;
          }

          if (
            kindFilter !== "all" &&
            kind !== kindFilter
          ) {
            return false;
          }

          if (!normalizedSearch) {
            return true;
          }

          const supplierName =
            [
              product.supplier
                ?.company_name_en,
              product.supplier
                ?.company_name_ar,
            ]
              .filter(Boolean)
              .join(" ");

          const searchableText = [
            String(product.id),
            product.name_en,
            product.name_ar,
            product.category,
            product.brand,
            product.model,
            product.part_number,
            product.manufacturer,
            product.compatible_device,
            product.part_condition,
            supplierName,
            product.supplier?.country,
            product.supplier?.city,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText.includes(
            normalizedSearch
          );
        }
      );
    }, [
      products,
      search,
      statusFilter,
      kindFilter,
    ]);

  const stats = useMemo(() => {
    return {
      total: products.length,

      pending: products.filter(
        (product) =>
          normalizeStatus(
            product.status
          ) === "pending"
      ).length,

      approved: products.filter(
        (product) =>
          normalizeStatus(
            product.status
          ) === "approved"
      ).length,

      rejected: products.filter(
        (product) =>
          normalizeStatus(
            product.status
          ) === "rejected"
      ).length,

      suspended: products.filter(
        (product) =>
          normalizeStatus(
            product.status
          ) === "suspended"
      ).length,

      spareParts: products.filter(
        (product) =>
          getEffectiveProductKind(
            product
          ) === "spare_part"
      ).length,

      featured: products.filter(
        (product) =>
          product.featured === true
      ).length,

      catalogs: products.filter(
        (product) =>
          Boolean(
            product.catalog_url?.trim()
          )
      ).length,
    };
  }, [products]);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={20} />
          Back to Admin Dashboard
        </Link>

        <header className="rounded-[32px] bg-slate-950 p-7 text-white shadow-sm md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-black uppercase tracking-wider text-teal-300">
                  Health Nations
                </span>

                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-300">
                  <Globe2 size={14} />
                  Global Marketplace
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black md:text-5xl">
                Product Management
              </h1>

              <p
                className="mt-3 max-w-3xl text-slate-300"
                dir="rtl"
              >
                إدارة واعتماد منتجات
                الموردين وقطع الغيار
                والكتالوجات قبل ظهورها
                في منصة صحة الأمم
                العالمية.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadProducts()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-black text-white transition hover:bg-teal-400 disabled:opacity-60"
            >
              <RefreshCw
                size={19}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh Products
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Products"
            value={stats.total}
            icon={
              <Package size={22} />
            }
          />

          <StatCard
            label="Pending Review"
            value={stats.pending}
            icon={
              <Loader2 size={22} />
            }
          />

          <StatCard
            label="Approved"
            value={stats.approved}
            icon={
              <PackageCheck
                size={22}
              />
            }
          />

          <StatCard
            label="Spare Parts"
            value={stats.spareParts}
            icon={
              <Settings size={22} />
            }
          />

          <StatCard
            label="Rejected"
            value={stats.rejected}
            icon={
              <XCircle size={22} />
            }
          />

          <StatCard
            label="Suspended"
            value={stats.suspended}
            icon={
              <PauseCircle
                size={22}
              />
            }
          />

          <StatCard
            label="Featured"
            value={stats.featured}
            icon={
              <Star size={22} />
            }
          />

          <StatCard
            label="Catalogs"
            value={stats.catalogs}
            icon={
              <FileText size={22} />
            }
          />
        </section>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <strong className="block">
                Something went wrong
              </strong>

              <p className="mt-1 break-words">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0"
            />

            <p className="font-bold">
              {successMessage}
            </p>
          </div>
        )}

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-black">
                Global Supplier Products
              </h2>

              <p className="mt-1 text-slate-500">
                Review, approve, suspend and
                feature supplier products
                across the marketplace.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search Product ID, name, Part Number, brand, supplier..."
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-700"
              >
                <option value="pending">
                  Pending
                </option>

                <option value="approved">
                  Approved
                </option>

                <option value="rejected">
                  Rejected
                </option>

                <option value="suspended">
                  Suspended
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="all">
                  All Statuses
                </option>
              </select>

              <select
                value={kindFilter}
                onChange={(event) =>
                  setKindFilter(
                    event.target
                      .value as KindFilter
                  )
                }
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-700"
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
            </div>

            <p className="text-sm text-slate-500">
              Showing{" "}
              <strong>
                {filteredProducts.length}
              </strong>{" "}
              of{" "}
              <strong>
                {products.length}
              </strong>{" "}
              products
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
              <Loader2 className="animate-spin" />
              Loading products...
            </div>
          ) : filteredProducts.length ===
            0 ? (
            <div className="py-20 text-center">
              <PackageCheck
                size={46}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-xl font-black">
                No products found
              </h3>

              <p className="mt-2 text-slate-500">
                No products match the
                selected filters.
              </p>
            </div>
          ) : (
            <div className="mt-7 space-y-4">
              {filteredProducts.map(
                (product) => (
                  <ProductReviewCard
                    key={product.id}
                    product={product}
                    updating={
                      updatingId ===
                      product.id
                    }
                    onApprove={() =>
                      void updateProduct(
                        product,
                        {
                          status:
                            "approved",
                        },
                        `تم اعتماد المنتج: ${
                          product.name_en ||
                          product.name_ar ||
                          product.id
                        }`
                      )
                    }
                    onReject={() =>
                      void updateProduct(
                        product,
                        {
                          status:
                            "rejected",
                          featured: false,
                        },
                        `تم رفض المنتج: ${
                          product.name_en ||
                          product.name_ar ||
                          product.id
                        }`
                      )
                    }
                    onSuspend={() =>
                      void updateProduct(
                        product,
                        {
                          status:
                            "suspended",
                          featured: false,
                        },
                        `تم إيقاف المنتج: ${
                          product.name_en ||
                          product.name_ar ||
                          product.id
                        }`
                      )
                    }
                    onToggleFeatured={() =>
                      void updateProduct(
                        product,
                        {
                          featured:
                            !product.featured,
                        },
                        product.featured
                          ? "تم إزالة المنتج من Featured."
                          : "تم إضافة المنتج إلى Featured."
                      )
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

function ProductReviewCard({
  product,
  updating,
  onApprove,
  onReject,
  onSuspend,
  onToggleFeatured,
}: {
  product: ProductWithSupplier;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onToggleFeatured: () => void;
}) {
  const supplierName =
    product.supplier
      ?.company_name_en ||
    product.supplier
      ?.company_name_ar ||
    "Unknown Supplier";

  const productName =
    product.name_en ||
    product.name_ar ||
    "Medical Product";

  const status =
    normalizeStatus(
      product.status
    );

  const kind =
    getEffectiveProductKind(
      product
    );

  const isSparePart =
    kind === "spare_part";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[120px_1fr_220px] xl:items-start">
        <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={productName}
              className="h-full w-full object-cover"
            />
          ) : isSparePart ? (
            <Settings
              size={38}
              className="text-slate-300"
            />
          ) : (
            <Package
              size={38}
              className="text-slate-300"
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-slate-950">
              {productName}
            </h3>

            <StatusBadge
              status={status}
            />

            <ProductKindBadge
              kind={kind}
            />

            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                <Star size={13} />
                Featured
              </span>
            )}
          </div>

          {product.name_ar &&
            product.name_en && (
              <p
                dir="rtl"
                className="mt-2 text-sm font-bold text-slate-500"
              >
                {product.name_ar}
              </p>
            )}

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Product ID"
              value={String(
                product.id
              )}
            />

            <InfoItem
              label="Supplier"
              value={supplierName}
            />

            <InfoItem
              label="Country"
              value={
                product.supplier
                  ?.country ||
                "Not specified"
              }
            />

            <InfoItem
              label="Category"
              value={
                product.category || "—"
              }
            />

            <InfoItem
              label="Brand"
              value={
                product.brand || "—"
              }
            />

            <InfoItem
              label="Model"
              value={
                product.model || "—"
              }
            />

            <InfoItem
              label="Stock"
              value={
                product.stock !== null
                  ? String(
                      product.stock
                    )
                  : "Not specified"
              }
            />

            <InfoItem
              label="Sale"
              value={
                product.available_for_sale
                  ? formatPrice(
                      product.sale_price,
                      product.currency
                    )
                  : "Not available"
              }
            />

            <InfoItem
              label="Rental"
              value={
                product.available_for_rental
                  ? formatPrice(
                      product.monthly_rental_price,
                      product.currency
                    )
                  : "Not available"
              }
            />
          </div>

          {isSparePart && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="mb-3 flex items-center gap-2 font-black text-amber-800">
                <Settings size={17} />
                Spare Part Information
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <InfoItem
                  label="Part Number"
                  value={
                    product.part_number ||
                    "Not specified"
                  }
                />

                <InfoItem
                  label="Manufacturer"
                  value={
                    product.manufacturer ||
                    product.brand ||
                    "Not specified"
                  }
                />

                <InfoItem
                  label="Compatible Device"
                  value={
                    product.compatible_device ||
                    "Not specified"
                  }
                />

                <InfoItem
                  label="Condition"
                  value={formatCondition(
                    product.part_condition
                  )}
                />
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            {status === "approved" && (
              <Link
                href={`/store/product/${product.id}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink
                  size={16}
                />
                View Product
              </Link>
            )}

            {product.supplier?.slug && (
              <Link
                href={`/store/${product.supplier.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Building2
                  size={16}
                />
                Supplier Store
              </Link>
            )}

            {product.catalog_url && (
              <a
                href={
                  product.catalog_url
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700"
              >
                <FileText
                  size={16}
                />
                Catalog PDF
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {status !== "approved" && (
            <ActionButton
              disabled={updating}
              onClick={onApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
              icon={
                <CheckCircle2
                  size={17}
                />
              }
              loading={updating}
            >
              Approve
            </ActionButton>
          )}

          {status !== "rejected" && (
            <ActionButton
              disabled={updating}
              onClick={onReject}
              className="bg-red-600 hover:bg-red-700"
              icon={
                <XCircle size={17} />
              }
              loading={updating}
            >
              Reject
            </ActionButton>
          )}

          {status === "approved" && (
            <ActionButton
              disabled={updating}
              onClick={onSuspend}
              className="bg-violet-600 hover:bg-violet-700"
              icon={
                <PauseCircle
                  size={17}
                />
              }
              loading={updating}
            >
              Suspend
            </ActionButton>
          )}

          {status === "approved" && (
            <ActionButton
              disabled={updating}
              onClick={
                onToggleFeatured
              }
              className={
                product.featured
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-slate-950 hover:bg-slate-800"
              }
              icon={
                <Star size={17} />
              }
              loading={updating}
            >
              {product.featured
                ? "Remove Featured"
                : "Make Featured"}
            </ActionButton>
          )}
        </div>
      </div>
    </article>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
  className,
  icon,
  loading,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
  className: string;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2
          size={17}
          className="animate-spin"
        />
      ) : (
        icon
      )}

      {children}
    </button>
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
    <article className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-500">
            {label}
          </span>

          <strong className="mt-2 block text-3xl font-black">
            {value}
          </strong>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          {icon}
        </div>
      </div>
    </article>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ProductStatus;
}) {
  const styles: Record<
    ProductStatus,
    string
  > = {
    pending:
      "bg-amber-100 text-amber-700",
    approved:
      "bg-emerald-100 text-emerald-700",
    rejected:
      "bg-red-100 text-red-700",
    draft:
      "bg-slate-100 text-slate-700",
    suspended:
      "bg-violet-100 text-violet-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ProductKindBadge({
  kind,
}: {
  kind: ProductKind;
}) {
  const labels: Record<
    ProductKind,
    string
  > = {
    equipment: "Equipment",
    consumable: "Consumable",
    spare_part: "Spare Part",
  };

  const styles: Record<
    ProductKind,
    string
  > = {
    equipment:
      "bg-blue-100 text-blue-700",
    consumable:
      "bg-cyan-100 text-cyan-700",
    spare_part:
      "bg-amber-100 text-amber-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${styles[kind]}`}
    >
      {kind === "spare_part" ? (
        <Settings size={12} />
      ) : (
        <Tag size={12} />
      )}

      {labels[kind]}
    </span>
  );
}

function normalizeStatus(
  value: string | null
): ProductStatus {
  if (
    value === "pending" ||
    value === "approved" ||
    value === "rejected" ||
    value === "draft" ||
    value === "suspended"
  ) {
    return value;
  }

  return "draft";
}

function getEffectiveProductKind(
  product: SupplierProduct
): ProductKind {
  if (
    product.product_kind ===
      "equipment" ||
    product.product_kind ===
      "consumable" ||
    product.product_kind ===
      "spare_part"
  ) {
    if (
      product.product_kind ===
      "spare_part"
    ) {
      return "spare_part";
    }

    /*
     * Legacy fallback:
     * old spare parts may have been
     * created before product_kind
     * was introduced.
     */
    const legacyText = [
      product.name_en,
      product.name_ar,
      product.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (
      legacyText.includes(
        "spare part"
      ) ||
      legacyText.includes(
        "قطع غيار"
      ) ||
      legacyText.includes(
        "قطعة غيار"
      )
    ) {
      return "spare_part";
    }

    return product.product_kind;
  }

  return "equipment";
}

function formatCondition(
  condition: PartCondition | null
) {
  if (condition === "new") {
    return "New";
  }

  if (
    condition === "refurbished"
  ) {
    return "Refurbished";
  }

  if (condition === "used") {
    return "Used";
  }

  return "Not specified";
}

function formatPrice(
  price: number | null,
  currency: string | null
) {
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

function getSupabaseError(
  error: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  },
  fallback: string
) {
  return [
    error.message || fallback,
    error.code
      ? `Code: ${error.code}`
      : "",
    error.details
      ? `Details: ${error.details}`
      : "",
    error.hint
      ? `Hint: ${error.hint}`
      : "",
  ]
    .filter(Boolean)
    .join(" — ");
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