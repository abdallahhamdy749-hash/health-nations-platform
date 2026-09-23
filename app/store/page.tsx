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
import {
  Language,
  useLanguage,
} from "@/components/LanguageProvider";

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

type Translation = {
  marketplaceBadge: string;
  title: string;
  description: string;

  market: string;

  rentalTitle: string;
  saleTitle: string;
  sparePartsTitle: string;

  becomeSupplier: string;
  browseSuppliers: string;

  products: string;
  suppliers: string;
  countries: string;
  spareParts: string;

  searchPlaceholder: string;

  allCountries: string;
  allCategories: string;
  allProducts: string;
  forSale: string;
  forRental: string;

  globalMarketplace: string;
  clearFilters: string;

  globalProducts: string;
  productsIn: string;

  productFound: string;
  productsFound: string;
  search: string;

  refresh: string;
  loading: string;

  unableToLoad: string;
  tryAgain: string;

  noProductTitle: string;
  noProductBefore: string;
  noProductGlobal: string;
  noProductCountry: string;
  noProductAfter: string;

  searchHelp: string;
  requestWhatsapp: string;

  noRentalTitle: string;
  noRentalText: string;
  rentalInquiry: string;

  noSparePartsTitle: string;
  noSparePartsText: string;
  requestSparePart: string;

  noProductsTitle: string;
  noProductsText: string;

  featured: string;
  rental: string;
  sparePart: string;

  partNumber: string;
  manufacturer: string;
  compatible: string;
  model: string;
  condition: string;

  conditionNew: string;
  conditionRefurbished: string;
  conditionUsed: string;

  salePrice: string;
  monthlyRental: string;
  stock: string;

  contactForPrice: string;

  viewDetails: string;
  contactHealthNations: string;
  viewSupplierStore: string;

  medicalProduct: string;
  supplier: string;
};

const translations: Record<
  Language,
  Translation
