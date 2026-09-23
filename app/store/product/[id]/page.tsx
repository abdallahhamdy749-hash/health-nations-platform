"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Globe2,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Tag,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

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
  updated_at: string | null;
};

type SupplierProfile = {
  user_id: string;

  company_name_en: string | null;
  company_name_ar: string | null;

  slug: string;

  country: string | null;
  city: string | null;

  supplier_type: string | null;

  logo_url: string | null;
  verified: boolean | null;
};

type Translation = {
  marketplace: string;
  loadingProduct: string;

  productNotFound: string;
  productUnavailable: string;
  backMarketplace: string;

  medicalProduct: string;
  supplier: string;

  featured: string;
  sparePart: string;
  consumable: string;
  forSale: string;
  forRental: string;

  medicalSparePart: string;
  medicalConsumable: string;
  medicalEquipment: string;

  sparePartInformation: string;

  partNumber: string;
  manufacturer: string;
  compatibleDevice: string;
  compatibleModel: string;
  condition: string;
  brand: string;
  model: string;

  newCondition: string;
  refurbishedCondition: string;
  usedCondition: string;

  notSpecified: string;

  salePrice: string;
  monthlyRental: string;
  contactForPrice: string;

  stock: string;
  minimumOrder: string;
  contactHealthNations: string;

  productDescription: string;

  requestPrice: string;
  requestSparePartPrice: string;

  productCatalog: string;

  suppliedThrough: string;
  communicationNotice: string;

  viewSupplierStore: string;
};

const translations: Record<
  Language,
  Translation
