"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  PackageSearch,
  Pencil,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "abdallahelnomany@gmail.com";

type RequestStatus =
  | "new"
  | "reviewing"
  | "quoted"
  | "ordered"
  | "shipped"
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

type ImportRequest = {
  id: number;
  user_id: string | null;

  product_name: string;
  alibaba_url: string | null;
  product_url: string | null;
  product_image_url: string | null;

  quantity: number;
  target_price: number | null;
  currency: string;

  specifications: string | null;

  destination_country: string;
  destination_city: string | null;

  customer_name: string;
  customer_email: string | null;
  customer_phone: string;

  request_type: string;
  status: RequestStatus;

  supplier_name: string | null;
  supplier_contact: string | null;
  supplier_product_url: string | null;

  supplier_price: number | null;
  shipping_cost: number | null;
  customs_cost: number | null;
  other_costs: number | null;

  quoted_price: number | null;
  profit: number | null;

  admin_notes: string | null;

  quotation_sent_at: string | null;

  created_at: string;
  updated_at: string | null;
};

type QuoteDraft = {
  supplier_name: string;
  supplier_contact: string;
  supplier_product_url: string;

  supplier_price: string;
  shipping_cost: string;
  customs_cost: string;
  other_costs: string;

  quoted_price: string;
  currency: CurrencyCode;

  admin_notes: string;
};

const statusOptions: Array<{
  value: RequestStatus;
  label: string;
}> = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "quoted", label: "Quoted" },
  { value: "ordered", label: "Ordered" },
  { value: "shipped", label: "Shipped" },
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
  const normalized = value?.trim().toUpperCase();

  const supportedCurrencies = currencyOptions.map(
    (option) => option.value
  );

  if (
    normalized &&
    supportedCurrencies.includes(
      normalized as CurrencyCode
    )
  ) {
    return normalized as CurrencyCode;
  }

  return "SAR";
}

