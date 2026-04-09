"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const QRScannerModal = dynamic(
  () => import("@/components/shared/QRScannerModal"),
  { ssr: false }
);

export default function StaffDashboardActions() {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [vitalsSearchId, setVitalsSearchId] = useState("");
  const [vitalsMode, setVitalsMode] = useState(false);

  const handleScan = (patientId) => {
    if (patientId) router.push(`/dashboard/staff/patient/${patientId}`);
  };

  const handleVitalsSearch = () => {
    const id = vitalsSearchId.trim();
    if (id.length === 10) router.push(`/dashboard/staff/patient/${id}?tab=vitals`);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Scan QR */}
        <button
          onClick={() => setScannerOpen(true)}
          className="flex items-center gap-4 rounded-xl border-2 border-blue-100 bg-blue-50 hover:bg-blue-100 p-5 text-left transition-colors group"
        >
          <span className="text-3xl group-hover:scale-110 transition-transform">📷</span>
          <div>
            <div className="font-semibold text-blue-700">Scan Patient QR Code</div>
            <div className="text-xs text-blue-500 mt-0.5">View patient profile instantly</div>
          </div>
        </button>

        {/* Add Vitals */}
        <div className="rounded-xl border-2 border-green-100 bg-green-50 p-5">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl">💉</span>
            <div>
              <div className="font-semibold text-green-700">Add Vitals</div>
              <div className="text-xs text-green-500 mt-0.5">Find patient by ID to record vitals</div>
            </div>
          </div>
          {!vitalsMode ? (
            <button
              onClick={() => setVitalsMode(true)}
              className="w-full rounded-lg bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Enter Patient ID
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={10}
                value={vitalsSearchId}
                onChange={(e) => setVitalsSearchId(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVitalsSearch()}
                placeholder="10-digit Patient ID"
                className="flex-1 rounded-lg border border-green-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 font-mono bg-white"
                autoFocus
              />
              <button
                disabled={vitalsSearchId.length !== 10}
                onClick={handleVitalsSearch}
                className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-40 px-3 py-2 text-sm font-semibold text-white transition-colors"
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>
      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </>
  );
}
