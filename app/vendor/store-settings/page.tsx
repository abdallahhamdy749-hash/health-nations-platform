"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  Save,
  Store,
} from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VendorProfile = {
  id: string;
  company_name_en: string | null;
  company_name_ar: string | null;
  store_slug: string | null;
  store_description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  whatsapp_number: string | null;
  account_status: string | null;
  can_publish_products: boolean | null;
};

type FormState = {
  storeSlug: string;
  storeDescription: string;
  logoUrl: string;
  coverImageUrl: string;
  whatsappNumber: string;
};

const initialForm: FormState = {
  storeSlug: "",
  storeDescription: "",
  logoUrl: "",
  coverImageUrl: "",
  whatsappNumber: "",
};

function getErrorMessage(error: unknown) {
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

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function VendorStoreSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] =
    useState<VendorProfile | null>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("vendor_profiles")
        .select(`
          id,
          company_name_en,
          company_name_ar,
          store_slug,
          store_description,
          logo_url,
          cover_image_url,
          whatsapp_number,
          account_status,
          can_publish_products
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          "Vendor profile was not found."
        );
      }

      const vendor =
        data as VendorProfile;

      setProfile(vendor);

      setForm({
        storeSlug:
          vendor.store_slug ?? "",
        storeDescription:
          vendor.store_description ?? "",
        logoUrl:
          vendor.logo_url ?? "",
        coverImageUrl:
          vendor.cover_image_url ?? "",
        whatsappNumber:
          vendor.whatsapp_number ?? "",
      });
    } catch (error: unknown) {
      console.error(
        "Store settings loading error:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadProfile]);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  async function handleSave(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const cleanSlug =
        normalizeSlug(form.storeSlug);

      if (!cleanSlug) {
        throw new Error(
          "Please enter a valid store URL."
        );
      }

      /*
       * Check that another vendor
       * is not already using this slug.
       */
      const {
        data: existingSlug,
        error: slugError,
      } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq("store_slug", cleanSlug)
        .neq("id", user.id)
        .maybeSingle();

      if (slugError) {
        throw slugError;
      }

      if (existingSlug) {
        throw new Error(
          "This store URL is already being used by another vendor."
        );
      }

      const {
        data: updatedProfile,
        error: updateError,
      } = await supabase
        .from("vendor_profiles")
        .update({
          store_slug: cleanSlug,
          store_description:
            form.storeDescription.trim() ||
            null,
          logo_url:
            form.logoUrl.trim() ||
            null,
          cover_image_url:
            form.coverImageUrl.trim() ||
            null,
          whatsapp_number:
            form.whatsappNumber.trim() ||
            null,
        })
        .eq("id", user.id)
        .select(`
          id,
          company_name_en,
          company_name_ar,
          store_slug,
          store_description,
          logo_url,
          cover_image_url,
          whatsapp_number,
          account_status,
          can_publish_products
        `)
        .single();

      if (updateError) {
        throw updateError;
      }

      const vendor =
        updatedProfile as VendorProfile;

      setProfile(vendor);

      setForm({
        storeSlug:
          vendor.store_slug ?? "",
        storeDescription:
          vendor.store_description ?? "",
        logoUrl:
          vendor.logo_url ?? "",
        coverImageUrl:
          vendor.cover_image_url ?? "",
        whatsappNumber:
          vendor.whatsapp_number ?? "",
      });

      setSuccessMessage(
        "تم حفظ إعدادات المتجر بنجاح."
      );
    } catch (error: unknown) {
      console.error(
        "Store settings save error:",
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl bg-white px-8 py-7 text-center shadow-sm">
          <Loader2
            size={34}
            className="mx-auto animate-spin text-blue-700"
          />

          <p className="mt-4 font-bold text-slate-600">
            Loading store settings...
          </p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-sm">
          <Building2
            size={40}
            className="mx-auto text-red-600"
          />

          <h1 className="mt-4 text-2xl font-black">
            Store settings unavailable
          </h1>

          <p className="mt-3 text-slate-600">
            {errorMessage ||
              "Vendor profile was not found."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/vendor/dashboard"
              )
            }
            className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-bold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const storeUrl =
    form.storeSlug.trim()
      ? `/store/${normalizeSlug(
          form.storeSlug
        )}`
      : "";

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[32px] bg-slate-950 p-7 text-white md:p-9">
          <button
            type="button"
            onClick={() =>
              router.push(
                "/vendor/dashboard"
              )
            }
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Vendor Dashboard
          </button>

          <div className="mt-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-teal-300">
                <Store size={20} />

                <span className="text-sm font-black uppercase tracking-wide">
                  Health Nations Vendor
                </span>
              </div>

              <h1 className="mt-3 text-3xl font-black">
                Store Settings
              </h1>

              <p className="mt-2 text-slate-300">
                إعداد وتحديث بيانات متجرك
                على Health Nations.
              </p>
            </div>

            <div
              className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
                profile.account_status ===
                "approved"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              }`}
            >
              {profile.account_status ===
              "approved"
                ? "Approved Vendor"
                : "Pending Review"}
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-bold text-emerald-700">
            <CheckCircle2 size={20} />
            {successMessage}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="mt-6 space-y-6"
        >
          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Globe2 size={22} />
              </div>

              <div>
                <h2 className="text-xl font-black">
                  Public Store
                </h2>

                <p className="text-sm text-slate-500">
                  إعداد رابط وصفحة المتجر
                  العامة.
                </p>
              </div>
            </div>

            <div className="mt-7">
              <label className="block text-sm font-black text-slate-700">
                Store URL *
              </label>

              <div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-blue-500">
                <span className="flex items-center bg-slate-50 px-4 text-sm text-slate-500">
                  /store/
                </span>

                <input
                  type="text"
                  value={form.storeSlug}
                  onChange={(event) =>
                    updateField(
                      "storeSlug",
                      event.target.value
                    )
                  }
                  placeholder="company-name"
                  className="min-w-0 flex-1 px-4 py-3.5 outline-none"
                  required
                />
              </div>

              {storeUrl && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(storeUrl)
                  }
                  className="mt-2 text-left text-xs font-bold text-blue-700 transition hover:text-blue-900 hover:underline"
                >
                  {storeUrl}
                </button>
              )}
            </div>

            <div className="mt-6">
              <label className="block text-sm font-black text-slate-700">
                Store Description
              </label>

              <textarea
                value={
                  form.storeDescription
                }
                onChange={(event) =>
                  updateField(
                    "storeDescription",
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Tell customers about your company and products..."
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-500"
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-black">
              Branding
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Logo and cover image URLs.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field
                label="Company Logo URL"
                value={form.logoUrl}
                placeholder="https://..."
                onChange={(value) =>
                  updateField(
                    "logoUrl",
                    value
                  )
                }
              />

              <Field
                label="Cover Image URL"
                value={
                  form.coverImageUrl
                }
                placeholder="https://..."
                onChange={(value) =>
                  updateField(
                    "coverImageUrl",
                    value
                  )
                }
              />
            </div>

            {(form.logoUrl ||
              form.coverImageUrl) && (
              <div className="mt-6 grid gap-5 md:grid-cols-2">
                {form.logoUrl && (
                  <ImagePreview
                    label="Logo Preview"
                    src={form.logoUrl}
                  />
                )}

                {form.coverImageUrl && (
                  <ImagePreview
                    label="Cover Preview"
                    src={
                      form.coverImageUrl
                    }
                  />
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm md:p-8">
            <h2 className="text-xl font-black">
              Contact
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              بيانات التواصل الخاصة
              بالمتجر. ظهور وسائل التواصل
              للعامة يعتمد على سياسة
              Health Nations.
            </p>

            <div className="mt-6">
              <Field
                label="WhatsApp Number"
                value={
                  form.whatsappNumber
                }
                placeholder="+966..."
                onChange={(value) =>
                  updateField(
                    "whatsappNumber",
                    value
                  )
                }
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/vendor/dashboard"
                )
              }
              className="rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-7 py-3.5 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save size={18} />
              )}

              {saving
                ? "Saving..."
                : "Save Store Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700">
        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3.5 outline-none transition focus:border-blue-500"
      />
    </div>
  );
}

function ImagePreview({
  label,
  src,
}: {
  label: string;
  src: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-600">
        {label}
      </div>

      <div className="flex h-44 items-center justify-center bg-slate-50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={label}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </div>
  );
}