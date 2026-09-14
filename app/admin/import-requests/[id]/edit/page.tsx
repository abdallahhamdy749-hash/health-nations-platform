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
  Save,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL =
  "abdallahelnomany@gmail.com";

type RequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "ordered"
  | "shipped"
  | "completed"
  | "cancelled";

type CurrencyCode =
  | "SAR"
  | "USD"
  | "EUR"
  | "EGP"
  | "AED"
  | "QAR"
  | "KWD"
  | "BHD"
  | "OMR"
  | "GBP"
  | "CNY";

type ImportRequest = {
  id: number;
  product_name: string;
  quantity: number;
  specifications: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  destination_country: string;
  destination_city: string | null;
  target_price: number | null;
  currency: string;
  quoted_price: number | null;
  status: RequestStatus;
  admin_notes: string | null;
};

type EditForm = {
  productName: string;
  quantity: string;
  specifications: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  destinationCountry: string;
  destinationCity: string;
  targetPrice: string;
  quotedPrice: string;
  currency: CurrencyCode;
  status: RequestStatus;
  adminNotes: string;
};

const currencyOptions: Array<{
  value: CurrencyCode;
  label: string;
}> = [
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "EGP", label: "EGP — Egyptian Pound" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "QAR", label: "QAR — Qatari Riyal" },
  { value: "KWD", label: "KWD — Kuwaiti Dinar" },
  { value: "BHD", label: "BHD — Bahraini Dinar" },
  { value: "OMR", label: "OMR — Omani Rial" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CNY", label: "CNY — Chinese Yuan" },
];

