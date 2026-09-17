"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Save,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "SAR"
  | "AED"
  | "EGP"
  | "CNY"
  | "TRY"
  | "INR";

type ProductKind =
  | "equipment"
  | "consumable"
  | "spare_part";

type PartCondition =
  | ""
  | "new"
  | "refurbished"
  | "used";

type ProductForm = {
  productKind: ProductKind;

  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;

  category: string;
  brand: string;
  model: string;

  partNumber: string;
  manufacturer: string;
  compatibleDevice: string;
  partCondition: PartCondition;

  imageUrl: string;
  catalogUrl: string;
  alibabaUrl: string;

  salePrice: string;
  currency: Currency;
  minimumOrderQuantity: string;
  stock: string;

  availableForSale: boolean;
  availableForRental: boolean;
  monthlyRentalPrice: string;
};

type ProductRecord = {
  id: number;
  supplier_id: string;

  product_kind: string | null;

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
  part_condition: string | null;

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
};

const STORAGE_BUCKET = "vendor-assets";
const CATALOG_FOLDER = "catalogs";
const MAX_CATALOG_SIZE = 20 * 1024 * 1024;

const initialForm: ProductForm = {
  productKind: "equipment",

  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",

  category: "",
  brand: "",
  model: "",

  partNumber: "",
  manufacturer: "",
  compatibleDevice: "",
  partCondition: "",

  imageUrl: "",
  catalogUrl: "",
  alibabaUrl: "",

  salePrice: "",
  currency: "USD",
  minimumOrderQuantity: "1",
  stock: "0",

  availableForSale: true,
  availableForRental: false,
  monthlyRentalPrice: "",
};

const currencyOptions = [
  {
    value: "USD",
    label: "USD — US Dollar",
  },
  {
    value: "EUR",
    label: "EUR — Euro",
  },
  {
    value: "GBP",
    label: "GBP — British Pound",
  },
  {
    value: "SAR",
    label: "SAR — Saudi Riyal",
  },
  {
    value: "AED",
    label: "AED — UAE Dirham",
  },
  {
    value: "EGP",
    label: "EGP — Egyptian Pound",
  },
  {
    value: "CNY",
    label: "CNY — Chinese Yuan",
  },
  {
    value: "TRY",
    label: "TRY — Turkish Lira",
  },
  {
    value: "INR",
    label: "INR — Indian Rupee",
  },
];

