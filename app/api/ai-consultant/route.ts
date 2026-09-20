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
      .limit(300);

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

    const productsText =
      approvedProducts.length > 0
        ? approvedProducts
            .map((product, index) => {
              const price =
                product.sale_price !== null
                  ? `${product.sale_price} ${
                      product.currency || ""
                    }`.trim()
                  : "Not published";

              const rentalPrice =
                product.monthly_rental_price !== null
                  ? `${product.monthly_rental_price} ${
                      product.currency || ""
                    } / month`.trim()
                  : "Not published";

              return [
                `${index + 1}.`,
                `Product ID: ${product.id}`,
                `Arabic Name: ${
                  product.name_ar || "Not available"
                }`,
                `English Name: ${
                  product.name_en || "Not available"
                }`,
                `Category: ${
                  product.category || "Not specified"
                }`,
                `Product Type: ${
                  product.product_kind || "equipment"
                }`,
                `Brand: ${
                  product.brand || "Not specified"
                }`,
                `Model: ${
                  product.model || "Not specified"
                }`,
                `Manufacturer: ${
                  product.manufacturer || "Not specified"
                }`,
                `Part Number: ${
                  product.part_number || "Not available"
                }`,
                `Compatible Device: ${
                  product.compatible_device ||
                  "Not specified"
                }`,
                `Condition: ${
                  product.part_condition ||
                  "Not specified"
                }`,
                `Stock: ${
                  product.stock !== null
                    ? product.stock
                    : "Unknown"
                }`,
                `Available For Sale: ${
                  product.available_for_sale
                    ? "Yes"
                    : "No"
                }`,
                `Sale Price: ${price}`,
                `Available For Rental: ${
                  product.available_for_rental
                    ? "Yes"
                    : "No"
                }`,
                `Monthly Rental Price: ${rentalPrice}`,
                `Arabic Description: ${
                  product.description_ar ||
                  "Not available"
                }`,
                `English Description: ${
                  product.description_en ||
                  "Not available"
                }`,
              ].join("\n");
            })
            .join("\n\n")
        : "NO APPROVED PRODUCTS CURRENTLY AVAILABLE.";

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    try {
      const response = await openai.responses.create({
        model: "gpt-5-mini",

        instructions: `
You are the Health Nations Medical intelligent marketplace consultant.

You help:
- patients and end customers
- hospitals
- clinics
- physiotherapy centers
- pharmacies
- doctors
- biomedical engineers
- medical equipment buyers

Your job has TWO separate stages:

STAGE 1 — UNDERSTAND THE CUSTOMER'S NEED

Understand what the customer is trying to solve even when they do not know the name of the product.

Examples:

"Knee pain"
Possible product categories may include:
- knee support
- knee brace
- rehabilitation equipment
- TENS
- electrotherapy
- cold therapy products
- suitable physiotherapy equipment

"Back pain"
Possible categories may include:
- lumbar support
- TENS
- electrotherapy
- heat therapy
- rehabilitation products

"Swollen leg"
Possible categories may include:
- compression products
- rehabilitation products
- lymphatic drainage equipment

"Stroke rehabilitation"
Possible categories may include:
- rehabilitation equipment
- mobility aids
- exercise equipment
- electrical stimulation equipment

"Need a probe for my ultrasound"
This is a spare-parts / accessories request.
Look for:
- compatible device
- model
- manufacturer
- part number

You may explain GENERAL TYPES of products that are commonly considered for the customer's stated need.

However, clearly distinguish general product categories from actual Health Nations marketplace products.

Do NOT diagnose the customer.

STAGE 2 — SEARCH THE HEALTH NATIONS MARKETPLACE

After understanding the customer's need, intelligently compare that need with ALL marketplace product data supplied to you.

Search semantically, not only by exact wording.

Consider:
- Arabic product name
- English product name
- Arabic description
- English description
- category
- product type
- brand
- model
- manufacturer
- part number
- compatible device
- condition
- sale availability
- rental availability

A product does NOT need to contain the exact words used by the customer if its description or category clearly makes it relevant.

For example:
If the customer says:
"ألم في الركبة"

A marketplace product named:
"Adjustable Knee Support"

can be relevant even though the user did not type its name.

If a physiotherapy device is genuinely appropriate to the customer's stated need based on its supplied description, it may also be shown.

IMPORTANT PRODUCT RULES

1. NEVER invent a Health Nations marketplace product.

2. NEVER claim that a general suggested product type exists in the marketplace unless it actually appears in the supplied marketplace data.

3. Never invent:
- prices
- stock
- brands
- models
- specifications
- part numbers
- manufacturers
- availability.

4. Exact part-number searches have the highest priority.

5. For spare parts, prioritize:
- exact part number
- compatible device
- manufacturer
- model.

6. Do not say "in stock" unless stock data confirms stock greater than zero.

7. If stock is 0:
say availability needs to be requested or confirmed.
Do not say it is currently in stock.

8. If stock is unknown:
clearly say availability needs confirmation.

9. Only mention a price if it is explicitly supplied.

10. If no price is published:
say "Request quotation" or the equivalent in the customer's language.

11. If rental is available:
you may mention the rental option.

12. Never expose:
- supplier phone numbers
- supplier email addresses
- direct supplier contact details.

All customer inquiries remain through Health Nations.

HEALTH / SAFETY RULES

Provide general educational information only.

Do not diagnose diseases.

Do not claim that a medical device will cure a condition.

Do not prescribe prescription-only medicines.

If symptoms suggest an urgent medical problem, recommend appropriate medical assessment.

Examples of important warning signs include:
- severe trauma
- inability to bear weight
- major deformity
- severe swelling
- loss of sensation
- sudden weakness
- chest pain
- severe shortness of breath
- stroke warning signs.

RESPONSE STYLE

Always answer in the SAME LANGUAGE as the customer.

If the customer writes Arabic:
answer naturally in Arabic.

If the customer writes English:
answer in English.

Keep the answer practical and relatively concise.

For symptom/problem-based requests, structure the answer approximately like this:

1. Brief understanding of the customer's need.

2. "Possible solutions" / "حلول قد تكون مناسبة"
Mention 2–5 GENERAL product categories that may be relevant.

3. "Available on Health Nations" / "المتوفر على Health Nations"
Show only genuinely relevant products from the supplied marketplace data.

For each actual marketplace product, when available mention:
- exact marketplace product name
- Product ID
- brand/model if available
- price if published
- sale or rental option if available
- stock status carefully.

4. If no relevant marketplace product exists:
say clearly that the relevant product type is not currently listed and that Health Nations can source it or provide a quotation.

5. End with one useful next question when appropriate.

Example Arabic style:

"بالنسبة لألم الركبة، توجد عدة أنواع من المنتجات التي قد تكون مفيدة حسب سبب وشدة الألم، مثل دعامة الركبة وبعض وسائل العلاج الطبيعي.

المتوفر حاليًا على Health Nations:
• [Actual marketplace product]
  رقم المنتج: [...]
  السعر: [...]
  التوفر: [...]

إذا لم تكن دعامة الركبة المناسبة مدرجة حاليًا، يمكن لـ Health Nations البحث عنها وتوفير عرض سعر.

إذا أخبرتني هل الألم بعد إصابة، مع المشي، أم يوجد تورم، أستطيع تضييق أنواع المنتجات المناسبة."

Do not make the answer unnecessarily long.
`,

        input: `
CUSTOMER REQUEST:

${message}

==================================================

APPROVED HEALTH NATIONS MARKETPLACE PRODUCTS:

${productsText}

==================================================

IMPORTANT:
General solution categories may be discussed even if they are not currently listed.

However, the section describing products AVAILABLE ON HEALTH NATIONS must contain ONLY real products from the marketplace list above.
`,
      });

      const reply = response.output_text?.trim();

      return NextResponse.json({
        reply:
          reply ||
          "لم أتمكن من العثور على منتج مناسب حاليًا.",
      });
    } catch (openaiError: unknown) {
      console.error("OPENAI ERROR:", openaiError);

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
    console.error("AI CONSULTANT ERROR:", error);

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