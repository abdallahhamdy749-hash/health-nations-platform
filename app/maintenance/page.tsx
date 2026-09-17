"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Gauge,
  MapPin,
  Phone,
  Settings,
  ShieldCheck,
  Stethoscope,
  Upload,
  User,
  Wrench,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ServiceType =
  | "repair"
  | "ppm"
  | "inspection"
  | "installation";

type MaintenanceForm = {
  customerName: string;
  facilityName: string;
  phone: string;
  city: string;
  deviceName: string;
  brand: string;
  model: string;
  serialNumber: string;
  problemDescription: string;
};

const initialForm: MaintenanceForm = {
  customerName: "",
  facilityName: "",
  phone: "",
  city: "",
  deviceName: "",
  brand: "",
  model: "",
  serialNumber: "",
  problemDescription: "",
};

export default function MaintenancePage() {
  const [serviceType, setServiceType] =
    useState<ServiceType>("repair");

  const [form, setForm] =
    useState<MaintenanceForm>(initialForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [requestNumber, setRequestNumber] =
    useState<string | null>(null);

  const handleChange = (
    event:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) return;

    try {
      setSubmitting(true);
      setErrorMessage("");
      setRequestNumber(null);

      const { data, error } = await supabase
        .from("maintenance_requests")
        .insert({
          customer_name:
            form.customerName.trim(),

          facility_name:
            form.facilityName.trim() || null,

          phone:
            form.phone.trim(),

          city:
            form.city.trim(),

          service_type:
            serviceType,

          device_name:
            form.deviceName.trim(),

          brand:
            form.brand.trim() || null,

          model:
            form.model.trim() || null,

          serial_number:
            form.serialNumber.trim() || null,

          problem_description:
            form.problemDescription.trim() || null,

          status: "new",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      if (!data?.id) {
        throw new Error(
          "Request saved but no request ID was returned."
        );
      }

      const number =
        `HN-MNT-${String(data.id).padStart(
          5,
          "0"
        )}`;

      setRequestNumber(number);

      setForm(initialForm);
      setServiceType("repair");
    } catch (error: unknown) {
      console.error(
        "Maintenance request error:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-blue-700"
            >
              <ArrowLeft size={17} />
              Back to Home
            </Link>

            <h1 className="mt-3 text-xl font-black text-slate-950">
              Health Nations Medical
            </h1>
          </div>

          <div className="hidden rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 sm:block">
            Medical Equipment Service
          </div>
        </div>
      </header>

      {/* HERO */}

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-2 text-sm font-bold text-teal-300">
              <Wrench size={17} />
              Maintenance & PPM
            </div>

            <h2 className="mt-6 text-4xl font-black leading-tight md:text-5xl">
              Medical Equipment

              <span className="block text-teal-400">
                Maintenance Services
              </span>
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Request corrective maintenance,
              preventive maintenance, inspection
              or installation for your medical
              equipment.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <HeroFeature
                icon={<ShieldCheck size={19} />}
                text="Preventive Maintenance"
              />

              <HeroFeature
                icon={<ClipboardCheck size={19} />}
                text="PPM Reports"
              />

              <HeroFeature
                icon={<Activity size={19} />}
                text="Performance Testing"
              />

              <HeroFeature
                icon={<FileText size={19} />}
                text="Printable Service Records"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-7 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400 text-slate-950">
                <Stethoscope size={28} />
              </div>

              <div>
                <p className="font-black">
                  Equipment Maintenance
                </p>

                <p className="text-sm text-slate-400">
                  Health Nations Medical
                </p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <ProcessRow
                number="01"
                title="Submit Request"
                description="Enter equipment and fault information."
              />

              <ProcessRow
                number="02"
                title="Technical Review"
                description="Our technical team reviews the request."
              />

              <ProcessRow
                number="03"
                title="Service & Testing"
                description="Maintenance, inspection and performance testing."
              />

              <ProcessRow
                number="04"
                title="PPM Report"
                description="Generate and print the device service report."
              />
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE TYPE */}

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-7">
          <p className="text-sm font-black uppercase tracking-widest text-blue-700">
            Service Type
          </p>

          <h2 className="mt-2 text-3xl font-black">
            What service do you need?
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <ServiceCard
            active={serviceType === "repair"}
            onClick={() =>
              setServiceType("repair")
            }
            icon={<Wrench size={25} />}
            title="Repair"
            description="Corrective maintenance for equipment faults."
          />

          <ServiceCard
            active={serviceType === "ppm"}
            onClick={() =>
              setServiceType("ppm")
            }
            icon={<CalendarCheck size={25} />}
            title="PPM"
            description="Planned preventive maintenance service."
          />

          <ServiceCard
            active={serviceType === "inspection"}
            onClick={() =>
              setServiceType("inspection")
            }
            icon={<ClipboardCheck size={25} />}
            title="Inspection"
            description="Technical and performance inspection."
          />

          <ServiceCard
            active={serviceType === "installation"}
            onClick={() =>
              setServiceType("installation")
            }
            icon={<Settings size={25} />}
            title="Installation"
            description="Installation and commissioning service."
          />
        </div>
      </section>

      {/* FORM */}

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-200 bg-slate-50 p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <FileText size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  Maintenance Request
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Complete the information below
                  to submit your service request.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-10 p-6 md:p-8 lg:grid-cols-2">
            {/* CUSTOMER INFORMATION */}

            <div>
              <SectionTitle
                icon={<Building2 size={21} />}
                title="Customer Information"
              />

              <div className="mt-6 space-y-5">
                <InputField
                  icon={<User size={18} />}
                  label="Contact Name"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  placeholder="Contact person"
                  required
                />

                <InputField
                  icon={<Building2 size={18} />}
                  label="Hospital / Clinic / Facility"
                  name="facilityName"
                  value={form.facilityName}
                  onChange={handleChange}
                  placeholder="Facility name"
                />

                <InputField
                  icon={<Phone size={18} />}
                  label="Phone / WhatsApp"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+966..."
                  required
                />

                <InputField
                  icon={<MapPin size={18} />}
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Riyadh"
                  required
                />
              </div>
            </div>

            {/* DEVICE INFORMATION */}

            <div>
              <SectionTitle
                icon={<Stethoscope size={21} />}
                title="Device Information"
              />

              <div className="mt-6 space-y-5">
                <InputField
                  icon={<Stethoscope size={18} />}
                  label="Device Name"
                  name="deviceName"
                  value={form.deviceName}
                  onChange={handleChange}
                  placeholder="Example: Ultrasound"
                  required
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <InputField
                    label="Brand"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="Brand"
                  />

                  <InputField
                    label="Model"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                    placeholder="Model"
                  />
                </div>

                <InputField
                  icon={<Gauge size={18} />}
                  label="Serial Number"
                  name="serialNumber"
                  value={form.serialNumber}
                  onChange={handleChange}
                  placeholder="S/N"
                />
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="border-t border-slate-200 p-6 md:p-8">
            <label className="text-sm font-black text-slate-800">
              Problem / Service Description
            </label>

            <textarea
              name="problemDescription"
              value={form.problemDescription}
              onChange={handleChange}
              rows={5}
              placeholder="Describe the fault, maintenance requirement or PPM request..."
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-4 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-7 text-center">
              <Upload
                size={30}
                className="mx-auto text-slate-400"
              />

              <p className="mt-3 font-black">
                Device Photos
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Device photo upload will be
                connected to Supabase Storage.
              </p>
            </div>
          </div>

          {/* RESULT / SUBMIT */}

          <div className="border-t border-slate-200 bg-slate-50 p-6 md:p-8">
            {requestNumber && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={24}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <div>
                    <p className="font-black text-emerald-900">
                      Maintenance request submitted
                      successfully
                    </p>

                    <p className="mt-1 text-sm text-emerald-700">
                      Your request number is:
                    </p>

                    <p className="mt-2 text-xl font-black text-emerald-950">
                      {requestNumber}
                    </p>

                    <p className="mt-2 text-sm text-emerald-700">
                      Health Nations Medical will
                      review your request.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2
                  size={18}
                  className="text-emerald-600"
                />

                Selected service:

                <strong className="uppercase text-slate-900">
                  {serviceType}
                </strong>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-blue-700 px-8 py-4 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Maintenance Request"}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* PPM */}

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="grid gap-8 rounded-3xl bg-slate-950 p-8 text-white lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-teal-400">
                <ClipboardCheck size={22} />

                <span className="font-black">
                  Digital PPM System
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-black">
                PPM report for every medical device
              </h2>

              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                Every device can have its own
                preventive maintenance history
                including inspection, cleaning,
                safety checks, performance tests,
                engineer details and next PPM date.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-6 py-5 text-center">
              <FileText
                size={34}
                className="mx-auto text-teal-400"
              />

              <p className="mt-2 font-black">
                Print PPM Report
              </p>

              <p className="text-xs text-slate-400">
                PDF / Print
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HeroFeature({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3">
      <span className="text-teal-400">
        {icon}
      </span>

      <span className="text-sm font-bold text-slate-200">
        {text}
      </span>
    </div>
  );
}

function ProcessRow({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-teal-400">
        {number}
      </div>

      <div>
        <p className="font-black">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function ServiceCard({
  active,
  onClick,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-6 text-left transition ${
        active
          ? "border-blue-700 bg-blue-700 text-white shadow-lg"
          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
          active
            ? "bg-white/15"
            : "bg-blue-50 text-blue-700"
        }`}
      >
        {icon}
      </div>

      <h3 className="mt-5 text-xl font-black">
        {title}
      </h3>

      <p
        className={`mt-2 text-sm leading-6 ${
          active
            ? "text-blue-100"
            : "text-slate-500"
        }`}
      >
        {description}
      </p>
    </button>
  );
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-blue-700">
        {icon}
      </span>

      <h3 className="text-lg font-black">
        {title}
      </h3>
    </div>
  );
}

function InputField({
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  icon?: React.ReactNode;
  label: string;
  name: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void;
  placeholder?: string;
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

      <div className="relative mt-2">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-2xl border border-slate-300 py-3.5 pr-4 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100 ${
            icon ? "pl-11" : "pl-4"
          }`}
        />
      </div>
    </label>
  );
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

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to submit the maintenance request. Please try again.";
}