export const categoryLinks: Record<
  string,
  { label: string; href: string }[]
> = {
  "shop-by/new-arrivals": [
    { label: "Best Sellers", href: "/categories/shop-by/best-sellers" },
    { label: "All T-Shirts", href: "/categories/shop-by/all-t-shirts" },
    { label: "Oversized T-Shirts", href: "/categories/category/oversized-fit" },
    { label: "Regular Fit T-Shirts", href: "/categories/category/regular-fit" },
  ],

  "shop-by/best-sellers": [
    { label: "New Arrivals", href: "/categories/shop-by/new-arrivals" },
    { label: "All T-Shirts", href: "/categories/shop-by/all-t-shirts" },
    { label: "Oversized T-Shirts", href: "/categories/category/oversized-fit" },
  ],

  "shop-by/all-t-shirts": [
    { label: "Aesthetic T-Shirts", href: "/categories/category/regular-fit" },
    { label: "Oversized T-Shirts", href: "/categories/category/oversized-fit" },
    { label: "Puff Print T-Shirts", href: "/categories/category/puff-print" },
    { label: "Supima Cotton T-Shirts", href: "/categories/category/supima" },
  ],

  "category/regular-fit": [
    { label: "Oversized T-Shirts", href: "/categories/category/oversized-fit" },
    { label: "Best Sellers", href: "/categories/shop-by/best-sellers" },
    { label: "New Arrivals", href: "/categories/shop-by/new-arrivals" },
  ],

  "category/oversized-fit": [
    { label: "Regular Fit T-Shirts", href: "/categories/category/regular-fit" },
    { label: "Best Sellers", href: "/categories/shop-by/best-sellers" },
    { label: "Sale T-Shirts", href: "/categories/shop-by/sale" },
  ],
};