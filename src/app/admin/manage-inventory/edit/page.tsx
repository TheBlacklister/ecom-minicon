"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SIZES = ["S", "M", "L", "XL", "XXL"];

export default function EditInventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [updates, setUpdates] = useState<any>({});

  useEffect(() => {
    const fetchSelectedProducts = async () => {
      const selectedIds = JSON.parse(
        localStorage.getItem("inventorySelected") || "[]"
      );
  
      if (selectedIds.length === 0) {
        router.push("/admin/manage-inventory");
        return;
      }
  
      const { data } = await supabase
        .from("products")
        .select("*")
        .in("id", selectedIds);
  
      if (data) setProducts(data);
    };
  
    fetchSelectedProducts();
  }, [router]);

  const getExistingQuantity = (
    product: any,
    size: string
  ) => {
    const found = product.inventory?.find(
      (s: any) => s.size === size
    );
    return found ? found.quantity : "";
  };

  const handleChange = (
    productId: number,
    size: string,
    value: string
  ) => {
    setUpdates((prev: any) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [size]: Number(value),
      },
    }));
  };

  const handlePreview = () => {
    localStorage.setItem(
      "inventoryUpdates",
      JSON.stringify(updates)
    );
    router.push("/admin/manage-inventory/preview");
  };

  return (
    <div>
      <div style={headerRow}>
        <h1>Edit Inventory</h1>

        <button
          onClick={handlePreview}
          style={primaryButton}
        >
          Preview Changes
        </button>
      </div>

      {products.map((product) => (
        <div key={product.id} style={cardStyle}>
          <div style={productHeader}>
            <Image
              src={product.images?.[0] || ""}
              alt={product.title}
              width={70}
              height={70}
              style={{ borderRadius: 10 }}
            />

            <h3>{product.title}</h3>
          </div>

          <div style={sizesGrid}>
            {SIZES.map((size) => (
              <div key={size} style={sizeBox}>
                <label>{size}</label>

                <input
                  type="number"
                  placeholder={
                    getExistingQuantity(product, size) !== ""
                      ? `Current: ${getExistingQuantity(
                          product,
                          size
                        )}`
                      : "Available"
                  }
                  onChange={(e) =>
                    handleChange(
                      product.id,
                      size,
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Styles ---------- */

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const primaryButton = {
  padding: "10px 18px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
  fontWeight: 500,
};

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "12px",
  marginBottom: "20px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const productHeader = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  marginBottom: "20px",
};

const sizesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: "15px",
};

const sizeBox = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
};

const inputStyle = {
  padding: "8px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};