> = {
  ar: {
    marketplace:
      "السوق العالمي",

    loadingProduct:
      "جاري تحميل المنتج...",

    productNotFound:
      "المنتج غير موجود",

    productUnavailable:
      "هذا المنتج غير متاح حاليًا.",

    backMarketplace:
      "العودة إلى السوق",

    medicalProduct:
      "منتج طبي",

    supplier: "المورد",

    featured: "مميز",

    sparePart:
      "قطعة غيار",

    consumable:
      "مستهلك طبي",

    forSale: "للبيع",

    forRental:
      "للتأجير",

    medicalSparePart:
      "قطعة غيار طبية",

    medicalConsumable:
      "مستهلك طبي",

    medicalEquipment:
      "جهاز طبي",

    sparePartInformation:
      "معلومات قطعة الغيار",

    partNumber:
      "رقم القطعة",

    manufacturer:
      "الشركة المصنعة",

    compatibleDevice:
      "الجهاز المتوافق",

    compatibleModel:
      "الموديل المتوافق",

    condition: "الحالة",

    brand: "الماركة",

    model: "الموديل",

    newCondition:
      "جديد",

    refurbishedCondition:
      "مجدد",

    usedCondition:
      "مستعمل",

    notSpecified:
      "غير محدد",

    salePrice:
      "سعر البيع",

    monthlyRental:
      "الإيجار الشهري",

    contactForPrice:
      "تواصل لمعرفة السعر",

    stock: "المخزون",

    minimumOrder:
      "الحد الأدنى للطلب",

    contactHealthNations:
      "تواصل مع صحة الأمم",

    productDescription:
      "وصف المنتج",

    requestPrice:
      "طلب السعر",

    requestSparePartPrice:
      "طلب سعر قطعة الغيار",

    productCatalog:
      "كتالوج المنتج",

    suppliedThrough:
      "هذا المنتج متوفر من خلال سوق صحة الأمم.",

    communicationNotice:
      "جميع طلبات الأسعار والتواصل التجاري تتم من خلال صحة الأمم.",

    viewSupplierStore:
      "عرض متجر المورد",
  },

  en: {
    marketplace:
      "Marketplace",

    loadingProduct:
      "Loading product...",

    productNotFound:
      "Product not found",

    productUnavailable:
      "This product is not available.",

    backMarketplace:
      "Back to Marketplace",

    medicalProduct:
      "Medical Product",

    supplier: "Supplier",

    featured: "Featured",

    sparePart:
      "Spare Part",

    consumable:
      "Consumable",

    forSale:
      "For Sale",

    forRental:
      "For Rental",

    medicalSparePart:
      "Medical Spare Part",

    medicalConsumable:
      "Medical Consumable",

    medicalEquipment:
      "Medical Equipment",

    sparePartInformation:
      "Spare Part Information",

    partNumber:
      "Part Number",

    manufacturer:
      "Manufacturer",

    compatibleDevice:
      "Compatible Device",

    compatibleModel:
      "Compatible Model",

    condition:
      "Condition",

    brand: "Brand",

    model: "Model",

    newCondition:
      "New",

    refurbishedCondition:
      "Refurbished",

    usedCondition:
      "Used",

    notSpecified:
      "Not specified",

    salePrice:
      "Sale Price",

    monthlyRental:
      "Monthly Rental",

    contactForPrice:
      "Contact for price",

    stock: "Stock",

    minimumOrder:
      "Minimum Order",

    contactHealthNations:
      "Contact Health Nations",

    productDescription:
      "Product Description",

    requestPrice:
      "Request Price",

    requestSparePartPrice:
      "Request Spare Part Price",

    productCatalog:
      "Product Catalog",

    suppliedThrough:
      "Product supplied through Health Nations Marketplace.",

    communicationNotice:
      "All price requests and business communication are handled through Health Nations.",

    viewSupplierStore:
      "View Supplier Store",
  },

  zh: {
    marketplace:
      "全球市场",

    loadingProduct:
      "正在加载产品...",

    productNotFound:
      "未找到产品",

    productUnavailable:
      "该产品当前不可用。",

    backMarketplace:
      "返回全球市场",

    medicalProduct:
      "医疗产品",

    supplier: "供应商",

    featured: "精选",

    sparePart: "备件",

    consumable:
      "医疗耗材",

    forSale: "销售",

    forRental: "租赁",

    medicalSparePart:
      "医疗设备备件",

    medicalConsumable:
      "医疗耗材",

    medicalEquipment:
      "医疗设备",

    sparePartInformation:
      "备件信息",

    partNumber:
      "零件编号",

    manufacturer:
      "制造商",

    compatibleDevice:
      "兼容设备",

    compatibleModel:
      "兼容型号",

    condition: "状态",

    brand: "品牌",

    model: "型号",

    newCondition:
      "全新",

    refurbishedCondition:
      "翻新",

    usedCondition:
      "二手",

    notSpecified:
      "未指定",

    salePrice:
      "销售价格",

    monthlyRental:
      "月租金",

    contactForPrice:
      "联系询价",

    stock: "库存",

    minimumOrder:
      "最小订购量",

    contactHealthNations:
      "联系 Health Nations",

    productDescription:
      "产品描述",

    requestPrice:
      "询价",

    requestSparePartPrice:
      "备件询价",

    productCatalog:
      "产品目录",

    suppliedThrough:
      "本产品通过 Health Nations 全球市场提供。",

    communicationNotice:
      "所有询价和商务沟通均通过 Health Nations 进行。",

    viewSupplierStore:
      "查看供应商商店",
  },

  tr: {
    marketplace:
      "Küresel Pazar",

    loadingProduct:
      "Ürün yükleniyor...",

    productNotFound:
      "Ürün bulunamadı",

    productUnavailable:
      "Bu ürün şu anda mevcut değil.",

    backMarketplace:
      "Pazara Dön",

    medicalProduct:
      "Medikal Ürün",

    supplier:
      "Tedarikçi",

    featured:
      "Öne Çıkan",

    sparePart:
      "Yedek Parça",

    consumable:
      "Tıbbi Sarf Malzemesi",

    forSale:
      "Satılık",

    forRental:
      "Kiralık",

    medicalSparePart:
      "Tıbbi Yedek Parça",

    medicalConsumable:
      "Tıbbi Sarf Malzemesi",

    medicalEquipment:
      "Tıbbi Cihaz",

    sparePartInformation:
      "Yedek Parça Bilgileri",

    partNumber:
      "Parça Numarası",

    manufacturer:
      "Üretici",

    compatibleDevice:
      "Uyumlu Cihaz",

    compatibleModel:
      "Uyumlu Model",

    condition:
      "Durum",

    brand: "Marka",

    model: "Model",

    newCondition:
      "Yeni",

    refurbishedCondition:
      "Yenilenmiş",

    usedCondition:
      "Kullanılmış",

    notSpecified:
      "Belirtilmemiş",

    salePrice:
      "Satış Fiyatı",

    monthlyRental:
      "Aylık Kira",

    contactForPrice:
      "Fiyat için iletişime geçin",

    stock: "Stok",

    minimumOrder:
      "Minimum Sipariş",

    contactHealthNations:
      "Health Nations ile İletişime Geç",

    productDescription:
      "Ürün Açıklaması",

    requestPrice:
      "Fiyat Talep Et",

    requestSparePartPrice:
      "Yedek Parça Fiyatı Talep Et",

    productCatalog:
      "Ürün Kataloğu",

    suppliedThrough:
      "Ürün Health Nations Marketplace üzerinden sağlanmaktadır.",

    communicationNotice:
      "Tüm fiyat talepleri ve ticari iletişim Health Nations üzerinden gerçekleştirilir.",

    viewSupplierStore:
      "Tedarikçi Mağazasını Gör",
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
) {
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
  product: SupplierProduct
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

function getProductKindLabel(
  product: SupplierProduct,
  t: Translation
) {
  if (isSparePartProduct(product)) {
    return t.medicalSparePart;
  }

  if (
    product.product_kind ===
    "consumable"
  ) {
    return t.medicalConsumable;
  }

  return t.medicalEquipment;
}

function formatCondition(
  condition: PartCondition | null,
  t: Translation
) {
  if (condition === "new") {
    return t.newCondition;
  }

  if (
    condition === "refurbished"
  ) {
    return t.refurbishedCondition;
  }

  if (condition === "used") {
    return t.usedCondition;
  }

  return "";
}

export default function ProductDetailsPage() {
  const params =
    useParams<{ id: string }>();

  const productId = params.id;

  const {
    language,
    setLanguage,
    isArabic,
  } = useLanguage();

  const t =
    translations[language];

  const [product, setProduct] =
    useState<SupplierProduct | null>(
      null
    );

  const [supplier, setSupplier] =
    useState<SupplierProfile | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadProduct =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
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
            featured,
            created_at,
            updated_at
          `)
          .eq("id", productId)
          .eq("status", "approved")
          .single();

        if (productError) {
          throw productError;
        }

        const loadedProduct =
          productData as SupplierProduct;

        setProduct(
          loadedProduct
        );

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
            logo_url,
            verified
          `)
          .eq(
            "user_id",
            loadedProduct.supplier_id
          )
          .maybeSingle();

        if (supplierError) {
          throw supplierError;
        }

        setSupplier(
          (supplierData as SupplierProfile | null) ??
            null
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Product details loading error:",
          error
        );

        setErrorMessage(
          getErrorMessage(
            error,
            translations.en
              .productUnavailable
          )
        );
      } finally {
        setLoading(false);
      }
    }, [productId]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadProduct();
      }, 0);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadProduct]);

  if (loading) {
    return (
      <main
        dir={
          isArabic ? "rtl" : "ltr"
        }
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-700" />

          <p className="mt-4 text-slate-600">
            {t.loadingProduct}
          </p>
        </div>
      </main>
    );
  }

  if (
    errorMessage ||
    !product
  ) {
    return (
      <main
        dir={
          isArabic ? "rtl" : "ltr"
        }
        className="min-h-screen bg-slate-50 px-5 py-16"
      >
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8">
          <h1 className="text-2xl font-black text-slate-950">
            {t.productNotFound}
          </h1>

          <p className="mt-3 text-red-600">
            {errorMessage ||
              t.productUnavailable}
          </p>

          <Link
            href="/store"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
          >
            <ArrowLeft
              size={18}
              className={
                isArabic
                  ? "rotate-180"
                  : ""
              }
            />

            {t.backMarketplace}
          </Link>
        </div>
      </main>
    );
  }

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

  const productDescription =
    language === "ar"
      ? product.description_ar ||
        product.description_en
      : product.description_en ||
        product.description_ar;

  const secondaryDescription =
    language === "ar"
      ? product.description_en
      : product.description_ar;

  const supplierName =
    language === "ar"
      ? supplier?.company_name_ar ||
        supplier?.company_name_en ||
        t.supplier
      : supplier?.company_name_en ||
        supplier?.company_name_ar ||
        t.supplier;

  const secondarySupplierName =
    language === "ar"
      ? supplier?.company_name_en
      : supplier?.company_name_ar;

  const sparePart =
    isSparePartProduct(
      product
    );

  const productKindLabel =
    getProductKindLabel(
      product,
      t
    );

  const condition =
    formatCondition(
      product.part_condition,
      t
    );

  const whatsappMessage =
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
Compatible Model: ${product.model || "Not specified"}
Condition: ${condition || "Not specified"}
Supplier: ${supplierName}
Supplier Country: ${supplier?.country || "Not specified"}
Source: Health Nations Global Marketplace`
      : `استفسار عن منتج من منصة صحة الأمم

