"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  History,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

type RequestStatus =
  | "new"
  | "under_review"
  | "technician_assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

type ServiceType =
  | "repair"
  | "ppm"
  | "inspection"
  | "installation";

type MaintenanceRequest = {
  id: number;
  customer_name: string;
  facility_name: string | null;
  phone: string;
  city: string;
  service_type: ServiceType;
  device_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  problem_description: string | null;
  status: RequestStatus;
  assigned_engineer: string | null;
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
};

type MaintenanceDeviceLink = {
  id: number;
  maintenance_request_id: number | null;
  serial_number: string | null;
};

const statusOptions: {
  value: RequestStatus;
  label: string;
}[] = [
  {
    value: "new",
    label: "New",
  },
  {
    value: "under_review",
    label: "Under Review",
  },
  {
    value: "technician_assigned",
    label: "Technician Assigned",
  },
  {
    value: "in_progress",
    label: "In Progress",
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

export default function MaintenanceRequestsPage() {
  const router = useRouter();

  const [accessState, setAccessState] =
    useState<AccessState>("checking");

  const [requests, setRequests] =
    useState<MaintenanceRequest[]>([]);

  const [deviceLinks, setDeviceLinks] =
    useState<MaintenanceDeviceLink[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"all" | RequestStatus>(
      "all"
    );

  const [serviceFilter, setServiceFilter] =
    useState<"all" | ServiceType>(
      "all"
    );

  const [errorMessage, setErrorMessage] =
    useState("");

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const checkAdminAccess =
    useCallback(async () => {
      try {
        setAccessState("checking");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return false;
        }

        const {
          data: adminRecord,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (adminError) {
          throw adminError;
        }

        if (!adminRecord) {
          setAccessState("denied");
          return false;
        }

        setAccessState("allowed");
        return true;
      } catch (error: unknown) {
        console.error(
          "Admin access error:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );

        setAccessState("denied");
        return false;
      }
    }, [router]);

  const loadRequests =
    useCallback(async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        /*
         * Load maintenance requests.
         */
        const {
          data: requestData,
          error: requestError,
        } = await supabase
          .from("maintenance_requests")
          .select(
            `
            id,
            customer_name,
            facility_name,
            phone,
            city,
            service_type,
            device_name,
            brand,
            model,
            serial_number,
            problem_description,
            status,
            assigned_engineer,
            scheduled_date,
            created_at,
            updated_at
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (requestError) {
          throw requestError;
        }

        setRequests(
          (requestData ??
            []) as MaintenanceRequest[]
        );

        /*
         * Load permanent maintenance devices.
         * These links allow each request to open
         * the correct permanent PPM history.
         */
        const {
          data: deviceData,
          error: deviceError,
        } = await supabase
          .from("maintenance_devices")
          .select(
            `
            id,
            maintenance_request_id,
            serial_number
            `
          );

        if (deviceError) {
          throw deviceError;
        }

        setDeviceLinks(
          (deviceData ??
            []) as MaintenanceDeviceLink[]
        );
      } catch (error: unknown) {
        console.error(
          "Maintenance requests error:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const allowed =
          await checkAdminAccess();

        if (allowed) {
          await loadRequests();
        } else {
          setLoading(false);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    checkAdminAccess,
    loadRequests,
  ]);

  const filteredRequests =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return requests.filter(
        (request) => {
          if (
            statusFilter !== "all" &&
            request.status !==
              statusFilter
          ) {
            return false;
          }

          if (
            serviceFilter !== "all" &&
            request.service_type !==
              serviceFilter
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const requestNumber =
            formatRequestNumber(
              request.id
            );

          const searchable = [
            requestNumber,
            request.customer_name,
            request.facility_name,
            request.phone,
            request.city,
            request.device_name,
            request.brand,
            request.model,
            request.serial_number,
            request.assigned_engineer,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            query
          );
        }
      );
    }, [
      requests,
      search,
      serviceFilter,
      statusFilter,
    ]);

  const getDeviceIdForRequest = (
    request: MaintenanceRequest
  ) => {
    /*
     * First try the direct maintenance
     * request relationship.
     */
    const directMatch =
      deviceLinks.find(
        (device) =>
          device.maintenance_request_id ===
          request.id
      );

    if (directMatch) {
      return directMatch.id;
    }

    /*
     * If this is a later service request
     * for an existing device, match it
     * using the serial number.
     */
    const serialNumber =
      request.serial_number?.trim();

    if (serialNumber) {
      const serialMatch =
        deviceLinks.find(
          (device) =>
            device.serial_number?.trim() ===
            serialNumber
        );

      if (serialMatch) {
        return serialMatch.id;
      }
    }

    return null;
  };

  const updateRequestField = async (
    id: number,
    updates: Partial<MaintenanceRequest>
  ) => {
    try {
      setSavingId(id);
      setErrorMessage("");

      const { error } = await supabase
        .from("maintenance_requests")
        .update({
          ...updates,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                ...updates,
              }
            : request
        )
      );
    } catch (error: unknown) {
      console.error(
        "Maintenance update error:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );

      await loadRequests();
    } finally {
      setSavingId(null);
    }
  };

  if (accessState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <RefreshCw
            size={34}
            className="mx-auto animate-spin text-blue-700"
          />

          <h1 className="mt-5 text-xl font-black">
            Checking admin access...
          </h1>
        </div>
      </main>
    );
  }

  if (accessState === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <ShieldAlert
            size={42}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-5 text-2xl font-black">
            Access Denied
          </h1>

          <p className="mt-2 text-slate-500">
            This account does not have
            administrator access.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-bold text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const newCount = requests.filter(
    (request) =>
      request.status === "new"
  ).length;

  const ppmCount = requests.filter(
    (request) =>
      request.service_type === "ppm"
  ).length;

  const inProgressCount =
    requests.filter(
      (request) =>
        request.status ===
          "in_progress" ||
        request.status ===
          "technician_assigned"
    ).length;

  const completedCount =
    requests.filter(
      (request) =>
        request.status ===
        "completed"
    ).length;

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <header className="rounded-3xl bg-slate-950 p-7 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
              >
                <ArrowLeft size={17} />
                Admin Dashboard
              </Link>

              <p className="mt-5 text-sm font-black uppercase tracking-widest text-teal-400">
                Health Nations Medical
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Maintenance Requests
              </h1>

              <p className="mt-2 text-slate-300">
                Manage repair, PPM,
                inspection and installation
                requests.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadRequests()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-5 py-3 font-black text-slate-950 transition hover:bg-teal-400 disabled:opacity-60"
            >
              <RefreshCw
                size={19}
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

        {/* STATS */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Clock3 />}
            label="New Requests"
            value={newCount}
          />

          <StatCard
            icon={<ClipboardCheck />}
            label="PPM Requests"
            value={ppmCount}
          />

          <StatCard
            icon={<Wrench />}
            label="In Progress"
            value={inProgressCount}
          />

          <StatCard
            icon={<CheckCircle2 />}
            label="Completed"
            value={completedCount}
          />
        </section>

        {/* SEARCH + FILTERS */}

        <section className="mt-6 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search request, customer, device, serial number..."
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 outline-none focus:border-blue-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "all"
                    | RequestStatus
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              <option value="all">
                All Statuses
              </option>

              {statusOptions.map(
                (status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                )
              )}
            </select>

            <select
              value={serviceFilter}
              onChange={(event) =>
                setServiceFilter(
                  event.target
                    .value as
                    | "all"
                    | ServiceType
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              <option value="all">
                All Services
              </option>

              <option value="repair">
                Repair
              </option>

              <option value="ppm">
                PPM
              </option>

              <option value="inspection">
                Inspection
              </option>

              <option value="installation">
                Installation
              </option>
            </select>
          </div>
        </section>

        {/* ERROR */}

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {/* REQUESTS */}

        <section className="mt-6">
          {loading ? (
            <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
              <RefreshCw
                size={30}
                className="mx-auto animate-spin text-blue-700"
              />

              <p className="mt-4 font-bold text-slate-500">
                Loading maintenance
                requests...
              </p>
            </div>
          ) : filteredRequests.length ===
            0 ? (
            <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
              <Stethoscope
                size={40}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-xl font-black">
                No maintenance requests
              </h2>

              <p className="mt-2 text-slate-500">
                No requests match the
                current filters.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredRequests.map(
                (request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    deviceId={getDeviceIdForRequest(
                      request
                    )}
                    saving={
                      savingId ===
                      request.id
                    }
                    onUpdate={
                      updateRequestField
                    }
                  />
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RequestCard({
  request,
  deviceId,
  saving,
  onUpdate,
}: {
  request: MaintenanceRequest;
  deviceId: number | null;
  saving: boolean;
  onUpdate: (
    id: number,
    updates: Partial<MaintenanceRequest>
  ) => Promise<void>;
}) {
  const [engineer, setEngineer] =
    useState(
      request.assigned_engineer ?? ""
    );

  const [
    scheduledDate,
    setScheduledDate,
  ] = useState(
    request.scheduled_date ?? ""
  );

  useEffect(() => {
    setEngineer(
      request.assigned_engineer ?? ""
    );

    setScheduledDate(
      request.scheduled_date ?? ""
    );
  }, [
    request.assigned_engineer,
    request.scheduled_date,
  ]);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* REQUEST HEADER */}

      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xl font-black text-slate-950">
              {formatRequestNumber(
                request.id
              )}
            </span>

            <ServiceBadge
              service={
                request.service_type
              }
            />

            <StatusBadge
              status={request.status}
            />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Submitted{" "}
            {formatDateTime(
              request.created_at
            )}
          </p>
        </div>

        <select
          value={request.status}
          disabled={saving}
          onChange={(event) =>
            void onUpdate(request.id, {
              status:
                event.target
                  .value as RequestStatus,
            })
          }
          className="rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-600 disabled:opacity-60"
        >
          {statusOptions.map(
            (status) => (
              <option
                key={status.value}
                value={status.value}
              >
                {status.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* REQUEST INFORMATION */}

      <div className="grid gap-8 p-6 lg:grid-cols-3">
        {/* CUSTOMER */}

        <div>
          <h3 className="flex items-center gap-2 font-black">
            <UserRound
              size={18}
              className="text-blue-700"
            />
            Customer
          </h3>

          <div className="mt-4 space-y-2 text-sm">
            <p className="font-bold">
              {request.customer_name}
            </p>

            <p className="text-slate-600">
              {request.facility_name ||
                "No facility"}
            </p>

            <p className="text-slate-600">
              {request.phone}
            </p>

            <p className="flex items-center gap-1 text-slate-600">
              <MapPin size={15} />
              {request.city}
            </p>
          </div>
        </div>

        {/* DEVICE */}

        <div>
          <h3 className="flex items-center gap-2 font-black">
            <Stethoscope
              size={18}
              className="text-blue-700"
            />
            Device
          </h3>

          <div className="mt-4 space-y-2 text-sm">
            <p className="font-bold">
              {request.device_name}
            </p>

            <p className="text-slate-600">
              {[
                request.brand,
                request.model,
              ]
                .filter(Boolean)
                .join(" • ") ||
                "Brand / model not provided"}
            </p>

            <p className="text-slate-600">
              S/N:{" "}
              {request.serial_number ||
                "—"}
            </p>

            {deviceId && (
              <p className="font-bold text-emerald-700">
                Device Record:{" "}
                {formatDeviceNumber(
                  deviceId
                )}
              </p>
            )}
          </div>
        </div>

        {/* ASSIGNMENT */}

        <div>
          <h3 className="flex items-center gap-2 font-black">
            <CalendarDays
              size={18}
              className="text-blue-700"
            />
            Service Assignment
          </h3>

          <div className="mt-4 space-y-3">
            <input
              value={engineer}
              onChange={(event) =>
                setEngineer(
                  event.target.value
                )
              }
              placeholder="Engineer name"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
            />

            <input
              type="date"
              value={scheduledDate}
              onChange={(event) =>
                setScheduledDate(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-600"
            />

            <button
              type="button"
              disabled={saving}
              onClick={() =>
                void onUpdate(
                  request.id,
                  {
                    assigned_engineer:
                      engineer.trim() ||
                      null,

                    scheduled_date:
                      scheduledDate ||
                      null,

                    status:
                      engineer.trim()
                        ? "technician_assigned"
                        : request.status,
                  }
                )
              }
              className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : "Save Assignment"}
            </button>
          </div>
        </div>
      </div>

      {/* SERVICE DESCRIPTION */}

      {request.problem_description && (
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Service Description
          </p>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {
              request.problem_description
            }
          </p>
        </div>
      )}

      {/* ACTIONS */}

      <div className="flex flex-col gap-4 border-t border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            {saving
              ? "Saving changes..."
              : "Request record ready for service management."}
          </p>

          {request.service_type ===
            "ppm" &&
            !deviceId && (
              <p className="mt-1 text-xs font-bold text-slate-400">
                PPM history will be
                available after the first
                report is saved.
              </p>
            )}
        </div>

        {request.service_type ===
          "ppm" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* PPM HISTORY */}

            {deviceId && (
              <Link
                href={`/admin/maintenance-devices/${deviceId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              >
                <History size={18} />
                PPM History
              </Link>
            )}

            {/* CREATE PPM */}

            <Link
              href={`/admin/maintenance-requests/${request.id}/ppm`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
            >
              <ClipboardCheck
                size={18}
              />

              {deviceId ||
              request.status ===
                "completed"
                ? "Create New PPM"
                : "Create PPM Report"}
            </Link>
          </div>
        )}
      </div>
    </article>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          {icon}
        </div>

        <div>
          <p className="text-2xl font-black">
            {value}
          </p>

          <p className="text-sm font-bold text-slate-500">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

function ServiceBadge({
  service,
}: {
  service: ServiceType;
}) {
  const labels: Record<
    ServiceType,
    string
  > = {
    repair: "Repair",
    ppm: "PPM",
    inspection: "Inspection",
    installation: "Installation",
  };

  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase text-blue-700">
      {labels[service]}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status: RequestStatus;
}) {
  const labels: Record<
    RequestStatus,
    string
  > = {
    new: "New",
    under_review:
      "Under Review",
    technician_assigned:
      "Technician Assigned",
    in_progress:
      "In Progress",
    completed:
      "Completed",
    cancelled:
      "Cancelled",
  };

  const styles: Record<
    RequestStatus,
    string
  > = {
    new:
      "bg-amber-100 text-amber-800",

    under_review:
      "bg-blue-100 text-blue-800",

    technician_assigned:
      "bg-violet-100 text-violet-800",

    in_progress:
      "bg-cyan-100 text-cyan-800",

    completed:
      "bg-emerald-100 text-emerald-800",

    cancelled:
      "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatRequestNumber(
  id: number
) {
  return `HN-MNT-${String(
    id
  ).padStart(5, "0")}`;
}

function formatDeviceNumber(
  id: number
) {
  return `HN-DEV-${String(
    id
  ).padStart(5, "0")}`;
}

function formatDateTime(
  value: string
) {
  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(date);
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (
      typeof message === "string"
    ) {
      return message;
    }
  }

  return "Something went wrong while loading maintenance requests.";
}