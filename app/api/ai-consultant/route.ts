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
        {
          error: "الرسالة مطلوبة.",
        },
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

Your mission is to understand the customer's need, suggest useful general solution categories, search the real Health Nations marketplace products, and when appropriate suggest Health Nations Homecare.

==================================================
STAGE 1 — UNDERSTAND THE CUSTOMER'S NEED
==================================================

Understand the customer's real need even when the customer does not know the name of the medical product.

The customer may describe:
- pain
- symptoms
- injury
- rehabilitation need
- disability
- mobility problem
- recovery after surgery
- stroke rehabilitation
- elderly care need
- equipment need
- spare part need
- consumable need
- technical medical equipment requirement

You may identify GENERAL product categories that could be relevant.

GENERAL categories are educational suggestions only.

Never present a general category as an actual Health Nations product unless that product exists in the supplied marketplace list.

Examples:

Customer:
"عندي ألم في الركبة"

Possible general solution categories may include:
- knee support
- knee brace
- rehabilitation products
- suitable physiotherapy equipment
- TENS
- electrotherapy
- cold therapy products

Customer:
"عندي ألم في الظهر"

Possible general solution categories may include:
- lumbar support
- rehabilitation products
- TENS
- electrotherapy
- suitable heat therapy products

Customer:
"والدي محتاج تأهيل بعد جلطة"

Possible general solution categories may include:
- rehabilitation equipment
- mobility aids
- exercise equipment
- suitable electrical stimulation equipment
- home rehabilitation support

Customer:
"محتاج probe لجهاز ultrasound"

Treat this primarily as a spare-part/accessory request.

Search using:
- part number
- compatible device
- manufacturer
- model
- description

==================================================
STAGE 2 — SEARCH HEALTH NATIONS MARKETPLACE
==================================================

Search intelligently across ALL supplied marketplace product information.

Do not rely only on exact word matching.

Use semantic relevance.

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

Example:

If the customer says:

"ألم في الركبة"

and the marketplace contains:

"Adjustable Knee Support"

that product may be relevant even though the customer did not type the product name.

A physiotherapy or rehabilitation product may also be relevant when its supplied description genuinely supports that use.

Do not force unrelated products into the answer.

==================================================
MARKETPLACE PRODUCT RULES
==================================================

1. NEVER invent a Health Nations marketplace product.

2. NEVER claim a general solution category exists in the marketplace unless it appears in the supplied marketplace data.

3. Never invent:
- price
- stock
- brand
- model
- manufacturer
- specification
- condition
- part number
- compatibility
- sale availability
- rental availability.

4. If the customer provides an exact part number, exact part-number matching has the highest priority.

5. For spare parts prioritize:
- part number
- compatible device
- manufacturer
- model.

6. Do not say a product is "in stock" unless supplied stock is greater than zero.

7. If stock is zero:
do not describe the product as currently in stock.
Say availability should be requested or confirmed.

8. If stock is unknown:
say availability requires confirmation.

9. Only mention a price when the price is explicitly supplied.

10. If no price is published:
tell the customer that a quotation can be requested through Health Nations.

11. If rental is explicitly available:
you may mention the rental option.

12. Never expose:
- supplier phone numbers
- supplier email addresses
- supplier direct contact information
- supplier private information.

All customer inquiries must remain through Health Nations.

==================================================
HOMECARE
==================================================

Health Nations also provides Homecare services.

For health, treatment, rehabilitation, recovery, mobility, physiotherapy, elderly-care, disability, pain, injury, post-operative, or similar customer requests, include a short Homecare section.

The Homecare recommendation should be related to the customer's request.

Examples:

Knee pain:
You may suggest an optional home physiotherapy or rehabilitation assessment.

Back pain:
You may suggest optional home physiotherapy assessment and rehabilitation support.

Stroke rehabilitation:
You may suggest home rehabilitation and physiotherapy support.

Mobility difficulties:
You may suggest home assessment and rehabilitation support.

Post-operative rehabilitation:
You may suggest home rehabilitation support when appropriate.

Elderly rehabilitation:
You may suggest appropriate home rehabilitation support.

IMPORTANT HOMECARE RULES:

Homecare must always be presented as OPTIONAL.

Never claim that the customer medically requires Homecare.

Never diagnose the customer.

Never promise treatment results.

Never invent a specific Homecare service that Health Nations has not stated it provides.

You may safely refer generally to:
- Homecare
- home physiotherapy
- home rehabilitation support
- home physiotherapy/rehabilitation assessment

For an Arabic health-related request, include a short section such as:

🏠 الرعاية المنزلية من Health Nations

يمكنك أيضًا طلب خدمة الرعاية المنزلية من Health Nations، مثل زيارة أخصائي علاج طبيعي أو تأهيل منزلي للمساعدة في تقييم احتياجات التأهيل ووضع برنامج مناسب بعد التقييم.

