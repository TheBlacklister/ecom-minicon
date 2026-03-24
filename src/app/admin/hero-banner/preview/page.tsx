/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Preview() {
  const router = useRouter();

  const [desktop, setDesktop] = useState<any>(null);
  const [mobile, setMobile] = useState<any>(null);

  /* ================= LOAD FROM SESSION ================= */
  useEffect(() => {
    const parseSafe = (value: string | null) => {
      if (!value) return null;
    
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    };
  
    const d = sessionStorage.getItem("desktopDraft");
    const m = sessionStorage.getItem("mobileDraft");
  
    setDesktop(parseSafe(d));
    setMobile(parseSafe(m));
  }, []);

  /* ================= RENDER FUNCTION ================= */
  const renderMedia = (data: any) => {
    if (!data) return null;

    const type = data?.type;
    const value = data?.value;

    /* 🎥 VIDEO */
    if (type === "video" && typeof value === "string") {
      return (
        <video
          src={value}
          autoPlay
          muted
          loop
          playsInline
          style={videoStyle}
        />
      );
    }

    /* 🖼️ IMAGES */
    if (type === "images" && Array.isArray(value)) {
      return (
        <div style={gridStyle}>
          {value.map((item: any, i: number) => {
            const url = item?.url;

            if (!url) return null;

            return (
              <div key={i} style={mobileCard}>
                <img
                  src={url}
                  alt={`preview-${i}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "10px",
                    background: "#f5f5f5",
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    if (!desktop || !mobile) {
      alert("Missing banner data");
      return;
    }

    await supabase.from("hero_banner").upsert({
      id: "main",
      desktop_url: desktop,
      mobile_urls: mobile,
    });

    sessionStorage.removeItem("desktopDraft");
    sessionStorage.removeItem("mobileDraft");

    router.push("/admin/hero-banner");
  };

  /* ================= UI ================= */
  return (
    <div>
      <h1 style={titleStyle}>Preview Banner</h1>

      <div style={mainGrid}>
        {/* DESKTOP */}
        <div style={card}>
          <h3>Desktop</h3>
          {renderMedia(desktop)}
        </div>

        {/* MOBILE */}
        <div style={card}>
          <h3>Mobile</h3>
          {renderMedia(mobile)}
        </div>
      </div>

      <br />

      <button style={primaryButton} onClick={handleSave}>
        Confirm & Save
      </button>
    </div>
  );
}

/* ================= STYLES ================= */

const titleStyle = { fontSize: "28px", fontWeight: 600 };

const mainGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "30px",
};

const card = {
  background: "#fff",
  padding: "20px",
  borderRadius: "12px",
  minHeight: "350px",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "16px",
};

const mobileCard = {
  width: "100%",
  aspectRatio: "3/4",
  overflow: "hidden",
  borderRadius: "10px",
  background: "#f5f5f5",
};

const videoStyle = {
  width: "100%",
  borderRadius: "10px",
};

const primaryButton = {
  padding: "12px 20px",
  background: "#000",
  color: "#fff",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};