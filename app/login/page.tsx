"use client";

import { useState } from "react";
import {
  Building2,
  Loader2,
  LockKeyhole,
  Mail,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "abdallahelnomany@gmail.com";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

      if (error) {
        setErrorMessage(
          translateLoginError(error.message)
        );
        return;
      }

      const user = data.user;

      if (!user) {
        setErrorMessage(
          "تعذر تسجيل الدخول. حاول مرة أخرى."
        );
        return;
      }

      const userEmail =
        user.email?.toLowerCase() ?? "";

      if (userEmail === ADMIN_EMAIL) {
        router.replace("/admin/import-requests");
        router.refresh();
        return;
      }

      const {
        data: vendorProfile,
        error: profileError,
      } = await supabase
        .from("vendor_profiles")
        .select("id, account_status")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(
          "تم الدخول، لكن تعذر تحميل بيانات الحساب."
        );
        return;
      }

      if (vendorProfile) {
        router.replace("/vendor/dashboard");
        router.refresh();
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تسجيل الدخول."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim().toLowerCase();

    setErrorMessage("");
    setSuccessMessage("");

    if (!normalizedEmail) {
      setErrorMessage(
        "اكتب البريد الإلكتروني أولًا ثم اضغط نسيت كلمة المرور."
      );
      return;
    }

    setResetLoading(true);

    try {
      const redirectTo =
        `${window.location.origin}/reset-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          normalizedEmail,
          {
            redirectTo,
          }
        );

      if (error) {
        setErrorMessage(
          translateResetError(error.message)
        );
        return;
      }

      setSuccessMessage(
        "تم إرسال رابط تغيير كلمة المرور إلى البريد الإلكتروني. افتح الرسالة واضغط على رابط الاستعادة."
      );
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر إرسال رابط استعادة كلمة المرور."
      );
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 py-12 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-700 to-teal-500 text-white shadow-lg">
            <Store size={29} />
          </div>

          <h1 className="mt-5 text-3xl font-black">
            Login
          </h1>

          <h2 className="mt-2 text-xl font-bold text-blue-700">
            تسجيل الدخول
          </h2>

          <p className="mt-3 leading-7 text-slate-600">
            سجل الدخول للوصول إلى لوحة التحكم الخاصة بحسابك.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-7 shadow-sm"
        >
          <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
              <Mail size={18} />
              Email Address | البريد الإلكتروني
            </span>

            <input
              required
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="form-input"
              placeholder="email@company.com"
              autoComplete="email"
            />
          </label>

          <label className="mt-5 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
              <LockKeyhole size={18} />
              Password | كلمة المرور
            </span>

            <input
              required
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="form-input"
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </label>

          <div className="mt-3 text-right">
            <button
              type="button"
              disabled={resetLoading}
              onClick={() => void handleForgotPassword()}
              className="text-sm font-bold text-blue-700 transition hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetLoading
                ? "Sending reset link..."
                : "Forgot Password? | نسيت كلمة المرور؟"}
            </button>
          </div>

          {errorMessage && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-700">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={20}
                />
                Signing in...
              </>
            ) : (
              "Login | تسجيل الدخول"
            )}
          </button>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">
              ليس لديك حساب مورد؟
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/supplier/register")
              }
              className="mt-3 inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-800"
            >
              <Building2 size={18} />
              Register as Vendor | تسجيل مورد جديد
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.9rem;
          padding: 0.9rem 1rem;
          outline: none;
          background: white;
        }

        .form-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
        }
      `}</style>
    </main>
  );
}

function translateLoginError(
  message: string
) {
  const normalizedMessage =
    message.toLowerCase();

  if (
    normalizedMessage.includes(
      "invalid login credentials"
    ) ||
    normalizedMessage.includes(
      "invalid credentials"
    )
  ) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (
    normalizedMessage.includes(
      "email not confirmed"
    )
  ) {
    return "يجب تأكيد البريد الإلكتروني أولًا قبل تسجيل الدخول.";
  }

  if (
    normalizedMessage.includes(
      "rate limit"
    )
  ) {
    return "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  }

  return message;
}

function translateResetError(
  message: string
) {
  const normalizedMessage =
    message.toLowerCase();

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many")
  ) {
    return "تم إرسال محاولات استعادة كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  }

  if (
    normalizedMessage.includes("invalid email")
  ) {
    return "البريد الإلكتروني غير صحيح.";
  }

  return message;
}