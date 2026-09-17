"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProductStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "suspended";

type SupplierProfile = {
  user_id: string;
  company_name_en: string | null;
  company_name_ar: string | null;
  slug: string | null;
  verified: boolean | null;
};

type SupplierProduct = {
  id: number;
  supplier_id: string;
  name_en: string;
  name_ar: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
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

type ProductWithSupplier = SupplierProduct & {
  supplier: SupplierProfile | null;
};

type StatusFilter =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<
    ProductWithSupplier[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<
    number | null
  >(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("pending");

  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadProducts = useCallback(async () => {
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
            name_en,
            name_ar,
            category,
            brand,
            model,
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

      const supplierMap = new Map<
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
          supplierMap.get(product.supplier_id) ??
          null,
      }));

      setProducts(combinedProducts);
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
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProducts]);

  async function updateStatus(
    product: ProductWithSupplier,
    newStatus: "approved" | "rejected"
  ) {
    try {
      setUpdatingId(product.id);
      setErrorMessage("");
      setSuccessMessage("");

      const { error } = await supabase
        .from("supplier_products")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", product.id);

      if (error) {
        throw new Error(
          getSupabaseError(
            error,
            `Unable to ${newStatus} product.`
          )
        );
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                status: newStatus,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      setSuccessMessage(
        newStatus === "approved"
          ? `تم اعتماد المنتج: ${product.name_en}`
          : `تم رفض المنتج: ${product.name_en}`
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to update product status."
        )
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const normalizedStatus =
        product.status?.toLowerCase() || "draft";

      if (
        statusFilter !== "all" &&
        normalizedStatus !== statusFilter
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const supplierName =
        product.supplier?.company_name_en ||
        product.supplier?.company_name_ar ||
        "";

      const searchableText = [
        product.name_en,
        product.name_ar,
        product.category,
        product.brand,
        product.model,
        supplierName,
        String(product.id),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [products, search, statusFilter]);

  const pendingCount = products.filter(
    (product) =>
      product.status?.toLowerCase() ===
      "pending"
  ).length;

  const approvedCount = products.filter(
    (product) =>
      product.status?.toLowerCase() ===
      "approved"
  ).length;

  const rejectedCount = products.filter(
    (product) =>
      product.status?.toLowerCase() ===
      "rejected"
  ).length;

  const catalogCount = products.filter(
    (product) =>
      Boolean(product.catalog_url?.trim())
  ).length;

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
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold uppercase tracking-wider text-teal-400">
                Health Nations Admin
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-4xl">
                Product Approvals
              </h1>

              <p
                className="mt-3 max-w-2xl text-slate-300"
                dir="rtl"
              >
                راجع منتجات الموردين
                والكتالوجات قبل ظهورها
                للعملاء في المنصة.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadProducts()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-bold text-white transition hover:bg-teal-400 disabled:opacity-60"
            >
              <RefreshCw
                size={19}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={
              <Loader2 size={22} />
            }
          />

          <StatCard
            label="Approved"
            value={approvedCount}
            icon={
              <PackageCheck size={22} />
            }
          />

          <StatCard
            label="Rejected"
            value={rejectedCount}
            icon={
              <XCircle size={22} />
            }
          />

          <StatCard
            label="Catalogs"
            value={catalogCount}
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Supplier Products
              </h2>

              <p className="mt-1 text-slate-500">
                Review products before
                publishing them to the
                marketplace.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
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
                  placeholder="Search products..."
                  className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100 sm:w-72"
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

                <option value="all">
                  All Statuses
                </option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-slate-500">
              <Loader2 className="animate-spin" />
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center">
              <PackageCheck
                size={46}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-4 text-xl font-black">
                No products found
              </h3>

              <p className="mt-2 text-slate-500">
                There are no products
                matching this filter.
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
                      void updateStatus(
                        product,
                        "approved"
                      )
                    }
                    onReject={() =>
                      void updateStatus(
                        product,
                        "rejected"
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
}: {
  product: ProductWithSupplier;
  updating: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const supplierName =
    product.supplier?.company_name_ar ||
    product.supplier?.company_name_en ||
    "Unknown Supplier";

  const status =
    product.status?.toLowerCase() ||
    "draft";

  return (
    <article className="rounded-3xl border border-slate-200 p-5 md:p-6">
      <div className="grid gap-6 lg:grid-cols-[110px_1fr_auto] lg:items-center">
        <div className="flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {product.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image_url}
              alt={product.name_en}
              className="h-full w-full object-cover"
            />
          ) : (
            <PackageCheck
              size={34}
              className="text-slate-300"
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black">
              {product.name_ar ||
                product.name_en}
            </h3>

            <StatusBadge
              status={status}
            />
          </div>

          {product.name_ar && (
            <p className="mt-1 text-sm text-slate-500">
              {product.name_en}
            </p>
          )}

          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-3">
            <p>
              <strong>Product ID:</strong>{" "}
              {product.id}
            </p>

            <p>
              <strong>Supplier:</strong>{" "}
              {supplierName}
            </p>

            <p>
              <strong>Category:</strong>{" "}
              {product.category || "-"}
            </p>

            <p>
              <strong>Brand:</strong>{" "}
              {product.brand || "-"}
            </p>

            <p>
              <strong>Model:</strong>{" "}
              {product.model || "-"}
            </p>

            <p>
              <strong>Stock:</strong>{" "}
              {product.stock ?? 0}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={`/store/product/${product.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <ExternalLink size={17} />
              View Product
            </Link>

            {product.catalog_url && (
              <a
                href={product.catalog_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 font-bold text-blue-700"
              >
                <FileText size={17} />
                View Catalog PDF
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          {status !== "approved" && (
            <button
              type="button"
              disabled={updating}
              onClick={onApprove}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CheckCircle2
                  size={18}
                />
              )}

              Approve
            </button>
          )}

          {status !== "rejected" && (
            <button
              type="button"
              disabled={updating}
              onClick={onReject}
              className="inline-flex min-w-36 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <XCircle size={18} />
              )}

              Reject
            </button>
          )}
        </div>
      </div>
    </article>
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

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    pending:
      "bg-amber-100 text-amber-700",
    approved:
      "bg-emerald-100 text-emerald-700",
    rejected:
      "bg-red-100 text-red-700",
    draft:
      "bg-slate-100 text-slate-700",
    suspended:
      "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
        styles[status] ||
        "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
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

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}