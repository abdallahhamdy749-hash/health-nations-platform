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

import {
  Language,
  useLanguage,
} from "@/components/LanguageProvider";

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

type Translation = {
  loadingStore: string;
  storeNotFound: string;
  unableToLoadStore: string;
  backMarketplace: string;

  globalSupplier: string;
  verified: string;
  globalMarketplace: string;
  contactHealthNations: string;

  aboutStore: string;
  companyInformation: string;
  noDescription: string;

  needProducts: string;
  needProductsDescription: string;

  allProducts: string;
  equipment: string;
  consumables: string;
  spareParts: string;

  productCatalog: string;
  storeProducts: string;
  approvedProduct: string;
  approvedProducts: string;
  of: string;

  searchPlaceholder: string;
  allProductTypes: string;
  medicalEquipment: string;
  allCategories: string;

  noProductsFound: string;
  noProductsDescription: string;
  clearFilters: string;

  featured: string;
  consumable: string;
  sparePart: string;

  inStock: string;
  outOfStock: string;

  medicalProduct: string;

  partNumber: string;
  manufacturer: string;
  compatible: string;
  model: string;
  condition: string;

  conditionNew: string;
  conditionRefurbished: string;
  conditionUsed: string;

  brandUnavailable: string;

  salePrice: string;
  monthlyRental: string;
  contactForPrice: string;

  viewProductDetails: string;
  requestSparePart: string;

  supplier: string;
};

const translations: Record<
  Language,
  Translation
