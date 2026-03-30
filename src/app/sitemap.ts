import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://minicon.in";

  // Static pages
  const staticRoutes = [
    "",
    "/categories/shop-by/new-arrivals",
    "/categories/shop-by/bestsellers",
    "/categories/shop-by/oversized",
    "/categories/shop-by/supima",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // 👉 OPTIONAL: Dynamic products (IMPORTANT for SEO)
  // Replace this with your actual DB/API call
  const products = [
    "black-oversized-tshirt",
    "white-puff-print-tee",
  ];

  const productRoutes = products.map((slug) => ({
    url: `${baseUrl}/products/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}