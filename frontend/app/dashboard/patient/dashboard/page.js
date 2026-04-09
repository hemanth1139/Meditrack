import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import PatientQRActions from "@/components/interactable/PatientQRActions";

const StatCard = ({ icon, label, value }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </div>
    <p className="text-3xl font-bold text-gray-800">{value ?? "—"}</p>
  </div>
);

const VISIT_TYPE_META = {
  CONSULTATION: { icon: "🩺", label: "Consultation" },
  LAB_DIAGNOSTICS: { icon: "🔬", label: "Lab & Diagnostics" },
  PROCEDURE_EMERGENCY: { icon: "🏥", label: "Procedure / Emergency" },
};

export default async function PatientDashboardPage() {
  let data;
  let user;
  let error;

  try {
    const [res, meRes] = await Promise.all([
      serverFetch("/dashboard/patient/stats/"),
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
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon="📋" label="Total Records" value={data?.total_records} />
        <StatCard icon="💊" label="Active Prescriptions" value={data?.active_prescriptions} />
        <StatCard icon="💉" label="Last Vitals Recorded" value={data?.last_vitals_date || "—"} />
      </div>

      {/* Section 1: My QR Code */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 text-base mb-5">My QR Code</h2>
        <PatientQRActions qrCodeUrl={data?.qr_code_url} patientId={data?.patient_id} />
      </div>

      {/* Section 2: Recent Medical Records */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800 text-base">Recent Medical Records</h2>
          <Link href="/dashboard/patient/records" className="text-sm text-blue-500 hover:underline font-medium">
            View All Records →
          </Link>
        </div>

        {!data?.recent_records?.length ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-sm">No records yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.recent_records.map((r) => {
              const meta = VISIT_TYPE_META[r.visit_type] || { icon: "📄", label: r.visit_type };
              return (
                <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl flex-shrink-0">{meta.icon}</span>
                    <div className="min-w-0">
                      <div className="font-medium text-gray-800 text-sm">{meta.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Dr. {r.doctor_name} • {r.visit_date}
                      </div>
                      {r.diagnosis && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          Diagnosis: {r.diagnosis}
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/patient/records`}
                    className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Latest Vitals Summary */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mt-6">
        <h2 className="font-semibold text-gray-800 text-base mb-4">Latest Vitals</h2>

        {!data?.latest_vitals ? (
          <div className="text-center py-6 text-gray-400">
            <p className="text-sm">No vitals recorded yet</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "BP", value: data.latest_vitals.bp, unit: "mmHg" },
                { label: "Pulse", value: data.latest_vitals.pulse, unit: "bpm" },
                { label: "Temp", value: data.latest_vitals.temp, unit: "°F" },
                { label: "Weight", value: data.latest_vitals.weight, unit: "kg" },
                { label: "SpO₂", value: data.latest_vitals.spo2, unit: "%" },
              ].map(({ label, value, unit }) => (
                <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">{label}</div>
                  <div className="font-bold text-gray-800 text-base">{value ?? "—"}</div>
                  <div className="text-xs text-gray-400">{unit}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Recorded on {data.latest_vitals.recorded_at} by {data.latest_vitals.recorded_by}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