> = {
  ar: {
    loadingStore:
      "جاري تحميل متجر المورد...",

    storeNotFound:
      "المتجر غير موجود",

    unableToLoadStore:
      "تعذر تحميل هذا المتجر.",

    backMarketplace:
      "العودة إلى السوق العالمي",

    globalSupplier:
      "مورد عالمي على صحة الأمم",

    verified:
      "موثق",

    globalMarketplace:
      "السوق العالمي",

    contactHealthNations:
      "تواصل مع صحة الأمم",

    aboutStore:
      "عن المتجر",

    companyInformation:
      "معلومات الشركة",

    noDescription:
      "لم تتم إضافة وصف للشركة حتى الآن.",

    needProducts:
      "تحتاج منتجات هذا المورد؟",

    needProductsDescription:
      "أرسل طلبك إلى صحة الأمم، وسنقوم بمراجعته والتنسيق مع المورد نيابةً عنك.",

    allProducts:
      "جميع المنتجات",

    equipment:
      "الأجهزة",

    consumables:
      "المستهلكات",

    spareParts:
      "قطع الغيار",

    productCatalog:
      "كتالوج المنتجات",

    storeProducts:
      "منتجات المتجر",

    approvedProduct:
      "منتج معتمد",

    approvedProducts:
      "منتجات معتمدة",

    of: "من",

    searchPlaceholder:
      "ابحث بالمنتج أو Part Number أو الجهاز...",

    allProductTypes:
      "جميع أنواع المنتجات",

    medicalEquipment:
      "الأجهزة الطبية",

    allCategories:
      "جميع الأقسام",

    noProductsFound:
      "لا توجد منتجات مطابقة",

    noProductsDescription:
      "لا توجد حاليًا منتجات معتمدة مطابقة للبحث والفلاتر المحددة.",

    clearFilters:
      "مسح الفلاتر",

    featured: "مميز",

    consumable:
      "مستهلك طبي",

    sparePart:
      "قطعة غيار",

    inStock:
      "متوفر",

    outOfStock:
      "غير متوفر",

    medicalProduct:
      "منتج طبي",

    partNumber:
      "رقم القطعة",

    manufacturer:
      "الشركة المصنعة",

    compatible:
      "الجهاز المتوافق",

    model:
      "الموديل",

    condition:
      "الحالة",

    conditionNew:
      "جديد",

    conditionRefurbished:
      "مجدد",

    conditionUsed:
      "مستعمل",

    brandUnavailable:
      "معلومات الماركة غير متوفرة",

    salePrice:
      "سعر البيع",

    monthlyRental:
      "الإيجار الشهري",

    contactForPrice:
      "تواصل لمعرفة السعر",

    viewProductDetails:
      "عرض تفاصيل المنتج",

    requestSparePart:
      "طلب قطعة الغيار",

    supplier:
      "المورد",
  },

  en: {
    loadingStore:
      "Loading store...",

    storeNotFound:
      "Store not found",

    unableToLoadStore:
      "Unable to load this store.",

    backMarketplace:
      "Back to Marketplace",

    globalSupplier:
      "Health Nations Global Supplier",

    verified:
      "Verified",

    globalMarketplace:
      "Global Marketplace",

    contactHealthNations:
      "Contact Health Nations",

    aboutStore:
      "About the Store",

    companyInformation:
      "Company Information",

    noDescription:
      "No company description has been added yet.",

    needProducts:
      "Need This Supplier's Products?",

    needProductsDescription:
      "Send your request to Health Nations. We will review it and coordinate with the supplier on your behalf.",

    allProducts:
      "All Products",

    equipment:
      "Equipment",

    consumables:
      "Consumables",

    spareParts:
      "Spare Parts",

    productCatalog:
      "Product Catalog",

    storeProducts:
      "Store Products",

    approvedProduct:
      "approved product",

    approvedProducts:
      "approved products",

    of: "of",

    searchPlaceholder:
      "Product, Part Number, Device...",

    allProductTypes:
      "All Product Types",

    medicalEquipment:
      "Medical Equipment",

    allCategories:
      "All Categories",

    noProductsFound:
      "No products found",

    noProductsDescription:
      "There are currently no approved products matching your search and filters.",

    clearFilters:
      "Clear Filters",

    featured:
      "Featured",

    consumable:
      "Consumable",

    sparePart:
      "Spare Part",

    inStock:
      "In Stock",

    outOfStock:
      "Out of Stock",

    medicalProduct:
      "Medical Product",

    partNumber:
      "Part No.",

    manufacturer:
      "Manufacturer",

    compatible:
      "Compatible",

    model:
      "Model",

    condition:
      "Condition",

    conditionNew:
      "New",

    conditionRefurbished:
      "Refurbished",

    conditionUsed:
      "Used",

    brandUnavailable:
      "Brand information unavailable",

    salePrice:
      "Sale Price",

    monthlyRental:
      "Monthly Rental",

    contactForPrice:
      "Contact for price",

    viewProductDetails:
      "View Product Details",

    requestSparePart:
      "Request Spare Part",

    supplier:
      "Supplier",
  },

  zh: {
    loadingStore:
      "正在加载供应商商店...",

    storeNotFound:
      "未找到商店",

    unableToLoadStore:
      "无法加载此商店。",

    backMarketplace:
      "返回全球市场",

    globalSupplier:
      "Health Nations 全球供应商",

    verified:
      "已认证",

    globalMarketplace:
      "全球市场",

    contactHealthNations:
      "联系 Health Nations",

    aboutStore:
      "关于商店",

    companyInformation:
      "公司信息",

    noDescription:
      "尚未添加公司描述。",

    needProducts:
      "需要该供应商的产品？",

    needProductsDescription:
      "请将您的需求发送给 Health Nations。我们将审核您的需求，并代表您与供应商协调。",

    allProducts:
      "所有产品",

    equipment:
      "设备",

    consumables:
      "耗材",

    spareParts:
      "备件",

    productCatalog:
      "产品目录",

    storeProducts:
      "商店产品",

    approvedProduct:
      "个已批准产品",

    approvedProducts:
      "个已批准产品",

    of: "共",

    searchPlaceholder:
      "搜索产品、零件编号或设备...",

    allProductTypes:
      "所有产品类型",

    medicalEquipment:
      "医疗设备",

    allCategories:
      "所有类别",

    noProductsFound:
      "未找到产品",

    noProductsDescription:
      "当前没有符合搜索条件和筛选条件的已批准产品。",

    clearFilters:
      "清除筛选",

    featured:
      "精选",

    consumable:
      "医疗耗材",

    sparePart:
      "备件",

    inStock:
      "有库存",

    outOfStock:
      "缺货",

    medicalProduct:
      "医疗产品",

    partNumber:
      "零件编号",

    manufacturer:
      "制造商",

    compatible:
      "兼容设备",

    model:
      "型号",

    condition:
      "状态",

    conditionNew:
      "全新",

    conditionRefurbished:
      "翻新",

    conditionUsed:
      "二手",

    brandUnavailable:
      "暂无品牌信息",

    salePrice:
      "销售价格",

    monthlyRental:
      "月租金",

    contactForPrice:
      "联系询价",

    viewProductDetails:
      "查看产品详情",

    requestSparePart:
      "申请备件",

    supplier:
      "供应商",
  },

  tr: {
    loadingStore:
      "Mağaza yükleniyor...",

    storeNotFound:
      "Mağaza bulunamadı",

    unableToLoadStore:
      "Bu mağaza yüklenemedi.",

    backMarketplace:
      "Pazara Dön",

    globalSupplier:
      "Health Nations Küresel Tedarikçisi",

    verified:
      "Doğrulanmış",

    globalMarketplace:
      "Küresel Pazar",

    contactHealthNations:
      "Health Nations ile İletişime Geç",

    aboutStore:
      "Mağaza Hakkında",

    companyInformation:
      "Şirket Bilgileri",

    noDescription:
      "Henüz şirket açıklaması eklenmedi.",

    needProducts:
      "Bu Tedarikçinin Ürünlerine mi İhtiyacınız Var?",

    needProductsDescription:
      "Talebinizi Health Nations'a gönderin. Talebinizi inceleyip sizin adınıza tedarikçiyle koordinasyon sağlayacağız.",

    allProducts:
      "Tüm Ürünler",

    equipment:
      "Cihazlar",

    consumables:
      "Sarf Malzemeleri",

    spareParts:
      "Yedek Parçalar",

    productCatalog:
      "Ürün Kataloğu",

    storeProducts:
      "Mağaza Ürünleri",

    approvedProduct:
      "onaylı ürün",

    approvedProducts:
      "onaylı ürün",

    of: "/",

    searchPlaceholder:
      "Ürün, Parça Numarası, Cihaz...",

    allProductTypes:
      "Tüm Ürün Türleri",

    medicalEquipment:
      "Tıbbi Cihazlar",

    allCategories:
      "Tüm Kategoriler",

    noProductsFound:
      "Ürün bulunamadı",

    noProductsDescription:
      "Arama ve filtrelerinize uyan onaylı ürün bulunmamaktadır.",

    clearFilters:
      "Filtreleri Temizle",

    featured:
      "Öne Çıkan",

    consumable:
      "Sarf Malzemesi",

    sparePart:
      "Yedek Parça",

    inStock:
      "Stokta",

    outOfStock:
      "Stokta Yok",

    medicalProduct:
      "Medikal Ürün",

    partNumber:
      "Parça No.",

    manufacturer:
      "Üretici",

    compatible:
      "Uyumlu Cihaz",

    model:
      "Model",

    condition:
      "Durum",

    conditionNew:
      "Yeni",

    conditionRefurbished:
      "Yenilenmiş",

    conditionUsed:
      "Kullanılmış",

    brandUnavailable:
      "Marka bilgisi mevcut değil",

    salePrice:
      "Satış Fiyatı",

    monthlyRental:
      "Aylık Kira",

    contactForPrice:
      "Fiyat için iletişime geçin",

    viewProductDetails:
      "Ürün Detaylarını Gör",

    requestSparePart:
      "Yedek Parça Talep Et",

    supplier:
      "Tedarikçi",
  },
};

