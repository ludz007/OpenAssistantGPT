// File: /app/api/chatbots/[chatbotId]/config/branding/route.ts

import { NextResponse } from "next/server";
// 6 levels up: branding → config → [chatbotId] → chatbots → api → app → (root) → lib/auth
import { authOptions } from "../../../../../../lib/auth";
// NextAuth session helper
import { getServerSession } from "next-auth";
import { z } from "zod";
// 6 levels up to get your Prisma client
import { db } from "../../../../../../lib/db";
// 6 levels up to get your exceptions
import { RequiresHigherPlanError } from "../../../../../../lib/exceptions";
// 6 levels up to get your subscription logic
import { getUserSubscriptionPlan } from "../../../../../../lib/subscription";
// 6 levels up to get your Zod schema
import { chatBrandingSettingsSchema } from "../../../../../../lib/validations/chatBrandingConfig";

export const dynamic = "force-dynamic";

// Validate the route parameter “chatbotId”
const paramsSchema = z.object({
  chatbotId: z.string().nonempty("chatbotId is required"),
});

/**
 * Verify that the current session user actually owns this chatbot.
 * All DB calls happen inside this function so nothing runs at build time.
 */
async function verifyCurrentUserHasAccessToChatbot(chatbotId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return false;
  }
  const count = await db.chatbot.count({
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
  // 1) Validate “chatbotId”
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
    // 2) Confirm the user owns this chatbot
    if (!(await verifyCurrentUserHasAccessToChatbot(chatbotId))) {
      return NextResponse.json(null, { status: 403 });
    }

    // 3) Check subscription
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "";
    const subscriptionPlan = await getUserSubscriptionPlan(userId);
    if (subscriptionPlan.brandingCustomization === false) {
      throw new RequiresHigherPlanError();
    }

    // 4) Parse & validate request body (displayBranding: boolean)
    const body = await req.json();
    const payload = chatBrandingSettingsSchema.parse(body);
    // chatBrandingSettingsSchema should be:
    //   z.object({ displayBranding: z.boolean() });

    // 5) Perform the DB update
    const updatedChatbot = await db.chatbot.update({
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
