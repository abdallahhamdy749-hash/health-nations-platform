"use client";

import Link from "next/link";
import { useState } from "react";

import {
  Activity,
  ArrowRight,
  Baby,
  Bandage,
  HeartPulse,
  Home,
  Languages,
  Microscope,
  Phone,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserRoundCheck,
} from "lucide-react";

type Language = "en" | "ar";

type HomeCareService = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: React.ReactNode;
};

const services: HomeCareService[] = [
  {
    titleEn: "Home Nursing",
    titleAr: "التمريض المنزلي",
    descriptionEn:
      "Professional nursing visits for injections, vital signs, medication support and routine care.",
    descriptionAr:
      "زيارات تمريض منزلية للحقن وقياس العلامات الحيوية ومتابعة الأدوية والرعاية اليومية.",
    icon: <Stethoscope size={26} />,
  },
  {
    titleEn: "Home Physiotherapy",
    titleAr: "العلاج الطبيعي المنزلي",
    descriptionEn:
      "Home rehabilitation for stroke, back pain, post-operative recovery and mobility problems.",
    descriptionAr:
      "جلسات علاج طبيعي وتأهيل منزلي لحالات الجلطات وآلام الظهر وما بعد العمليات ومشكلات الحركة.",
    icon: <Activity size={26} />,
  },
  {
    titleEn: "Wound Care",
    titleAr: "العناية بالجروح",
    descriptionEn:
      "Wound assessment, dressing changes and follow-up for surgical and chronic wounds.",
    descriptionAr:
      "تقييم الجروح وتغيير الضمادات ومتابعة الجروح الجراحية والمزمنة.",
    icon: <Bandage size={26} />,
  },
  {
    titleEn: "Elderly Care",
    titleAr: "رعاية كبار السن",
    descriptionEn:
      "Support for elderly patients including daily care, monitoring and assistance at home.",
    descriptionAr:
      "رعاية ومتابعة كبار السن داخل المنزل مع المساعدة في الاحتياجات اليومية.",
    icon: <UserRoundCheck size={26} />,
  },
  {
    titleEn: "Home Injections",
    titleAr: "الحقن المنزلية",
    descriptionEn:
      "Qualified healthcare staff for prescribed injections and treatment administration at home.",
    descriptionAr:
      "توفير مختصين لإعطاء الحقن والعلاجات الموصوفة داخل المنزل.",
    icon: <Syringe size={26} />,
  },
  {
    titleEn: "Home Lab Samples",
    titleAr: "سحب عينات منزلية",
    descriptionEn:
      "Convenient home sample collection for supported laboratory tests.",
    descriptionAr:
      "سحب عينات التحاليل من المنزل وإرسالها للمعامل المتعاقدة.",
    icon: <Microscope size={26} />,
  },
  {
    titleEn: "Post-Operative Care",
    titleAr: "رعاية ما بعد العمليات",
    descriptionEn:
      "Follow-up support after surgery, including wound care, mobility and vital sign monitoring.",
    descriptionAr:
      "متابعة ما بعد العمليات وتشمل الجروح والحركة وقياس العلامات الحيوية.",
    icon: <ShieldCheck size={26} />,
  },
  {
    titleEn: "Mother & Baby Care",
    titleAr: "رعاية الأم والطفل",
    descriptionEn:
      "Home support for mothers and babies with basic nursing and follow-up services.",
    descriptionAr:
      "رعاية منزلية للأم والطفل مع المتابعة والتمريض الأساسي.",
    icon: <Baby size={26} />,
  },
];

