import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import StaffDashboardActions from "@/components/interactable/StaffDashboardActions";

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className={`font-bold text-gray-800 ${typeof value === "string" && value.length > 12 ? "text-lg" : "text-3xl"}`}>
      {value ?? "—"}
    </p>
  </div>
);

export default async function StaffDashboardPage() {
  let data;
  let error;
  let user;

  try {
    const [res, meRes] = await Promise.all([
      serverFetch("/dashboard/staff/stats/"),
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
        <h1 className="text-2xl font-bold text-slate-800">Welcome, {user?.first_name || user?.username}</h1>
        <p className="text-slate-500">{data?.hospital_name}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="🤒" label="My Assigned Patients" value={data?.assigned_patients_count} />
        <StatCard icon="💉" label="Vitals Recorded Today" value={data?.vitals_today} />
        <StatCard icon="🏥" label="My Hospital" value={data?.hospital_name} />
      </div>

      {/* Section 1: Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 text-base mb-4">Quick Actions</h2>
        <StaffDashboardActions />
      </div>

      {/* Section 2: Assigned Patients */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">My Assigned Patients</h2>
        </div>

        {!data?.patients?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No patients assigned yet — ask your doctor to assign patients</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.patients.map((p) => {
              const initials = p.name
                ? p.name.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
                : "P";

              return (
                <div key={p.patient_id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-sm font-bold text-green-700 flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 text-sm truncate">{p.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 font-mono">{p.patient_id}</span>
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">{p.blood_group}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:block text-right mr-2">
                      <div className="text-xs text-gray-400">
                        {p.last_vitals_date ? `Vitals: ${p.last_vitals_date}` : "No vitals yet"}
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/staff/patients/${p.patient_id}`}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/dashboard/staff/patients/${p.patient_id}?tab=vitals`}
                      className="rounded-lg bg-green-600 hover:bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      Add Vitals
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
