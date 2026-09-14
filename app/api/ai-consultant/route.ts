import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Product = {
  id: string;
  name_en: string | null;
  name_ar: string | null;
  category: string | null;
  stock: number | null;
};

type OpenAIErrorShape = {
  message?: unknown;
  code?: unknown;
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
    const openaiApiKey =
      process.env.OPENAI_API_KEY;

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!openaiApiKey) {
      return NextResponse.json(
        {
          error:
            "مفتاح OpenAI غير موجود داخل ملف .env.local.",
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
      typeof (body as { message?: unknown })
        .message === "string"
        ? (body as { message: string }).message
        : null;

    if (!message || message.trim().length === 0) {
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
      .from("products")
      .select(
        "id, name_en, name_ar, category, stock"
      )
      .limit(100);

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

    const availableProducts = (
      (products ?? []) as Product[]
    ).filter(
      (product) =>
        Number(product.stock ?? 0) > 0
    );

    if (availableProducts.length === 0) {
      return NextResponse.json({
        reply:
          "لا توجد منتجات متاحة حاليًا داخل المنصة. يمكنك إرسال طلب عرض سعر وسيتواصل معك فريق شركة صحة الأمم الطبية.",
      });
    }

    const productsText = availableProducts
      .map((product, index) =>
        [
          `${index + 1}.`,
          `رقم المنتج: ${product.id}`,
          `الاسم العربي: ${
            product.name_ar || "غير متوفر"
          }`,
          `الاسم الإنجليزي: ${
            product.name_en || "غير متوفر"
          }`,
          `التصنيف: ${
            product.category || "غير محدد"
          }`,
          `المخزون: ${product.stock ?? 0}`,
        ].join("\n")
      )
      .join("\n\n");

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    try {
      const response =
        await openai.responses.create({
          model: "gpt-5-mini",

          instructions: `
أنت مساعد المبيعات الذكي لمنصة Health Nations Medical.

قواعد إلزامية:
1. لا تقترح أي منتج غير موجود في قائمة منتجات المنصة.
2. لا تخترع أسماء منتجات أو أسعارًا أو مواصفات.
3. اختر فقط المنتجات المناسبة لطلب العميل من القائمة.
4. إذا لم تجد منتجًا مناسبًا، قل: "لا يوجد منتج مطابق لطلبك حاليًا داخل المنصة."
5. لا تقل إن المنتج متوفر إلا إذا كان موجودًا في القائمة ومخزونه أكبر من صفر.
6. اذكر اسم المنتج كما هو مسجل في المنصة.
7. لا تذكر سعرًا إلا إذا كان موجودًا صراحة في بيانات المنتج.
8. قدّم معلومات صحية عامة فقط، ولا تشخّص الأمراض.
9. لا تصف أدوية تحتاج إلى وصفة طبية.
10. عند وجود أعراض خطيرة، وجّه المستخدم إلى الطبيب أو الطوارئ.
11. أجب باللغة التي يستخدمها العميل.
12. عند وجود منتج مناسب، اختم باقتراح إرسال طلب عرض سعر.
          `,

          input: `
طلب العميل:
${message.trim()}

هذه هي المنتجات الوحيدة المسموح لك باقتراحها:
${productsText}
          `,
        });

      return NextResponse.json({
        reply:
          response.output_text?.trim() ||
          "لم أجد منتجًا مناسبًا داخل المنصة حاليًا.",
      });
    } catch (openaiError: unknown) {
      console.error(
        "AI CONSULTANT ERROR:",
        openaiError
      );

      const openaiMessage =
        getOpenAIErrorMessage(openaiError);

      const status =
        getOpenAIErrorStatus(openaiError);

      return NextResponse.json(
        { error: openaiMessage },
        { status }
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