import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { verifyAdmin } from "@/lib/adminGuard";

const desktopPath = path.join(process.cwd(), "public/DesktopBanners");
const mobilePath = path.join(process.cwd(), "public/MobileBanners");

export async function POST(req: NextRequest) {

  const auth = await verifyAdmin(req);

  if ("error" in auth) {
    return new Response(auth.error, { status: auth.status });
  }
  
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const index = formData.get("index"); // optional

    if (!file || !type) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();

    let fileName = "";
    let savePath = "";
    let publicPath = "";

    /* ================= DESKTOP ================= */
    if (type === "desktop-banner") {
      await mkdir(desktopPath, { recursive: true });

      if (file.type.startsWith("video")) {
        fileName = `dBannerV.${ext}`;
      } else {
        fileName = `dBanner${index}.${ext}`;
      }

      savePath = path.join(desktopPath, fileName);
      publicPath = `/DesktopBanners/${fileName}`;
    }

    /* ================= MOBILE ================= */
    if (type === "mobile-banner") {
      await mkdir(mobilePath, { recursive: true });

      if (file.type.startsWith("video")) {
        fileName = `mBannerV.${ext}`;
      } else {
        fileName = `mBanner${index}.${ext}`;
      }

      savePath = path.join(mobilePath, fileName);
      publicPath = `/MobileBanners/${fileName}`;
    }

    /* ================= SAVE FILE ================= */
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(savePath, buffer);

    return NextResponse.json({
      success: true,
      path: publicPath,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}