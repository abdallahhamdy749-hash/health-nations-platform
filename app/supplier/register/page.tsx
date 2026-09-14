"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type CountryCode = "SA" | "EG";
type AccountType = "pharmacy" | "medical_supplier" | "manufacturer";

type FormState = {
  accountType: AccountType;
  companyNameEn: string;
  companyNameAr: string;
  contactName: string;
  email: string;
  phone: string;
  country: CountryCode;
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

const citiesByCountry: Record<
  CountryCode,
  Array<{ value: string; label: string }>
> = {
  SA: [
    { value: "riyadh", label: "الرياض | Riyadh" },
    { value: "jeddah", label: "جدة | Jeddah" },
    { value: "makkah", label: "مكة المكرمة | Makkah" },
    { value: "madinah", label: "المدينة المنورة | Madinah" },
    { value: "dammam", label: "الدمام | Dammam" },
    { value: "khobar", label: "الخبر | Al Khobar" },
    { value: "dhahran", label: "الظهران | Dhahran" },
    { value: "tabuk", label: "تبوك | Tabuk" },
    { value: "abha", label: "أبها | Abha" },
    { value: "qassim", label: "القصيم | Al Qassim" },
    { value: "taif", label: "الطائف | Taif" },
    { value: "other_sa", label: "مدينة أخرى | Other" },
  ],
  EG: [
    { value: "cairo", label: "القاهرة | Cairo" },
    { value: "giza", label: "الجيزة | Giza" },
    { value: "alexandria", label: "الإسكندرية | Alexandria" },
    { value: "dakahlia", label: "الدقهلية | Dakahlia" },
    { value: "sharqia", label: "الشرقية | Sharqia" },
    { value: "gharbia", label: "الغربية | Gharbia" },
    { value: "monufia", label: "المنوفية | Monufia" },
    { value: "beheira", label: "البحيرة | Beheira" },
    { value: "qalyubia", label: "القليوبية | Qalyubia" },
    { value: "fayoum", label: "الفيوم | Fayoum" },
    { value: "beni_suef", label: "بني سويف | Beni Suef" },
    { value: "minya", label: "المنيا | Minya" },
    { value: "assiut", label: "أسيوط | Assiut" },
    { value: "sohag", label: "سوهاج | Sohag" },
    { value: "qena", label: "قنا | Qena" },
    { value: "luxor", label: "الأقصر | Luxor" },
    { value: "aswan", label: "أسوان | Aswan" },
    { value: "sadat_city", label: "مدينة السادات | Sadat City" },
    { value: "other_eg", label: "محافظة أخرى | Other" },
  ],
};

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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);

  const availableCities = useMemo(
    () => citiesByCountry[form.country],
    [form.country]
  );

  const countryName =
    form.country === "SA" ? "Saudi Arabia" : "Egypt";

  const currency = form.country === "SA" ? "SAR" : "EGP";

  const registrationLabel =
    form.country === "SA"
      ? "Commercial Registration Number | رقم السجل التجاري"
      : "Commercial Registration Number | رقم السجل التجاري";

  const taxLabel =
    form.country === "SA"
      ? "VAT Number | الرقم الضريبي"
      : "Tax Card Number | رقم البطاقة الضريبية";

  const licenseLabel =
    form.accountType === "pharmacy"
      ? "Pharmacy License Number | رقم ترخيص الصيدلية"
      : "Medical Activity License | رقم ترخيص النشاط الطبي";

  function updateField(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value, type } = event.target;

    const newValue =
      type === "checkbox"
        ? (event.target as HTMLInputElement).checked
        : value;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: newValue,
      ...(name === "country" ? { city: "" } : {}),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccess(false);

    if (form.password !== form.confirmPassword) {
      setErrorMessage(
        "كلمتا المرور غير متطابقتين. Passwords do not match."
      );
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setErrorMessage(
        "يجب أن تكون كلمة المرور 8 أحرف على الأقل."
      );
      setLoading(false);
      return;
    }

    if (!form.acceptTerms) {
      setErrorMessage(
        "يجب الموافقة على الشروط وسياسة الاستخدام قبل التسجيل."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          role: "vendor",
          account_type: form.accountType,
          account_status: "pending",

          company_name_en: form.companyNameEn.trim(),
          company_name_ar: form.companyNameAr.trim(),
          contact_name: form.contactName.trim(),

          phone: form.phone.trim(),

          country_code: form.country,
          country_name: countryName,
          city: form.city,
          currency,

          supplier_type:
            form.accountType === "pharmacy"
              ? "pharmacy"
              : form.supplierType,

          commercial_registration:
            form.commercialRegistration.trim(),

          tax_number: form.taxNumber.trim(),
          license_number: form.licenseNumber.trim(),
          address: form.address.trim(),

          is_verified: false,
          can_publish_products: false,
        },
      },
    });

    if (error) {
      setErrorMessage(translateSupabaseError(error.message));
      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage(
        "لم يتم إنشاء الحساب. برجاء المحاولة مرة أخرى."
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    setForm({
      ...initialForm,
      country: form.country,
      accountType: form.accountType,
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-700 to-teal-500 text-white shadow-lg">
            <Building2 size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-black md:text-5xl">
            Vendor Registration
          </h1>

          <h2 className="mt-2 text-2xl font-bold text-blue-700">
            تسجيل صيدلية أو شركة طبية
          </h2>

          <p className="mx-auto mt-4 max-w-3xl leading-7 text-slate-600">
            سجّل نشاطك في منصة Health Nations، ثم أضف المنتجات
            والأسعار والمخزون بعد مراجعة الإدارة والموافقة على الحساب.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              🇸🇦 Saudi Arabia
            </span>

            <span className="rounded-full bg-white px-4 py-2 font-semibold shadow-sm">
              🇪🇬 Egypt
            </span>
          </div>
        </header>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-white p-6 shadow-sm md:p-10"
        >
          <SectionTitle
            number="1"
            title="Account Type"
            arabicTitle="نوع الحساب"
          />

          <div className="grid gap-4 md:grid-cols-3">
            <AccountTypeCard
              selected={form.accountType === "pharmacy"}
              icon={<Store size={25} />}
              title="Pharmacy"
              arabicTitle="صيدلية"
              onClick={() =>
                setForm((currentForm) => ({
                  ...currentForm,
                  accountType: "pharmacy",
                  supplierType: "pharmacy",
                }))
              }
            />

            <AccountTypeCard
              selected={form.accountType === "medical_supplier"}
              icon={<Building2 size={25} />}
              title="Medical Company"
              arabicTitle="شركة أجهزة طبية"
              onClick={() =>
                setForm((currentForm) => ({
                  ...currentForm,
                  accountType: "medical_supplier",
                  supplierType:
                    currentForm.supplierType === "pharmacy"
                      ? "distributor"
                      : currentForm.supplierType,
                }))
              }
            />

            <AccountTypeCard
              selected={form.accountType === "manufacturer"}
              icon={<Building2 size={25} />}
              title="Manufacturer"
              arabicTitle="مصنع"
              onClick={() =>
                setForm((currentForm) => ({
                  ...currentForm,
                  accountType: "manufacturer",
                  supplierType: "manufacturer",
                }))
              }
            />
          </div>

          <div className="my-8 border-t border-slate-200" />

          <SectionTitle
            number="2"
            title="Country and Location"
            arabicTitle="الدولة والموقع"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field icon={<MapPin size={18} />} label="Country | الدولة">
              <select
                required
                name="country"
                value={form.country}
                onChange={updateField}
                className="form-input"
              >
                <option value="SA">🇸🇦 Saudi Arabia | السعودية</option>
                <option value="EG">🇪🇬 Egypt | مصر</option>
              </select>
            </Field>

            <Field icon={<MapPin size={18} />} label="City | المدينة">
              <select
                required
                name="city"
                value={form.city}
                onChange={updateField}
                className="form-input"
              >
                <option value="">اختر المدينة | Select city</option>

                {availableCities.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field
                icon={<MapPin size={18} />}
                label="Full Address | العنوان بالتفصيل"
              >
                <textarea
                  required
                  name="address"
                  value={form.address}
                  onChange={updateField}
                  className="form-input min-h-28 resize-y"
                  placeholder="District, street, building number | الحي، الشارع، رقم المبنى"
                />
              </Field>
            </div>
          </div>

          <div className="my-8 border-t border-slate-200" />

          <SectionTitle
            number="3"
            title="Business Information"
            arabicTitle="بيانات المنشأة"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={<Building2 size={18} />}
              label="Company Name in English"
            >
              <input
                required
                name="companyNameEn"
                value={form.companyNameEn}
                onChange={updateField}
                className="form-input"
                placeholder={
                  form.accountType === "pharmacy"
                    ? "Al Noor Pharmacy"
                    : "Health Medical Supplies"
                }
              />
            </Field>

            <Field
              icon={<Building2 size={18} />}
              label="اسم المنشأة بالعربية"
            >
              <input
                required
                name="companyNameAr"
                value={form.companyNameAr}
                onChange={updateField}
                className="form-input"
                placeholder={
                  form.accountType === "pharmacy"
                    ? "صيدلية النور"
                    : "شركة المستلزمات الطبية"
                }
                dir="rtl"
              />
            </Field>

            {form.accountType !== "pharmacy" && (
              <Field
                icon={<Building2 size={18} />}
                label="Business Type | نوع النشاط"
              >
                <select
                  name="supplierType"
                  value={form.supplierType}
                  onChange={updateField}
                  className="form-input"
                >
                  <option value="manufacturer">
                    Manufacturer | مصنع
                  </option>

                  <option value="distributor">
                    Distributor | موزع
                  </option>

                  <option value="authorized_agent">
                    Authorized Agent | وكيل معتمد
                  </option>

                  <option value="medical_trader">
                    Medical Trader | تاجر أجهزة طبية
                  </option>

                  <option value="service_provider">
                    Service Provider | مقدم خدمات
                  </option>
                </select>
              </Field>
            )}

            <Field
              icon={<FileText size={18} />}
              label={registrationLabel}
            >
              <input
                required
                name="commercialRegistration"
                value={form.commercialRegistration}
                onChange={updateField}
                className="form-input"
                placeholder="Commercial registration number"
              />
            </Field>

            <Field icon={<FileText size={18} />} label={taxLabel}>
              <input
                required
                name="taxNumber"
                value={form.taxNumber}
                onChange={updateField}
                className="form-input"
                placeholder={
                  form.country === "SA"
                    ? "15-digit VAT number"
                    : "Tax card number"
                }
              />
            </Field>

            <Field icon={<FileText size={18} />} label={licenseLabel}>
              <input
                required
                name="licenseNumber"
                value={form.licenseNumber}
                onChange={updateField}
                className="form-input"
                placeholder="License number"
              />
            </Field>
          </div>

          <div className="my-8 border-t border-slate-200" />

          <SectionTitle
            number="4"
            title="Account Manager"
            arabicTitle="بيانات مسؤول الحساب"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={<User size={18} />}
              label="Contact Name | اسم المسؤول"
            >
              <input
                required
                name="contactName"
                value={form.contactName}
                onChange={updateField}
                className="form-input"
                placeholder="Full name | الاسم بالكامل"
              />
            </Field>

            <Field
              icon={<Mail size={18} />}
              label="Business Email | البريد الإلكتروني"
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
              />
            </Field>

            <Field
              icon={<Phone size={18} />}
              label="Phone Number | رقم الهاتف"
            >
              <input
                required
                type="tel"
                name="phone"
                value={form.phone}
                onChange={updateField}
                className="form-input"
                placeholder={
                  form.country === "SA"
                    ? "+966 5X XXX XXXX"
                    : "+20 1X XXXX XXXX"
                }
                autoComplete="tel"
              />
            </Field>
          </div>

          <div className="my-8 border-t border-slate-200" />

          <SectionTitle
            number="5"
            title="Security"
            arabicTitle="بيانات الدخول"
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              icon={<LockKeyhole size={18} />}
              label="Password | كلمة المرور"
            >
              <input
                required
                type="password"
                minLength={8}
                name="password"
                value={form.password}
                onChange={updateField}
                className="form-input"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </Field>

            <Field
              icon={<LockKeyhole size={18} />}
              label="Confirm Password | تأكيد كلمة المرور"
            >
              <input
                required
                type="password"
                minLength={8}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={updateField}
                className="form-input"
                placeholder="Repeat password"
                autoComplete="new-password"
              />
            </Field>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4">
            <input
              required
              type="checkbox"
              name="acceptTerms"
              checked={form.acceptTerms}
              onChange={updateField}
              className="mt-1 h-5 w-5 rounded border-slate-300"
            />

            <span className="text-sm leading-6 text-slate-700">
              أوافق على شروط استخدام المنصة، وأؤكد صحة بيانات المنشأة،
              وأتفهم أن الحساب والمنتجات لن تظهر قبل مراجعة إدارة
              Health Nations.
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
                  Registration successful
                </strong>

                <span className="mt-1 block leading-6">
                  تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني
                  لتأكيد الحساب. ستكون حالة الحساب قيد المراجعة حتى
                  توافق الإدارة عليه.
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
                <Loader2 className="animate-spin" size={20} />
                Creating account...
              </>
            ) : (
              "Create Vendor Account | إنشاء حساب المورد"
            )}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            الحساب الجديد ستكون حالته Pending Approval، ولن يتمكن من
            نشر المنتجات إلا بعد موافقة الإدارة.
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
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
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
  arabicTitle,
}: {
  number: string;
  title: string;
  arabicTitle: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 font-bold text-white">
        {number}
      </span>

      <div>
        <h3 className="text-lg font-black text-slate-900">{title}</h3>
        <p className="text-sm font-semibold text-blue-700">
          {arabicTitle}
        </p>
      </div>
    </div>
  );
}

function AccountTypeCard({
  selected,
  icon,
  title,
  arabicTitle,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  title: string;
  arabicTitle: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 text-left transition ${
        selected
          ? "border-blue-700 bg-blue-50 text-blue-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
      }`}
    >
      <div
        className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
          selected ? "bg-blue-700 text-white" : "bg-slate-100"
        }`}
      >
        {icon}
      </div>

      <strong className="block">{title}</strong>
      <span className="mt-1 block text-sm">{arabicTitle}</span>
    </button>
  );
}

function translateSupabaseError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("user already registered")) {
    return "هذا البريد الإلكتروني مسجل بالفعل.";
  }

  if (normalizedMessage.includes("invalid email")) {
    return "البريد الإلكتروني غير صحيح.";
  }

  if (normalizedMessage.includes("password")) {
    return "كلمة المرور غير مقبولة. استخدم 8 أحرف على الأقل.";
  }

  if (normalizedMessage.includes("rate limit")) {
    return "تم إجراء محاولات كثيرة. انتظر قليلًا ثم حاول مرة أخرى.";
  }

  return message;
}