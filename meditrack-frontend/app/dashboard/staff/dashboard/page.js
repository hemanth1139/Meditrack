"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/analytics/StatsCard";
import usePatients from "@/hooks/usePatients";
import useRecords from "@/hooks/useRecords";
import dynamic from "next/dynamic";
const QRScannerModal = dynamic(() => import("@/components/shared/QRScannerModal"), { ssr: false });
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QrCode } from "lucide-react";
import { DashboardPageSkeleton, ListSkeleton } from "@/components/shared/SkeletonDashboard";

export default function StaffDashboardPage() {
  const { patients, isLoading: pLoading } = usePatients();
  const { records, isLoading: rLoading } = useRecords();
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  const handleScan = (patientId) => {
    if (patientId) {
      router.push(`/dashboard/staff/patient/${patientId}`);
    }
  };

  const isLoading = pLoading || rLoading;
  const pending = (records || []).filter((r) => r.status === "PENDING");

  if (isLoading) return <DashboardPageSkeleton statCount={4} />;

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[24px] font-semibold text-slate-900">Welcome</div>
        <div className="mt-2 text-[14px] text-slate-600">Here’s what’s happening in your hospital today.</div>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Patients Registered Today" value={"—"} color="blue" icon={<span className="text-[14px] font-medium">P</span>} />
        <StatsCard title="Records Submitted Today" value={"—"} color="slate" icon={<span className="text-[14px] font-medium">R</span>} />
        <StatsCard title="Pending Records" value={rLoading ? "—" : String(pending.length)} color="amber" icon={<span className="text-[14px] font-medium">A</span>} />
        <StatsCard title="Total Patients in Hospital" value={pLoading ? "—" : String((patients || []).length)} color="green" icon={<span className="text-[14px] font-medium">T</span>} />
      </div>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-semibold text-slate-900">Recent Patients</div>
          <Button variant="outline" onClick={() => setScannerOpen(true)} className="gap-2">
            <QrCode size={16} /> Scan QR
          </Button>
        </div>
        <div className="mt-3 grid gap-2">
          {(patients || []).slice(0, 10).length ? (
            (patients || []).slice(0, 10).map((p) => (
              <div key={p.patient_id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-slate-900">{p.user || "Patient"}</div>
                  <div className="mt-1 text-[13px] font-medium text-slate-500">{p.patient_id}</div>
                </div>
                <div className="text-[14px] text-slate-600">—</div>
              </div>
            ))
          ) : (
            <div className="text-[14px] text-slate-600">No recent patients.</div>
          )}
        </div>
      </Card>
      
      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </div>
  );
}

