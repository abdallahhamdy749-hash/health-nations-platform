"use client";

import { FormEvent, useState } from "react";

export default function AIConsultantPage() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) return;

    setLoading(true);
    setReply("");

    try {
      const response = await fetch("/api/ai-consultant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "حدث خطأ غير معروف");
      }

      setReply(data.reply);
    } catch (error) {
      console.error(error);
      setReply("حدث خطأ أثناء الاتصال بالمساعد الذكي.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-slate-100 px-4 py-12 text-slate-900"
    >
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl md:p-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-900">
            المستشار الطبي الذكي
          </h1>

          <p className="mt-3 text-slate-600">
            اسأل عن جهاز طبي أو منتج أو اكتب استفسارك الصحي العام
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="مثال: أبحث عن جهاز علاج طبيعي مناسب للعيادة..."
            className="min-h-40 w-full resize-none rounded-2xl border border-slate-300 p-4 outline-none focus:border-blue-600"
          />

          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="w-full rounded-2xl bg-blue-700 px-6 py-4 font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "جاري تجهيز الرد..." : "إرسال"}
          </button>
        </form>

        {reply && (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <h2 className="mb-3 font-bold text-blue-900">رد المساعد:</h2>

            <p className="whitespace-pre-wrap leading-8 text-slate-800">
              {reply}
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          المعلومات الصحية المقدمة إرشادية عامة ولا تغني عن تقييم الطبيب أو
          الصيدلي.
        </p>
      </section>
    </main>
  );
}