"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

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

const statusOptions: Array<{
  value: RequestStatus;
  label: string;
}> = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "reviewing",
    label: "Reviewing",
  },
  {
    value: "confirmed",
    label: "Confirmed",
  },
  {
    value: "assigned",
    label: "Assigned",
  },
  {
    value: "completed",
    label: "Completed",
  },
  {
    value: "cancelled",
    label: "Cancelled",
  },
];

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

export default function AdminHomecareRequestsPage() {
  const [requests, setRequests] =
    useState<HomecareRequest[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("all");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const loadRequests =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

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
          window.location.href =
            "/login";
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
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (error) {
          throw new Error(
            `${error.message}${
              error.code
                ? ` — Code: ${error.code}`
                : ""
            }`
          );
        }

        setRequests(
          (data ??
            []) as HomecareRequest[]
        );
      } catch (
        error: unknown
      ) {
        console.error(
          "Home care requests error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load home care requests."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadRequests();
        },
        0
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [loadRequests]);

  const filteredRequests =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return requests.filter(
        (request) => {
          const values = [
            request.customer_name,
            request.customer_phone,
            request.customer_email,
            request.city,
            request.country,
            request.address,
            request.service_type,
            request.assigned_provider,
          ];

          const matchesSearch =
            !term ||
            values.some(
              (value) =>
                value
                  ?.toLowerCase()
                  .includes(
                    term
                  )
            );

          const matchesStatus =
            statusFilter ===
              "all" ||
            request.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      requests,
      search,
      statusFilter,
    ]);

  async function updateStatus(
    id: number,
    status: RequestStatus
  ) {
    try {
      setUpdatingId(id);
      setErrorMessage("");
      setSuccessMessage("");

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
            status,
            updated_at:
              updatedAt,
          })
          .eq(
            "id",
            id
          )
          .select(`
            id,
            status,
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
          "Status was not updated. Please check the admin UPDATE policy."
        );
      }

      setRequests(
        (current) =>
          current.map(
            (request) =>
              request.id ===
              id
                ? {
                    ...request,
                    status,
                    updated_at:
                      updatedAt,
                  }
                : request
          )
      );

      setSuccessMessage(
        `Request #${id} status updated to ${status}.`
      );
    } catch (
      error: unknown
    ) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  const total =
    requests.length;

  const newCount =
    requests.filter(
      (request) =>
        request.status ===
        "new"
    ).length;

  const activeCount =
    requests.filter(
      (request) =>
        [
          "reviewing",
          "confirmed",
          "assigned",
        ].includes(
          request.status
        )
    ).length;

  const completedCount =
    requests.filter(
      (request) =>
        request.status ===
        "completed"
    ).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm md:p-10">
          <p className="font-bold uppercase tracking-widest text-teal-300">
            Health Nations Admin
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">
                Home Care
                Requests
              </h1>

              <p
                className="mt-3 text-slate-300"
                dir="rtl"
              >
                إدارة طلبات
                الرعاية المنزلية
                ومتابعة الحالات
                ومقدمي الخدمة.
              </p>
            </div>

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                void loadRequests()
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Requests"
            value={total}
          />

          <StatCard
            label="New"
            value={newCount}
          />

          <StatCard
            label="In Progress"
            value={activeCount}
          />

          <StatCard
            label="Completed"
            value={
              completedCount
            }
          />
        </section>

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <label className="relative block">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Search customer, phone, city, service..."
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event
                    .target
                    .value
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none"
            >
              <option value="all">
                All Statuses
              </option>

              {statusOptions.map(
                (
                  status
                ) => (
                  <option
                    key={
                      status.value
                    }
                    value={
                      status.value
                    }
                  >
                    {
                      status.label
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={22}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-black">
                Unable to load
                requests
              </p>

              <p className="mt-1 text-sm">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2
              size={22}
              className="mt-0.5 shrink-0"
            />

            <span className="font-bold">
              {
                successMessage
              }
            </span>
          </div>
        )}

        <section className="mt-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 rounded-3xl bg-white shadow-sm">
              <Loader2 className="animate-spin text-blue-700" />

              <span className="font-bold">
                Loading home care
                requests...
              </span>
            </div>
          ) : errorMessage ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
              <AlertCircle
                size={42}
                className="mx-auto text-red-600"
              />

              <h2 className="mt-4 text-2xl font-black">
                Could not load
                requests
              </h2>

              <button
                type="button"
                onClick={() =>
                  void loadRequests()
                }
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white"
              >
                <RefreshCw
                  size={18}
                />
                Try Again
              </button>
            </div>
          ) : filteredRequests.length ===
            0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm">
              <Stethoscope
                size={46}
                className="text-blue-700"
              />

              <h2 className="mt-4 text-2xl font-black">
                No home care
                requests found
              </h2>

              <p className="mt-2 text-slate-500">
                New requests will
                appear here
                automatically.
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredRequests.map(
                (
                  request
                ) => (
                  <article
                    key={
                      request.id
                    }
                    className="rounded-3xl bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                            <Stethoscope
                              size={
                                22
                              }
                            />
                          </div>

                          <div>
                            <h2 className="text-xl font-black">
                              {serviceLabel(
                                request.service_type
                              )}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                              Request #
                              {
                                request.id
                              }
                              {" • "}
                              {new Date(
                                request.created_at
                              ).toLocaleString()}
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              request.status
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <a
                          href={createWhatsAppUrl(
                            request
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700"
                        >
                          <MessageCircle
                            size={
                              18
                            }
                          />

                          WhatsApp
                        </a>

                        <Link
                          href={`/admin/homecare-requests/${request.id}`}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white"
                        >
                          <ExternalLink
                            size={
                              18
                            }
                          />

                          Open Request
                        </Link>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <InfoCard
                        icon={
                          <UserRound />
                        }
                        label="Customer"
                        value={
                          request.customer_name
                        }
                      />

                      <InfoCard
                        icon={
                          <MapPin />
                        }
                        label="Location"
                        value={`${request.city}, ${request.country}`}
                      />

                      <InfoCard
                        icon={
                          <CalendarDays />
                        }
                        label="Visit Date"
                        value={
                          formatDate(
                            request.preferred_date
                          )
                        }
                      />

                      <InfoCard
                        icon={
                          <Clock3 />
                        }
                        label="Visit Time"
                        value={
                          request.preferred_time ||
                          "Not specified"
                        }
                      />
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm font-bold text-slate-500">
                          Contact
                        </p>

                        <p className="mt-2 font-black">
                          {
                            request.customer_phone
                          }
                        </p>

                        {request.customer_email && (
                          <p className="mt-1 text-sm text-slate-600">
                            {
                              request.customer_email
                            }
                          </p>
                        )}

                        <p className="mt-4 text-sm font-bold text-slate-500">
                          Address
                        </p>

                        <p className="mt-2 leading-7">
                          {
                            request.address
                          }
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm font-bold text-slate-500">
                          Patient
                          Details
                        </p>

                        <p className="mt-2">
                          <strong>
                            Age:
                          </strong>{" "}
                          {request.patient_age ??
                            "Not specified"}
                        </p>

                        {request.condition_details && (
                          <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                            {
                              request.condition_details
                            }
                          </p>
                        )}

                        {request.notes && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                            <strong>
                              Notes:
                            </strong>{" "}
                            {
                              request.notes
                            }
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Assigned
                            Provider
                          </p>

                          <p className="mt-1 font-black">
                            {request.assigned_provider ||
                              "Not assigned"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Service
                            Price
                          </p>

                          <p className="mt-1 font-black text-blue-700">
                            {request.service_price !==
                            null
                              ? `${Number(
                                  request.service_price
                                ).toLocaleString()} ${
                                  request.currency ||
                                  "SAR"
                                }`
                              : "Not priced"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500">
                          Status
                        </span>

                        {updatingId ===
                          request.id && (
                          <Loader2
                            size={
                              18
                            }
                            className="animate-spin text-blue-700"
                          />
                        )}

                        <select
                          value={
                            request.status
                          }
                          disabled={
                            updatingId ===
                            request.id
                          }
                          onChange={(
                            event
                          ) =>
                            void updateStatus(
                              request.id,
                              event
                                .target
                                .value as RequestStatus
                            )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold"
                        >
                          {statusOptions.map(
                            (
                              status
                            ) => (
                              <option
                                key={
                                  status.value
                                }
                                value={
                                  status.value
                                }
                              >
                                {
                                  status.label
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
        {value}
      </p>
    </article>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-blue-700">
        {icon}

        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 font-black">
        {value}
      </p>
    </div>
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
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function formatDate(
  value: string
) {
  const parts =
    value.split("-");

  if (
    parts.length === 3
  ) {
    const [
      year,
      month,
      day,
    ] = parts;

    return `${day}/${month}/${year}`;
  }

  return value;
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

Thank you for your Home Care request with Health Nations.

Request Number: #${request.id}

Service:
${serviceLabel(
    request.service_type
  )}

Visit Date:
${request.preferred_date}

Visit Time:
${
  request.preferred_time ||
  "Not specified"
}

Location:
${request.address}
${request.city}, ${request.country}

Our team will contact you to confirm the visit details.

Health Nations Home Care
`.trim();

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}