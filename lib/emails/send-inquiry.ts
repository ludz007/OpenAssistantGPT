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
      "sendInquiryEmail: RESEND_API_KEY is not set. Skipping email notification."
    );
    return;
  }

  // Dynamically import Resend so this module never breaks at build time.
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  // Customize your email options however you like:
  const emailOptions: ResendEmailOptions = {
    from: "no-reply@yourdomain.com",
    to: "owner@yourdomain.com", // or fetch the chatbot owner’s email from DB if needed
    subject: `New Inquiry for Chatbot ${params.chatbotId}`,
    html: `
      <p>You have a new inquiry for your chatbot (ID: ${params.chatbotId}).</p>
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
