import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import DoctorDashboardActions from "@/components/interactable/DoctorDashboardActions";

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-3xl font-bold text-gray-800">{value ?? "—"}</p>
  </div>
);

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
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Welcome, Dr. {user?.last_name || user?.first_name || user?.username}</h1>
        <p className="text-slate-500">{data?.hospital_name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="🤒" label="My Total Patients" value={data?.total_patients} />
        <StatCard icon="📋" label="Records This Month" value={data?.records_this_month} />
        <StatCard icon="👷" label="Staff Assigned" value={data?.assigned_staff} />
      </div>

      {/* Section 1: Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 text-base mb-4">Quick Actions</h2>
        <DoctorDashboardActions />
      </div>

      {/* Section 2: Recent Patients */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">Recent Patients</h2>
          <Link href="/dashboard/doctor/patients" className="text-sm text-blue-500 hover:underline font-medium">
            View All →
          </Link>
        </div>

        {!data?.recent_patients?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No patients yet — scan a QR to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recent_patients.map((p) => {
              const initials = p.name
                ? p.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
                : "P";

              return (
                <div key={p.patient_id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{p.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{p.patient_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div className="hidden sm:block">
                      <div className="text-xs text-gray-500">{VISIT_TYPE_LABELS[p.last_record_type] || p.last_record_type}</div>
                      <div className="text-xs text-gray-400">{p.last_visit_date}</div>
                    </div>
                    <Link
                      href={`/dashboard/doctor/patient/${p.patient_id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
