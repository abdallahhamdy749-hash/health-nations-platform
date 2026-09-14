"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  useRef,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  Bot,
  Building2,
  Camera,
  FileText,
  HeartHandshake,
  HeartPulse,
  Home as HomeIcon,
  Loader2,
  Menu,
  PackageSearch,
  Phone,
  Plane,
  Search,
  ShoppingBag,
  ShoppingCart,
  Stethoscope,
  Users,
  WalletCards,
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
  const router = useRouter();

  const [language, setLanguage] =
    useState<Language>("ar");

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [productSearch, setProductSearch] =
    useState("");

  const [imageSearching, setImageSearching] =
    useState(false);

  const [imageSearchError, setImageSearchError] =
    useState("");

  const imageInputRef =
    useRef<HTMLInputElement | null>(null);

  const isArabic = language === "ar";

  const handleProductSearch = () => {
    const query = productSearch.trim();

    if (!query) {
      return;
    }

    router.push(
      `/store?search=${encodeURIComponent(query)}`
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
      titleEn: "Medical Marketplace",
      titleAr: "سوق المعدات الطبية",
      descriptionEn:
        "Browse medical equipment, supplies and products from healthcare suppliers.",
      descriptionAr:
        "تصفح المعدات والمستلزمات والمنتجات الطبية من الموردين.",
      href: "/store",
      icon: <ShoppingBag size={27} />,
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
      titleEn: "Import from China",
      titleAr: "الاستيراد من الصين",
      descriptionEn:
        "Send us the product you need and request sourcing and import services.",
      descriptionAr:
        "أرسل المنتج المطلوب واحصل على خدمة البحث والتوريد والاستيراد.",
      href: "/import-request",
      icon: <Plane size={27} />,
    },
    {
      titleEn: "AI Consultant",
      titleAr: "المستشار الطبي الذكي",
      descriptionEn:
        "Get smart assistance in selecting medical equipment and solutions.",
      descriptionAr:
        "احصل على مساعدة ذكية لاختيار الأجهزة والحلول الطبية المناسبة.",
      href: "/ai-consultant",
      icon: <Bot size={27} />,
    },
    {
      titleEn: "Suppliers",
      titleAr: "الموردون",
      descriptionEn:
        "Discover registered medical suppliers and their products.",
      descriptionAr:
        "اكتشف الموردين الطبيين المسجلين ومنتجاتهم.",
      href: "/suppliers",
      icon: <Users size={27} />,
    },
    {
      titleEn: "Become a Supplier",
      titleAr: "سجّل كمورد",
      descriptionEn:
        "Join Health Nations and start offering your medical products.",
      descriptionAr:
        "انضم إلى صحة الأمم وابدأ بعرض منتجاتك الطبية.",
      href: "/supplier/register",
      icon: <Building2 size={27} />,
    },
  ];

  const text = {
    en: {
      company: "Health Nations Medical",
      slogan:
        "Smart Medical Solutions for Better Healthcare",
      home: "Home",
      marketplace: "Marketplace",
      homecare: "Home Care",
      import: "Import",
      suppliers: "Suppliers",
      ai: "AI Consultant",
      login: "Login",
      heroBadge:
        "Integrated Healthcare Marketplace",
      heroTitle:
        "Medical Equipment, Home Care & Smart Healthcare Solutions",
      heroDescription:
        "One platform connecting medical equipment, suppliers, home healthcare, sourcing, rental and intelligent healthcare solutions.",
      browse: "Browse Marketplace",
      quote: "Request a Quote",
      exploreTitle:
        "Explore Health Nations Platform",
      exploreLead:
        "Access our medical marketplace, home care, suppliers, import services and smart healthcare tools.",
      categoriesTitle:
        "Medical Equipment Categories",
      categoriesLead:
        "Explore our key medical equipment, surgical instrument and consumable categories.",
      servicesTitle: "Business Solutions",
      rental: "Medical Equipment Rental",
      rentalText:
        "Flexible medical equipment rental with installation, training and technical support.",
      finance: "Equipment Financing",
      financeText:
        "Choose the equipment you need and request a flexible commercial leasing solution.",
      catalogs: "Digital Catalog Library",
      catalogsText:
        "Browse medical equipment catalogs and technical brochures.",
      aiService: "Medical AI Consultant",
      aiText:
        "Use smart assistance to identify suitable equipment and healthcare solutions.",
      contactTitle: "Start With Health Nations",
      contactText:
        "Contact us for medical equipment, sourcing, home care, rental and healthcare solutions.",
      whatsapp: "WhatsApp",
      location:
        "Riyadh, Saudi Arabia | Sadat City, Egypt",
      view: "Open",
      products: "Products",
    },

    ar: {
      company: "شركة صحة الأمم الطبية",
      slogan:
        "حلول طبية ذكية لرعاية صحية أفضل",
      home: "الرئيسية",
      marketplace: "المتجر الطبي",
      homecare: "الرعاية المنزلية",
      import: "الاستيراد",
      suppliers: "الموردون",
      ai: "المستشار الذكي",
      login: "تسجيل الدخول",
      heroBadge:
        "منصة متكاملة للرعاية الصحية",
      heroTitle:
        "المعدات الطبية والرعاية المنزلية والحلول الصحية الذكية",
      heroDescription:
        "منصة واحدة تجمع المعدات والمستلزمات الطبية والموردين والرعاية المنزلية والاستيراد والتأجير والحلول الصحية الذكية.",
      browse: "تصفح المتجر الطبي",
      quote: "اطلب عرض سعر",
      exploreTitle:
        "استكشف منصة صحة الأمم",
      exploreLead:
        "ادخل إلى المتجر الطبي وخدمات الرعاية المنزلية والموردين والاستيراد والحلول الصحية الذكية.",
      categoriesTitle:
        "أقسام المعدات الطبية",
      categoriesLead:
        "استكشف أهم أقسام المعدات الطبية والأدوات الجراحية والمستلزمات.",
      servicesTitle:
        "حلولنا التجارية",
      rental:
        "تأجير المعدات الطبية",
      rentalText:
        "حلول مرنة لتأجير المعدات الطبية مع التركيب والتدريب والدعم الفني.",
      finance:
        "تمويل المعدات الطبية",
      financeText:
        "اختر الجهاز المطلوب وقدّم طلبك للحصول على حل تجاري مرن.",
      catalogs:
        "مكتبة الكتالوجات",
      catalogsText:
        "تصفح كتالوجات المعدات الطبية والبروشورات والمواصفات الفنية.",
      aiService:
        "المستشار الطبي الذكي",
      aiText:
        "استخدم المساعد الذكي للوصول إلى الأجهزة والحلول الصحية المناسبة.",
      contactTitle:
        "ابدأ مع صحة الأمم",
      contactText:
        "تواصل معنا للمعدات الطبية والاستيراد والرعاية المنزلية والتأجير والحلول الصحية.",
      whatsapp: "واتساب",
      location:
        "الرياض، السعودية | مدينة السادات، مصر",
      view: "فتح",
      products: "المنتجات",
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
                    <HomeIcon size={16} />
                  )}

                  {item.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-2">
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
                  isArabic ? "en" : "ar"
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
                  (current) => !current
                )
              }
              className="rounded-xl border border-slate-300 p-2 xl:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white px-5 py-5 xl:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() =>
                    setMenuOpen(false)
                  }
                  className="font-bold text-slate-700"
                >
                  {item.label}
                </Link>
              ))}

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

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-teal-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-400 blur-3xl" />
        </div>

        <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-blue-100">
              <Activity size={17} />
              {t.heroBadge}
            </span>

            <h1 className="max-w-4xl text-4xl font-black leading-tight text-white md:text-6xl">
              {t.heroTitle}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              {t.heroDescription}
            </p>

            <div className="mt-8 max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-4 shadow-xl backdrop-blur">
              <p className="mb-3 font-black text-white">
                {isArabic
                  ? "ابحث عن أي جهاز أو مستلزم طبي"
                  : "Search for any medical product"}
              </p>

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
                    value={productSearch}
                    onChange={(event) =>
                      setProductSearch(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter"
                      ) {
                        handleProductSearch();
                      }
                    }}
                    placeholder={
                      isArabic
                        ? "مثال: CTG، EDAN، Shockwave، سرير طبي..."
                        : "Example: CTG, EDAN, Shockwave, medical bed..."
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
                  onClick={handleProductSearch}
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
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSearch}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={
                      handleImageSearchClick
                    }
                    disabled={imageSearching}
                    className="inline-flex items-center gap-2 font-bold text-blue-100 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {imageSearching ? (
                      <Loader2
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Camera size={19} />
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
                      {imageSearchError}
                    </p>
                  )}
                </div>

                <span className="text-sm text-blue-100">
                  {isArabic
                    ? "لو المنتج غير موجود هنساعدك في توفيره."
                    : "If it is not listed, Health Nations can help source it."}
                </span>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/store"
                className="inline-flex items-center gap-2 rounded-2xl bg-teal-500 px-6 py-4 font-bold text-white transition hover:bg-teal-400"
              >
                <ShoppingCart size={20} />
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
                <Building2 size={20} />

                {isArabic
                  ? "سجّل كمورد"
                  : "Become a Supplier"}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                value: "10+",
                label: isArabic
                  ? "أقسام طبية"
                  : "Medical Categories",
              },
              {
                value: "24/7",
                label: isArabic
                  ? "دعم العملاء"
                  : "Customer Support",
              },
              {
                value: "2",
                label: isArabic
                  ? "أسواق رئيسية"
                  : "Main Markets",
              },
              {
                value: "AI",
                label: isArabic
                  ? "حلول ذكية"
                  : "Smart Solutions",
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
          {platformCards.map((card) => (
            <PlatformServiceCard
              key={card.href}
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
            />
          ))}
        </div>
      </section>

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
            {categories.map((category) => (
              <article
                key={category.en}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Stethoscope size={25} />
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
                  href="/store"
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
            ))}
          </div>
        </div>
      </section>

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
              description={t.rentalText}
            />

            <ServiceCard
              icon={<WalletCards />}
              title={t.finance}
              description={t.financeText}
            />

            <ServiceCard
              icon={<FileText />}
              title={t.catalogs}
              description={t.catalogsText}
            />

            <ServiceCard
              icon={<Bot />}
              title={t.aiService}
              description={t.aiText}
            />
          </div>
        </div>
      </section>

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

              <p className="mt-4 font-medium text-blue-100">
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
                {t.whatsapp}: +966 56 869 7530
              </a>

              <Link
                href="/store"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/40 px-7 py-4 font-bold"
              >
                <PackageSearch size={20} />
                {t.browse}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            ©️ 2026 {t.company}.{" "}
            {isArabic
              ? "جميع الحقوق محفوظة."
              : "All rights reserved."}
          </span>

          <span>{t.location}</span>
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
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  action: string;
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
        <ArrowRight size={18} />
      </Link>
    </article>
  );
}

function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-8 transition hover:bg-white/10">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-500 text-white">
        {icon}
      </div>

      <h3 className="text-2xl font-black">
        {title}
      </h3>

      <p className="mt-4 leading-8 text-slate-300">
        {description}
      </p>
    </article>
  );
}