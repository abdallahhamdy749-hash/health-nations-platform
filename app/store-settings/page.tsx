"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Save,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type VendorProfile = {
  id: string;
  company_name_en: string;
  company_name_ar: string | null;
  store_slug: string | null;
  store_description: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  whatsapp_number: string | null;
  website_url: string | null;
  store_is_active: boolean;
};

type StoreForm = {
  storeSlug: string;
  storeDescription: string;
  whatsappNumber: string;
  websiteUrl: string;
  logoUrl: string;
  coverImageUrl: string;
};

const initialForm: StoreForm = {
  storeSlug: "",
  storeDescription: "",
  whatsappNumber: "",
  websiteUrl: "",
  logoUrl: "",
  coverImageUrl: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export default function VendorStoreSettingsPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<VendorProfile | null>(null);

  const [form, setForm] =
    useState<StoreForm>(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [uploadingCover, setUploadingCover] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const loadStoreSettings = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

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
          website_url,
          store_is_active
        `)
        .eq("id", user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error(
          "Unable to load store settings. Please make sure this account is registered as a vendor."
        );
      }

      const vendorProfile =
        data as VendorProfile;

      setProfile(vendorProfile);

      setForm({
        storeSlug:
          vendorProfile.store_slug ?? "",

        storeDescription:
          vendorProfile.store_description ?? "",

        whatsappNumber:
          vendorProfile.whatsapp_number ?? "",

        websiteUrl:
          vendorProfile.website_url ?? "",

        logoUrl:
          vendorProfile.logo_url ?? "",

        coverImageUrl:
          vendorProfile.cover_image_url ?? "",
      });
    } catch (error: unknown) {
      console.error(
        "Load store settings error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to load store settings."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStoreSettings();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadStoreSettings]);

  function handleInputChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function validateImage(file: File) {
    const acceptedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!acceptedTypes.includes(file.type)) {
      throw new Error(
        "Only JPG, PNG and WebP images are allowed."
      );
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(
        "The image must be smaller than 5 MB."
      );
    }
  }

  async function uploadStoreImage(
    file: File,
    imageType: "logo" | "cover"
  ) {
    validateImage(file);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error(
        "You must be logged in."
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const filePath =
      `${user.id}/${imageType}-${Date.now()}.${extension}`;

    const { error: uploadError } =
      await supabase.storage
        .from("vendor-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("vendor-assets")
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error(
        "The image was uploaded, but its public URL could not be generated."
      );
    }

    return data.publicUrl;
  }

  async function handleLogoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMessage("");
      setSuccessMessage("");

      const publicUrl =
        await uploadStoreImage(
          file,
          "logo"
        );

      setForm((current) => ({
        ...current,
        logoUrl: publicUrl,
      }));

      setSuccessMessage(
        "Logo uploaded successfully. Click Save Store Settings to save it."
      );
    } catch (error: unknown) {
      console.error(
        "Logo upload error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to upload the logo."
        )
      );
    } finally {
      setUploadingLogo(false);
      event.target.value = "";
    }
  }

  async function handleCoverUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploadingCover(true);
      setErrorMessage("");
      setSuccessMessage("");

      const publicUrl =
        await uploadStoreImage(
          file,
          "cover"
        );

      setForm((current) => ({
        ...current,
        coverImageUrl: publicUrl,
      }));

      setSuccessMessage(
        "Cover image uploaded successfully. Click Save Store Settings to save it."
      );
    } catch (error: unknown) {
      console.error(
        "Cover upload error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to upload the cover image."
        )
      );
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
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

      if (userError) {
        throw new Error(
          userError.message
        );
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const normalizedSlug =
        normalizeSlug(form.storeSlug);

      if (!normalizedSlug) {
        throw new Error(
          "Please enter a valid store URL using English letters, numbers or hyphens."
        );
      }

      if (normalizedSlug.length < 3) {
        throw new Error(
          "The store URL must contain at least 3 characters."
        );
      }

      const {
        data: existingStore,
        error: slugCheckError,
      } = await supabase
        .from("vendor_profiles")
        .select("id")
        .eq(
          "store_slug",
          normalizedSlug
        )
        .neq("id", user.id)
        .maybeSingle();

      if (slugCheckError) {
        throw new Error(
          slugCheckError.message
        );
      }

      if (existingStore) {
        throw new Error(
          "This store URL is already being used by another vendor."
        );
      }

      const websiteUrl =
        form.websiteUrl.trim();

      if (
        websiteUrl &&
        !websiteUrl.startsWith(
          "http://"
        ) &&
        !websiteUrl.startsWith(
          "https://"
        )
      ) {
        throw new Error(
          "The website URL must start with http:// or https://."
        );
      }

      const { error } = await supabase
        .from("vendor_profiles")
        .update({
          store_slug:
            normalizedSlug,

          store_description:
            form.storeDescription.trim() ||
            null,

          whatsapp_number:
            form.whatsappNumber.trim() ||
            null,

          website_url:
            websiteUrl || null,

          logo_url:
            form.logoUrl || null,

          cover_image_url:
            form.coverImageUrl || null,

          updated_at:
            new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw new Error(
          error.message
        );
      }

      setForm((current) => ({
        ...current,
        storeSlug: normalizedSlug,
      }));

      setSuccessMessage(
        "Store settings saved successfully."
      );
    } catch (error: unknown) {
      console.error(
        "Save store settings error:",
        error
      );

      setErrorMessage(
        getErrorMessage(
          error,
          "Unable to save store settings."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-blue-700" />

          <span className="font-bold text-slate-700">
            Loading store settings...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/vendor/dashboard"
            )
          }
          className="mb-5 inline-flex items-center gap-2 font-bold text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <header className="overflow-hidden rounded-3xl bg-slate-950 text-white shadow-sm">
          {form.coverImageUrl && (
            <div className="h-52 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  form.coverImageUrl
                }
                alt="Store cover"
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl border border-white/20 bg-white/10">
                  {form.logoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={form.logoUrl}
                        alt="Company logo"
                        className="h-full w-full object-contain"
                      />
                    </>
                  ) : (
                    <Store size={32} />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-blue-300">
                    <Store size={18} />

                    <span className="text-sm font-bold uppercase tracking-wide">
                      Vendor Store
                    </span>
                  </div>

                  <h1 className="mt-2 text-3xl font-black">
                    Store Settings
                  </h1>

                  <p className="mt-2 max-w-2xl leading-7 text-slate-300">
                    Customize your
                    public store,
                    company identity
                    and contact
                    information.
                  </p>
                </div>
              </div>

              {profile && (
                <div className="rounded-2xl bg-white/10 px-5 py-4">
                  <p className="text-sm text-slate-300">
                    Company
                  </p>

                  <strong className="mt-1 block text-lg">
                    {
                      profile.company_name_en
                    }
                  </strong>

                  {profile.company_name_ar && (
                    <span
                      className="mt-1 block text-sm text-slate-300"
                      dir="rtl"
                    >
                      {
                        profile.company_name_ar
                      }
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle
              className="mt-0.5 shrink-0"
              size={20}
            />

            <div>
              <p className="font-bold">
                Something went wrong
              </p>

              <p className="mt-1 text-sm">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">
            <CheckCircle2
              className="mt-0.5 shrink-0"
              size={20}
            />

            <div>
              <p className="font-bold">
                Success
              </p>

              <p className="mt-1 text-sm">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]"
        >
          <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-black text-slate-900">
              Store Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add the public
              information that
              customers will see
              inside your store.
            </p>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Store URL
                </span>

                <div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="flex items-center bg-slate-100 px-4 text-sm text-slate-500">
                    /store/
                  </span>

                  <input
                    type="text"
                    name="storeSlug"
                    value={
                      form.storeSlug
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          storeSlug:
                            normalizeSlug(
                              event
                                .target
                                .value
                            ),
                        })
                      )
                    }
                    placeholder="company-name"
                    className="min-w-0 flex-1 px-4 py-3 outline-none"
                    required
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Use English
                  letters, numbers
                  and hyphens only.
                </p>

                {form.storeSlug && (
                  <p className="mt-2 text-sm font-semibold text-blue-700">
                    Store link:
                    /store/
                    {normalizeSlug(
                      form.storeSlug
                    )}
                  </p>
                )}
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Store Description
                </span>

                <textarea
                  name="storeDescription"
                  value={
                    form.storeDescription
                  }
                  onChange={
                    handleInputChange
                  }
                  rows={7}
                  placeholder="Describe your company, medical products, services and business experience..."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-2 text-right text-xs text-slate-500">
                  {
                    form
                      .storeDescription
                      .length
                  }{" "}
                  characters
                </p>
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    WhatsApp Number
                  </span>

                  <input
                    type="text"
                    name="whatsappNumber"
                    value={
                      form.whatsappNumber
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="+9665XXXXXXXX"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Include the
                    international
                    country code.
                  </p>
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-slate-700">
                    Website
                  </span>

                  <input
                    type="url"
                    name="websiteUrl"
                    value={
                      form.websiteUrl
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="https://example.com"
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Start with
                    https://
                  </p>
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                Company Logo
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Recommended square
                image, at least
                500 × 500 px.
              </p>

              <div className="mt-5 flex min-h-52 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
                {form.logoUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        form.logoUrl
                      }
                      alt="Company logo"
                      className="h-44 w-44 object-contain"
                    />
                  </>
                ) : (
                  <div className="text-center text-slate-500">
                    <ImageIcon
                      className="mx-auto"
                      size={38}
                    />

                    <p className="mt-3 text-sm font-semibold">
                      No logo uploaded
                    </p>
                  </div>
                )}
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-700">
                {uploadingLogo ? (
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <ImageIcon
                    size={18}
                  />
                )}

                {uploadingLogo
                  ? "Uploading..."
                  : "Upload Logo"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleLogoUpload
                  }
                  disabled={
                    uploadingLogo
                  }
                  className="hidden"
                />
              </label>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-black text-slate-900">
                Cover Image
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Recommended wide
                image, at least
                1200 × 400 px.
              </p>

              <div className="mt-5 flex min-h-52 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
                {form.coverImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        form.coverImageUrl
                      }
                      alt="Store cover"
                      className="h-52 w-full object-cover"
                    />
                  </>
                ) : (
                  <div className="text-center text-slate-500">
                    <ImageIcon
                      className="mx-auto"
                      size={38}
                    />

                    <p className="mt-3 text-sm font-semibold">
                      No cover image
                      uploaded
                    </p>
                  </div>
                )}
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-700 transition hover:border-blue-500 hover:text-blue-700">
                {uploadingCover ? (
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
                ) : (
                  <ImageIcon
                    size={18}
                  />
                )}

                {uploadingCover
                  ? "Uploading..."
                  : "Upload Cover"}

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={
                    handleCoverUpload
                  }
                  disabled={
                    uploadingCover
                  }
                  className="hidden"
                />
              </label>
            </div>
          </section>

          <div className="xl:col-span-2">
            <button
              type="submit"
              disabled={
                saving ||
                uploadingLogo ||
                uploadingCover
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2
                  className="animate-spin"
                  size={20}
                />
              ) : (
                <Save size={20} />
              )}

              {saving
                ? "Saving Store..."
                : "Save Store Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
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