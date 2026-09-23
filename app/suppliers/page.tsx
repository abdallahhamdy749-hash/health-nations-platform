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
  ChevronLeft,
  ChevronRight,
  Globe2,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Store,
  Users,
} from "lucide-react";

import {
  Language,
  useLanguage,
} from "@/components/LanguageProvider";
import { supabase } from "@/lib/supabase";

type SupplierProfile = {
  user_id: string;
  company_name_en: string | null;
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
  created_at: string | null;
};

const translations = {
  en: {
    badge: "Health Nations Suppliers",
    title: "Global Medical Suppliers Directory",
    subtitle:
      "Discover medical equipment suppliers, distributors, manufacturers and healthcare companies from around the world.",
    marketplace: "Global Marketplace",
    becomeSupplier: "Become a Supplier",
    suppliers: "Suppliers",
    verified: "Verified",
    countries: "Countries",
    searchPlaceholder:
      "Search suppliers, cities, countries or categories...",
    allCountries: "All Countries",
    allTypes: "All Supplier Types",
    registeredSuppliers: "Registered Suppliers",
    found: "suppliers found",
    oneFound: "supplier found",
    refresh: "Refresh",
    loading: "Loading suppliers...",
    loadError: "Unable to load suppliers",
    tryAgain: "Try Again",
    noSuppliers: "No suppliers found",
    noSuppliersDescription:
      "No suppliers currently match your search and filters.",
    viewStore: "View Supplier Store",
    verifiedSupplier: "Verified Supplier",
    language: "Language",
    medicalSupplier: "Medical Supplier",
  },

  ar: {
    badge: "موردو صحة الأمم",
    title: "دليل الموردين الطبيين العالمي",
    subtitle:
      "اكتشف موردي الأجهزة والمستلزمات الطبية والموزعين والمصنعين وشركات الرعاية الصحية من مختلف دول العالم.",
    marketplace: "السوق العالمي",
    becomeSupplier: "سجل كمورد",
    suppliers: "الموردون",
    verified: "المعتمدون",
    countries: "الدول",
    searchPlaceholder:
      "ابحث باسم المورد أو المدينة أو الدولة أو التصنيف...",
    allCountries: "جميع الدول",
    allTypes: "جميع أنواع الموردين",
    registeredSuppliers: "الموردون المسجلون",
    found: "موردين",
    oneFound: "مورد واحد",
    refresh: "تحديث",
    loading: "جاري تحميل الموردين...",
    loadError: "تعذر تحميل الموردين",
    tryAgain: "إعادة المحاولة",
    noSuppliers: "لم يتم العثور على موردين",
    noSuppliersDescription:
      "لا يوجد موردون مطابقون لعملية البحث والفلاتر الحالية.",
    viewStore: "عرض متجر المورد",
    verifiedSupplier: "مورد معتمد",
    language: "اللغة",
    medicalSupplier: "مورد طبي",
  },

  zh: {
    badge: "Health Nations 供应商",
    title: "全球医疗供应商目录",
    subtitle:
      "发现来自世界各地的医疗设备供应商、经销商、制造商和医疗保健公司。",
    marketplace: "全球市场",
    becomeSupplier: "成为供应商",
    suppliers: "供应商",
    verified: "已认证",
    countries: "国家",
    searchPlaceholder:
      "搜索供应商、城市、国家或产品类别...",
    allCountries: "所有国家",
    allTypes: "所有供应商类型",
    registeredSuppliers: "注册供应商",
    found: "个供应商",
    oneFound: "个供应商",
    refresh: "刷新",
    loading: "正在加载供应商...",
    loadError: "无法加载供应商",
    tryAgain: "重试",
    noSuppliers: "未找到供应商",
    noSuppliersDescription:
      "当前没有符合搜索条件和筛选条件的供应商。",
    viewStore: "查看供应商商店",
    verifiedSupplier: "认证供应商",
    language: "语言",
    medicalSupplier: "医疗供应商",
  },

  tr: {
    badge: "Health Nations Tedarikçileri",
    title: "Küresel Medikal Tedarikçi Rehberi",
    subtitle:
      "Dünyanın dört bir yanındaki tıbbi cihaz tedarikçilerini, distribütörleri, üreticileri ve sağlık şirketlerini keşfedin.",
    marketplace: "Küresel Pazar",
    becomeSupplier: "Tedarikçi Ol",
    suppliers: "Tedarikçiler",
    verified: "Doğrulanmış",
    countries: "Ülkeler",
    searchPlaceholder:
      "Tedarikçi, şehir, ülke veya kategori ara...",
    allCountries: "Tüm Ülkeler",
    allTypes: "Tüm Tedarikçi Türleri",
    registeredSuppliers: "Kayıtlı Tedarikçiler",
    found: "tedarikçi bulundu",
    oneFound: "tedarikçi bulundu",
    refresh: "Yenile",
    loading: "Tedarikçiler yükleniyor...",
    loadError: "Tedarikçiler yüklenemedi",
    tryAgain: "Tekrar Dene",
    noSuppliers: "Tedarikçi bulunamadı",
    noSuppliersDescription:
      "Arama ve filtrelerinizle eşleşen tedarikçi bulunamadı.",
    viewStore: "Tedarikçi Mağazasını Gör",
    verifiedSupplier: "Doğrulanmış Tedarikçi",
    language: "Dil",
    medicalSupplier: "Medikal Tedarikçi",
  },
} satisfies Record<Language, Record<string, string>>;

