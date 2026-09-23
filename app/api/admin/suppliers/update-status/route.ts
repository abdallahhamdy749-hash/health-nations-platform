import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RequestBody = {
  supplierId?: string;
  action?: "approve" | "reject";
};

type ErrorWithMessage = {
  message?: unknown;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    const message = (error as ErrorWithMessage).message;

    if (typeof message === "string") {
      return message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown server error";
}

export async function POST(req: Request) {
  try {
    /* =====================================================
       ENVIRONMENT VARIABLES
    ===================================================== */

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json(
        {
          error:
            "NEXT_PUBLIC_SUPABASE_URL is missing.",
        },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY is missing.",
        },
        { status: 500 }
      );
    }

    /*
      IMPORTANT:
      Service Role Key stays on the server only.
      Never use NEXT_PUBLIC_ with this key.
    */

    const adminSupabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /* =====================================================
       VERIFY AUTHENTICATED USER
    ===================================================== */

    const authorization =
      req.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization
      .slice("Bearer ".length)
      .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    const {
      data: userData,
      error: userError,
    } = await adminSupabase.auth.getUser(
      accessToken
    );

    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "ADMIN AUTH ERROR:",
        userError
      );

      return NextResponse.json(
        {
          error:
            "Invalid or expired admin session.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       VERIFY ADMIN ACCESS
    ===================================================== */

    const {
      data: adminRecord,
      error: adminCheckError,
    } = await adminSupabase
      .from("admin_users")
      .select("user_id")
      .eq(
        "user_id",
        userData.user.id
      )
      .maybeSingle();

    if (adminCheckError) {
      console.error(
        "ADMIN CHECK ERROR:",
        adminCheckError
      );

      return NextResponse.json(
        {
          error:
            "Could not verify admin access.",
        },
        { status: 500 }
      );
    }

    if (!adminRecord) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to manage suppliers.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    let body: RequestBody;

    try {
      body =
        (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid request body.",
        },
        { status: 400 }
      );
    }

    const supplierId =
      typeof body.supplierId === "string"
        ? body.supplierId.trim()
        : "";

    const action = body.action;

    if (!supplierId) {
      return NextResponse.json(
        {
          error:
            "Supplier ID is required.",
        },
        { status: 400 }
      );
    }

    if (
      action !== "approve" &&
      action !== "reject"
    ) {
      return NextResponse.json(
        {
          error:
            "Action must be approve or reject.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       VERIFY SUPPLIER EXISTS
    ===================================================== */

    const {
      data: supplier,
      error: supplierLookupError,
    } = await adminSupabase
      .from("supplier_profiles")
      .select(`
        user_id,
        company_name_en,
        company_name_ar,
        status,
        verified
      `)
      .eq(
        "user_id",
        supplierId
      )
      .maybeSingle();

    if (supplierLookupError) {
      console.error(
        "SUPPLIER LOOKUP ERROR:",
        supplierLookupError
      );

      return NextResponse.json(
        {
          error:
            supplierLookupError.message,
        },
        { status: 500 }
      );
    }

    if (!supplier) {
      return NextResponse.json(
        {
          error:
            "Supplier was not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       APPROVE SUPPLIER
    ===================================================== */

    if (action === "approve") {
      const approvedAt =
        new Date().toISOString();

      /*
        STEP 1:
        Approve supplier_profiles
      */

      const {
        error: supplierUpdateError,
      } = await adminSupabase
        .from("supplier_profiles")
        .update({
          status: "approved",
          verified: true,
          approved_at: approvedAt,
        })
        .eq(
          "user_id",
          supplierId
        );

      if (supplierUpdateError) {
        console.error(
          "SUPPLIER PROFILE APPROVE ERROR:",
          supplierUpdateError
        );

        return NextResponse.json(
          {
            error:
              supplierUpdateError.message,
          },
          { status: 500 }
        );
      }

      /*
        STEP 2:
        Approve vendor_profiles

        vendor_profiles.id is the
        authenticated supplier user ID.
      */

      const {
        data: updatedVendor,
        error: vendorUpdateError,
      } = await adminSupabase
        .from("vendor_profiles")
        .update({
          account_status:
            "approved",
          is_verified: true,
          can_publish_products:
            true,
        })
        .eq(
          "id",
          supplierId
        )
        .select(
          `
            id,
            account_status,
            is_verified,
            can_publish_products
          `
        )
        .maybeSingle();

      if (vendorUpdateError) {
        console.error(
          "VENDOR PROFILE APPROVE ERROR:",
          vendorUpdateError
        );

        /*
          Roll back supplier_profiles
          to prevent inconsistent status.
        */

        const {
          error: rollbackError,
        } = await adminSupabase
          .from("supplier_profiles")
          .update({
            status: "pending",
            verified: false,
            approved_at: null,
          })
          .eq(
            "user_id",
            supplierId
          );

        if (rollbackError) {
          console.error(
            "SUPPLIER ROLLBACK ERROR:",
            rollbackError
          );
        }

        return NextResponse.json(
          {
            error:
              vendorUpdateError.message,
          },
          { status: 500 }
        );
      }

      /*
        Some old supplier accounts may
        not have a vendor_profiles row.
      */

      if (!updatedVendor) {
        console.error(
          "VENDOR PROFILE NOT FOUND:",
          supplierId
        );

        const {
          error: rollbackError,
        } = await adminSupabase
          .from("supplier_profiles")
          .update({
            status: "pending",
            verified: false,
            approved_at: null,
          })
          .eq(
            "user_id",
            supplierId
          );

        if (rollbackError) {
          console.error(
            "SUPPLIER ROLLBACK ERROR:",
            rollbackError
          );
        }

        return NextResponse.json(
          {
            error:
              "Vendor profile was not found for this supplier.",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,

          supplierId,

          action:
            "approve",

          supplier: {
            status:
              "approved",

            verified:
              true,

            approved_at:
              approvedAt,
          },

          vendor: {
            account_status:
              updatedVendor.account_status,

            is_verified:
              updatedVendor.is_verified,

            can_publish_products:
              updatedVendor.can_publish_products,
          },

          message:
            "Supplier approved successfully.",
        },
        { status: 200 }
      );
    }

    /* =====================================================
       REJECT SUPPLIER
    ===================================================== */

    /*
      STEP 1:
      Reject supplier_profiles
    */

    const {
      error: supplierRejectError,
    } = await adminSupabase
      .from("supplier_profiles")
      .update({
        status: "rejected",
        verified: false,
        approved_at: null,
      })
      .eq(
        "user_id",
        supplierId
      );

    if (supplierRejectError) {
      console.error(
        "SUPPLIER PROFILE REJECT ERROR:",
        supplierRejectError
      );

      return NextResponse.json(
        {
          error:
            supplierRejectError.message,
        },
        { status: 500 }
      );
    }

    /*
      STEP 2:
      Reject vendor_profiles
    */

    const {
      data: rejectedVendor,
      error: vendorRejectError,
    } = await adminSupabase
      .from("vendor_profiles")
      .update({
        account_status:
          "rejected",

        is_verified:
          false,

        can_publish_products:
          false,
      })
      .eq(
        "id",
        supplierId
      )
      .select(
        `
          id,
          account_status,
          is_verified,
          can_publish_products
        `
      )
      .maybeSingle();

    if (vendorRejectError) {
      console.error(
        "VENDOR PROFILE REJECT ERROR:",
        vendorRejectError
      );

      return NextResponse.json(
        {
          error:
            vendorRejectError.message,
        },
        { status: 500 }
      );
    }

    if (!rejectedVendor) {
      console.warn(
        "Vendor profile not found while rejecting supplier:",
        supplierId
      );
    }

    return NextResponse.json(
      {
        success: true,

        supplierId,

        action:
          "reject",

        supplier: {
          status:
            "rejected",

          verified:
            false,

          approved_at:
            null,
        },

        vendor:
          rejectedVendor
            ? {
                account_status:
                  rejectedVendor.account_status,

                is_verified:
                  rejectedVendor.is_verified,

                can_publish_products:
                  rejectedVendor.can_publish_products,
              }
            : null,

        message:
          "Supplier rejected successfully.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      "SUPPLIER STATUS API ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}