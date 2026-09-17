"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  FileText,
  Loader2,
  Printer,
  ShieldAlert,
  Stethoscope,
  X,
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

  visual_condition: string | null;
  electrical_condition: string | null;
  mechanical_condition: string | null;
  performance_condition: string | null;

  accessories: string | null;
  work_performed: string | null;
  recommendations: string | null;
  notes: string | null;

  result: PpmResult;

  created_at: string;
};

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
};

type MaintenanceRequest = {
  id: number;
  customer_name: string;
  facility_name: string | null;
  phone: string;
  city: string;
  service_type: string;
  device_name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  problem_description: string | null;
  status: string;
};

export default function PpmReportPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params.id;

  const reportId = Number(
    Array.isArray(rawId)
      ? rawId[0]
      : rawId
  );

  const [accessState, setAccessState] =
    useState<AccessState>("checking");

  const [report, setReport] =
    useState<PpmReport | null>(null);

  const [device, setDevice] =
    useState<MaintenanceDevice | null>(
      null
    );

  const [request, setRequest] =
    useState<MaintenanceRequest | null>(
      null
    );

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

  const loadReport =
    useCallback(async () => {
      if (
        !Number.isInteger(reportId) ||
        reportId <= 0
      ) {
        setErrorMessage(
          "Invalid PPM report ID."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        /*
         * 1. Load PPM report
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
            visual_condition,
            electrical_condition,
            mechanical_condition,
            performance_condition,
            accessories,
            work_performed,
            recommendations,
            notes,
            result,
            created_at
            `
          )
          .eq("id", reportId)
          .single();

        if (reportError) {
          throw reportError;
        }

        const loadedReport =
          reportData as PpmReport;

        setReport(loadedReport);

        /*
         * 2. Load permanent device record
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
            next_ppm_date
            `
          )
          .eq(
            "id",
            loadedReport.device_id
          )
          .single();

        if (deviceError) {
          throw deviceError;
        }

        setDevice(
          deviceData as MaintenanceDevice
        );

        /*
         * 3. Load original maintenance request
         * when available.
         */
        if (
          loadedReport
            .maintenance_request_id
        ) {
          const {
            data: requestData,
            error: requestError,
          } = await supabase
            .from(
              "maintenance_requests"
            )
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
              status
              `
            )
            .eq(
              "id",
              loadedReport
                .maintenance_request_id
            )
            .maybeSingle();

          if (requestError) {
            throw requestError;
          }

          setRequest(
            requestData as
              | MaintenanceRequest
              | null
          );
        }
      } catch (error: unknown) {
        console.error(
          "Load PPM report error:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, [reportId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const allowed =
          await checkAdminAccess();

        if (allowed) {
          await loadReport();
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
    loadReport,
  ]);

  if (
    accessState === "checking" ||
    loading
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <Loader2
            size={36}
            className="mx-auto animate-spin text-blue-700"
          />

          <h1 className="mt-5 text-xl font-black">
            Loading PPM Report...
          </h1>
        </div>
      </main>
    );
  }

  if (accessState === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <ShieldAlert
            size={42}
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

  if (!report || !device) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <FileText
            size={42}
            className="mx-auto text-slate-400"
          />

          <h1 className="mt-5 text-2xl font-black">
            PPM Report Not Found
          </h1>

          <p className="mt-3 text-slate-500">
            {errorMessage ||
              "The requested report could not be loaded."}
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

  const facilityName =
    device.facility_name ||
    request?.facility_name ||
    "—";

  const customerName =
    device.customer_name ||
    request?.customer_name ||
    "—";

  const phone =
    device.phone ||
    request?.phone ||
    "—";

  const city =
    device.city ||
    request?.city ||
    "—";

  return (
    <>
      {/* SCREEN TOOLBAR */}

      <div className="print:hidden">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/maintenance-requests"
              className="inline-flex items-center gap-2 text-sm font-black text-slate-600 transition hover:text-blue-700"
            >
              <ArrowLeft size={18} />
              Maintenance Requests
            </Link>

            <button
              type="button"
              onClick={() =>
                window.print()
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 font-black text-white transition hover:bg-blue-800"
            >
              <Printer size={19} />
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      <main className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
        {/* A4 REPORT */}

        <article
          id="ppm-report"
          className="mx-auto w-full max-w-[210mm] bg-white p-6 shadow-xl print:max-w-none print:p-0 print:shadow-none md:p-10"
        >
          {/* REPORT HEADER */}

          <header className="border-b-4 border-slate-950 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-700">
                  Health Nations Medical
                </p>

                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  Preventive Maintenance
                  Report
                </h1>

                <p className="mt-2 text-sm font-bold text-slate-500">
                  Medical Equipment PPM
                  Service Record
                </p>
              </div>

              <div className="shrink-0 rounded-2xl bg-slate-950 px-5 py-4 text-right text-white">
                <p className="text-xs font-bold uppercase text-slate-400">
                  Report No.
                </p>

                <p className="mt-1 text-lg font-black text-teal-400">
                  {formatReportNumber(
                    report.id
                  )}
                </p>
              </div>
            </div>
          </header>

          {/* BASIC INFORMATION */}

          <section className="mt-6 grid gap-5 md:grid-cols-2 print:grid-cols-2">
            <ReportBox title="Customer Information">
              <ReportRow
                label="Facility"
                value={facilityName}
              />

              <ReportRow
                label="Contact"
                value={customerName}
              />

              <ReportRow
                label="Phone"
                value={phone}
              />

              <ReportRow
                label="City"
                value={city}
              />
            </ReportBox>

            <ReportBox title="Device Information">
              <ReportRow
                label="Device"
                value={device.device_name}
              />

              <ReportRow
                label="Brand"
                value={device.brand}
              />

              <ReportRow
                label="Model"
                value={device.model}
              />

              <ReportRow
                label="Serial No."
                value={device.serial_number}
              />
            </ReportBox>
          </section>

          {/* PPM INFORMATION */}

          <section className="mt-5">
            <ReportBox title="PPM Information">
              <div className="grid grid-cols-2 gap-x-6 md:grid-cols-4 print:grid-cols-4">
                <ReportItem
                  label="PPM Date"
                  value={formatDate(
                    report.ppm_date
                  )}
                />

                <ReportItem
                  label="Next PPM"
                  value={formatDate(
                    report.next_ppm_date
                  )}
                />

                <ReportItem
                  label="Engineer"
                  value={
                    report.engineer_name
                  }
                />

                <ReportItem
                  label="Result"
                  value={
                    report.result.toUpperCase()
                  }
                  strong
                />
              </div>
            </ReportBox>
          </section>

          {/* CHECKLIST */}

          <section className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-slate-300">
              <div className="bg-slate-950 px-5 py-3 text-white">
                <h2 className="font-black">
                  Preventive Maintenance
                  Checklist
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2">
                <ChecklistRow
                  label="Visual Inspection"
                  checked={
                    report.inspection_check
                  }
                />

                <ChecklistRow
                  label="Cleaning"
                  checked={
                    report.cleaning_check
                  }
                />

                <ChecklistRow
                  label="Electrical Safety"
                  checked={
                    report
                      .electrical_safety_check
                  }
                />

                <ChecklistRow
                  label="Mechanical Safety"
                  checked={
                    report
                      .mechanical_safety_check
                  }
                />

                <ChecklistRow
                  label="Performance Test"
                  checked={
                    report.performance_check
                  }
                />

                <ChecklistRow
                  label="Accessories Check"
                  checked={
                    report.accessories_check
                  }
                />
              </div>
            </div>
          </section>

          {/* TECHNICAL ASSESSMENT */}

          <section className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-slate-300">
              <div className="bg-slate-950 px-5 py-3 text-white">
                <h2 className="font-black">
                  Technical Assessment
                </h2>
              </div>

              <div className="grid md:grid-cols-2 print:grid-cols-2">
                <TextReportRow
                  label="Visual Condition"
                  value={
                    report.visual_condition
                  }
                />

                <TextReportRow
                  label="Electrical Condition"
                  value={
                    report
                      .electrical_condition
                  }
                />

                <TextReportRow
                  label="Mechanical Condition"
                  value={
                    report
                      .mechanical_condition
                  }
                />

                <TextReportRow
                  label="Performance Condition"
                  value={
                    report
                      .performance_condition
                  }
                />
              </div>
            </div>
          </section>

          {/* SERVICE DETAILS */}

          <section className="mt-5">
            <div className="overflow-hidden rounded-2xl border border-slate-300">
              <div className="bg-slate-950 px-5 py-3 text-white">
                <h2 className="font-black">
                  Service Details
                </h2>
              </div>

              <TextReportRow
                label="Accessories"
                value={report.accessories}
              />

              <TextReportRow
                label="Work Performed"
                value={
                  report.work_performed
                }
              />

              <TextReportRow
                label="Recommendations"
                value={
                  report.recommendations
                }
              />

              <TextReportRow
                label="Notes"
                value={report.notes}
              />
            </div>
          </section>

          {/* RESULT */}

          <section className="mt-6">
            <ResultBox
              result={report.result}
            />
          </section>

          {/* ORIGINAL REQUEST */}

          {request?.problem_description && (
            <section className="mt-5 rounded-2xl border border-slate-300 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Original Service Request
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                {
                  request.problem_description
                }
              </p>
            </section>
          )}

          {/* SIGNATURES */}

          <section className="mt-10 grid grid-cols-2 gap-10 print:grid-cols-2">
            <SignatureBox
              title="Service Engineer"
              name={
                report.engineer_name
              }
            />

            <SignatureBox
              title="Customer / Facility"
              name={customerName}
            />
          </section>

          {/* FOOTER */}

          <footer className="mt-10 border-t border-slate-300 pt-4 text-center">
            <p className="text-xs font-bold text-slate-500">
              Health Nations Medical
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Riyadh, Saudi Arabia |
              Sadat City, Egypt
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              This document is a
              preventive maintenance
              service record for the
              equipment identified above.
            </p>
          </footer>
        </article>
      </main>

      {/* PRINT CSS */}

      <style jsx global>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #ppm-report {
            width: 100% !important;
            min-height: auto !important;
          }

          a,
          button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}

function ReportBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300">
      <div className="bg-slate-950 px-5 py-3 text-white">
        <h2 className="font-black">
          {title}
        </h2>
      </div>

      <div className="px-5">
        {children}
      </div>
    </div>
  );
}

function ReportRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-3 last:border-b-0">
      <span className="text-xs font-bold text-slate-500">
        {label}
      </span>

      <span className="text-right text-sm font-black text-slate-900">
        {value || "—"}
      </span>
    </div>
  );
}

function ReportItem({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="py-4">
      <p className="text-xs font-bold text-slate-500">
        {label}
      </p>

      <p
        className={`mt-1 text-sm ${
          strong
            ? "font-black"
            : "font-bold"
        } text-slate-900`}
      >
        {value}
      </p>
    </div>
  );
}

function ChecklistRow({
  label,
  checked,
}: {
  label: string;
  checked: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-r border-slate-200 px-5 py-4">
      <span className="text-sm font-bold text-slate-800">
        {label}
      </span>

      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
          checked
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {checked ? (
          <Check size={17} />
        ) : (
          <X size={17} />
        )}
      </span>
    </div>
  );
}

function TextReportRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="border-b border-slate-200 p-5">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

function ResultBox({
  result,
}: {
  result: PpmResult;
}) {
  const config = {
    pass: {
      label:
        "PASS — Equipment Operational",
      className:
        "border-emerald-300 bg-emerald-50 text-emerald-900",
      icon:
        "bg-emerald-600 text-white",
    },

    conditional: {
      label:
        "CONDITIONAL — Follow-up Required",
      className:
        "border-amber-300 bg-amber-50 text-amber-900",
      icon:
        "bg-amber-600 text-white",
    },

    fail: {
      label:
        "FAIL — Equipment Requires Attention",
      className:
        "border-red-300 bg-red-50 text-red-900",
      icon:
        "bg-red-600 text-white",
    },
  }[result];

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border-2 p-5 ${config.className}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${config.icon}`}
      >
        {result === "fail" ? (
          <X size={24} />
        ) : (
          <Check size={24} />
        )}
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-wider">
          Final Equipment Status
        </p>

        <p className="mt-1 text-lg font-black">
          {config.label}
        </p>
      </div>
    </div>
  );
}

function SignatureBox({
  title,
  name,
}: {
  title: string;
  name: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-3 min-h-6 text-sm font-black text-slate-900">
        {name}
      </p>

      <div className="mt-10 border-t border-slate-400 pt-2">
        <p className="text-xs text-slate-500">
          Signature / Date
        </p>
      </div>
    </div>
  );
}

function formatReportNumber(
  id: number
) {
  return `HN-PPM-${String(id).padStart(
    5,
    "0"
  )}`;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const parts =
    value.split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return value;
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

  return "Something went wrong while loading the PPM report.";
}