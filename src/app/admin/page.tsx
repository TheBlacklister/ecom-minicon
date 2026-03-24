"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/AuthProvider";
import { isAdmin } from "@/lib/isAdmin";

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth(); // ✅ ADD THIS
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [banner, setBanner] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) return;
  
    if (!isAdmin(user.email)) {
      router.push("/");
      return;
    }
  
    fetchRecentProducts();
    fetchRecentInventory();
    fetchBanner();

    setChecking(false);
  }, [user, router]); // ✅ FIXED

  const fetchRecentProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) setRecentProducts(data);
  };

  const fetchRecentInventory = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (data) setRecentInventory(data);
  };

  const fetchBanner = async () => {
    const { data, error } = await supabase
      .from("hero_banner")
      .select("*")
      .eq("id", "main")
      .single();

    if (error) {
      console.error("Banner fetch error:", error);
      return;
    }

    setBanner(data);
  };

  const desktopBanner = banner?.desktop_url;
  const mobileBanner = banner?.mobile_urls;

  if (!user || checking) {
    return <div>Checking access...</div>;
  }

  return (
    <div>
      <h1 style={titleStyle}>Admin Dashboard</h1>

      <div style={cardStyle}>
        <h2 style={sectionTitle}>Recent Activity</h2>

        {/* ================= Recently Added Products ================= */}
        <h3 style={subTitle}>Recently Added Products</h3>
        <div style={tableWrapper}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadRow}>
                <th>Image</th>
                <th>Product</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((product) => (
                <tr key={product.id} style={tbodyRow}>
                  <td>
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={60}
                        height={60}
                        unoptimized
                        style={{ borderRadius: 8, objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{product.title}</td>
                  <td style={{ color: "#6b7280" }}>
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= Recently Updated Inventory ================= */}
        <h3 style={{ ...subTitle, marginTop: 35 }}>
          Recently Updated Inventory
        </h3>
        <div style={tableWrapper}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadRow}>
                <th>Image</th>
                <th>Product</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentInventory.map((product) => (
                <tr key={product.id} style={tbodyRow}>
                  <td>
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.title}
                        width={60}
                        height={60}
                        unoptimized
                        style={{ borderRadius: 8, objectFit: "cover" }}
                      />
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{product.title}</td>
                  <td style={{ color: "#6b7280" }}>
                    {new Date(product.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= Current Logo ================= */}
        <h3 style={{ ...subTitle, marginTop: 40 }}>
          Current Brand Logo
        </h3>

        <div style={mediaCard}>
          <Image
            src="/images/logo.png"
            alt="Brand Logo"
            width={220}
            height={100}
            priority
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* ================= Current Banners ================= */}
        <h3 style={{ ...subTitle, marginTop: 40 }}>
          Current Website Banners
        </h3>

        <div style={mediaWrapper}>
          {/* Desktop Banner */}
          <div style={mediaCard}>
            <p style={mediaTitle}>Desktop Banner</p>

            {desktopBanner?.type === "video" && (
              <video
                src={desktopBanner.value}
                autoPlay
                muted
                loop
                controls
                style={mediaStyle}
              />
            )}

            {desktopBanner?.type === "images" &&
              desktopBanner.value?.length > 0 &&
              desktopBanner.value.map((img: any, i: number) => (
                <Image
                  key={i}
                  src={img.url}
                  alt={`desktop-${i}`}
                  width={120}
                  height={120}
                  style={{
                    borderRadius: "10px",
                    objectFit: "cover",
                    marginRight: "10px",
                  }}
                />
              ))}
          </div>

          {/* Mobile Banner */}
          <div style={mediaCard}>
            <p style={mediaTitle}>Mobile Banner</p>

            {mobileBanner?.type === "video" && (
              <video
                src={mobileBanner.value}
                autoPlay
                muted
                loop
                controls
                style={{ ...mediaStyle, width: "220px" }}
              />
            )}

            {mobileBanner?.type === "images" &&
              mobileBanner.value?.length > 0 &&
              mobileBanner.value.map((img: any, i: number) => (
                <Image
                  key={i}
                  src={img.url}
                  alt={`mobile-${i}`}
                  width={100}
                  height={150}
                  style={{
                    borderRadius: "10px",
                    objectFit: "cover",
                    marginRight: "10px",
                  }}
                />
              ))}
          </div>
        </div>
      </div>

      {/* ================= Quick Actions ================= */}
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Quick Actions</h2>

        <div style={actionGrid}>
          <button
            style={actionButton}
            onClick={() => router.push("/admin/add-product")}
          >
            ➕ Add New Product
          </button>

          <button
            style={actionButton}
            onClick={() => router.push("/admin/manage-inventory")}
          >
            📦 Manage Inventory
          </button>

          <button
            style={actionButton}
            onClick={() => router.push("/admin/hero-banner")}
          >
            🖼 Update Banner
          </button>

          <button
            style={actionButton}
            onClick={() => router.push("/admin/delete-product")}
          >
            🗑 Delete Products
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const titleStyle = {
  marginBottom: "25px",
};

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "25px",
  marginBottom: "25px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
};

const sectionTitle = {
  marginBottom: "20px",
};

const subTitle = {
  marginBottom: "10px",
  fontWeight: 600,
};

const tableWrapper = {
  background: "#f9fafb",
  borderRadius: "10px",
  padding: "15px",
  marginTop: "10px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const theadRow = {
  textAlign: "left" as const,
  borderBottom: "1px solid #e5e7eb",
};

const tbodyRow = {
  borderBottom: "1px solid #f1f5f9",
};

const mediaWrapper = {
  display: "flex",
  gap: "30px",
  flexWrap: "wrap" as const,
  marginTop: "15px",
};

const mediaCard = {
  background: "#f9fafb",
  padding: "15px",
  borderRadius: "12px",
};

const mediaTitle = {
  fontWeight: 600,
  marginBottom: "10px",
};

const mediaStyle = {
  width: "350px",
  borderRadius: "10px",
};

const actionGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "15px",
};

const actionButton = {
  padding: "14px",
  borderRadius: "8px",
  border: "none",
  background: "#111827",
  color: "white",
  fontWeight: 500,
  cursor: "pointer",
};