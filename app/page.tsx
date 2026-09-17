"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, useRef, useState } from "react";

import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  Camera,
  FileText,
  Globe2,
  HeartHandshake,
  HeartPulse,
  Home as HomeIcon,
  Loader2,
  Menu,
  PackageSearch,
  Phone,
  Plane,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";

type Language = "en" | "ar";

type PlatformCard = {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  href: string;
  icon: React.ReactNode;
};

type Category = {
  en: string;
  ar: string;
  itemsEn: string;
  itemsAr: string;
  search: string;
  icon: React.ReactNode;
};

const categories: Category[] = [
  {
    en: "Physiotherapy Equipment",
    ar: "أجهزة العلاج الطبيعي",
    itemsEn:
      "Shockwave, TECAR, Electrotherapy, TENS, Ultrasound, Laser Therapy, CPM, Traction, Cryotherapy",
    itemsAr:
      "شوك ويف، تيكار، علاج كهربائي، تنس، موجات فوق صوتية، ليزر علاجي، سي بي إم، شد، علاج بالتبريد",
    search: "Physiotherapy Equipment",
    icon: <Activity size={25} />,
  },
  {
    en: "Gynecology & Obstetrics",
    ar: "أجهزة النساء والولادة",
    itemsEn:
      "Colposcopes, Fetal Monitors, CTG, Ultrasound Systems, Examination Chairs, Delivery Beds",
    itemsAr:
      "مناظير عنق الرحم، أجهزة مراقبة الجنين، تخطيط الجنين، السونار، كراسي الفحص، أسرة الولادة",
    search: "Gynecology Obstetrics",
    icon: <HeartPulse size={25} />,
  },
  {
    en: "Aesthetic & Dermatology",
    ar: "أجهزة التجميل والجلدية",
    itemsEn:
      "Diode Laser, IPL, CO₂ Laser, HIFU, RF Microneedling, Cryolipolysis, Skin Analyzer",
    itemsAr:
      "ليزر دايود، آي بي إل، ليزر ثاني أكسيد الكربون، هايفو، تردد حراري، كرايو، محلل البشرة",
    search: "Aesthetic Dermatology",
    icon: <Stethoscope size={25} />,
  },
  {
    en: "Surgical Instruments",
    ar: "الأدوات الجراحية",
    itemsEn:
      "Forceps, Scissors, Needle Holders, Retractors, Clamps, Laparoscopic Instruments",
    itemsAr:
      "ملاقط، مقصات، ماسكات إبر، مبعدات، مشابك، أدوات مناظير جراحية",
    search: "Surgical Instruments",
    icon: <Stethoscope size={25} />,
  },
  {
    en: "Medical Consumables",
    ar: "المستلزمات الطبية",
    itemsEn:
      "Syringes, Cannulas, IV Sets, Gloves, Gowns, Drapes, Sutures, Wound Care",
    itemsAr:
      "سرنجات، كانيولا، أطقم محاليل، قفازات، جاونات، أغطية جراحية، خيوط، عناية بالجروح",
    search: "Medical Consumables",
    icon: <PackageSearch size={25} />,
  },
  {
    en: "Hospital & Critical Care",
    ar: "تجهيزات المستشفيات والعناية",
    itemsEn:
      "Patient Monitors, Ventilators, Infusion Pumps, Defibrillators, Beds, Medical Gas Systems",
    itemsAr:
      "شاشات مرضى، أجهزة تنفس صناعي، مضخات محاليل، أجهزة صدمات، أسرة، غازات طبية",
    search: "Hospital Critical Care",
    icon: <HeartPulse size={25} />,
  },
  {
    en: "Medical Equipment Spare Parts",
    ar: "قطع غيار الأجهزة الطبية",
    itemsEn:
      "Boards, Sensors, Cables, Batteries, Power Supplies, Motors, Pumps, Probes, Connectors and Device Parts",
    itemsAr:
      "بوردات، حساسات، كابلات، بطاريات، مزودات طاقة، مواتير، مضخات، مجسات، وصلات وقطع غيار الأجهزة الطبية",
    search: "Medical Equipment Spare Parts",
    icon: <Settings size={25} />,
  },
];

