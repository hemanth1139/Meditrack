"use client";

import useAnalytics from "@/hooks/useAnalytics";
import StatsCard from "@/components/analytics/StatsCard";
import dynamic from "next/dynamic";

const MonthlyActivityChart = dynamic(
  () => import("@/components/analytics/MonthlyActivityChart"),
  { ssr: false }
);

const DiagnosisChart = dynamic(
  () => import("@/components/analytics/DiagnosisChart"),
  { ssr: false }
);

const DoctorPatientChart = dynamic(
  () => import("@/components/analytics/DoctorPatientChart"),
  { ssr: false }
);
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { hospitalStats, isLoading } = useAnalytics();

  const topDiagnoses = hospitalStats?.top_diagnoses || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard title="Total Hospitals" value={"—"} color="blue" icon={<span className="text-[14px] font-medium">H</span>} />
        <StatsCard title="Total Doctors (approved)" value={hospitalStats?.total_doctors ?? "—"} color="green" icon={<span className="text-[14px] font-medium">D</span>} />
        <StatsCard title="Total Patients" value={hospitalStats?.total_patients ?? "—"} color="slate" icon={<span className="text-[14px] font-medium">P</span>} />
        <StatsCard title="Total Records" value={"—"} color="slate" icon={<span className="text-[14px] font-medium">R</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <MonthlyActivityChart data={hospitalStats?.monthly_record_activity} isLoading={isLoading} />
        <DiagnosisChart topDiagnoses={topDiagnoses} isLoading={isLoading} title="System-wide Diagnoses" />
      </div>

      <DoctorPatientChart
        data={[
          { name: "Doctor A", patients: 10 },
          { name: "Doctor B", patients: 8 },
        ]}
        isLoading={false}
      />

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="text-[18px] font-semibold text-slate-900">Hospitals Overview</div>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-2">Hospital</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Doctors</th>
                <th className="px-3 py-2">Patients</th>
                <th className="px-3 py-2">Records</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(hospitalStats?.hospitals || []).map((h) => (
                <tr key={h.id} className="border-t border-border">
                  <td className="px-3 py-2">{h.name}</td>
                  <td className="px-3 py-2">{h.city}</td>
                  <td className="px-3 py-2">{h.doctors_count}</td>
                  <td className="px-3 py-2">{h.patients_count}</td>
                  <td className="px-3 py-2">{h.records_count}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${h.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {h.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="text-[18px] font-semibold text-slate-900">Alerts</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard/admin/doctors">Pending Doctor Approvals</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard/admin/audit-logs">Audit Logs</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

