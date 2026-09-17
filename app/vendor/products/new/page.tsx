"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  PackagePlus,
  Save,
  Settings,
  Upload,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";
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

type SupplierProfile = {
  user_id: string;
  company_name_en: string;
  company_name_ar: string | null;
  country: string | null;
  status: string | null;
  verified: boolean | null;
};

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

const STORAGE_BUCKET = "vendor-assets";
const CATALOG_FOLDER = "catalogs";
const MAX_CATALOG_SIZE = 20 * 1024 * 1024;

function getDefaultCurrency(
  country: string | null
): Currency {
  const normalized =
    country?.trim().toLowerCase() || "";

  if (
    normalized === "sa" ||
    normalized.includes("saudi")
  ) {
    return "SAR";
  }

  if (
    normalized === "eg" ||
    normalized.includes("egypt")
  ) {
    return "EGP";
  }

  if (
    normalized === "ae" ||
    normalized.includes("emirates") ||
    normalized.includes("uae")
  ) {
    return "AED";
  }

  if (
    normalized === "cn" ||
    normalized.includes("china")
  ) {
    return "CNY";
  }

  if (
    normalized === "tr" ||
    normalized.includes("turkey") ||
    normalized.includes("türkiye")
  ) {
    return "TRY";
  }

  if (
    normalized === "in" ||
    normalized.includes("india")
  ) {
    return "INR";
  }

  if (
    normalized === "uk" ||
    normalized.includes("united kingdom") ||
    normalized.includes("britain")
  ) {
    return "GBP";
  }

  return "USD";
}