export default function Home() {
  const router = useRouter();

  const [language, setLanguage] =
    useState<Language>("ar");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState("");

  const [imageSearching, setImageSearching] =
    useState(false);

  const [
    imageSearchError,
    setImageSearchError,
  ] = useState("");

  const imageInputRef =
    useRef<HTMLInputElement | null>(null);

  const isArabic = language === "ar";

  const handleProductSearch = () => {
    const query = productSearch.trim();

    if (!query) {
      return;
    }

    router.push(
      `/store?search=${encodeURIComponent(
        query
      )}`
    );
  };

  const handleImageSearchClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageSearch = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setImageSearching(true);
    setImageSearchError("");

    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        "/api/image-search",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to analyze this image."
        );
      }

      const searchQuery =
        data?.result?.searchQuery?.trim();

      if (!searchQuery) {
        throw new Error(
          "The product could not be identified."
        );
      }

      setProductSearch(searchQuery);

      router.push(
        `/store?search=${encodeURIComponent(
          searchQuery
        )}`
      );
    } catch (error: unknown) {
      setImageSearchError(
        error instanceof Error
          ? error.message
          : "Unable to analyze this image."
      );
    } finally {
      setImageSearching(false);

      if (imageInputRef.current) {
        imageInputRef.current.value = "";
      }
    }
  };

  const platformCards: PlatformCard[] = [
    {
      titleEn: "Global Medical Marketplace",
      titleAr: "السوق الطبي العالمي",
      descriptionEn:
        "Browse medical equipment, supplies and healthcare products from suppliers around the world.",
      descriptionAr:
        "تصفح المعدات والمستلزمات والمنتجات الطبية من موردين من مختلف دول العالم.",
      href: "/store",
      icon: <Globe2 size={27} />,
    },
    {
      titleEn: "Medical Spare Parts",
      titleAr: "قطع غيار الأجهزة الطبية",
      descriptionEn:
        "Find medical equipment spare parts by device, brand, model or part number.",
      descriptionAr:
        "ابحث عن قطع غيار الأجهزة الطبية حسب الجهاز أو الشركة أو الموديل أو رقم القطعة.",
      href: "/store?search=Medical%20Equipment%20Spare%20Parts",
      icon: <Settings size={27} />,
    },
    {
      titleEn: "Home Care",
      titleAr: "الرعاية المنزلية",
      descriptionEn:
        "Request physiotherapy, nursing and other healthcare services at home.",
      descriptionAr:
        "اطلب العلاج الطبيعي والتمريض وخدمات الرعاية الصحية في المنزل.",
      href: "/homecare",
      icon: <HeartHandshake size={27} />,
    },
    {
      titleEn: "Global Sourcing & Import",
      titleAr: "التوريد والاستيراد العالمي",
      descriptionEn:
        "Send us the product you need and request sourcing and import support.",
      descriptionAr:
        "أرسل المنتج المطلوب واحصل على خدمات البحث والتوريد والاستيراد.",
      href: "/import-request",
      icon: <Plane size={27} />,
    },
    {
      titleEn: "AI Consultant",
      titleAr: "المستشار الطبي الذكي",
      descriptionEn:
        "Get smart assistance in selecting medical equipment and healthcare solutions.",
      descriptionAr:
        "احصل على مساعدة ذكية لاختيار الأجهزة والحلول الطبية المناسبة.",
      href: "/ai-consultant",
      icon: <Bot size={27} />,
    },
    {
      titleEn: "Global Suppliers",
      titleAr: "الموردون حول العالم",
      descriptionEn:
        "Discover registered medical suppliers and explore their products.",
      descriptionAr:
        "اكتشف الموردين الطبيين المسجلين من مختلف الدول وتصفح منتجاتهم.",
      href: "/suppliers",
      icon: <Users size={27} />,
    },
    {
      titleEn: "Become a Supplier",
      titleAr: "سجّل كمورد",
      descriptionEn:
        "Join Health Nations from anywhere in the world and start offering your medical products.",
      descriptionAr:
        "انضم إلى صحة الأمم من أي دولة وابدأ بعرض منتجاتك الطبية عالميًا.",
      href: "/supplier/register",
      icon: <Building2 size={27} />,
    },
  ];

  const text = {
    en: {
      company: "Health Nations Medical",
      slogan:
        "Global Medical Marketplace & Healthcare Solutions",

      home: "Home",
      marketplace: "Global Marketplace",
      homecare: "Home Care",
      import: "Global Sourcing",
      suppliers: "Suppliers",
      ai: "AI Consultant",
      login: "Login",

      heroBadge:
        "Global Medical Marketplace",

      heroTitle:
        "Connecting Healthcare Buyers & Medical Suppliers Worldwide",

      heroDescription:
        "Discover medical equipment, consumables, spare parts and healthcare solutions from suppliers around the world through one global platform.",

      browse: "Explore Global Marketplace",
      quote: "Source a Product",

      exploreTitle:
        "One Global Platform for Healthcare",

      exploreLead:
        "Explore medical products, spare parts, global suppliers, home care, sourcing services and intelligent healthcare solutions.",

      categoriesTitle:
        "Medical Products & Equipment",

      categoriesLead:
        "Search medical equipment, consumables, surgical instruments and spare parts from suppliers worldwide.",

      servicesTitle:
        "Global Business Solutions",

      rental:
        "Medical Equipment Rental",

      rentalText:
        "Explore flexible medical equipment rental opportunities with installation, training and technical support.",

      finance:
        "Equipment Financing",

      financeText:
        "Choose the equipment you need and request a flexible commercial solution.",

      catalogs:
        "Global Catalog Library",

      catalogsText:
        "Browse medical equipment catalogs, brochures and technical product information from suppliers.",

      aiService:
        "Medical AI Consultant",

      aiText:
        "Use smart assistance to identify suitable medical equipment, products and healthcare solutions.",

      contactTitle:
        "Connect With Health Nations",

      contactText:
        "Looking for medical equipment, spare parts or a specific product? Health Nations can help connect and source globally.",

      whatsapp: "WhatsApp",

      location:
        "Global Marketplace | Saudi Arabia | Egypt",

      view: "Open",
      products: "Global Products",
      openService: "Open Service",
    },

    ar: {
      company:
        "شركة صحة الأمم الطبية",

      slogan:
        "السوق الطبي العالمي والحلول الصحية",

      home: "الرئيسية",
      marketplace: "السوق العالمي",
      homecare: "الرعاية المنزلية",
      import: "التوريد العالمي",
      suppliers: "الموردون",
      ai: "المستشار الذكي",
      login: "تسجيل الدخول",

      heroBadge:
        "السوق الطبي العالمي",

      heroTitle:
        "نربط المشترين والموردين الطبيين من مختلف دول العالم",

      heroDescription:
        "اكتشف الأجهزة الطبية والمستلزمات وقطع الغيار والحلول الصحية من موردين حول العالم من خلال منصة عالمية واحدة.",

      browse:
        "استكشف السوق العالمي",

      quote:
        "اطلب توفير منتج",

      exploreTitle:
        "منصة عالمية واحدة للقطاع الصحي",

      exploreLead:
        "استكشف المنتجات الطبية وقطع الغيار والموردين حول العالم والرعاية المنزلية وخدمات التوريد والحلول الصحية الذكية.",

      categoriesTitle:
        "الأجهزة والمنتجات الطبية",

      categoriesLead:
        "ابحث عن الأجهزة والمستلزمات والأدوات الجراحية وقطع الغيار من موردين حول العالم.",

      servicesTitle:
        "حلول الأعمال العالمية",

      rental:
        "تأجير المعدات الطبية",

      rentalText:
        "استكشف حلول تأجير المعدات الطبية مع التركيب والتدريب والدعم الفني.",

      finance:
        "تمويل المعدات الطبية",

      financeText:
        "اختر الجهاز المطلوب وقدّم طلبك للحصول على حل تجاري مرن.",

      catalogs:
        "مكتبة الكتالوجات العالمية",

      catalogsText:
        "تصفح كتالوجات الأجهزة الطبية والبروشورات والمواصفات الفنية للموردين.",

      aiService:
        "المستشار الطبي الذكي",

      aiText:
        "استخدم المساعد الذكي للوصول إلى الأجهزة والمنتجات والحلول الصحية المناسبة.",

      contactTitle:
        "تواصل مع صحة الأمم",

      contactText:
        "تبحث عن جهاز طبي أو قطعة غيار أو منتج محدد؟ صحة الأمم تساعدك في الوصول إليه وتوفيره عالميًا.",

      whatsapp: "واتساب",

      location:
        "سوق عالمي | السعودية | مصر",

      view: "فتح",
      products: "المنتجات العالمية",
      openService: "فتح الخدمة",
    },
  };

  const t = text[language];

  const navItems = [
    {
      label: t.home,
      href: "/",
    },
    {
      label: t.marketplace,
      href: "/store",
    },
    {
      label: t.homecare,
      href: "/homecare",
    },
    {
      label: t.import,
      href: "/import-request",
    },
    {
      label: t.suppliers,
      href: "/suppliers",
    },
    {
      label: t.ai,
      href: "/ai-consultant",
    },
  ];

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-500 text-white shadow-lg">
              <HeartPulse size={27} />
            </div>

            <div>
              <strong className="block text-lg font-black">
                {t.company}
              </strong>

              <span className="hidden text-xs text-slate-500 sm:block">
                {t.slogan}
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 xl:flex">
            {navItems.map(
              (item, index) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-1 text-sm font-bold text-slate-700 transition hover:text-blue-700"
                >
                  {index === 0 && (
                    <HomeIcon
                      size={16}
                    />
                  )}

                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 lg:flex">
              <Globe2
                size={17}
                className="text-blue-700"
              />

              {isArabic
                ? "عالمي"
                : "Global"}
            </div>

            <Link
              href="/login"
              className="hidden rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 md:inline-flex"
            >
              {t.login}
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
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold transition hover:border-blue-700 hover:text-blue-700"
            >
              {isArabic
                ? "English"
                : "العربية"}
            </button>

            <button
              type="button"
              onClick={() =>
                setMenuOpen(
                  (current) =>
                    !current
                )
              }
              className="rounded-xl border border-slate-300 p-2 xl:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X />
              ) : (
                <Menu />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 xl:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 font-black text-blue-700">
                <Globe2 size={18} />

                {isArabic
                  ? "السوق العالمي"
                  : "Global Marketplace"}
              </div>

              {navItems.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      setMenuOpen(
                        false
                      )
                    }
                    className="font-bold text-slate-700"
                  >
                    {item.label}
                  </Link>
                )
              )}

              <Link
                href="/login"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="font-bold text-blue-700"
              >
                {t.login}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-teal-400 blur-3xl" />

          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100">
              <Globe2 size={17} />
              {t.heroBadge}
            </span>

            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
              {t.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              {t.heroDescription}
            </p>

            {/* GLOBAL SEARCH */}

            <div className="mt-8 max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-black text-white">
                  {isArabic
                    ? "ابحث عالميًا عن جهاز أو مستلزم أو قطعة غيار"
                    : "Search globally for equipment, supplies or spare parts"}
                </p>

                <span className="inline-flex items-center gap-1 rounded-full bg-teal-400/15 px-3 py-1 text-xs font-black text-teal-200">
                  <Globe2 size={13} />

                  GLOBAL
                </span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search
                    size={20}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${
                      isArabic
                        ? "right-4"
                        : "left-4"
                    }`}
                  />

                  <input
                    type="text"
                    value={
                      productSearch
                    }
                    onChange={(
                      event
                    ) =>
                      setProductSearch(
                        event.target
                          .value
                      )
                    }
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                        "Enter"
                      ) {
                        handleProductSearch();
                      }
                    }}
                    placeholder={
                      isArabic
                        ? "مثال: EDAN F6، CTG، Siemens، بطارية جهاز، Part Number..."
                        : "Example: EDAN F6, CTG, Siemens, battery, part number..."
                    }
                    className={`w-full rounded-2xl border border-white/20 bg-white py-4 text-slate-900 outline-none transition focus:ring-4 focus:ring-teal-300/30 ${
                      isArabic
                        ? "pl-4 pr-12"
                        : "pl-12 pr-4"
                    }`}
                  />
                </div>

                <button
                  type="button"
                  onClick={
                    handleProductSearch
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-7 py-4 font-black text-white transition hover:bg-teal-400"
                >
                  <Search size={19} />

                  {isArabic
                    ? "بحث"
                    : "Search"}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <input
                    ref={
                      imageInputRef
                    }
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageSearch
                    }
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={
                      handleImageSearchClick
                    }
                    disabled={
                      imageSearching
                    }
                    className="inline-flex items-center gap-2 font-bold text-blue-100 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {imageSearching ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Camera
                        size={19}
                      />
                    )}

                    {imageSearching
                      ? isArabic
                        ? "جاري تحليل الصورة..."
                        : "Analyzing image..."
                      : isArabic
                        ? "البحث باستخدام صورة"
                        : "Search using an image"}
                  </button>

                  {imageSearchError && (
                    <p className="mt-2 max-w-md text-sm font-semibold text-red-200">
                      {
                        imageSearchError
                      }
                    </p>
                  )}
                </div>

                <span className="text-sm text-blue-100">
                  {isArabic
                    ? "لو المنتج غير موجود، نساعدك في البحث عنه وتوفيره عالميًا."
                    : "If it is not listed, we can help source it globally."}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 font-bold text-white transition hover:bg-teal-400"
              >
                <ShoppingCart
                  size={20}
                />

                {t.browse}
              </Link>

              <Link
                href="/import-request"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/40 px-6 py-4 font-bold text-white transition hover:bg-white/10"
              >
                {t.quote}

                <ArrowRight
                  size={20}
                  className={
                    isArabic
                      ? "rotate-180"
                      : ""
                  }
                />
              </Link>

              <Link
                href="/supplier/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white transition hover:bg-emerald-500"
              >
                <Building2
                  size={20}
                />

                {isArabic
                  ? "انضم كمورد عالمي"
                  : "Join as Global Supplier"}
              </Link>
            </div>
          </div>

          {/* GLOBAL STATS */}

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                value: "🌍",
                label: isArabic
                  ? "سوق عالمي"
                  : "Global Marketplace",
              },
              {
                value: "24/7",
                label: isArabic
                  ? "وصول للمنصة"
                  : "Platform Access",
              },
              {
                value: "7+",
                label: isArabic
                  ? "أقسام رئيسية"
                  : "Main Categories",
              },
              {
                value: "AI",
                label: isArabic
                  ? "بحث وحلول ذكية"
                  : "Smart Search",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/15 bg-white/10 p-7 text-white backdrop-blur"
              >
                <strong className="block text-3xl font-black text-teal-300 md:text-4xl">
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

      {/* GLOBAL MESSAGE */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-7">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Globe2 size={24} />
              </div>

              <div>
                <p className="font-black">
                  {isArabic
                    ? "اكتشف الموردين من جميع أنحاء العالم"
                    : "Discover suppliers from around the world"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {isArabic
                    ? "السعودية، مصر، الصين، تركيا، أوروبا، الولايات المتحدة وأي دولة ينضم منها مورد إلى المنصة."
                    : "Saudi Arabia, Egypt, China, Turkey, Europe, the United States and every market represented by our suppliers."}
                </p>
              </div>
            </div>

            <Link
              href="/suppliers"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
            >
              <Users size={17} />

              {isArabic
                ? "استكشف الموردين"
                : "Explore Suppliers"}
            </Link>
          </div>
        </div>
      </section>

      {/* PLATFORM */}

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="font-black uppercase tracking-widest text-teal-600">
            HEALTH NATIONS
          </span>

          <h2 className="mt-3 text-3xl font-black md:text-5xl">
            {t.exploreTitle}
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            {t.exploreLead}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {platformCards.map(
            (card) => (
              <PlatformServiceCard
                key={`${card.href}-${card.titleEn}`}
                icon={card.icon}
                title={
                  isArabic
                    ? card.titleAr
                    : card.titleEn
                }
                description={
                  isArabic
                    ? card.descriptionAr
                    : card.descriptionEn
                }
                href={card.href}
                action={t.view}
                isArabic={
                  isArabic
                }
              />
            )
          )}
        </div>
      </section>

      {/* CATEGORIES */}

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="font-bold uppercase tracking-widest text-blue-700">
              {t.products}
            </span>

            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              {t.categoriesTitle}
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              {t.categoriesLead}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map(
              (category) => (
                <article
                  key={
                    category.en
                  }
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                    {category.icon}
                  </div>

                  <h3 className="text-xl font-black">
                    {isArabic
                      ? category.ar
                      : category.en}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600">
                    {isArabic
                      ? category.itemsAr
                      : category.itemsEn}
                  </p>

                  <Link
                    href={`/store?search=${encodeURIComponent(
                      category.search
                    )}`}
                    className="mt-6 inline-flex items-center gap-2 font-black text-blue-700"
                  >
                    {isArabic
                      ? "عرض المنتجات"
                      : "View Products"}

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
        </div>
      </section>

      {/* SPARE PARTS */}

      <section className="bg-slate-100 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 md:p-12">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Wrench size={27} />
                </div>

                <p className="mt-7 text-sm font-black uppercase tracking-widest text-amber-700">
                  MEDICAL SPARE PARTS
                </p>

                <h2 className="mt-3 text-3xl font-black md:text-4xl">
                  {isArabic
                    ? "ابحث عن قطع غيار الأجهزة الطبية عالميًا"
                    : "Find Medical Equipment Spare Parts Globally"}
                </h2>

                <p className="mt-5 max-w-xl leading-8 text-slate-600">
                  {isArabic
                    ? "ابحث باسم الجهاز أو الشركة المصنعة أو الموديل أو رقم القطعة، واستكشف قطع الغيار المتاحة من الموردين."
                    : "Search by device, manufacturer, model or part number and explore available spare parts from suppliers."}
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  {[
                    isArabic
                      ? "بوردات"
                      : "Boards",
                    isArabic
                      ? "حساسات"
                      : "Sensors",
                    isArabic
                      ? "بطاريات"
                      : "Batteries",
                    isArabic
                      ? "كابلات"
                      : "Cables",
                    isArabic
                      ? "مجسات"
                      : "Probes",
                    isArabic
                      ? "مزودات طاقة"
                      : "Power Supplies",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                <Link
                  href="/store?search=Medical%20Equipment%20Spare%20Parts"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-6 py-4 font-black text-slate-950 transition hover:bg-amber-400"
                >
                  <Settings
                    size={19}
                  />

                  {isArabic
                    ? "استكشف قطع الغيار"
                    : "Explore Spare Parts"}
                </Link>
              </div>

              <div className="flex min-h-[350px] items-center justify-center bg-gradient-to-br from-slate-950 to-blue-900 p-10 text-white">
                <div className="max-w-sm text-center">
                  <Globe2
                    size={70}
                    className="mx-auto text-teal-300"
                  />

                  <h3 className="mt-6 text-3xl font-black">
                    {isArabic
                      ? "موردون عالميون"
                      : "Global Suppliers"}
                  </h3>

                  <p className="mt-4 leading-7 text-blue-100">
                    {isArabic
                      ? "اعثر على المنتجات وقطع الغيار من الموردين المسجلين من مختلف الدول."
                      : "Find products and spare parts from registered suppliers across different countries."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUSINESS SOLUTIONS */}

      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-14">
            <span className="font-bold uppercase tracking-widest text-teal-400">
              {isArabic
                ? "خدمات الأعمال"
                : "Business Services"}
            </span>

            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              {t.servicesTitle}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ServiceCard
              icon={<Building2 />}
              title={t.rental}
              description={
                t.rentalText
              }
              href="/store?type=rental"
              action={
                t.openService
              }
              isArabic={
                isArabic
              }
            />

            <ServiceCard
              icon={
                <WalletCards />
              }
              title={t.finance}
              description={
                t.financeText
              }
              href="/import-request"
              action={
                t.openService
              }
              isArabic={
                isArabic
              }
            />

            <ServiceCard
              icon={<FileText />}
              title={t.catalogs}
              description={
                t.catalogsText
              }
              href="/catalogs"
              action={
                t.openService
              }
              isArabic={
                isArabic
              }
            />

            <ServiceCard
              icon={<Bot />}
              title={t.aiService}
              description={
                t.aiText
              }
              href="/ai-consultant"
              action={
                t.openService
              }
              isArabic={
                isArabic
              }
            />
          </div>
        </div>
      </section>

      {/* CONTACT */}

      <section className="mx-auto max-w-7xl px-5 py-24">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-800 to-teal-600 p-8 text-white md:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-3xl font-black md:text-5xl">
                {t.contactTitle}
              </h2>

              <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">
                {t.contactText}
              </p>

              <p className="mt-4 flex items-center gap-2 font-medium text-blue-100">
                <Globe2
                  size={18}
                />

                {t.location}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="https://wa.me/966568697530"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-bold text-blue-800"
              >
                <Phone size={20} />

                {t.whatsapp}:
                +966 56 869 7530
              </a>

              <Link
                href="/store"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 px-7 py-4 font-bold"
              >
                <PackageSearch
                  size={20}
                />

                {t.browse}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            © 2026 {t.company}.{" "}
            {isArabic
              ? "جميع الحقوق محفوظة."
              : "All rights reserved."}
          </span>

          <span className="inline-flex items-center gap-2">
            <Globe2 size={15} />
            {t.location}
          </span>
        </div>
      </footer>
    </main>
  );
}

function PlatformServiceCard({
  icon,
  title,
  description,
  href,
  action,
  isArabic,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
  isArabic: boolean;
}) {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-teal-500 text-white">
        {icon}
      </div>

      <h3 className="text-xl font-black">
        {title}
      </h3>

      <p className="mt-4 min-h-[84px] leading-7 text-slate-600">
        {description}
      </p>

      <Link
        href={href}
        className="mt-6 inline-flex items-center gap-2 font-black text-blue-700"
      >
        {action}

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
  );
}

function ServiceCard({
  icon,
  title,
  description,
  href,
  action,
  isArabic,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
  isArabic: boolean;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:-translate-y-1 hover:border-teal-400/30 hover:bg-white/10 hover:shadow-xl"
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white transition group-hover:scale-105">
        {icon}
      </div>

      <h3 className="text-2xl font-black">
        {title}
      </h3>

      <p className="mt-4 leading-8 text-slate-300">
        {description}
      </p>

      <div className="mt-6 inline-flex items-center gap-2 font-bold text-teal-300 transition group-hover:text-teal-200">
        {action}

        <ArrowRight
          size={18}
          className={
            isArabic
              ? "rotate-180"
              : ""
          }
        />
      </div>
    </Link>
  );
}