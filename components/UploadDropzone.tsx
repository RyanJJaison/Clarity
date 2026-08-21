"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function UploadDropzone({
  onFile,
  accept = "application/pdf",
}: {
  onFile: (file: File) => void;
  accept?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    onFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
        dragging ? "border-primary bg-muted" : "border-muted-foreground/30"
      )}
    >
      <p className="text-sm font-medium">{fileName ?? "Drop a PDF here, or click to browse"}</p>
      <p className="text-xs text-muted-foreground">PDF, up to 20MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
