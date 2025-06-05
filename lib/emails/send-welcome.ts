// File: /lib/emails/send-welcome.ts

import type { ResendEmailOptions } from "resend";

export async function sendWelcomeEmail(params: { name: string; email: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn(
      "sendWelcomeEmail: RESEND_API_KEY not set; skipping welcome email."
    );
    return;
  }
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  const emailOptions: ResendEmailOptions = {
    from: "no-reply@yourdomain.com",
    to: params.email,
    subject: "Welcome to OpenAssistantGPT!",
    html: `<p>Hi ${params.name}, welcome aboard!</p>`,
  };

  try {
    await resend.sendEmail(emailOptions);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}
