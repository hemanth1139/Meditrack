"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { QrCode, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const QRScannerModal = dynamic(() => import("@/components/shared/QRScannerModal"), { ssr: false });

export default function StaffNewRecordClient() {
  const router = useRouter();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [lookupId, setLookupId] = useState("");

  const { data: patientPreview, isLoading: isLooking } = useQuery({
    queryKey: ["patientLookup", lookupId],
    queryFn: async () => {
      const res = await api.get(`/patients/lookup/?patient_id=${lookupId}`);
      return res.data?.data || res.data;
    },
    enabled: lookupId.length === 10,
    retry: false,
  });

  const handleScan = (patientId) => {
    if (patientId) router.push(`/dashboard/staff/patient/${patientId}`);
  };

  const handleIdChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setManualId(value);
    setLookupId(value.length === 10 ? value : "");
  };

  const handleGoToPatient = () => {
    if (manualId.trim().length === 10) {
      router.push(`/dashboard/staff/patient/${manualId.trim()}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Medical Record</h1>
        <p className="mt-1 text-slate-500 text-sm">
          Scan the patient&apos;s QR code or enter their Patient ID to open their profile and add a record.
        </p>
      </div>

      {/* QR Scan Card */}
      <Card
        className="rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 flex flex-col items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
        onClick={() => setScannerOpen(true)}
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
          <QrCode size={32} className="text-white" />
        </div>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-lg">Scan Patient QR Code</p>
          <p className="text-slate-500 text-sm mt-1">Use your camera to instantly pull up the patient&apos;s profile</p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700 shadow-md"
          onClick={(e) => { e.stopPropagation(); setScannerOpen(true); }}
        >
          Open Camera
        </Button>
      </Card>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Manual ID Card */}
      <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Search size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="font-bold text-slate-800">Enter Patient ID</p>
            <p className="text-xs text-slate-400">Type the 10-digit Patient ID manually</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 9163594952"
            maxLength={10}
            value={manualId}
            onChange={handleIdChange}
            onKeyDown={(e) => e.key === "Enter" && handleGoToPatient()}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
          />
          <Button
            onClick={handleGoToPatient}
            disabled={manualId.length !== 10}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 px-6 rounded-xl"
          >
            Go
          </Button>
        </div>

        {/* Live Patient Preview */}
        {lookupId.length === 10 && (
          <div className="p-3 rounded-xl border border-slate-100 bg-slate-50">
            {isLooking ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                <p className="text-sm text-slate-500">Looking up patient...</p>
              </div>
            ) : patientPreview?.full_name ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold border border-emerald-200">
                  {patientPreview.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{patientPreview.full_name}</p>
                  <p className="text-xs text-slate-500">Blood Group: {patientPreview.blood_group || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-red-500 font-medium">Patient not found. Check the ID and try again.</p>
            )}
          </div>
        )}
      </Card>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
}
