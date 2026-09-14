"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackagePlus,
  Save,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Currency = "SAR" | "EGP";

type SupplierProfile = {
  user_id: string;
  company_name_en: string;
  company_name_ar: string | null;
  country: string | null;
  status: string | null;
  verified: boolean | null;
};

type ProductForm = {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  brand: string;
  model: string;
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
  nameEn: "",
  nameAr: "",
  descriptionEn: "",
  descriptionAr: "",
  category: "",
  brand: "",
  model: "",
  imageUrl: "",
  catalogUrl: "",
  alibabaUrl: "",
  salePrice: "",
  currency: "SAR",
  minimumOrderQuantity: "1",
  stock: "0",
  availableForSale: true,
  availableForRental: false,
  monthlyRentalPrice: "",
};

export default function AddVendorProductPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<ProductForm>(initialForm);

  const [supplier, setSupplier] =
    useState<SupplierProfile | null>(null);

  const [checkingUser, setCheckingUser] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

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

      const {
        data,
        error,
      } = await supabase
        .from("supplier_profiles")
        .select(
          `
          user_id,
          company_name_en,
          company_name_ar,
          country,
          status,
          verified
        `
        )
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
        currency:
          profile.country?.toUpperCase() === "EG"
            ? "EGP"
            : "SAR",
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
    K extends keyof ProductForm
  >(
    field: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
          form.minimumOrderQuantity || 1
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

          name_en: nameEn,
          name_ar: emptyToNull(
            form.nameAr
          ),

          description_en: emptyToNull(
            form.descriptionEn
          ),

          description_ar: emptyToNull(
            form.descriptionAr
          ),

          category,

          brand: emptyToNull(
            form.brand
          ),

          model: emptyToNull(
            form.model
          ),

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
                Vendor Products
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Add New Product
              </h1>

              <p
                className="mt-3 text-lg text-slate-300"
                dir="rtl"
              >
                أضف بيانات المنتج والسعر
                والمخزون.
              </p>

              {supplier && (
                <p className="mt-3 text-sm text-slate-400">
                  Supplier:{" "}
                  {
                    supplier.company_name_en
                  }
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

          <FormSection
            title="Basic Information"
            subtitle="Enter the main product information."
          >
            <div className="grid gap-5 md:grid-cols-2">

              <TextField
                label="Product Name — English"
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
                label="اسم المنتج — عربي"
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
                placeholder="Surgical, Physiotherapy, Consumables..."
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

          <FormSection
            title="Pricing and Inventory"
            subtitle="Set selling, rental and stock information."
          >

            <div className="grid gap-5 md:grid-cols-2">

              <CheckboxField
                title="Available for Sale"
                description="Allow customers to purchase this product."
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

              <CheckboxField
                title="Available for Rental"
                description="Allow customers to request this product for rental."
                checked={
                  form.availableForRental
                }
                onChange={(checked) =>
                  updateField(
                    "availableForRental",
                    checked
                  )
                }
              />

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
                    value: "SAR",
                    label:
                      "SAR — Saudi Riyal",
                  },
                  {
                    value: "EGP",
                    label:
                      "EGP — Egyptian Pound",
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

            </div>
          </FormSection>

          <FormSection
            title="Images and Links"
            subtitle="Add public links for the product."
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

              <TextField
                label="Catalog URL"
                value={form.catalogUrl}
                onChange={(value) =>
                  updateField(
                    "catalogUrl",
                    value
                  )
                }
                placeholder="https://..."
                type="url"
              />

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
              disabled={saving}
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
              disabled={saving}
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