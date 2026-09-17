"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Boxes,
  Edit3,
  Eye,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type ProductStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

type ProductKind =
  | "equipment"
  | "consumable"
  | "spare_part";

type Product = {
  id: number;
  supplier_id: string;

  product_kind: ProductKind | null;

  name_en: string;
  name_ar: string | null;

  category: string | null;
  brand: string | null;
  model: string | null;

  part_number: string | null;
  manufacturer: string | null;
  compatible_device: string | null;
  part_condition: string | null;

  image_url: string | null;

  sale_price: number | null;
  currency: string | null;
  stock: number | null;

  available_for_sale: boolean | null;
  available_for_rental: boolean | null;

  status: ProductStatus | null;
  created_at: string | null;
};

type TypeFilter =
  | "all"
  | ProductKind;

export default function VendorProductsPage() {
  const router = useRouter();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [typeFilter, setTypeFilter] =
    useState<TypeFilter>("all");

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } =
        await supabase
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
            sale_price,
            currency,
            stock,
            available_for_sale,
            available_for_rental,
            status,
            created_at
          `)
          .eq("supplier_id", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        throw new Error(
          `${error.message}${
            error.code
              ? ` — Code: ${error.code}`
              : ""
          }`
        );
      }

      setProducts(
        (data ?? []) as Product[]
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load your products."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const term =
      search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        [
          product.name_en,
          product.name_ar,
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
            .includes(term)
        );

      const matchesStatus =
        statusFilter === "all" ||
        product.status === statusFilter;

      const matchesType =
        typeFilter === "all" ||
        normalizeProductKind(
          product.product_kind
        ) === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    products,
    search,
    statusFilter,
    typeFilter,
  ]);

  async function deleteProduct(
    product: Product
  ) {
    const status =
      product.status ?? "draft";

    if (
      ![
        "draft",
        "pending",
        "rejected",
      ].includes(status)
    ) {
      setErrorMessage(
        "يمكن حذف المنتجات المسودة أو قيد المراجعة أو المرفوضة فقط."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `هل تريد حذف المنتج "${product.name_en}"؟`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(product.id);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { error } =
        await supabase
          .from("supplier_products")
          .delete()
          .eq("id", product.id)
          .eq(
            "supplier_id",
            user.id
          );

      if (error) {
        throw new Error(
          `${error.message}${
            error.code
              ? ` — Code: ${error.code}`
              : ""
          }`
        );
      }

      setProducts((current) =>
        current.filter(
          (item) =>
            item.id !== product.id
        )
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to delete the product."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  const totalProducts =
    products.length;

  const approvedProducts =
    products.filter(
      (product) =>
        product.status === "approved"
    ).length;

  const pendingProducts =
    products.filter(
      (product) =>
        product.status === "pending"
    ).length;

  const spareParts =
    products.filter(
      (product) =>
        normalizeProductKind(
          product.product_kind
        ) === "spare_part"
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        (product.stock ?? 0) === 0
    ).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/vendor/dashboard"
            )
          }
          className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        <header className="flex flex-col gap-5 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Global Vendor Dashboard
            </p>

            <h1 className="mt-1 text-3xl font-black">
              Products
            </h1>

            <p className="mt-2 text-slate-600">
              إدارة الأجهزة والمستهلكات وقطع الغيار والأسعار والمخزون.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void loadProducts()
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw size={19} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/vendor/products/new"
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white transition hover:bg-blue-800"
            >
              <Plus size={20} />
              Add Product | إضافة منتج
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Products"
            value={totalProducts}
            icon={<Package size={22} />}
          />

          <StatCard
            label="Approved"
            value={approvedProducts}
            icon={<Eye size={22} />}
          />

          <StatCard
            label="Pending"
            value={pendingProducts}
            icon={<Loader2 size={22} />}
          />

          <StatCard
            label="Spare Parts"
            value={spareParts}
            icon={<Settings size={22} />}
          />

          <StatCard
            label="Out of Stock"
            value={outOfStockProducts}
            icon={<Boxes size={22} />}
          />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <label className="relative block">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
                placeholder="Product, Part Number, Brand, Device..."
              />
            </label>

            <select
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(
                  event.target
                    .value as TypeFilter
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
                Medical Consumables
              </option>

              <option value="spare_part">
                Medical Spare Parts
              </option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="pending">
                Pending Review
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
            </select>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={20}
            />

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3">
              <Loader2 className="animate-spin text-blue-700" />

              <span className="font-bold text-slate-600">
                Loading products...
              </span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
                <Package size={30} />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No products found
              </h2>

              <p className="mt-2 max-w-md leading-7 text-slate-500">
                لا توجد منتجات مطابقة للبحث أو الفلاتر الحالية.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/vendor/products/new"
                  )
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white"
              >
                <Plus size={19} />
                Add Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-left">
                <thead className="bg-slate-50 text-sm text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold">
                      Product
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Type
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Part / Device
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Category
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Price
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Stock
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Status
                    </th>

                    <th className="px-6 py-4 font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(
                    (product) => {
                      const productKind =
                        normalizeProductKind(
                          product.product_kind
                        );

                      return (
                        <tr
                          key={product.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                                {product.image_url ? (
                                  <img
                                    src={
                                      product.image_url
                                    }
                                    alt={
                                      product.name_en
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : productKind ===
                                  "spare_part" ? (
                                  <Settings
                                    size={23}
                                    className="text-slate-400"
                                  />
                                ) : (
                                  <Package
                                    size={23}
                                    className="text-slate-400"
                                  />
                                )}
                              </div>

                              <div>
                                <strong className="block">
                                  {
                                    product.name_en
                                  }
                                </strong>

                                {product.name_ar && (
                                  <span
                                    className="mt-1 block text-sm text-slate-500"
                                    dir="rtl"
                                  >
                                    {
                                      product.name_ar
                                    }
                                  </span>
                                )}

                                <span className="mt-1 block text-xs text-slate-400">
                                  {product.brand ||
                                    product.manufacturer ||
                                    "No brand"}

                                  {product.model
                                    ? ` • ${product.model}`
                                    : ""}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <ProductKindBadge
                              kind={
                                productKind
                              }
                            />
                          </td>

                          <td className="px-6 py-4">
                            {productKind ===
                            "spare_part" ? (
                              <div className="space-y-1">
                                <strong className="block text-sm text-slate-900">
                                  {product.part_number ||
                                    "No Part Number"}
                                </strong>

                                {product.compatible_device && (
                                  <span className="block max-w-[220px] text-xs text-slate-500">
                                    For:{" "}
                                    {
                                      product.compatible_device
                                    }
                                  </span>
                                )}

                                {product.part_condition && (
                                  <span className="block text-xs font-bold capitalize text-blue-700">
                                    {
                                      product.part_condition
                                    }
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">
                                {product.model ||
                                  "—"}
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                              {product.category ||
                                "Uncategorized"}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-bold">
                            {product.available_for_sale &&
                            product.sale_price !==
                              null
                              ? `${Number(
                                  product.sale_price
                                ).toLocaleString()} ${
                                  product.currency ||
                                  ""
                                }`
                              : product.available_for_rental
                                ? "Rental"
                                : "Contact"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`font-bold ${
                                (product.stock ??
                                  0) > 0
                                  ? "text-emerald-700"
                                  : "text-red-600"
                              }`}
                            >
                              {product.stock ??
                                0}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge
                              status={
                                product.status ??
                                "draft"
                              }
                            />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/vendor/products/${product.id}`
                                  )
                                }
                                className="rounded-xl bg-slate-100 p-2.5 text-slate-700 transition hover:bg-slate-200"
                                aria-label="Preview product"
                              >
                                <Eye size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/vendor/products/${product.id}/edit`
                                  )
                                }
                                className="rounded-xl bg-blue-50 p-2.5 text-blue-700 transition hover:bg-blue-100"
                                aria-label="Edit product"
                              >
                                <Edit3 size={18} />
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  product.id
                                }
                                onClick={() =>
                                  void deleteProduct(
                                    product
                                  )
                                }
                                className="rounded-xl bg-red-50 p-2.5 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                aria-label="Delete product"
                              >
                                {deletingId ===
                                product.id ? (
                                  <Loader2
                                    size={18}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2
                                    size={18}
                                  />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
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
      "bg-emerald-100 text-emerald-800",
    spare_part:
      "bg-amber-100 text-amber-800",
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${styles[kind]}`}
    >
      {labels[kind]}
    </span>
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
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {label}
          </p>

          <strong className="mt-2 block text-3xl font-black">
            {value}
          </strong>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          {icon}
        </div>
      </div>
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
    draft:
      "bg-slate-100 text-slate-700",

    pending:
      "bg-amber-100 text-amber-800",

    approved:
      "bg-emerald-100 text-emerald-800",

    rejected:
      "bg-red-100 text-red-700",

    suspended:
      "bg-purple-100 text-purple-700",
  };

  const labels: Record<
    ProductStatus,
    string
  > = {
    draft: "Draft",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    suspended: "Suspended",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function normalizeProductKind(
  value: ProductKind | null
): ProductKind {
  if (
    value === "consumable" ||
    value === "spare_part"
  ) {
    return value;
  }

  return "equipment";
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