export default function HomeCarePage() {
  const [language, setLanguage] =
    useState<Language>("en");

  const isArabic =
    language === "ar";

  const t = {
    en: {
      company: "Health Nations Home Care",
      eyebrow: "Professional Home Healthcare",
      title:
        "Healthcare Services Delivered to Your Home",
      description:
        "Book trusted home nursing, physiotherapy, wound care, elderly care and other healthcare services with Health Nations.",
      request: "Request Home Care",
      whatsapp: "WhatsApp",
      servicesTitle:
        "Our Home Care Services",
      servicesDescription:
        "Choose the service you need and submit a home visit request.",
      whyTitle:
        "Why Health Nations Home Care?",
      why1:
        "Qualified healthcare professionals",
      why2:
        "Flexible home visit scheduling",
      why3:
        "Support for multiple healthcare services",
      why4:
        "Simple booking and follow-up",
      ctaTitle:
        "Need a Healthcare Professional at Home?",
      ctaDescription:
        "Submit your request and our team will review the service, location and preferred visit time.",
      bookNow:
        "Book Home Visit",
      backHome:
        "Back to Main Platform",
    },

    ar: {
      company:
        "صحة الأمم للرعاية المنزلية",
      eyebrow:
        "خدمات رعاية صحية منزلية",
      title:
        "الرعاية الصحية تصل إليك في المنزل",
      description:
        "احجز خدمات التمريض والعلاج الطبيعي والعناية بالجروح ورعاية كبار السن وغيرها من الخدمات الصحية المنزلية من خلال صحة الأمم.",
      request:
        "اطلب خدمة منزلية",
      whatsapp: "واتساب",
      servicesTitle:
        "خدمات الرعاية المنزلية",
      servicesDescription:
        "اختر الخدمة التي تحتاجها وقدّم طلب زيارة منزلية.",
      whyTitle:
        "لماذا صحة الأمم للرعاية المنزلية؟",
      why1:
        "مختصون صحيون مؤهلون",
      why2:
        "مواعيد زيارات مرنة",
      why3:
        "خدمات صحية متعددة",
      why4:
        "حجز ومتابعة بسهولة",
      ctaTitle:
        "تحتاج مختصًا صحيًا في المنزل؟",
      ctaDescription:
        "أرسل طلبك وسيقوم فريقنا بمراجعة نوع الخدمة والموقع وموعد الزيارة المناسب.",
      bookNow:
        "احجز زيارة منزلية",
      backHome:
        "العودة للمنصة الرئيسية",
    },
  }[language];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-500 text-white shadow-lg">
              <HeartPulse size={26} />
            </div>

            <div>
              <strong className="block text-lg font-black text-slate-900">
                {t.company}
              </strong>

              <span className="text-xs text-slate-500">
                Health Nations Medical
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() =>
              setLanguage(
                isArabic
                  ? "en"
                  : "ar"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold transition hover:border-blue-700 hover:text-blue-700"
          >
            <Languages size={18} />

            {isArabic
              ? "English"
              : "العربية"}
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-teal-400 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Home size={17} />
              {t.eyebrow}
            </span>

            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              {t.description}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                href="/homecare/request"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 font-black text-white transition hover:bg-teal-400"
              >
                <Home size={20} />
                {t.request}
              </Link>

              <a
                href="https://wa.me/966568697530"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 px-6 py-4 font-black text-white transition hover:bg-white/10"
              >
                <Phone size={20} />
                {t.whatsapp}
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                value: "24/7",
                label: isArabic
                  ? "استقبال الطلبات"
                  : "Request Support",
              },
              {
                value: "8+",
                label: isArabic
                  ? "خدمات منزلية"
                  : "Home Services",
              },
              {
                value: "Home",
                label: isArabic
                  ? "الرعاية في منزلك"
                  : "Care at Home",
              },
              {
                value: "Fast",
                label: isArabic
                  ? "تنسيق سريع"
                  : "Fast Coordination",
              },
            ].map(
              (item) => (
                <div
                  key={
                    item.label
                  }
                  className="rounded-3xl border border-white/15 bg-white/10 p-7 text-white backdrop-blur"
                >
                  <strong className="block text-3xl font-black text-teal-300">
                    {item.value}
                  </strong>

                  <span className="mt-2 block text-sm text-blue-100">
                    {item.label}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="font-bold uppercase tracking-widest text-blue-700">
            Home Care
          </span>

          <h2 className="mt-3 text-3xl font-black md:text-5xl">
            {t.servicesTitle}
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            {t.servicesDescription}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {services.map(
            (service) => (
              <article
                key={
                  service.titleEn
                }
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  {
                    service.icon
                  }
                </div>

                <h3 className="mt-5 text-xl font-black">
                  {isArabic
                    ? service.titleAr
                    : service.titleEn}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {isArabic
                    ? service.descriptionAr
                    : service.descriptionEn}
                </p>

                <Link
                  href="/homecare/request"
                  className="mt-6 inline-flex items-center gap-2 font-black text-blue-700"
                >
                  {t.bookNow}

                  <ArrowRight
                    size={18}
                    className={
                      isArabic
                        ? "rotate-180"
                        : ""
                    }
                  />
                </Link>
              </article>
            )
          )}
        </div>
      </section>

      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="font-bold uppercase tracking-widest text-teal-400">
                Health Nations
              </span>

              <h2 className="mt-3 text-3xl font-black md:text-5xl">
                {t.whyTitle}
              </h2>
            </div>

            <div className="grid gap-4">
              {[
                t.why1,
                t.why2,
                t.why3,
                t.why4,
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5"
                >
                  <ShieldCheck className="shrink-0 text-teal-400" />

                  <span className="font-bold text-slate-100">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-800 to-teal-600 p-8 text-white md:p-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-black md:text-5xl">
                {t.ctaTitle}
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">
                {
                  t.ctaDescription
                }
              </p>
            </div>

            <Link
              href="/homecare/request"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-blue-800"
            >
              <HeartPulse size={20} />
              {t.bookNow}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            © 2026 Health Nations
            Medical. All rights
            reserved.
          </span>

          <Link
            href="/"
            className="font-bold text-blue-700"
          >
            {t.backHome}
          </Link>
        </div>
      </footer>
    </main>
  );
}