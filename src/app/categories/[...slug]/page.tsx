import CatalogueClient from '@/app/components/catalogueClient';
import { categorySEO } from '@/lib/categorySEO';
import { categoryBreadcrumbs } from '@/lib/categoryBreadcrumbs';
import type { Product } from '@/types';

async function getProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`, {
      cache: 'no-store',
    });

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    if (Array.isArray(data?.data)) return data.data;

    return [];
  } catch (error) {
    console.error('Server fetch error:', error);
    return [];
  }
}

/* ---------------- METADATA ---------------- */

export async function generateMetadata({ params }: any) {
  const { slug } = await params;
  const slugPath = slug.join("/");

  const seo = categorySEO[slugPath];

  if (!seo) return {};

  return {
    metadataBase: new URL("https://minicon.in"),

    title: seo.title,
    description: seo.description,

    alternates: {
      canonical: `https://minicon.in${seo.canonical}`, // ✅ USE HERE
    },

    openGraph: {
      title: seo.ogTitle || seo.title,
      description: seo.ogDescription || seo.description,
      images: [
        {
          url: seo.og,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

/* ---------------- PAGE ---------------- */

export default async function Page({ params }: any) {
  const { slug } = await params; // ✅ FIX
  const slugPath = slug.join("/");

  const seo = categorySEO[slugPath];

  const breadcrumbItems = categoryBreadcrumbs[slugPath] || [];

  const products = await getProducts();

  return (
    <>
      {/* ✅ SCHEMA */}
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seo?.h1,
      description: seo?.description,
      url: `https://minicon.in/categories/${slugPath}`,
      breadcrumb: {
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: item.href
            ? `https://minicon.in${item.href}`
            : `https://minicon.in/categories/${slugPath}`,
        })),
      },
    }),
  }}
/>

      <CatalogueClient
        initialProducts={products}
        seo={seo}
        slug={slugPath}
      />
    </>
  );
}