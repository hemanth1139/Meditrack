"use client";

import { useState } from "react";
import { Upload, X, File, Image as ImageIcon, Loader2 } from "lucide-react";
import { uploadMedicalDocument } from "@/lib/documents";

export default function CloudinaryUpload({
  label = "Upload Document",
  docType = "OTHER",
  accept = "application/pdf,image/png,image/jpeg",
  maxSizeMB = 10,
  maxFiles = 5,
  uploadedFiles = [],
  onUploadSuccess,
  onRemoveFile,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} files.`);
      return;
    }

    const invalidSize = files.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (invalidSize) {
      setError(`Files must be under ${maxSizeMB}MB.`);
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // We use the file name as the label if not provided specifically per file
        return uploadMedicalDocument(file, docType, file.name || label);
      });

      const newDocs = await Promise.all(uploadPromises);
      if (onUploadSuccess) onUploadSuccess(newDocs);
      
    } catch (err) {
      setError(err.message || "An error occurred during upload. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-xs text-slate-500">Max {maxFiles} files ({maxSizeMB}MB each)</span>
      </div>
      
      {/* Upload Dropzone */}
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition shadow-sm">
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileChange}
          disabled={isUploading || uploadedFiles.length >= maxFiles}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
          {isUploading ? (
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-blue-500" />
          ) : (
            <Upload className="mb-2 h-8 w-8 text-slate-400 group-hover:text-blue-500" />
          )}
          <p className="text-sm font-medium">
            {isUploading ? "Uploading files..." : "Click or drag files to upload"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {accept.includes("pdf") ? "PDF" : ""}{accept.includes("image") ? " images" : ""} allowed
          </p>
        </div>
      </div>

      {error && <p className="text-xs font-medium text-red-500">{error}</p>}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploadedFiles.map((doc, index) => (
            <li
              key={index}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                  {doc.file_type === "pdf" ? <File size={16} /> : <ImageIcon size={16} />}
                </div>
                <div className="truncate text-sm font-medium text-slate-700">
                  {doc.label}
                  <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] uppercase text-slate-500">
                    {doc.file_type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index, doc)}
                className="ml-2 rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