export default function EditVendorProductPage() {
  const router = useRouter();

  const params = useParams<{
    productId: string;
  }>();

  const productId = params.productId;

  const [form, setForm] =
    useState<ProductForm>(initialForm);

  const [product, setProduct] =
    useState<ProductRecord | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingCatalog, setUploadingCatalog] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [catalogMessage, setCatalogMessage] =
    useState("");

  const loadProduct = useCallback(async () => {
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

      const numericProductId =
        Number(productId);

      if (
        !Number.isInteger(
          numericProductId
        )
      ) {
        throw new Error(
          "Invalid product ID."
        );
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
            status
          `)
          .eq(
            "id",
            numericProductId
          )
          .eq(
            "supplier_id",
            user.id
          )
          .maybeSingle();

      if (error) {
        throw new Error(
          `${error.message}${
            error.code
              ? ` — Code: ${error.code}`
              : ""
          }`
        );
      }

      if (!data) {
        throw new Error(
          "Product not found."
        );
      }

      const record =
        data as ProductRecord;

      setProduct(record);

      const productKind =
        normalizeProductKind(
          record.product_kind
        );

      setForm({
        productKind,

        nameEn:
          record.name_en || "",

        nameAr:
          record.name_ar || "",

        descriptionEn:
          record.description_en || "",

        descriptionAr:
          record.description_ar || "",

        category:
          record.category || "",

        brand:
          record.brand || "",

        model:
          record.model || "",

        partNumber:
          record.part_number || "",

        manufacturer:
          record.manufacturer || "",

        compatibleDevice:
          record.compatible_device || "",

        partCondition:
          normalizePartCondition(
            record.part_condition
          ),

        imageUrl:
          record.image_url || "",

        catalogUrl:
          record.catalog_url || "",

        alibabaUrl:
          record.alibaba_url || "",

        salePrice:
          record.sale_price !== null
            ? String(
                record.sale_price
              )
            : "",

        currency:
          normalizeCurrency(
            record.currency
          ),

        minimumOrderQuantity:
          String(
            record.minimum_order_quantity ??
              1
          ),

        stock:
          String(
            record.stock ?? 0
          ),

        availableForSale:
          record.available_for_sale ??
          true,

        availableForRental:
          productKind === "equipment"
            ? record.available_for_rental ??
              false
            : false,

        monthlyRentalPrice:
          productKind ===
            "equipment" &&
          record.monthly_rental_price !==
            null
            ? String(
                record.monthly_rental_price
              )
            : "",
      });
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load the product."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void loadProduct();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProduct]);

  function updateField<
    K extends keyof ProductForm,
  >(
    field: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleProductKindChange(
    value: ProductKind
  ) {
    setForm((current) => ({
      ...current,

      productKind: value,

      category:
        value === "spare_part"
          ? "Medical Equipment Spare Parts"
          : current.category ===
              "Medical Equipment Spare Parts"
            ? ""
            : current.category,

      availableForRental:
        value === "equipment"
          ? current.availableForRental
          : false,

      monthlyRentalPrice:
        value === "equipment"
          ? current.monthlyRentalPrice
          : "",

      partNumber:
        value === "spare_part"
          ? current.partNumber
          : "",

      manufacturer:
        value === "spare_part"
          ? current.manufacturer
          : "",

      compatibleDevice:
        value === "spare_part"
          ? current.compatibleDevice
          : "",

      partCondition:
        value === "spare_part"
          ? current.partCondition
          : "",
    }));
  }

  async function handleCatalogUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setUploadingCatalog(true);
      setErrorMessage("");
      setCatalogMessage("");

      if (
        file.type !==
          "application/pdf" &&
        !file.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        throw new Error(
          "الكتالوج يجب أن يكون ملف PDF."
        );
      }

      if (
        file.size >
        MAX_CATALOG_SIZE
      ) {
        throw new Error(
          "حجم ملف الكتالوج يجب ألا يتجاوز 20 MB."
        );
      }

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

      if (
        !product ||
        product.supplier_id !==
          user.id
      ) {
        throw new Error(
          "You cannot upload a catalog for this product."
        );
      }

      const safeFileName =
        sanitizeFileName(
          file.name
        );

      const filePath =
        `${CATALOG_FOLDER}/${user.id}/` +
        `${product.id}-${Date.now()}-${safeFileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(
            filePath,
            file,
            {
              contentType:
                "application/pdf",
              cacheControl: "3600",
              upsert: false,
            }
          );

      if (uploadError) {
        throw new Error(
          `Catalog upload failed: ${uploadError.message}`
        );
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "Unable to generate the catalog URL."
        );
      }

      updateField(
        "catalogUrl",
        publicUrl
      );

      setCatalogMessage(
        "تم رفع الكتالوج بنجاح. اضغط Save Changes لحفظه مع المنتج."
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to upload the catalog."
        )
      );
    } finally {
      setUploadingCatalog(false);
    }
  }

  function removeCatalog() {
    updateField(
      "catalogUrl",
      ""
    );

    setCatalogMessage(
      "تم إزالة رابط الكتالوج من النموذج. اضغط Save Changes لتأكيد التغيير."
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

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

      if (
        !product ||
        product.supplier_id !==
          user.id
      ) {
        throw new Error(
          "You cannot edit this product."
        );
      }

      const nameEn =
        form.nameEn.trim();

      const category =
        form.category.trim();

      if (!nameEn) {
        throw new Error(
          "اكتب اسم المنتج باللغة الإنجليزية."
        );
      }

      if (!category) {
        throw new Error(
          "اكتب تصنيف المنتج."
        );
      }

      if (
        form.productKind ===
          "spare_part" &&
        !form.partNumber.trim()
      ) {
        throw new Error(
          "أدخل Part Number لقطعة الغيار."
        );
      }

      if (
        form.productKind ===
          "spare_part" &&
        !form.compatibleDevice.trim()
      ) {
        throw new Error(
          "أدخل الجهاز المتوافق مع قطعة الغيار."
        );
      }

      if (
        !form.availableForSale &&
        !form.availableForRental
      ) {
        throw new Error(
          "يجب تحديد المنتج للبيع أو للإيجار على الأقل."
        );
      }

      const salePrice =
        form.availableForSale &&
        form.salePrice.trim()
          ? Number(
              form.salePrice
            )
          : null;

      const monthlyRentalPrice =
        form.productKind ===
          "equipment" &&
        form.availableForRental &&
        form.monthlyRentalPrice.trim()
          ? Number(
              form.monthlyRentalPrice
            )
          : null;

      const stock =
        Number(
          form.stock || 0
        );

      const minimumOrderQuantity =
        Number(
          form.minimumOrderQuantity ||
            1
        );

      if (
        salePrice !== null &&
        (!Number.isFinite(
          salePrice
        ) ||
          salePrice < 0)
      ) {
        throw new Error(
          "سعر البيع غير صحيح."
        );
      }

      if (
        monthlyRentalPrice !==
          null &&
        (!Number.isFinite(
          monthlyRentalPrice
        ) ||
          monthlyRentalPrice < 0)
      ) {
        throw new Error(
          "سعر الإيجار الشهري غير صحيح."
        );
      }

      if (
        !Number.isInteger(
          stock
        ) ||
        stock < 0
      ) {
        throw new Error(
          "كمية المخزون يجب أن تكون رقمًا صحيحًا."
        );
      }

      if (
        !Number.isInteger(
          minimumOrderQuantity
        ) ||
        minimumOrderQuantity < 1
      ) {
        throw new Error(
          "الحد الأدنى للطلب يجب ألا يقل عن 1."
        );
      }

      const isSparePart =
        form.productKind ===
        "spare_part";

      const isEquipment =
        form.productKind ===
        "equipment";

      const { error } =
        await supabase
          .from(
            "supplier_products"
          )
          .update({
            product_kind:
              form.productKind,

            name_en: nameEn,

            name_ar:
              emptyToNull(
                form.nameAr
              ),

            description_en:
              emptyToNull(
                form.descriptionEn
              ),

            description_ar:
              emptyToNull(
                form.descriptionAr
              ),

            category,

            brand:
              emptyToNull(
                form.brand
              ),

            model:
              emptyToNull(
                form.model
              ),

            part_number:
              isSparePart
                ? emptyToNull(
                    form.partNumber
                  )
                : null,

            manufacturer:
              isSparePart
                ? emptyToNull(
                    form.manufacturer
                  )
                : null,

            compatible_device:
              isSparePart
                ? emptyToNull(
                    form.compatibleDevice
                  )
                : null,

            part_condition:
              isSparePart
                ? emptyToNull(
                    form.partCondition
                  )
                : null,

            image_url:
              emptyToNull(
                form.imageUrl
              ),

            catalog_url:
              emptyToNull(
                form.catalogUrl
              ),

            alibaba_url:
              emptyToNull(
                form.alibabaUrl
              ),

            sale_price:
              salePrice,

            currency:
              form.currency,

            minimum_order_quantity:
              minimumOrderQuantity,

            stock,

            available_for_sale:
              form.availableForSale,

            available_for_rental:
              isEquipment
                ? form.availableForRental
                : false,

            monthly_rental_price:
              isEquipment
                ? monthlyRentalPrice
                : null,

            status: "pending",

            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "id",
            product.id
          )
          .eq(
            "supplier_id",
            user.id
          );

      if (error) {
        const fullMessage = [
          error.message,

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

        throw new Error(
          fullMessage
        );
      }

      setSuccessMessage(
        "تم تحديث المنتج وإرساله للمراجعة مرة أخرى."
      );

      window.setTimeout(() => {
        router.push(
          "/vendor/products"
        );

        router.refresh();
      }, 1000);
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to update product."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-blue-700" />

          <span className="font-bold text-slate-700">
            Loading product...
          </span>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto text-red-600"
            size={42}
          />

          <h1 className="mt-4 text-2xl font-black">
            Product not found
          </h1>

          <p className="mt-3 text-slate-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/vendor/products"
              )
            }
            className="mt-6 rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white"
          >
            Back to Products
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/vendor/products"
            )
          }
          className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={20} />
          Back to Products
        </button>

        <header className="rounded-[32px] bg-slate-950 p-7 text-white shadow-sm md:p-10">
          <p className="font-bold uppercase tracking-wider text-blue-300">
            Global Vendor Products
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Edit Product
          </h1>

          <p
            className="mt-3 text-slate-300"
            dir="rtl"
          >
            عدّل بيانات المنتج أو
            المستلزم أو قطعة الغيار.
          </p>
        </header>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={22}
            />

            <div>
              <strong className="block text-lg">
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
              className="mt-0.5 shrink-0"
              size={22}
            />

            <p className="font-bold">
              {successMessage}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <FormSection
            title="Product Type"
            subtitle="Choose the correct marketplace product type."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ProductTypeCard
                title="Medical Equipment"
                description="Medical devices, machines and equipment."
                selected={
                  form.productKind ===
                  "equipment"
                }
                onClick={() =>
                  handleProductKindChange(
                    "equipment"
                  )
                }
              />

              <ProductTypeCard
                title="Medical Consumable"
                description="Disposable products and medical supplies."
                selected={
                  form.productKind ===
                  "consumable"
                }
                onClick={() =>
                  handleProductKindChange(
                    "consumable"
                  )
                }
              />

              <ProductTypeCard
                title="Medical Spare Part"
                description="Replacement parts for medical equipment."
                selected={
                  form.productKind ===
                  "spare_part"
                }
                onClick={() =>
                  handleProductKindChange(
                    "spare_part"
                  )
                }
                icon={
                  <Settings
                    size={22}
                  />
                }
              />
            </div>
          </FormSection>

          <FormSection
            title="Basic Information"
            subtitle="Edit the main product information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label={
                  form.productKind ===
                  "spare_part"
                    ? "Spare Part Name — English"
                    : "Product Name — English"
                }
                required
                value={
                  form.nameEn
                }
                onChange={(value) =>
                  updateField(
                    "nameEn",
                    value
                  )
                }
              />

              <TextField
                label={
                  form.productKind ===
                  "spare_part"
                    ? "اسم قطعة الغيار — عربي"
                    : "اسم المنتج — عربي"
                }
                value={
                  form.nameAr
                }
                onChange={(value) =>
                  updateField(
                    "nameAr",
                    value
                  )
                }
                direction="rtl"
              />

              <TextField
                label="Category"
                required
                value={
                  form.category
                }
                onChange={(value) =>
                  updateField(
                    "category",
                    value
                  )
                }
              />

              <TextField
                label="Brand"
                value={
                  form.brand
                }
                onChange={(value) =>
                  updateField(
                    "brand",
                    value
                  )
                }
              />

              <TextField
                label="Model"
                value={
                  form.model
                }
                onChange={(value) =>
                  updateField(
                    "model",
                    value
                  )
                }
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <TextAreaField
                label="Description — English"
                value={
                  form.descriptionEn
                }
                onChange={(value) =>
                  updateField(
                    "descriptionEn",
                    value
                  )
                }
              />

              <TextAreaField
                label="الوصف — عربي"
                value={
                  form.descriptionAr
                }
                onChange={(value) =>
                  updateField(
                    "descriptionAr",
                    value
                  )
                }
                direction="rtl"
              />
            </div>
          </FormSection>

          {form.productKind ===
            "spare_part" && (
            <FormSection
              title="Spare Part Information"
              subtitle="Identify the replacement part and compatible medical equipment."
            >
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Settings className="mt-0.5 shrink-0 text-amber-700" />

                  <div>
                    <strong className="text-amber-900">
                      Medical Spare Part
                    </strong>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Keep the part
                      number and
                      compatible device
                      information
                      accurate.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <TextField
                  label="Part Number"
                  required
                  value={
                    form.partNumber
                  }
                  onChange={(value) =>
                    updateField(
                      "partNumber",
                      value
                    )
                  }
                  placeholder="Example: 115-012807-00"
                />

                <TextField
                  label="Manufacturer"
                  value={
                    form.manufacturer
                  }
                  onChange={(value) =>
                    updateField(
                      "manufacturer",
                      value
                    )
                  }
                  placeholder="Mindray, GE, Philips..."
                />

                <TextField
                  label="Compatible Device"
                  required
                  value={
                    form.compatibleDevice
                  }
                  onChange={(value) =>
                    updateField(
                      "compatibleDevice",
                      value
                    )
                  }
                  placeholder="Patient Monitor, CTG, Ultrasound..."
                />

                <TextField
                  label="Compatible Model"
                  value={
                    form.model
                  }
                  onChange={(value) =>
                    updateField(
                      "model",
                      value
                    )
                  }
                  placeholder="PM-9000, F6..."
                />

                <SelectField
                  label="Condition"
                  value={
                    form.partCondition
                  }
                  onChange={(value) =>
                    updateField(
                      "partCondition",
                      value as PartCondition
                    )
                  }
                  options={[
                    {
                      value: "",
                      label:
                        "Select Condition",
                    },
                    {
                      value: "new",
                      label: "New",
                    },
                    {
                      value:
                        "refurbished",
                      label:
                        "Refurbished",
                    },
                    {
                      value: "used",
                      label: "Used",
                    },
                  ]}
                />
              </div>
            </FormSection>
          )}

          <FormSection
            title="Pricing and Inventory"
            subtitle="Update price, availability and stock."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <CheckboxField
                title="Available for Sale"
                description="Allow customers to purchase or inquire about this product."
                checked={
                  form.availableForSale
                }
                onChange={(checked) =>
                  updateField(
                    "availableForSale",
                    checked
                  )
                }
              />

              {form.productKind ===
                "equipment" && (
                <CheckboxField
                  title="Available for Rental"
                  description="Allow customers to request this equipment for rental."
                  checked={
                    form.availableForRental
                  }
                  onChange={(
                    checked
                  ) =>
                    updateField(
                      "availableForRental",
                      checked
                    )
                  }
                />
              )}
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <NumberField
                label="Sale Price"
                value={
                  form.salePrice
                }
                disabled={
                  !form.availableForSale
                }
                onChange={(value) =>
                  updateField(
                    "salePrice",
                    value
                  )
                }
              />

              <SelectField
                label="Currency"
                value={
                  form.currency
                }
                onChange={(value) =>
                  updateField(
                    "currency",
                    value as Currency
                  )
                }
                options={
                  currencyOptions
                }
              />

              <NumberField
                label="Stock"
                required
                min="0"
                step="1"
                value={
                  form.stock
                }
                onChange={(value) =>
                  updateField(
                    "stock",
                    value
                  )
                }
              />

              <NumberField
                label="Minimum Order Quantity"
                required
                min="1"
                step="1"
                value={
                  form.minimumOrderQuantity
                }
                onChange={(value) =>
                  updateField(
                    "minimumOrderQuantity",
                    value
                  )
                }
              />

              {form.productKind ===
                "equipment" && (
                <NumberField
                  label="Monthly Rental Price"
                  disabled={
                    !form.availableForRental
                  }
                  value={
                    form.monthlyRentalPrice
                  }
                  onChange={(value) =>
                    updateField(
                      "monthlyRentalPrice",
                      value
                    )
                  }
                />
              )}
            </div>
          </FormSection>

          <FormSection
            title="Product Catalog"
            subtitle="Upload a PDF catalog or brochure for this product."
          >
            <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    <FileText
                      size={27}
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900">
                      Catalog PDF
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Upload the
                      manufacturer
                      catalog, brochure
                      or technical
                      datasheet.
                      Maximum file size:
                      20 MB.
                    </p>
                  </div>
                </div>

                <label
                  className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3.5 font-bold text-white transition hover:bg-blue-800 ${
                    uploadingCatalog
                      ? "pointer-events-none opacity-60"
                      : ""
                  }`}
                >
                  {uploadingCatalog ? (
                    <>
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload
                        size={19}
                      />
                      {form.catalogUrl
                        ? "Replace PDF"
                        : "Upload PDF"}
                    </>
                  )}

                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={
                      handleCatalogUpload
                    }
                    disabled={
                      uploadingCatalog
                    }
                    className="hidden"
                  />
                </label>
              </div>

              {catalogMessage && (
                <div className="mt-5 flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0"
                  />

                  {catalogMessage}
                </div>
              )}

              {form.catalogUrl && (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900">
                        Catalog
                        available
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {
                          form.catalogUrl
                        }
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={
                          form.catalogUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 font-bold text-blue-700"
                      >
                        <ExternalLink
                          size={17}
                        />
                        View PDF
                      </a>

                      <button
                        type="button"
                        onClick={
                          removeCatalog
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 font-bold text-red-700"
                      >
                        <Trash2
                          size={17}
                        />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5">
              <TextField
                label="Catalog URL — Optional"
                value={
                  form.catalogUrl
                }
                onChange={(value) =>
                  updateField(
                    "catalogUrl",
                    value
                  )
                }
                type="url"
              />
            </div>
          </FormSection>

          <FormSection
            title="Images and Links"
            subtitle="Update public product links."
          >
            <div className="grid gap-5">
              <TextField
                label="Product Image URL"
                value={
                  form.imageUrl
                }
                onChange={(value) =>
                  updateField(
                    "imageUrl",
                    value
                  )
                }
                type="url"
              />

              <TextField
                label="Alibaba URL"
                value={
                  form.alibabaUrl
                }
                onChange={(value) =>
                  updateField(
                    "alibabaUrl",
                    value
                  )
                }
                type="url"
              />
            </div>
          </FormSection>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={
                saving ||
                uploadingCatalog
              }
              onClick={() =>
                router.push(
                  "/vendor/products"
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-7 py-4 font-bold text-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                uploadingCatalog
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-8 py-4 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Saving
                  Changes...
                </>
              ) : (
                <>
                  <Save
                    size={20}
                  />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function ProductTypeCard({
  title,
  description,
  selected,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-5 text-left transition ${
        selected
          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <strong
          className={
            selected
              ? "text-blue-800"
              : "text-slate-900"
          }
        >
          {title}
        </strong>

        {icon}
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      {selected && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-black text-blue-700">
          <CheckCircle2
            size={15}
          />
          Selected
        </span>
      )}
    </button>
  );
}

function FormSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-black">
        {title}
      </h2>

      <p className="mt-2 text-slate-500">
        {subtitle}
      </p>

      <div className="mt-7">
        {children}
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
  direction = "ltr",
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  direction?: "ltr" | "rtl";
  type?: "text" | "url";
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}

        {required && (
          <span className="text-red-600">
            {" "}
            *
          </span>
        )}
      </span>

      <input
        type={type}
        required={required}
        dir={direction}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  min = "0",
  step = "0.01",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}

        {required && (
          <span className="text-red-600">
            {" "}
            *
          </span>
        )}
      </span>

      <input
        type="number"
        required={required}
        disabled={disabled}
        min={min}
        step={step}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  direction = "ltr",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  direction?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <textarea
        rows={5}
        dir={direction}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      >
        {options.map(
          (option) => (
            <option
              key={
                option.value
              }
              value={
                option.value
              }
            >
              {
                option.label
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}

function CheckboxField({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }
        className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-700"
      />

      <span>
        <strong className="block">
          {title}
        </strong>

        <span className="mt-1 block text-sm leading-6 text-slate-500">
          {description}
        </span>
      </span>
    </label>
  );
}

function normalizeProductKind(
  value: string | null
): ProductKind {
  if (
    value === "consumable" ||
    value === "spare_part"
  ) {
    return value;
  }

  return "equipment";
}

function normalizePartCondition(
  value: string | null
): PartCondition {
  if (
    value === "new" ||
    value === "refurbished" ||
    value === "used"
  ) {
    return value;
  }

  return "";
}

function normalizeCurrency(
  value: string | null
): Currency {
  const currencies: Currency[] = [
    "USD",
    "EUR",
    "GBP",
    "SAR",
    "AED",
    "EGP",
    "CNY",
    "TRY",
    "INR",
  ];

  if (
    value &&
    currencies.includes(
      value as Currency
    )
  ) {
    return value as Currency;
  }

  return "USD";
}

function sanitizeFileName(
  fileName: string
) {
  const extension = ".pdf";

  const baseName = fileName
    .replace(/\.pdf$/i, "")
    .normalize("NFKD")
    .replace(
      /[^\w.-]+/g,
      "-"
    )
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  return `${
    baseName || "catalog"
  }${extension}`;
}

function emptyToNull(
  value: string
) {
  const normalizedValue =
    value.trim();

  return normalizedValue || null;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error ===
      "object" &&
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
    typeof error ===
    "string"
  ) {
    return error;
  }

  return fallback;
}