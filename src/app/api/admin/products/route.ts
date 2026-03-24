import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, rm } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabaseClient";
import { exec } from "child_process";
import { verifyAdmin } from "@/lib/adminGuard";

const uploadBase = path.join(process.cwd(), "public/products");

/* ======================================
   HELPERS
====================================== */

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

/**
 * Map category + collection to folder structure
 * You can expand this anytime safely
 */
function getCategoryBasePath(category: string, collection: string) {
  if (category === "regular_fit") {
    if (collection === "solid")
      return "regular-fit-solid-crew/regular-fit-solid-crew";
    if (collection === "supima")
      return "regular-fit-solid-supima/regular-fit-solid-supima";
    if (collection === "printed")
      return "regular-fit-tshirt";
  }

  if (category === "oversized_fit") {
    if (collection === "solid")
      return "oversized-solid/oversized-solid";
    if (collection === "printed")
      return "oversized-tshirt-2/oversized-tshirt";
  }

  if (category === "mens_polo")
    return "mens-polo-t-shirt/mens-polo-t-shirt";

  if (category === "mens_gym")
    return "mens-gym-vest/mens-gym-vest";

  if (category === "mens_sweatshirts")
    return "sweatshirt";

  return "misc";
}

/* ======================================
   ADD PRODUCT
====================================== */

export async function POST(req: NextRequest) {

  const auth = await verifyAdmin(req);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const formData = await req.formData();

    /* ========= BASIC FIELDS ========= */

    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string;
    const description = formData.get("description") as string;
    const price_before = Number(formData.get("price_before"));
    const price_after = Number(formData.get("price_after"));
    const material = formData.get("material") as string;
    const wash_care = formData.get("wash_care") as string;

    if (!title || !price_after) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    /* ========= ARRAYS ========= */

    const category = JSON.parse(
      (formData.get("category") as string) || "[]"
    );

    const collections = JSON.parse(
      (formData.get("collections") as string) || "[]"
    );

    const available_sizes = JSON.parse(
      (formData.get("available_sizes") as string) || "[]"
    );

    const available_colors = JSON.parse(
      (formData.get("available_colors") as string) || "[]"
    );

    /* ========= SKU ========= */

    const sku = formData.get("sku")
      ? JSON.parse(formData.get("sku") as string)
      : {};

    /* ========= AUTO INVENTORY ========= */
    // Initially all sizes available, quantity null
    const inventory = available_sizes.map((size: string) => ({
      size,
      quantity: null,
    }));

    /* ========= IMAGES ========= */

    const images = formData.getAll("images") as File[];
    const sizeChart = formData.get("size_chart") as File | null;

    const slug = generateSlug(title);

    const primaryCategory = category?.[0] || "misc";
    const primaryCollection = collections?.[0] || "";

    const baseFolder = getCategoryBasePath(
      primaryCategory,
      primaryCollection
    );

    const productFolder = path.join(uploadBase, baseFolder, slug);
    await mkdir(productFolder, { recursive: true });

    const imagePaths: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      if (!file || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${i + 1}-${file.name}`;

      await writeFile(path.join(productFolder, fileName), buffer);

      const optimizedName = fileName.replace(/\.(png|jpg|jpeg)$/i, ".webp");

      imagePaths.push(
          `/products/${baseFolder}/${slug}/${optimizedName}`
        );
    }

    let sizeChartPath = "";

    if (sizeChart && sizeChart.size > 0) {
      const buffer = Buffer.from(await sizeChart.arrayBuffer());
      const fileName = `size-chart-${sizeChart.name}`;

      await writeFile(path.join(productFolder, fileName), buffer);

      const optimizedChart = fileName.replace(/\.(png|jpg|jpeg)$/i, ".webp");

      sizeChartPath = `/products/${baseFolder}/${slug}/${optimizedChart}`;
    }

    /* =========================
   RUN IMAGE OPTIMIZER
========================= */


const scriptPath = path.join(process.cwd(), "scripts", "replace-with-optimized.js");

await new Promise((resolve, reject) => {
  exec(`node "${scriptPath}"`, (err, stdout) => {
    if (err) {
      console.error("Image optimization failed:", err);
      reject(err);
    } else {
      console.log("Optimizer output:", stdout);
      resolve(true);
    }
  });
});
    /* ========= INSERT INTO DB ========= */

    const { error } = await supabase.from("products").insert([
      {
        title,
        subtitle,
        description,
        price_before,
        price_after,
        discount_percentage: null,
        material,
        wash_care,
        category,
        collections,
        images: imagePaths,
        size_chart_image: sizeChartPath,
        available_sizes,
        available_colors,
        inventory,
        sku,
        stock_quantity: null,
        slug,
        is_active: true,
      },
    ]);

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("ADD PRODUCT ERROR:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

/* ======================================
   DELETE PRODUCT
====================================== */

export async function DELETE(req: NextRequest) {

  const auth = await verifyAdmin(req);

  if ("error" in auth) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.status }
    );
  }

  try {
    const body = await req.json();

    const { id, slug, category, collections } = body;

    /* ========= VALIDATION ========= */

    if (!id || !slug) {
      return NextResponse.json(
        { error: "Missing id or slug" },
        { status: 400 }
      );
    }

    /* ========= RESOLVE PATH ========= */

    const primaryCategory = category?.[0] || "misc";
    const primaryCollection = collections?.[0] || "";

    const baseFolder = getCategoryBasePath(
      primaryCategory,
      primaryCollection
    );

    const folderPath = path.join(uploadBase, baseFolder, slug);

    console.log("Deleting product folder:", folderPath);

    /* ========= DELETE DB FIRST ========= */

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DB DELETE ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    /* ========= DELETE FILES ========= */

    try {
      await rm(folderPath, { recursive: true, force: true });
      console.log("Folder deleted successfully");
    } catch (err) {
      console.error("FOLDER DELETE ERROR:", err);
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}