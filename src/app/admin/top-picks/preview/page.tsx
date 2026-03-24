/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function PreviewTopPicks() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const raw = sessionStorage.getItem("topPicksDraft");

    async function load() {
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const ids = parsed.map((p: any) => Number(p.id));

      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);

      const ordered = ids.map((id: number) =>
        products?.find((p) => p.id === id)
      );

      setData(ordered.filter(Boolean));
    }

    load();
  }, []);

  const handleSave = async () => {
    try {
      const payload = data.map((p) => ({ id: Number(p.id) }));

      const { error } = await supabase
        .from("top_picks")
        .upsert(
          {
            id: "main",
            products: payload,
          },
          { onConflict: "id" }
        );

      if (error) throw error;

      sessionStorage.removeItem("topPicksDraft");

      alert("Saved successfully ✅");

      router.push("/");
    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert("Failed to save ❌");
    }
  };

  return (
    <div>
      <h1>Preview Top Picks</h1>

      <ul>
        {data.map((item, i) => (
          <li key={i} style={{ marginBottom: "20px" }}>
            <p>{item.title}</p>
            <img
              src={item.images?.[0]}
              alt="top-img"
              width={120}
              style={{ borderRadius: "8px" }}
            />
          </li>
        ))}
      </ul>

      <button onClick={handleSave}>Confirm & Save</button>
    </div>
  );
}