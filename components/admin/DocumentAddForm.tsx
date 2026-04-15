"use client";

import { useRef, useState } from "react";
import authStyles from "@/app/(auth)/auth.module.css";

export function DocumentAddForm({ patientId }: { patientId: string }) {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setUploading(true);
    setProgress("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.set("file", file);
    formData.set("title", title.trim());
    formData.set("patientId", patientId);

    const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
    const data = await res.json();

    setUploading(false);
    if (!data.success) {
      setProgress("error");
      setErrorMsg(data.error ?? "Upload failed.");
      return;
    }

    setTitle("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setProgress("done");
    setTimeout(() => setProgress("idle"), 3000);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Add document
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="doc-title">Title</label>
          <input
            id="doc-title"
            className={authStyles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Lab results, Assessment report…"
            required
          />
        </div>
        <div className={authStyles.field}>
          <label className={authStyles.label} htmlFor="doc-file">File (max 20 MB)</label>
          <input
            id="doc-file"
            ref={fileRef}
            className={authStyles.input}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx,.csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
            style={{ paddingTop: "0.4rem" }}
          />
        </div>
      </div>
      {progress === "error" && (
        <p style={{ fontSize: "0.75rem", color: "var(--danger)" }}>{errorMsg}</p>
      )}
      <button
        type="submit"
        className={authStyles.submit}
        style={{ marginTop: 0, width: "auto", alignSelf: "flex-start", padding: "0.6rem 1.25rem" }}
        disabled={uploading || !file || !title.trim()}
      >
        {progress === "uploading" ? "Uploading…" : progress === "done" ? "Uploaded ✓" : "Upload document"}
      </button>
    </form>
  );
}