export default function AddVendorProductPage() {
  const router = useRouter();

  const catalogInputRef =
    useRef<HTMLInputElement | null>(null);

  const [form, setForm] =
    useState<ProductForm>(initialForm);

  const [supplier, setSupplier] =
    useState<SupplierProfile | null>(null);

  const [checkingUser, setCheckingUser] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploadingCatalog, setUploadingCatalog] =
    useState(false);

  const [catalogFileName, setCatalogFileName] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const checkUser = useCallback(async () => {
    try {
      setCheckingUser(true);
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

      const { data, error } = await supabase
        .from("supplier_profiles")
        .select(`
          user_id,
          company_name_en,
          company_name_ar,
          country,
          status,
          verified
        `)
        .eq("user_id", user.id)
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
          "لم يتم العثور على حساب المورد المرتبط بالمستخدم الحالي."
        );
      }

      const profile =
        data as SupplierProfile;

      setSupplier(profile);

      setForm((current) => ({
        ...current,
        currency: getDefaultCurrency(
          profile.country
        ),
      }));
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "تعذر التحقق من حساب المورد."
        )
      );
    } finally {
      setCheckingUser(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void checkUser();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [checkUser]);

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
        value === "spare_part" ||
        value === "consumable"
          ? false
          : current.availableForRental,

      monthlyRentalPrice:
        value === "spare_part" ||
        value === "consumable"
          ? ""
          : current.monthlyRentalPrice,

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

  async function uploadCatalog(file: File) {
    try {
      setUploadingCatalog(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
      ) {
        throw new Error(
          "الكتالوج يجب أن يكون ملف PDF."
        );
      }

      if (file.size > MAX_CATALOG_SIZE) {
        throw new Error(
          "حجم ملف الكتالوج يجب ألا يتجاوز 20 MB."
        );
      }

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

      const safeFileName =
        sanitizeFileName(file.name);

      const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeFileName}`;

      const filePath = `${CATALOG_FOLDER}/${user.id}/${uniqueName}`;

      const { error: uploadError } =
        await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: "3600",
            contentType:
              "application/pdf",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(
          `Catalog upload failed: ${uploadError.message}`
        );
      }

      const { data: publicUrlData } =
        supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

      const publicUrl =
        publicUrlData.publicUrl;

      if (!publicUrl) {
        throw new Error(
          "تم رفع الملف ولكن تعذر إنشاء الرابط العام."
        );
      }

      updateField(
        "catalogUrl",
        publicUrl
      );

      setCatalogFileName(file.name);

      setSuccessMessage(
        "تم رفع الكتالوج بنجاح. احفظ المنتج لإرساله إلى الإدارة."
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "تعذر رفع ملف الكتالوج."
        )
      );
    } finally {
      setUploadingCatalog(false);

      if (catalogInputRef.current) {
        catalogInputRef.current.value =
          "";
      }
    }
  }

  function removeCatalog() {
    updateField("catalogUrl", "");
    setCatalogFileName("");

    if (catalogInputRef.current) {
      catalogInputRef.current.value = "";
    }
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
        throw new Error(userError.message);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      if (
        !supplier ||
        supplier.user_id !== user.id
      ) {
        throw new Error(
          "تعذر التحقق من حساب المورد."
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
          "أدخل اسم الجهاز المتوافق مع قطعة الغيار."
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
          ? Number(form.salePrice)
          : null;

      const monthlyRentalPrice =
        form.availableForRental &&
        form.monthlyRentalPrice.trim()
          ? Number(
              form.monthlyRentalPrice
            )
          : null;

      const stock =
        Number(form.stock || 0);

      const minimumOrderQuantity =
        Number(
          form.minimumOrderQuantity ||
            1
        );

      if (
        salePrice !== null &&
        (!Number.isFinite(salePrice) ||
          salePrice < 0)
      ) {
        throw new Error(
          "سعر البيع غير صحيح."
        );
      }

      if (
        monthlyRentalPrice !== null &&
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
        !Number.isInteger(stock) ||
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

      const { error } = await supabase
        .from("supplier_products")
        .insert({
          supplier_id: user.id,

          product_kind:
            form.productKind,

          name_en: nameEn,

          name_ar: emptyToNull(
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

          brand: emptyToNull(
            form.brand
          ),

          model: emptyToNull(
            form.model
          ),

          part_number:
            form.productKind ===
            "spare_part"
              ? emptyToNull(
                  form.partNumber
                )
              : null,

          manufacturer:
            form.productKind ===
            "spare_part"
              ? emptyToNull(
                  form.manufacturer
                )
              : null,

          compatible_device:
            form.productKind ===
            "spare_part"
              ? emptyToNull(
                  form.compatibleDevice
                )
              : null,

          part_condition:
            form.productKind ===
            "spare_part"
              ? emptyToNull(
                  form.partCondition
                )
              : null,

          image_url: emptyToNull(
            form.imageUrl
          ),

          catalog_url: emptyToNull(
            form.catalogUrl
          ),

          alibaba_url: emptyToNull(
            form.alibabaUrl
          ),

          sale_price: salePrice,

          currency: form.currency,

          minimum_order_quantity:
            minimumOrderQuantity,

          stock,

          available_for_sale:
            form.availableForSale,

          available_for_rental:
            form.availableForRental,

          monthly_rental_price:
            monthlyRentalPrice,

          status: "pending",

          featured: false,

          updated_at:
            new Date().toISOString(),
        });

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

        throw new Error(fullMessage);
      }

      setSuccessMessage(
        "تم حفظ المنتج وإرساله إلى الإدارة للمراجعة بنجاح."
      );

      setCatalogFileName("");

      setForm((current) => ({
        ...initialForm,
        currency: current.currency,
      }));

      window.setTimeout(() => {
        router.push(
          "/vendor/products"
        );

        router.refresh();
      }, 1200);
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "تعذر حفظ المنتج."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (checkingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="animate-spin text-blue-700" />

          <span className="font-bold text-slate-700">
            Checking vendor account...
          </span>
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
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-blue-700">
              <PackagePlus size={36} />
            </div>

            <div>
              <p className="font-bold uppercase tracking-wider text-blue-300">
                Global Vendor Products
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Add New Product
              </h1>

              <p
                className="mt-3 text-lg text-slate-300"
                dir="rtl"
              >
                أضف جهازًا طبيًا أو
                مستلزمًا أو قطعة غيار
                إلى السوق العالمي.
              </p>

              {supplier && (
                <p className="mt-3 text-sm text-slate-400">
                  Supplier:{" "}
                  {
                    supplier.company_name_en
                  }
                  {supplier.country
                    ? ` • ${supplier.country}`
                    : ""}
                </p>
              )}
            </div>
          </div>
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
          {/* PRODUCT TYPE */}

          <FormSection
            title="Product Type"
            subtitle="Choose what you are adding to the global marketplace."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <ProductTypeCard
                title="Medical Equipment"
                description="Devices, machines and medical equipment."
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
                description="Disposable and medical supply products."
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
                  <Settings size={22} />
                }
              />
            </div>
          </FormSection>

          {/* BASIC */}

          <FormSection
            title="Basic Information"
            subtitle="Enter the main product information."
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
                value={form.nameEn}
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
                value={form.nameAr}
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
                value={form.category}
                onChange={(value) =>
                  updateField(
                    "category",
                    value
                  )
                }
                placeholder="Physiotherapy, CTG, Patient Monitor..."
              />

              <TextField
                label="Brand"
                value={form.brand}
                onChange={(value) =>
                  updateField(
                    "brand",
                    value
                  )
                }
                placeholder="EDAN, Mindray, GE, Philips..."
              />

              <TextField
                label="Model"
                value={form.model}
                onChange={(value) =>
                  updateField(
                    "model",
                    value
                  )
                }
                placeholder="F6, PM-9000..."
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

          {/* SPARE PART DETAILS */}

          {form.productKind ===
            "spare_part" && (
            <FormSection
              title="Spare Part Information"
              subtitle="Enter the information buyers need to identify the correct medical equipment part."
            >
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-3">
                  <Settings className="mt-0.5 shrink-0 text-amber-700" />

                  <div>
                    <strong className="text-amber-900">
                      Medical Spare Part
                    </strong>

                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Accurate part numbers
                      and compatible device
                      information improve
                      global search results.
                    </p>

                    <p
                      className="mt-1 text-sm text-amber-800"
                      dir="rtl"
                    >
                      اكتب رقم القطعة
                      والجهاز المتوافق بدقة
                      حتى يستطيع العميل
                      العثور على القطعة
                      الصحيحة.
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
                  placeholder="Mindray, GE, Philips, Siemens..."
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
                  value={form.model}
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

          {/* PRICING */}

          <FormSection
            title="Pricing and Inventory"
            subtitle="Set selling, rental and stock information."
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
                value={form.salePrice}
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
                value={form.currency}
                onChange={(value) =>
                  updateField(
                    "currency",
                    value as Currency
                  )
                }
                options={[
                  {
                    value: "USD",
                    label:
                      "USD — US Dollar",
                  },
                  {
                    value: "EUR",
                    label: "EUR — Euro",
                  },
                  {
                    value: "GBP",
                    label:
                      "GBP — British Pound",
                  },
                  {
                    value: "SAR",
                    label:
                      "SAR — Saudi Riyal",
                  },
                  {
                    value: "AED",
                    label:
                      "AED — UAE Dirham",
                  },
                  {
                    value: "EGP",
                    label:
                      "EGP — Egyptian Pound",
                  },
                  {
                    value: "CNY",
                    label:
                      "CNY — Chinese Yuan",
                  },
                  {
                    value: "TRY",
                    label:
                      "TRY — Turkish Lira",
                  },
                  {
                    value: "INR",
                    label:
                      "INR — Indian Rupee",
                  },
                ]}
              />

              <NumberField
                label="Stock"
                required
                min="0"
                step="1"
                value={form.stock}
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

          {/* MEDIA */}

          <FormSection
            title="Images and Catalog"
            subtitle="Add the product image, PDF catalog and supplier reference."
          >
            <div className="grid gap-5">
              <TextField
                label="Product Image URL"
                value={form.imageUrl}
                onChange={(value) =>
                  updateField(
                    "imageUrl",
                    value
                  )
                }
                placeholder="https://..."
                type="url"
              />

              <div>
                <span className="mb-2 block font-bold text-slate-700">
                  Catalog PDF
                </span>

                <input
                  ref={catalogInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0];

                    if (file) {
                      void uploadCatalog(
                        file
                      );
                    }
                  }}
                />

                {!form.catalogUrl ? (
                  <button
                    type="button"
                    disabled={
                      uploadingCatalog ||
                      saving
                    }
                    onClick={() =>
                      catalogInputRef.current?.click()
                    }
                    className="flex w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {uploadingCatalog ? (
                      <>
                        <Loader2
                          size={34}
                          className="animate-spin text-blue-700"
                        />

                        <strong className="mt-4 text-blue-900">
                          Uploading
                          Catalog...
                        </strong>
                      </>
                    ) : (
                      <>
                        <Upload
                          size={34}
                          className="text-blue-700"
                        />

                        <strong className="mt-4 text-blue-900">
                          Upload Catalog
                          PDF
                        </strong>

                        <span className="mt-2 text-sm text-slate-500">
                          PDF only —
                          maximum 20 MB
                        </span>

                        <span
                          className="mt-1 text-sm text-slate-500"
                          dir="rtl"
                        >
                          اضغط هنا لاختيار
                          كتالوج المنتج
                        </span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <FileText
                            size={24}
                          />
                        </div>

                        <div className="min-w-0">
                          <strong className="block text-emerald-800">
                            Catalog Ready
                          </strong>

                          <span className="mt-1 block truncate text-sm text-emerald-700">
                            {catalogFileName ||
                              "PDF catalog attached"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <a
                          href={
                            form.catalogUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-sm"
                        >
                          View
                        </a>

                        <button
                          type="button"
                          onClick={
                            removeCatalog
                          }
                          className="inline-flex items-center gap-1 rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600"
                        >
                          <X size={16} />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <TextField
                    label="Or enter Catalog URL manually"
                    value={
                      form.catalogUrl
                    }
                    onChange={(value) => {
                      updateField(
                        "catalogUrl",
                        value
                      );

                      if (!value) {
                        setCatalogFileName(
                          ""
                        );
                      }
                    }}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </div>

              <TextField
                label="Alibaba URL"
                value={form.alibabaUrl}
                onChange={(value) =>
                  updateField(
                    "alibabaUrl",
                    value
                  )
                }
                placeholder="https://..."
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
              className="rounded-2xl border border-slate-300 bg-white px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                uploadingCatalog
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-8 py-4 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Saving Product...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Product
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
          <CheckCircle2 size={15} />
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
  placeholder = "",
  direction = "ltr",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  direction?: "ltr" | "rtl";
  type?: "text" | "url";
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
          onChange(event.target.value)
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
          onChange(event.target.value)
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
          onChange(event.target.value)
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
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
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
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-blue-50/40">
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

function sanitizeFileName(
  fileName: string
) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(
      /[^a-zA-Z0-9._-]/g,
      ""
    )
    .toLowerCase();
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