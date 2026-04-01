import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://minicon.in";

  // =========================
  // SUPABASE
  // =========================
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: products, error } = await supabase
    .from("products")
    .select("id, category, collections, updated_at")
    .eq("is_active", true);

  if (error || !products) {
    console.error("Sitemap Error:", error);
    return [];
  }

  // =========================
  // PRODUCT ROUTES
  // =========================
  const productRoutes = products.map((product: any) => ({
    url: `${baseUrl}/preCheckout?id=${product.id}`,
    lastModified: product.updated_at
      ? new Date(product.updated_at)
      : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // =========================
  // CATEGORY SLUGS (ARRAY SAFE)
  // =========================
  const uniqueCategories = [
    ...new Set(
      products.flatMap((p: any) =>
        Array.isArray(p.category)
          ? p.category.map((cat: string) =>
              cat.toLowerCase().trim().replace(/\s+/g, "-")
            )
          : []
      )
    ),
  ];

  const shopByRoutes = uniqueCategories.map((slug) => ({
    url: `${baseUrl}/categories/shop-by/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryRoutes = uniqueCategories.map((slug) => ({
    url: `${baseUrl}/categories/category/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // =========================
  // COLLECTION SLUGS (ARRAY SAFE)
  // =========================
  const uniqueCollections = [
    ...new Set(
      products.flatMap((p: any) =>
        Array.isArray(p.collections)
          ? p.collections.map((col: string) =>
              col.toLowerCase().trim().replace(/\s+/g, "-")
            )
          : []
      )
    ),
  ];

  const collectionRoutes = uniqueCollections.map((slug) => ({
    url: `${baseUrl}/categories/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // =========================
  // FINAL
  // =========================
  return [
    ...productRoutes,
    ...shopByRoutes,
    ...categoryRoutes,
    ...collectionRoutes,
  ];
}