"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/shared/EmptyState";
import usePatients from "@/hooks/usePatients";

export default function DoctorPatientsPage() {
  const router = useRouter();
  const { patients, isLoading, searchPatients } = usePatients();
  const [q, setQ] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);

  const list = useMemo(() => {
    if (!q) return patients || [];
    return (patients || []).filter((p) =>
      (p.patient_id || "").toLowerCase().includes(q.toLowerCase())
    );
  }, [patients, q]);

  const openScanner = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true });
      setScannerOpen(true);
    } catch {
      toast.error("Camera permission required");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input placeholder="Search by patient name or ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Button variant="secondary" onClick={openScanner}>
          Scan QR
        </Button>
      </div>

      {scannerOpen ? (
        <Card className="rounded-lg border-border bg-white p-4 shadow-card">
          <div className="text-[16px] font-medium text-slate-900">QR Scanner</div>
          <div className="mt-2 text-[14px] text-slate-600">
            QR scanning UI uses `html5-qrcode` and can be enabled in a dedicated modal; camera permission is handled.
          </div>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => setScannerOpen(false)}>
              Close
            </Button>
          </div>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : list.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => (
            <Card key={p.patient_id} className="rounded-lg border-border bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-medium text-slate-900">
                    {p.user || "Patient"}
                  </div>
                  <div className="mt-1 text-[14px] text-slate-600">
                    {p.patient_id} • {p.blood_group}
                  </div>
                  <div className="mt-1 text-[14px] text-slate-600">
                    Home hospital: {p.hospital}
                  </div>
                </div>
                <Button onClick={() => router.push(`/dashboard/doctor/patients/${p.patient_id}`)}>
                  View Profile
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No patients found" description="Try scanning a QR code or searching by patient ID." />
      )}
    </div>
  );
}

