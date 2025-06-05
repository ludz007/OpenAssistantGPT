// File: /app/api/chatbots/[chatbotId]/inquiries/route.ts

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "../../../../../../lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { z } from "zod";

const inquirySchema = z.object({
  message: z.string().min(1),
  email: z.string().email(),
});

export async function POST(
  req: Request,
  { params }: { params: { chatbotId: string } }
) {
  const { chatbotId } = params;
  if (!chatbotId) {
    return NextResponse.json(
      { error: "Missing chatbotId parameter." },
      { status: 400 }
    );
  }

  let payload: z.infer<typeof inquirySchema>;
  try {
    const body = await req.json();
    payload = inquirySchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { errors: (err as z.ZodError).issues },
      { status: 422 }
    );
  }

  // (Optional) Check ownership if you want:
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) return NextResponse.json(null, { status: 401 });
  // const isOwner = await db.chatbot.count({
  //   where: { id: chatbotId, userId: session.user.id },
  // });
  // if (!isOwner) return NextResponse.json(null, { status: 403 });

  try {
    const newInquiry = await db.inquiry.create({
      data: {
        chatbotId,
        email: payload.email,
        message: payload.message,
        createdAt: new Date(),
      },
      select: { id: true, email: true, message: true, createdAt: true },
    });

    // Lazy‐load the Resend‐based notification:
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const { sendInquiryEmail } = await import(
        "../../../../../../lib/emails/send-inquiry"
      );
      await sendInquiryEmail({
        chatbotId,
        from: payload.email,
        message: payload.message,
      });
    } else {
      console.warn(
        "POST /inquiries: RESEND_API_KEY not set—skipping email."
      );
    }

    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    console.error("POST /inquiries error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
