// src/lib/mailer.ts
import "server-only";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import { Buffer } from "buffer"; // explicit, optional once @types/node is installed

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function registerEmailPartialsIfNeeded() {
  const partialsDir = path.join(process.cwd(), "src", "emails");
  try {
    if (!fs.existsSync(partialsDir)) return; // nothing to do
    const files = fs.readdirSync(partialsDir);
    files.forEach((f) => {
      if (!f.endsWith(".hbs")) return;

      // ignore main templates like welcome.hbs
      if (!f.startsWith("_")) return; // only treat _header.hbs, _footer.hbs as partials
      
      const name = path.basename(f, ".hbs");
      const filePath = path.join(partialsDir, f);
      try {
        const content = fs.readFileSync(filePath, "utf8");
        // Register partial only once (Handlebars overwrites if re-registered)
        Handlebars.registerPartial(name, content);
      } catch (innerErr) {
        console.warn(`Failed to load partial ${f}:`, innerErr);
      }
    });
  } catch (err) {
    console.warn("Could not read email partials dir:", err);
  }
}

function renderTemplate(templateName: string, data: Record<string, any>) {
  // ensure partials are loaded before compiling
  registerEmailPartialsIfNeeded();

  const templatePath = path.join(process.cwd(), "src", "emails", `${templateName}.hbs`);
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Email template not found: ${templatePath}`);
  }

  const tplStr = fs.readFileSync(templatePath, "utf8");
  const tpl = Handlebars.compile(tplStr);
  return tpl(data);
}

type Attachment = { filename: string; content: Buffer | string; contentType?: string };

export async function sendMail({
  to,
  subject,
  template,
  templateData,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  template?: string;
  templateData?: Record<string, any>;
  html?: string;
  attachments?: Attachment[];
}) {
  const compiledHtml = html ?? (template ? renderTemplate(template, templateData ?? {}) : undefined);

  const mailOptions: any = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: compiledHtml,
  };

  if (attachments && attachments.length) {
    mailOptions.attachments = attachments.map((a) => ({
      filename: a.filename,
      content: a.content instanceof Buffer ? a.content : Buffer.from(String(a.content)),
      contentType: a.contentType,
    }));
  }

  // src/lib/mailer.ts (modify around transporter.sendMail)
try {
    const info = await transporter.sendMail(mailOptions);
    console.log("sendMail: success, messageId=", info?.messageId ?? info);
    // for SMTP servers you can also log the response:
    console.log("sendMail: response=", info?.response ?? JSON.stringify(info));
    return info;
  } catch (err) {
    console.error("sendMail: failed:", err);
    throw err; // rethrow if you want upstream to handle it
  }  
}
