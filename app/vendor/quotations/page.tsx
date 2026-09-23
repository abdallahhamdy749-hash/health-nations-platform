"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type VendorQuotation = {
  id: string;
  quotation_number: string;
  vendor_id: string;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  total_amount: number | null;
  currency: string;
  status: string;
  vendor_notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

type QuotationDraft = {
  unitPrice: string;
  vendorNotes: string;
};

export default function VendorQuotationsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [quotations, setQuotations] = useState<VendorQuotation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, QuotationDraft>>({});

  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadQuotations = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("vendor_quotations")
          .select(
            `
              id,
              quotation_number,
              vendor_id,
              product_id,
              product_name,
              quantity,
              unit_price,
              total_amount,
              currency,
              status,
              vendor_notes,
              admin_notes,
              created_at,
              updated_at
            `
          )
          .eq("vendor_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const rows = (data ?? []) as VendorQuotation[];

        setQuotations(rows);

        setDrafts((currentDrafts) => {
          const nextDrafts: Record<string, QuotationDraft> = {};

          for (const quotation of rows) {
            nextDrafts[quotation.id] = {
              unitPrice:
                currentDrafts[quotation.id]?.unitPrice ??
                (quotation.unit_price !== null
                  ? String(quotation.unit_price)
                  : ""),
              vendorNotes:
                currentDrafts[quotation.id]?.vendorNotes ??
                quotation.vendor_notes ??
                "",
            };
          }

          return nextDrafts;
        });
      } catch (error) {
        console.error("Failed to load vendor quotations:", error);

        setQuotations([]);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load quotations."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void loadQuotations();
  }, [loadQuotations]);

  function formatMoney(amount: number | null, currency: string) {
    if (amount === null || amount === undefined) {
      return "—";
    }

    return `${Number(amount).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })} ${currency || ""}`.trim();
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  function statusClasses(status: string) {
    switch ((status || "").toLowerCase()) {
      case "submitted":
        return "border-blue-200 bg-blue-50 text-blue-700";

      case "accepted":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";

      case "rejected":
        return "border-red-200 bg-red-50 text-red-700";

      case "expired":
        return "border-slate-200 bg-slate-100 text-slate-600";

      case "pending":
      default:
        return "border-amber-200 bg-amber-50 text-amber-700";
    }
  }

  function updateUnitPrice(quotationId: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [quotationId]: {
        unitPrice: value,
        vendorNotes: current[quotationId]?.vendorNotes ?? "",
      },
    }));
  }

  function updateVendorNotes(quotationId: string, value: string) {
    setDrafts((current) => ({
      ...current,
      [quotationId]: {
        unitPrice: current[quotationId]?.unitPrice ?? "",
        vendorNotes: value,
      },
    }));
  }

  function calculateDraftTotal(quotation: VendorQuotation) {
    const unitPrice = Number(drafts[quotation.id]?.unitPrice ?? "");

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return null;
    }

    return unitPrice * quotation.quantity;
  }

  async function submitQuotation(quotation: VendorQuotation) {
    setErrorMessage("");
    setSuccessMessage("");

    const draft = drafts[quotation.id];

    const unitPrice = Number(draft?.unitPrice ?? "");

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setErrorMessage("Please enter a valid unit price greater than zero.");
      return;
    }

    const confirmed = window.confirm(
      `Submit quotation ${quotation.quotation_number}?\n\n` +
        `Unit Price: ${formatMoney(unitPrice, quotation.currency)}\n` +
        `Quantity: ${quotation.quantity}\n` +
        `Total: ${formatMoney(
          unitPrice * quotation.quantity,
          quotation.currency
        )}\n\n` +
        `After submission, this quotation will be locked.`
    );

    if (!confirmed) {
      return;
    }

    setSubmittingId(quotation.id);

    try {
      const { data, error } = await supabase.rpc(
        "submit_vendor_quotation",
        {
          p_quotation_id: quotation.id,
          p_unit_price: unitPrice,
          p_vendor_notes: draft?.vendorNotes?.trim() || null,
        }
      );

      if (error) {
        throw error;
      }

      let updatedQuotation: VendorQuotation | null = null;

      if (Array.isArray(data)) {
        updatedQuotation =
          data.length > 0 ? (data[0] as VendorQuotation) : null;
      } else if (data) {
        updatedQuotation = data as VendorQuotation;
      }

      if (updatedQuotation) {
        setQuotations((current) =>
          current.map((item) =>
            item.id === quotation.id ? updatedQuotation! : item
          )
        );
      } else {
        await loadQuotations(true);
      }

      setSuccessMessage(
        `Quotation ${quotation.quotation_number} submitted successfully.`
      );
    } catch (error) {
      console.error("Failed to submit quotation:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit quotation."
      );
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading quotations...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/vendor/dashboard")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Vendor Dashboard
        </button>

        <section className="overflow-hidden rounded-[30px] bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-950/30">
                <FileText className="h-8 w-8" />
              </div>

              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Health Nations Vendor
                </p>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Quotations
                </h1>

                <p className="mt-1 text-sm text-slate-300">
                  Review and submit quotation requests assigned to your company.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadQuotations(true)}
              disabled={refreshing || submittingId !== null}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>
          </div>
        </section>

        {errorMessage ? (
          <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700">
            <p className="font-bold">Something went wrong</p>
            <p className="mt-1">{errorMessage}</p>
          </section>
        ) : null}

        {successMessage ? (
          <section className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-bold">Quotation submitted</p>
              <p className="mt-1 text-sm">{successMessage}</p>
            </div>
          </section>
        ) : null}

        {!errorMessage && quotations.length === 0 ? (
          <section className="mt-8 rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <FileText className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-900">
              No quotation requests yet
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Requests for quotations assigned to your company by Health
              Nations will appear here.
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Health Nations manages customer relationships. Customer contact
              information remains private.
            </p>

            <button
              type="button"
              onClick={() => router.push("/vendor/products")}
              className="mt-7 rounded-xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              View My Products
            </button>
          </section>
        ) : null}

        {quotations.length > 0 ? (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-2xl font-black text-slate-900">
                Your Quotations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {quotations.length}{" "}
                {quotations.length === 1
                  ? "quotation"
                  : "quotations"}
              </p>
            </div>

            <div className="space-y-5">
              {quotations.map((quotation) => {
                const isPending =
                  (quotation.status || "").toLowerCase() === "pending";

                const isSubmitting =
                  submittingId === quotation.id;

                const draftTotal =
                  calculateDraftTotal(quotation);

                return (
                  <article
                    key={quotation.id}
                    className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Quotation Number
                          </p>

                          <h3 className="mt-1 text-lg font-black text-slate-900">
                            {quotation.quotation_number}
                          </h3>
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold capitalize ${statusClasses(
                            quotation.status
                          )}`}
                        >
                          {quotation.status || "pending"}
                        </span>
                      </div>

                      <div className="grid gap-5 border-y border-slate-100 py-5 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Product
                          </p>

                          <p className="mt-2 font-bold text-slate-900">
                            {quotation.product_name || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Quantity
                          </p>

                          <p className="mt-2 font-bold text-slate-900">
                            {quotation.quantity}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Unit Price
                          </p>

                          <p className="mt-2 font-bold text-slate-900">
                            {formatMoney(
                              quotation.unit_price,
                              quotation.currency
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Total
                          </p>

                          <p className="mt-2 text-lg font-black text-emerald-700">
                            {formatMoney(
                              quotation.total_amount,
                              quotation.currency
                            )}
                          </p>
                        </div>
                      </div>

                      {quotation.admin_notes ? (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Health Nations Notes
                          </p>

                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {quotation.admin_notes}
                          </p>
                        </div>
                      ) : null}

                      {isPending ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
                          <div className="mb-5">
                            <h4 className="text-lg font-black text-slate-900">
                              Prepare Your Quotation
                            </h4>

                            <p className="mt-1 text-sm text-slate-500">
                              Enter your unit price and optional notes before
                              submitting.
                            </p>
                          </div>

                          <div className="grid gap-5 lg:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-bold text-slate-700">
                                Unit Price ({quotation.currency})
                              </label>

                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                inputMode="decimal"
                                value={
                                  drafts[quotation.id]?.unitPrice ?? ""
                                }
                                onChange={(event) =>
                                  updateUnitPrice(
                                    quotation.id,
                                    event.target.value
                                  )
                                }
                                placeholder="Enter unit price"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                              />
                            </div>

                            <div>
                              <p className="mb-2 text-sm font-bold text-slate-700">
                                Quotation Total
                              </p>

                              <div className="flex min-h-[50px] items-center rounded-xl border border-emerald-200 bg-white px-4 py-3">
                                <span className="text-xl font-black text-emerald-700">
                                  {formatMoney(
                                    draftTotal,
                                    quotation.currency
                                  )}
                                </span>
                              </div>

                              <p className="mt-2 text-xs text-slate-500">
                                {quotation.quantity} × unit price
                              </p>
                            </div>
                          </div>

                          <div className="mt-5">
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Vendor Notes
                            </label>

                            <textarea
                              rows={4}
                              value={
                                drafts[quotation.id]?.vendorNotes ?? ""
                              }
                              onChange={(event) =>
                                updateVendorNotes(
                                  quotation.id,
                                  event.target.value
                                )
                              }
                              placeholder="Delivery time, warranty, availability, shipping terms, or other notes..."
                              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                            />
                          </div>

                          <div className="mt-5 flex flex-col gap-4 border-t border-emerald-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              Customer information remains private.
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                void submitQuotation(quotation)
                              }
                              disabled={
                                isSubmitting ||
                                draftTotal === null
                              }
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4" />
                                  Submit Quotation
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

                            <div>
                              <p className="font-bold text-slate-900">
                                Quotation submitted
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                This quotation is now managed through Health
                                Nations.
                              </p>

                              {quotation.vendor_notes ? (
                                <div className="mt-4">
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Vendor Notes
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-slate-700">
                                    {quotation.vendor_notes}
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Created
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {formatDate(quotation.created_at)}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          Managed through Health Nations
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}