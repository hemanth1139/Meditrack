import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import DoctorDashboardActions from "@/components/interactable/DoctorDashboardActions";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { getGreeting, formatDate } from "@/lib/utils";
import { Users, FileText, UserCheck, ChevronRight } from "lucide-react";

const VISIT_TYPE_LABELS = {
  CONSULTATION: "Consultation",
  LAB_DIAGNOSTICS: "Lab & Diagnostics",
  PROCEDURE_EMERGENCY: "Procedure / Emergency",
};

export default async function DoctorDashboardPage() {
  let data;
  let error;
  let user;

  try {
    const [res, meRes] = await Promise.all([
      serverFetch("/dashboard/doctor/stats/"),
      serverFetch("/auth/me/")
    ]);
    data = res.data;
    user = meRes.data;
  } catch (err) {
    error = err.message;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm font-medium">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const firstName = user?.last_name || user?.first_name || user?.username || "Doctor";
  const today = new Date().toISOString();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, Dr. {firstName} 👋</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-sm text-gray-400 font-medium">{formatDate(today)}</p>
          <span className="text-gray-300">•</span>
          <p className="text-sm text-blue-500 font-semibold">{data?.hospital_name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={Users} label="My Patients" value={data?.total_patients} color="blue" />
        <StatCard icon={FileText} label="Records This Month" value={data?.records_this_month} color="amber" />
        <StatCard icon={UserCheck} label="Assigned Staff" value={data?.assigned_staff} color="green" />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <DoctorDashboardActions />
      </Card>

      {/* Recent Patients */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">Recent Patients</h2>
          <Link href="/dashboard/doctor/patients" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
            View All
          </Link>
        </div>

        {!data?.recent_patients?.length ? (
          <div className="text-center py-12 text-gray-400">
             <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
             <p className="text-sm font-medium">No patients yet</p>
             <p className="text-xs mt-1">Scan a QR to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recent_patients.map((p) => (
              <div key={p.patient_id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-gray-50 transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <Avatar name={p.name || "Patient"} size="md" />
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{p.name || "Unknown Patient"}</div>
                    <div className="text-xs text-gray-400 font-mono tracking-wider mt-0.5">{p.patient_id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:block text-right">
                    <div className="text-xs font-medium text-gray-600">{VISIT_TYPE_LABELS[p.last_record_type] || p.last_record_type}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{p.last_visit_date}</div>
                  </div>
                  <Link
                    href={`/dashboard/doctor/patient/${p.patient_id}`}
                    className="flex justify-center items-center w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
