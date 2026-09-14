"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  Send,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Language = "en" | "ar";

type ServiceType =
  | "home_nursing"
  | "physiotherapy"
  | "wound_care"
  | "elderly_care"
  | "home_injection"
  | "lab_sample"
  | "post_operative"
  | "mother_baby"
  | "other";

type FormState = {
  serviceType: ServiceType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  country: string;
  city: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  patientAge: string;
  conditionDetails: string;
  notes: string;
};

const initialForm: FormState = {
  serviceType: "home_nursing",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  country: "",
  city: "",
  address: "",
  preferredDate: "",
  preferredTime: "",
  patientAge: "",
  conditionDetails: "",
  notes: "",
};

const serviceOptions: Array<{
  value: ServiceType;
  en: string;
  ar: string;
}> = [
  {
    value: "home_nursing",
    en: "Home Nursing",
    ar: "تمريض منزلي",
  },
  {
    value: "physiotherapy",
    en: "Home Physiotherapy",
    ar: "علاج طبيعي منزلي",
  },
  {
    value: "wound_care",
    en: "Wound Care",
    ar: "العناية بالجروح",
  },
  {
    value: "elderly_care",
    en: "Elderly Care",
    ar: "رعاية كبار السن",
  },
  {
    value: "home_injection",
    en: "Home Injection",
    ar: "حقن منزلية",
  },
  {
    value: "lab_sample",
    en: "Home Lab Sample",
    ar: "سحب عينات منزلية",
  },
  {
    value: "post_operative",
    en: "Post-Operative Care",
    ar: "رعاية ما بعد العمليات",
  },
  {
    value: "mother_baby",
    en: "Mother & Baby Care",
    ar: "رعاية الأم والطفل",
  },
  {
    value: "other",
    en: "Other Service",
    ar: "خدمة أخرى",
  },
];

