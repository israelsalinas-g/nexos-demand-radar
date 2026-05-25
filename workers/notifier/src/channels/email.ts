import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "noreply@demandradar.hn";
  await resend.emails.send({ from, to, subject, html });
}
