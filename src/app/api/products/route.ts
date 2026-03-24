import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      id,
      title,
      subtitle,
      description,
      price_before,
      price_after,
      discount_percentage,
      category,
      collections,
      material,
      images,
      size_chart_image,
      available_sizes,
      available_colors,
      wash_care,
      stock_quantity,
      is_active,
      slug,
      sku,
      inventory
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Products API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}