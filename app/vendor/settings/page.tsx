"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Loader2,
  LockKeyhole,
  Mail,
  Settings,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type VendorProfile = {
  id: string;
  company_name_en: string | null;
  company_name_ar: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  account_status: string | null;
  is_verified: boolean | null;
};

export default function VendorSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadSettings() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const { data, error } = await supabase
          .from("vendor_profiles")
          .select(
            "id, company_name_en, company_name_ar, contact_name, email, phone, account_status, is_verified"
          )
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setProfile(data as VendorProfile);
      } catch (error) {
        console.error("Vendor settings error:", error);
        setErrorMessage("Unable to load account settings.");
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2
            size={36}
            className="mx-auto animate-spin text-blue-700"
          />
          <p className="mt-4 font-bold text-slate-500">
            Loading settings...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-900 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[32px] bg-slate-950 p-7 text-white md:p-9">
          <button
            type="button"
            onClick={() => router.push("/vendor/dashboard")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Vendor Dashboard
          </button>

          <div className="mt-7 flex items-center gap-4">
            <div className="rounded-2xl bg-slate-700 p-4">
              <Settings size={28} />
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-300">
                Health Nations Vendor
              </p>

              <h1 className="mt-1 text-3xl font-black">
                Account Settings
              </h1>

              <p className="mt-1 text-slate-300">
                Manage your vendor account and marketplace settings.
              </p>
            </div>
          </div>
        </header>

        {errorMessage && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <Building2 size={22} />
              </div>

              <div>
                <h2 className="font-black">
                  Company Account
                </h2>
                <p className="text-sm text-slate-500">
                  Vendor registration information
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <Info
                icon={<Building2 size={17} />}
                label="Company"
                value={
                  profile?.company_name_en ||
                  profile?.company_name_ar ||
                  "—"
                }
              />

              <Info
                icon={<UserRound size={17} />}
                label="Contact Person"
                value={profile?.contact_name || "—"}
              />

              <Info
                icon={<Mail size={17} />}
                label="Email"
                value={profile?.email || "—"}
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h2 className="font-black">
                  Account Status
                </h2>
                <p className="text-sm text-slate-500">
                  Health Nations verification
                </p>
              </div>
            </div>

            <div className="mt-6">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${
                  profile?.account_status === "approved"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {profile?.account_status === "approved"
                  ? "Approved Vendor"
                  : "Pending Review"}
              </span>

              <p className="mt-5 text-sm font-semibold leading-6 text-slate-500">
                Account verification and publishing permissions are managed
                by Health Nations administration.
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">
            Marketplace Settings
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/vendor/store-settings")}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <Store className="text-blue-700" />

              <div>
                <p className="font-black">
                  Store Settings
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Logo, description and public store information
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled
              className="flex items-center gap-4 rounded-2xl border border-slate-200 p-5 text-left opacity-60"
            >
              <LockKeyhole className="text-slate-600" />

              <div>
                <p className="font-black">
                  Security
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Additional security controls coming later
                </p>
              </div>
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="font-black text-red-700">
            Sign Out
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign out from your Health Nations vendor account on this device.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 rounded-2xl bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-700"
          >
            Sign Out
          </button>
        </section>
      </div>
    </main>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 text-slate-400">
        {icon}
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-1 font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}
