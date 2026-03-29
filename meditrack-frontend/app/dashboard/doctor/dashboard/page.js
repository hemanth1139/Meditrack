"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { QrCode } from "lucide-react";

import StatsCard from "@/components/analytics/StatsCard";
import PatientSearch from "@/components/doctor/PatientSearch";
import useAnalytics from "@/hooks/useAnalytics";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useRecords from "@/hooks/useRecords";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { DashboardPageSkeleton } from "@/components/shared/SkeletonDashboard";

const MonthlyActivityChart = dynamic(() => import("@/components/analytics/MonthlyActivityChart"), { ssr: false });
const DiagnosisChart = dynamic(() => import("@/components/analytics/DiagnosisChart"), { ssr: false });
const QRScannerModal = dynamic(() => import("@/components/shared/QRScannerModal"), { ssr: false });

export default function DoctorDashboardPage() {
  const { doctorStats, isLoading } = useAnalytics();
  const { records } = useRecords();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const router = useRouter();

  const handleScan = (patientId) => {
    if (patientId) {
      router.push(`/dashboard/doctor/patient/${patientId}`);
    }
  };

  const breakdown = doctorStats?.diagnosis_breakdown || {};
  const topDiagnoses = Object.entries(breakdown)
    .map(([diagnosis, count]) => ({ diagnosis, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const monthly = {}; // doctor endpoint doesn't return monthly, so keep empty for now.

  const recent = (records || []).slice(0, 10);

  if (isLoading) return <DashboardPageSkeleton statCount={4} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="My Patients" value={doctorStats?.my_patients ?? "—"} color="blue" icon={<span className="text-[14px] font-medium">P</span>} />
        <StatsCard title="Pending Approvals" value={doctorStats?.my_pending_queue ?? "—"} color="amber" icon={<span className="text-[14px] font-medium">A</span>} />
        <StatsCard title="My Approvals" value={doctorStats?.my_approvals ?? "—"} color="green" icon={<span className="text-[14px] font-medium">✓</span>} />
        <StatsCard title="Flagged Records" value={(records || []).filter((r) => r.status === "FLAGGED").length} color="red" icon={<span className="text-[14px] font-medium">!</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyActivityChart data={monthly} isLoading={isLoading} />
        <DiagnosisChart topDiagnoses={topDiagnoses} isLoading={isLoading} title="My Diagnosis Breakdown" />
      </div>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="text-[18px] font-semibold text-slate-900">Recent Activity</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)} className="gap-2">
              <QrCode size={16} /> Scan QR
            </Button>
            <Button onClick={() => setSearchOpen(true)}>Search Patient</Button>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          {recent.length ? (
            recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-slate-900">
                    {r.patient_id || "Patient"} • {r.record_type}
                  </div>
                  <div className="mt-1 text-[13px] font-medium text-slate-500">{formatDate(r.created_at)}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          ) : (
            <div className="text-[14px] text-slate-600">No recent activity.</div>
          )}
        </div>
      </Card>

      <PatientSearch open={searchOpen} onOpenChange={setSearchOpen} onSelect={() => {}} />
      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScan} />
    </div>
  );
}

