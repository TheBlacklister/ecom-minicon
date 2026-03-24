"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function EditTopPicks() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [count, setCount] = useState(3);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("products").select("id, title").then(({ data }) => {
      setProducts(data || []);
    });
  }, []);

  const handleChange = (i: number, value: string) => {
    const updated = [...selected];
    updated[i] = value;
    setSelected(updated);
  };

  return (
    <div>
      <h1>Edit Top Picks</h1>

      {/* SELECT COUNT */}
      <label>No. of products</label>
      <input
        type="number"
        min={1}
        max={products.length}
        value={count}
        onChange={(e) => {
          const val = Number(e.target.value);
          setCount(val);
          setSelected(new Array(val).fill(""));
        }}
      />

      {/* DROPDOWNS */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <label>Product {i + 1}</label>

          <select
            value={selected[i] || ""}
            onChange={(e) => handleChange(i, e.target.value)}
          >
            <option value="">Select Product</option>

            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      ))}

      <br />

      <button
        onClick={() => {
            const final = selected
            .filter(Boolean)
            .map((id) => ({ id: Number(id) }));
          sessionStorage.setItem("topPicksDraft", JSON.stringify(final));

          router.push("/admin/top-picks/preview");
        }}
      >
        Preview
      </button>
    </div>
  );
}