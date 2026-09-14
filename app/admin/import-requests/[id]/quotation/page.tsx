"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Quotation = {
  id: number;
  product_name: string;
  quantity: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  destination_country: string;
  destination_city: string | null;
  specifications: string | null;
  currency: string;
  quoted_price: number | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
  quotation_sent_at: string | null;
};

export default function QuotationPage() {
  const router = useRouter();

  const params = useParams<{
    id: string;
  }>();

  const id = params.id;

  const [quotation, setQuotation] =
    useState<Quotation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadQuotation = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const numericId = Number(id);

        if (
          !Number.isInteger(numericId)
        ) {
          throw new Error(
            "Invalid quotation ID."
          );
        }

        const {
          data,
          error: quotationError,
        } = await supabase
          .from("import_requests")
          .select(`
            id,
            product_name,
            quantity,
            customer_name,
            customer_email,
            customer_phone,
            destination_country,
            destination_city,
            specifications,
            currency,
            quoted_price,
            status,
            created_at,
            updated_at,
            quotation_sent_at
          `)
          .eq("id", numericId)
          .maybeSingle();

        if (quotationError) {
          throw new Error(
            `${quotationError.message}${
              quotationError.code
                ? ` — Code: ${quotationError.code}`
                : ""
            }`
          );
        }

        if (!data) {
          throw new Error(
            "Quotation not found."
          );
        }

        setQuotation(
          data as Quotation
        );
      } catch (error: unknown) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load quotation."
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        void loadQuotation();
      }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [id, loadQuotation]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 font-bold text-slate-600 shadow-sm">
          <Loader2 className="animate-spin text-blue-700" />

          Loading quotation...
        </div>
      </main>
    );
  }

  if (error || !quotation) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-center gap-3">
            <AlertCircle size={22} />

            <span>
              {error ||
                "Quotation not found."}
            </span>
          </div>
        </div>
      </main>
    );
  }

  const quotationNumber =
    `HN-Q-${String(
      quotation.id
    ).padStart(5, "0")}`;

  const currency =
    quotation.currency
      ?.trim()
      .toUpperCase() || "SAR";

  const totalPrice =
    quotation.quoted_price !== null
      ? Number(
          quotation.quoted_price
        )
      : null;

  const unitPrice =
    totalPrice !== null &&
    quotation.quantity > 0
      ? totalPrice /
        quotation.quantity
      : null;

  const quotationDate =
    quotation.updated_at ||
    quotation.quotation_sent_at ||
    quotation.created_at;

  const destination = [
    quotation.destination_city,
    quotation.destination_country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-4xl flex-wrap justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={() =>
            router.back()
          }
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/import-requests/${quotation.id}/edit`
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 font-bold text-white transition hover:bg-amber-600"
          >
            <Pencil size={18} />
            Edit Quotation
          </button>

          <button
            type="button"
            onClick={() =>
              void loadQuotation()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-bold shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              window.print()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2 font-bold text-white transition hover:bg-blue-800"
          >
            <Printer size={18} />
            Print / Save PDF
          </button>
        </div>
      </div>

      {totalPrice === null && (
        <div className="mx-auto mb-5 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 print:hidden">
          <strong>
            Quotation price has not
            been saved yet.
          </strong>{" "}
          Open Edit Quotation, enter
          the Customer Quoted Price
          and save the changes.
        </div>
      )}

      <section className="mx-auto max-w-4xl bg-white p-10 shadow-sm print:max-w-none print:p-8 print:shadow-none">
        <header className="flex items-start justify-between gap-8 border-b-4 border-blue-800 pb-7">
          <div>
            <h1 className="text-3xl font-black tracking-wide text-blue-900">
              HEALTH NATIONS
            </h1>

            <p className="mt-1 font-bold text-slate-500">
              Medical Equipment &
              Healthcare Solutions
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Riyadh, Saudi Arabia
              <br />
              Global Medical Sourcing
              & Supply
            </p>
          </div>

          <div className="text-right">
            <h2 className="text-3xl font-black">
              QUOTATION
            </h2>

            <p className="mt-2 font-black text-blue-800">
              {quotationNumber}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {new Date(
                quotationDate
              ).toLocaleDateString()}
            </p>
          </div>
        </header>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Quotation For
            </p>

            <h3 className="mt-2 text-xl font-black">
              {
                quotation.customer_name
              }
            </h3>

            <p className="mt-2 text-slate-600">
              {
                quotation.customer_phone
              }
            </p>

            {quotation.customer_email && (
              <p className="text-slate-600">
                {
                  quotation.customer_email
                }
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Destination
            </p>

            <p className="mt-2 font-bold">
              {destination ||
                "Not specified"}
            </p>

            <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
              Request Number
            </p>

            <p className="mt-2 font-bold">
              #{quotation.id}
            </p>

            <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-400">
              Currency
            </p>

            <p className="mt-2 font-bold text-blue-800">
              {currency}
            </p>
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="p-4 text-left">
                  Product
                </th>

                <th className="p-4 text-center">
                  Qty
                </th>

                <th className="p-4 text-right">
                  Unit Price
                </th>

                <th className="p-4 text-right">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="align-top">
                <td className="p-5">
                  <p className="font-black">
                    {
                      quotation.product_name
                    }
                  </p>

                  {quotation.specifications && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                      {
                        quotation.specifications
                      }
                    </p>
                  )}
                </td>

                <td className="p-5 text-center font-bold">
                  {
                    quotation.quantity
                  }
                </td>

                <td className="p-5 text-right font-bold">
                  {unitPrice !== null
                    ? unitPrice.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits:
                            2,
                        }
                      )
                    : "—"}{" "}
                  {currency}
                </td>

                <td className="p-5 text-right text-lg font-black">
                  {totalPrice !== null
                    ? totalPrice.toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits:
                            2,
                        }
                      )
                    : "—"}{" "}
                  {currency}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="ml-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between gap-6">
            <span className="font-bold text-slate-500">
              Total Quotation
            </span>

            <span className="text-2xl font-black text-blue-900">
              {totalPrice !== null
                ? totalPrice.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits:
                        2,
                    }
                  )
                : "—"}{" "}
              {currency}
            </span>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <h3 className="text-lg font-black">
            Terms & Conditions
          </h3>

          <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
            <p>
              • Product availability is
              subject to final
              confirmation.
            </p>

            <p>
              • Delivery schedule will
              be confirmed after order
              approval.
            </p>

            <p>
              • Import, sourcing and
              shipping arrangements are
              subject to final order
              terms.
            </p>

            <p>
              • This quotation is valid
              subject to Health Nations
              commercial terms.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-slate-200 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-sm font-bold text-slate-500">
              Prepared By
            </p>

            <p className="mt-2 font-black">
              Health Nations
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-bold text-slate-500">
              Customer Approval
            </p>

            <div className="ml-auto mt-10 w-48 border-t border-slate-400 pt-2 text-center text-xs text-slate-400">
              Signature
            </div>
          </div>
        </div>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
          Health Nations — Medical
          Equipment & Healthcare
          Solutions
        </footer>
      </section>
    </main>
  );
}