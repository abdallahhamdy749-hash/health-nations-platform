"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  Mail,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Trophy,
  User,
  XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type InquiryStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "won"
  | "lost";

type InquiryType =
  | "product"
  | "spare_part"
  | "rental"
  | "general";

type MarketplaceInquiry = {
  id: number;

  product_id: number | null;
  supplier_id: string | null;

  inquiry_type: InquiryType;

  product_name: string | null;
  part_number: string | null;

  supplier_name: string | null;
  supplier_country: string | null;

  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_country: string | null;

  message: string | null;
  source: string | null;

  status: InquiryStatus;
  admin_notes: string | null;

  created_at: string;
  updated_at: string;
};

type StatusFilter =
  | "all"
  | InquiryStatus;

export default function MarketplaceInquiriesPage() {
  const [inquiries, setInquiries] =
    useState<MarketplaceInquiry[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [authorized, setAuthorized] =
    useState<boolean | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: authData,
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      const user = authData.user;

      if (!user) {
        setAuthorized(false);
        setInquiries([]);
        return;
      }

      const {
        data: adminData,
        error: adminError,
      } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (adminError) {
        throw adminError;
      }

      if (!adminData) {
        setAuthorized(false);
        setInquiries([]);
        return;
      }

      setAuthorized(true);

      const {
        data,
        error,
      } = await supabase
        .from("marketplace_inquiries")
        .select(`
          id,
          product_id,
          supplier_id,
          inquiry_type,
          product_name,
          part_number,
          supplier_name,
          supplier_country,
          customer_name,
          customer_phone,
          customer_email,
          customer_country,
          message,
          source,
          status,
          admin_notes,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setInquiries(
        (data ?? []) as MarketplaceInquiry[]
      );
    } catch (error: unknown) {
      console.error(
        "Marketplace inquiries error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load marketplace inquiries."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPage();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadPage]);

  const filteredInquiries = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return inquiries.filter((inquiry) => {
      const matchesStatus =
        statusFilter === "all" ||
        inquiry.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        String(inquiry.id),
        inquiry.product_name,
        inquiry.part_number,
        inquiry.supplier_name,
        inquiry.supplier_country,
        inquiry.customer_name,
        inquiry.customer_phone,
        inquiry.customer_email,
        inquiry.customer_country,
        inquiry.message,
        inquiry.source,
        inquiry.inquiry_type,
      ].some((value) =>
        value
          ?.toLowerCase()
          .includes(normalizedSearch)
      );
    });
  }, [
    inquiries,
    search,
    statusFilter,
  ]);

  const counts = useMemo(() => {
    return {
      total: inquiries.length,

      new: inquiries.filter(
        (item) => item.status === "new"
      ).length,

      contacted: inquiries.filter(
        (item) => item.status === "contacted"
      ).length,

      quoted: inquiries.filter(
        (item) => item.status === "quoted"
      ).length,

      won: inquiries.filter(
        (item) => item.status === "won"
      ).length,

      lost: inquiries.filter(
        (item) => item.status === "lost"
      ).length,
    };
  }, [inquiries]);

  async function updateStatus(
    inquiryId: number,
    status: InquiryStatus
  ) {
    try {
      setSavingId(inquiryId);
      setErrorMessage("");

      const {
        error,
      } = await supabase
        .from("marketplace_inquiries")
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", inquiryId);

      if (error) {
        throw error;
      }

      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiryId
            ? {
                ...item,
                status,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to update inquiry status."
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  async function updateNotes(
    inquiryId: number,
    notes: string
  ) {
    try {
      setSavingId(inquiryId);
      setErrorMessage("");

      const {
        error,
      } = await supabase
        .from("marketplace_inquiries")
        .update({
          admin_notes:
            notes.trim() || null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", inquiryId);

      if (error) {
        throw error;
      }

      setInquiries((current) =>
        current.map((item) =>
          item.id === inquiryId
            ? {
                ...item,
                admin_notes:
                  notes.trim() || null,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );
    } catch (error: unknown) {
      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to save admin notes."
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-700" />

            <span className="font-bold text-slate-700">
              Loading marketplace inquiries...
            </span>
          </div>
        </div>
      </main>
    );
  }

  if (authorized === false) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <div className="max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <XCircle
            className="mx-auto text-red-600"
            size={46}
          />

          <h1 className="mt-4 text-3xl font-black text-slate-950">
            Admin Access Required
          </h1>

          <p className="mt-3 text-slate-600">
            You must sign in with an authorized
            Health Nations administrator account.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-blue-700 px-6 py-3 font-bold text-white"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Admin Dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-blue-300">
                Health Nations
              </p>

              <h1 className="mt-2 text-4xl font-black">
                Marketplace Inquiries
              </h1>

              <p className="mt-3 max-w-2xl text-slate-300">
                Manage customer leads from products,
                spare parts, rentals and the global
                medical marketplace.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadPage()
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-950"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <DashboardStat
            label="Total"
            value={counts.total}
            icon={<ShoppingBag size={20} />}
          />

          <DashboardStat
            label="New"
            value={counts.new}
            icon={<Clock3 size={20} />}
          />

          <DashboardStat
            label="Contacted"
            value={counts.contacted}
            icon={<MessageCircle size={20} />}
          />

          <DashboardStat
            label="Quoted"
            value={counts.quoted}
            icon={<Package size={20} />}
          />

          <DashboardStat
            label="Won"
            value={counts.won}
            icon={<Trophy size={20} />}
          />

          <DashboardStat
            label="Lost"
            value={counts.lost}
            icon={<XCircle size={20} />}
          />
        </section>

        <section className="mt-7 rounded-3xl bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <label className="relative block">
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
                placeholder="Search customer, product, Part Number, supplier, phone..."
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-blue-700"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="new">
                New
              </option>

              <option value="contacted">
                Contacted
              </option>

              <option value="quoted">
                Quoted
              </option>

              <option value="won">
                Won
              </option>

              <option value="lost">
                Lost
              </option>
            </select>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Showing{" "}
            <strong>
              {filteredInquiries.length}
            </strong>{" "}
            of{" "}
            <strong>
              {inquiries.length}
            </strong>{" "}
            inquiries
          </p>
        </section>

        {filteredInquiries.length === 0 ? (
          <section className="mt-7 flex min-h-80 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm">
            <ShoppingBag
              size={48}
              className="text-slate-300"
            />

            <h2 className="mt-5 text-2xl font-black">
              No inquiries found
            </h2>

            <p className="mt-2 max-w-lg text-slate-500">
              Customer marketplace inquiries will
              appear here after the marketplace is
              connected to this lead system.
            </p>
          </section>
        ) : (
          <section className="mt-7 space-y-5">
            {filteredInquiries.map(
              (inquiry) => (
                <InquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  saving={
                    savingId === inquiry.id
                  }
                  onStatusChange={
                    updateStatus
                  }
                  onSaveNotes={
                    updateNotes
                  }
                />
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}

function InquiryCard({
  inquiry,
  saving,
  onStatusChange,
  onSaveNotes,
}: {
  inquiry: MarketplaceInquiry;
  saving: boolean;

  onStatusChange: (
    id: number,
    status: InquiryStatus
  ) => Promise<void>;

  onSaveNotes: (
    id: number,
    notes: string
  ) => Promise<void>;
}) {
  const [notes, setNotes] =
    useState(
      inquiry.admin_notes || ""
    );

  const customerWhatsapp =
    inquiry.customer_phone
      ? createWhatsAppUrl(
          inquiry.customer_phone,
          `مرحبًا ${
            inquiry.customer_name ||
            ""
          }

معك فريق صحة الأمم بخصوص طلبك على منصة Health Nations.

المنتج: ${
            inquiry.product_name ||
            "Medical Product"
          }
${
  inquiry.part_number
    ? `Part Number: ${inquiry.part_number}`
    : ""
}

رقم الطلب: HN-MKT-${String(
            inquiry.id
          ).padStart(5, "0")}`
        )
      : "";

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 md:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status={inquiry.status}
              />

              <InquiryTypeBadge
                type={
                  inquiry.inquiry_type
                }
              />

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                HN-MKT-
                {String(
                  inquiry.id
                ).padStart(5, "0")}
              </span>
            </div>

            <h2 className="mt-4 text-2xl font-black text-slate-950">
              {inquiry.product_name ||
                "General Marketplace Inquiry"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Received{" "}
              {formatDateTime(
                inquiry.created_at
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {inquiry.product_id && (
              <Link
                href={`/store/product/${inquiry.product_id}`}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink
                  size={16}
                />
                View Product
              </Link>
            )}

            {customerWhatsapp && (
              <a
                href={customerWhatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <MessageCircle
                  size={17}
                />
                WhatsApp Customer
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-3">
        <section>
          <SectionTitle>
            Customer
          </SectionTitle>

          <InfoRow
            icon={<User size={16} />}
            label="Name"
            value={
              inquiry.customer_name ||
              "Not provided"
            }
          />

          <InfoRow
            icon={<Phone size={16} />}
            label="Phone"
            value={
              inquiry.customer_phone ||
              "Not provided"
            }
          />

          <InfoRow
            icon={<Mail size={16} />}
            label="Email"
            value={
              inquiry.customer_email ||
              "Not provided"
            }
          />

          <InfoRow
            icon={
              <Globe2 size={16} />
            }
            label="Country"
            value={
              inquiry.customer_country ||
              "Not provided"
            }
          />
        </section>

        <section>
          <SectionTitle>
            Product
          </SectionTitle>

          <InfoRow
            icon={<Package size={16} />}
            label="Product"
            value={
              inquiry.product_name ||
              "Not specified"
            }
          />

          <InfoRow
            icon={<Settings size={16} />}
            label="Part Number"
            value={
              inquiry.part_number ||
              "—"
            }
          />

          <InfoRow
            icon={
              <Building2 size={16} />
            }
            label="Supplier"
            value={
              inquiry.supplier_name ||
              "Not specified"
            }
          />

          <InfoRow
            icon={<Globe2 size={16} />}
            label="Supplier Country"
            value={
              inquiry.supplier_country ||
              "Not specified"
            }
          />
        </section>

        <section>
          <SectionTitle>
            Lead Management
          </SectionTitle>

          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Status
            </span>

            <select
              value={inquiry.status}
              disabled={saving}
              onChange={(event) =>
                void onStatusChange(
                  inquiry.id,
                  event.target
                    .value as InquiryStatus
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 font-semibold outline-none focus:border-blue-700 disabled:opacity-60"
            >
              <option value="new">
                New
              </option>

              <option value="contacted">
                Contacted
              </option>

              <option value="quoted">
                Quoted
              </option>

              <option value="won">
                Won
              </option>

              <option value="lost">
                Lost
              </option>
            </select>
          </label>

          <label className="mt-4 block">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Admin Notes
            </span>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value
                )
              }
              rows={4}
              placeholder="Add follow-up notes..."
              className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-700"
            />
          </label>

          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onSaveNotes(
                inquiry.id,
                notes
              )
            }
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <CheckCircle2
                size={16}
              />
            )}

            Save Notes
          </button>
        </section>
      </div>

      {inquiry.message && (
        <div className="border-t border-slate-100 bg-slate-50 p-5 md:p-6">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Customer Message
          </p>

          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
            {inquiry.message}
          </p>
        </div>
      )}
    </article>
  );
}

function DashboardStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black">
            {value}
          </p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
          {icon}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-4 text-sm font-black uppercase tracking-wider text-slate-950">
      {children}
    </h3>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400">
          {label}
        </p>

        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: InquiryStatus;
}) {
  const styles: Record<
    InquiryStatus,
    string
  > = {
    new:
      "bg-blue-100 text-blue-800",
    contacted:
      "bg-violet-100 text-violet-800",
    quoted:
      "bg-amber-100 text-amber-800",
    won:
      "bg-emerald-100 text-emerald-800",
    lost:
      "bg-red-100 text-red-700",
  };

  const labels: Record<
    InquiryStatus,
    string
  > = {
    new: "New",
    contacted: "Contacted",
    quoted: "Quoted",
    won: "Won",
    lost: "Lost",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function InquiryTypeBadge({
  type,
}: {
  type: InquiryType;
}) {
  const labels: Record<
    InquiryType,
    string
  > = {
    product: "Product",
    spare_part: "Spare Part",
    rental: "Rental",
    general: "General",
  };

  return (
    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
      {labels[type]}
    </span>
  );
}

function formatDateTime(
  value: string
) {
  try {
    return new Intl.DateTimeFormat(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    ).format(new Date(value));
  } catch {
    return value;
  }
}

function createWhatsAppUrl(
  phone: string,
  message: string
) {
  const normalizedPhone =
    phone.replace(/\D/g, "");

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    message
  )}`;
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message?: unknown;
        }
      ).message
    );
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}