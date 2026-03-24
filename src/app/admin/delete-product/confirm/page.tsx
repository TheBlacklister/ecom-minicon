"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function ConfirmDeletePage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("deleteItems");

    if (!stored) {
      router.push("/admin/delete-product");
      return;
    }

    const ids = JSON.parse(stored);

    fetchProducts(ids);
  }, [router]);

  const fetchProducts = async (ids: number[]) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .in("id", ids);

    if (data) setProducts(data);
    setLoading(false);
  };

  const handleDelete = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      for (const product of products) {
        await fetch("/api/admin/products", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`, // 🔥 ADD THIS
          },
          body: JSON.stringify({
            id: product.id,
            slug: product.slug,
            category: product.category,
            collections: product.collections,
          }),
        });
      }
  
      localStorage.removeItem("deleteItems");
  
      router.push("/admin/delete-product");
  
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: "70vh" }}>
      <h1 style={{ marginBottom: "20px" }}>
        Are you sure you want to delete the selected products?
      </h1>

      {/* Selected Items List */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "30px",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr 150px 150px 120px 120px",
              alignItems: "center",
              gap: "20px",
              padding: "15px 0",
              borderBottom: "1px solid #eee",
            }}
            >
            {/* Image */}
            <Image
            src={product.images?.[0]}
            alt={product.title}
            width={70}
            height={70}
            style={{
            borderRadius: "8px",
            objectFit: "cover",
            }}
            />

            {/* Title */}
            <div style={{ fontWeight: 600 }}>
            {product.title}
            </div>

            {/* Category */}
            <div>
             {Array.isArray(product.category)
             ? product.category.join(", ")
             : product.category}
            </div>

          {/* Collection */}
          <div>
            {Array.isArray(product.collections)
              ? product.collections.join(", ")
              : product.collections}
          </div>

          {/* Original Price */}
          <div>
            ₹ {product.price_before}
          </div>

          {/* Discount Price */}
          <div style={{ fontWeight: 600 }}>
            ₹ {product.price_after}
            </div>
          </div>
        ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleDelete}
          style={{
            background: "#dc2626",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Yes, Delete
        </button>

        <button
          onClick={() => router.push("/admin/delete-product")}
          style={{
            padding: "10px 20px",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        >
          No
        </button>
      </div>
    </div>
  );
}