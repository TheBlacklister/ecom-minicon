import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifyAdmin } from "@/lib/adminGuard";

const uploadDir = path.join(process.cwd(), "public/products/temp");

export async function POST(req: NextRequest) {
  // 🔐 Protect route
  const auth = await verifyAdmin(req);
  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    await mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${file.name}`;

      await writeFile(path.join(uploadDir, fileName), buffer);

      urls.push(`/products/temp/${fileName}`);
    }

    return NextResponse.json({ urls });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}