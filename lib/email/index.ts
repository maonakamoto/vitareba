import { Resend } from "resend";
import { DEFAULT_FROM_EMAIL } from "@/lib/config/company";

// Lazy client — only instantiated when RESEND_API_KEY is present at call time
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM ?? DEFAULT_FROM_EMAIL;

type SendOptions = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendOptions) {
  if (!process.env.RESEND_API_KEY) {
    // Dev/build without key: log so developers see the email content
    console.log(`[email] To: ${JSON.stringify(to)}\nSubject: ${subject}`);
    return;
  }
  await getResend().emails.send({
    from: FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  });
}
