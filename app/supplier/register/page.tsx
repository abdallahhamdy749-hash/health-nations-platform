"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Globe2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";

import {
  Language,
  useLanguage,
} from "@/components/LanguageProvider";

type AccountType =
  | "pharmacy"
  | "medical_supplier"
  | "manufacturer";

type Country = {
  code: string;
  name: string;
  label: string;
  currency: string;
  phonePrefix: string;
};

type FormState = {
  accountType: AccountType;
  companyNameEn: string;
  companyNameAr: string;
  contactName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  supplierType: string;
  commercialRegistration: string;
  taxNumber: string;
  licenseNumber: string;
  address: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
};

type RegisterResponse = {
  success?: boolean;
  code?: string;
  error?: string;
  user?: {
    id?: string;
    email?: string;
  };
  requiresEmailConfirmation?: boolean;
  accountStatus?: string;
};

const countries: Country[] = [
  {
    code: "SA",
    name: "Saudi Arabia",
    label: "🇸🇦 Saudi Arabia | السعودية",
    currency: "SAR",
    phonePrefix: "+966",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    label: "🇦🇪 United Arab Emirates | الإمارات",
    currency: "AED",
    phonePrefix: "+971",
  },
  {
    code: "EG",
    name: "Egypt",
    label: "🇪🇬 Egypt | مصر",
    currency: "EGP",
    phonePrefix: "+20",
  },
  {
    code: "CN",
    name: "China",
    label: "🇨🇳 China | الصين",
    currency: "CNY",
    phonePrefix: "+86",
  },
  {
    code: "TR",
    name: "Turkey",
    label: "🇹🇷 Türkiye | تركيا",
    currency: "TRY",
    phonePrefix: "+90",
  },
  {
    code: "DE",
    name: "Germany",
    label: "🇩🇪 Germany | ألمانيا",
    currency: "EUR",
    phonePrefix: "+49",
  },
  {
    code: "IT",
    name: "Italy",
    label: "🇮🇹 Italy | إيطاليا",
    currency: "EUR",
    phonePrefix: "+39",
  },
  {
    code: "FR",
    name: "France",
    label: "🇫🇷 France | فرنسا",
    currency: "EUR",
    phonePrefix: "+33",
  },
  {
    code: "ES",
    name: "Spain",
    label: "🇪🇸 Spain | إسبانيا",
    currency: "EUR",
    phonePrefix: "+34",
  },
  {
    code: "GB",
    name: "United Kingdom",
    label: "🇬🇧 United Kingdom | المملكة المتحدة",
    currency: "GBP",
    phonePrefix: "+44",
  },
  {
    code: "US",
    name: "United States",
    label: "🇺🇸 United States | الولايات المتحدة",
    currency: "USD",
    phonePrefix: "+1",
  },
  {
    code: "CA",
    name: "Canada",
    label: "🇨🇦 Canada | كندا",
    currency: "CAD",
    phonePrefix: "+1",
  },
  {
    code: "IN",
    name: "India",
    label: "🇮🇳 India | الهند",
    currency: "INR",
    phonePrefix: "+91",
  },
  {
    code: "PK",
    name: "Pakistan",
    label: "🇵🇰 Pakistan | باكستان",
    currency: "PKR",
    phonePrefix: "+92",
  },
  {
    code: "BD",
    name: "Bangladesh",
    label: "🇧🇩 Bangladesh | بنغلاديش",
    currency: "BDT",
    phonePrefix: "+880",
  },
  {
    code: "JP",
    name: "Japan",
    label: "🇯🇵 Japan | اليابان",
    currency: "JPY",
    phonePrefix: "+81",
  },
  {
    code: "KR",
    name: "South Korea",
    label: "🇰🇷 South Korea | كوريا الجنوبية",
    currency: "KRW",
    phonePrefix: "+82",
  },
  {
    code: "TW",
    name: "Taiwan",
    label: "🇹🇼 Taiwan | تايوان",
    currency: "TWD",
    phonePrefix: "+886",
  },
  {
    code: "SG",
    name: "Singapore",
    label: "🇸🇬 Singapore | سنغافورة",
    currency: "SGD",
    phonePrefix: "+65",
  },
  {
    code: "MY",
    name: "Malaysia",
    label: "🇲🇾 Malaysia | ماليزيا",
    currency: "MYR",
    phonePrefix: "+60",
  },
  {
    code: "TH",
    name: "Thailand",
    label: "🇹🇭 Thailand | تايلاند",
    currency: "THB",
    phonePrefix: "+66",
  },
  {
    code: "VN",
    name: "Vietnam",
    label: "🇻🇳 Vietnam | فيتنام",
    currency: "VND",
    phonePrefix: "+84",
  },
  {
    code: "ID",
    name: "Indonesia",
    label: "🇮🇩 Indonesia | إندونيسيا",
    currency: "IDR",
    phonePrefix: "+62",
  },
  {
    code: "KW",
    name: "Kuwait",
    label: "🇰🇼 Kuwait | الكويت",
    currency: "KWD",
    phonePrefix: "+965",
  },
  {
    code: "QA",
    name: "Qatar",
    label: "🇶🇦 Qatar | قطر",
    currency: "QAR",
    phonePrefix: "+974",
  },
  {
    code: "BH",
    name: "Bahrain",
    label: "🇧🇭 Bahrain | البحرين",
    currency: "BHD",
    phonePrefix: "+973",
  },
  {
    code: "OM",
    name: "Oman",
    label: "🇴🇲 Oman | عُمان",
    currency: "OMR",
    phonePrefix: "+968",
  },
  {
    code: "JO",
    name: "Jordan",
    label: "🇯🇴 Jordan | الأردن",
    currency: "JOD",
    phonePrefix: "+962",
  },
  {
    code: "IQ",
    name: "Iraq",
    label: "🇮🇶 Iraq | العراق",
    currency: "IQD",
    phonePrefix: "+964",
  },
  {
    code: "LB",
    name: "Lebanon",
    label: "🇱🇧 Lebanon | لبنان",
    currency: "USD",
    phonePrefix: "+961",
  },
  {
    code: "MA",
    name: "Morocco",
    label: "🇲🇦 Morocco | المغرب",
    currency: "MAD",
    phonePrefix: "+212",
  },
  {
    code: "DZ",
    name: "Algeria",
    label: "🇩🇿 Algeria | الجزائر",
    currency: "DZD",
    phonePrefix: "+213",
  },
  {
    code: "TN",
    name: "Tunisia",
    label: "🇹🇳 Tunisia | تونس",
    currency: "TND",
    phonePrefix: "+216",
  },
  {
    code: "LY",
    name: "Libya",
    label: "🇱🇾 Libya | ليبيا",
    currency: "LYD",
    phonePrefix: "+218",
  },
  {
    code: "ZA",
    name: "South Africa",
    label: "🇿🇦 South Africa | جنوب أفريقيا",
    currency: "ZAR",
    phonePrefix: "+27",
  },
  {
    code: "NG",
    name: "Nigeria",
    label: "🇳🇬 Nigeria | نيجيريا",
    currency: "NGN",
    phonePrefix: "+234",
  },
  {
    code: "KE",
    name: "Kenya",
    label: "🇰🇪 Kenya | كينيا",
    currency: "KES",
    phonePrefix: "+254",
  },
  {
    code: "GH",
    name: "Ghana",
    label: "🇬🇭 Ghana | غانا",
    currency: "GHS",
    phonePrefix: "+233",
  },
  {
    code: "ET",
    name: "Ethiopia",
    label: "🇪🇹 Ethiopia | إثيوبيا",
    currency: "ETB",
    phonePrefix: "+251",
  },
  {
    code: "NL",
    name: "Netherlands",
    label: "🇳🇱 Netherlands | هولندا",
    currency: "EUR",
    phonePrefix: "+31",
  },
  {
    code: "BE",
    name: "Belgium",
    label: "🇧🇪 Belgium | بلجيكا",
    currency: "EUR",
    phonePrefix: "+32",
  },
  {
    code: "CH",
    name: "Switzerland",
    label: "🇨🇭 Switzerland | سويسرا",
    currency: "CHF",
    phonePrefix: "+41",
  },
  {
    code: "AT",
    name: "Austria",
    label: "🇦🇹 Austria | النمسا",
    currency: "EUR",
    phonePrefix: "+43",
  },
  {
    code: "SE",
    name: "Sweden",
    label: "🇸🇪 Sweden | السويد",
    currency: "SEK",
    phonePrefix: "+46",
  },
  {
    code: "NO",
    name: "Norway",
    label: "🇳🇴 Norway | النرويج",
    currency: "NOK",
    phonePrefix: "+47",
  },
  {
    code: "DK",
    name: "Denmark",
    label: "🇩🇰 Denmark | الدنمارك",
    currency: "DKK",
    phonePrefix: "+45",
  },
  {
    code: "PL",
    name: "Poland",
    label: "🇵🇱 Poland | بولندا",
    currency: "PLN",
    phonePrefix: "+48",
  },
  {
    code: "GR",
    name: "Greece",
    label: "🇬🇷 Greece | اليونان",
    currency: "EUR",
    phonePrefix: "+30",
  },
  {
    code: "PT",
    name: "Portugal",
    label: "🇵🇹 Portugal | البرتغال",
    currency: "EUR",
    phonePrefix: "+351",
  },
  {
    code: "AL",
    name: "Albania",
    label: "🇦🇱 Albania | ألبانيا",
    currency: "ALL",
    phonePrefix: "+355",
  },
  {
    code: "GE",
    name: "Georgia",
    label: "🇬🇪 Georgia | جورجيا",
    currency: "GEL",
    phonePrefix: "+995",
  },
  {
    code: "RU",
    name: "Russia",
    label: "🇷🇺 Russia | روسيا",
    currency: "RUB",
    phonePrefix: "+7",
  },
  {
    code: "BR",
    name: "Brazil",
    label: "🇧🇷 Brazil | البرازيل",
    currency: "BRL",
    phonePrefix: "+55",
  },
  {
    code: "MX",
    name: "Mexico",
    label: "🇲🇽 Mexico | المكسيك",
    currency: "MXN",
    phonePrefix: "+52",
  },
  {
    code: "AU",
    name: "Australia",
    label: "🇦🇺 Australia | أستراليا",
    currency: "AUD",
    phonePrefix: "+61",
  },
  {
    code: "NZ",
    name: "New Zealand",
    label: "🇳🇿 New Zealand | نيوزيلندا",
    currency: "NZD",
    phonePrefix: "+64",
  },
];

