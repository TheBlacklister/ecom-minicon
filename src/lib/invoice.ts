// src/lib/invoice.ts
import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export async function generateInvoiceBuffer(order: any): Promise<Buffer> {
  // Create PDF document
  const pdfDoc = await PDFDocument.create();

  // Register fontkit so pdf-lib can embed TTF fonts
  pdfDoc.registerFontkit(fontkit);

  // Load custom TTF font (must exist at this path)
  const fontPath = path.join(process.cwd(), "src", "fonts", "OpenSans.ttf");
  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font not found at ${fontPath}`);
  }
  const fontBytes = fs.readFileSync(fontPath);
  const customFont = await pdfDoc.embedFont(fontBytes);

  // Create page
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width } = page.getSize();
  let y = 800;
  const fontSize = 12;

  // Header
  page.drawText("MINICON", { x: 40, y, size: 24, font: customFont });
  page.drawText(`Invoice #${order.id ?? "N/A"}`, { x: width - 200, y, size: 14, font: customFont });
  y -= 40;

  // Customer info
  page.drawText(`Customer: ${order.customerName ?? order.email}`, { x: 40, y, size: fontSize, font: customFont });
  y -= 20;
  page.drawText(`Email: ${order.email ?? "—"}`, { x: 40, y, size: fontSize, font: customFont });
  y -= 20;
  page.drawText(`Date: ${new Date(order.created_at ?? Date.now()).toLocaleString()}`, { x: 40, y, size: fontSize, font: customFont });
  y -= 40;

  // Items
  page.drawText("Items:", { x: 40, y, size: 14, font: customFont });
  y -= 25;
  const items = order.items ?? [];
  items.forEach((it: any, idx: number) => {
    const title = it.product?.title ?? it.title ?? "Item";
    const qty = it.quantity ?? 1;
    const price = it.price ?? it.product?.price_after ?? 0;
    page.drawText(`${idx + 1}. ${title} — qty: ${qty} — price: ₹${price}`, {
      x: 40,
      y,
      size: fontSize,
      font: customFont,
    });
    y -= 20;
  });

  y -= 30;
  page.drawText(`Total: ₹${order.total ?? order.total_amount ?? 0}`, { x: width - 200, y, size: 16, font: customFont });
  y -= 40;
  page.drawText("Thank you for shopping with MINICON!", { x: 40, y, size: fontSize, font: customFont });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
