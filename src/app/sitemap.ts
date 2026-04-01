import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://minicon.in";

  // =========================
  // FETCH PRODUCTS
  // =========================
  const res = await fetch(`${baseUrl}/api/products`, {
    cache: "no-store",
  });

  const data = await res.json();
  const products = data.products || [];

  // =========================
  // PRODUCT ROUTES (/preCheckout?id=)
  // =========================
  const productRoutes = products
    .filter((p: any) => p.id) // safety check
    .map((product: any) => ({
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

  // =========================
  // SHOP-BY ROUTES
  // =========================
  const shopByRoutes = uniqueCategories.map((slug) => ({
    url: `${baseUrl}/categories/shop-by/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // =========================
  // CATEGORY ROUTES
  // =========================
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

  // =========================
  // COLLECTION ROUTES
  // =========================
  const collectionRoutes = uniqueCollections.map((slug) => ({
    url: `${baseUrl}/categories/collections/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // =========================
  // FINAL SITEMAP
  // =========================
  return [
    ...productRoutes,
    ...shopByRoutes,
    ...categoryRoutes,
    ...collectionRoutes,
  ];
}