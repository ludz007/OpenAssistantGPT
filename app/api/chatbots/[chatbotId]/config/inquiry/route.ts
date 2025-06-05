// File: /app/api/chatbots/[chatbotId]/inquiries/route.ts

import { NextResponse } from "next/server";
// Adjust this relative path to whichever file exports your Prisma client:
import { db } from "../../../../../../lib/db";
// If you need authentication/session checks, import these too:
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { z } from "zod";

/**
 * Prevent Next.js from importing this file at build time.
 * Only run its code when a real HTTP request arrives.
 */
export const dynamic = "force-dynamic";

// Example Zod schema for the inquiry body. Adjust fields as needed.
const inquirySchema = z.object({
  message: z.string().min(1, "Message cannot be empty"),
  email: z.string().email("Invalid email address"),
});

export async function POST(
  req: Request,
  { params }: { params: { chatbotId: string } }
) {
  // 1) Validate the chatbotId from the URL
  const { chatbotId } = params;
  if (!chatbotId) {
    return NextResponse.json(
      { error: "Missing chatbotId parameter." },
      { status: 400 }
    );
  }

  // 2) Parse & validate the request body
  let payload: z.infer<typeof inquirySchema>;
  try {
    const body = await req.json();
    payload = inquirySchema.parse(body);
  } catch (err) {
    // If Zod throws, return 422 with detailed issues
    const zodError = err as z.ZodError;
    return NextResponse.json(
      { errors: zodError.issues },
      { status: 422 }
    );
  }

  // 3) (Optional) Verify that the user is authenticated and owns this chatbot
  //    If you require auth, uncomment the following lines:
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   return NextResponse.json(null, { status: 401 });
  // }
  // const isOwner = await db.chatbot.count({
  //   where: { id: chatbotId, userId: session.user.id },
  // });
  // if (!isOwner) {
  //   return NextResponse.json(null, { status: 403 });
  // }

  try {
    // 4) Save the inquiry to your database (example)
    const newInquiry = await db.inquiry.create({
      data: {
        chatbotId: chatbotId,
        email: payload.email,
        message: payload.message,
        createdAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        message: true,
        createdAt: true,
      },
    });

    // 5) Lazy‐load the “send inquiry notification” email logic (using Resend)
    //    so that Resend is only constructed at runtime (never at build time).
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      // Dynamically import the sendInquiryEmail helper
      const { sendInquiryEmail } = await import(
        "../../../../../../lib/emails/send-inquiry"
      );

      // Call it (it will internally do `new Resend(resendApiKey)` at runtime).
      // You might pass the chatbot owner’s email, or any address you want:
      await sendInquiryEmail({
        chatbotId,
        from: payload.email,
        message: payload.message,
      });
    } else {
      console.warn(
        "POST /inquiries: RESEND_API_KEY not set—skipping email notification."
      );
    }

    // 6) Return the created inquiry record
    return NextResponse.json(newInquiry, { status: 201 });
  } catch (error) {
    console.error("POST /inquiries error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
