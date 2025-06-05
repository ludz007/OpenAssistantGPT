// File: /lib/emails/send-welcome.ts

import type { ResendEmailOptions } from "resend";

export async function sendWelcomeEmail(params: { name: string; email: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    // If no key is set, just skip sending email (never crash)
    console.warn(
      "sendWelcomeEmail: RESEND_API_KEY is not set. Skipping email send."
    );
    return;
  }

  // Only construct the Resend client at runtime, once the API key is guaranteed to exist.
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  // You can adjust this template as needed:
  const emailOptions: ResendEmailOptions = {
    from: "no-reply@yourdomain.com",
    to: params.email,
    subject: "Welcome to OpenAssistantGPT!",
    html: `<p>Hi ${params.name}, welcome aboard our platform.</p>`,
  };

  try {
    await resend.sendEmail(emailOptions);
  } catch (err) {
    console.error("Failed to send welcome email:", err);
  }
}
