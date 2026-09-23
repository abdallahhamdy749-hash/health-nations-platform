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

export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(
        "Supplier registration API: missing Supabase environment variables"
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Registration service is not configured.",
        },
        { status: 500 }
      );
    }

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
      body.countryCode?.trim() ?? "";

    const countryName =
      body.countryName?.trim() ?? "";

    const city =
      body.city?.trim() ?? "";

    const currency =
      body.currency?.trim() ?? "";

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
          error: "Invalid account type.",
        },
        { status: 400 }
      );
    }

    /*
     * Important:
     * We intentionally create a fresh Supabase
     * client for every registration request.
     *
     * persistSession/autorefresh are disabled
     * because this code runs on the server.
     */
    const supabase = createClient(
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

    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          role: "vendor",

          account_type: accountType,

          account_status: "pending",

          company_name_en:
            companyNameEn,

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

    if (error) {
      console.error(
        "Supplier registration API error:",
        {
          message: error.message,
          status: error.status,
          name: error.name,
        }
      );

      const normalizedMessage =
        error.message.toLowerCase();

      if (
        normalizedMessage.includes(
          "already registered"
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
          code: "SUPABASE_ERROR",
          error: error.message,
        },
        {
          status:
            error.status &&
            error.status >= 400 &&
            error.status <= 599
              ? error.status
              : 500,
        }
      );
    }

    if (!data.user) {
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

    return NextResponse.json(
      {
        success: true,

        user: {
          id: data.user.id,
          email: data.user.email,
        },

        requiresEmailConfirmation:
          !data.session,

        accountStatus: "pending",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Unexpected supplier registration API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        error:
          "An unexpected error occurred while creating the account.",
      },
      { status: 500 }
    );
  }
}