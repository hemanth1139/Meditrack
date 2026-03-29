"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/analytics/StatsCard";
const MonthlyActivityChart = dynamic(() => import("@/components/analytics/MonthlyActivityChart"), { ssr: false });
const DiagnosisChart = dynamic(() => import("@/components/analytics/DiagnosisChart"), { ssr: false });
import StatusBadge from "@/components/shared/StatusBadge";
import { getUser } from "@/lib/auth";

export default function HospitalAdminDashboardPage() {
  const router = useRouter();
  const user = getUser();
  const hospitalId = user?.hospital_id;

  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!hospitalId) return;
    setIsLoading(true);
    try {
      const res = await api.get("/analytics/hospital/", { params: { hospital_id: hospitalId } });
      setStats(res.data.data || {});
    } catch (e) {
      toast.error("Failed to load hospital admin stats");
    } finally {
      setIsLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingDoctorApprovals = stats?.pending_doctor_approvals || 0;
  const flaggedRecords = stats?.flagged_records || 0;

  const push = (path) => router.push(path);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total Patients" value={stats.total_patients ?? "—"} color="blue" icon={<span className="text-[14px] font-medium">P</span>} />
        <StatsCard title="Total Doctors" value={stats.total_doctors ?? "—"} color="green" icon={<span className="text-[14px] font-medium">D</span>} />
        <StatsCard title="Total Records This Month" value={stats.records_this_month ?? "—"} color="slate" icon={<span className="text-[14px] font-medium">R</span>} />
        <StatsCard title="Pending Doctor Approvals" value={pendingDoctorApprovals} color="amber" icon={<span className="text-[14px] font-medium">A</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyActivityChart data={stats.monthly_activity || []} isLoading={isLoading} />
        <DiagnosisChart topDiagnoses={stats.top_diagnoses || []} isLoading={isLoading} title="Top Diagnoses" />
      </div>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="text-[18px] font-semibold text-slate-900">Alerts</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Button onClick={() => push("/dashboard/hospital-admin/doctors")}>
            <div className="flex items-center justify-between w-full"><span>Flagged Records</span> <StatusBadge status={String(flaggedRecords)} /></div>
          </Button>
          <Button onClick={() => push("/dashboard/hospital-admin/doctors")}>Pending Doctor Approvals: {pendingDoctorApprovals}</Button>
        </div>
      </Card>
    </div>
  );
}
