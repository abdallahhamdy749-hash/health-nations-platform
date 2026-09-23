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

function cleanEnvironmentValue(
  value: string | undefined
) {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/^["']|["']$/g, "");
}

function cleanEnvironmentKey(
  value: string | undefined
) {
  return cleanEnvironmentValue(value).replace(
    /\s+/g,
    ""
  );
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (
      error as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
}

export async function POST(request: Request) {
  const supabaseUrl =
    cleanEnvironmentValue(
      process.env.NEXT_PUBLIC_SUPABASE_URL
    );

  const supabaseAnonKey =
    cleanEnvironmentKey(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

  const serviceRoleKey =
    cleanEnvironmentKey(
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    !serviceRoleKey
  ) {
    console.error(
      "Supplier registration API configuration error:",
      {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasAnonKey: Boolean(supabaseAnonKey),
        hasServiceRoleKey:
          Boolean(serviceRoleKey),
      }
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

  let createdUserId: string | null =
    null;

  try {
    const body =
      (await request.json()) as RegisterBody;

    const email =
      body.email
        ?.trim()
        .toLowerCase() ?? "";

    const password =
      body.password ?? "";

    const accountType =
      body.accountType?.trim() ?? "";

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

    if (
      !email ||
      !password ||
      !accountType ||
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
      !address
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
          error:
            "Invalid account type.",
        },
        { status: 400 }
      );
    }

    /*
     * STEP 1
     * Create Supabase Auth user.
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

          account_type:
            accountType,

          account_status:
            "pending",

          company_name_en:
            companyNameEn,

          company_name_ar:
            companyNameAr || null,

          contact_name:
            contactName,

          phone,

          country_code:
            countryCode,

          country_name:
            countryName,

          country:
            countryName,

          city,

          currency,

          supplier_type:
            supplierType,

          commercial_registration:
            commercialRegistration,

          tax_number:
            taxNumber,

          license_number:
            licenseNumber || null,

          address,

          is_verified:
            false,

          can_publish_products:
            false,
        },
      },
    });

    if (signUpError) {
      console.error(
        "Supplier Auth registration error:",
        {
          message:
            signUpError.message,
          status:
            signUpError.status,
          name:
            signUpError.name,
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
            code:
              "ALREADY_REGISTERED",
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
            code:
              "INVALID_PASSWORD",
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
          code:
            "SUPABASE_AUTH_ERROR",
          error:
            signUpError.message,
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
          code:
            "USER_NOT_CREATED",
          error:
            "The account could not be created.",
        },
        { status: 500 }
      );
    }

    createdUserId =
      signUpData.user.id;

    /*
     * Create unique store slug.
     */
    const slugBase =
      normalizeSlug(
        companyNameEn
      ) || "supplier";

    const supplierSlug =
      `${slugBase}-${createdUserId.slice(
        0,
        8
      )}`;

    /*
     * STEP 2
     * supplier_profiles
     */
    const {
      error:
        supplierProfileError,
    } = await adminSupabase
      .from(
        "supplier_profiles"
      )
      .insert({
        user_id:
          createdUserId,

        company_name_en:
          companyNameEn,

        company_name_ar:
          companyNameAr || null,

        contact_name:
          contactName,

        email,

        phone,

        country:
          countryCode,

        city,

        address,

        supplier_type:
          supplierType,

        slug:
          supplierSlug,

        status:
          "pending",

        verified:
          false,
      });

    if (
      supplierProfileError
    ) {
      console.error(
        "supplier_profiles insert error:",
        {
          message:
            supplierProfileError.message,
          code:
            supplierProfileError.code,
          details:
            supplierProfileError.details,
          hint:
            supplierProfileError.hint,
        }
      );

      throw new Error(
        `SUPPLIER_PROFILE_ERROR: ${supplierProfileError.message}`
      );
    }

    /*
     * STEP 3
     * vendor_profiles
     */
    const {
      error:
        vendorProfileError,
    } = await adminSupabase
      .from(
        "vendor_profiles"
      )
      .insert({
        id:
          createdUserId,

        account_type:
          accountType,

        account_status:
          "pending",

        company_name_en:
          companyNameEn,

        company_name_ar:
          companyNameAr || null,

        contact_name:
          contactName,

        email,

        phone,

        country_code:
          countryCode,

        country_name:
          countryName,

        city,

        address,

        currency,

        supplier_type:
          supplierType,

        commercial_registration:
          commercialRegistration,

        tax_number:
          taxNumber,

        license_number:
          licenseNumber || null,

        is_verified:
          false,

        can_publish_products:
          false,

        store_slug:
          supplierSlug,

        store_is_active:
          false,
      });

    if (
      vendorProfileError
    ) {
      console.error(
        "vendor_profiles insert error:",
        {
          message:
            vendorProfileError.message,
          code:
            vendorProfileError.code,
          details:
            vendorProfileError.details,
          hint:
            vendorProfileError.hint,
        }
      );

      throw new Error(
        `VENDOR_PROFILE_ERROR: ${vendorProfileError.message}`
      );
    }

    return NextResponse.json(
      {
        success: true,

        user: {
          id:
            createdUserId,

          email:
            signUpData.user.email,
        },

        supplier: {
          slug:
            supplierSlug,

          status:
            "pending",
        },

        requiresEmailConfirmation:
          !signUpData.session,

        accountStatus:
          "pending",
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorMessage =
      getErrorMessage(error);

    console.error(
      "Unexpected supplier registration API error:",
      errorMessage
    );

    /*
     * Remove incomplete registration.
     */
    if (createdUserId) {
      try {
        await adminSupabase
          .from(
            "vendor_profiles"
          )
          .delete()
          .eq(
            "id",
            createdUserId
          );

        await adminSupabase
          .from(
            "supplier_profiles"
          )
          .delete()
          .eq(
            "user_id",
            createdUserId
          );

        const {
          error:
            deleteUserError,
        } =
          await adminSupabase.auth.admin.deleteUser(
            createdUserId
          );

        if (deleteUserError) {
          console.error(
            "Auth cleanup error:",
            deleteUserError.message
          );
        }
      } catch (
        cleanupError: unknown
      ) {
        console.error(
          "Supplier registration cleanup error:",
          getErrorMessage(
            cleanupError
          )
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        code:
          "PROFILE_CREATION_FAILED",
        error:
          "The vendor account could not be completed.",
      },
      { status: 500 }
    );
  }
}