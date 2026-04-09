import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import AdminApprovalTable from "@/components/interactable/AdminApprovalTable";

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

export default async function AdminDashboardPage() {
  let data;
  let error;
  
  try {
    const res = await serverFetch("/dashboard/admin/stats/");
    data = res.data;
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
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500">Overview of system health</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="🏥" label="Total Hospitals" value={data?.total_hospitals} />
        <StatCard icon="👥" label="Total Users" value={data?.total_users} />
        <StatCard icon="⏳" label="Pending Doctor Approvals" value={data?.pending_approvals} />
      </div>

      {/* Section 1: Recent Hospitals */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">Recent Hospitals</h2>
          <Link href="/dashboard/admin/hospitals" className="text-sm text-blue-500 hover:underline font-medium">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          {!data?.recent_hospitals?.length ? (
            <EmptyState message="No hospitals registered yet" />
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 font-medium">Hospital Name</th>
                  <th className="px-5 py-3 font-medium">City</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.recent_hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-800">{h.name}</td>
                    <td className="px-5 py-3 text-gray-600">{h.city}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${h.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {h.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{h.created_at || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Section 2: Pending Doctor Approvals */}
      <AdminApprovalTable pendingDoctors={data?.pending_doctors} />
    </div>
  );
}
