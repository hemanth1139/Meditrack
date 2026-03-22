"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function QRCodeDisplay({ value, patient }) {
  // Use a static 200px size for SSR hydration consistency. Let CSS handle the rest if needed.
  const qrSize = 200;

  const download = async () => {
    const svg = document.getElementById("patient-qr");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 512;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `meditrack_qr_${patient?.patient_id || "patient"}.png`;
      a.click();
    };
    img.src = url;
  };

  return (
    <Card className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border-0 shadow-lg">
      {/* Header gradient */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-6 py-5 text-center">
        <div className="text-[18px] font-bold text-white">{patient?.name || "Patient"}</div>
        <div className="mt-1 font-mono text-[13px] text-blue-200">{patient?.patient_id}</div>
      </div>

      {/* QR Code area */}
      <div className="flex flex-col items-center gap-4 bg-white p-6">
        <div className="rounded-xl border-2 border-blue-100 bg-white p-4 shadow-sm">
          <QRCode id="patient-qr" value={value} size={qrSize} />
        </div>

        {/* Patient info */}
        <div className="w-full rounded-xl bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <div>
              <div className="font-medium text-slate-400">Blood Group</div>
              <div className="mt-0.5 font-semibold text-slate-800">{patient?.blood_group || "—"}</div>
            </div>
            <div>
              <div className="font-medium text-slate-400">Home Hospital</div>
              <div className="mt-0.5 font-semibold text-slate-800 truncate">{patient?.hospital_name || "—"}</div>
            </div>
          </div>
        </div>

        <Button className="w-full h-11 text-[14px] font-semibold" onClick={download}>
          ↓ Download QR Code
        </Button>

        <div className="text-center text-[12px] text-slate-400">
          Show this code at any MediTrack hospital to access your profile instantly.
        </div>
      </div>
    </Card>
  );
}
