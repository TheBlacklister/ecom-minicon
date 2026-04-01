import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://minicon.in";

  // =========================
  // CONNECT SUPABASE DIRECTLY
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
    console.error("Sitemap Supabase Error:", error);
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
  // UNIQUE CATEGORY SLUGS
  // =========================
  const uniqueCategories = [
    ...new Set(
      products
        .filter((p: any) => p.category)
        .map((p: any) =>
          p.category.toLowerCase().trim().replace(/\s+/g, "-")
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
  // UNIQUE COLLECTION SLUGS
  // =========================
  const uniqueCollections = [
    ...new Set(
      products
        .filter((p: any) => p.collections)
        .map((p: any) =>
          p.collections.toLowerCase().trim().replace(/\s+/g, "-")
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