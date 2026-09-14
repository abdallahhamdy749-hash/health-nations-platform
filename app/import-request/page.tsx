"use client";

import { FormEvent, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PackageSearch,
  Send,
  Ship,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type RequestType =
  | "china_import"
  | "alibaba_import"
  | "supplier_search";

export default function ImportRequestPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [form, setForm] = useState({
    productName: "",
    alibabaUrl: "",
    productUrl: "",
    productImageUrl: "",
    quantity: "1",
    targetPrice: "",
    currency: "SAR",
    specifications: "",
    destinationCountry: "Saudi Arabia",
    destinationCity: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    requestType: "china_import" as RequestType,
  });

  function updateField(
    field: keyof typeof form,
    value: string
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
      setLoading(true);
      setSuccess(false);
      setErrorMessage("");

      if (!form.productName.trim()) {
        throw new Error("اكتب اسم المنتج المطلوب.");
      }

      if (!form.customerName.trim()) {
        throw new Error("اكتب اسمك.");
      }

      if (!form.customerPhone.trim()) {
        throw new Error("اكتب رقم WhatsApp.");
      }

      const quantity = Number(form.quantity);

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("الكمية يجب أن تكون 1 أو أكثر.");
      }

      const targetPrice = form.targetPrice.trim()
        ? Number(form.targetPrice)
        : null;

      if (
        targetPrice !== null &&
        (!Number.isFinite(targetPrice) || targetPrice < 0)
      ) {
        throw new Error("السعر المستهدف غير صحيح.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("import_requests")
        .insert({
          user_id: user?.id ?? null,

          product_name: form.productName.trim(),

          alibaba_url:
            form.alibabaUrl.trim() || null,

          product_url:
            form.productUrl.trim() || null,

          product_image_url:
            form.productImageUrl.trim() || null,

          quantity,

          target_price: targetPrice,

          currency: form.currency,

          specifications:
            form.specifications.trim() || null,

          destination_country:
            form.destinationCountry,

          destination_city:
            form.destinationCity.trim() || null,

          customer_name:
            form.customerName.trim(),

          customer_email:
            form.customerEmail.trim() || null,

          customer_phone:
            form.customerPhone.trim(),

          request_type: form.requestType,

          status: "new",
        });

      if (error) {
        throw new Error(
          `${error.message}${
            error.code ? ` — Code: ${error.code}` : ""
          }`
        );
      }

      setSuccess(true);

      setForm({
        productName: "",
        alibabaUrl: "",
        productUrl: "",
        productImageUrl: "",
        quantity: "1",
        targetPrice: "",
        currency: "SAR",
        specifications: "",
        destinationCountry: "Saudi Arabia",
        destinationCity: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        requestType: "china_import",
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "حدث خطأ أثناء إرسال الطلب."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="overflow-hidden rounded-[36px] bg-slate-950 text-white shadow-xl">
          <div className="grid gap-8 p-8 md:grid-cols-[1.4fr_0.6fr] md:p-12">
            <div>
              <p className="font-bold uppercase tracking-widest text-blue-300">
                Health Nations Global Sourcing
              </p>

              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
                Import From China
                <span className="block text-blue-400">
                  & Alibaba
                </span>
              </h1>

              <p
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-300"
                dir="rtl"
              >
                ابعت لنا المنتج أو رابط Alibaba،
                ونحن نبحث عن المورد المناسب ونساعدك
                في التفاوض والتوريد والشحن.
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="flex h-40 w-40 items-center justify-center rounded-[40px] bg-blue-600 shadow-2xl">
                <Ship size={74} />
              </div>
            </div>
          </div>
        </section>

        {success && (
          <div className="mt-6 flex gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <CheckCircle2
              size={24}
              className="shrink-0"
            />

            <div>
              <strong className="text-lg">
                Request Sent Successfully
              </strong>

              <p className="mt-1" dir="rtl">
                تم استلام طلبك وسنراجع بيانات المنتج
                والمورد ونعود إليك بعرض السعر.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 flex gap-3 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={24}
              className="shrink-0"
            />

            <div>
              <strong>
                Something went wrong
              </strong>

              <p className="mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
        >
          <Section
            title="What do you need?"
            subtitle="اختر نوع خدمة التوريد المطلوبة"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <RequestTypeCard
                title="Import from China"
                description="نبحث ونورد المنتج من الصين"
                checked={
                  form.requestType ===
                  "china_import"
                }
                onClick={() =>
                  updateField(
                    "requestType",
                    "china_import"
                  )
                }
              />

              <RequestTypeCard
                title="Alibaba Product"
                description="لديك رابط منتج على Alibaba"
                checked={
                  form.requestType ===
                  "alibaba_import"
                }
                onClick={() =>
                  updateField(
                    "requestType",
                    "alibaba_import"
                  )
                }
              />

              <RequestTypeCard
                title="Find Supplier"
                description="ابحثوا لي عن مصنع أو مورد"
                checked={
                  form.requestType ===
                  "supplier_search"
                }
                onClick={() =>
                  updateField(
                    "requestType",
                    "supplier_search"
                  )
                }
              />
            </div>
          </Section>

          <Section
            title="Product Information"
            subtitle="بيانات المنتج المطلوب"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Product Name"
                required
                value={form.productName}
                onChange={(value) =>
                  updateField(
                    "productName",
                    value
                  )
                }
                placeholder="Example: Portable Ultrasound"
              />

              <Field
                label="Alibaba URL"
                type="url"
                value={form.alibabaUrl}
                onChange={(value) =>
                  updateField(
                    "alibabaUrl",
                    value
                  )
                }
                placeholder="https://alibaba.com/..."
              />

              <Field
                label="Other Product URL"
                type="url"
                value={form.productUrl}
                onChange={(value) =>
                  updateField(
                    "productUrl",
                    value
                  )
                }
                placeholder="Product or manufacturer link"
              />

              <Field
                label="Product Image URL"
                type="url"
                value={form.productImageUrl}
                onChange={(value) =>
                  updateField(
                    "productImageUrl",
                    value
                  )
                }
                placeholder="https://..."
              />

              <Field
                label="Quantity"
                type="number"
                required
                value={form.quantity}
                onChange={(value) =>
                  updateField("quantity", value)
                }
              />

              <div className="grid grid-cols-[1fr_130px] gap-3">
                <Field
                  label="Target Price"
                  type="number"
                  value={form.targetPrice}
                  onChange={(value) =>
                    updateField(
                      "targetPrice",
                      value
                    )
                  }
                />

                <label className="block">
                  <span className="mb-2 block font-bold text-slate-700">
                    Currency
                  </span>

                  <select
                    value={form.currency}
                    onChange={(event) =>
                      updateField(
                        "currency",
                        event.target.value
                      )
                    }
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-600"
                  >
                    <option value="SAR">
                      SAR
                    </option>
                    <option value="USD">
                      USD
                    </option>
                    <option value="EGP">
                      EGP
                    </option>
                  </select>
                </label>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="mb-2 block font-bold text-slate-700">
                Specifications
              </span>

              <textarea
                rows={6}
                value={form.specifications}
                onChange={(event) =>
                  updateField(
                    "specifications",
                    event.target.value
                  )
                }
                placeholder="Model, size, material, technical specifications, certificates..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </Section>

          <Section
            title="Delivery Destination"
            subtitle="مكان وصول الشحنة"
          >
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-bold text-slate-700">
                  Country
                </span>

                <select
                  value={
                    form.destinationCountry
                  }
                  onChange={(event) =>
                    updateField(
                      "destinationCountry",
                      event.target.value
                    )
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-600"
                >
                  <option value="Saudi Arabia">
                    Saudi Arabia
                  </option>

                  <option value="Egypt">
                    Egypt
                  </option>

                  <option value="United Arab Emirates">
                    UAE
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </label>

              <Field
                label="City"
                value={form.destinationCity}
                onChange={(value) =>
                  updateField(
                    "destinationCity",
                    value
                  )
                }
                placeholder="Riyadh / Cairo..."
              />
            </div>
          </Section>

          <Section
            title="Contact Information"
            subtitle="بيانات التواصل"
          >
            <div className="grid gap-5 md:grid-cols-3">
              <Field
                label="Your Name"
                required
                value={form.customerName}
                onChange={(value) =>
                  updateField(
                    "customerName",
                    value
                  )
                }
              />

              <Field
                label="Email"
                type="email"
                value={form.customerEmail}
                onChange={(value) =>
                  updateField(
                    "customerEmail",
                    value
                  )
                }
              />

              <Field
                label="WhatsApp / Phone"
                required
                value={form.customerPhone}
                onChange={(value) =>
                  updateField(
                    "customerPhone",
                    value
                  )
                }
                placeholder="+966..."
              />
            </div>
          </Section>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-700 px-8 py-4 text-lg font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    className="animate-spin"
                    size={22}
                  />
                  Sending Request...
                </>
              ) : (
                <>
                  <Send size={22} />
                  Request Import Quote
                  <span dir="rtl">
                    | اطلب عرض سعر
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <div className="flex gap-4">
            <PackageSearch
              className="shrink-0 text-blue-700"
              size={28}
            />

            <div>
              <h3 className="font-black text-blue-950">
                Don&apos;t have an Alibaba link?
              </h3>

              <p
                className="mt-2 leading-7 text-blue-900/70"
                dir="rtl"
              >
                لا مشكلة. اكتب اسم المنتج والمواصفات
                ونحن نبحث عن مصنع أو مورد مناسب لك.
              </p>

              <a
                href="https://www.alibaba.com"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 font-bold text-blue-700"
              >
                Visit Alibaba
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
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

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
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
        required={required}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function RequestTypeCard({
  title,
  description,
  checked,
  onClick,
}: {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-5 text-left transition ${
        checked
          ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100"
          : "border-slate-200 bg-white hover:border-blue-300"
      }`}
    >
      <div
        className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${
          checked
            ? "bg-blue-700 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        <PackageSearch size={22} />
      </div>

      <strong className="block text-lg">
        {title}
      </strong>

      <span className="mt-2 block text-sm leading-6 text-slate-500">
        {description}
      </span>
    </button>
  );
}