const translations = {
  en: {
    title: "Global Vendor Registration",
    subtitle:
      "Join Health Nations Global Medical Marketplace as a supplier, distributor, manufacturer or pharmacy. Your account and products will be reviewed before publication.",

    globalMarketplace: "Global Marketplace",
    medicalSuppliers: "Medical Suppliers",
    manufacturers: "Manufacturers",
    pharmacies: "Pharmacies",

    accountType: "Account Type",
    pharmacy: "Pharmacy",
    medicalCompany: "Medical Company / Supplier",
    manufacturer: "Manufacturer",

    location: "Country and Location",
    country: "Country",
    city: "City / State",
    cityPlaceholder: "City / Province / State",
    fullAddress: "Full Address",
    addressPlaceholder:
      "District, street, building number, postal code",

    businessInfo: "Business Information",
    companyEnglish: "Company Name in English",
    companyArabic: "Company Name in Arabic (Optional)",
    companyPlaceholder: "Company legal name",
    arabicCompanyPlaceholder:
      "Optional for companies outside Arabic-speaking countries",

    businessType: "Business Type",
    distributor: "Distributor",
    authorizedAgent: "Authorized Agent",
    medicalTrader: "Medical Trader",
    serviceProvider: "Service Provider",

    businessRegistration: "Business Registration Number",
    commercialRegistration: "Commercial Registration Number",
    taxVat: "Tax / VAT Number",
    vatNumber: "VAT Number",
    taxCard: "Tax Card Number",
    pharmacyLicense: "Pharmacy License Number",
    medicalLicense: "Medical Activity License",
    optional: "Optional",

    registrationPlaceholder: "Business registration number",
    taxPlaceholder: "Tax / VAT number",
    licensePlaceholder:
      "Medical / business license number (optional)",

    accountManager: "Account Manager",
    contactName: "Contact Name",
    fullName: "Full name",
    email: "Business Email",
    phone: "Phone / WhatsApp",
    currency: "Default Currency",

    security: "Security",
    password: "Password",
    confirmPassword: "Confirm Password",
    passwordPlaceholder: "Minimum 8 characters",
    confirmPasswordPlaceholder: "Repeat password",

    terms:
      "I agree to the platform terms of use, confirm that the business information provided is accurate, and understand that the account and products will not appear publicly until reviewed by Health Nations.",

    create: "Create Global Vendor Account",
    creating: "Creating account...",

    pending:
      "New vendor accounts remain Pending Approval until reviewed by Health Nations administration.",

    successTitle: "Registration successful",
    successMessage:
      "Your account has been created successfully. Please check your email to confirm your account. Your vendor account will remain under review until approved by Health Nations.",

    passwordsMismatch: "Passwords do not match.",
    passwordLength: "Password must contain at least 8 characters.",
    acceptTermsError:
      "You must accept the terms and usage policy before registration.",

    alreadyRegistered:
      "This email address is already registered.",
    invalidEmail:
      "Please enter a valid email address.",
    invalidPassword:
      "The password is not accepted. Please use at least 8 characters.",
    rateLimit:
      "Too many attempts. Please wait and try again.",
    connectionError:
      "Unable to connect to the registration service. Check your internet connection and try again.",
    unexpectedError:
      "An unexpected error occurred while creating the account.",

    language: "Language",
  },

  ar: {
    title: "تسجيل الموردين عالميًا",
    subtitle:
      "انضم إلى السوق الطبي العالمي لمنصة صحة الأمم كمورد أو موزع أو مصنع أو صيدلية. تتم مراجعة الحساب والمنتجات قبل ظهورها على المنصة.",

    globalMarketplace: "السوق العالمي",
    medicalSuppliers: "الموردون الطبيون",
    manufacturers: "المصنعون",
    pharmacies: "الصيدليات",

    accountType: "نوع الحساب",
    pharmacy: "صيدلية",
    medicalCompany: "شركة طبية / مورد",
    manufacturer: "مصنع",

    location: "الدولة والموقع",
    country: "الدولة",
    city: "المدينة / الولاية",
    cityPlaceholder: "المدينة / المحافظة / الولاية",
    fullAddress: "العنوان بالتفصيل",
    addressPlaceholder:
      "الحي، الشارع، رقم المبنى، الرمز البريدي",

    businessInfo: "بيانات المنشأة",
    companyEnglish: "اسم المنشأة بالإنجليزية",
    companyArabic: "اسم المنشأة بالعربية (اختياري)",
    companyPlaceholder: "الاسم القانوني للمنشأة",
    arabicCompanyPlaceholder:
      "اختياري للشركات خارج الدول العربية",

    businessType: "نوع النشاط",
    distributor: "موزع",
    authorizedAgent: "وكيل معتمد",
    medicalTrader: "تاجر أجهزة طبية",
    serviceProvider: "مقدم خدمات",

    businessRegistration: "رقم تسجيل المنشأة",
    commercialRegistration: "رقم السجل التجاري",
    taxVat: "الرقم الضريبي / VAT",
    vatNumber: "الرقم الضريبي",
    taxCard: "رقم البطاقة الضريبية",
    pharmacyLicense: "رقم ترخيص الصيدلية",
    medicalLicense: "ترخيص النشاط الطبي",
    optional: "اختياري",

    registrationPlaceholder: "أدخل رقم تسجيل المنشأة",
    taxPlaceholder: "أدخل الرقم الضريبي",
    licensePlaceholder:
      "رقم الترخيص الطبي / التجاري - اختياري",

    accountManager: "بيانات مسؤول الحساب",
    contactName: "اسم المسؤول",
    fullName: "الاسم بالكامل",
    email: "البريد الإلكتروني للعمل",
    phone: "الهاتف / واتساب",
    currency: "العملة الافتراضية",

    security: "بيانات الدخول",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    passwordPlaceholder: "8 أحرف على الأقل",
    confirmPasswordPlaceholder: "أعد كتابة كلمة المرور",

    terms:
      "أوافق على شروط استخدام المنصة، وأؤكد صحة بيانات المنشأة، وأتفهم أن الحساب والمنتجات لن تظهر للعامة قبل مراجعة إدارة Health Nations.",

    create: "إنشاء حساب المورد",
    creating: "جاري إنشاء الحساب...",

    pending:
      "تظل حسابات الموردين الجديدة قيد المراجعة حتى تعتمدها إدارة Health Nations.",

    successTitle: "تم التسجيل بنجاح",
    successMessage:
      "تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني لتأكيد الحساب. سيظل حساب المورد قيد المراجعة حتى توافق عليه إدارة Health Nations.",

    passwordsMismatch: "كلمتا المرور غير متطابقتين.",
    passwordLength: "يجب أن تكون كلمة المرور 8 أحرف على الأقل.",
    acceptTermsError:
      "يجب الموافقة على الشروط وسياسة الاستخدام قبل التسجيل.",

    alreadyRegistered:
      "هذا البريد الإلكتروني مسجل بالفعل.",
    invalidEmail: "البريد الإلكتروني غير صحيح.",
    invalidPassword:
      "كلمة المرور غير مقبولة. استخدم 8 أحرف على الأقل.",
    rateLimit:
      "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.",
    connectionError:
      "تعذر الاتصال بخدمة التسجيل. تحقق من اتصال الإنترنت ثم حاول مرة أخرى.",
    unexpectedError:
      "حدث خطأ غير متوقع أثناء إنشاء الحساب.",

    language: "اللغة",
  },

  zh: {
    title: "全球供应商注册",
    subtitle:
      "加入 Health Nations 全球医疗市场，成为供应商、经销商、制造商或药房。账户和产品将在发布前接受审核。",

    globalMarketplace: "全球市场",
    medicalSuppliers: "医疗供应商",
    manufacturers: "制造商",
    pharmacies: "药房",

    accountType: "账户类型",
    pharmacy: "药房",
    medicalCompany: "医疗公司 / 供应商",
    manufacturer: "制造商",

    location: "国家和地址",
    country: "国家",
    city: "城市 / 州 / 省",
    cityPlaceholder: "城市 / 省 / 州",
    fullAddress: "详细地址",
    addressPlaceholder: "地区、街道、建筑号、邮政编码",

    businessInfo: "企业信息",
    companyEnglish: "公司英文名称",
    companyArabic: "公司阿拉伯语名称（可选）",
    companyPlaceholder: "公司法定名称",
    arabicCompanyPlaceholder:
      "非阿拉伯语国家的公司可选",

    businessType: "业务类型",
    distributor: "经销商",
    authorizedAgent: "授权代理商",
    medicalTrader: "医疗器械贸易商",
    serviceProvider: "服务提供商",

    businessRegistration: "企业注册号",
    commercialRegistration: "商业注册号",
    taxVat: "税号 / VAT",
    vatNumber: "VAT 税号",
    taxCard: "税务登记号",
    pharmacyLicense: "药房许可证编号",
    medicalLicense: "医疗业务许可证",
    optional: "可选",

    registrationPlaceholder: "企业注册号",
    taxPlaceholder: "税号 / VAT",
    licensePlaceholder:
      "医疗 / 企业许可证编号（可选）",

    accountManager: "账户负责人",
    contactName: "联系人姓名",
    fullName: "全名",
    email: "企业电子邮箱",
    phone: "电话 / WhatsApp",
    currency: "默认货币",

    security: "账户安全",
    password: "密码",
    confirmPassword: "确认密码",
    passwordPlaceholder: "至少 8 个字符",
    confirmPasswordPlaceholder: "再次输入密码",

    terms:
      "我同意平台使用条款，并确认所提供的企业信息准确无误。我理解，在 Health Nations 审核通过之前，账户和产品不会公开显示。",

    create: "创建全球供应商账户",
    creating: "正在创建账户...",

    pending:
      "新的供应商账户将在 Health Nations 管理团队审核通过之前保持待审核状态。",

    successTitle: "注册成功",
    successMessage:
      "账户已成功创建。请检查您的电子邮箱并完成账户确认。供应商账户将在 Health Nations 审核通过之前保持待审核状态。",

    passwordsMismatch: "两次输入的密码不一致。",
    passwordLength: "密码必须至少包含 8 个字符。",
    acceptTermsError:
      "注册前必须同意使用条款和政策。",

    alreadyRegistered: "该电子邮箱已注册。",
    invalidEmail: "请输入有效的电子邮箱地址。",
    invalidPassword:
      "密码无效，请至少使用 8 个字符。",
    rateLimit:
      "尝试次数过多，请稍后再试。",
    connectionError:
      "无法连接到注册服务。请检查网络连接后重试。",
    unexpectedError:
      "创建账户时发生意外错误。",

    language: "语言",
  },

  tr: {
    title: "Global Tedarikçi Kaydı",
    subtitle:
      "Health Nations Küresel Medikal Pazarı'na tedarikçi, distribütör, üretici veya eczane olarak katılın. Hesabınız ve ürünleriniz yayınlanmadan önce incelenecektir.",

    globalMarketplace: "Küresel Pazar",
    medicalSuppliers: "Medikal Tedarikçiler",
    manufacturers: "Üreticiler",
    pharmacies: "Eczaneler",

    accountType: "Hesap Türü",
    pharmacy: "Eczane",
    medicalCompany: "Medikal Şirket / Tedarikçi",
    manufacturer: "Üretici",

    location: "Ülke ve Konum",
    country: "Ülke",
    city: "Şehir / Eyalet",
    cityPlaceholder: "Şehir / İl / Eyalet",
    fullAddress: "Açık Adres",
    addressPlaceholder:
      "Bölge, sokak, bina numarası, posta kodu",

    businessInfo: "Şirket Bilgileri",
    companyEnglish: "İngilizce Şirket Adı",
    companyArabic: "Arapça Şirket Adı (İsteğe Bağlı)",
    companyPlaceholder: "Şirketin yasal adı",
    arabicCompanyPlaceholder:
      "Arapça konuşulmayan ülkelerdeki şirketler için isteğe bağlı",

    businessType: "Faaliyet Türü",
    distributor: "Distribütör",
    authorizedAgent: "Yetkili Temsilci",
    medicalTrader: "Medikal Ürün Satıcısı",
    serviceProvider: "Hizmet Sağlayıcı",

    businessRegistration: "Şirket Kayıt Numarası",
    commercialRegistration: "Ticaret Sicil Numarası",
    taxVat: "Vergi / KDV Numarası",
    vatNumber: "KDV Numarası",
    taxCard: "Vergi Kayıt Numarası",
    pharmacyLicense: "Eczane Ruhsat Numarası",
    medicalLicense: "Medikal Faaliyet Ruhsatı",
    optional: "İsteğe Bağlı",

    registrationPlaceholder: "Şirket kayıt numarası",
    taxPlaceholder: "Vergi / KDV numarası",
    licensePlaceholder:
      "Medikal / işletme ruhsat numarası (isteğe bağlı)",

    accountManager: "Hesap Yetkilisi",
    contactName: "Yetkili Adı",
    fullName: "Ad Soyad",
    email: "Kurumsal E-posta",
    phone: "Telefon / WhatsApp",
    currency: "Varsayılan Para Birimi",

    security: "Güvenlik",
    password: "Şifre",
    confirmPassword: "Şifreyi Onayla",
    passwordPlaceholder: "En az 8 karakter",
    confirmPasswordPlaceholder: "Şifreyi tekrar girin",

    terms:
      "Platform kullanım koşullarını kabul ediyorum, sağladığım şirket bilgilerinin doğru olduğunu onaylıyorum ve hesap ile ürünlerin Health Nations tarafından incelenmeden herkese açık olmayacağını anlıyorum.",

    create: "Global Tedarikçi Hesabı Oluştur",
    creating: "Hesap oluşturuluyor...",

    pending:
      "Yeni tedarikçi hesapları Health Nations yönetimi tarafından incelenene kadar Onay Bekliyor durumunda kalır.",

    successTitle: "Kayıt başarılı",
    successMessage:
      "Hesabınız başarıyla oluşturuldu. Hesabınızı doğrulamak için e-postanızı kontrol edin. Tedarikçi hesabınız Health Nations tarafından onaylanana kadar incelemede kalacaktır.",

    passwordsMismatch: "Şifreler eşleşmiyor.",
    passwordLength: "Şifre en az 8 karakter olmalıdır.",
    acceptTermsError:
      "Kayıttan önce kullanım koşullarını kabul etmelisiniz.",

    alreadyRegistered:
      "Bu e-posta adresi zaten kayıtlı.",
    invalidEmail:
      "Geçerli bir e-posta adresi girin.",
    invalidPassword:
      "Şifre kabul edilmedi. En az 8 karakter kullanın.",
    rateLimit:
      "Çok fazla deneme yapıldı. Bir süre bekleyip tekrar deneyin.",
    connectionError:
      "Kayıt hizmetine bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
    unexpectedError:
      "Hesap oluşturulurken beklenmeyen bir hata oluştu.",

    language: "Dil",
  },
} satisfies Record<
  Language,
  Record<string, string>
