// File: /app/api/chatbots/[chatbotId]/config/branding/route.ts

import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { z } from "zod";
import prisma from "@/lib/prisma";      // adjust path if needed
import { RequiresHigherPlanError } from "@/lib/exceptions";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { chatBrandingSettingsSchema } from "@/lib/validations/chatBrandingConfig";

// ────────────────────────────────────────────────────────────────────────────────────
// Prevent Next.js from statically collecting this API route at build time.
// Only run this code when a request actually arrives.
// ────────────────────────────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  chatbotId: z.string().nonempty("chatbotId is required"),
});

/**
 * Helper: Check if the current user (from session) owns this chatbotId.
 */
async function verifyCurrentUserHasAccessToChatbot(chatbotId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return false;
  }
  const count = await prisma.chatbot.count({
    where: {
      id: chatbotId,
      userId: session.user.id,
    },
  });
  return count > 0;
}

export async function PATCH(
  req: Request,
  { params }: { params: { chatbotId: string } }
) {
  // 1) Validate the chatbotId parameter
  let chatbotId: string;
  try {
    ({ chatbotId } = paramsSchema.parse(params));
  } catch (parseError) {
    return NextResponse.json(
      { errors: (parseError as z.ZodError).issues },
      { status: 400 }
    );
  }

  try {
    // 2) Verify ownership
    if (!(await verifyCurrentUserHasAccessToChatbot(chatbotId))) {
      return NextResponse.json(null, { status: 403 });
    }

    // 3) Check subscription plan
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "";
    const subscriptionPlan = await getUserSubscriptionPlan(userId);
    if (subscriptionPlan.brandingCustomization === false) {
      throw new RequiresHigherPlanError();
    }

    // 4) Parse request body and validate with Zod
    const body = await req.json();
    const payload = chatBrandingSettingsSchema.parse(body);
    //    chatBrandingSettingsSchema should be something like:
    //    z.object({ displayBranding: z.boolean() });

    // 5) Update the chatbot’s displayBranding in DB
    const updatedChatbot = await prisma.chatbot.update({
      where: { id: chatbotId },
      data: { displayBranding: payload.displayBranding },
      select: {
        id: true,
        name: true,
        displayBranding: true,
      },
    });

    // 6) Return the updated chatbot record
    return NextResponse.json(updatedChatbot);
  } catch (error) {
    console.error("PATCH /config/branding error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.issues },
        { status: 422 }
      );
    }
    if (error instanceof RequiresHigherPlanError) {
      return NextResponse.json(
        { error: "Requires Higher Plan" },
        { status: 402 }
      );
    }
    return NextResponse.json(null, { status: 500 });
  }
}
