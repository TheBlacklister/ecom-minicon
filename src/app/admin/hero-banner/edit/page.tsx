"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function EditHeroBanner() {
  const router = useRouter();

  const [desktopType, setDesktopType] = useState("video");
  const [mobileType, setMobileType] = useState("images");

  const [products, setProducts] = useState<any[]>([]);
  const [mobileLinks, setMobileLinks] = useState<string[]>([]);
  const [desktopProducts, setDesktopProducts] = useState<string[]>([]);
 
  

  /* LOAD PRODUCTS */
  useEffect(() => {
    supabase.from("products").select("id, title, slug").then(({ data }) => {
      setProducts(data || []);
    });
  }, []);

  const handleDesktopProductChange = (index: number, value: string) => {
    const updated = [...desktopProducts];
    updated[index] = value;
    setDesktopProducts(updated);
  };

  /* FILE UPLOAD */
  const uploadFile = async (file: File, type: string, index?: number) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    if (index) fd.append("index", String(index));

    const { data: session } = await supabase.auth.getSession();

    const res = await fetch("/api/admin/assets", {
      method: "POST",
      body: fd,
      headers: {
        Authorization: `Bearer ${session.session?.access_token}`,
      },
    });

    return (await res.json()).path;
  };

  return (
    <div>
      <h1 style={titleStyle}>Edit Banner</h1>

      {/* DESKTOP */}
      <h3>Desktop</h3>

<select
  value={desktopType}
  onChange={(e) => {
    setDesktopType(e.target.value);

    // reset when switching
    sessionStorage.removeItem("desktopDraft");
    setDesktopProducts([]);
  }}
>
  <option value="video">Video</option>
  <option value="images">Images</option>
</select>

{/* ✅ VIDEO */}
{desktopType === "video" && (
  <input
    key="desktop-video"
    type="file"
    accept="video/*"
    onChange={async (e) => {
      const path = await uploadFile(e.target.files![0], "desktop-banner");
      sessionStorage.setItem("desktopDraft", path);
    }}
  />
)}

{/* ✅ IMAGES */}
{desktopType === "images" && (
  <>
    <input
      key="desktop-images"
      type="file"
      accept="image/*"
      multiple
      onChange={async (e) => {
        const files = Array.from(e.target.files!);
        const urls: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const path = await uploadFile(files[i], "desktop-banner", i + 1);
          urls.push(path);
        }

        sessionStorage.setItem("desktopDraft", JSON.stringify(urls));

        // ✅ setup product mapping
        
        setDesktopProducts(new Array(files.length).fill(""));
      }}
    />

    {/* ✅ PRODUCT DROPDOWN */}
    {desktopProducts.map((link, i) => (
      <div key={i} style={{ marginTop: 10 }}>
        <label>Product for image {i + 1}</label>

        <select
          value={link}
          onChange={(e) =>
            handleDesktopProductChange(i, e.target.value)
          }
        >
          <option value="">Select Product</option>

          {products.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </div>
    ))}
  </>
)}

      {/* MOBILE */}
<h3>Mobile</h3>

<select
  value={mobileType}
  onChange={(e) => {
    setMobileType(e.target.value);

    /* RESET WHEN SWITCHING */
    sessionStorage.removeItem("mobileDraft");
    setMobileLinks([]);
  }}
>
  <option value="video">Video</option>
  <option value="images">Images</option>
</select>

{/* ✅ VIDEO MODE */}
{mobileType === "video" && (
  <input
    key="mobile-video"   // IMPORTANT (forces reset)
    type="file"
    accept="video/*"
    onChange={async (e) => {
      const path = await uploadFile(e.target.files![0], "mobile-banner");
      sessionStorage.setItem("mobileDraft", path);
    }}
  />
)}

{/* ✅ IMAGE MODE */}
{mobileType === "images" && (
  <>
    <input
      key="mobile-images"   // IMPORTANT (forces reset)
      type="file"
      accept="image/*"
      multiple
      onChange={async (e) => {
        const files = Array.from(e.target.files!);
        const urls: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const path = await uploadFile(files[i], "mobile-banner", i + 1);
          urls.push(path);
        }

        sessionStorage.setItem("mobileDraft", JSON.stringify(urls));
        setMobileLinks(new Array(files.length).fill(""));
      }}
    />

    {/* ✅ PRODUCT DROPDOWN ONLY FOR IMAGES */}
    {mobileLinks.map((link, i) => (
      <div key={i}>
        <label>Product for image {i + 1}</label>

        <select
          value={link}
          onChange={(e) => {
            const updated = [...mobileLinks];
            updated[i] = e.target.value;
            setMobileLinks(updated);
          }}
        >
          <option value="">Select Product</option>

          {products.map((p: any) => (
          <option key={p.id} value={p.id}>
          {p.title}
          </option>
        ))}
        </select>
      </div>
    ))}
  </>
)}

      <br />

      <button
        style={primaryButton}
        onClick={() => {
          /* ================= MOBILE ================= */
          const rawMobile = sessionStorage.getItem("mobileDraft");
        
          let finalMobile = null;
        
          if (mobileType === "video" && rawMobile) {
            finalMobile = {
              type: "video",
              value: rawMobile,
            };
          }
        
          if (mobileType === "images" && rawMobile) {
            const urls = JSON.parse(rawMobile);
        
            finalMobile = {
              type: "images",
              value: urls.map((url: string, i: number) => ({
                url,
                product: mobileLinks[i] || null,
              })),
            };
          }
        
          sessionStorage.setItem("mobileDraft", JSON.stringify(finalMobile));
        
          /* ================= DESKTOP ================= */
          const rawDesktop = sessionStorage.getItem("desktopDraft");
        
          let finalDesktop = null;
        
          if (desktopType === "video" && rawDesktop) {
            finalDesktop = {
              type: "video",
              value: rawDesktop,
            };
          }
        
          if (desktopType === "images" && rawDesktop) {
            const urls = JSON.parse(rawDesktop);
        
            finalDesktop = {
              type: "images",
              value: urls.map((url: string, i: number) => ({
                url,
                product: desktopProducts[i] || null,
              })),
            };
          }
        
          sessionStorage.setItem("desktopDraft", JSON.stringify(finalDesktop));
        
          router.push("/admin/hero-banner/preview");
        }}
      >
        Preview
      </button>
    </div>
  );
}

/* STYLES */
const titleStyle = { fontSize: "28px", fontWeight: 600 };
const primaryButton = {
  padding: "12px 20px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};