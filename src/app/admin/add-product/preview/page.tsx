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
    try {
      // 🔐 Get session FIRST
      const { data: session } = await supabase.auth.getSession();

      if (!session.session?.access_token) {
        alert("Unauthorized");
        return;
      }

      /* =========================
         STEP 1: UPLOAD IMAGES
      ========================= */
      const uploadForm = new FormData();

      productData.images.forEach((file) => {
        uploadForm.append("files", file);
      });

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: uploadForm,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        alert(uploadData.error || "Image upload failed");
        return;
      }

      const uploadedImageUrls = uploadData.urls;

      /* =========================
         STEP 2: UPLOAD SIZE CHART
      ========================= */
      let sizeChartUrl = "";

      if (productData.size_chart) {
        const chartForm = new FormData();
        chartForm.append("files", productData.size_chart);

        const chartRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: chartForm,
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        });

        const chartData = await chartRes.json();

        if (!chartRes.ok) {
          alert(chartData.error || "Size chart upload failed");
          return;
        }

        sizeChartUrl = chartData.urls[0];
      }

      /* =========================
         STEP 3: CREATE PRODUCT
      ========================= */
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
      formData.append(
        "category",
        JSON.stringify([productData.category])
      );
      formData.append(
        "collections",
        JSON.stringify([productData.collection])
      );

      /* SKU + INVENTORY */
      formData.append("sku", JSON.stringify(productData.sku || {}));
      formData.append(
        "inventory",
        JSON.stringify(productData.inventory || {})
      );

      /* COLORS + SIZES */
      formData.append(
        "available_colors",
        JSON.stringify(productData.available_colors || [])
      );

      formData.append(
        "available_sizes",
        JSON.stringify(productData.available_sizes || [])
      );

      /* ✅ IMPORTANT: SEND URLS (NOT FILES) */
      formData.append("images", JSON.stringify(uploadedImageUrls));
      formData.append("size_chart", sizeChartUrl);

      /* FINAL API CALL */
      const res = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
        },
      });

      const data = await res.json();

      if (res.ok) {
        alert("Product saved successfully");
        router.push("/admin/add-product");
      } else {
        alert(data.error || "Error saving product");
      }

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
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