المنتج: ${productName}
رقم المنتج: ${product.id}
النوع: ${productKindLabel}
الماركة: ${product.brand || "غير محدد"}
الموديل: ${product.model || "غير محدد"}
المورد: ${supplierName}
دولة المورد: ${supplier?.country || "غير محدد"}

أرغب في معرفة السعر والتوفر والتفاصيل.

Product Inquiry
Product: ${productName}
Product ID: ${product.id}
Type: ${productKindLabel}
Brand: ${product.brand || "Not specified"}
Model: ${product.model || "Not specified"}
Supplier: ${supplierName}
Supplier Country: ${supplier?.country || "Not specified"}
Source: Health Nations Global Marketplace`;

  const whatsappUrl =
    createWhatsAppUrl(
      HEALTH_NATIONS_WHATSAPP,
      whatsappMessage
    );

  return (
    <main
      dir={
        isArabic ? "rtl" : "ltr"
      }
      className="min-h-screen bg-slate-50"
    >
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 font-bold text-slate-700 transition hover:text-blue-700"
          >
            <ArrowLeft
              size={19}
              className={
                isArabic
                  ? "rotate-180"
                  : ""
              }
            />

            {t.marketplace}
          </Link>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Globe2
                size={17}
                className="text-blue-700"
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
                className="cursor-pointer bg-transparent text-sm font-bold text-slate-700 outline-none"
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
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <Link
              href="/"
              className="hidden font-black text-blue-800 sm:block"
            >
              Health Nations Medical
            </Link>
          </div>
        </div>
      </header>

      {/* PRODUCT */}

      <section className="mx-auto max-w-7xl px-5 py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* IMAGE */}

          <div>
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="aspect-square">
                {product.image_url ? (
                  <img
                    src={
                      product.image_url
                    }
                    alt={
                      productName
                    }
                    className="h-full w-full object-contain p-5"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-100">
                    {sparePart ? (
                      <Settings className="h-20 w-20 text-slate-300" />
                    ) : (
                      <ImageIcon className="h-20 w-20 text-slate-300" />
                    )}
                  </div>
                )}
              </div>

              <div
                className={`absolute top-5 flex flex-wrap gap-2 ${
                  isArabic
                    ? "right-5"
                    : "left-5"
                }`}
              >
                {product.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800">
                    <Star
                      size={15}
                    />

                    {t.featured}
                  </span>
                )}

                {sparePart && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-bold text-white">
                    <Settings
                      size={15}
                    />

                    {t.sparePart}
                  </span>
                )}

                {product.product_kind ===
                  "consumable" && (
                  <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-sm font-bold text-cyan-800">
                    {t.consumable}
                  </span>
                )}

                {product.available_for_sale && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700">
                    {t.forSale}
                  </span>
                )}

                {product.available_for_rental && (
                  <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
                    {t.forRental}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DETAILS */}

          <div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                {
                  productKindLabel
                }
              </span>

              {product.category && (
                <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700">
                  {
                    product.category
                  }
                </span>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-black leading-tight text-slate-950 md:text-5xl">
              {productName}
            </h1>

            {secondaryProductName &&
              secondaryProductName !==
                productName && (
                <p
                  dir={
                    language === "ar"
                      ? "ltr"
                      : "rtl"
                  }
                  className="mt-3 text-xl font-bold text-slate-500"
                >
                  {
                    secondaryProductName
                  }
                </p>
              )}

            {/* SPARE PART DATA */}

            {sparePart ? (
              <section className="mt-7 rounded-3xl border border-amber-200 bg-amber-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-500 p-3 text-white">
                    <Settings
                      size={24}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      {
                        t.medicalSparePart
                      }
                    </p>

                    <h2 className="text-xl font-black text-slate-950">
                      {
                        t.sparePartInformation
                      }
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    label={
                      t.partNumber
                    }
                    value={
                      product.part_number ||
                      t.notSpecified
                    }
                  />

                  <DetailBox
                    label={
                      t.manufacturer
                    }
                    value={
                      product.manufacturer ||
                      product.brand ||
                      t.notSpecified
                    }
                  />

                  <DetailBox
                    label={
                      t.compatibleDevice
                    }
                    value={
                      product.compatible_device ||
                      t.notSpecified
                    }
                  />

                  <DetailBox
                    label={
                      t.compatibleModel
                    }
                    value={
                      product.model ||
                      t.notSpecified
                    }
                  />

                  <DetailBox
                    label={
                      t.condition
                    }
                    value={
                      condition ||
                      t.notSpecified
                    }
                  />

                  {product.brand && (
                    <DetailBox
                      label={
                        t.brand
                      }
                      value={
                        product.brand
                      }
                    />
                  )}
                </div>
              </section>
            ) : (
              (product.brand ||
                product.model) && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {product.brand && (
                    <DetailBox
                      label={
                        t.brand
                      }
                      value={
                        product.brand
                      }
                    />
                  )}

                  {product.model && (
                    <DetailBox
                      label={
                        t.model
                      }
                      value={
                        product.model
                      }
                    />
                  )}
                </div>
              )
            )}

            {/* SALE PRICE */}

            {product.available_for_sale && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-bold text-slate-500">
                  {t.salePrice}
                </p>

                <p className="mt-2 text-4xl font-black text-slate-950">
                  {formatPrice(
                    product.sale_price,
                    product.currency,
                    language,
                    t.contactForPrice
                  )}
                </p>
              </div>
            )}

            {/* RENTAL */}

            {product.available_for_rental && (
              <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-sm font-bold text-blue-600">
                  {
                    t.monthlyRental
                  }
                </p>

                <p className="mt-2 text-3xl font-black text-blue-950">
                  {formatPrice(
                    product.monthly_rental_price,
                    product.currency,
                    language,
                    t.contactForPrice
                  )}
                </p>
              </div>
            )}

            {/* STOCK */}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <InfoBox
                icon={
                  <Package
                    size={20}
                  />
                }
                label={t.stock}
                value={
                  product.stock !==
                  null
                    ? String(
                        product.stock
                      )
                    : t.contactHealthNations
                }
              />

              <InfoBox
                icon={
                  <Tag
                    size={20}
                  />
                }
                label={
                  t.minimumOrder
                }
                value={
                  product.minimum_order_quantity !==
                  null
                    ? String(
                        product.minimum_order_quantity
                      )
                    : "1"
                }
              />
            </div>

            {/* DESCRIPTION */}

            {productDescription && (
              <div className="mt-8">
                <h2 className="text-xl font-black text-slate-950">
                  {
                    t.productDescription
                  }
                </h2>

                <p className="mt-3 whitespace-pre-line leading-8 text-slate-600">
                  {
                    productDescription
                  }
                </p>

                {secondaryDescription &&
                  secondaryDescription !==
                    productDescription && (
                    <p
                      dir={
                        language ===
                        "ar"
                          ? "ltr"
                          : "rtl"
                      }
                      className="mt-4 whitespace-pre-line leading-8 text-slate-500"
                    >
                      {
                        secondaryDescription
                      }
                    </p>
                  )}
              </div>
            )}

            {/* ACTIONS */}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white transition hover:bg-emerald-500"
              >
                <MessageCircle
                  size={20}
                />

                {
                  t.contactHealthNations
                }
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 font-black text-white transition hover:bg-blue-800"
              >
                <ShoppingCart
                  size={20}
                />

                {sparePart
                  ? t.requestSparePartPrice
                  : t.requestPrice}
              </a>
            </div>

            {/* CATALOG */}

            {product.catalog_url && (
              <div className="mt-5">
                <a
                  href={
                    product.catalog_url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText
                    size={17}
                  />

                  {
                    t.productCatalog
                  }
                </a>
              </div>
            )}
          </div>
        </div>

        {/* SUPPLIER */}

        {supplier && (
          <section className="mt-14 rounded-3xl border border-slate-200 bg-white p-7 md:p-9">
            <div className="grid gap-7 md:grid-cols-[auto_1fr_auto] md:items-center">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
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
                  <Building2 className="h-9 w-9 text-slate-400" />
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-black text-slate-950">
                    {supplierName}
                  </h2>

                  {supplier.verified && (
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                {secondarySupplierName &&
                  secondarySupplierName !==
                    supplierName && (
                    <p
                      dir={
                        language ===
                        "ar"
                          ? "ltr"
                          : "rtl"
                      }
                      className="mt-1 text-slate-500"
                    >
                      {
                        secondarySupplierName
                      }
                    </p>
                  )}

                {(supplier.city ||
                  supplier.country) && (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                    <MapPin
                      size={16}
                    />

                    {[
                      supplier.city,
                      supplier.country,
                    ]
                      .filter(
                        Boolean
                      )
                      .join(", ")}
                  </p>
                )}

                <p className="mt-3 text-sm text-slate-500">
                  {
                    t.suppliedThrough
                  }
                </p>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {
                    t.communicationNotice
                  }
                </p>
              </div>

              {supplier.slug && (
                <Link
                  href={`/store/${supplier.slug}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 font-black text-white transition hover:bg-blue-700"
                >
                  <Building2
                    size={19}
                  />

                  {
                    t.viewSupplierStore
                  }
                </Link>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-[150px] rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-xs font-semibold text-slate-500">
        {label}
      </span>

      <p className="mt-1 break-words font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-sm font-bold">
          {label}
        </span>
      </div>

      <p className="mt-2 font-black text-slate-950">
        {value}
      </p>
    </div>
  );
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