"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

type LogoDraft = {
  type: "image" | "gif" | "video";
  url: string;
};

export default function PreviewLogo() {
  const router = useRouter();
  const [draft, setDraft] = useState<LogoDraft | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("logoDraft");

    if (!stored) {
      router.push("/admin/update-logo/edit");
      return;
    }

    setDraft(JSON.parse(stored));
  }, [router]);

  if (!draft) return null;

  const handleSave = async () => {
    const blob = await fetch(draft.url).then((r) => r.blob());

    const formData = new FormData();
    formData.append("file", new File([blob], "miniconLatestLogo.mp4")); // ✅ fixed
    formData.append("type", "logo");

    const { data: session } = await supabase.auth.getSession();

    await fetch("/api/admin/assets", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${session.session?.access_token}`,
      },
    });

    localStorage.removeItem("logoDraft");
    sessionStorage.removeItem("logoFile");

    alert("Logo updated!");

    router.push("/admin/update-logo");
  };

  return (
    <div>
      <h1 style={titleStyle}>Preview Logo</h1>

      <div style={cardStyle}>
        <div style={logoContainer}>
          {draft.type === "video" ? (
            <video
              src={draft.url}
              autoPlay
              loop
              muted
              playsInline
              style={videoStyle}
            />
          ) : (
            <Image
              src={draft.url}
              alt="Logo Preview"
              fill
              unoptimized
              sizes="300px"
              style={imageStyle}
            />
          )}
        </div>
      </div>

      <button onClick={handleSave} style={primaryButton}>
        Confirm & Save
      </button>
    </div>
  );
}

/* ---------- Styles ---------- */

const titleStyle = {
  fontSize: "28px",
  fontWeight: 600,
  marginBottom: "30px",
};

const cardStyle = {
  background: "#ffffff",
  padding: "40px",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
  width: "fit-content",
  marginBottom: "30px",
};

const logoContainer = {
  position: "relative" as const,
  width: "300px",
  height: "120px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#000",
  borderRadius: "12px",
  overflow: "hidden",
};

const imageStyle = {
  objectFit: "contain" as const,
};

const videoStyle = {
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain" as const,
};

const primaryButton = {
  padding: "12px 22px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};