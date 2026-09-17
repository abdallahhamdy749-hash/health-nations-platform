"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Store,
  Users,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

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
  updated_at: string | null;
  approved_at: string | null;
};

type SupplierProduct = {
  id: number;
  supplier_id: string | null;
  status: string | null;
};

type SupplierWithStats =
  SupplierProfile & {
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
  };

/* =========================================================
   HELPERS
========================================================= */

function getErrorMessage(
  error: unknown
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (
      typeof message === "string"
    ) {
      return message;
    }
  }

  if (
    typeof error === "string"
  ) {
    return error;
  }

  return "Unknown error";
}

function getSupplierName(
  supplier: SupplierProfile
) {
  return (
    supplier.company_name_ar ||
    supplier.company_name_en ||
    "Unnamed Supplier"
  );
}

function formatSupplierType(
  value: string | null
) {
  if (!value) {
    return "Supplier";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(date);
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminSuppliersPage() {
  const router = useRouter();

  const [
    accessState,
    setAccessState,
  ] = useState<AccessState>(
    "checking"
  );

  const [
    suppliers,
    setSuppliers,
  ] = useState<
    SupplierWithStats[]
  >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    actionSupplierId,
    setActionSupplierId,
  ] = useState<
    string | null
  >(null);

  /* =======================================================
     ADMIN ACCESS
  ======================================================= */

  const checkAdminAccess =
    useCallback(async () => {
      try {
        setAccessState(
          "checking"
        );

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          router.replace(
            "/login"
          );

          return false;
        }

        const {
          data: adminRecord,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (adminError) {
          throw adminError;
        }

        if (!adminRecord) {
          setAccessState(
            "denied"
          );

          return false;
        }

        setAccessState(
          "allowed"
        );

        return true;
      } catch (
        error: unknown
      ) {
        console.error(
          "Admin access error:",
          error
        );

        setAccessState(
          "denied"
        );

        return false;
      }
    }, [router]);

  /* =======================================================
     LOAD SUPPLIERS
  ======================================================= */

  const loadSuppliers =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          suppliersResult,
          productsResult,
        ] =
          await Promise.all([
            supabase
              .from(
                "supplier_profiles"
              )
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
                created_at,
                updated_at,
                approved_at
              `)
              .order(
                "created_at",
                {
                  ascending: false,
                }
              ),

            supabase
              .from(
                "supplier_products"
              )
              .select(`
                id,
                supplier_id,
                status
              `),
          ]);

        if (
          suppliersResult.error
        ) {
          throw suppliersResult.error;
        }

        if (
          productsResult.error
        ) {
          throw productsResult.error;
        }

        const supplierRows =
          (suppliersResult.data ??
            []) as SupplierProfile[];

        const productRows =
          (productsResult.data ??
            []) as SupplierProduct[];

        const merged =
          supplierRows.map(
            (supplier) => {
              const supplierProducts =
                productRows.filter(
                  (product) =>
                    product.supplier_id ===
                    supplier.user_id
                );

              return {
                ...supplier,

                totalProducts:
                  supplierProducts.length,

                approvedProducts:
                  supplierProducts.filter(
                    (product) =>
                      product.status ===
                      "approved"
                  ).length,

                pendingProducts:
                  supplierProducts.filter(
                    (product) =>
                      product.status ===
                      "pending"
                  ).length,
              };
            }
          );

        setSuppliers(
          merged
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Suppliers loading error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );

        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void (async () => {
          const allowed =
            await checkAdminAccess();

          if (allowed) {
            await loadSuppliers();
          } else {
            setLoading(false);
          }
        })();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    checkAdminAccess,
    loadSuppliers,
  ]);

  /* =======================================================
     COUNTS
  ======================================================= */

  const approvedCount =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.status ===
            "approved"
        ).length,
      [suppliers]
    );

  const pendingCount =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.status ===
            "pending"
        ).length,
      [suppliers]
    );

  const rejectedCount =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.status ===
            "rejected"
        ).length,
      [suppliers]
    );

  const verifiedCount =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.verified ===
            true
        ).length,
      [suppliers]
    );

  const countryCount =
    useMemo(() => {
      const countries =
        suppliers
          .map(
            (supplier) =>
              supplier.country?.trim()
          )
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          );

      return new Set(
        countries
      ).size;
    }, [suppliers]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredSuppliers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return suppliers.filter(
        (supplier) => {
          if (
            statusFilter !==
              "all" &&
            supplier.status !==
              statusFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const text = [
            supplier.company_name_en,
            supplier.company_name_ar,
            supplier.contact_name,
            supplier.email,
            supplier.phone,
            supplier.country,
            supplier.city,
            supplier.supplier_type,
          ]
            .filter(
              (
                value
              ): value is string =>
                typeof value ===
                "string"
            )
            .join(" ")
            .toLowerCase();

          return text.includes(
            query
          );
        }
      );
    }, [
      suppliers,
      search,
      statusFilter,
    ]);

  /* =======================================================
     UPDATE SUPPLIER
  ======================================================= */

  const updateSupplier =
    async (
      supplierId: string,
      changes: {
        status?: string;
        verified?: boolean;
        approved_at?:
          | string
          | null;
      }
    ) => {
      try {
        setActionSupplierId(
          supplierId
        );

        setErrorMessage("");

        const { error } =
          await supabase
            .from(
              "supplier_profiles"
            )
            .update(changes)
            .eq(
              "user_id",
              supplierId
            );

        if (error) {
          throw error;
        }

        setSuppliers(
          (current) =>
            current.map(
              (supplier) =>
                supplier.user_id ===
                supplierId
                  ? {
                      ...supplier,
                      ...changes,
                    }
                  : supplier
            )
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Supplier update error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );
      } finally {
        setActionSupplierId(
          null
        );
      }
    };

  const approveSupplier =
    (supplierId: string) => {
      void updateSupplier(
        supplierId,
        {
          status: "approved",
          approved_at:
            new Date().toISOString(),
        }
      );
    };

  const rejectSupplier =
    (supplierId: string) => {
      void updateSupplier(
        supplierId,
        {
          status: "rejected",
          verified: false,
          approved_at: null,
        }
      );
    };

  const toggleVerified =
    (
      supplier: SupplierWithStats
    ) => {
      void updateSupplier(
        supplier.user_id,
        {
          verified:
            !supplier.verified,
        }
      );
    };

  /* =======================================================
     CHECKING
  ======================================================= */

  if (
    accessState ===
    "checking"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <RefreshCw
            size={34}
            className="mx-auto animate-spin text-blue-700"
          />

          <h1 className="mt-5 text-xl font-black text-slate-900">
            جاري التحقق من
            صلاحية الإدارة...
          </h1>

          <p className="mt-2 text-slate-500">
            Health Nations Admin
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     DENIED
  ======================================================= */

  if (
    accessState ===
    "denied"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <ShieldAlert
              size={32}
            />
          </div>

          <h1 className="mt-6 text-2xl font-black text-slate-900">
            Access Denied
          </h1>

          <p className="mt-3 text-slate-500">
            هذا الحساب غير مصرح
            له بإدارة الموردين.
          </p>

          <Link
            href="/"
            className="mt-7 inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white"
          >
            العودة للمنصة
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-10"
    >
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <header className="overflow-hidden rounded-[32px] bg-slate-950 p-7 text-white md:p-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-teal-500/15 px-3 py-1 text-xs font-black text-teal-300">
                  HEALTH NATIONS
                </span>

                <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">
                  <Globe2
                    size={14}
                  />
                  Global Suppliers
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black md:text-4xl">
                إدارة الموردين
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                مراجعة واعتماد وإدارة
                الموردين المسجلين في
                منصة Health Nations.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
              >
                <ChevronLeft
                  size={18}
                />
                لوحة الإدارة
              </Link>

              <button
                type="button"
                onClick={() =>
                  void loadSuppliers()
                }
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-bold text-white transition hover:bg-teal-400 disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                تحديث
              </button>
            </div>
          </div>
        </header>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            حدث خطأ:{" "}
            {errorMessage}
          </div>
        )}

        {/* STATS */}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="كل الموردين"
            value={
              suppliers.length
            }
          />

          <StatCard
            label="Approved"
            value={
              approvedCount
            }
          />

          <StatCard
            label="Pending"
            value={
              pendingCount
            }
            attention={
              pendingCount > 0
            }
          />

          <StatCard
            label="Rejected"
            value={
              rejectedCount
            }
          />

          <StatCard
            label="Verified"
            value={
              verifiedCount
            }
          />

          <StatCard
            label="Countries"
            value={
              countryCount
            }
          />
        </section>

        {/* FILTERS */}

        <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                size={19}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="ابحث باسم الشركة، الدولة، المدينة، البريد..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-12 outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 font-bold outline-none"
            >
              <option value="all">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="approved">
                Approved
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </div>
        </section>

        {/* SUPPLIERS */}

        <section className="mt-7">
          {loading ? (
            <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
              <RefreshCw
                size={34}
                className="mx-auto animate-spin text-blue-700"
              />

              <p className="mt-4 text-slate-500">
                جاري تحميل
                الموردين...
              </p>
            </div>
          ) : filteredSuppliers.length ===
            0 ? (
            <div className="rounded-3xl bg-white py-20 text-center shadow-sm">
              <Users
                size={44}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-xl font-black">
                لا يوجد موردون
              </h2>

              <p className="mt-2 text-slate-500">
                لا توجد نتائج مطابقة
                للفلاتر الحالية.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {filteredSuppliers.map(
                (supplier) => (
                  <SupplierCard
                    key={
                      supplier.user_id
                    }
                    supplier={
                      supplier
                    }
                    busy={
                      actionSupplierId ===
                      supplier.user_id
                    }
                    onApprove={() =>
                      approveSupplier(
                        supplier.user_id
                      )
                    }
                    onReject={() =>
                      rejectSupplier(
                        supplier.user_id
                      )
                    }
                    onToggleVerified={() =>
                      toggleVerified(
                        supplier
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

/* =========================================================
   SUPPLIER CARD
========================================================= */

function SupplierCard({
  supplier,
  busy,
  onApprove,
  onReject,
  onToggleVerified,
}: {
  supplier: SupplierWithStats;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onToggleVerified: () => void;
}) {
  const supplierName =
    getSupplierName(
      supplier
    );

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
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
            <Building2 className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-black">
              {supplierName}
            </h2>

            {supplier.verified && (
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            )}
          </div>

          {supplier.company_name_ar &&
            supplier.company_name_en && (
              <p className="mt-1 text-sm text-slate-500">
                {
                  supplier.company_name_en
                }
              </p>
            )}

          <div className="mt-3 flex flex-wrap gap-2">
            <SupplierStatusBadge
              status={
                supplier.status
              }
            />

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {formatSupplierType(
                supplier.supplier_type
              )}
            </span>

            {supplier.verified && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InfoItem
          label="الدولة"
          value={
            supplier.country ||
            "-"
          }
          icon={
            <Globe2
              size={17}
            />
          }
        />

        <InfoItem
          label="المدينة"
          value={
            supplier.city ||
            "-"
          }
          icon={
            <MapPin
              size={17}
            />
          }
        />

        <InfoItem
          label="Contact"
          value={
            supplier.contact_name ||
            "-"
          }
        />

        <InfoItem
          label="تاريخ التسجيل"
          value={formatDate(
            supplier.created_at
          )}
        />
      </div>

      {/* PRODUCT STATS */}

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniStat
          label="Products"
          value={
            supplier.totalProducts
          }
        />

        <MiniStat
          label="Approved"
          value={
            supplier.approvedProducts
          }
        />

        <MiniStat
          label="Pending"
          value={
            supplier.pendingProducts
          }
        />
      </div>

      {/* ACTIONS */}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {supplier.status !==
          "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={
              onApprove
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? (
              <RefreshCw
                size={17}
                className="animate-spin"
              />
            ) : (
              <CheckCircle2
                size={17}
              />
            )}

            Approve
          </button>
        )}

        {supplier.status !==
          "rejected" && (
          <button
            type="button"
            disabled={busy}
            onClick={
              onReject
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
          >
            <XCircle
              size={17}
            />

            Reject
          </button>
        )}

        {supplier.status ===
          "approved" && (
          <button
            type="button"
            disabled={busy}
            onClick={
              onToggleVerified
            }
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition disabled:opacity-50 ${
              supplier.verified
                ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <CheckCircle2
              size={17}
            />

            {supplier.verified
              ? "Remove Verification"
              : "Verify Supplier"}
          </button>
        )}
      </div>

      {/* LINKS */}

      <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
        {supplier.slug &&
          supplier.status ===
            "approved" && (
            <Link
              href={`/store/${supplier.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 font-bold text-blue-700 hover:underline"
            >
              <Store
                size={17}
              />

              View Store

              <ExternalLink
                size={14}
              />
            </Link>
          )}

        <Link
          href={`/admin/products?supplier=${supplier.user_id}`}
          className="inline-flex items-center gap-2 font-bold text-slate-700 hover:text-blue-700"
        >
          <Building2
            size={17}
          />

          Supplier Products
        </Link>
      </div>
    </article>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-5 shadow-sm ${
        attention
          ? "border-amber-200 bg-amber-50"
          : "border-transparent bg-white"
      }`}
    >
      <strong className="block text-3xl font-black">
        {value}
      </strong>

      <span className="mt-2 block text-sm font-bold text-slate-500">
        {label}
      </span>
    </article>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <strong className="block text-xl font-black">
        {value}
      </strong>

      <span className="mt-1 block text-xs font-bold text-slate-500">
        {label}
      </span>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-2 break-words font-black text-slate-700">
        {value}
      </p>
    </div>
  );
}

function SupplierStatusBadge({
  status,
}: {
  status: string | null;
}) {
  const normalized =
    status?.toLowerCase() ||
    "pending";

  if (
    normalized ===
    "approved"
  ) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        Approved
      </span>
    );
  }

  if (
    normalized ===
    "rejected"
  ) {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        Rejected
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
      Pending
    </span>
  );
}