export default function HomeCareRequestPage() {
  const [language, setLanguage] =
    useState<Language>("en");

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const isArabic =
    language === "ar";

  const t = {
    en: {
      title: "Request Home Care",
      subtitle:
        "Complete the form and our team will review your request and contact you.",
      back: "Back to Home Care",
      service: "Service Type",
      customerName: "Customer Name",
      phone: "Phone Number",
      email: "Email",
      country: "Country",
      city: "City",
      address: "Home Address",
      preferredDate: "Preferred Visit Date",
      preferredTime: "Preferred Visit Time",
      patientAge: "Patient Age",
      condition: "Patient Condition / Details",
      notes: "Additional Notes",
      submit: "Submit Home Care Request",
      submitting: "Submitting Request...",
      success:
        "Your home care request has been submitted successfully.",
      required:
        "Please complete all required fields.",
    },

    ar: {
      title: "طلب خدمة رعاية منزلية",
      subtitle:
        "أدخل بيانات الطلب وسيقوم فريقنا بمراجعته والتواصل معك.",
      back: "العودة للرعاية المنزلية",
      service: "نوع الخدمة",
      customerName: "اسم العميل",
      phone: "رقم الجوال",
      email: "البريد الإلكتروني",
      country: "الدولة",
      city: "المدينة",
      address: "عنوان المنزل",
      preferredDate: "تاريخ الزيارة المفضل",
      preferredTime: "وقت الزيارة المفضل",
      patientAge: "عمر المريض",
      condition: "تفاصيل حالة المريض",
      notes: "ملاحظات إضافية",
      submit: "إرسال طلب الرعاية المنزلية",
      submitting: "جاري إرسال الطلب...",
      success:
        "تم إرسال طلب الرعاية المنزلية بنجاح.",
      required:
        "يرجى استكمال جميع الحقول المطلوبة.",
    },
  }[language];

  function updateField<
    K extends keyof FormState
  >(
    field: K,
    value: FormState[K]
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
      setErrorMessage("");
      setSuccessMessage("");

      if (
        !form.customerName.trim() ||
        !form.customerPhone.trim() ||
        !form.country.trim() ||
        !form.city.trim() ||
        !form.address.trim() ||
        !form.preferredDate
      ) {
        throw new Error(
          t.required
        );
      }

      const patientAge =
        form.patientAge.trim()
          ? Number(
              form.patientAge
            )
          : null;

      if (
        patientAge !== null &&
        (!Number.isInteger(
          patientAge
        ) ||
          patientAge < 0)
      ) {
        throw new Error(
          isArabic
            ? "عمر المريض غير صحيح."
            : "Patient age is invalid."
        );
      }

      const { error } =
        await supabase
          .from(
            "homecare_requests"
          )
          .insert({
            service_type:
              form.serviceType,

            customer_name:
              form.customerName.trim(),

            customer_phone:
              form.customerPhone.trim(),

            customer_email:
              form.customerEmail.trim() ||
              null,

            country:
              form.country.trim(),

            city:
              form.city.trim(),

            address:
              form.address.trim(),

            preferred_date:
              form.preferredDate,

            preferred_time:
              form.preferredTime ||
              null,

            patient_age:
              patientAge,

            condition_details:
              form.conditionDetails.trim() ||
              null,

            notes:
              form.notes.trim() ||
              null,

            status: "new",
          });

      if (error) {
        throw new Error(
          `${error.message}${
            error.code
              ? ` — Code: ${error.code}`
              : ""
          }`
        );
      }

      setForm(initialForm);

      setSuccessMessage(
        t.success
      );
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : isArabic
            ? "حدث خطأ أثناء إرسال الطلب."
            : "Unable to submit home care request."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/homecare"
            className="inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft
              size={20}
              className={
                isArabic
                  ? "rotate-180"
                  : ""
              }
            />

            {t.back}
          </Link>

          <button
            type="button"
            onClick={() =>
              setLanguage(
                isArabic
                  ? "en"
                  : "ar"
              )
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold"
          >
            {isArabic
              ? "English"
              : "العربية"}
          </button>
        </div>

        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 p-8 text-white shadow-sm md:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500">
            <HeartPulse size={28} />
          </div>

          <h1 className="mt-6 text-4xl font-black md:text-5xl">
            {t.title}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
            {t.subtitle}
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
          onSubmit={handleSubmit}
          className="mt-6 space-y-6"
        >
          <Section
            icon={<Stethoscope />}
            title={t.service}
          >
            <select
              value={
                form.serviceType
              }
              onChange={(event) =>
                updateField(
                  "serviceType",
                  event.target
                    .value as ServiceType
                )
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
            >
              {serviceOptions.map(
                (service) => (
                  <option
                    key={
                      service.value
                    }
                    value={
                      service.value
                    }
                  >
                    {isArabic
                      ? service.ar
                      : service.en}
                  </option>
                )
              )}
            </select>
          </Section>

          <Section
            icon={<UserRound />}
            title={
              isArabic
                ? "بيانات العميل"
                : "Customer Information"
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label={
                  t.customerName
                }
                value={
                  form.customerName
                }
                required
                onChange={(value) =>
                  updateField(
                    "customerName",
                    value
                  )
                }
              />

              <TextField
                label={t.phone}
                value={
                  form.customerPhone
                }
                required
                onChange={(value) =>
                  updateField(
                    "customerPhone",
                    value
                  )
                }
              />

              <TextField
                label={t.email}
                type="email"
                value={
                  form.customerEmail
                }
                onChange={(value) =>
                  updateField(
                    "customerEmail",
                    value
                  )
                }
              />

              <NumberField
                label={
                  t.patientAge
                }
                value={
                  form.patientAge
                }
                onChange={(value) =>
                  updateField(
                    "patientAge",
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section
            icon={<MapPin />}
            title={
              isArabic
                ? "موقع الزيارة"
                : "Visit Location"
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                label={t.country}
                value={
                  form.country
                }
                required
                onChange={(value) =>
                  updateField(
                    "country",
                    value
                  )
                }
              />

              <TextField
                label={t.city}
                value={form.city}
                required
                onChange={(value) =>
                  updateField(
                    "city",
                    value
                  )
                }
              />
            </div>

            <div className="mt-5">
              <TextField
                label={t.address}
                value={form.address}
                required
                onChange={(value) =>
                  updateField(
                    "address",
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section
            icon={<CalendarDays />}
            title={
              isArabic
                ? "موعد الزيارة"
                : "Visit Schedule"
            }
          >
            <div className="grid gap-5 md:grid-cols-2">
              <DateField
                label={
                  t.preferredDate
                }
                value={
                  form.preferredDate
                }
                onChange={(value) =>
                  updateField(
                    "preferredDate",
                    value
                  )
                }
              />

              <TimeField
                label={
                  t.preferredTime
                }
                value={
                  form.preferredTime
                }
                onChange={(value) =>
                  updateField(
                    "preferredTime",
                    value
                  )
                }
              />
            </div>
          </Section>

          <Section
            icon={<HeartPulse />}
            title={
              isArabic
                ? "تفاصيل الحالة"
                : "Patient Details"
            }
          >
            <TextAreaField
              label={t.condition}
              value={
                form.conditionDetails
              }
              onChange={(value) =>
                updateField(
                  "conditionDetails",
                  value
                )
              }
            />

            <div className="mt-5">
              <TextAreaField
                label={t.notes}
                value={form.notes}
                onChange={(value) =>
                  updateField(
                    "notes",
                    value
                  )
                }
              />
            </div>
          </Section>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={21}
                />
                {t.submitting}
              </>
            ) : (
              <>
                <Send size={21} />
                {t.submit}
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
            <Phone size={16} />

            <span>
              +966 56 869 7530
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
          {icon}
        </div>

        <h2 className="text-xl font-black">
          {title}
        </h2>
      </div>

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
  onChange:
    (value: string) => void;
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
}: {
  label: string;
  value: string;
  onChange:
    (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <input
        type="number"
        min="0"
        step="1"
        value={value}
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

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange:
    (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <CalendarDays
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="date"
          value={value}
          required
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </label>
  );
}

function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange:
    (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <div className="relative">
        <Clock3
          size={18}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="time"
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="w-full rounded-2xl border border-slate-200 py-3.5 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
        />
      </div>
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
  onChange:
    (value: string) => void;
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
          onChange(
            event.target.value
          )
        }
        className="w-full resize-y rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}