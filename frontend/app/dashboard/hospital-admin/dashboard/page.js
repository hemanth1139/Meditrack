import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import HospitalApprovalTable from "@/components/interactable/HospitalApprovalTable";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { getGreeting, formatDate } from "@/lib/utils";
import { Users, UserPlus, Clock, Stethoscope } from "lucide-react";

export default async function HospitalAdminDashboardPage() {
  let data;
  let error;
  let user;

  try {
    const res = await serverFetch("/dashboard/hospital-admin/stats/");
    const meRes = await serverFetch("/auth/me/");
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

  const today = new Date().toISOString();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, Hospital Admin 👋</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-sm text-gray-400 font-medium">{formatDate(today)}</p>
          <span className="text-gray-300">•</span>
          <p className="text-sm text-blue-500 font-semibold">{data?.hospital_name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={Stethoscope} label="Total Doctors" value={data?.total_doctors} color="blue" />
        <StatCard icon={Users} label="Total Staff" value={data?.total_staff} color="green" />
        <StatCard icon={Clock} label="Pending Approvals" value={data?.pending_approvals} color="amber" />
      </div>

      <div className="mt-6">
         <HospitalApprovalTable pendingDoctors={data?.pending_doctors} hospitalId={user?.hospital_id} />
      </div>

      {/* Recently Joined Staff */}
      <Card className="overflow-hidden mt-6">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <h2 className="text-base font-semibold text-gray-800">Recently Joined Staff</h2>
          <Link href="/dashboard/hospital-admin/staff" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          {!data?.recent_staff?.length ? (
            <EmptyState icon={UserPlus} title="No staff members yet" description="Create staff accounts from the Staff page." />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm" name={s.name || "S"} />
                        <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{s.email}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 text-right">{s.date_joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
