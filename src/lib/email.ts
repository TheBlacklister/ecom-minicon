// src/lib/email.ts
import { sendMail } from "./mailer";

export async function sendWelcomeEmail(to: string, opts: { customerName?: string } = {}) {
  const { customerName } = opts;
  try {
    await sendMail({
      to,
      subject: `Welcome to MINICON${customerName ? ", " + customerName : ""}`,
      template: "welcome",           // matches src/emails/welcome.hbs
      templateData: {
        customerName,
        email: to,
      },
    });
    console.log(`sendWelcomeEmail: sent to ${to}`);
  } catch (err) {
    console.error(`sendWelcomeEmail: failed for ${to}`, err);
    throw err;
  }
}
