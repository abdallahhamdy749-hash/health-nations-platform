"use client";

import { useState } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  FileText,
  HeartPulse,
  Menu,
  PackageSearch,
  Phone,
  ShoppingCart,
  Stethoscope,
  WalletCards,
  X,
} from "lucide-react";

type Language = "en" | "ar";

const categories = [
  {
    en: "Physiotherapy Equipment",
    ar: "أجهزة العلاج الطبيعي",
    itemsEn:
      "Shockwave, TECAR, Electrotherapy, TENS, Ultrasound, Laser Therapy, CPM, Traction, Cryotherapy",
    itemsAr:
      "شوك ويف، تيكار، علاج كهربائي، تنس، موجات فوق صوتية، ليزر علاجي، سي بي إم، شد، علاج بالتبريد",
  },
  {
    en: "Gynecology & Obstetrics",
    ar: "أجهزة النساء والولادة",
    itemsEn:
      "Colposcopes, Fetal Monitors, CTG, Ultrasound Systems, Examination Chairs, Delivery Beds",
    itemsAr:
      "مناظير عنق الرحم، أجهزة مراقبة الجنين، تخطيط الجنين، السونار، كراسي الفحص، أسرة الولادة",
  },
  {
    en: "Aesthetic & Dermatology",
    ar: "أجهزة التجميل والجلدية",
    itemsEn:
      "Diode Laser, IPL, CO₂ Laser, HIFU, RF Microneedling, Cryolipolysis, Skin Analyzer",
    itemsAr:
      "ليزر دايود، آي بي إل، ليزر ثاني أكسيد الكربون، هايفو، تردد حراري، كرايو، محلل البشرة",
  },
  {
    en: "Surgical Instruments",
    ar: "الأدوات الجراحية",
    itemsEn:
      "Forceps, Scissors, Needle Holders, Retractors, Clamps, Laparoscopic Instruments",
    itemsAr:
      "ملاقط، مقصات، ماسكات إبر، مبعدات، مشابك، أدوات مناظير جراحية",
  },
  {
    en: "Medical Consumables",
    ar: "المستلزمات الطبية",
    itemsEn:
      "Syringes, Cannulas, IV Sets, Gloves, Gowns, Drapes, Sutures, Wound Care",
    itemsAr:
      "سرنجات، كانيولا، أطقم محاليل، قفازات، جاونات، أغطية جراحية، خيوط، عناية بالجروح",
  },
  {
    en: "Hospital & Critical Care",
    ar: "تجهيزات المستشفيات والعناية",
    itemsEn:
      "Patient Monitors, Ventilators, Infusion Pumps, Defibrillators, Beds, Medical Gas Systems",
    itemsAr:
      "شاشات مرضى، أجهزة تنفس صناعي، مضخات محاليل، أجهزة صدمات، أسرة، غازات طبية",
  },
];

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [menuOpen, setMenuOpen] = useState(false);

  const isArabic = language === "ar";

  const text = {
    en: {
      company: "Health Nations Medical",
      slogan: "Smart Medical Solutions for Better Healthcare",
      nav: ["Home", "Products", "Catalogs", "Rental", "AI Consultant", "Contact"],
      heroTitle: "Medical Equipment, Rental & Smart Healthcare Solutions",
      heroDescription:
        "We supply medical equipment, surgical instruments and consumables, provide flexible rental solutions, and help healthcare providers choose the right technology.",
      browse: "Browse Products",
      quote: "Request a Quote",
      categoriesTitle: "Medical Equipment Categories",
      categoriesLead:
        "Explore our key medical equipment, surgical instrument and consumable categories.",
      servicesTitle: "Our Business Solutions",
      rental: "Medical Equipment Rental",
      rentalText:
        "Daily, monthly and long-term equipment rental with installation, training and technical support.",
      finance: "We Buy the Device and Lease It to You",
      financeText:
        "Choose the equipment you need and submit a request. We purchase it and provide a flexible leasing plan.",
      catalogs: "Digital Catalog Library",
      catalogsText:
        "Browse and download medical equipment catalogs and technical brochures.",
      ai: "Medical AI Consultant",
      aiText:
        "Describe your clinic, department or project and receive a suggested equipment list.",
      contactTitle: "Start Your Medical Project",
      contactText:
        "Contact Health Nations Medical for equipment supply, rental, financing and hospital planning.",
      whatsapp: "WhatsApp",
      location: "Riyadh, Saudi Arabia | Sadat City, Egypt",
    },
    ar: {
      company: "شركة صحة الأمم الطبية",
      slogan: "حلول طبية ذكية لرعاية صحية أفضل",
      nav: [
        "الرئيسية",
        "المنتجات",
        "الكتالوجات",
        "التأجير",
        "المستشار الذكي",
        "تواصل معنا",
      ],
      heroTitle: "المعدات الطبية والتأجير والحلول الصحية الذكية",
      heroDescription:
        "نوفر المعدات الطبية والأدوات الجراحية والمستلزمات، ونقدم حلول تأجير مرنة، ونساعد المنشآت الصحية على اختيار التقنية المناسبة.",
      browse: "تصفح المنتجات",
      quote: "اطلب عرض سعر",
      categoriesTitle: "أقسام المعدات الطبية",
      categoriesLead:
        "استكشف أهم أقسام المعدات الطبية والأدوات الجراحية والمستلزمات.",
      servicesTitle: "حلولنا التجارية",
      rental: "تأجير المعدات الطبية",
      rentalText:
        "تأجير يومي وشهري وطويل المدة مع التركيب والتدريب والدعم الفني.",
      finance: "نشتري الجهاز ونؤجره لك",
      financeText:
        "اختر الجهاز المطلوب وقدّم الطلب، ونقوم بشرائه وتوفير خطة تأجير مرنة.",
      catalogs: "مكتبة الكتالوجات الرقمية",
      catalogsText:
        "تصفح وحمّل كتالوجات المعدات الطبية والبروشورات الفنية.",
      ai: "المستشار الطبي بالذكاء الاصطناعي",
      aiText:
        "اكتب نوع العيادة أو القسم أو المشروع لتحصل على قائمة أجهزة مقترحة.",
      contactTitle: "ابدأ مشروعك الطبي",
      contactText:
        "تواصل مع شركة صحة الأمم الطبية للتوريد والتأجير والتمويل وتجهيز المنشآت الصحية.",
      whatsapp: "واتساب",
      location: "الرياض، السعودية | مدينة السادات، مصر",
    },
  };

  const t = text[language];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-500 text-white shadow-lg">
              <HeartPulse size={27} />
            </div>

            <div>
              <strong className="block text-lg font-bold text-slate-900">
                {t.company}
              </strong>
              <span className="text-xs text-slate-500">{t.slogan}</span>
            </div>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {t.nav.map((item, index) => (
              <a
                key={item}
                href={
                  ["#home", "#products", "#catalogs", "#rental", "#ai", "#contact"][
                    index
                  ]
                }
                className="text-sm font-medium text-slate-700 transition hover:text-blue-700"
              >
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(isArabic ? "en" : "ar")}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold transition hover:border-blue-700 hover:text-blue-700"
            >
              {isArabic ? "English" : "العربية"}
            </button>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-xl border border-slate-300 p-2 lg:hidden"
              aria-label="Open menu"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-4 lg:hidden">
            <div className="flex flex-col gap-4">
              {t.nav.map((item, index) => (
                <a
                  key={item}
                  href={
                    ["#home", "#products", "#catalogs", "#rental", "#ai", "#contact"][
                      index
                    ]
                  }
                  onClick={() => setMenuOpen(false)}
                  className="font-medium text-slate-700"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800"
      >
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-blue-100">
              <Activity size={17} />
              {t.slogan}
            </span>

            <h1 className="max-w-3xl text-4xl font-black leading-tight text-white md:text-6xl">
              {t.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              {t.heroDescription}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 font-bold text-white transition hover:bg-teal-400"
              >
                <ShoppingCart size={20} />
                {t.browse}
              </a>

              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 px-6 py-4 font-bold text-white transition hover:bg-white/10"
              >
                {t.quote}
                <ArrowRight
                  size={20}
                  className={isArabic ? "rotate-180" : ""}
                />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "10+", label: isArabic ? "أقسام طبية" : "Medical Categories" },
              { value: "24/7", label: isArabic ? "دعم العملاء" : "Customer Support" },
              { value: "2", label: isArabic ? "فروع رئيسية" : "Main Locations" },
              { value: "AI", label: isArabic ? "حلول ذكية" : "Smart Solutions" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/15 bg-white/10 p-7 text-white backdrop-blur"
              >
                <strong className="block text-4xl font-black text-teal-300">
                  {stat.value}
                </strong>
                <span className="mt-2 block text-sm text-blue-100">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="font-bold uppercase tracking-widest text-blue-700">
            {isArabic ? "المنتجات" : "Products"}
          </span>
          <h2 className="mt-3 text-3xl font-black md:text-5xl">
            {t.categoriesTitle}
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            {t.categoriesLead}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.en}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Stethoscope size={25} />
              </div>

              <h3 className="text-xl font-bold">
                {isArabic ? category.ar : category.en}
              </h3>

              <p className="mt-4 leading-7 text-slate-600">
                {isArabic ? category.itemsAr : category.itemsEn}
              </p>

              <button className="mt-6 inline-flex items-center gap-2 font-bold text-blue-700">
                {isArabic ? "عرض القسم" : "View Category"}
                <ArrowRight
                  size={18}
                  className={isArabic ? "rotate-180" : ""}
                />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-14">
            <span className="font-bold uppercase tracking-widest text-teal-400">
              {isArabic ? "خدماتنا" : "Our Services"}
            </span>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              {t.servicesTitle}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ServiceCard
              id="rental"
              icon={<Building2 />}
              title={t.rental}
              description={t.rentalText}
            />
            <ServiceCard
              icon={<WalletCards />}
              title={t.finance}
              description={t.financeText}
            />
            <ServiceCard
              id="catalogs"
              icon={<FileText />}
              title={t.catalogs}
              description={t.catalogsText}
            />
            <ServiceCard
              id="ai"
              icon={<Bot />}
              title={t.ai}
              description={t.aiText}
            />
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 py-24">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-800 to-teal-600 p-8 text-white md:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-black md:text-5xl">
                {t.contactTitle}
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">
                {t.contactText}
              </p>
              <p className="mt-4 font-medium text-blue-100">{t.location}</p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/966568697530"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-blue-800"
              >
                <Phone size={20} />
                {t.whatsapp}: +966 56 869 7530
              </a>

              <a
                href="#products"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 px-7 py-4 font-bold"
              >
                <PackageSearch size={20} />
                {t.browse}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            © 2026 {t.company}.{" "}
            {isArabic ? "جميع الحقوق محفوظة." : "All rights reserved."}
          </span>
          <span>{t.location}</span>
        </div>
      </footer>
    </main>
  );
}

function ServiceCard({
  id,
  icon,
  title,
  description,
}: {
  id?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article
      id={id}
      className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:bg-white/10"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white">
        {icon}
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="mt-4 leading-8 text-slate-300">{description}</p>
    </article>
  );
}