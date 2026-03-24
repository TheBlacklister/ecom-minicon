"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useProduct } from "../ProductContext";
import { supabase } from "@/lib/supabaseClient";

export default function PreviewPage() {
  const router = useRouter();
  const { productData } = useProduct();

  if (!productData) {
    router.push("/admin/add-product/new");
    return null;
  }

  const saveProduct = async () => {
    const formData = new FormData();
  
    /* BASIC */
    formData.append("title", productData.name || "");
    formData.append("subtitle", productData.subtitle || "");
    formData.append("description", productData.description || "");
  
    formData.append("price_before", productData.price_before || "");
    formData.append("price_after", productData.price_after || "");
  
    formData.append("material", productData.material || "");
    formData.append("wash_care", productData.wash_care || "");
  
    /* CATEGORY */
    formData.append("category", JSON.stringify([productData.category]));
    formData.append("collections", JSON.stringify([productData.collection]));
  
    /* SKU + INVENTORY */
    formData.append("sku", JSON.stringify(productData.sku || {}));
    formData.append("inventory", JSON.stringify(productData.inventory || {}));
  
    /* COLORS + SIZES */
    formData.append(
      "available_colors",
      JSON.stringify(productData.available_colors || [])
    );
  
    formData.append(
      "available_sizes",
      JSON.stringify(productData.available_sizes || [])
    );
  
    /* ✅ PRODUCT IMAGES */
    productData.images.forEach((file: File) => {
      formData.append("images", file);
    });
  
    /* ✅ SIZE CHART (IMPORTANT) */
    if (productData.size_chart) {
      formData.append("size_chart", productData.size_chart);
    }

    const { data: session } = await supabase.auth.getSession();
  
    const res = await fetch("/api/admin/products", {
      method: "POST",
      body: formData, // keep your existing body
      headers: {
        Authorization: `Bearer ${session.session?.access_token}`,
      },
    });
  
    const data = await res.json();
  
    if (res.ok) {
      alert("Product saved successfully");
      router.push("/admin/add-product");
    } else {
      alert(data.error || "Error saving product");
    }
  };

  return (
    <div>
      <h1>Product Preview</h1>

      <div style={{ background: "white", padding: "30px" }}>
        <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
          {productData.images.map((file: File, index: number) => (
            <Image
              key={index}
              src={URL.createObjectURL(file)}
              alt="preview"
              width={150}
              height={150}
            />
          ))}
        </div>

        <h2>{productData.name}</h2>
        <p>{productData.description}</p>
        <p>
          <del>₹{productData.price_before}</del>{" "}
          <strong>₹{productData.price_after}</strong>
        </p>

        <button
          onClick={saveProduct}
          style={{
            marginTop: "20px",
            padding: "12px",
            background: "#111827",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Save Product
        </button>
      </div>
    </div>
  );
}