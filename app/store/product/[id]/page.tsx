"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
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

  /*
   * Legacy fallback for spare parts
   * created before product_kind existed.
   */
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
  product: SupplierProduct
) {
  if (isSparePartProduct(product)) {
    return "Medical Spare Part";
  }

  if (
    product.product_kind ===
    "consumable"
  ) {
    return "Medical Consumable";
  }

  return "Medical Equipment";
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

  return "";
}

export default function ProductDetailsPage() {
  const params =
    useParams<{ id: string }>();

  const productId = params.id;

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
            "Unable to load product."
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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-700" />

          <p className="mt-4 text-slate-600">
            Loading product...
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
      <main className="min-h-screen bg-slate-50 px-5 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-8">
          <h1 className="text-2xl font-black text-slate-950">
            Product not found
          </h1>

          <p className="mt-3 text-red-600">
            {errorMessage ||
              "This product is not available."}
          </p>

          <Link
            href="/store"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white"
          >
            <ArrowLeft
              size={18}
            />
            Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const productName =
    product.name_en ||
    product.name_ar ||
    "Medical Product";

  const supplierName =
    supplier?.company_name_en ||
    supplier?.company_name_ar ||
    "Supplier";

  const sparePart =
    isSparePartProduct(
      product
    );

  const productKindLabel =
    getProductKindLabel(
      product
    );

  const condition =
    formatCondition(
      product.part_condition
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
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link
            href="/store"
            className="inline-flex items-center gap-2 font-bold text-slate-700 transition hover:text-blue-700"
          >
            <ArrowLeft
              size={19}
            />
            Marketplace
          </Link>

          <Link
            href="/"
            className="font-black text-blue-800"
          >
            Health Nations Medical
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-2">
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

              <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                {product.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800">
                    <Star
                      size={15}
                    />
                    Featured
                  </span>
                )}

                {sparePart && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-bold text-white">
                    <Settings
                      size={15}
                    />
                    Spare Part
                  </span>
                )}

                {product.product_kind ===
                  "consumable" && (
                  <span className="rounded-full bg-cyan-100 px-3 py-1.5 text-sm font-bold text-cyan-800">
                    Consumable
                  </span>
                )}

                {product.available_for_sale && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700">
                    For Sale
                  </span>
                )}

                {product.available_for_rental && (
                  <span className="rounded-full bg-blue-100 px-3 py-1.5 text-sm font-bold text-blue-700">
                    For Rental
                  </span>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-sm font-bold text-white">
                {productKindLabel}
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

            {product.name_ar &&
              product.name_en && (
                <p
                  dir="rtl"
                  className="mt-3 text-xl font-bold text-slate-500"
                >
                  {
                    product.name_ar
                  }
                </p>
              )}

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
                      Medical Spare Part
                    </p>

                    <h2 className="text-xl font-black text-slate-950">
                      Spare Part Information
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <DetailBox
                    label="Part Number"
                    value={
                      product.part_number ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Manufacturer"
                    value={
                      product.manufacturer ||
                      product.brand ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Compatible Device"
                    value={
                      product.compatible_device ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Compatible Model"
                    value={
                      product.model ||
                      "Not specified"
                    }
                  />

                  <DetailBox
                    label="Condition"
                    value={
                      condition ||
                      "Not specified"
                    }
                  />

                  {product.brand && (
                    <DetailBox
                      label="Brand"
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
                      label="Brand"
                      value={
                        product.brand
                      }
                    />
                  )}

                  {product.model && (
                    <DetailBox
                      label="Model"
                      value={
                        product.model
                      }
                    />
                  )}
                </div>
              )
            )}

            {product.available_for_sale && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
                <p className="text-sm font-bold text-slate-500">
                  Sale Price
                </p>

                <p className="mt-2 text-4xl font-black text-slate-950">
                  {formatPrice(
                    product.sale_price,
                    product.currency
                  )}
                </p>
              </div>
            )}

            {product.available_for_rental && (
              <div className="mt-4 rounded-3xl border border-blue-200 bg-blue-50 p-6">
                <p className="text-sm font-bold text-blue-600">
                  Monthly Rental
                </p>

                <p className="mt-2 text-3xl font-black text-blue-950">
                  {formatPrice(
                    product.monthly_rental_price,
                    product.currency
                  )}
                </p>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <InfoBox
                icon={
                  <Package
                    size={20}
                  />
                }
                label="Stock"
                value={
                  product.stock !==
                  null
                    ? String(
                        product.stock
                      )
                    : "Contact Health Nations"
                }
              />

              <InfoBox
                icon={
                  <Tag
                    size={20}
                  />
                }
                label="Minimum Order"
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

            {(product.description_en ||
              product.description_ar) && (
              <div className="mt-8">
                <h2 className="text-xl font-black">
                  Product Description
                </h2>

                {product.description_en && (
                  <p className="mt-3 leading-8 text-slate-600">
                    {
                      product.description_en
                    }
                  </p>
                )}

                {product.description_ar && (
                  <p
                    dir="rtl"
                    className="mt-3 leading-8 text-slate-600"
                  >
                    {
                      product.description_ar
                    }
                  </p>
                )}
              </div>
            )}

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

                Contact Health Nations
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
                  ? "Request Spare Part Price"
                  : "Request Price"}
              </a>
            </div>

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
                  Product Catalog
                </a>
              </div>
            )}
          </div>
        </div>

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

                {supplier.company_name_ar &&
                  supplier.company_name_en && (
                    <p
                      dir="rtl"
                      className="mt-1 text-slate-500"
                    >
                      {
                        supplier.company_name_ar
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
                  Product supplied through Health Nations Marketplace.
                </p>

                <p
                  className="mt-1 text-sm text-slate-500"
                  dir="rtl"
                >
                  جميع طلبات الأسعار والتواصل التجاري تتم من خلال صحة الأمم.
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
                  View Supplier Store
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