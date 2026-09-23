"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Store,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage(
        "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "كلمتا المرور غير متطابقتين."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "تعذر تغيير كلمة المرور."
      );
    } finally {
      setLoading(false);
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
            Reset Password
          </h1>

          <p className="mt-2 text-lg font-bold text-blue-700">
            تعيين كلمة مرور جديدة
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-7 shadow-sm"
        >
          {success ? (
            <div className="text-center">
              <CheckCircle2
                size={46}
                className="mx-auto text-emerald-600"
              />

              <h2 className="mt-4 text-xl font-black">
                تم تغيير كلمة المرور
              </h2>

              <p className="mt-2 text-slate-600">
                سيتم تحويلك إلى صفحة تسجيل الدخول.
              </p>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <LockKeyhole size={18} />
                  New Password | كلمة المرور الجديدة
                </span>

                <input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  className="form-input"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                />
              </label>

              <label className="mt-5 block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                  <LockKeyhole size={18} />
                  Confirm Password | تأكيد كلمة المرور
                </span>

                <input
                  required
                  minLength={8}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  className="form-input"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                />
              </label>

              {errorMessage && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {errorMessage}
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
                    Updating...
                  </>
                ) : (
                  "Update Password | تغيير كلمة المرور"
                )}
              </button>
            </>
          )}
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
