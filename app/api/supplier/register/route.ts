import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RegisterBody = {
  email?: string;
  password?: string;
  accountType?: string;
  companyNameEn?: string;
  companyNameAr?: string;
  contactName?: string;
  phone?: string;
  countryCode?: string;
  countryName?: string;
  city?: string;
  currency?: string;
  supplierType?: string;
  commercialRegistration?: string;
  taxNumber?: string;
  licenseNumber?: string;
  address?: string;
};

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !serviceRoleKey
  ) {
    console.error(
      "Supplier registration API: missing Supabase environment variables"
    );

    return NextResponse.json(
      {
        success: false,
        code: "CONFIGURATION_ERROR",
        error:
          "Registration service is not configured correctly.",
      },
      { status: 500 }
    );
  }

  /*
   * Public client:
   * used only for signUp so Supabase
   * can handle email confirmation normally.
   */
  const publicSupabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  /*
   * Admin client:
   * used only on the server.
   * Never expose SUPABASE_SERVICE_ROLE_KEY
   * to browser/client code.
   */
  const adminSupabase = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );

  let createdUserId: string | null = null;

  try {
    const body =
      (await request.json()) as RegisterBody;

    const email =
      body.email?.trim().toLowerCase() ?? "";

    const password =
      body.password ?? "";

    const companyNameEn =
      body.companyNameEn?.trim() ?? "";

    const companyNameAr =
      body.companyNameAr?.trim() ?? "";

    const contactName =
      body.contactName?.trim() ?? "";

    const phone =
      body.phone?.trim() ?? "";

    const countryCode =
      body.countryCode
        ?.trim()
        .toUpperCase() ?? "";

    const countryName =
      body.countryName?.trim() ?? "";

    const city =
      body.city?.trim() ?? "";

    const currency =
      body.currency
        ?.trim()
        .toUpperCase() ?? "";

    const supplierType =
      body.supplierType?.trim() ?? "";

    const commercialRegistration =
      body.commercialRegistration?.trim() ??
      "";

    const taxNumber =
      body.taxNumber?.trim() ?? "";

    const licenseNumber =
      body.licenseNumber?.trim() ?? "";

    const address =
      body.address?.trim() ?? "";

    const accountType =
      body.accountType?.trim() ?? "";

    if (
      !email ||
      !password ||
      !companyNameEn ||
      !contactName ||
      !phone ||
      !countryCode ||
      !countryName ||
      !city ||
      !currency ||
      !supplierType ||
      !commercialRegistration ||
      !taxNumber ||
      !address ||
      !accountType
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "MISSING_FIELDS",
          error:
            "Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_PASSWORD",
          error:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const allowedAccountTypes = [
      "pharmacy",
      "medical_supplier",
      "manufacturer",
    ];

    if (
      !allowedAccountTypes.includes(
        accountType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "INVALID_ACCOUNT_TYPE",
          error: "Invalid account type.",
        },
        { status: 400 }
      );
    }

    /*
     * 1. Create Supabase Auth account.
     */
    const {
      data: signUpData,
      error: signUpError,
    } = await publicSupabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "vendor",
          account_type: accountType,
          account_status: "pending",
          company_name_en: companyNameEn,
          company_name_ar:
            companyNameAr || null,
          contact_name: contactName,
          phone,
          country_code: countryCode,
          country_name: countryName,
          country: countryName,
          city,
          currency,
          supplier_type: supplierType,
          commercial_registration:
            commercialRegistration,
          tax_number: taxNumber,
          license_number:
            licenseNumber || null,
          address,
          is_verified: false,
          can_publish_products: false,
        },
      },
    });

    if (signUpError) {
      console.error(
        "Supplier Auth registration error:",
        {
          message: signUpError.message,
          status: signUpError.status,
          name: signUpError.name,
        }
      );

      const normalizedMessage =
        signUpError.message.toLowerCase();

      if (
        normalizedMessage.includes(
          "already registered"
        ) ||
        normalizedMessage.includes(
          "user already registered"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "ALREADY_REGISTERED",
            error:
              "This email address is already registered.",
          },
          { status: 409 }
        );
      }

      if (
        normalizedMessage.includes(
          "invalid email"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_EMAIL",
            error:
              "Please enter a valid email address.",
          },
          { status: 400 }
        );
      }

      if (
        normalizedMessage.includes(
          "password"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "INVALID_PASSWORD",
            error:
              "The password is not accepted.",
          },
          { status: 400 }
        );
      }

      if (
        normalizedMessage.includes(
          "rate limit"
        ) ||
        normalizedMessage.includes(
          "too many"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            code: "RATE_LIMIT",
            error:
              "Too many registration attempts. Please try again later.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          code: "SUPABASE_AUTH_ERROR",
          error: signUpError.message,
        },
        {
          status:
            signUpError.status &&
            signUpError.status >= 400 &&
            signUpError.status <= 599
              ? signUpError.status
              : 500,
        }
      );
    }

    if (!signUpData.user) {
      return NextResponse.json(
        {
          success: false,
          code: "USER_NOT_CREATED",
          error:
            "The account could not be created.",
        },
        { status: 500 }
      );
    }

    createdUserId =
      signUpData.user.id;

    /*
     * Unique public supplier store slug.
     *
     * Example:
     * company-name-a1b2c3d4
     */
    const slugBase =
      normalizeSlug(companyNameEn) ||
      "supplier";

    const supplierSlug =
      `${slugBase}-${createdUserId.slice(
        0,
        8
      )}`;

    /*
     * 2. Create supplier_profiles row.
     */
    const {
      error: supplierProfileError,
    } = await adminSupabase
      .from("supplier_profiles")
      .insert({
        user_id: createdUserId,
        company_name_en: companyNameEn,
        company_name_ar:
          companyNameAr || null,
        contact_name: contactName,
        email,
        phone,
        country: countryCode,
        city,
        address,
        supplier_type: supplierType,
        slug: supplierSlug,
        status: "pending",
        verified: false,
      });

    if (supplierProfileError) {
      console.error(
        "supplier_profiles insert error:",
        supplierProfileError
      );

      throw new Error(
        `SUPPLIER_PROFILE_ERROR: ${supplierProfileError.message}`
      );
    }

    /*
     * 3. Create vendor_profiles row.
     */
    const {
      error: vendorProfileError,
    } = await adminSupabase
      .from("vendor_profiles")
      .insert({
        id: createdUserId,

        account_type: accountType,
        account_status: "pending",

        company_name_en: companyNameEn,
        company_name_ar:
          companyNameAr || null,

        contact_name: contactName,
        email,
        phone,

        country_code: countryCode,
        country_name: countryName,
        city,
        address,
        currency,

        supplier_type: supplierType,

        commercial_registration:
          commercialRegistration,

        tax_number: taxNumber,

        license_number:
          licenseNumber || null,

        is_verified: false,
        can_publish_products: false,

        store_slug: supplierSlug,
        store_is_active: false,
      });

    if (vendorProfileError) {
      console.error(
        "vendor_profiles insert error:",
        vendorProfileError
      );

      throw new Error(
        `VENDOR_PROFILE_ERROR: ${vendorProfileError.message}`
      );
    }

    /*
     * Registration is considered successful
     * only after all three records exist:
     *
     * auth.users
     * supplier_profiles
     * vendor_profiles
     */
    return NextResponse.json(
      {
        success: true,

        user: {
          id: createdUserId,
          email:
            signUpData.user.email,
        },

        supplier: {
          slug: supplierSlug,
          status: "pending",
        },

        requiresEmailConfirmation:
          !signUpData.session,

        accountStatus: "pending",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Unexpected supplier registration API error:",
      error
    );

    /*
     * Cleanup incomplete registration.
     *
     * If Auth was created but one of the
     * profile inserts failed, remove everything
     * so the same email can register again.
     */
    if (createdUserId) {
      try {
        await adminSupabase
          .from("vendor_profiles")
          .delete()
          .eq(
            "id",
            createdUserId
          );

        await adminSupabase
          .from("supplier_profiles")
          .delete()
          .eq(
            "user_id",
            createdUserId
          );

        await adminSupabase.auth.admin.deleteUser(
          createdUserId
        );
      } catch (cleanupError) {
        console.error(
          "Supplier registration cleanup error:",
          cleanupError
        );
      }
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unknown registration error";

    return NextResponse.json(
      {
        success: false,
        code: "PROFILE_CREATION_FAILED",
        error:
          "The vendor account could not be completed.",
        details: message,
      },
      { status: 500 }
    );
  }
}