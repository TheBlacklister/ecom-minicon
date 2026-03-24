"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProduct } from "../ProductContext";

export default function AddProductForm() {
  const router = useRouter();
  const { setProductData } = useProduct();

  const SIZES = ["S", "M", "L", "XL", "XXL"];

  const [form, setForm] = useState({
    name: "",
    subtitle: "",
    description: "",
    images: [] as File[],
    category: "",
    collection: "",
    price_before: "",
    price_after: "",
    material: "",
    size_chart: null as File | null,
    colors: "",
    wash_care: "",
    sku: {
      S: "",
      M: "",
      L: "",
      XL: "",
      XXL: "",
    } as Record<string, string>,
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e: any) => {
    const files = Array.from(e.target.files);
    setForm({ ...form, images: files as File[] });
  };

  const handleSkuChange = (size: string, value: string) => {
    setForm({
      ...form,
      sku: {
        ...form.sku,
        [size]: value,
      },
    });
  };

  const allSkuFilled = SIZES.every(
    (size) => form.sku[size] && form.sku[size].trim() !== ""
  );

  const isValid =
    form.name &&
    form.description &&
    form.images.length > 0 &&
    form.category &&
    form.collection &&
    form.price_before &&
    form.price_after &&
    form.wash_care &&
    allSkuFilled;

  const handlePreview = () => {
    if (!isValid) return;

    setProductData({
      ...form,
      available_sizes: SIZES,
      available_colors: form.colors
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean),
    });

    router.push("/admin/add-product/preview");
  };

  return (
    <div>
      <h1 style={{ marginBottom: "25px" }}>Add New Product</h1>

      <div style={card}>
        <label>Name</label>
        <input name="name" value={form.name} onChange={handleChange} style={input} />

        <label>Subtitle Text</label>
        <input name="subtitle" value={form.subtitle} onChange={handleChange} style={input} />

        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} style={input} />

        <label>Price Before</label>
        <input name="price_before" type="number" value={form.price_before} onChange={handleChange} style={input} />

        <label>Price After</label>
        <input name="price_after" type="number" value={form.price_after} onChange={handleChange} style={input} />

        <label>Category</label>
        <select name="category" value={form.category} onChange={handleChange} style={input}>
          <option value="">Select Category</option>
          <option value="regular_fit">Regular Fit</option>
          <option value="oversized_fit">Oversized Fit</option>
          <option value="mens_polo">Men&apos;s Polo</option>
          <option value="mens_gym">Men&apos;s Gym</option>
          <option value="mens_sweatshirts">Men&apos;s Sweatshirts</option>
        </select>

        <label>Collection</label>
        <select name="collection" value={form.collection} onChange={handleChange} style={input}>
          <option value="">Select Collection</option>
          <option value="solid">Solid</option>
          <option value="printed">Printed</option>
          <option value="minimalist">Minimalist</option>
          <option value="street_wear">Street Wear</option>
          <option value="aesthetic">Aesthetic</option>
          <option value="puffed">Puffed</option>
          <option value="acid_washed">Acid Washed</option>
          <option value="supima">Supima</option>
        </select>

        <label>Material</label>
        <input name="material" value={form.material} onChange={handleChange} style={input} />

        <label>Available Colors (comma separated)</label>
        <input name="colors" placeholder="Black, White, Red" value={form.colors} onChange={handleChange} style={input} />
        <small style={{ color: "#666" }}> Example: Black, White, Olive </small>

        <label>Wash Care Instruction</label>
        <textarea name="wash_care" value={form.wash_care} onChange={handleChange} style={input} />

        <label>Upload Product Images</label>
        <input type="file" multiple accept="image/*" onChange={handleImageChange} />
        
        <label>Upload Size Chart Image</label>
        <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, size_chart: e.target.files?.[0] || null })} style={input} />

        <h3 style={{ marginTop: "20px" }}>SKU IDs (Required for Qikink)</h3>

        {SIZES.map((size) => (
          <div key={size} style={{ marginBottom: "8px" }}>
            <label>SKU for {size}</label>
            <input
              value={form.sku[size]}
              onChange={(e) => handleSkuChange(size, e.target.value)}
              style={input}
              placeholder={`Enter unique SKU for ${size}`}
            />
          </div>
        ))}

        <button
          disabled={!isValid}
          onClick={handlePreview}
          style={{
            ...button,
            opacity: isValid ? 1 : 0.5,
            cursor: isValid ? "pointer" : "not-allowed",
          }}
        >
          Check Preview
        </button>
      </div>
    </div>
  );
}

const card = {
  background: "white",
  padding: "30px",
  borderRadius: "10px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  maxWidth: "700px",
};

const input = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #ddd",
};

const button = {
  marginTop: "20px",
  padding: "12px",
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
};