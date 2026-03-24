"use client";

import { useRouter } from "next/navigation";
import { useState, ChangeEvent } from "react";

type LogoType = "image" | "gif" | "video";

export default function EditLogo() {
  const router = useRouter();

  const [type, setType] = useState<LogoType>("image");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const selectedFile = e.target.files[0];

    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
  };

  const handleNext = () => {
    if (!file || !fileUrl) {
      alert("Please upload a file before continuing.");
      return;
    }

    const draft = {
      type,
      url: fileUrl,
    };

    localStorage.setItem("logoDraft", JSON.stringify(draft));

    sessionStorage.setItem("logoFile", file.name);

    router.push("/admin/update-logo/preview");
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 30 }}>
        Edit Logo
      </h1>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as LogoType)}
        style={{ marginRight: 15 }}
      >
        <option value="image">Image (PNG/JPG)</option>
        <option value="gif">GIF</option>
        <option value="video">Video (MP4/WebM)</option>
      </select>

      <input
        type="file"
        accept={type === "video" ? "video/*" : "image/*"}
        onChange={handleFileChange}
      />

      <br />
      <br />

      <button
        onClick={handleNext}
        style={{
          padding: "10px 18px",
          background: "#000",
          color: "#fff",
          borderRadius: 6,
        }}
      >
        Preview
      </button>
    </div>
  );
}