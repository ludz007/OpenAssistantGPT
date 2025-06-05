// app/api/chatbots/[chatbotId]/config/branding/route.js

import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { RequiresHigherPlanError } from "@/lib/exceptions";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { chatBrandingSettingsSchema } from "@/lib/validations/chatBrandingConfig";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { NextResponse } from "next/server";

/**
 * Tell Next.js: “Do not try to static‐analyze this route at build time.
 * Treat it as fully dynamic—only run its code when an actual request comes in.”
 */
export const dynamic = "force-dynamic";

/**
 * (Optional) You can also explicitly set revalidation to 0:
 * export const revalidate = 0;
 */

/**
 * Helper: Verify that the currently logged-in user actually owns the chatbot.
 * All database calls happen inside this function, which is only called at runtime.
 */
async function verifyCurrentUserHasAccessToChatbot(chatbotId) {
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

/**
 * PATCH /api/chatbots/[chatbotId]/config/branding
 *
 * This handler updates only the `displayBranding` flag for a given chatbot,
 * after checking that:
 *  1) The user is authenticated and owns this chatbot.
 *  2) The user’s subscription plan allows “brandingCustomization.”
 *  3) The request body conforms to `chatBrandingSettingsSchema`.
 *
 * All Prisma/database calls and Zod parsing happen inside this function,
 * so nothing runs at build time. Any errors get caught in the try/catch below.
 */
export async function PATCH(req, { params }) {
  // Validate the route parameter with Zod:
  const paramSchema = z.object({
    chatbotId: z.string().nonempty("chatbotId is required"),
  });

  let chatbotId;
  try {
    ({ chatbotId } = paramSchema.parse(params));
  } catch (parseError) {
    // If params.chatbotId is missing or invalid:
    return NextResponse.json(
      { error: parseError.issues },
      { status: 400 }
    );
  }

  try {
    // 1) Ensure the user is logged in and owns this chatbot:
    const hasAccess = await verifyCurrentUserHasAccessToChatbot(chatbotId);
    if (!hasAccess) {
      return NextResponse.json(null, { status: 403 });
    }

    // 2) Check subscription plan:
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || "";
    const subscriptionPlan = await getUserSubscriptionPlan(userId);
    if (subscriptionPlan.brandingCustomization === false) {
      throw new RequiresHigherPlanError();
    }

    // 3) Parse and validate the request body:
    const body = await req.json();
    const payload = chatBrandingSettingsSchema.parse(body);
    //   chatBrandingSettingsSchema might look like:
    //     z.object({ displayBranding: z.boolean() });

    // 4) Update the chatbot in the database:
    const updated = await db.chatbot.update({
      where: { id: chatbotId },
      data: { displayBranding: payload.displayBranding },
      select: {
        id: true,
        name: true,
        displayBranding: true,
      },
    });

    // 5) Return the updated chatbot record as JSON:
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /config/branding error:", error);

    // 6) Handle Zod validation errors:
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.issues },
        { status: 422 }
      );
    }

    // 7) If user’s plan is too low:
    if (error instanceof RequiresHigherPlanError) {
      return NextResponse.json(
        { error: "Requires Higher Plan" },
        { status: 402 }
      );
    }

    // 8) Generic 500 for anything else:
    return NextResponse.json(null, { status: 500 });
  }
}
