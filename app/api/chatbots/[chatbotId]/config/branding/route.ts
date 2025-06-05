// File: /app/api/chatbots/[chatbotId]/config/branding/route.ts

import { NextResponse } from "next/server";
// Relative path to lib/auth.ts (go up 6 levels: /app → /api → /chatbots → /[chatbotId] → /config → /branding)
import { authOptions } from "../../../../../../../lib/auth";
import { getServerSession } from "next-auth";
import { z } from "zod";
// Relative path to your Prisma client (lib/prisma.ts)
import prisma from "../../../../../../../lib/prisma";
// Relative path to RequiresHigherPlanError (lib/exceptions.ts)
import { RequiresHigherPlanError } from "../../../../../../../lib/exceptions";
// Relative path to subscription logic (lib/subscription.ts)
import { getUserSubscriptionPlan } from "../../../../../../../lib/subscription";
// Relative path to your Zod schema (lib/validations/chatBrandingConfig.ts)
import { chatBrandingSettingsSchema } from "../../../../../../../lib/validations/chatBrandingConfig";

// ────────────────────────────────────────────────────────────────────────────────────
// Prevent Next.js from trying to import/collect this route at build time.
// Only run code here when an actual HTTP PATCH request comes in.
// ────────────────────────────────────────────────────────────────────────────────────
export const dynamic = "force-dynamic";

// Validate the route param “chatbotId”
const paramsSchema = z.object({
  chatbotId: z.string().nonempty("chatbotId is required"),
});

/** 
 * Helper: Check that the logged‐in user actually owns this chatbot.
 * All DB calls are inside this function so nothing runs at build time.
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
  // 1) Validate and extract chatbotId
  let chatbotId: string;
  try {
    ({ chatbotId } = paramsSchema.parse(params));
  } catch (err) {
    // ZodError if chatbotId is missing
    return NextResponse.json(
      { errors: (err as z.ZodError).issues },
      { status: 400 }
    );
  }

  try {
    // 2) Verify user owns this chatbot
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

    // 4) Parse and validate request body
    const body = await req.json();
    const payload = chatBrandingSettingsSchema.parse(body);
    // chatBrandingSettingsSchema should be something like:
    //   z.object({ displayBranding: z.boolean() });

    // 5) Perform the DB update
    const updatedChatbot = await prisma.chatbot.update({
      where: { id: chatbotId },
      data: { displayBranding: payload.displayBranding },
      select: {
        id: true,
        name: true,
        displayBranding: true,
      },
    });

    // 6) Return the updated record
    return NextResponse.json(updatedChatbot);
  } catch (error) {
    console.error("PATCH /branding error:", error);

    // 7) Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.issues },
        { status: 422 }
      );
    }

    // 8) Handle “requires higher plan”
    if (error instanceof RequiresHigherPlanError) {
      return NextResponse.json(
        { error: "Requires Higher Plan" },
        { status: 402 }
      );
    }

    // 9) Generic 500
    return NextResponse.json(null, { status: 500 });
  }
}
