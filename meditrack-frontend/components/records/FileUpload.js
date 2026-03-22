"use client";

import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const MAX = 10 * 1024 * 1024;
const OK = ["application/pdf", "image/jpeg", "image/png"];

export default function FileUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const validate = (file) => {
    if (!file) return true;
    if (file.size > MAX) return "Max size is 10MB";
    if (!OK.includes(file.type)) return "Only PDF, JPG, PNG allowed";
    return true;
  };

  const setFile = (file) => {
    const ok = validate(file);
    if (ok !== true) return toast.error(ok);
    onChange(file);
  };

  return (
    <Card
      className={[
        "rounded-lg border border-dashed border-border bg-white p-4 shadow-card",
        dragging ? "bg-slate-50" : "",
      ].join(" ")}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        setFile(file);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-medium text-slate-900">Upload file</div>
          <div className="mt-1 text-[14px] text-slate-600">PDF or image (JPG/PNG), max 10MB</div>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0])}
          />
          <Button variant="secondary" onClick={() => inputRef.current?.click()}>
            Choose file
          </Button>
          {value ? (
            <Button variant="secondary" onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      {value ? (
        <div className="mt-3 rounded-lg border border-border bg-slate-50 p-3 text-[14px] text-slate-700">
          <div className="font-medium">{value.name}</div>
          <div className="text-slate-600">{Math.round(value.size / 1024)} KB</div>
        </div>
      ) : null}
    </Card>
  );
}

