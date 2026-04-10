"use client";

import toast from "react-hot-toast";
import { QRCodeSVG as QRCode } from "qrcode.react";

export default function PatientQRActions({ patientId }) {
  const qrSize = 180;
  
  const handleDownloadQR = () => {
    if (!patientId) {
      toast.error("Patient ID not available");
      return;
    }
    const svg = document.getElementById("dashboard-patient-qr");
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
      // Give some padding to the QR in the downloaded image (scale it up to fit 512)
      // Original size is 180. We can map it to 400x400
      ctx.drawImage(img, 56, 56, 400, 400); 
      URL.revokeObjectURL(url);
      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `meditrack-qr-${patientId}.png`;
      a.click();
    };
    img.src = url;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {patientId ? (
        <div className="rounded-2xl border-4 border-blue-50 p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
          <QRCode 
            id="dashboard-patient-qr" 
            value={`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/qr/${patientId}`} 
            size={qrSize} 
          />
        </div>
      ) : (
        <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
          QR not generated yet
        </div>
      )}
      <div className="text-center hidden">
        {/* Hidden here to prevent duplicates, the dashboard renders its own Patient ID component below it */}
      </div>
      {patientId && (
        <button
          onClick={handleDownloadQR}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          ⬇ Download QR Code
        </button>
      )}
    </div>
  );
}