export default function AdminImportRequestsPage() {
  const router = useRouter();

  const [requests, setRequests] =
    useState<ImportRequest[]>([]);

  const [drafts, setDrafts] =
    useState<Record<number, QuoteDraft>>({});

  const [loading, setLoading] = useState(true);

  const [savingId, setSavingId] =
    useState<number | null>(null);

  const [sendingId, setSendingId] =
    useState<number | null>(null);

  const [updatingId, setUpdatingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      if (
        user.email?.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
      ) {
        setErrorMessage(
          "This account does not have admin access."
        );
        return;
      }

      const { data, error } = await supabase
        .from("import_requests")
        .select(`
          id,
          user_id,
          product_name,
          alibaba_url,
          product_url,
          product_image_url,
          quantity,
          target_price,
          currency,
          specifications,
          destination_country,
          destination_city,
          customer_name,
          customer_email,
          customer_phone,
          request_type,
          status,
          supplier_name,
          supplier_contact,
          supplier_product_url,
          supplier_price,
          shipping_cost,
          customs_cost,
          other_costs,
          quoted_price,
          profit,
          admin_notes,
          quotation_sent_at,
          created_at,
          updated_at
        `)
        .order("created_at", {
          ascending: false,
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

      const loadedRequests =
        (data ?? []) as ImportRequest[];

      setRequests(loadedRequests);

      const nextDrafts: Record<
        number,
        QuoteDraft
      > = {};

      loadedRequests.forEach((request) => {
        nextDrafts[request.id] = {
          supplier_name:
            request.supplier_name ?? "",

          supplier_contact:
            request.supplier_contact ?? "",

          supplier_product_url:
            request.supplier_product_url ?? "",

          supplier_price:
            request.supplier_price !== null
              ? String(request.supplier_price)
              : "",

          shipping_cost:
            request.shipping_cost !== null
              ? String(request.shipping_cost)
              : "",

          customs_cost:
            request.customs_cost !== null
              ? String(request.customs_cost)
              : "",

          other_costs:
            request.other_costs !== null
              ? String(request.other_costs)
              : "",

          quoted_price:
            request.quoted_price !== null
              ? String(request.quoted_price)
              : "",

          currency: normalizeCurrency(
            request.currency
          ),

          admin_notes:
            request.admin_notes ?? "",
        };
      });

      setDrafts(nextDrafts);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load import requests."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRequests();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const term = search.trim().toLowerCase();

    return requests.filter((request) => {
      const values = [
        request.product_name,
        request.customer_name,
        request.customer_phone,
        request.customer_email,
        request.destination_country,
        request.destination_city,
        request.supplier_name,
      ];

      const matchesSearch =
        !term ||
        values.some((value) =>
          value?.toLowerCase().includes(term)
        );

      const matchesStatus =
        statusFilter === "all" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  function updateDraft(
    id: number,
    field: keyof QuoteDraft,
    value: string
  ) {
    setDrafts((current) => {
      const currentDraft = current[id];

      if (!currentDraft) {
        return current;
      }

      return {
        ...current,
        [id]: {
          ...currentDraft,
          [field]: value,
        },
      };
    });
  }

  function updateCurrencyDraft(
    id: number,
    currency: CurrencyCode
  ) {
    setDrafts((current) => {
      const currentDraft = current[id];

      if (!currentDraft) {
        return current;
      }

      return {
        ...current,
        [id]: {
          ...currentDraft,
          currency,
        },
      };
    });
  }

  function parseNullableNumber(
    value: string
  ): number | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);

    if (!Number.isFinite(parsed)) {
      return null;
    }

    return parsed;
  }

  function calculateProfit(
    draft: QuoteDraft
  ): number | null {
    const quotedPrice =
      parseNullableNumber(draft.quoted_price);

    if (quotedPrice === null) {
      return null;
    }

    const supplierPrice =
      parseNullableNumber(
        draft.supplier_price
      ) ?? 0;

    const shippingCost =
      parseNullableNumber(
        draft.shipping_cost
      ) ?? 0;

    const customsCost =
      parseNullableNumber(
        draft.customs_cost
      ) ?? 0;

    const otherCosts =
      parseNullableNumber(
        draft.other_costs
      ) ?? 0;

    return (
      quotedPrice -
      supplierPrice -
      shippingCost -
      customsCost -
      otherCosts
    );
  }

  async function saveQuotation(
    id: number,
    showSuccess = true
  ): Promise<boolean> {
    const draft = drafts[id];

    if (!draft) {
      setErrorMessage(
        "Quotation data not found."
      );
      return false;
    }

    try {
      setSavingId(id);
      setErrorMessage("");

      if (showSuccess) {
        setSuccessMessage("");
      }

      const quotedPrice =
        parseNullableNumber(
          draft.quoted_price
        );

      if (
        quotedPrice === null ||
        quotedPrice <= 0
      ) {
        throw new Error(
          "Please enter a valid Customer Quoted Price."
        );
      }

      const supplierPrice =
        parseNullableNumber(
          draft.supplier_price
        );

      const shippingCost =
        parseNullableNumber(
          draft.shipping_cost
        );

      const customsCost =
        parseNullableNumber(
          draft.customs_cost
        );

      const otherCosts =
        parseNullableNumber(
          draft.other_costs
        );

      const profit =
        quotedPrice -
        (supplierPrice ?? 0) -
        (shippingCost ?? 0) -
        (customsCost ?? 0) -
        (otherCosts ?? 0);

      const updatedAt =
        new Date().toISOString();

      const { data, error } = await supabase
        .from("import_requests")
        .update({
          supplier_name:
            draft.supplier_name.trim() || null,

          supplier_contact:
            draft.supplier_contact.trim() ||
            null,

          supplier_product_url:
            draft.supplier_product_url.trim() ||
            null,

          supplier_price: supplierPrice,
          shipping_cost: shippingCost,
          customs_cost: customsCost,
          other_costs: otherCosts,

          quoted_price: quotedPrice,
          currency: draft.currency,
          profit,

          admin_notes:
            draft.admin_notes.trim() || null,

          updated_at: updatedAt,
        })
        .eq("id", id)
        .select(`
          id,
          quoted_price,
          currency,
          profit,
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
          "No row was updated. Please check admin login and RLS policy."
        );
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,

                supplier_name:
                  draft.supplier_name.trim() ||
                  null,

                supplier_contact:
                  draft.supplier_contact.trim() ||
                  null,

                supplier_product_url:
                  draft.supplier_product_url.trim() ||
                  null,

                supplier_price: supplierPrice,
                shipping_cost: shippingCost,
                customs_cost: customsCost,
                other_costs: otherCosts,

                quoted_price: quotedPrice,
                currency: draft.currency,
                profit,

                admin_notes:
                  draft.admin_notes.trim() ||
                  null,

                updated_at: updatedAt,
              }
            : item
        )
      );

      if (showSuccess) {
        setSuccessMessage(
          `Quotation for Request #${id} saved successfully. Price: ${quotedPrice.toLocaleString()} ${draft.currency}`
        );
      }

      return true;
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save quotation."
      );

      return false;
    } finally {
      setSavingId(null);
    }
  }

  async function updateStatus(
    id: number,
    status: RequestStatus
  ) {
    try {
      setUpdatingId(id);
      setErrorMessage("");
      setSuccessMessage("");

      const now = new Date().toISOString();

      const updatePayload: {
        status: RequestStatus;
        updated_at: string;
        quotation_sent_at?: string;
      } = {
        status,
        updated_at: now,
      };

      if (status === "quoted") {
        updatePayload.quotation_sent_at = now;
      }

      const { data, error } = await supabase
        .from("import_requests")
        .update(updatePayload)
        .eq("id", id)
        .select(`
          id,
          status,
          quotation_sent_at
        `)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "Status was not updated."
        );
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
                updated_at: now,
                quotation_sent_at:
                  status === "quoted"
                    ? now
                    : item.quotation_sent_at,
              }
            : item
        )
      );

      setSuccessMessage(
        `Request #${id} status changed to ${status}.`
      );
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function sendQuotation(
    request: ImportRequest
  ) {
    const popup = window.open("", "_blank");

    try {
      setSendingId(request.id);
      setErrorMessage("");
      setSuccessMessage("");

      const saved = await saveQuotation(
        request.id,
        false
      );

      if (!saved) {
        popup?.close();
        return;
      }

      const draft = drafts[request.id];

      if (!draft) {
        popup?.close();
        return;
      }

      const quotedPrice =
        parseNullableNumber(
          draft.quoted_price
        );

      if (quotedPrice === null) {
        popup?.close();

        setErrorMessage(
          "Please enter Customer Quoted Price first."
        );

        return;
      }

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("import_requests")
        .update({
          status: "quoted",
          quotation_sent_at: now,
          updated_at: now,
          currency: draft.currency,
        })
        .eq("id", request.id)
        .select(`
          id,
          status,
          currency,
          quotation_sent_at
        `)
        .maybeSingle();

      if (error) {
        popup?.close();
        throw new Error(error.message);
      }

      if (!data) {
        popup?.close();

        throw new Error(
          "Unable to mark quotation as sent."
        );
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? {
                ...item,
                quoted_price: quotedPrice,
                currency: draft.currency,
                status: "quoted",
                quotation_sent_at: now,
                updated_at: now,
              }
            : item
        )
      );

      const whatsappUrl =
        createQuotationWhatsAppUrl(
          request,
          quotedPrice,
          draft.currency
        );

      if (popup) {
        popup.location.href = whatsappUrl;
      } else {
        window.location.href = whatsappUrl;
      }

      setSuccessMessage(
        `Quotation for Request #${request.id} marked as Quoted and WhatsApp opened successfully.`
      );
    } catch (error: unknown) {
      popup?.close();

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send quotation."
      );
    } finally {
      setSendingId(null);
    }
  }

  const total = requests.length;

  const newCount = requests.filter(
    (item) => item.status === "new"
  ).length;

  const activeCount = requests.filter(
    (item) =>
      [
        "reviewing",
        "quoted",
        "ordered",
        "shipped",
      ].includes(item.status)
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === "completed"
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl bg-slate-950 p-7 text-white shadow-sm md:p-10">
          <p className="font-bold uppercase tracking-widest text-blue-300">
            Health Nations Admin
          </p>

          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-black md:text-5xl">
                Import Requests
              </h1>

              <p
                className="mt-3 text-slate-300"
                dir="rtl"
              >
                إدارة طلبات الاستيراد والتوريد
                والتسعير والعملات والربحية.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadRequests()
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20"
            >
              <RefreshCw size={18} />
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
            value={completedCount}
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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customer, product, supplier..."
                className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            >
              <option value="all">
                All Statuses
              </option>

              {statusOptions.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {errorMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle size={22} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 font-bold text-emerald-700">
            <CheckCircle2 size={22} />
            <span>{successMessage}</span>
          </div>
        )}

        <section className="mt-6">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center gap-3 rounded-3xl bg-white shadow-sm">
              <Loader2 className="animate-spin text-blue-700" />

              <span className="font-bold">
                Loading import requests...
              </span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm">
              <PackageSearch
                size={46}
                className="text-blue-700"
              />

              <h2 className="mt-4 text-2xl font-black">
                No import requests found
              </h2>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredRequests.map(
                (request) => {
                  const draft =
                    drafts[request.id];

                  if (!draft) {
                    return null;
                  }

                  const profit =
                    calculateProfit(draft);

                  return (
                    <article
                      key={request.id}
                      className="rounded-3xl bg-white p-6 shadow-sm"
                    >
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-50 text-blue-700">
                            {request.product_image_url ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    request.product_image_url
                                  }
                                  alt={
                                    request.product_name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              </>
                            ) : (
                              <PackageSearch
                                size={28}
                              />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h2 className="text-xl font-black">
                                {
                                  request.product_name
                                }
                              </h2>

                              <StatusBadge
                                status={
                                  request.status
                                }
                              />
                            </div>

                            <p className="mt-2 text-sm text-slate-500">
                              Request #{request.id}
                              {" • "}
                              {new Date(
                                request.created_at
                              ).toLocaleString()}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                              <span>
                                <strong>
                                  Customer:
                                </strong>{" "}
                                {
                                  request.customer_name
                                }
                              </span>

                              <span>
                                <strong>
                                  Qty:
                                </strong>{" "}
                                {request.quantity}
                              </span>

                              <span>
                                <strong>
                                  Destination:
                                </strong>{" "}
                                {[
                                  request.destination_city,
                                  request.destination_country,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>

                              {request.target_price !==
                                null && (
                                <span>
                                  <strong>
                                    Target:
                                  </strong>{" "}
                                  {Number(
                                    request.target_price
                                  ).toLocaleString()}{" "}
                                  {request.currency}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {request.alibaba_url && (
                            <a
                              href={
                                request.alibaba_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                            >
                              Alibaba
                              <ExternalLink
                                size={16}
                              />
                            </a>
                          )}

                          {request.product_url && (
                            <a
                              href={
                                request.product_url
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 font-bold"
                            >
                              Product Link
                              <ExternalLink
                                size={16}
                              />
                            </a>
                          )}
                        </div>
                      </div>

                      {request.specifications && (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase text-slate-400">
                            Specifications
                          </p>

                          <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                            {
                              request.specifications
                            }
                          </p>
                        </div>
                      )}

                      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-xl font-black">
                              Supplier & Quotation
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              Enter costs, selling
                              price and choose the
                              customer quotation
                              currency.
                            </p>
                          </div>

                          <div className="rounded-2xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-800">
                            Quotation Currency:{" "}
                            {draft.currency}
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                          <QuoteField
                            label="Supplier Name"
                            value={
                              draft.supplier_name
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "supplier_name",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label="Supplier Contact"
                            value={
                              draft.supplier_contact
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "supplier_contact",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label="Supplier Product URL"
                            value={
                              draft.supplier_product_url
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "supplier_product_url",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label={`Supplier Price (${draft.currency})`}
                            type="number"
                            value={
                              draft.supplier_price
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "supplier_price",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label={`Shipping Cost (${draft.currency})`}
                            type="number"
                            value={
                              draft.shipping_cost
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "shipping_cost",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label={`Customs Cost (${draft.currency})`}
                            type="number"
                            value={
                              draft.customs_cost
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "customs_cost",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label={`Other Costs (${draft.currency})`}
                            type="number"
                            value={
                              draft.other_costs
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "other_costs",
                                value
                              )
                            }
                          />

                          <QuoteField
                            label={`Customer Quoted Price (${draft.currency})`}
                            type="number"
                            value={
                              draft.quoted_price
                            }
                            onChange={(value) =>
                              updateDraft(
                                request.id,
                                "quoted_price",
                                value
                              )
                            }
                          />

                          <CurrencyField
                            value={
                              draft.currency
                            }
                            onChange={(value) =>
                              updateCurrencyDraft(
                                request.id,
                                value
                              )
                            }
                          />

                          <div>
                            <p className="mb-2 font-bold text-slate-700">
                              Profit
                            </p>

                            <div
                              className={`rounded-2xl border px-4 py-3.5 text-xl font-black ${
                                profit === null
                                  ? "border-slate-200 bg-white text-slate-400"
                                  : profit >= 0
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                              }`}
                            >
                              {profit !== null
                                ? `${profit.toLocaleString()} ${draft.currency}`
                                : "—"}
                            </div>
                          </div>
                        </div>

                        <label className="mt-4 block">
                          <span className="mb-2 block font-bold text-slate-700">
                            Admin Notes
                          </span>

                          <textarea
                            rows={4}
                            value={
                              draft.admin_notes
                            }
                            onChange={(event) =>
                              updateDraft(
                                request.id,
                                "admin_notes",
                                event.target.value
                              )
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-700"
                          />
                        </label>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              disabled={
                                savingId ===
                                request.id
                              }
                              onClick={() =>
                                void saveQuotation(
                                  request.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 font-bold text-white transition hover:bg-blue-800 disabled:opacity-60"
                            >
                              {savingId ===
                              request.id ? (
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                              ) : (
                                <Save
                                  size={18}
                                />
                              )}

                              Save Quotation
                            </button>

                            <a
                              href={`/admin/import-requests/${request.id}/edit`}
                              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-5 py-3 font-bold text-white transition hover:bg-amber-600"
                            >
                              <Pencil
                                size={18}
                              />
                              Edit Quotation
                            </a>

                            <a
                              href={`/admin/import-requests/${request.id}/quotation`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                            >
                              <FileText
                                size={18}
                              />
                              View Quotation
                            </a>

                            <button
                              type="button"
                              disabled={
                                sendingId ===
                                request.id
                              }
                              onClick={() =>
                                void sendQuotation(
                                  request
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {sendingId ===
                              request.id ? (
                                <Loader2
                                  size={18}
                                  className="animate-spin"
                                />
                              ) : (
                                <MessageCircle
                                  size={18}
                                />
                              )}

                              Send Quotation
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-500">
                              Status
                            </span>

                            {updatingId ===
                              request.id && (
                              <Loader2
                                size={18}
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
                              onChange={(event) =>
                                void updateStatus(
                                  request.id,
                                  event.target
                                    .value as RequestStatus
                                )
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold"
                            >
                              {statusOptions.map(
                                (status) => (
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
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function QuoteField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        min={
          type === "number"
            ? "0"
            : undefined
        }
        step={
          type === "number"
            ? "0.01"
            : undefined
        }
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function CurrencyField({
  value,
  onChange,
}: {
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-slate-700">
        Quotation Currency
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value as CurrencyCode
          )
        }
        className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 font-bold text-blue-900 outline-none transition focus:border-blue-700 focus:ring-4 focus:ring-blue-100"
      >
        {currencyOptions.map((currency) => (
          <option
            key={currency.value}
            value={currency.value}
          >
            {currency.label}
          </option>
        ))}
      </select>
    </label>
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
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">
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
    new: "bg-blue-100 text-blue-800",
    reviewing:
      "bg-amber-100 text-amber-800",
    quoted:
      "bg-purple-100 text-purple-800",
    ordered:
      "bg-indigo-100 text-indigo-800",
    shipped:
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

function createQuotationWhatsAppUrl(
  request: ImportRequest,
  quotedPrice: number,
  currency: CurrencyCode
) {
  const phone =
    request.customer_phone.replace(
      /\D/g,
      ""
    );

  const quotationNumber = `HN-Q-${String(
    request.id
  ).padStart(5, "0")}`;

  const destination = [
    request.destination_city,
    request.destination_country,
  ]
    .filter(Boolean)
    .join(", ");

  const quotationLink =
    `${window.location.origin}/admin/import-requests/${request.id}/quotation`;

  const unitPrice =
    request.quantity > 0
      ? quotedPrice / request.quantity
      : quotedPrice;

  const message = `
Hello ${request.customer_name},

Thank you for your inquiry.

HEALTH NATIONS
Medical Equipment & Healthcare Solutions

Quotation: ${quotationNumber}

Product: ${request.product_name}
Quantity: ${request.quantity}

Unit Price: ${unitPrice.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  )} ${currency}

Total Quotation: ${quotedPrice.toLocaleString()} ${currency}

Destination: ${destination || "Not specified"}

View Quotation:
${quotationLink}

Please let us know if you would like to proceed with the order.

Health Nations
`.trim();

  return `https://wa.me/${phone}?text=${encodeURIComponent(
    message
  )}`;
}