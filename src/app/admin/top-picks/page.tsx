"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function TopPicksPage() {
  const [data, setData] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("top_picks")
        .select("*")
        .eq("id", "main")
        .single();
  
      if (!data?.products) return;
  
      const ids = data.products.map((p: any) => p.id);
  
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .in("id", ids);
  
      const ordered = ids.map((id: number) =>
        products?.find((p) => p.id === id)
      );
  
      setData(ordered);
    }
  
    load();
  }, []);

  return (
    <div>
      <h1>Top Picks of the Week</h1>

      <ul>
        {data?.products?.map((item: any, i: number) => (
          <li key={i}>Product ID: {item.id}</li>
        ))}
      </ul>

      <button onClick={() => router.push("/admin/top-picks/edit")}>
        Edit Top Picks
      </button>
    </div>
  );
}