>;

const initialForm: FormState = {
  accountType: "medical_supplier",
  companyNameEn: "",
  companyNameAr: "",
  contactName: "",
  email: "",
  phone: "",
  country: "SA",
  city: "",
  supplierType: "distributor",
  commercialRegistration: "",
  taxNumber: "",
  licenseNumber: "",
  address: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export default function SupplierRegisterPage() {
  const {
    language,
    setLanguage,
    isArabic,
  } = useLanguage();

  const t = translations[language];

  const [loading, setLoading] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [form, setForm] =
    useState<FormState>(initialForm);

  const selectedCountry =
    countries.find(
      (country) =>
        country.code === form.country
    ) ?? countries[0];

  const registrationLabel =
    form.country === "SA" ||
    form.country === "EG"
      ? t.commercialRegistration
      : t.businessRegistration;

  const taxLabel =
    form.country === "SA"
      ? t.vatNumber
      : form.country === "EG"
        ? t.taxCard
        : t.taxVat;

  const licenseLabel =
    form.accountType === "pharmacy"
      ? t.pharmacyLicense
      : t.medicalLicense;

  function updateField(
    event: React.ChangeEvent<
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
    >
  ) {
    const {
      name,
      value,
      type,
    } = event.target;

    const newValue =
      type === "checkbox"
        ? (
            event.target as HTMLInputElement
          ).checked
        : value;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: newValue,

      ...(name === "country"
        ? { city: "" }
        : {}),
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccess(false);

    try {
      if (
        form.password !==
        form.confirmPassword
      ) {
        setErrorMessage(
          t.passwordsMismatch
        );
        return;
      }

      if (form.password.length < 8) {
        setErrorMessage(
          t.passwordLength
        );
        return;
      }

      if (!form.acceptTerms) {
        setErrorMessage(
          t.acceptTermsError
        );
        return;
      }

      const email =
        form.email.trim().toLowerCase();

      const companyNameEn =
        form.companyNameEn.trim();

      const companyNameAr =
        form.companyNameAr.trim();

      const contactName =
        form.contactName.trim();

      const phone =
        form.phone.trim();

      const city =
        form.city.trim();

      const address =
        form.address.trim();

      const commercialRegistration =
        form.commercialRegistration.trim();

      const taxNumber =
        form.taxNumber.trim();

      const licenseNumber =
        form.licenseNumber.trim();

      const supplierType =
        form.accountType === "pharmacy"
          ? "pharmacy"
          : form.accountType ===
              "manufacturer"
            ? "manufacturer"
            : form.supplierType;

      const response = await fetch(
        "/api/supplier/register",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password: form.password,

            accountType:
              form.accountType,

            companyNameEn,
            companyNameAr,

            contactName,
            phone,

            countryCode:
              selectedCountry.code,

            countryName:
              selectedCountry.name,

            city,

            currency:
              selectedCountry.currency,

            supplierType,

            commercialRegistration,
            taxNumber,

            licenseNumber:
              licenseNumber || null,

            address,
          }),
        }
      );

      let result: RegisterResponse;

      try {
        result =
          (await response.json()) as RegisterResponse;
      } catch {
        setErrorMessage(
          t.connectionError
        );
        return;
      }

      if (
        !response.ok ||
        !result.success
      ) {
        if (
          result.code ===
          "ALREADY_REGISTERED"
        ) {
          setErrorMessage(
            t.alreadyRegistered
          );
          return;
        }

        if (
          result.code ===
          "INVALID_EMAIL"
        ) {
          setErrorMessage(
            t.invalidEmail
          );
          return;
        }

        if (
          result.code ===
          "INVALID_PASSWORD"
        ) {
          setErrorMessage(
            t.invalidPassword
          );
          return;
        }

        if (
          result.code ===
          "RATE_LIMIT"
        ) {
          setErrorMessage(
            t.rateLimit
          );
          return;
        }

        setErrorMessage(
          result.error ||
            t.unexpectedError
        );

        return;
      }

      setSuccess(true);

      setForm({
        ...initialForm,
        country: form.country,
        accountType:
          form.accountType,
      });
    } catch (error) {
      console.warn(
        "Supplier registration request failed:",
        error
      );

      setErrorMessage(
        error instanceof TypeError
          ? t.connectionError
          : t.unexpectedError
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      dir={isArabic ? "rtl" : "ltr"}
      className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6"
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex justify-end">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
            <Globe2 className="h-4 w-4 text-blue-700" />

            <select
              aria-label={t.language}
              value={language}
              onChange={(event) =>
                setLanguage(
                  event.target
                    .value as Language
                )
              }
              className="bg-transparent py-2.5 text-sm font-bold outline-none"
            >
              <option value="ar">
                🇸🇦 العربية
              </option>

              <option value="en">
                🇬🇧 English
              </option>

              <option value="zh">
                🇨🇳 中文
              </option>

              <option value="tr">
                🇹🇷 Türkçe
              </option>
            </select>
          </div>
        </div>

        <header className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-700 to-teal-500 text-white shadow-lg">
            <Globe2 size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-black md:text-5xl">
            {t.title}
          </h1>

          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">
            {t.subtitle}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-sm">
            <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              🌍 {t.globalMarketplace}
            </span>

            <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              🏥 {t.medicalSuppliers}
            </span>

            <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              🏭 {t.manufacturers}
            </span>

            <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              💊 {t.pharmacies}
            </span>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10"
        >
          <SectionTitle
            number="1"
            title={t.accountType}
          />

          <div className="grid gap-4 md:grid-cols-3">
            <AccountTypeCard
              selected={
                form.accountType ===
                "pharmacy"
              }
              icon={<Store size={25} />}
              title={t.pharmacy}
              isArabic={isArabic}
              onClick={() =>
                setForm(
                  (currentForm) => ({
                    ...currentForm,
                    accountType:
                      "pharmacy",
                    supplierType:
                      "pharmacy",
                  })
                )
              }
            />

            <AccountTypeCard
              selected={
                form.accountType ===
                "medical_supplier"
              }
              icon={
                <Building2 size={25} />
              }
              title={t.medicalCompany}
              isArabic={isArabic}
              onClick={() =>
                setForm(
                  (currentForm) => ({
                    ...currentForm,
                    accountType:
                      "medical_supplier",
                    supplierType:
                      currentForm.supplierType ===
                        "pharmacy" ||
                      currentForm.supplierType ===
                        "manufacturer"
                        ? "distributor"
                        : currentForm.supplierType,
                  })
                )
              }
            />

            <AccountTypeCard
              selected={
                form.accountType ===
                "manufacturer"
              }
              icon={
                <Building2 size={25} />
              }
              title={t.manufacturer}
              isArabic={isArabic}
              onClick={() =>
                setForm(
                  (currentForm) => ({
                    ...currentForm,
                    accountType:
                      "manufacturer",
                    supplierType:
                      "manufacturer",
                  })
                )
              }
            />
          </div>

          <Divider />

          <SectionTitle
            number="2"
            title={t.location}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={<Globe2 size={18} />}
              label={t.country}
            >
              <select
                required
                name="country"
                value={form.country}
                onChange={updateField}
                className="form-input"
              >
                {countries.map(
                  (country) => (
                    <option
                      key={country.code}
                      value={country.code}
                    >
                      {country.label}
                    </option>
                  )
                )}
              </select>
            </Field>

            <Field
              icon={<MapPin size={18} />}
              label={t.city}
            >
              <input
                required
                name="city"
                value={form.city}
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.cityPlaceholder
                }
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                icon={
                  <MapPin size={18} />
                }
                label={t.fullAddress}
              >
                <textarea
                  required
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  className="form-input min-h-28 resize-y"
                  placeholder={
                    t.addressPlaceholder
                  }
                />
              </Field>
            </div>
          </div>

          <Divider />

          <SectionTitle
            number="3"
            title={t.businessInfo}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={
                <Building2 size={18} />
              }
              label={t.companyEnglish}
            >
              <input
                required
                name="companyNameEn"
                value={form.companyNameEn}
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.companyPlaceholder
                }
                dir="ltr"
              />
            </Field>

            <Field
              icon={
                <Building2 size={18} />
              }
              label={t.companyArabic}
            >
              <input
                name="companyNameAr"
                value={form.companyNameAr}
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.arabicCompanyPlaceholder
                }
                dir="rtl"
              />
            </Field>

            {form.accountType !==
              "pharmacy" && (
              <Field
                icon={
                  <Building2
                    size={18}
                  />
                }
                label={t.businessType}
              >
                <select
                  name="supplierType"
                  value={
                    form.supplierType
                  }
                  onChange={updateField}
                  className="form-input"
                  disabled={
                    form.accountType ===
                    "manufacturer"
                  }
                >
                  <option value="manufacturer">
                    {t.manufacturer}
                  </option>

                  <option value="distributor">
                    {t.distributor}
                  </option>

                  <option value="authorized_agent">
                    {t.authorizedAgent}
                  </option>

                  <option value="medical_trader">
                    {t.medicalTrader}
                  </option>

                  <option value="service_provider">
                    {t.serviceProvider}
                  </option>
                </select>
              </Field>
            )}

            <Field
              icon={
                <FileText size={18} />
              }
              label={registrationLabel}
            >
              <input
                required
                name="commercialRegistration"
                value={
                  form.commercialRegistration
                }
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.registrationPlaceholder
                }
              />
            </Field>

            <Field
              icon={
                <FileText size={18} />
              }
              label={taxLabel}
            >
              <input
                required
                name="taxNumber"
                value={form.taxNumber}
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.taxPlaceholder
                }
              />
            </Field>

            <Field
              icon={
                <FileText size={18} />
              }
              label={`${licenseLabel} (${t.optional})`}
            >
              <input
                name="licenseNumber"
                value={
                  form.licenseNumber
                }
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.licensePlaceholder
                }
              />
            </Field>
          </div>

          <Divider />

          <SectionTitle
            number="4"
            title={t.accountManager}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={<User size={18} />}
              label={t.contactName}
            >
              <input
                required
                name="contactName"
                value={form.contactName}
                onChange={updateField}
                className="form-input"
                placeholder={t.fullName}
              />
            </Field>

            <Field
              icon={<Mail size={18} />}
              label={t.email}
            >
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                className="form-input"
                placeholder="sales@company.com"
                autoComplete="email"
                dir="ltr"
              />
            </Field>

            <Field
              icon={<Phone size={18} />}
              label={t.phone}
            >
              <input
                required
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateField}
                className="form-input"
                placeholder={`${selectedCountry.phonePrefix} ...`}
                autoComplete="tel"
                dir="ltr"
              />
            </Field>

            <Field
              icon={<Globe2 size={18} />}
              label={t.currency}
            >
              <input
                readOnly
                value={
                  selectedCountry.currency
                }
                className="form-input bg-slate-50 font-bold text-slate-600"
                dir="ltr"
              />
            </Field>
          </div>

          <Divider />

          <SectionTitle
            number="5"
            title={t.security}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={
                <LockKeyhole
                  size={18}
                />
              }
              label={t.password}
            >
              <input
                required
                type="password"
                minLength={8}
                name="password"
                value={form.password}
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.passwordPlaceholder
                }
                autoComplete="new-password"
              />
            </Field>

            <Field
              icon={
                <LockKeyhole
                  size={18}
                />
              }
              label={t.confirmPassword}
            >
              <input
                required
                type="password"
                minLength={8}
                name="confirmPassword"
                value={
                  form.confirmPassword
                }
                onChange={updateField}
                className="form-input"
                placeholder={
                  t.confirmPasswordPlaceholder
                }
                autoComplete="new-password"
              />
            </Field>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input
              required
              type="checkbox"
              name="acceptTerms"
              checked={
                form.acceptTerms
              }
              onChange={updateField}
              className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300"
            />

            <span className="text-sm leading-6 text-slate-700">
              {t.terms}
            </span>
          </label>

          {errorMessage && (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 font-medium text-red-700"
            >
              {errorMessage}
            </div>
          )}

          {success && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <CheckCircle2 className="mt-0.5 shrink-0" />

              <div>
                <strong className="block text-lg">
                  {t.successTitle}
                </strong>

                <span className="mt-1 block leading-6">
                  {t.successMessage}
                </span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-4 text-lg font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={20}
                />

                {t.creating}
              </>
            ) : (
              t.create
            )}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            {t.pending}
          </p>
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
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease;
        }

        .form-input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px
            rgba(29, 78, 216, 0.1);
        }

        .form-input:disabled {
          background: #f8fafc;
          color: #64748b;
          cursor: not-allowed;
        }
      `}</style>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
        {icon}
        {label}
      </span>

      {children}
    </label>
  );
}

function SectionTitle({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
        {number}
      </span>

      <h3 className="text-lg font-black text-slate-900">
        {title}
      </h3>
    </div>
  );
}

function AccountTypeCard({
  selected,
  icon,
  title,
  onClick,
  isArabic,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  isArabic: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 transition ${
        isArabic
          ? "text-right"
          : "text-left"
      } ${
        selected
          ? "border-blue-700 bg-blue-50 text-blue-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
      }`}
    >
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
          selected
            ? "bg-blue-700 text-white"
            : "bg-slate-100"
        }`}
      >
        {icon}
      </div>

      <strong className="block">
        {title}
      </strong>
    </button>
  );
}

function Divider() {
  return (
    <div className="my-8 border-t border-slate-200" />
  );
}