const statusOptions: Array<{
  value: RequestStatus;
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "ordered", label: "Ordered" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const initialForm: EditForm = {
  productName: "",
  quantity: "1",
  specifications: "",
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  destinationCountry: "",
  destinationCity: "",
  targetPrice: "",
  quotedPrice: "",
  currency: "SAR",
  status: "new",
  adminNotes: "",
};

function normalizeCurrency(
  value: string | null | undefined
): CurrencyCode {
  const normalized =
    value?.trim().toUpperCase();

  const currencies = currencyOptions.map(
    (item) => item.value
  );

  if (
    normalized &&
    currencies.includes(
      normalized as CurrencyCode
    )
  ) {
    return normalized as CurrencyCode;
  }

  return "SAR";
}

export default function EditImportRequestPage() {
  const router = useRouter();

  const params = useParams<{
    id: string;
  }>();

  const id = params.id;

  const [form, setForm] =
    useState<EditForm>(initialForm);

  const [request, setRequest] =
    useState<ImportRequest | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadRequest = useCallback(
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

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
          user.email?.toLowerCase() !==
          ADMIN_EMAIL.toLowerCase()
        ) {
          throw new Error(
            "This account does not have admin access."
          );
        }

        const numericId = Number(id);

        if (!Number.isInteger(numericId)) {
          throw new Error(
            "Invalid request ID."
          );
        }

        const { data, error } =
          await supabase
            .from("import_requests")
            .select(`
              id,
              product_name,
              quantity,
              specifications,
              customer_name,
              customer_email,
              customer_phone,
              destination_country,
              destination_city,
              target_price,
              currency,
              quoted_price,
              status,
              admin_notes
            `)
            .eq("id", numericId)
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
            "Request not found."
          );
        }

        const record =
          data as ImportRequest;

        setRequest(record);

        setForm({
          productName:
            record.product_name ?? "",

          quantity: String(
            record.quantity ?? 1
          ),

          specifications:
            record.specifications ?? "",

          customerName:
            record.customer_name ?? "",

          customerEmail:
            record.customer_email ?? "",

          customerPhone:
            record.customer_phone ?? "",

          destinationCountry:
            record.destination_country ?? "",

          destinationCity:
            record.destination_city ?? "",

          targetPrice:
            record.target_price !== null
              ? String(record.target_price)
              : "",

          quotedPrice:
            record.quoted_price !== null
              ? String(record.quoted_price)
              : "",

          currency: normalizeCurrency(
            record.currency
          ),

          status: record.status,

          adminNotes:
            record.admin_notes ?? "",
        });
      } catch (error: unknown) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load request."
        );
      } finally {
        setLoading(false);
      }
    },
    [id, router]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequest();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRequest]);

  function updateField<
    K extends keyof EditForm
  >(
    field: K,
    value: EditForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function parseOptionalNumber(
    value: string
  ): number | null {
    const normalized = value.trim();

    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  }

  async function handleSave(
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
      } =
        await supabase.auth.getUser();

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
        user.email?.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {
        throw new Error(
          "This account does not have admin access."
        );
      }

      if (!request) {
        throw new Error(
          "Request data not found."
        );
      }

      const productName =
        form.productName.trim();

      const customerName =
        form.customerName.trim();

      const customerPhone =
        form.customerPhone.trim();

      const destinationCountry =
        form.destinationCountry.trim();

      const quantity =
        Number(form.quantity);

      if (!productName) {
        throw new Error(
          "Product name is required."
        );
      }

      if (!customerName) {
        throw new Error(
          "Customer name is required."
        );
      }

      if (!customerPhone) {
        throw new Error(
          "Customer phone is required."
        );
      }

      if (!destinationCountry) {
        throw new Error(
          "Destination country is required."
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        throw new Error(
          "Quantity must be at least 1."
        );
      }

      const targetPrice =
        parseOptionalNumber(
          form.targetPrice
        );

      const quotedPrice =
        parseOptionalNumber(
          form.quotedPrice
        );

      if (
        targetPrice !== null &&
        targetPrice < 0
      ) {
        throw new Error(
          "Target price cannot be negative."
        );
      }

      if (
        quotedPrice !== null &&
        quotedPrice < 0
      ) {
        throw new Error(
          "Quoted price cannot be negative."
        );
      }

      const updatedAt =
        new Date().toISOString();

      const { data, error } =
        await supabase
          .from("import_requests")
          .update({
            product_name: productName,
            quantity,

            specifications:
              form.specifications.trim() ||
              null,

            customer_name:
              customerName,

            customer_email:
              form.customerEmail.trim() ||
              null,

            customer_phone:
              customerPhone,

            destination_country:
              destinationCountry,

            destination_city:
              form.destinationCity.trim() ||
              null,

            target_price:
              targetPrice,

            quoted_price:
              quotedPrice,

            currency:
              form.currency,

            status:
              form.status,

            admin_notes:
              form.adminNotes.trim() ||
              null,

            updated_at:
              updatedAt,
          })
          .eq("id", request.id)
          .select("id")
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
          "No row was updated. Please check the admin UPDATE policy."
        );
      }

      setSuccessMessage(
        "Import request updated successfully."
      );

      window.setTimeout(() => {
        router.push(
          "/admin/import-requests"
        );
        router.refresh();
      }, 800);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update request."
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
            Loading request...
          </span>
        </div>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto text-red-600"
            size={44}
          />

          <h1 className="mt-4 text-3xl font-black">
            Request not found
          </h1>

          <p className="mt-3 text-slate-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/import-requests"
              )
            }
            className="mt-6 rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white"
          >
            Back to Requests
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
              "/admin/import-requests"
            )
          }
          className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={20} />
          Back to Import Requests
        </button>

        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm md:p-10">
          <p className="font-bold uppercase tracking-widest text-blue-300">
            Health Nations Admin
          </p>

          <h1 className="mt-2 text-4xl font-black">
            Edit Import Request
          </h1>

          <p className="mt-3 text-slate-300">
            Request #{request.id}
          </p>

          <p
            className="mt-2 text-slate-300"
            dir="rtl"
          >
            تعديل بيانات العميل والمنتج
            والسعر والعملة وحالة الطلب.
          </p>
        </header>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0"
            />

            <span className="font-bold">
              {successMessage}
            </span>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="mt-6 space-y-6"
        >
          <Section title="Product Information">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Product Name"
                value={form.productName}
                required
                onChange={(value) =>
                  updateField(
                    "productName",
                    value
                  )
                }
              />

              <NumberField
                label="Quantity"
                value={form.quantity}
                min="1"
                step="1"
                required
                onChange={(value) =>
                  updateField(
                    "quantity",
                    value
                  )
                }
              />
            </div>

            <div className="mt-5">
              <TextAreaField
                label="Specifications"
                value={
                  form.specifications
                }
                onChange={(value) =>
                  updateField(
                    "specifications",
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section title="Customer Information">
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label="Customer Name"
                value={form.customerName}
                required
                onChange={(value) =>
                  updateField(
                    "customerName",
                    value
                  )
                }
              />

              <TextField
                label="Customer Phone"
                value={form.customerPhone}
                required
                onChange={(value) =>
                  updateField(
                    "customerPhone",
                    value
                  )
                }
              />

              <TextField
                label="Customer Email"
                value={form.customerEmail}
                type="email"
                onChange={(value) =>
                  updateField(
                    "customerEmail",
                    value
                  )
                }
              />

              <TextField
                label="Destination Country"
                value={
                  form.destinationCountry
                }
                required
                onChange={(value) =>
                  updateField(
                    "destinationCountry",
                    value
                  )
                }
              />

              <TextField
                label="Destination City"
                value={form.destinationCity}
                onChange={(value) =>
                  updateField(
                    "destinationCity",
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section title="Pricing & Quotation">
            <div className="grid gap-5 md:grid-cols-2">
              <NumberField
                label="Target Price"
                value={form.targetPrice}
                onChange={(value) =>
                  updateField(
                    "targetPrice",
                    value
                  )
                }
              />

              <NumberField
                label="Customer Quoted Price"
                value={form.quotedPrice}
                onChange={(value) =>
                  updateField(
                    "quotedPrice",
                    value
                  )
                }
              />

              <SelectField
                label="Currency"
                value={form.currency}
                options={currencyOptions}
                onChange={(value) =>
                  updateField(
                    "currency",
                    value as CurrencyCode
                  )
                }
              />

              <SelectField
                label="Status"
                value={form.status}
                options={statusOptions}
                onChange={(value) =>
                  updateField(
                    "status",
                    value as RequestStatus
                  )
                }
              />
            </div>

            <div className="mt-5">
              <TextAreaField
                label="Admin Notes"
                value={form.adminNotes}
                onChange={(value) =>
                  updateField(
                    "adminNotes",
                    value
                  )
                }
              />
            </div>
          </Section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() =>
                router.push(
                  "/admin/import-requests"
                )
              }
              className="rounded-2xl border border-slate-300 bg-white px-7 py-4 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-8 py-4 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes & Return
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <h2 className="text-2xl font-black">
        {title}
      </h2>

      <div className="mt-6">
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
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: "text" | "email";
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
        {required && (
          <span className="text-red-600">
            {" "}*
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
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
  min = "0",
  step = "0.01",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
        {required && (
          <span className="text-red-600">
            {" "}*
          </span>
        )}
      </span>

      <input
        type="number"
        value={value}
        required={required}
        min={min}
        step={step}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <textarea
        rows={5}
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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