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
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Save,
  ShieldAlert,
  Stethoscope,
  Wrench,
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
  assigned_engineer: string | null;
  scheduled_date: string | null;
  created_at: string;
};

type PpmForm = {
  ppmDate: string;
  nextPpmDate: string;
  engineerName: string;

  inspectionCheck: boolean;
  cleaningCheck: boolean;
  electricalSafetyCheck: boolean;
  mechanicalSafetyCheck: boolean;
  performanceCheck: boolean;
  accessoriesCheck: boolean;

  visualCondition: string;
  electricalCondition: string;
  mechanicalCondition: string;
  performanceCondition: string;

  accessories: string;
  workPerformed: string;
  recommendations: string;
  notes: string;

  result: PpmResult;
};

function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialForm: PpmForm = {
  ppmDate: getToday(),
  nextPpmDate: "",
  engineerName: "",

  inspectionCheck: false,
  cleaningCheck: false,
  electricalSafetyCheck: false,
  mechanicalSafetyCheck: false,
  performanceCheck: false,
  accessoriesCheck: false,

  visualCondition: "",
  electricalCondition: "",
  mechanicalCondition: "",
  performanceCondition: "",

  accessories: "",
  workPerformed: "",
  recommendations: "",
  notes: "",

  result: "pass",
};