> = {
  ar: {
    marketplaceBadge:
      "سوق صحة الأمم الطبي العالمي",

    title:
      "السوق العالمي للأجهزة والمنتجات الطبية",

    description:
      "ابحث عن الأجهزة الطبية والمستهلكات وقطع الغيار بالاسم أو الماركة أو الموديل أو الشركة المصنعة أو رقم القطعة Part Number.",

    market: "السوق",

    rentalTitle:
      "تأجير المعدات الطبية",

    saleTitle:
      "الأجهزة الطبية المعروضة للبيع",

    sparePartsTitle:
      "قطع غيار الأجهزة الطبية",

    becomeSupplier:
      "انضم كمورد عالمي",

    browseSuppliers:
      "استكشف الموردين العالميين",

    products: "المنتجات",
    suppliers: "الموردون",
    countries: "الدول",
    spareParts: "قطع الغيار",

    searchPlaceholder:
      "ابحث باسم المنتج أو Part Number أو الشركة المصنعة أو الموديل...",

    allCountries:
      "🌍 جميع الدول",

    allCategories:
      "جميع الأقسام",

    allProducts:
      "جميع المنتجات",

    forSale: "للبيع",
    forRental: "للتأجير",

    globalMarketplace:
      "السوق العالمي",

    clearFilters:
      "مسح الفلاتر",

    globalProducts:
      "منتجات السوق العالمي",

    productsIn:
      "المنتجات الطبية في",

    productFound:
      "منتج موجود",

    productsFound:
      "منتجات موجودة",

    search: "البحث",

    refresh: "تحديث",

    loading:
      "جاري تحميل السوق العالمي...",

    unableToLoad:
      "تعذر تحميل السوق",

    tryAgain:
      "إعادة المحاولة",

    noProductTitle:
      "المنتج غير موجود حاليًا",

    noProductBefore:
      "لم نجد",

    noProductGlobal:
      "في السوق العالمي",

    noProductCountry:
      "في",

    noProductAfter:
      "ضمن المنتجات الحالية. تواصل مع صحة الأمم وسنساعدك في البحث عنه وتوفيره عالميًا.",

    searchHelp:
      "يمكنك البحث باسم المنتج أو Part Number أو الشركة المصنعة أو الجهاز المتوافق.",

    requestWhatsapp:
      "طلب المنتج عبر واتساب",

    noRentalTitle:
      "لا توجد معدات متاحة للتأجير",

    noRentalText:
      "لا توجد معدات طبية متاحة للتأجير حاليًا ضمن الفلاتر المحددة.",

    rentalInquiry:
      "استفسار عن التأجير",

    noSparePartsTitle:
      "لا توجد قطع غيار مطابقة",

    noSparePartsText:
      "لا توجد قطع غيار مطابقة للفلاتر الحالية. يمكنك البحث باسم القطعة أو Part Number أو الجهاز المتوافق.",

    requestSparePart:
      "اطلب قطعة غيار",

    noProductsTitle:
      "لا توجد منتجات",

    noProductsText:
      "لا توجد منتجات في السوق العالمي مطابقة للفلاتر الحالية.",

    featured: "مميز",
    rental: "تأجير",
    sparePart: "قطعة غيار",

    partNumber:
      "رقم القطعة",

    manufacturer:
      "الشركة المصنعة",

    compatible:
      "الجهاز المتوافق",

    model: "الموديل",

    condition: "الحالة",

    conditionNew: "جديد",

    conditionRefurbished:
      "مجدد",

    conditionUsed:
      "مستعمل",

    salePrice:
      "سعر البيع",

    monthlyRental:
      "الإيجار الشهري",

    stock: "المخزون",

    contactForPrice:
      "تواصل لمعرفة السعر",

    viewDetails:
      "عرض تفاصيل المنتج",

    contactHealthNations:
      "تواصل مع صحة الأمم",

    viewSupplierStore:
      "عرض متجر المورد",

    medicalProduct:
      "منتج طبي",

    supplier: "المورد",
  },

  en: {
    marketplaceBadge:
      "Health Nations Global Marketplace",

    title:
      "Global Medical Equipment Marketplace",

    description:
      "Search medical equipment, consumables and spare parts by product name, brand, model, manufacturer or Part Number.",

    market: "Market",

    rentalTitle:
      "Medical Equipment Rental",

    saleTitle:
      "Medical Equipment For Sale",

    sparePartsTitle:
      "Medical Equipment Spare Parts",

    becomeSupplier:
      "Become a Global Supplier",

    browseSuppliers:
      "Browse Global Suppliers",

    products: "Products",
    suppliers: "Suppliers",
    countries: "Countries",
    spareParts: "Spare Parts",

    searchPlaceholder:
      "Search product name, Part Number, manufacturer, model...",

    allCountries:
      "🌍 All Countries",

    allCategories:
      "All Categories",

    allProducts:
      "All Products",

    forSale: "For Sale",
    forRental: "For Rental",

    globalMarketplace:
      "Global Marketplace",

    clearFilters:
      "Clear Filters",

    globalProducts:
      "Global Marketplace Products",

    productsIn:
      "Medical Products in",

    productFound:
      "product found",

    productsFound:
      "products found",

    search: "Search",

    refresh: "Refresh",

    loading:
      "Loading global marketplace...",

    unableToLoad:
      "Unable to load marketplace",

    tryAgain:
      "Try Again",

    noProductTitle:
      "Product not currently listed",

    noProductBefore:
      "We could not find",

    noProductGlobal:
      "in the global marketplace",

    noProductCountry:
      "in",

    noProductAfter:
      "among the currently listed products. Contact Health Nations and we can help source it globally.",

    searchHelp:
      "Search by product name, Part Number, manufacturer or compatible device.",

    requestWhatsapp:
      "Request Product via WhatsApp",

    noRentalTitle:
      "No rental equipment available",

    noRentalText:
      "There is currently no rental equipment matching the selected filters.",

    rentalInquiry:
      "Rental Inquiry",

    noSparePartsTitle:
      "No spare parts found",

    noSparePartsText:
      "No spare parts match the current filters. Search by part name, Part Number or compatible device.",

    requestSparePart:
      "Request Spare Part",

    noProductsTitle:
      "No products found",

    noProductsText:
      "No global marketplace products currently match your filters.",

    featured: "Featured",
    rental: "Rental",
    sparePart: "Spare Part",

    partNumber: "Part No.",
    manufacturer:
      "Manufacturer",
    compatible:
      "Compatible",
    model: "Model",
    condition: "Condition",

    conditionNew: "New",

    conditionRefurbished:
      "Refurbished",

    conditionUsed: "Used",

    salePrice: "Sale price",

    monthlyRental:
      "Monthly rental",

    stock: "Stock",

    contactForPrice:
      "Contact for price",

    viewDetails:
      "View Product Details",

    contactHealthNations:
      "Contact Health Nations",

    viewSupplierStore:
      "View Supplier Store",

    medicalProduct:
      "Medical Product",

    supplier: "Supplier",
  },

  zh: {
    marketplaceBadge:
      "Health Nations 全球医疗市场",

    title:
      "全球医疗设备与产品市场",

    description:
      "按产品名称、品牌、型号、制造商或零件编号搜索医疗设备、耗材和备件。",

    market: "市场",

    rentalTitle:
      "医疗设备租赁",

    saleTitle:
      "医疗设备销售",

    sparePartsTitle:
      "医疗设备备件",

    becomeSupplier:
      "成为全球供应商",

    browseSuppliers:
      "浏览全球供应商",

    products: "产品",
    suppliers: "供应商",
    countries: "国家",
    spareParts: "备件",

    searchPlaceholder:
      "搜索产品名称、零件编号、制造商或型号...",

    allCountries:
      "🌍 所有国家",

    allCategories:
      "所有类别",

    allProducts:
      "所有产品",

    forSale: "销售",
    forRental: "租赁",

    globalMarketplace:
      "全球市场",

    clearFilters:
      "清除筛选",

    globalProducts:
      "全球市场产品",

    productsIn:
      "医疗产品 -",

    productFound:
      "个产品",

    productsFound:
      "个产品",

    search: "搜索",

    refresh: "刷新",

    loading:
      "正在加载全球市场...",

    unableToLoad:
      "无法加载市场",

    tryAgain: "重试",

    noProductTitle:
      "当前未找到该产品",

    noProductBefore:
      "未找到",

    noProductGlobal:
      "在全球市场中",

    noProductCountry:
      "在",

    noProductAfter:
      "。请联系 Health Nations，我们可以帮助您在全球寻找和采购该产品。",

    searchHelp:
      "可按产品名称、零件编号、制造商或兼容设备搜索。",

    requestWhatsapp:
      "通过 WhatsApp 询价",

    noRentalTitle:
      "暂无可租赁设备",

    noRentalText:
      "当前筛选条件下暂无可租赁的医疗设备。",

    rentalInquiry:
      "咨询设备租赁",

    noSparePartsTitle:
      "未找到备件",

    noSparePartsText:
      "当前筛选条件下没有匹配的备件。您可以按备件名称、零件编号或兼容设备搜索。",

    requestSparePart:
      "申请备件",

    noProductsTitle:
      "未找到产品",

    noProductsText:
      "当前没有符合筛选条件的全球市场产品。",

    featured: "精选",
    rental: "租赁",
    sparePart: "备件",

    partNumber: "零件编号",

    manufacturer:
      "制造商",

    compatible:
      "兼容设备",

    model: "型号",

    condition: "状态",

    conditionNew: "全新",

    conditionRefurbished:
      "翻新",

    conditionUsed:
      "二手",

    salePrice:
      "销售价格",

    monthlyRental:
      "月租金",

    stock: "库存",

    contactForPrice:
      "联系询价",

    viewDetails:
      "查看产品详情",

    contactHealthNations:
      "联系 Health Nations",

    viewSupplierStore:
      "查看供应商商店",

    medicalProduct:
      "医疗产品",

    supplier: "供应商",
  },

  tr: {
    marketplaceBadge:
      "Health Nations Küresel Medikal Pazarı",

    title:
      "Küresel Tıbbi Cihaz Pazarı",

    description:
      "Tıbbi cihazları, sarf malzemelerini ve yedek parçaları ürün adı, marka, model, üretici veya parça numarasına göre arayın.",

    market: "Pazar",

    rentalTitle:
      "Tıbbi Cihaz Kiralama",

    saleTitle:
      "Satılık Tıbbi Cihazlar",

    sparePartsTitle:
      "Tıbbi Cihaz Yedek Parçaları",

    becomeSupplier:
      "Küresel Tedarikçi Ol",

    browseSuppliers:
      "Küresel Tedarikçileri Gör",

    products: "Ürünler",
    suppliers: "Tedarikçiler",
    countries: "Ülkeler",
    spareParts: "Yedek Parçalar",

    searchPlaceholder:
      "Ürün adı, parça numarası, üretici veya model ara...",

    allCountries:
      "🌍 Tüm Ülkeler",

    allCategories:
      "Tüm Kategoriler",

    allProducts:
      "Tüm Ürünler",

    forSale: "Satılık",
    forRental: "Kiralık",

    globalMarketplace:
      "Küresel Pazar",

    clearFilters:
      "Filtreleri Temizle",

    globalProducts:
      "Küresel Pazar Ürünleri",

    productsIn:
      "Tıbbi Ürünler -",

    productFound:
      "ürün bulundu",

    productsFound:
      "ürün bulundu",

    search: "Arama",

    refresh: "Yenile",

    loading:
      "Küresel pazar yükleniyor...",

    unableToLoad:
      "Pazar yüklenemedi",

    tryAgain:
      "Tekrar Dene",

    noProductTitle:
      "Ürün şu anda listelenmiyor",

    noProductBefore:
      "Bulunamadı:",

    noProductGlobal:
      "küresel pazarda",

    noProductCountry:
      "ülke:",

    noProductAfter:
      "Health Nations ile iletişime geçin; ürünü küresel olarak bulmanıza yardımcı olabiliriz.",

    searchHelp:
      "Ürün adı, parça numarası, üretici veya uyumlu cihaza göre arayın.",

    requestWhatsapp:
      "WhatsApp ile Ürün Talep Et",

    noRentalTitle:
      "Kiralık ekipman bulunamadı",

    noRentalText:
      "Seçili filtrelere uygun kiralık tıbbi ekipman bulunmamaktadır.",

    rentalInquiry:
      "Kiralama Talebi",

    noSparePartsTitle:
      "Yedek parça bulunamadı",

    noSparePartsText:
      "Mevcut filtrelere uygun yedek parça bulunamadı. Parça adı, parça numarası veya uyumlu cihaza göre arayabilirsiniz.",

    requestSparePart:
      "Yedek Parça Talep Et",

    noProductsTitle:
      "Ürün bulunamadı",

    noProductsText:
      "Mevcut filtrelere uygun küresel pazar ürünü bulunmamaktadır.",

    featured:
      "Öne Çıkan",

    rental: "Kiralık",

    sparePart:
      "Yedek Parça",

    partNumber:
      "Parça No.",

    manufacturer:
      "Üretici",

    compatible:
      "Uyumlu Cihaz",

    model: "Model",

    condition: "Durum",

    conditionNew: "Yeni",

    conditionRefurbished:
      "Yenilenmiş",

    conditionUsed:
      "Kullanılmış",

    salePrice:
      "Satış fiyatı",

    monthlyRental:
      "Aylık kira",

    stock: "Stok",

    contactForPrice:
      "Fiyat için iletişime geçin",

    viewDetails:
      "Ürün Detaylarını Gör",

    contactHealthNations:
      "Health Nations ile İletişime Geç",

    viewSupplierStore:
      "Tedarikçi Mağazasını Gör",

    medicalProduct:
      "Medikal Ürün",

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

function formatPrice(
  price: number | null,
  currency: string | null,
  language: Language,
  contactForPrice: string
): string {
  if (
    price === null ||
    price === undefined
  ) {
    return contactForPrice;
  }

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
      (
        value
      ): value is string =>
        typeof value ===
        "string"
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
    (term) =>
      text.includes(term)
  );
}

function formatCondition(
  condition: PartCondition | null,
  t: Translation
) {
  if (condition === "new") {
    return t.conditionNew;
  }

  if (
    condition === "refurbished"
  ) {
    return t.conditionRefurbished;
  }

  if (condition === "used") {
    return t.conditionUsed;
  }

  return "";
}

export default function StorePage() {
  const {
    language,
    setLanguage,
    isArabic,
  } = useLanguage();

  const t =
    translations[language];

  const [products, setProducts] =
    useState<SupplierProduct[]>([]);

  const [suppliers, setSuppliers] =
    useState<SupplierProfile[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

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
    useState<MarketplaceType>(
      "all"
    );

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

        const type =
          params
            .get("type")
            ?.trim()
            .toLowerCase();

        const country =
          params
            .get("country")
            ?.trim() || "";

        if (query) {
          setSearch(query);
          setHomepageSearch(
            query
          );
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
          setSelectedType(
            "sale"
          );
        } else if (
          type ===
            "spare-parts" ||
          type === "spareparts"
        ) {
          setSelectedType(
            "spare-parts"
          );
        } else {
          setSelectedType(
            "all"
          );
        }
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, []);

  /*
   * Load suppliers and products separately.
   * This makes Supabase errors visible and prevents
   * an empty {} error from hiding the real source.
   */
  const loadMarketplace =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const supplierResult =
          await supabase
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
            `);

        if (
          supplierResult.error
        ) {
          console.error(
            "SUPPLIERS ERROR DETAILS:",
            {
              message:
                supplierResult
                  .error
                  .message,
              details:
                supplierResult
                  .error
                  .details,
              hint:
                supplierResult
                  .error
                  .hint,
              code:
                supplierResult
                  .error
                  .code,
            }
          );

          throw new Error(
            `Suppliers: ${
              supplierResult
                .error.message
            }`
          );
        }

        const productResult =
          await supabase
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
            );

        if (
          productResult.error
        ) {
          console.error(
            "PRODUCTS ERROR DETAILS:",
            {
              message:
                productResult
                  .error
                  .message,
              details:
                productResult
                  .error
                  .details,
              hint:
                productResult
                  .error
                  .hint,
              code:
                productResult
                  .error
                  .code,
            }
          );

          throw new Error(
            `Products: ${
              productResult
                .error.message
            }`
          );
        }

        setSuppliers(
          (supplierResult.data ??
            []) as SupplierProfile[]
        );

        setProducts(
          (productResult.data ??
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
            t.unableToLoad
          )
        );
      } finally {
        setLoading(false);
      }
    }, [t.unableToLoad]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadMarketplace();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
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
      const values =
        products
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

          for (
            const term of searchTerms
          ) {
            for (
              const value of searchableValues
            ) {
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

          for (
            const term of searchTerms
          ) {
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
    }, [marketplaceProducts]);

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

  const marketplaceHeading =
    selectedType === "rental"
      ? t.rentalTitle
      : selectedType === "sale"
        ? t.saleTitle
        : selectedType ===
            "spare-parts"
          ? t.sparePartsTitle
          : selectedCountry !==
              "all"
            ? `${t.productsIn} ${selectedCountry}`
            : t.globalProducts;

  return (
    <main
      dir={
        isArabic
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-slate-50"
    >
      {/* HERO */}

      <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-black text-white"
            >
              <Globe2 className="h-5 w-5 text-cyan-300" />
              Health Nations
            </Link>

            <div className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur">
              <Globe2 className="h-4 w-4 text-cyan-300" />

              <select
                value={language}
                onChange={(
                  event
                ) =>
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
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
                <Globe2 className="h-4 w-4" />
                {t.marketplaceBadge}
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {t.title}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                {t.description}
              </p>

              {selectedCountry !==
                "all" && (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100">
                  <Globe2 className="h-4 w-4" />
                  {t.market}:{" "}
                  {
                    selectedCountry
                  }
                </div>
              )}

              {selectedType ===
                "rental" && (
                <div className="mx-2 mt-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100">
                  <Tag className="h-4 w-4" />
                  {t.rentalTitle}
                </div>
              )}

              {selectedType ===
                "sale" && (
                <div className="mx-2 mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100">
                  <ShoppingBag className="h-4 w-4" />
                  {t.saleTitle}
                </div>
              )}

              {selectedType ===
                "spare-parts" && (
                <div className="mx-2 mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-100">
                  <Settings className="h-4 w-4" />
                  {
                    t.sparePartsTitle
                  }
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/supplier/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-slate-950 transition hover:bg-slate-100"
                >
                  {
                    t.becomeSupplier
                  }

                  <ChevronRight
                    className={`h-4 w-4 ${
                      isArabic
                        ? "rotate-180"
                        : ""
                    }`}
                  />
                </Link>

                <Link
                  href="/suppliers"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
                >
                  {
                    t.browseSuppliers
                  }

                  <Building2 className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label={
                  t.products
                }
                value={
                  products.length
                }
                icon={
                  <Package className="h-5 w-5" />
                }
              />

              <StatCard
                label={
                  t.suppliers
                }
                value={
                  suppliers.length
                }
                icon={
                  <Building2 className="h-5 w-5" />
                }
              />

              <StatCard
                label={
                  t.countries
                }
                value={
                  countries.length
                }
                icon={
                  <Globe2 className="h-5 w-5" />
                }
              />

              <StatCard
                label={
                  t.spareParts
                }
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

      {/* FILTERS */}

      <section className="sticky top-0 z-30 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto_auto]">
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
                {t.allCountries}
              </option>

              {countries.map(
                (country) => (
                  <option
                    key={
                      country
                    }
                    value={
                      country
                    }
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
                {t.allCategories}
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

            <select
              value={
                selectedType
              }
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
                {t.allProducts}
              </option>

              <option value="sale">
                {t.forSale}
              </option>

              <option value="rental">
                {t.forRental}
              </option>

              <option value="spare-parts">
                {t.spareParts}
              </option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <Globe2 className="h-3.5 w-3.5" />

              {selectedCountry ===
              "all"
                ? t.globalMarketplace
                : selectedCountry}
            </span>

            {selectedType !==
              "all" && (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                {selectedType ===
                "sale"
                  ? t.forSale
                  : selectedType ===
                      "rental"
                    ? t.forRental
                    : t.spareParts}
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
                className={`text-xs font-bold text-blue-700 hover:underline ${
                  isArabic
                    ? "mr-auto"
                    : "ml-auto"
                }`}
              >
                {
                  t.clearFilters
                }
              </button>
            )}
          </div>
        </div>
      </section>

      {/* PRODUCTS */}

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-950">
              {
                marketplaceHeading
              }
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {
                filteredProducts.length
              }{" "}
              {filteredProducts.length ===
              1
                ? t.productFound
                : t.productsFound}
            </p>

            {search.trim() && (
              <p className="mt-1 text-sm font-medium text-blue-700">
                {t.search}: &quot;
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
            {t.refresh}
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

              <p className="mt-3 text-slate-500">
                {t.loading}
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            <p className="font-semibold">
              {t.unableToLoad}
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
              {t.tryAgain}
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
            t={t}
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(
              (product) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  language={
                    language
                  }
                  t={t}
                  isArabic={
                    isArabic
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

function EmptyMarketplace({
  search,
  selectedType,
  selectedCountry,
  missingProductWhatsappUrl,
  t,
}: {
  search: string;
  selectedType: MarketplaceType;
  selectedCountry: string;
  missingProductWhatsappUrl: string;
  t: Translation;
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
          {t.noProductTitle}
        </h3>

        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          {t.noProductBefore}{" "}
          &quot;
          <strong>
            {requestedProduct}
          </strong>
          &quot;{" "}
          {selectedCountry !==
          "all"
            ? `${t.noProductCountry} ${selectedCountry}`
            : t.noProductGlobal}
          . {t.noProductAfter}
        </p>

        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          {t.searchHelp}
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

            {
              t.requestWhatsapp
            }
          </a>
        )}
      </div>
    );
  }

  if (
    selectedType ===
    "rental"
  ) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Tag className="mx-auto h-12 w-12 text-slate-300" />

        <h3 className="mt-4 text-xl font-bold text-slate-900">
          {t.noRentalTitle}
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-slate-500">
          {t.noRentalText}
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
          {t.rentalInquiry}
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
          {
            t.noSparePartsTitle
          }
        </h3>

        <p className="mx-auto mt-2 max-w-lg text-slate-500">
          {
            t.noSparePartsText
          }
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
          {
            t.requestSparePart
          }
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <Package className="mx-auto h-12 w-12 text-slate-300" />

      <h3 className="mt-4 text-xl font-bold text-slate-900">
        {t.noProductsTitle}
      </h3>

      <p className="mx-auto mt-2 max-w-lg text-slate-500">
        {t.noProductsText}
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
  language,
  t,
  isArabic,
}: {
  product: ProductWithSupplier;
  language: Language;
  t: Translation;
  isArabic: boolean;
}) {
  const supplier =
    product.supplier;

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
      ? supplier
          ?.company_name_ar ||
        supplier
          ?.company_name_en ||
        t.supplier
      : supplier
          ?.company_name_en ||
        supplier
          ?.company_name_ar ||
        t.supplier;

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
      product.part_condition,
      t
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

          <div
            className={`absolute top-3 flex flex-wrap gap-2 ${
              isArabic
                ? "right-3"
                : "left-3"
            }`}
          >
            {product.featured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                <Star className="h-3 w-3" />
                {t.featured}
              </span>
            )}

            {product.available_for_rental && (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {t.rental}
              </span>
            )}

            {sparePart && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-semibold text-white">
                <Settings className="h-3 w-3" />
                {t.sparePart}
              </span>
            )}
          </div>

          {supplier?.country && (
            <div
              className={`absolute bottom-3 inline-flex items-center gap-1 rounded-full bg-slate-950/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur ${
                isArabic
                  ? "left-3"
                  : "right-3"
              }`}
            >
              <Globe2 className="h-3 w-3" />
              {
                supplier.country
              }
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

        {secondaryProductName &&
          secondaryProductName !==
            productName && (
            <p
              className="mt-1 line-clamp-1 text-sm text-slate-500"
              dir={
                language ===
                "ar"
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
          <div className="mt-4 space-y-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
            {product.part_number && (
              <ProductInfoRow
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
              <ProductInfoRow
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
              <ProductInfoRow
                label={
                  t.compatible
                }
                value={
                  product.compatible_device
                }
              />
            )}

            {product.model && (
              <ProductInfoRow
                label={t.model}
                value={
                  product.model
                }
              />
            )}

            {condition && (
              <ProductInfoRow
                label={
                  t.condition
                }
                value={
                  condition
                }
                highlight
              />
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
                {t.salePrice}
              </p>

              <p className="mt-1 text-xl font-bold text-slate-950">
                {formatPrice(
                  product.sale_price,
                  product.currency,
                  language,
                  t.contactForPrice
                )}
              </p>
            </div>
          )}

          {product.available_for_rental &&
            product.monthly_rental_price !==
              null && (
              <div className="mt-3 rounded-xl bg-blue-50 p-3">
                <p className="text-xs font-medium text-blue-600">
                  {
                    t.monthlyRental
                  }
                </p>

                <p className="mt-1 font-bold text-blue-900">
                  {formatPrice(
                    product.monthly_rental_price,
                    product.currency,
                    language,
                    t.contactForPrice
                  )}
                </p>
              </div>
            )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500">
          {product.stock !==
            null && (
            <span>
              {t.stock}:{" "}
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
          {t.viewDetails}

          <ChevronRight
            className={`h-4 w-4 ${
              isArabic
                ? "rotate-180"
                : ""
            }`}
          />
        </Link>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <MessageCircle className="h-4 w-4" />
          {
            t.contactHealthNations
          }
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
                {
                  t.viewSupplierStore
                }

                <ChevronRight
                  className={`h-4 w-4 ${
                    isArabic
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </Link>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function ProductInfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <strong
        className={`break-all text-end ${
          highlight
            ? "text-amber-800"
            : "text-slate-900"
        }`}
      >
        {value}
      </strong>
    </div>
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
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (message) {
      return String(message);
    }
  }

  if (
    typeof error ===
    "string"
  ) {
    return error;
  }

  return fallback;
}