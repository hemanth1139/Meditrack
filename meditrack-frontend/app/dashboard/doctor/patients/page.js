"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import usePatients from "@/hooks/usePatients";
import { QrCode } from "lucide-react";

const QRScannerModal = dynamic(() => import("@/components/shared/QRScannerModal"), { ssr: false });

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { patients, isLoading } = usePatients();
  const [q, setQ] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const list = useMemo(() => {
    if (!q) return patients || [];
    const lower = q.toLowerCase();
    return (patients || []).filter((p) =>
      (p.patient_id || "").includes(lower) ||
      (p.user?.first_name || "").toLowerCase().includes(lower) ||
      (p.user?.last_name || "").toLowerCase().includes(lower)
    );
  }, [patients, q]);

  const handleScan = (patientId) => {
    if (patientId) router.push(`/dashboard/doctor/patient/${patientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search patients by name or ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={() => setScannerOpen(true)}>
          <QrCode size={16} /> Scan QR
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : list.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <Card key={p.patient_id} className="rounded-lg border-border bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold text-slate-900">
                    {p.user?.first_name
                      ? `${p.user.first_name} ${p.user.last_name || ""}`.trim()
                      : "Patient"}
                  </div>
                  <div className="mt-1 text-[13px] text-slate-500 font-mono">
                    ID: {p.patient_id}
                  </div>
                  <div className="mt-1 text-[13px] text-slate-500">
                    Blood Group: {p.blood_group} • {p.hospital_name || p.hospital}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push(`/dashboard/doctor/patient/${p.patient_id}`)}
                >
                  View
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No patients found"
          description="Your hospital patients will appear here once assigned."
        />
      )}

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </div>
  );
}
