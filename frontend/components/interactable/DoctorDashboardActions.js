"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const QRScannerModal = dynamic(
  () => import("@/components/shared/QRScannerModal"),
  { ssr: false }
);

export default function DoctorDashboardActions() {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [searchId, setSearchId] = useState("");

  const handleScan = (patientId) => {
    if (patientId) router.push(`/dashboard/doctor/patient/${patientId}`);
  };

  const handleSearch = () => {
    const id = searchId.trim();
    if (id.length === 10) router.push(`/dashboard/doctor/patient/${id}`);
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
            <div className="text-xs text-blue-500 mt-0.5">Point camera at patient's QR to open profile</div>
          </div>
        </button>

        {/* Search by ID */}
        <div className="rounded-xl border-2 border-gray-100 bg-gray-50 p-5">
          <div className="flex items-center gap-4 mb-3">
            <span className="text-3xl">🔍</span>
            <div>
              <div className="font-semibold text-gray-700">Search Patient by ID</div>
              <div className="text-xs text-gray-400 mt-0.5">Enter the 10-digit patient ID</div>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={10}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 1234567890"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
            />
            <button
              disabled={searchId.length !== 10}
              onClick={handleSearch}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 px-4 py-2 text-sm font-semibold text-white transition-colors"
            >
              Go
            </button>
          </div>
          {searchId.length > 0 && searchId.length < 10 && (
            <p className="text-xs text-amber-500 mt-1">{10 - searchId.length} more digits needed</p>
          )}
        </div>
      </div>
      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </>
  );
}
