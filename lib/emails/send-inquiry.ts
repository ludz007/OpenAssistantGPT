// File: /lib/emails/send-inquiry.ts

import type { ResendEmailOptions } from "resend";

export async function sendInquiryEmail(params: {
  chatbotId: string;
  from: string;
  message: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn(
      "sendInquiryEmail: RESEND_API_KEY not set; skipping email."
    );
    return;
  }

  // Only import Resend after EV is loaded at runtime:
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  const emailOptions: ResendEmailOptions = {
    from: "no-reply@yourdomain.com",
    to: "owner@yourdomain.com",
    subject: `New inquiry for Chatbot ${params.chatbotId}`,
    html: `
      <p>You have a new inquiry for Chatbot ID: ${params.chatbotId}</p>
      <p><strong>From:</strong> ${params.from}</p>
      <p><strong>Message:</strong><br/>${params.message}</p>
    `,
  };

  try {
    await resend.sendEmail(emailOptions);
  } catch (err) {
    console.error("Failed to send inquiry email:", err);
  }
}
