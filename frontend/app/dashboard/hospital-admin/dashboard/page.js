import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import HospitalApprovalTable from "@/components/interactable/HospitalApprovalTable";

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-3xl font-bold text-gray-800">{value ?? "—"}</p>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="text-center py-10 text-gray-400">
    <p className="text-sm">{message}</p>
  </div>
);

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
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Hospital Dashboard</h1>
        <p className="text-slate-500">{data?.hospital_name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="👨‍⚕️" label="Total Doctors" value={data?.total_doctors} />
        <StatCard icon="👷" label="Total Staff" value={data?.total_staff} />
        <StatCard icon="⏳" label="Pending Approvals" value={data?.pending_approvals} />
      </div>

      <HospitalApprovalTable pendingDoctors={data?.pending_doctors} hospitalId={user?.hospital_id} />

      {/* Section 2: Recently Joined Staff */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">Recently Joined Staff</h2>
          <Link href="/dashboard/hospital-admin/staff" className="text-sm text-blue-500 hover:underline font-medium">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {!data?.recent_staff?.length ? (
            <EmptyState message="No staff members yet — create staff accounts from the Staff page" />
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Staff Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_staff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                          {(s.name || "S").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-800">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{s.email}</td>
                    <td className="px-5 py-3 text-gray-500">{s.date_joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
