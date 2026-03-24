"use client";

import { ProductProvider } from "./ProductContext";

export default function AddProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProductProvider>{children}</ProductProvider>;
}