const languageOptions: {
  code: Language;
  label: string;
}[] = [
  {
    code: "ar",
    label: "🇸🇦 العربية",
  },
  {
    code: "en",
    label: "🇬🇧 English",
  },
  {
    code: "zh",
    label: "🇨🇳 中文",
  },
  {
    code: "tr",
    label: "🇹🇷 Türkçe",
  },
];

export default function PublicStorePage() {
  const params =
    useParams<{ slug: string }>();

  const slug =
    decodeURIComponent(params.slug);

  const {
    language,
    setLanguage,
    isArabic,
  } = useLanguage();

  const t =
    translations[language];

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
      window.clearTimeout(
        timer
      );
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
      <main
        dir={
          isArabic ? "rtl" : "ltr"
        }
        className="flex min-h-screen items-center justify-center bg-slate-100"
      >
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-blue-700" />

          <span className="font-bold text-slate-700">
            {t.loadingStore}
          </span>
        </div>
      </main>
    );
  }

  if (!supplier) {
    return (
      <main
        dir={
          isArabic ? "rtl" : "ltr"
        }
        className="flex min-h-screen items-center justify-center bg-slate-100 px-5"
      >
        <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto text-red-600"
            size={44}
          />

          <h1 className="mt-4 text-3xl font-black">
            {t.storeNotFound}
          </h1>

          <p className="mt-3 text-slate-600">
            {errorMessage ||
              t.unableToLoadStore}
          </p>

          <Link
            href="/store"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white"
          >
            {t.backMarketplace}
          </Link>
        </div>
      </main>
    );
  }

  const supplierName =
    language === "ar"
      ? supplier.company_name_ar ||
        supplier.company_name_en
      : supplier.company_name_en ||
        supplier.company_name_ar ||
        t.supplier;

  const secondarySupplierName =
    language === "ar"
      ? supplier.company_name_en
      : supplier.company_name_ar;

  const supplierDescription =
    language === "ar"
      ? supplier.description_ar ||
        supplier.description_en
      : supplier.description_en ||
        supplier.description_ar;

  const secondarySupplierDescription =
    language === "ar"
      ? supplier.description_en
      : supplier.description_ar;

  const storeWhatsappUrl =
    createWhatsAppUrl(
      HEALTH_NATIONS_WHATSAPP,
      `استفسار عن متجر مورد من منصة صحة الأمم

المورد: ${supplierName}
الدولة: ${supplier.country || "غير محدد"}

أرغب في الاستفسار عن المنتجات المتوفرة من هذا المورد والتنسيق من خلال صحة الأمم.

Supplier Store Inquiry
Supplier: ${supplier.company_name_en}
Country: ${supplier.country || "Not specified"}
Source: Health Nations Global Marketplace`
    );

  return (
    <main
      dir={
        isArabic ? "rtl" : "ltr"
      }
      className="min-h-screen bg-slate-100 text-slate-900"
    >
      {/* SUPPLIER HERO */}

      <section className="relative min-h-[360px] overflow-hidden bg-slate-950">
        {supplier.cover_url ? (
          <img
            src={
              supplier.cover_url
            }
            alt={`${supplierName} cover`}
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
                      supplierName
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
                    {t.globalSupplier}
                  </p>

                  {supplier.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-200">
                      <BadgeCheck
                        size={15}
                      />

                      {t.verified}
                    </span>
                  )}
                </div>

                <h1 className="mt-2 text-4xl font-black md:text-5xl">
                  {supplierName}
                </h1>

                {secondarySupplierName &&
                  secondarySupplierName !==
                    supplierName && (
                    <p
                      className="mt-2 text-xl text-slate-200"
                      dir={
                        language === "ar"
                          ? "ltr"
                          : "rtl"
                      }
                    >
                      {
                        secondarySupplierName
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
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-white backdrop-blur">
                <Globe2
                  size={18}
                />

                <select
                  value={language}
                  onChange={(event) =>
                    setLanguage(
                      event.target
                        .value as Language
                    )
                  }
                  aria-label="Select language"
                  className="cursor-pointer bg-transparent text-sm font-bold text-white outline-none"
                >
                  {languageOptions.map(
                    (item) => (
                      <option
                        key={
                          item.code
                        }
                        value={
                          item.code
                        }
                        className="text-slate-900"
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <Link
                href="/store"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Globe2
                  size={18}
                />

                {
                  t.globalMarketplace
                }
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

                {
                  t.contactHealthNations
                }
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* STORE INFO */}

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
              {t.aboutStore}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {
                t.companyInformation
              }
            </h2>

            {supplierDescription ? (
              <p className="mt-5 whitespace-pre-line leading-8 text-slate-600">
                {
                  supplierDescription
                }
              </p>
            ) : (
              <p className="mt-5 text-slate-500">
                {
                  t.noDescription
                }
              </p>
            )}

            {secondarySupplierDescription &&
              secondarySupplierDescription !==
                supplierDescription && (
                <p
                  className="mt-5 whitespace-pre-line border-t border-slate-100 pt-5 leading-8 text-slate-600"
                  dir={
                    language === "ar"
                      ? "ltr"
                      : "rtl"
                  }
                >
                  {
                    secondarySupplierDescription
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
              {t.needProducts}
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              {
                t.needProductsDescription
              }
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

              {
                t.contactHealthNations
              }
            </a>
          </aside>
        </section>

        {/* STATS */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StoreStat
            label={
              t.allProducts
            }
            value={
              products.length
            }
            icon={
              <Package
                size={21}
              />
            }
          />

          <StoreStat
            label={
              t.equipment
            }
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
            label={
              t.consumables
            }
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
            label={
              t.spareParts
            }
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

        {/* CATALOG */}

        <section className="mt-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-blue-700">
                  {
                    t.productCatalog
                  }
                </p>

                <h2 className="mt-1 text-3xl font-black">
                  {
                    t.storeProducts
                  }
                </h2>

                <p className="mt-2 text-slate-500">
                  {
                    filteredProducts.length
                  }{" "}
                  {t.of}{" "}
                  {products.length}{" "}
                  {products.length ===
                  1
                    ? t.approvedProduct
                    : t.approvedProducts}
                </p>
              </div>

              <div className="grid w-full gap-3 xl:w-auto xl:grid-cols-[320px_220px_210px]">
                <label className="relative block">
                  <Search
                    size={19}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                      isArabic
                        ? "right-4"
                        : "left-4"
                    }`}
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
                    placeholder={
                      t.searchPlaceholder
                    }
                    className={`w-full rounded-2xl border border-slate-200 py-3 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100 ${
                      isArabic
                        ? "pl-4 pr-12"
                        : "pl-12 pr-4"
                    }`}
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
                    {
                      t.allProductTypes
                    }
                  </option>

                  <option value="equipment">
                    {
                      t.medicalEquipment
                    }
                  </option>

                  <option value="consumable">
                    {
                      t.consumables
                    }
                  </option>

                  <option value="spare_part">
                    {
                      t.spareParts
                    }
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
                    {
                      t.allCategories
                    }
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

          {/* EMPTY */}

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
                {
                  t.noProductsFound
                }
              </h3>

              <p className="mt-2 max-w-lg text-slate-500">
                {
                  t.noProductsDescription
                }
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
                {
                  t.clearFilters
                }
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
                    language={
                      language
                    }
                    isArabic={
                      isArabic
                    }
                    t={t}
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
  language,
  isArabic,
  t,
}: {
  product: Product;
  supplier: SupplierProfile;
  language: Language;
  isArabic: boolean;
  t: Translation;
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
      product.part_condition,
      t
    );

  const productName =
    language === "ar"
      ? product.name_ar ||
        product.name_en ||
        t.medicalProduct
      : product.name_en ||
        product.name_ar ||
        t.medicalProduct;

  const secondaryProductName =
    language === "ar"
      ? product.name_en
      : product.name_ar;

  const supplierName =
    language === "ar"
      ? supplier.company_name_ar ||
        supplier.company_name_en
      : supplier.company_name_en ||
        supplier.company_name_ar ||
        t.supplier;

  const whatsappUrl =
    createWhatsAppUrl(
      HEALTH_NATIONS_WHATSAPP,
      sparePart
        ? `استفسار عن قطعة غيار من متجر مورد على منصة صحة الأمم

قطعة الغيار: ${productName}
رقم المنتج: ${product.id}
Part Number: ${product.part_number || "غير محدد"}
Manufacturer: ${product.manufacturer || product.brand || "غير محدد"}
Compatible Device: ${product.compatible_device || "غير محدد"}
Compatible Model: ${product.model || "غير محدد"}
Condition: ${condition || "غير محدد"}

المورد: ${supplierName}
دولة المورد: ${supplier.country || "غير محدد"}

أرغب في معرفة السعر والتوفر.

Medical Spare Part Inquiry
Product: ${productName}
Product ID: ${product.id}
Part Number: ${product.part_number || "Not specified"}
Manufacturer: ${product.manufacturer || product.brand || "Not specified"}
Compatible Device: ${product.compatible_device || "Not specified"}
Model: ${product.model || "Not specified"}
Supplier: ${supplier.company_name_en}
Supplier Country: ${supplier.country || "Not specified"}
Source: Health Nations Supplier Store`
        : `استفسار عن منتج من متجر مورد على منصة صحة الأمم

المنتج: ${productName}
رقم المنتج: ${product.id}
المورد: ${supplierName}
دولة المورد: ${supplier.country || "غير محدد"}
Brand: ${product.brand || "غير محدد"}
Model: ${product.model || "غير محدد"}

أرغب في معرفة السعر والتوفر والتفاصيل.

Product Inquiry
Product: ${productName}
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
                productName
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

          <div
            className={`absolute top-4 flex flex-col items-start gap-2 ${
              isArabic
                ? "right-4"
                : "left-4"
            }`}
          >
            {product.featured && (
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-slate-950">
                {t.featured}
              </span>
            )}

            <ProductKindBadge
              kind={
                productKind
              }
              t={t}
            />
          </div>

          <span
            className={`absolute top-4 rounded-full px-3 py-1 text-xs font-bold ${
              isArabic
                ? "left-4"
                : "right-4"
            } ${
              (product.stock ??
                0) > 0
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-700"
            }`}
          >
            {(product.stock ??
              0) > 0
              ? t.inStock
              : t.outOfStock}
          </span>
        </div>
      </Link>

      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
          {product.category ||
            t.medicalProduct}
        </p>

        <Link
          href={`/store/product/${product.id}`}
          className="block"
        >
          <h3 className="mt-2 text-xl font-black transition hover:text-blue-700">
            {productName}
          </h3>
        </Link>

        {secondaryProductName &&
          secondaryProductName !==
            productName && (
            <p
              className="mt-1 text-slate-500"
              dir={
                language === "ar"
                  ? "ltr"
                  : "rtl"
              }
            >
              {
                secondaryProductName
              }
            </p>
          )}

        {sparePart ? (
          <div className="mt-4 space-y-2 rounded-2xl border border-amber-100 bg-amber-50 p-4">
            {product.part_number && (
              <ProductMeta
                label={
                  t.partNumber
                }
                value={
                  product.part_number
                }
              />
            )}

            {(product.manufacturer ||
              product.brand) && (
              <ProductMeta
                label={
                  t.manufacturer
                }
                value={
                  product.manufacturer ||
                  product.brand ||
                  ""
                }
              />
            )}

            {product.compatible_device && (
              <ProductMeta
                label={
                  t.compatible
                }
                value={
                  product.compatible_device
                }
              />
            )}

            {product.model && (
              <ProductMeta
                label={t.model}
                value={
                  product.model
                }
              />
            )}

            {condition && (
              <ProductMeta
                label={
                  t.condition
                }
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
              t.brandUnavailable}
          </p>
        )}

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-slate-100 pt-5">
          <div>
            {product.available_for_sale &&
            product.sale_price !==
              null ? (
              <>
                <p className="text-xs font-bold uppercase text-slate-400">
                  {t.salePrice}
                </p>

                <p className="mt-1 text-2xl font-black text-blue-700">
                  {formatPrice(
                    product.sale_price,
                    product.currency,
                    language
                  )}
                </p>
              </>
            ) : product.available_for_rental &&
              product.monthly_rental_price !==
                null ? (
              <>
                <p className="text-xs font-bold uppercase text-slate-400">
                  {
                    t.monthlyRental
                  }
                </p>

                <p className="mt-1 text-2xl font-black text-blue-700">
                  {formatPrice(
                    product.monthly_rental_price,
                    product.currency,
                    language
                  )}
                </p>
              </>
            ) : (
              <p className="text-lg font-black text-blue-700">
                {
                  t.contactForPrice
                }
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
            {
              t.viewProductDetails
            }

            <ChevronRight
              size={18}
              className={
                isArabic
                  ? "rotate-180"
                  : ""
              }
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
              ? t.requestSparePart
              : t.contactHealthNations}
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
  t,
}: {
  kind: ProductKind;
  t: Translation;
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
    equipment:
      t.equipment,

    consumable:
      t.consumable,

    spare_part:
      t.sparePart,
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

      <strong className="break-words text-end text-slate-900">
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
  value: PartCondition | null,
  t: Translation
) {
  if (value === "new") {
    return t.conditionNew;
  }

  if (
    value === "refurbished"
  ) {
    return t.conditionRefurbished;
  }

  if (value === "used") {
    return t.conditionUsed;
  }

  return "";
}

function formatPrice(
  value: number,
  currency: string | null,
  language: Language
) {
  const locale =
    language === "ar"
      ? "ar-SA"
      : language === "zh"
        ? "zh-CN"
        : language === "tr"
          ? "tr-TR"
          : "en-US";

  try {
    return `${new Intl.NumberFormat(
      locale,
      {
        maximumFractionDigits: 2,
      }
    ).format(Number(value))} ${
      currency || ""
    }`;
  } catch {
    return `${value} ${
      currency || ""
    }`;
  }
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