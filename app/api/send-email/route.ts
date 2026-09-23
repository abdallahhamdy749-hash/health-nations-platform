import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      to,
      subject,
      html,
    } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        {
          error: "to, subject and html are required",
        },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: "RESEND_API_KEY is not configured",
        },
        { status: 500 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Health Nations <info@healthnationsplat.com>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Send email error:", error);

    return NextResponse.json(
      {
        error: "Failed to send email",
      },
      { status: 500 }
    );
  }
}