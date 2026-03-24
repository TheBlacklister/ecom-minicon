"use client";

import { createContext, useContext, useState } from "react";

type ProductType = {
    name: string;
    subtitle: string;
    description: string;
    images: File[];
    category: string;
    collection: string;
    price_before: string;
    price_after: string;
    material: string;
    wash_care: string;
    sku: Record<string, string>;
    available_sizes: string[];
    available_colors: string[];
    inventory?: Record<string, any> | null;
    size_chart: File | null;
  };

type ContextType = {
  productData: ProductType | null;
  setProductData: (data: ProductType | null) => void;
};

const ProductContext = createContext<ContextType | null>(null);

export function ProductProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [productData, setProductData] =
    useState<ProductType | null>(null);

  return (
    <ProductContext.Provider
      value={{ productData, setProductData }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProduct must be used inside ProductProvider");
  }
  return context;
}