export default function PpmPage() {
  const params = useParams();
  const router = useRouter();

  const rawId = params.id;

  const requestId = Number(
    Array.isArray(rawId)
      ? rawId[0]
      : rawId
  );

  const [accessState, setAccessState] =
    useState<AccessState>("checking");

  const [request, setRequest] =
    useState<MaintenanceRequest | null>(
      null
    );

  const [form, setForm] =
    useState<PpmForm>(initialForm);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [savedReportId, setSavedReportId] =
    useState<number | null>(null);

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

  const loadRequest =
    useCallback(async () => {
      if (
        !Number.isInteger(requestId) ||
        requestId <= 0
      ) {
        setErrorMessage(
          "Invalid maintenance request ID."
        );

        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data,
          error,
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
            created_at
            `
          )
          .eq("id", requestId)
          .single();

        if (error) {
          throw error;
        }

        const loadedRequest =
          data as MaintenanceRequest;

        setRequest(loadedRequest);

        setForm((current) => ({
          ...current,
          engineerName:
            loadedRequest
              .assigned_engineer ?? "",
        }));
      } catch (error: unknown) {
        console.error(
          "Load request error:",
          error
        );

        setErrorMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, [requestId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (async () => {
        const allowed =
          await checkAdminAccess();

        if (allowed) {
          await loadRequest();
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
    loadRequest,
  ]);

  const handleTextChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCheckChange = (
    name:
      | "inspectionCheck"
      | "cleaningCheck"
      | "electricalSafetyCheck"
      | "mechanicalSafetyCheck"
      | "performanceCheck"
      | "accessoriesCheck"
  ) => {
    setForm((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  const findOrCreateDevice =
    async () => {
      if (!request) {
        throw new Error(
          "Maintenance request is not loaded."
        );
      }

      /*
       * Search for an existing device
       * using the serial number.
       */
      if (request.serial_number?.trim()) {
        const {
          data: existingDevice,
          error: findError,
        } = await supabase
          .from("maintenance_devices")
          .select("id")
          .eq(
            "serial_number",
            request.serial_number.trim()
          )
          .maybeSingle();

        if (findError) {
          throw findError;
        }

        if (existingDevice?.id) {
          return Number(
            existingDevice.id
          );
        }
      }

      /*
       * No device exists yet.
       * Create the permanent equipment record.
       */
      const {
        data: newDevice,
        error: createError,
      } = await supabase
        .from("maintenance_devices")
        .insert({
          maintenance_request_id:
            request.id,

          facility_name:
            request.facility_name,

          customer_name:
            request.customer_name,

          phone:
            request.phone,

          city:
            request.city,

          device_name:
            request.device_name,

          brand:
            request.brand,

          model:
            request.model,

          serial_number:
            request.serial_number?.trim() ||
            null,

          device_status:
            "active",

          last_ppm_date:
            form.ppmDate,

          next_ppm_date:
            form.nextPpmDate || null,
        })
        .select("id")
        .single();

      if (createError) {
        throw createError;
      }

      if (!newDevice?.id) {
        throw new Error(
          "Unable to create device record."
        );
      }

      return Number(newDevice.id);
    };

  const savePpmReport = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!request || saving) {
      return;
    }

    if (!form.ppmDate) {
      setErrorMessage(
        "PPM date is required."
      );
      return;
    }

    if (!form.engineerName.trim()) {
      setErrorMessage(
        "Engineer name is required."
      );
      return;
    }

    if (
      form.nextPpmDate &&
      form.nextPpmDate <= form.ppmDate
    ) {
      setErrorMessage(
        "Next PPM date must be after the current PPM date."
      );
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      setSavedReportId(null);

      /*
       * 1. Find or create permanent device.
       */
      const deviceId =
        await findOrCreateDevice();

      /*
       * 2. Update permanent device information.
       */
      const {
        error: deviceUpdateError,
      } = await supabase
        .from("maintenance_devices")
        .update({
          maintenance_request_id:
            request.id,

          facility_name:
            request.facility_name,

          customer_name:
            request.customer_name,

          phone:
            request.phone,

          city:
            request.city,

          device_name:
            request.device_name,

          brand:
            request.brand,

          model:
            request.model,

          serial_number:
            request.serial_number?.trim() ||
            null,

          last_ppm_date:
            form.ppmDate,

          next_ppm_date:
            form.nextPpmDate || null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", deviceId);

      if (deviceUpdateError) {
        throw deviceUpdateError;
      }

      /*
       * 3. Save permanent PPM history record.
       */
      const {
        data: report,
        error: reportError,
      } = await supabase
        .from("ppm_reports")
        .insert({
          device_id:
            deviceId,

          maintenance_request_id:
            request.id,

          ppm_date:
            form.ppmDate,

          next_ppm_date:
            form.nextPpmDate || null,

          engineer_name:
            form.engineerName.trim(),

          inspection_check:
            form.inspectionCheck,

          cleaning_check:
            form.cleaningCheck,

          electrical_safety_check:
            form.electricalSafetyCheck,

          mechanical_safety_check:
            form.mechanicalSafetyCheck,

          performance_check:
            form.performanceCheck,

          accessories_check:
            form.accessoriesCheck,

          visual_condition:
            form.visualCondition.trim() ||
            null,

          electrical_condition:
            form.electricalCondition.trim() ||
            null,

          mechanical_condition:
            form.mechanicalCondition.trim() ||
            null,

          performance_condition:
            form.performanceCondition.trim() ||
            null,

          accessories:
            form.accessories.trim() ||
            null,

          work_performed:
            form.workPerformed.trim() ||
            null,

          recommendations:
            form.recommendations.trim() ||
            null,

          notes:
            form.notes.trim() ||
            null,

          result:
            form.result,
        })
        .select("id")
        .single();

      if (reportError) {
        throw reportError;
      }

      if (!report?.id) {
        throw new Error(
          "PPM report saved but no report ID was returned."
        );
      }

      /*
       * 4. Complete maintenance request.
       */
      const {
        error: requestUpdateError,
      } = await supabase
        .from("maintenance_requests")
        .update({
          status:
            "completed",

          assigned_engineer:
            form.engineerName.trim(),

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", request.id);

      if (requestUpdateError) {
        throw requestUpdateError;
      }

      /*
       * 5. Store generated report ID.
       */
      const savedId =
        Number(report.id);

      const reportNumber =
        formatReportNumber(savedId);

      setSavedReportId(savedId);

      setSuccessMessage(
        `PPM report ${reportNumber} saved successfully.`
      );

      setRequest((current) =>
        current
          ? {
              ...current,
              status:
                "completed",
              assigned_engineer:
                form.engineerName.trim(),
            }
          : current
      );
    } catch (error: unknown) {
      console.error(
        "Save PPM error:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  };

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
            Loading PPM...
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

  if (!request) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <FileText
            size={40}
            className="mx-auto text-slate-400"
          />

          <h1 className="mt-5 text-2xl font-black">
            Request Not Found
          </h1>

          <p className="mt-3 text-slate-500">
            {errorMessage ||
              "Maintenance request could not be found."}
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
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}

        <header className="rounded-3xl bg-slate-950 p-7 text-white">
          <Link
            href="/admin/maintenance-requests"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Maintenance Requests
          </Link>

          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-teal-400">
                Health Nations Medical
              </p>

              <h1 className="mt-2 text-3xl font-black">
                Preventive Maintenance Report
              </h1>

              <p className="mt-2 text-slate-300">
                Request{" "}
                {formatRequestNumber(
                  request.id
                )}
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-5 py-3">
              <p className="text-xs font-bold uppercase text-slate-400">
                Service Type
              </p>

              <p className="mt-1 font-black uppercase text-teal-400">
                {request.service_type}
              </p>
            </div>
          </div>
        </header>

        {/* DEVICE / CUSTOMER */}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <InfoCard
            icon={<Stethoscope />}
            title="Device Information"
          >
            <InfoRow
              label="Device"
              value={request.device_name}
            />

            <InfoRow
              label="Brand"
              value={request.brand}
            />

            <InfoRow
              label="Model"
              value={request.model}
            />

            <InfoRow
              label="Serial Number"
              value={request.serial_number}
            />
          </InfoCard>

          <InfoCard
            icon={<ClipboardCheck />}
            title="Customer Information"
          >
            <InfoRow
              label="Customer"
              value={request.customer_name}
            />

            <InfoRow
              label="Facility"
              value={request.facility_name}
            />

            <InfoRow
              label="City"
              value={request.city}
            />

            <InfoRow
              label="Phone"
              value={request.phone}
            />
          </InfoCard>
        </section>

        {/* PPM FORM */}

        <form
          onSubmit={savePpmReport}
          className="mt-6 space-y-6"
        >
          {/* PPM INFORMATION */}

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <SectionHeading
              icon={<CalendarDays />}
              title="PPM Information"
            />

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <FormInput
                type="date"
                label="PPM Date"
                name="ppmDate"
                value={form.ppmDate}
                onChange={
                  handleTextChange
                }
                required
              />

              <FormInput
                type="date"
                label="Next PPM Date"
                name="nextPpmDate"
                value={
                  form.nextPpmDate
                }
                onChange={
                  handleTextChange
                }
              />

              <FormInput
                label="Engineer Name"
                name="engineerName"
                value={
                  form.engineerName
                }
                onChange={
                  handleTextChange
                }
                placeholder="Engineer name"
                required
              />
            </div>
          </section>

          {/* CHECKLIST */}

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <SectionHeading
              icon={<ClipboardCheck />}
              title="Preventive Maintenance Checklist"
            />

            <p className="mt-2 text-sm text-slate-500">
              Mark each task after it has
              been completed and verified.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <CheckItem
                checked={
                  form.inspectionCheck
                }
                onChange={() =>
                  handleCheckChange(
                    "inspectionCheck"
                  )
                }
                title="Visual Inspection"
                description="Inspect housing, cables, connectors and visible condition."
              />

              <CheckItem
                checked={
                  form.cleaningCheck
                }
                onChange={() =>
                  handleCheckChange(
                    "cleaningCheck"
                  )
                }
                title="Cleaning"
                description="Clean equipment and accessible components."
              />

              <CheckItem
                checked={
                  form.electricalSafetyCheck
                }
                onChange={() =>
                  handleCheckChange(
                    "electricalSafetyCheck"
                  )
                }
                title="Electrical Safety"
                description="Check power cable, plug, grounding and electrical condition."
              />

              <CheckItem
                checked={
                  form.mechanicalSafetyCheck
                }
                onChange={() =>
                  handleCheckChange(
                    "mechanicalSafetyCheck"
                  )
                }
                title="Mechanical Safety"
                description="Check mechanical parts, movement and physical stability."
              />

              <CheckItem
                checked={
                  form.performanceCheck
                }
                onChange={() =>
                  handleCheckChange(
                    "performanceCheck"
                  )
                }
                title="Performance Test"
                description="Verify device operation and expected performance."
              />

              <CheckItem
                checked={
                  form.accessoriesCheck
                }
                onChange={() =>
                  handleCheckChange(
                    "accessoriesCheck"
                  )
                }
                title="Accessories Check"
                description="Inspect required accessories and connections."
              />
            </div>
          </section>

          {/* TECHNICAL ASSESSMENT */}

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <SectionHeading
              icon={<Activity />}
              title="Technical Assessment"
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <TextArea
                label="Visual Condition"
                name="visualCondition"
                value={
                  form.visualCondition
                }
                onChange={
                  handleTextChange
                }
                placeholder="Describe visual condition..."
              />

              <TextArea
                label="Electrical Condition"
                name="electricalCondition"
                value={
                  form.electricalCondition
                }
                onChange={
                  handleTextChange
                }
                placeholder="Describe electrical condition..."
              />

              <TextArea
                label="Mechanical Condition"
                name="mechanicalCondition"
                value={
                  form.mechanicalCondition
                }
                onChange={
                  handleTextChange
                }
                placeholder="Describe mechanical condition..."
              />

              <TextArea
                label="Performance Condition"
                name="performanceCondition"
                value={
                  form.performanceCondition
                }
                onChange={
                  handleTextChange
                }
                placeholder="Describe performance test results..."
              />
            </div>
          </section>

          {/* SERVICE DETAILS */}

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <SectionHeading
              icon={<Wrench />}
              title="Service Details"
            />

            <div className="mt-6 space-y-5">
              <TextArea
                label="Accessories"
                name="accessories"
                value={
                  form.accessories
                }
                onChange={
                  handleTextChange
                }
                placeholder="List accessories checked..."
              />

              <TextArea
                label="Work Performed"
                name="workPerformed"
                value={
                  form.workPerformed
                }
                onChange={
                  handleTextChange
                }
                placeholder="Describe preventive maintenance work performed..."
              />

              <TextArea
                label="Recommendations"
                name="recommendations"
                value={
                  form.recommendations
                }
                onChange={
                  handleTextChange
                }
                placeholder="Technical recommendations..."
              />

              <TextArea
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={
                  handleTextChange
                }
                placeholder="Additional notes..."
              />
            </div>
          </section>

          {/* FINAL RESULT */}

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <SectionHeading
              icon={<CheckCircle2 />}
              title="Final Result"
            />

            <div className="mt-6">
              <label className="text-sm font-black text-slate-800">
                Equipment Status
              </label>

              <select
                name="result"
                value={form.result}
                onChange={
                  handleTextChange
                }
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3.5 font-bold outline-none focus:border-blue-600 md:max-w-sm"
              >
                <option value="pass">
                  PASS
                </option>

                <option value="conditional">
                  CONDITIONAL
                </option>

                <option value="fail">
                  FAIL
                </option>
              </select>
            </div>
          </section>

          {/* ERROR */}

          {errorMessage && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700">
              {errorMessage}
            </div>
          )}

          {/* SUCCESS + REPORT BUTTON */}

          {successMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={24}
                    className="shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="font-black text-emerald-900">
                      PPM Saved Successfully
                    </p>

                    <p className="mt-1 text-sm font-bold text-emerald-700">
                      {successMessage}
                    </p>
                  </div>
                </div>

                {savedReportId && (
                  <Link
                    href={`/admin/ppm-reports/${savedReportId}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white transition hover:bg-emerald-800"
                  >
                    <FileText size={18} />
                    View / Print Report
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* SAVE */}

          <section className="flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black">
                Save Preventive Maintenance Report
              </p>

              <p className="mt-1 text-sm text-slate-400">
                The report will be stored
                permanently in the device
                PPM history.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-400 px-7 py-4 font-black text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={19} />
                  Save PPM Report
                </>
              )}
            </button>
          </section>
        </form>
      </div>
    </main>
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
    <div className="rounded-3xl bg-white p-6 shadow-sm">
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

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>

      <h2 className="text-xl font-black">
        {title}
      </h2>
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-800">
        {label}
      </span>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={4}
        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3.5 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function CheckItem({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition ${
        checked
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-slate-50 hover:border-blue-300"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 shrink-0 accent-emerald-600"
      />

      <div>
        <p className="font-black text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </label>
  );
}

function formatRequestNumber(
  id: number
) {
  return `HN-MNT-${String(id).padStart(
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

  return "Something went wrong while processing the PPM report.";
}