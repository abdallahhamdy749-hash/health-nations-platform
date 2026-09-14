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
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  MessageCircle,
  Save,
  Stethoscope,
  UserRound,
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
  | "confirmed"
  | "assigned"
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

type HomecareRequest = {
  id: number;
  service_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  country: string;
  city: string;
  address: string;
  preferred_date: string;
  preferred_time: string | null;
  patient_age: number | null;
  condition_details: string | null;
  notes: string | null;
  status: RequestStatus;
  assigned_provider: string | null;
  service_price: number | null;
  currency: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type EditForm = {
  status: RequestStatus;
  assignedProvider: string;
  servicePrice: string;
  currency: CurrencyCode;
  adminNotes: string;
};

const statusOptions: Array<{
  value: RequestStatus;
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "confirmed", label: "Confirmed" },
  { value: "assigned", label: "Assigned" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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

function normalizeCurrency(
  value: string | null | undefined
): CurrencyCode {
  const normalized =
    value?.trim().toUpperCase();

  const supported =
    currencyOptions.map(
      (item) => item.value
    );

  if (
    normalized &&
    supported.includes(
      normalized as CurrencyCode
    )
  ) {
    return normalized as CurrencyCode;
  }

  return "SAR";
}

function serviceLabel(
  serviceType: string
) {
  const labels: Record<
    string,
    string
  > = {
    home_nursing:
      "Home Nursing",
    physiotherapy:
      "Home Physiotherapy",
    wound_care:
      "Wound Care",
    elderly_care:
      "Elderly Care",
    home_injection:
      "Home Injection",
    lab_sample:
      "Home Lab Sample",
    post_operative:
      "Post-Operative Care",
    mother_baby:
      "Mother & Baby Care",
    other:
      "Other Service",
  };

  return (
    labels[serviceType] ||
    serviceType
  );
}

export default function HomecareRequestDetailsPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const id =
    params.id;

  const [request, setRequest] =
    useState<HomecareRequest | null>(
      null
    );

  const [form, setForm] =
    useState<EditForm>({
      status: "new",
      assignedProvider: "",
      servicePrice: "",
      currency: "SAR",
      adminNotes: "",
    });

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

  const loadRequest =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setErrorMessage("");

          const {
            data: {
              session,
            },
            error:
              sessionError,
          } =
            await supabase.auth.getSession();

          if (
            sessionError
          ) {
            throw new Error(
              sessionError.message
            );
          }

          const user =
            session?.user;

          if (!user) {
            router.replace(
              "/login"
            );
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

          const numericId =
            Number(id);

          if (
            !Number.isInteger(
              numericId
            )
          ) {
            throw new Error(
              "Invalid request ID."
            );
          }

          const {
            data,
            error,
          } =
            await supabase
              .from(
                "homecare_requests"
              )
              .select(`
                id,
                service_type,
                customer_name,
                customer_phone,
                customer_email,
                country,
                city,
                address,
                preferred_date,
                preferred_time,
                patient_age,
                condition_details,
                notes,
                status,
                assigned_provider,
                service_price,
                currency,
                admin_notes,
                created_at,
                updated_at
              `)
              .eq(
                "id",
                numericId
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
              "Home care request not found."
            );
          }

          const record =
            data as HomecareRequest;

          setRequest(
            record
          );

          setForm({
            status:
              record.status,

            assignedProvider:
              record.assigned_provider ??
              "",

            servicePrice:
              record.service_price !==
              null
                ? String(
                    record.service_price
                  )
                : "",

            currency:
              normalizeCurrency(
                record.currency
              ),

            adminNotes:
              record.admin_notes ??
              "",
          });
        } catch (
          error: unknown
        ) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load home care request."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        id,
        router,
      ]
    );

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadRequest();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadRequest]);

  function updateField<
    K extends keyof EditForm
  >(
    field: K,
    value: EditForm[K]
  ) {
    setForm(
      (current) => ({
        ...current,
        [field]: value,
      })
    );
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!request) {
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const price =
        form.servicePrice.trim()
          ? Number(
              form.servicePrice
            )
          : null;

      if (
        price !== null &&
        (!Number.isFinite(
          price
        ) ||
          price < 0)
      ) {
        throw new Error(
          "Please enter a valid service price."
        );
      }

      const updatedAt =
        new Date().toISOString();

      const {
        data,
        error,
      } =
        await supabase
          .from(
            "homecare_requests"
          )
          .update({
            status:
              form.status,

            assigned_provider:
              form.assignedProvider.trim() ||
              null,

            service_price:
              price,

            currency:
              form.currency,

            admin_notes:
              form.adminNotes.trim() ||
              null,

            updated_at:
              updatedAt,
          })
          .eq(
            "id",
            request.id
          )
          .select(`
            id,
            status,
            assigned_provider,
            service_price,
            currency,
            admin_notes,
            updated_at
          `)
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

      setRequest(
        (current) =>
          current
            ? {
                ...current,

                status:
                  form.status,

                assigned_provider:
                  form.assignedProvider.trim() ||
                  null,

                service_price:
                  price,

                currency:
                  form.currency,

                admin_notes:
                  form.adminNotes.trim() ||
                  null,

                updated_at:
                  updatedAt,
              }
            : current
      );

      setSuccessMessage(
        "Home care request updated successfully."
      );
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update home care request."
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

  if (
    errorMessage ||
    !request
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto text-red-600"
            size={44}
          />

          <h1 className="mt-4 text-3xl font-black">
            Unable to open request
          </h1>

          <p className="mt-3 text-slate-600">
            {errorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/homecare-requests"
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
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/homecare-requests"
            )
          }
          className="mb-6 inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={20} />
          Back to Home Care Requests
        </button>

        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm md:p-10">
          <p className="font-bold uppercase tracking-widest text-teal-300">
            Health Nations Home Care
          </p>

          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-4xl font-black">
                {serviceLabel(
                  request.service_type
                )}
              </h1>

              <p className="mt-3 text-slate-300">
                Request #{request.id}
              </p>
            </div>

            <StatusBadge
              status={
                request.status
              }
            />
          </div>
        </header>

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2
              size={22}
            />

            <span className="font-bold">
              {successMessage}
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={22}
            />

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <UserRound className="text-blue-700" />

              <h2 className="text-2xl font-black">
                Customer Information
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <InfoRow
                label="Customer"
                value={
                  request.customer_name
                }
              />

              <InfoRow
                label="Phone"
                value={
                  request.customer_phone
                }
              />

              <InfoRow
                label="Email"
                value={
                  request.customer_email ||
                  "Not provided"
                }
              />

              <InfoRow
                label="Patient Age"
                value={
                  request.patient_age !==
                  null
                    ? String(
                        request.patient_age
                      )
                    : "Not specified"
                }
              />
            </div>

            <a
              href={createWhatsAppUrl(
                request
              )}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white"
            >
              <MessageCircle
                size={19}
              />
              Contact on WhatsApp
            </a>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="text-blue-700" />

              <h2 className="text-2xl font-black">
                Visit Information
              </h2>
            </div>

            <div className="mt-6 space-y-4">
              <InfoRow
                label="Country"
                value={
                  request.country
                }
              />

              <InfoRow
                label="City"
                value={
                  request.city
                }
              />

              <InfoRow
                label="Address"
                value={
                  request.address
                }
              />

              <InfoRow
                label="Visit Date"
                value={
                  request.preferred_date
                }
              />

              <InfoRow
                label="Visit Time"
                value={
                  request.preferred_time ||
                  "Not specified"
                }
              />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Stethoscope className="text-blue-700" />

            <h2 className="text-2xl font-black">
              Patient Details
            </h2>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Condition Details
              </p>

              <p className="mt-3 whitespace-pre-wrap leading-7">
                {request.condition_details ||
                  "No condition details provided."}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-500">
                Customer Notes
              </p>

              <p className="mt-3 whitespace-pre-wrap leading-7">
                {request.notes ||
                  "No additional notes."}
              </p>
            </div>
          </div>
        </section>

        <form
          onSubmit={
            handleSave
          }
          className="mt-6 rounded-3xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-2xl font-black">
            Manage Request
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <SelectField
              label="Status"
              value={
                form.status
              }
              options={
                statusOptions
              }
              onChange={(
                value
              ) =>
                updateField(
                  "status",
                  value as RequestStatus
                )
              }
            />

            <TextField
              label="Assigned Provider"
              value={
                form.assignedProvider
              }
              onChange={(
                value
              ) =>
                updateField(
                  "assignedProvider",
                  value
                )
              }
            />

            <NumberField
              label="Service Price"
              value={
                form.servicePrice
              }
              onChange={(
                value
              ) =>
                updateField(
                  "servicePrice",
                  value
                )
              }
            />

            <SelectField
              label="Currency"
              value={
                form.currency
              }
              options={
                currencyOptions
              }
              onChange={(
                value
              ) =>
                updateField(
                  "currency",
                  value as CurrencyCode
                )
              }
            />
          </div>

          <div className="mt-5">
            <TextAreaField
              label="Admin Notes"
              value={
                form.adminNotes
              }
              onChange={(
                value
              ) =>
                updateField(
                  "adminNotes",
                  value
                )
              }
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-7 py-4 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Saving...
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

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-3">
      <p className="text-sm font-bold text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}

function TextField({
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
      <span className="mb-2 block font-bold">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
      <span className="mb-2 block font-bold">
        {label}
      </span>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
  onChange:
    (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold">
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
        className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  onChange:
    (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
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
              {option.label}
            </option>
          )
        )}
      </select>
    </label>
  );
}

function StatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const classes: Record<
    RequestStatus,
    string
  > = {
    new:
      "bg-blue-100 text-blue-800",
    reviewing:
      "bg-amber-100 text-amber-800",
    confirmed:
      "bg-purple-100 text-purple-800",
    assigned:
      "bg-cyan-100 text-cyan-800",
    completed:
      "bg-emerald-100 text-emerald-800",
    cancelled:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-4 py-2 text-sm font-black ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function createWhatsAppUrl(
  request: HomecareRequest
) {
  const phone =
    request.customer_phone.replace(
      /\D/g,
      ""
    );

  const message = `
Hello ${request.customer_name},

Health Nations Home Care

Request Number: #${request.id}
Service: ${serviceLabel(
    request.service_type
  )}

Visit Date: ${request.preferred_date}
Visit Time: ${
    request.preferred_time ||
    "Not specified"
  }

Location:
${request.address}
${request.city}, ${request.country}

Please let us know if you need any assistance.

Health Nations Home Care
`.trim();

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}