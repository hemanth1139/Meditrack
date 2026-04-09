"use client";

import toast from "react-hot-toast";

export default function PatientQRActions({ qrCodeUrl, patientId }) {
  const handleDownloadQR = () => {
    if (!qrCodeUrl) {
      toast.error("QR code not available");
      return;
    }
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `meditrack-qr-${patientId}.png`;
    link.target = "_blank";
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {qrCodeUrl ? (
        <div className="rounded-2xl border-4 border-blue-100 p-3 bg-white shadow-inner">
          <img
            src={qrCodeUrl}
            alt="Patient QR Code"
            width={200}
            height={200}
            className="rounded-xl"
          />
        </div>
      ) : (
        <div className="h-48 w-48 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 text-sm">
          QR not generated yet
        </div>
      )}
      <div className="text-center">
        <p className="text-lg font-bold text-gray-800 font-mono tracking-widest">
          {patientId || "—"}
        </p>
        <p className="text-sm text-gray-500 mt-1">Show this at the hospital counter</p>
      </div>
      {qrCodeUrl && (
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
