import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Product = {
  id: number;
  name_en: string | null;
  name_ar: string | null;
  description_en: string | null;
  description_ar: string | null;
  category: string | null;
  brand: string | null;
  model: string | null;
  sale_price: number | null;
  currency: string | null;
  stock: number | null;
  product_kind: string | null;
  part_number: string | null;
  compatible_device: string | null;
  manufacturer: string | null;
  part_condition: string | null;
  available_for_sale: boolean | null;
  available_for_rental: boolean | null;
  monthly_rental_price: number | null;
  status: string | null;
};

type OpenAIErrorShape = {
  message?: unknown;
  code?: unknown;
  status?: unknown;
  error?: {
    message?: unknown;
    code?: unknown;
  };
};

function getOpenAIErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error !== null) {
    const openaiError = error as OpenAIErrorShape;

    if (typeof openaiError.error?.message === "string") {
      return openaiError.error.message;
    }

    if (typeof openaiError.message === "string") {
      return openaiError.message;
    }
  }

  return "حدث خطأ أثناء الاتصال بخدمة OpenAI.";
}

function getOpenAIErrorStatus(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return 502;
  }

  const openaiError = error as OpenAIErrorShape;

  if (typeof openaiError.status === "number") {
    return openaiError.status;
  }

  const directCode =
    typeof openaiError.code === "string"
      ? openaiError.code
      : null;

  const nestedCode =
    typeof openaiError.error?.code === "string"
      ? openaiError.error.code
      : null;

  if (
    directCode === "invalid_api_key" ||
    nestedCode === "invalid_api_key"
  ) {
    return 401;
  }

  return 502;
}

export async function POST(req: Request) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error:
            "مفتاح OpenAI غير موجود في متغيرات البيئة.",
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "بيانات الاتصال بقاعدة Supabase غير مكتملة.",
        },
        { status: 500 }
      );
    }

    const body: unknown = await req.json();

    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof (body as { message?: unknown }).message ===
        "string"
        ? (body as { message: string }).message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { error: "الرسالة مطلوبة." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    const {
      data: products,
      error: productsError,
    } = await supabase
      .from("supplier_products")
      .select(`
        id,
        name_en,
        name_ar,
        description_en,
        description_ar,
        category,
        brand,
        model,
        sale_price,
        currency,
        stock,
        product_kind,
        part_number,
        compatible_device,
        manufacturer,
        part_condition,
        available_for_sale,
        available_for_rental,
        monthly_rental_price,
        status
      `)
      .eq("status", "approved")
      .limit(200);

    if (productsError) {
      console.error("SUPABASE ERROR:", {
        message: productsError.message,
        details: productsError.details,
        hint: productsError.hint,
        code: productsError.code,
      });

      return NextResponse.json(
        {
          error:
            productsError.message ||
            "تعذر تحميل منتجات المنصة.",
        },
        { status: 500 }
      );
    }

    const approvedProducts =
      (products ?? []) as Product[];

    if (approvedProducts.length === 0) {
      return NextResponse.json({
        reply:
          "لا توجد منتجات معتمدة متاحة حاليًا داخل المنصة. يمكنك التواصل مع فريق Health Nations لطلب المنتج أو عرض سعر.",
      });
    }

    const productsText = approvedProducts
      .map((product, index) => {
        const price =
          product.sale_price !== null
            ? `${product.sale_price} ${
                product.currency || ""
              }`.trim()
            : "غير معلن";

        const rentalPrice =
          product.monthly_rental_price !== null
            ? `${product.monthly_rental_price} ${
                product.currency || ""
              } / month`.trim()
            : "غير معلن";

        return [
          `${index + 1}.`,
          `Product ID: ${product.id}`,
          `Arabic Name: ${
            product.name_ar || "غير متوفر"
          }`,
          `English Name: ${
            product.name_en || "غير متوفر"
          }`,
          `Category: ${
            product.category || "غير محدد"
          }`,
          `Product Type: ${
            product.product_kind || "equipment"
          }`,
          `Brand: ${product.brand || "غير محدد"}`,
          `Model: ${product.model || "غير محدد"}`,
          `Manufacturer: ${
            product.manufacturer || "غير محدد"
          }`,
          `Part Number: ${
            product.part_number || "غير متوفر"
          }`,
          `Compatible Device: ${
            product.compatible_device || "غير محدد"
          }`,
          `Condition: ${
            product.part_condition || "غير محدد"
          }`,
          `Stock: ${
            product.stock !== null
              ? product.stock
              : "غير محدد"
          }`,
          `Available For Sale: ${
            product.available_for_sale ? "Yes" : "No"
          }`,
          `Sale Price: ${price}`,
          `Available For Rental: ${
            product.available_for_rental ? "Yes" : "No"
          }`,
          `Monthly Rental Price: ${rentalPrice}`,
          `Arabic Description: ${
            product.description_ar || "غير متوفر"
          }`,
          `English Description: ${
            product.description_en || "غير متوفر"
          }`,
        ].join("\n");
      })
      .join("\n\n");

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    try {
      const response = await openai.responses.create({
        model: "gpt-5-mini",

        instructions: `
You are the intelligent medical marketplace consultant for Health Nations Medical.

Your job is to help customers find medical equipment, consumables, spare parts, rehabilitation products, and other medical products from the Health Nations marketplace.

STRICT RULES:

1. Only recommend products included in the marketplace product list provided to you.
2. Never invent a product, price, brand, model, stock quantity, specification, part number, manufacturer, or availability.
3. Only products with approved marketplace status are provided to you.
4. If the customer provides an exact part number, prioritize exact part-number matches.
5. For spare parts, use compatibility, manufacturer, model, and part number when available.
6. Do not say a product is in stock unless the supplied stock data confirms it.
7. If stock is zero, do not describe the item as currently in stock.
8. If stock is unknown, clearly say availability should be confirmed.
9. Only mention a price when a price is explicitly supplied.
10. If the product has no published price, say the customer can request a quotation.
11. If rental is available, you may mention the rental option.
12. Never expose supplier phone numbers, supplier email addresses, or direct supplier contact information.
13. Customer inquiries must remain through Health Nations.
14. If no matching marketplace product exists, clearly say that there is currently no matching product in the marketplace and suggest requesting sourcing assistance from Health Nations.
15. Provide general medical information only. Do not diagnose medical conditions.
16. Do not prescribe prescription-only medicines.
17. For potentially serious or emergency symptoms, advise the customer to contact an appropriate healthcare professional or emergency service.
18. Answer in the same language used by the customer.
19. Keep answers clear and practical.
20. When one or more suitable products exist, mention their exact marketplace names and relevant available details.
21. When appropriate, finish by suggesting that the customer request a quotation through Health Nations.
`,

        input: `
CUSTOMER REQUEST:

${message}

APPROVED HEALTH NATIONS MARKETPLACE PRODUCTS:

${productsText}
`,
      });

      const reply = response.output_text?.trim();

      return NextResponse.json({
        reply:
          reply ||
          "لم أجد منتجًا مناسبًا داخل المنصة حاليًا.",
      });
    } catch (openaiError: unknown) {
      console.error(
        "OPENAI ERROR:",
        openaiError
      );

      return NextResponse.json(
        {
          error:
            getOpenAIErrorMessage(openaiError),
        },
        {
          status:
            getOpenAIErrorStatus(openaiError),
        }
      );
    }
  } catch (error: unknown) {
    console.error(
      "AI CONSULTANT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown server error",
      },
      { status: 500 }
    );
  }
}