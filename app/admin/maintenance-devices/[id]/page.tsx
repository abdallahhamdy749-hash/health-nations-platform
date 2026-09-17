"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Loader2,
  Printer,
  ShieldAlert,
  Stethoscope,
  UserRound,
  Wrench,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type AccessState =
  | "checking"
  | "allowed"
  | "denied";

type PpmResult =
  | "pass"
  | "conditional"
  | "fail";

type MaintenanceDevice = {
  id: number;
  maintenance_request_id: number | null;

  customer_name: string | null;
  facility_name: string | null;
  phone: string | null;
  city: string | null;

  device_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;

  device_status: string;

  last_ppm_date: string | null;
  next_ppm_date: string | null;

  created_at: string;
  updated_at: string;
};

type PpmReport = {
  id: number;
  device_id: number;
  maintenance_request_id: number | null;

  ppm_date: string;
  next_ppm_date: string | null;

  engineer_name: string;

  inspection_check: boolean;
  cleaning_check: boolean;
  electrical_safety_check: boolean;
  mechanical_safety_check: boolean;
  performance_check: boolean;
  accessories_check: boolean;

  result: PpmResult;

  created_at: string;
};

export default function MaintenanceDevicePage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params.id;

  const deviceId = Number(
    Array.isArray(rawId)
      ? rawId[0]
      : rawId
  );

  const [accessState, setAccessState] =
    useState<AccessState>("checking");

  const [device, setDevice] =
    useState<MaintenanceDevice | null>(
      null
    );

  const [reports, setReports] =
    useState<PpmReport[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const checkAdminAccess =
    useCallback(async () => {
      try {
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

  const loadDevice =
    useCallback(async () => {
      if (
        !Number.isInteger(deviceId) ||
        deviceId <= 0
      ) {
        setErrorMessage(
          "Invalid maintenance device ID."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        /*
         * 1. Load permanent device record.
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
            customer_name,
            facility_name,
            phone,
            city,
            device_name,
            brand,
            model,
            serial_number,
            device_status,
            last_ppm_date,
            next_ppm_date,
            created_at,
            updated_at
            `
          )
          .eq("id", deviceId)
          .single();

        if (deviceError) {
          throw deviceError;
        }

        setDevice(
          deviceData as MaintenanceDevice
        );

        /*
         * 2. Load complete PPM history.
         */
        const {
          data: reportData,
          error: reportError,
        } = await supabase
          .from("ppm_reports")
          .select(
            `
            id,
            device_id,
            maintenance_request_id,
            ppm_date,
            next_ppm_date,
            engineer_name,
            inspection_check,
            cleaning_check,
            electrical_safety_check,
            mechanical_safety_check,
            performance_check,
            accessories_check,
            result,
            created_at
            `
          )
          .eq("device_id", deviceId)
          .order("ppm_date", {
            ascending: false,
          })
          .order("id", {
            ascending: false,
          });

        if (reportError) {
          throw reportError;
        }

        setReports(
          (reportData ?? []) as PpmReport[]
        );
      } catch (error: unknown) {
        console.error(
          "Load maintenance device error:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, [deviceId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const allowed =
          await checkAdminAccess();

        if (allowed) {
          await loadDevice();
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
    loadDevice,
  ]);

  const latestReport =
    reports.length > 0
      ? reports[0]
      : null;

  const passReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.result === "pass"
      ).length,
    [reports]
  );

  const conditionalReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.result ===
          "conditional"
      ).length,
    [reports]
  );

  const failedReports = useMemo(
    () =>
      reports.filter(
        (report) =>
          report.result === "fail"
      ).length,
    [reports]
  );

  if (
    accessState === "checking" ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <Loader2
            size={38}
            className="mx-auto animate-spin text-blue-700"
          />

          <h1 className="mt-5 text-xl font-black">
            Loading Device History...
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
            size={44}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-5 text-2xl font-black">
            Access Denied
          </h1>

          <p className="mt-3 text-slate-500">
            This account does not have
            administrator access.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  if (!device) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <Stethoscope
            size={44}
            className="mx-auto text-slate-400"
          />

          <h1 className="mt-5 text-2xl font-black">
            Device Not Found
          </h1>

          <p className="mt-3 text-slate-500">
            {errorMessage ||
              "The requested maintenance device could not be found."}
          </p>

          <Link
            href="/admin/maintenance-requests"
            className="mt-6 inline-flex rounded-xl bg-blue-700 px-6 py-3 font-black text-white"
          >
            Maintenance Requests
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-10">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <header className="overflow-hidden rounded-3xl bg-slate-950 text-white">
          <div className="p-7 md:p-9">
            <Link
              href="/admin/maintenance-requests"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
            >
              <ArrowLeft size={18} />
              Maintenance Requests
            </Link>

            <div className="mt-7 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-400">
                  Health Nations Medical
                </p>

                <h1 className="mt-3 text-3xl font-black md:text-4xl">
                  Device PPM History
                </h1>

                <p className="mt-3 max-w-2xl text-slate-300">
                  Permanent preventive
                  maintenance history for
                  this medical device.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 px-6 py-4">
                <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Device ID
                </p>

                <p className="mt-1 text-xl font-black text-teal-400">
                  {formatDeviceNumber(
                    device.id
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 px-7 py-4 md:px-9">
            <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm">
              <span className="font-black">
                {device.device_name}
              </span>

              {device.brand && (
                <span className="text-slate-300">
                  Brand: {device.brand}
                </span>
              )}

              {device.model && (
                <span className="text-slate-300">
                  Model: {device.model}
                </span>
              )}

              {device.serial_number && (
                <span className="text-slate-300">
                  S/N:{" "}
                  {device.serial_number}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* SUMMARY */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<History />}
            label="Total PPM Reports"
            value={String(
              reports.length
            )}
          />

          <SummaryCard
            icon={<CalendarDays />}
            label="Last PPM"
            value={formatDate(
              device.last_ppm_date
            )}
          />

          <SummaryCard
            icon={<CalendarDays />}
            label="Next PPM"
            value={formatDate(
              device.next_ppm_date
            )}
            attention={isPpmDue(
              device.next_ppm_date
            )}
          />

          <SummaryCard
            icon={<ClipboardCheck />}
            label="Latest Result"
            value={
              latestReport
                ? latestReport.result.toUpperCase()
                : "—"
            }
          />
        </section>

        {/* DEVICE + CUSTOMER */}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <InfoCard
            icon={<Stethoscope />}
            title="Device Information"
          >
            <InfoRow
              label="Device"
              value={device.device_name}
            />

            <InfoRow
              label="Brand"
              value={device.brand}
            />

            <InfoRow
              label="Model"
              value={device.model}
            />

            <InfoRow
              label="Serial Number"
              value={device.serial_number}
            />

            <InfoRow
              label="Status"
              value={formatStatus(
                device.device_status
              )}
            />
          </InfoCard>

          <InfoCard
            icon={<UserRound />}
            title="Customer / Facility"
          >
            <InfoRow
              label="Customer"
              value={
                device.customer_name
              }
            />

            <InfoRow
              label="Facility"
              value={
                device.facility_name
              }
            />

            <InfoRow
              label="Phone"
              value={device.phone}
            />

            <InfoRow
              label="City"
              value={device.city}
            />
          </InfoCard>
        </section>

        {/* RESULT STATS */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <ResultStat
            type="pass"
            value={passReports}
          />

          <ResultStat
            type="conditional"
            value={conditionalReports}
          />

          <ResultStat
            type="fail"
            value={failedReports}
          />
        </section>

        {/* NEXT PPM ALERT */}

        {device.next_ppm_date && (
          <section
            className={`mt-6 rounded-3xl border p-6 ${
              isPpmDue(
                device.next_ppm_date
              )
                ? "border-amber-300 bg-amber-50"
                : "border-blue-200 bg-blue-50"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                  isPpmDue(
                    device.next_ppm_date
                  )
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <CalendarDays size={23} />
              </div>

              <div>
                <p className="font-black">
                  {isPpmDue(
                    device.next_ppm_date
                  )
                    ? "PPM Due / Overdue"
                    : "Next Preventive Maintenance"}
                </p>

                <p className="mt-1 text-sm font-bold text-slate-600">
                  Scheduled for{" "}
                  {formatDate(
                    device.next_ppm_date
                  )}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* PPM HISTORY */}

        <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <History size={22} />
                </div>

                <div>
                  <h2 className="text-xl font-black">
                    PPM History
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Complete preventive
                    maintenance record for
                    this device.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              {reports.length}{" "}
              {reports.length === 1
                ? "Report"
                : "Reports"}
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="p-10 text-center md:p-16">
              <FileText
                size={45}
                className="mx-auto text-slate-300"
              />

              <h3 className="mt-5 text-xl font-black">
                No PPM Reports Yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                This device does not have
                any preventive maintenance
                reports stored yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {reports.map(
                (report, index) => (
                  <PpmHistoryRow
                    key={report.id}
                    report={report}
                    latest={index === 0}
                  />
                )
              )}
            </div>
          )}
        </section>

        {/* FOOTER */}

        <footer className="py-10 text-center text-xs font-bold text-slate-400">
          Health Nations Medical — Medical
          Equipment Maintenance & PPM
        </footer>
      </div>
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  attention = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 shadow-sm ${
        attention
          ? "border-amber-300 bg-amber-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          attention
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-50 text-blue-700"
        }`}
      >
        {icon}
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </div>

        <h2 className="text-lg font-black">
          {title}
        </h2>
      </div>

      <div className="mt-5 divide-y divide-slate-100">
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-3 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-bold text-slate-900">
        {value || "—"}
      </span>
    </div>
  );
}

function ResultStat({
  type,
  value,
}: {
  type: PpmResult;
  value: number;
}) {
  const config = {
    pass: {
      title: "Passed",
      icon: (
        <CheckCircle2 size={22} />
      ),
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    },

    conditional: {
      title: "Conditional",
      icon: (
        <AlertTriangle size={22} />
      ),
      className:
        "border-amber-200 bg-amber-50 text-amber-800",
    },

    fail: {
      title: "Failed",
      icon: <XCircle size={22} />,
      className:
        "border-red-200 bg-red-50 text-red-800",
    },
  }[type];

  return (
    <div
      className={`flex items-center justify-between rounded-3xl border p-6 ${config.className}`}
    >
      <div className="flex items-center gap-3">
        {config.icon}

        <span className="font-black">
          {config.title}
        </span>
      </div>

      <span className="text-2xl font-black">
        {value}
      </span>
    </div>
  );
}

function PpmHistoryRow({
  report,
  latest,
}: {
  report: PpmReport;
  latest: boolean;
}) {
  return (
    <div className="p-6 transition hover:bg-slate-50 md:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-black text-slate-950">
              {formatReportNumber(
                report.id
              )}
            </p>

            {latest && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                Latest
              </span>
            )}

            <ResultBadge
              result={report.result}
            />
          </div>

          <div className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <HistoryItem
              label="PPM Date"
              value={formatDate(
                report.ppm_date
              )}
            />

            <HistoryItem
              label="Next PPM"
              value={formatDate(
                report.next_ppm_date
              )}
            />

            <HistoryItem
              label="Engineer"
              value={
                report.engineer_name
              }
            />

            <HistoryItem
              label="Checklist"
              value={`${countCompletedChecks(
                report
              )}/6`}
            />
          </div>
        </div>

        <Link
          href={`/admin/ppm-reports/${report.id}`}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white transition hover:bg-blue-700"
        >
          <Printer size={18} />
          View / Print
        </Link>
      </div>
    </div>
  );
}

function HistoryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ResultBadge({
  result,
}: {
  result: PpmResult;
}) {
  if (result === "pass") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
        <CheckCircle2 size={13} />
        PASS
      </span>
    );
  }

  if (result === "conditional") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
        <AlertTriangle size={13} />
        CONDITIONAL
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
      <XCircle size={13} />
      FAIL
    </span>
  );
}

function countCompletedChecks(
  report: PpmReport
) {
  return [
    report.inspection_check,
    report.cleaning_check,
    report.electrical_safety_check,
    report.mechanical_safety_check,
    report.performance_check,
    report.accessories_check,
  ].filter(Boolean).length;
}

function formatDeviceNumber(
  id: number
) {
  return `HN-DEV-${String(id).padStart(
    5,
    "0"
  )}`;
}

function formatReportNumber(
  id: number
) {
  return `HN-PPM-${String(id).padStart(
    5,
    "0"
  )}`;
}

function formatStatus(
  value: string
) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const parts = value.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
}

function isPpmDue(
  value: string | null
) {
  if (!value) {
    return false;
  }

  const dueDate = new Date(
    `${value}T23:59:59`
  );

  const today = new Date();

  return dueDate.getTime() <
    today.getTime();
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

  return "Something went wrong while loading the device PPM history.";
}