import { Resend } from "resend";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? "noreply@demandradar.hn";
  await resend.emails.send({ from, to, subject, html });
}
