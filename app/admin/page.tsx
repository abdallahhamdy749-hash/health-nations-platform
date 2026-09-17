"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Activity,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ExternalLink,
  FileText,
  Globe2,
  HeartPulse,
  Home,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Wrench,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

/* =========================================================
   TYPES
========================================================= */

type ProductKind =
  | "equipment"
  | "consumable"
  | "spare_part";

type SupplierProduct = {
  id: string | number;
  supplier_id: string | null;

  product_kind: ProductKind | null;

  name_en: string | null;
  name_ar: string | null;

  category: string | null;
  brand: string | null;
  model: string | null;

  part_number: string | null;
  manufacturer: string | null;
  compatible_device: string | null;
  part_condition: string | null;

  catalog_url: string | null;

  sale_price: number | null;
  currency: string | null;

  stock: number | null;

  status: string | null;
  featured: boolean | null;

  created_at: string | null;
};

type SupplierProfile = {
  user_id: string;

  company_name_en: string | null;
  company_name_ar: string | null;

  slug: string | null;
  country: string | null;

  status: string | null;
  verified: boolean | null;
};

type ProductWithSupplier =
  SupplierProduct & {
    supplier: SupplierProfile | null;
  };

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

type ServiceCount = {
  homecare: number | null;
  maintenance: number | null;
  importRequests: number | null;
  marketplaceInquiries: number | null;
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

/* =========================================================
   ADMIN PAGE
========================================================= */

export default function AdminPage() {
  const router = useRouter();

  const [
    accessState,
    setAccessState,
  ] = useState<AccessState>(
    "checking"
  );

  const [
    products,
    setProducts,
  ] = useState<
    ProductWithSupplier[]
  >([]);

  const [
    suppliers,
    setSuppliers,
  ] = useState<
    SupplierProfile[]
  >([]);

  const [
    serviceCount,
    setServiceCount,
  ] = useState<ServiceCount>({
    homecare: null,
    maintenance: null,
    importRequests: null,
    marketplaceInquiries: null,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionProductId,
    setActionProductId,
  ] = useState<
    string | number | null
  >(null);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

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
          console.error(
            "Admin access error:",
            adminError
          );

          setAccessState(
            "denied"
          );

          return false;
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
          "Admin authentication error:",
          error
        );

        setAccessState(
          "denied"
        );

        return false;
      }
    }, [router]);

  /* =======================================================
     SAFE TABLE COUNT
  ======================================================= */

  const getTableCount =
    useCallback(
      async (
        tableName: string
      ): Promise<
        number | null
      > => {
        try {
          const {
            count,
            error,
          } = await supabase
            .from(tableName)
            .select("*", {
              count: "exact",
              head: true,
            });

          if (error) {
            console.warn(
              `Unable to count ${tableName}:`,
              error.message
            );

            return null;
          }

          return count ?? 0;
        } catch (
          error: unknown
        ) {
          console.warn(
            `Unable to count ${tableName}:`,
            error
          );

          return null;
        }
      },
      []
    );

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [
          productsResult,
          suppliersResult,
          homecareCount,
          maintenanceCount,
          importCount,
          marketplaceInquiriesCount,
        ] =
          await Promise.all([
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
                category,
                brand,
                model,
                part_number,
                manufacturer,
                compatible_device,
                part_condition,
                catalog_url,
                sale_price,
                currency,
                stock,
                status,
                featured,
                created_at
              `)
              .order(
                "created_at",
                {
                  ascending: false,
                }
              ),

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
                status,
                verified
              `),

            getTableCount(
              "homecare_requests"
            ),

            getTableCount(
              "maintenance_requests"
            ),

            getTableCount(
              "import_requests"
            ),

            getTableCount(
              "marketplace_inquiries"
            ),
          ]);

        if (
          productsResult.error
        ) {
          throw productsResult.error;
        }

        if (
          suppliersResult.error
        ) {
          throw suppliersResult.error;
        }

        const supplierProfiles =
          (suppliersResult.data ??
            []) as SupplierProfile[];

        setSuppliers(
          supplierProfiles
        );

        const supplierMap =
          new Map<
            string,
            SupplierProfile
          >();

        supplierProfiles.forEach(
          (supplier) => {
            supplierMap.set(
              supplier.user_id,
              supplier
            );
          }
        );

        const supplierProducts =
          (productsResult.data ??
            []) as SupplierProduct[];

        const mergedProducts =
          supplierProducts.map(
            (product) => ({
              ...product,

              supplier:
                product.supplier_id
                  ? supplierMap.get(
                      product.supplier_id
                    ) ?? null
                  : null,
            })
          );

        setProducts(
          mergedProducts
        );

        setServiceCount({
          homecare:
            homecareCount,

          maintenance:
            maintenanceCount,

          importRequests:
            importCount,

          marketplaceInquiries:
            marketplaceInquiriesCount,
        });
      } catch (
        error: unknown
      ) {
        console.error(
          "Admin dashboard error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, [getTableCount]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void (async () => {
          const isAdmin =
            await checkAdminAccess();

          if (isAdmin) {
            await loadDashboard();
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
    loadDashboard,
  ]);

  /* =======================================================
     PRODUCT COUNTS
  ======================================================= */

  const approvedProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.status ===
            "approved"
        ),
      [products]
    );

  const pendingProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.status ===
            "pending"
        ),
      [products]
    );

  const rejectedProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.status ===
            "rejected"
        ),
      [products]
    );

  const catalogProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            typeof product.catalog_url ===
              "string" &&
            product.catalog_url
              .trim()
              .length > 0
        ),
      [products]
    );

  const spareParts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.product_kind ===
            "spare_part"
        ),
      [products]
    );

  /* =======================================================
     SUPPLIER COUNTS
  ======================================================= */

  const verifiedSuppliers =
    useMemo(
      () =>
        suppliers.filter(
          (supplier) =>
            supplier.verified ===
            true
        ),
      [suppliers]
    );

  const countries =
    useMemo(() => {
      const values =
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
        values
      ).size;
    }, [suppliers]);

  /* =======================================================
     UPDATE PRODUCT STATUS
  ======================================================= */

  const updateProductStatus =
    async (
      productId:
        | string
        | number,
      newStatus:
        | "approved"
        | "rejected"
    ) => {
      try {
        setActionProductId(
          productId
        );

        setErrorMessage("");

        const { error } =
          await supabase
            .from(
              "supplier_products"
            )
            .update({
              status:
                newStatus,
            })
            .eq(
              "id",
              productId
            );

        if (error) {
          throw error;
        }

        setProducts(
          (current) =>
            current.map(
              (product) =>
                product.id ===
                productId
                  ? {
                      ...product,
                      status:
                        newStatus,
                    }
                  : product
            )
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Product status error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error
          )
        );
      } finally {
        setActionProductId(
          null
        );
      }
    };

  /* =======================================================
     CHECKING ACCESS
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
     ACCESS DENIED
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
            له بالدخول إلى لوحة
            الإدارة.
          </p>

          <button
            type="button"
            onClick={() =>
              router.replace(
                "/"
              )
            }
            className="mt-7 rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
          >
            العودة للصفحة الرئيسية
          </button>
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

                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-300">
                  <Globe2
                    size={14}
                  />
                  Global Platform
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black md:text-4xl">
                Launch Control Center
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                مركز إدارة ومتابعة منصة
                Health Nations العالمية.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
              >
                <ExternalLink
                  size={18}
                />
                فتح المنصة
              </Link>

              <button
                type="button"
                onClick={() =>
                  void loadDashboard()
                }
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-bold text-white transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={19}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                تحديث البيانات
              </button>
            </div>
          </div>
        </header>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            حدث خطأ:{" "}
            {errorMessage}
          </div>
        )}

        {/* MAIN STATS */}

        <section className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            icon={<Store />}
            label="إجمالي الموردين"
            value={
              suppliers.length
            }
            detail={`${verifiedSuppliers.length} verified`}
          />

          <DashboardCard
            icon={<Boxes />}
            label="إجمالي المنتجات"
            value={
              products.length
            }
            detail={`${approvedProducts.length} approved`}
          />

          <DashboardCard
            icon={<Clock3 />}
            label="بانتظار الموافقة"
            value={
              pendingProducts.length
            }
            detail="Needs review"
            attention={
              pendingProducts.length >
              0
            }
          />

          <DashboardCard
            icon={<Settings />}
            label="قطع الغيار"
            value={
              spareParts.length
            }
            detail="Medical spare parts"
          />
        </section>

        {/* SERVICE STATS */}

        <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <DashboardCard
            icon={
              <MessageCircle />
            }
            label="استفسارات السوق"
            value={
              serviceCount.marketplaceInquiries ??
              "—"
            }
            detail="Marketplace inquiries"
            attention={
              (serviceCount.marketplaceInquiries ??
                0) > 0
            }
          />

          <DashboardCard
            icon={
              <HeartPulse />
            }
            label="طلبات Home Care"
            value={
              serviceCount.homecare ??
              "—"
            }
            detail="Service requests"
          />

          <DashboardCard
            icon={<Wrench />}
            label="طلبات الصيانة"
            value={
              serviceCount.maintenance ??
              "—"
            }
            detail="Maintenance & PPM"
          />

          <DashboardCard
            icon={<Truck />}
            label="طلبات الاستيراد"
            value={
              serviceCount.importRequests ??
              "—"
            }
            detail="Global sourcing"
          />

          <DashboardCard
            icon={<Globe2 />}
            label="دول الموردين"
            value={countries}
            detail="Global marketplace"
          />
        </section>

        {/* PLATFORM CONTROL */}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-7">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-700">
              Platform Control
            </p>

            <h2 className="mt-2 text-2xl font-black">
              إدارة أقسام المنصة
            </h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <ControlLink
              href="/admin/products"
              icon={
                <PackageCheck />
              }
              title="موافقات المنتجات"
              description={`${pendingProducts.length} pending`}
            />

            <ControlLink
              href="/admin/suppliers"
              icon={<Users />}
              title="إدارة الموردين"
              description={`${suppliers.length} suppliers`}
            />

            <ControlLink
              href="/admin/marketplace-inquiries"
              icon={
                <MessageCircle />
              }
              title="Marketplace Inquiries"
              description={`${
                serviceCount.marketplaceInquiries ??
                0
              } customer inquiries`}
            />

            <ControlLink
              href="/store"
              icon={
                <ShoppingBag />
              }
              title="Global Marketplace"
              description="Customer marketplace"
              external
            />

            <ControlLink
              href="/catalogs"
              icon={<FileText />}
              title="Catalog Library"
              description={`${catalogProducts.length} catalogs`}
              external
            />

            <ControlLink
              href="/admin/homecare-requests"
              icon={
                <HeartPulse />
              }
              title="Home Care"
              description="Manage requests"
            />

            <ControlLink
              href="/admin/maintenance-requests"
              icon={<Wrench />}
              title="Maintenance"
              description="PPM & maintenance"
            />

            <ControlLink
              href="/admin/import-requests"
              icon={<Truck />}
              title="Import Requests"
              description="Global sourcing"
            />

            <ControlLink
              href="/"
              icon={<Home />}
              title="Home Page"
              description="Public platform"
              external
            />
          </div>
        </section>

        {/* LAUNCH HEALTH */}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-wider text-emerald-700">
                Launch Health
              </p>

              <h2 className="mt-2 text-2xl font-black">
                حالة المحتوى الأساسي
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
              <Activity
                size={17}
              />
              Live database
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <HealthItem
              label="Approved Products"
              value={
                approvedProducts.length
              }
              healthy={
                approvedProducts.length >
                0
              }
            />

            <HealthItem
              label="Supplier Stores"
              value={
                suppliers.length
              }
              healthy={
                suppliers.length >
                0
              }
            />

            <HealthItem
              label="Catalogs"
              value={
                catalogProducts.length
              }
              healthy={
                catalogProducts.length >
                0
              }
            />

            <HealthItem
              label="Pending Reviews"
              value={
                pendingProducts.length
              }
              healthy={
                pendingProducts.length ===
                0
              }
              inverse
            />
          </div>

          {rejectedProducts.length >
            0 && (
            <p className="mt-5 text-sm text-slate-500">
              يوجد{" "}
              <strong>
                {
                  rejectedProducts.length
                }
              </strong>{" "}
              منتج مرفوض محفوظ في قاعدة
              البيانات.
            </p>
          )}
        </section>

        {/* PENDING PRODUCTS */}

        {pendingProducts.length >
          0 && (
          <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-black">
                  منتجات بانتظار الموافقة
                </h2>

                <p className="mt-1 text-slate-500">
                  راجع المنتجات قبل
                  ظهورها في الـGlobal
                  Marketplace.
                </p>
              </div>

              <Link
                href="/admin/products"
                className="inline-flex items-center gap-2 font-black text-blue-700"
              >
                إدارة كل المنتجات

                <ChevronLeft
                  size={18}
                />
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {pendingProducts
                .slice(0, 6)
                .map(
                  (product) => (
                    <ProductCard
                      key={
                        product.id
                      }
                      product={
                        product
                      }
                      busy={
                        actionProductId ===
                        product.id
                      }
                      onApprove={() =>
                        void updateProductStatus(
                          product.id,
                          "approved"
                        )
                      }
                      onReject={() =>
                        void updateProductStatus(
                          product.id,
                          "rejected"
                        )
                      }
                    />
                  )
                )}
            </div>

            {pendingProducts.length >
              6 && (
              <div className="mt-6 text-center">
                <Link
                  href="/admin/products"
                  className="inline-flex rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white"
                >
                  عرض باقي المنتجات
                </Link>
              </div>
            )}
          </section>
        )}

        {/* RECENT PRODUCTS */}

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black">
                أحدث منتجات الموردين
              </h2>

              <p className="mt-1 text-slate-500">
                آخر المنتجات المسجلة في
                المنصة.
              </p>
            </div>

            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 font-black text-blue-700"
            >
              عرض الكل

              <ChevronLeft
                size={18}
              />
            </Link>
          </div>

          {loading ? (
            <div className="py-14 text-center">
              <RefreshCw
                size={30}
                className="mx-auto animate-spin text-blue-700"
              />

              <p className="mt-4 text-slate-500">
                جاري تحميل البيانات...
              </p>
            </div>
          ) : products.length ===
            0 ? (
            <div className="py-14 text-center">
              <Boxes
                size={40}
                className="mx-auto text-slate-300"
              />

              <p className="mt-4 font-bold text-slate-600">
                لا توجد منتجات مسجلة.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-right">
                <thead>
                  <tr className="border-b border-slate-200 text-sm text-slate-500">
                    <th className="px-3 py-4">
                      المنتج
                    </th>

                    <th className="px-3 py-4">
                      النوع
                    </th>

                    <th className="px-3 py-4">
                      المورد
                    </th>

                    <th className="px-3 py-4">
                      الدولة
                    </th>

                    <th className="px-3 py-4">
                      Part / Model
                    </th>

                    <th className="px-3 py-4">
                      السعر
                    </th>

                    <th className="px-3 py-4">
                      المخزون
                    </th>

                    <th className="px-3 py-4">
                      الحالة
                    </th>

                    <th className="px-3 py-4">
                      عرض
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products
                    .slice(0, 12)
                    .map(
                      (product) => (
                        <tr
                          key={
                            product.id
                          }
                          className="border-b border-slate-100"
                        >
                          <td className="px-3 py-4">
                            <strong className="block">
                              {product.name_ar ||
                                product.name_en ||
                                "Unnamed Product"}
                            </strong>

                            {product.name_ar &&
                              product.name_en && (
                                <span className="mt-1 block text-xs text-slate-500">
                                  {
                                    product.name_en
                                  }
                                </span>
                              )}
                          </td>

                          <td className="px-3 py-4">
                            <ProductKindBadge
                              kind={
                                product.product_kind
                              }
                            />
                          </td>

                          <td className="px-3 py-4">
                            {product
                              .supplier
                              ?.company_name_ar ||
                              product
                                .supplier
                                ?.company_name_en ||
                              "غير معروف"}
                          </td>

                          <td className="px-3 py-4">
                            {product
                              .supplier
                              ?.country ||
                              "-"}
                          </td>

                          <td className="px-3 py-4">
                            {product.product_kind ===
                            "spare_part"
                              ? product.part_number ||
                                "-"
                              : product.model ||
                                "-"}
                          </td>

                          <td className="px-3 py-4 font-bold text-blue-700">
                            {product.sale_price !==
                            null
                              ? `${product.sale_price.toLocaleString()} ${
                                  product.currency ||
                                  "USD"
                                }`
                              : "حسب الطلب"}
                          </td>

                          <td className="px-3 py-4">
                            {product.stock ??
                              0}
                          </td>

                          <td className="px-3 py-4">
                            <StatusBadge
                              status={
                                product.status
                              }
                            />
                          </td>

                          <td className="px-3 py-4">
                            {product.status ===
                            "approved" ? (
                              <Link
                                href={`/store/product/${product.id}`}
                                target="_blank"
                                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                              >
                                فتح

                                <ExternalLink
                                  size={
                                    14
                                  }
                                />
                              </Link>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
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

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  busy,
  onApprove,
  onReject,
}: {
  product: ProductWithSupplier;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <strong className="text-xl">
            {product.name_ar ||
              product.name_en ||
              "Unnamed Product"}
          </strong>

          {product.name_ar &&
            product.name_en && (
              <p className="mt-1 text-sm text-slate-500">
                {
                  product.name_en
                }
              </p>
            )}
        </div>

        <StatusBadge
          status={
            product.status
          }
        />
      </div>

      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <p>
          <strong>
            المورد:
          </strong>{" "}
          {product.supplier
            ?.company_name_ar ||
            product.supplier
              ?.company_name_en ||
            "غير معروف"}
        </p>

        <p>
          <strong>
            الدولة:
          </strong>{" "}
          {product.supplier
            ?.country || "-"}
        </p>

        <p>
          <strong>
            النوع:
          </strong>{" "}
          {formatProductKind(
            product.product_kind
          )}
        </p>

        <p>
          <strong>
            الفئة:
          </strong>{" "}
          {product.category ||
            "-"}
        </p>

        {product.product_kind ===
        "spare_part" ? (
          <>
            <p>
              <strong>
                Part Number:
              </strong>{" "}
              {product.part_number ||
                "-"}
            </p>

            <p>
              <strong>
                Manufacturer:
              </strong>{" "}
              {product.manufacturer ||
                product.brand ||
                "-"}
            </p>

            <p>
              <strong>
                Compatible Device:
              </strong>{" "}
              {product.compatible_device ||
                "-"}
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>
                الماركة:
              </strong>{" "}
              {product.brand ||
                "-"}
            </p>

            <p>
              <strong>
                الموديل:
              </strong>{" "}
              {product.model ||
                "-"}
            </p>
          </>
        )}
      </div>

      {product.catalog_url && (
        <a
          href={
            product.catalog_url
          }
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 font-bold text-blue-700 hover:underline"
        >
          <FileText
            size={17}
          />

          مراجعة الكتالوج

          <ExternalLink
            size={14}
          />
        </a>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy}
          onClick={onApprove}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? (
            <RefreshCw
              size={18}
              className="animate-spin"
            />
          ) : (
            <CheckCircle2
              size={18}
            />
          )}

          اعتماد المنتج
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={onReject}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <XCircle
            size={18}
          />

          رفض المنتج
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   CONTROL LINK
========================================================= */

function ControlLink({
  href,
  icon,
  title,
  description,
  external = false,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  external?: boolean;
}) {
  return (
    <Link
      href={href}
      target={
        external
          ? "_blank"
          : undefined
      }
      className="group rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
          {icon}
        </div>

        <ChevronLeft
          size={18}
          className="text-slate-300 transition group-hover:text-blue-700"
        />
      </div>

      <strong className="mt-4 block text-lg">
        {title}
      </strong>

      <span className="mt-1 block text-sm text-slate-500">
        {description}
      </span>
    </Link>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  icon,
  label,
  value,
  detail,
  attention = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail?: string;
  attention?: boolean;
}) {
  return (
    <article
      className={`rounded-3xl border p-6 shadow-sm ${
        attention
          ? "border-amber-200 bg-amber-50"
          : "border-transparent bg-white"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          attention
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700"
        }`}
      >
        {icon}
      </div>

      <strong className="mt-5 block text-3xl font-black">
        {value}
      </strong>

      <span className="mt-1 block font-bold text-slate-600">
        {label}
      </span>

      {detail && (
        <span className="mt-2 block text-xs text-slate-400">
          {detail}
        </span>
      )}
    </article>
  );
}

/* =========================================================
   HEALTH ITEM
========================================================= */

function HealthItem({
  label,
  value,
  healthy,
  inverse = false,
}: {
  label: string;
  value: number;
  healthy: boolean;
  inverse?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-slate-500">
          {label}
        </span>

        {healthy ? (
          <CheckCircle2
            size={20}
            className="text-emerald-600"
          />
        ) : inverse ? (
          <Clock3
            size={20}
            className="text-amber-600"
          />
        ) : (
          <XCircle
            size={20}
            className="text-red-500"
          />
        )}
      </div>

      <strong className="mt-3 block text-3xl font-black">
        {value}
      </strong>
    </div>
  );
}

/* =========================================================
   PRODUCT KIND
========================================================= */

function ProductKindBadge({
  kind,
}: {
  kind: ProductKind | null;
}) {
  if (
    kind === "spare_part"
  ) {
    return (
      <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
        Spare Part
      </span>
    );
  }

  if (
    kind === "consumable"
  ) {
    return (
      <span className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">
        Consumable
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
      Equipment
    </span>
  );
}

function formatProductKind(
  kind: ProductKind | null
) {
  if (
    kind === "spare_part"
  ) {
    return "Medical Spare Part";
  }

  if (
    kind === "consumable"
  ) {
    return "Medical Consumable";
  }

  return "Medical Equipment";
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
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
      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        Approved
      </span>
    );
  }

  if (
    normalized ===
    "rejected"
  ) {
    return (
      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
        Rejected
      </span>
    );
  }

  if (
    normalized ===
    "suspended"
  ) {
    return (
      <span className="inline-flex rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-700">
        Suspended
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
      Pending
    </span>
  );
}