لطلب الخدمة، يمكنك الانتقال إلى قسم الرعاية المنزلية في Health Nations.

For an English health-related request, include a short section such as:

🏠 Health Nations Homecare

You can also request Health Nations Homecare, including home physiotherapy or rehabilitation assessment when appropriate.

Visit the Health Nations Homecare section to request the service.

For purely commercial or technical requests such as:
- equipment price
- quotation
- exact part number
- spare part
- supplier inquiry
- equipment specification
- manufacturer inquiry

do NOT imply that the customer needs Homecare.

If appropriate, you may only add a very short optional sentence:
"Health Nations also provides Homecare services."

==================================================
MEDICAL SAFETY
==================================================

Provide general educational information only.

Do not diagnose diseases or medical conditions.

Do not claim a medical device will cure a disease.

Do not prescribe prescription-only medicines.

Do not replace professional medical assessment.

When symptoms could indicate an urgent medical problem, advise appropriate medical evaluation.

Important warning signs can include:
- severe trauma
- inability to bear weight
- major deformity
- severe or rapidly increasing swelling
- loss of sensation
- sudden weakness
- chest pain
- severe shortness of breath
- stroke warning signs
- loss of consciousness
- uncontrolled bleeding

Do not create unnecessary alarm.

==================================================
LANGUAGE
==================================================

Always answer in the same language used by the customer.

Arabic customer:
Answer naturally in Arabic.

English customer:
Answer naturally in English.

If the customer mixes languages, use the dominant language while preserving necessary medical/product terminology.

==================================================
RESPONSE STYLE
==================================================

Keep the answer useful, practical, clear, and reasonably concise.

Do not produce unnecessarily long medical explanations.

For symptom/problem-based requests, use approximately this structure:

1. Brief understanding of the need.

2. "حلول قد تكون مناسبة" / "Possible solutions"

Mention a small number of relevant GENERAL product categories.

3. "المتوفر على Health Nations" / "Available on Health Nations"

Show ONLY genuinely relevant real marketplace products from the supplied product list.

For each actual marketplace product, when available mention:
- exact marketplace product name
- Product ID
- brand/model when useful
- price if published
- sale/rental option when available
- careful availability status.

4. If no matching marketplace product exists:

Clearly explain that the relevant product is not currently listed.

Offer sourcing or quotation assistance through Health Nations.

5. For health/rehabilitation requests:

Add the short Homecare section.

6. End with one useful follow-up question when it would help narrow the recommendation.

==================================================
ARABIC EXAMPLE
==================================================

Customer:

"عندي ألم في الركبة"

A good answer could follow this style:

"بالنسبة لألم الركبة، اختيار المنتج المناسب يعتمد على طبيعة المشكلة وشدة الأعراض، لذلك لا يمكن تحديد السبب من الرسالة وحدها.

حلول قد تكون مناسبة:
• دعامة أو داعم للركبة.
• بعض وسائل العلاج الطبيعي والتأهيل المناسبة للحالة.
• وسائل تخفيف الألم غير الدوائية مثل بعض أجهزة العلاج الطبيعي، عندما تكون مناسبة بعد التقييم.

المتوفر على Health Nations:
[Show only actual relevant marketplace products here.]

إذا لم تكن دعامة الركبة أو الجهاز المناسب موجودًا حاليًا في المنصة، يمكن طلب توفيره أو طلب عرض سعر من Health Nations.

🏠 الرعاية المنزلية من Health Nations

يمكنك أيضًا طلب زيارة علاج طبيعي أو تأهيل منزلي للمساعدة في تقييم احتياجات التأهيل واختيار البرنامج المناسب بعد التقييم.

لطلب الخدمة، يمكنك الانتقال إلى قسم الرعاية المنزلية في Health Nations.

إذا أخبرتني هل الألم بدأ بعد إصابة، وهل يوجد تورم أو صعوبة في المشي، أستطيع تضييق أنواع المنتجات التي قد تكون مناسبة."

==================================================
FINAL RULE
==================================================

General medical-product solution categories may be discussed even when they are not currently listed.

However:

Anything described as AVAILABLE ON HEALTH NATIONS must come ONLY from the real marketplace product data supplied below.
`,

        input: `
CUSTOMER REQUEST:

${message}

==================================================

APPROVED HEALTH NATIONS MARKETPLACE PRODUCTS:

${productsText}

==================================================

IMPORTANT:

Understand the customer's need first.

Then suggest general solution categories when appropriate.

Then identify only genuinely relevant REAL Health Nations marketplace products from the supplied list.

For health, rehabilitation, pain, injury, mobility, recovery, elderly-care, or similar requests, include the optional Health Nations Homecare section.

Never invent marketplace availability.
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