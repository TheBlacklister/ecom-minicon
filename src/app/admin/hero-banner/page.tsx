/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function HeroBannerPage() {
  const [data, setData] = useState<any>();
  const router = useRouter();

  useEffect(() => {
    supabase.from("hero_banner").select("*").eq("id", "main").single()
      .then(({ data }) => setData(data));
  }, []);

  const renderMedia = (data: any) => {
    if (!data) return null;
  
    const type = data?.type;
    const value = data?.value ?? data;
  
    // 🎥 VIDEO
    if (type === "video") {
      return (
        <video
          src={value}
          autoPlay
          muted
          loop
          style={videoStyle}
        />
      );
    }
  
    // 🖼️ IMAGES
    if ((type === "images" || Array.isArray(data)) && Array.isArray(value)) {
      return (
        <div style={gridStyle}>
          {value.map((item: any, i: number) => {
            const url = item?.url;
            const product = item?.product;
  
            if (!url) return null;
  
            return (
              <a
                key={i}
                href={product ? `/precheckout/${product}` : "#"}
              >
                <div style={mobileCard}>
                  <img src={url} alt="" style={imgStyle} />
                </div>
              </a>
            );
          })}
        </div>
      );
    }
  
    return null;
  };

  return (
    <div>
      <h1 style={titleStyle}>Update Website Banner</h1>
  
      <div style={mainGrid}>
        {/* DESKTOP */}
        <div style={card}>
          <h3>Desktop</h3>
          {renderMedia(data?.desktop_url)}
        </div>
  
        {/* MOBILE */}
        <div style={card}>
          <h3>Mobile</h3>
          {renderMedia(data?.mobile_urls)}
        </div>
      </div>
  
      <br />
  
      {/* ✅ BUTTON RESTORED */}
      <button
        style={primaryButton}
        onClick={() => router.push("/admin/hero-banner/edit")}
      >
        Change Banner
      </button>
    </div>
  );
}

/* SAME STYLES AS PREVIEW */
const titleStyle = { fontSize: "28px", fontWeight: 600 };
const mainGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" };
const card = { background: "#fff", padding: "20px", borderRadius: "12px" };
const gridStyle = { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" };
const mobileCard = { width: "100%", height: "180px", overflow: "hidden" };
const imgStyle = { width: "100%", height: "100%", objectFit: "contain" as const };
const videoStyle = { width: "100%", borderRadius: "10px" };
const primaryButton = {
  padding: "12px 20px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};