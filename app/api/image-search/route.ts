import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ImageSearchResult = {
  productName: string;
  category: string;
  brand: string;
  model: string;
  searchQuery: string;
  confidence: "high" | "medium" | "low";
};

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");

    if (!(image instanceof File)) {
      return NextResponse.json(
        {
          error: "No image was uploaded.",
        },
        {
          status: 400,
        }
      );
    }

    if (!image.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "Uploaded file must be an image.",
        },
        {
          status: 400,
        }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (image.size > maxSize) {
      return NextResponse.json(
        {
          error: "Image must be smaller than 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    const arrayBuffer =
      await image.arrayBuffer();

    const base64Image =
      Buffer.from(arrayBuffer).toString(
        "base64"
      );

    const imageDataUrl =
      `data:${image.type};base64,${base64Image}`;

    const response =
      await openai.responses.create({
        model: "gpt-5.5",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
Analyze this image as a medical marketplace product identification task.

Your job is to identify the visible medical device, medical equipment, instrument, consumable, rehabilitation product, hospital item, cosmetic device, laboratory item, dental item, or healthcare product.

Return ONLY valid JSON.

Use this exact structure:

{
  "productName": "",
  "category": "",
  "brand": "",
  "model": "",
  "searchQuery": "",
  "confidence": "high"
}

Rules:

1. productName:
Give the clearest generic or commercial product name visible in the image.

2. category:
Give a short medical marketplace category.

3. brand:
If a brand is clearly visible, return it.
Otherwise return an empty string.

4. model:
If a model number/name is clearly visible, return it.
Otherwise return an empty string.

5. searchQuery:
Create the best short marketplace search query.
Include product type first, then brand/model if confidently identified.

Examples:

CTG fetal monitor EDAN
Shockwave therapy device
Patient monitor Mindray
Dental chair
Electric examination table
Surgical light
Ultrasound machine
Wheelchair
Suction machine

6. confidence:
Must be one of:
"high"
"medium"
"low"

Do not guess a brand or model if it is not visible.
Do not include markdown.
Do not include explanations outside the JSON.
                `.trim(),
              },
              {
                type: "input_image",
                image_url:
                  imageDataUrl,
                detail: "auto",
              },
            ],
          },
        ],
      });

    const rawResult =
      response.output_text.trim();

    let parsedResult: ImageSearchResult;

    try {
      const cleanedResult =
        rawResult
          .replace(/^```json/i, "")
          .replace(/^```/i, "")
          .replace(/```$/i, "")
          .trim();

      parsedResult =
        JSON.parse(cleanedResult) as ImageSearchResult;
    } catch {
      console.error(
        "Unable to parse image AI response:",
        rawResult
      );

      return NextResponse.json(
        {
          error:
            "Unable to understand the AI image response.",
        },
        {
          status: 500,
        }
      );
    }

    const result: ImageSearchResult = {
      productName:
        parsedResult.productName?.trim() ||
        "",
      category:
        parsedResult.category?.trim() ||
        "",
      brand:
        parsedResult.brand?.trim() ||
        "",
      model:
        parsedResult.model?.trim() ||
        "",
      searchQuery:
        parsedResult.searchQuery?.trim() ||
        parsedResult.productName?.trim() ||
        "",
      confidence:
        parsedResult.confidence === "high" ||
        parsedResult.confidence ===
          "medium" ||
        parsedResult.confidence === "low"
          ? parsedResult.confidence
          : "low",
    };

    if (!result.searchQuery) {
      return NextResponse.json(
        {
          error:
            "The product could not be identified from this image.",
        },
        {
          status: 422,
        }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: unknown) {
    console.error(
      "Image search API error:",
      error
    );

    return NextResponse.json(
      {
        error: getErrorMessage(
          error,
          "Unable to analyze the image."
        ),
      },
      {
        status: 500,
      }
    );
  }
}

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (
        error as {
          message?: unknown;
        }
      ).message
    );
  }

  if (typeof error === "string") {
    return error;
  }

  return fallback;
}