export default function SuppliersPage() {
  const {
    language,
    setLanguage,
    isArabic,
  } = useLanguage();

  const t = translations[language];

  const [suppliers, setSuppliers] = useState<
    SupplierProfile[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] =
    useState("all");
  const [typeFilter, setTypeFilter] =
    useState("all");

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
          country,
          city,
          supplier_type,
          description_en,
          description_ar,
          logo_url,
          cover_url,
          categories,
          status,
          verified,
          created_at
        `)
        .eq("status", "approved")
        .order("verified", {
          ascending: false,
        })
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setSuppliers(
        (data ?? []) as SupplierProfile[]
      );
    } catch (error) {
      console.error(
        "Suppliers loading error:",
        error
      );

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

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadSuppliers]);

  const countries = useMemo(() => {
    const values = suppliers
      .map((supplier) =>
        supplier.country?.trim()
      )
      .filter(
        (value): value is string =>
          Boolean(value)
      );

    return Array.from(
      new Set(values)
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [suppliers]);

  const supplierTypes = useMemo(() => {
    const values = suppliers
      .map((supplier) =>
        supplier.supplier_type?.trim()
      )
      .filter(
        (value): value is string =>
          Boolean(value)
      );

    return Array.from(
      new Set(values)
    ).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [suppliers]);

  const filteredSuppliers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          supplier.company_name_en,
          supplier.company_name_ar,
          supplier.country,
          supplier.city,
          supplier.supplier_type,
          supplier.description_en,
          supplier.description_ar,
          ...(supplier.categories ?? []),
        ].some((value) =>
          value
            ?.toLowerCase()
            .includes(normalizedSearch)
        );

      const matchesCountry =
        countryFilter === "all" ||
        supplier.country === countryFilter;

      const matchesType =
        typeFilter === "all" ||
        supplier.supplier_type ===
          typeFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesType
      );
    });
  }, [
    suppliers,
    search,
    countryFilter,
    typeFilter,
  ]);

  const verifiedCount = useMemo(
    () =>
      suppliers.filter(
        (supplier) => supplier.verified
      ).length,
    [suppliers]
  );

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50"
    >
      <section className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
            >
              {isArabic ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}

              Health Nations
            </Link>

            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3">
              <Globe2 className="h-4 w-4 text-slate-300" />

              <select
                aria-label={t.language}
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target.value as Language
                  )
                }
                className="bg-transparent py-2.5 text-sm font-bold text-white outline-none"
              >
                <option
                  value="ar"
                  className="text-slate-950"
                >
                  🇸🇦 العربية
                </option>

                <option
                  value="en"
                  className="text-slate-950"
                >
                  🇬🇧 English
                </option>

                <option
                  value="zh"
                  className="text-slate-950"
                >
                  🇨🇳 中文
                </option>

                <option
                  value="tr"
                  className="text-slate-950"
                >
                  🇹🇷 Türkçe
                </option>
              </select>
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                <Users className="h-4 w-4" />
                {t.badge}
              </div>

              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {t.title}
              </h1>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                {t.subtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/store"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  <Store className="h-4 w-4" />
                  {t.marketplace}
                </Link>

                <Link
                  href="/supplier/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  <Building2 className="h-4 w-4" />
                  {t.becomeSupplier}
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-1 xl:grid-cols-3">
              <StatCard
                label={t.suppliers}
                value={suppliers.length}
              />

              <StatCard
                label={t.verified}
                value={verifiedCount}
              />

              <StatCard
                label={t.countries}
                value={countries.length}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search
                className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 ${
                  isArabic
                    ? "right-4"
                    : "left-4"
                }`}
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={
                  t.searchPlaceholder
                }
                className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-3 outline-none transition focus:border-blue-500 focus:bg-white ${
                  isArabic
                    ? "pl-4 pr-12"
                    : "pl-12 pr-4"
                }`}
              />
            </div>

            <select
              value={countryFilter}
              onChange={(event) =>
                setCountryFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                {t.allCountries}
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
                setTypeFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="all">
                {t.allTypes}
              </option>

              {supplierTypes.map((type) => (
                <option
                  key={type}
                  value={type}
                >
                  {formatSupplierType(
                    type,
                    language
                  )}
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
              {t.registeredSuppliers}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {language === "zh" ? (
                <>
                  {filteredSuppliers.length}
                  {t.found}
                </>
              ) : (
                <>
                  {filteredSuppliers.length}{" "}
                  {filteredSuppliers.length ===
                  1
                    ? t.oneFound
                    : t.found}
                </>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadSuppliers()
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-700" />

              <p className="mt-3 text-slate-500">
                {t.loading}
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-bold">
              {t.loadError}
            </p>

            <p
              dir="ltr"
              className="mt-2 text-sm"
            >
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadSuppliers()
              }
              className="mt-4 rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white"
            >
              {t.tryAgain}
            </button>
          </div>
        ) : filteredSuppliers.length ===
          0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />

            <h3 className="mt-4 text-xl font-black text-slate-900">
              {t.noSuppliers}
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-slate-500">
              {t.noSuppliersDescription}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSuppliers.map(
              (supplier) => (
                <SupplierCard
                  key={supplier.user_id}
                  supplier={supplier}
                  language={language}
                  isArabic={isArabic}
                  viewStore={t.viewStore}
                  verifiedLabel={
                    t.verifiedSupplier
                  }
                  medicalSupplier={
                    t.medicalSupplier
                  }
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function SupplierCard({
  supplier,
  language,
  isArabic,
  viewStore,
  verifiedLabel,
  medicalSupplier,
}: {
  supplier: SupplierProfile;
  language: Language;
  isArabic: boolean;
  viewStore: string;
  verifiedLabel: string;
  medicalSupplier: string;
}) {
  const supplierName =
    language === "ar"
      ? supplier.company_name_ar ||
        supplier.company_name_en ||
        medicalSupplier
      : supplier.company_name_en ||
        supplier.company_name_ar ||
        medicalSupplier;

  const secondaryName =
    language === "ar"
      ? supplier.company_name_en
      : supplier.company_name_ar;

  const description =
    language === "ar"
      ? supplier.description_ar ||
        supplier.description_en
      : supplier.description_en ||
        supplier.description_ar;

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
          <div className="flex items-start gap-2">
            <h3 className="text-2xl font-black text-slate-950">
              {supplierName}
            </h3>

            {supplier.verified && (
              <span
                title={verifiedLabel}
                aria-label={verifiedLabel}
                className="mt-1 shrink-0"
              >
                <BadgeCheck className="h-5 w-5 text-blue-600" />
              </span>
            )}
          </div>

          {secondaryName &&
            secondaryName !==
              supplierName && (
              <p
                dir={
                  language === "ar"
                    ? "ltr"
                    : "rtl"
                }
                className="mt-1 text-slate-500"
              >
                {secondaryName}
              </p>
            )}

          {(supplier.city ||
            supplier.country) && (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
              <MapPin className="h-4 w-4 shrink-0" />

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
                supplier.supplier_type,
                language
              )}
            </p>
          )}

          {description && (
            <p className="mt-4 line-clamp-3 leading-7 text-slate-600">
              {description}
            </p>
          )}

          {supplier.categories &&
            supplier.categories.length >
              0 && (
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
            {viewStore}

            {isArabic ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
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
  value: string,
  language: Language
) {
  const normalized = value
    .trim()
    .toLowerCase();

  const labels: Record<
    string,
    Record<Language, string>
  > = {
    distributor: {
      ar: "موزع",
      en: "Distributor",
      zh: "经销商",
      tr: "Distribütör",
    },

    manufacturer: {
      ar: "مصنع",
      en: "Manufacturer",
      zh: "制造商",
      tr: "Üretici",
    },

    medical_supplier: {
      ar: "مورد طبي",
      en: "Medical Supplier",
      zh: "医疗供应商",
      tr: "Medikal Tedarikçi",
    },

    pharmacy: {
      ar: "صيدلية",
      en: "Pharmacy",
      zh: "药房",
      tr: "Eczane",
    },

    supplier: {
      ar: "مورد",
      en: "Supplier",
      zh: "供应商",
      tr: "Tedarikçi",
    },
  };

  if (labels[normalized]) {
    return labels[normalized][language];
  }

  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}