"use client";

import { useRouter } from "next/navigation";

export default function UpdateLogoPage() {
  const router = useRouter();

  return (
    <div style={wrapper}>
      <h1 style={{ fontSize: "28px", marginBottom: 30 }}>
        Update Brand Logo
      </h1>

      {/* ✅ LOGO PREVIEW */}
      <video
        src="/gifs/miniconLatestLogo.mp4"
        autoPlay
        loop
        muted
        playsInline
        controls
        style={logoStyle}
      />

      {/* ✅ BUTTON BELOW */}
      <button
        onClick={() => router.push("/admin/update-logo/edit")}
        style={btn}
      >
        Change Logo
      </button>
    </div>
  );
}

/* ✅ CENTER EVERYTHING */
const wrapper = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
};

/* ✅ CLEAN LOGO STYLE */
const logoStyle = {
  width: "280px",
  borderRadius: "12px",
  background: "#000",
};

/* ✅ BUTTON STYLE */
const btn = {
  marginTop: 20,
  padding: "12px 22px",
  background: "#000",
  color: "#fff",
  borderRadius: 8,
  cursor: "pointer",
};