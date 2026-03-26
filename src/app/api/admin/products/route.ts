import { NextRequest, NextResponse } from "next/server";
import { mkdir, rm, rename } from "fs/promises";
import path from "path";
import { supabase } from "@/lib/supabaseClient";
import { verifyAdmin } from "@/lib/adminGuard";
import { exec } from "child_process";

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

    /* ========= BASIC ========= */

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

    /* ========= INVENTORY ========= */

    const inventory = available_sizes.map((size: string) => ({
      size,
      quantity: null,
    }));

    /* ========= IMAGES (TEMP URLS) ========= */

    const imagePaths = JSON.parse(
      (formData.get("images") as string) || "[]"
    );

    const sizeChartPath =
      (formData.get("size_chart") as string) || "";

    /* ========= SLUG + FOLDER ========= */

    const slug = generateSlug(title);

    const primaryCategory = category?.[0] || "misc";
    const primaryCollection = collections?.[0] || "";

    const baseFolder = getCategoryBasePath(
      primaryCategory,
      primaryCollection
    );

    const productFolder = path.join(uploadBase, baseFolder, slug);
    await mkdir(productFolder, { recursive: true });

    const finalImagePaths: string[] = [];

    /* ========= MOVE IMAGES ========= */

    for (let i = 0; i < imagePaths.length; i++) {
      const tempPath = imagePaths[i]; // /products/temp/xxx.jpg

      const fileName = tempPath.split("/").pop();

      const oldPath = path.join(
        process.cwd(),
        "public",
        tempPath
      );

      const newPath = path.join(productFolder, fileName!);

      await rename(oldPath, newPath);

      const optimizedName = fileName!.replace(
        /\.(png|jpg|jpeg)$/i,
        ".webp"
      );

      finalImagePaths.push(
        `/products/${baseFolder}/${slug}/${optimizedName}`
      );
    }

    /* ========= SIZE CHART ========= */

    let finalSizeChartPath = "";

    if (sizeChartPath) {
      const fileName = sizeChartPath.split("/").pop();

      const oldPath = path.join(
        process.cwd(),
        "public",
        sizeChartPath
      );

      const newPath = path.join(productFolder, fileName!);

      await rename(oldPath, newPath);

      const optimizedName = fileName!.replace(
        /\.(png|jpg|jpeg)$/i,
        ".webp"
      );

      finalSizeChartPath = `/products/${baseFolder}/${slug}/${optimizedName}`;
    }

    /* ========= RUN OPTIMIZER ========= */

    const scriptPath = path.join(
      process.cwd(),
      "scripts",
      "replace-with-optimized.js"
    );

    await new Promise((resolve, reject) => {
      exec(`node "${scriptPath}" "${productFolder}"`, (err, stdout) => {
        if (err) {
          console.error("Optimizer failed:", err);
          reject(err);
        } else {
          console.log(stdout);
          resolve(true);
        }
      });
    });

    /* ========= INSERT ========= */

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
        images: finalImagePaths,
        size_chart_image: finalSizeChartPath,
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

    if (!id || !slug) {
      return NextResponse.json(
        { error: "Missing id or slug" },
        { status: 400 }
      );
    }

    const primaryCategory = category?.[0] || "misc";
    const primaryCollection = collections?.[0] || "";

    const baseFolder = getCategoryBasePath(
      primaryCategory,
      primaryCollection
    );

    const folderPath = path.join(uploadBase, baseFolder, slug);

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    try {
      await rm(folderPath, { recursive: true, force: true });
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