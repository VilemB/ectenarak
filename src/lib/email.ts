import { Resend } from "resend";
import WelcomeEmail from "@/components/emails/WelcomeEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping welcome email.");
    return;
  }

  const fromAddress =
    process.env.EMAIL_FROM || "eČtenářák <noreply@ectenarak.cz>";

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: "Vítejte v eČtenářáku!",
      react: WelcomeEmail({ name }) as React.ReactElement,
    });

    if (error) {
      console.error("Error sending welcome email to:", email, error);
      // Depending on requirements, you might want to throw the error
      // or handle it differently (e.g., queue for retry)
      return; // Proceed with registration even if email fails
    }

    console.log("Welcome email sent successfully to:", email, "ID:", data?.id);
  } catch (exception) {
    console.error("Failed to send welcome email to:", email, exception);
    // Handle exceptions during the send call
  }
}
