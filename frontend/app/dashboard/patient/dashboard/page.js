import Link from "next/link";
import { serverFetch } from "@/lib/server-fetch";
import PatientQRActions from "@/components/interactable/PatientQRActions";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { getGreeting, formatDate } from "@/lib/utils";
import { FileText, Pill, Activity, ChevronRight } from "lucide-react";

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
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm font-medium">
        Failed to load dashboard. Please refresh.
      </div>
    );
  }

  const firstName = user?.first_name || user?.username || "Patient";
  const today = new Date().toISOString();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {firstName} 👋</h1>
        <p className="text-sm text-gray-400 font-medium mt-1.5">{formatDate(today)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={FileText} label="Total Records" value={data?.total_records} color="blue" />
        <StatCard icon={Pill} label="Active Prescriptions" value={data?.active_prescriptions} color="amber" />
        <StatCard icon={Activity} label="Last Vitals" value={data?.last_vitals_date || "—"} color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Records */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">Recent Medical Records</h2>
              <Link href="/dashboard/patient/records" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                View All
              </Link>
            </div>

            {!data?.recent_records?.length ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                <p className="text-sm font-medium">No records yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {data.recent_records.map((r) => {
                  const meta = VISIT_TYPE_META[r.visit_type] || { icon: "📄", label: r.visit_type };
                  return (
                    <div key={r.id} className="flex p-5 hover:bg-gray-50 transition-colors gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl shrink-0">
                        {meta.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 text-sm">{meta.label}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          <span className="font-medium text-gray-700">Dr. {r.doctor_name}</span> • {r.visit_date}
                        </div>
                        {r.diagnosis && (
                          <div className="mt-2 text-sm text-gray-600 bg-white border border-gray-100 rounded-lg p-2 truncate">
                            <span className="font-medium text-gray-800">Dx:</span> {r.diagnosis}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Latest Vitals */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-5">Latest Vitals</h2>
            {!data?.latest_vitals ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No vitals recorded yet</p>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: "BP", value: data.latest_vitals.bp, unit: "mmHg" },
                    { label: "Pulse", value: data.latest_vitals.pulse, unit: "bpm" },
                    { label: "Temp", value: data.latest_vitals.temp, unit: "°F" },
                    { label: "Weight", value: data.latest_vitals.weight, unit: "kg" },
                    { label: "SpO₂", value: data.latest_vitals.spo2, unit: "%" },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-center hover:shadow-md transition-shadow">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
                      <div className="font-bold text-gray-900 text-xl">{value ?? "—"}</div>
                      <div className="text-xs text-gray-400 font-medium mt-1">{unit}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs font-medium text-gray-400 text-right flex items-center justify-end gap-1">
                  <Activity className="w-3 h-3" />
                  Recorded {data.latest_vitals.recorded_at} by {data.latest_vitals.recorded_by}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          {/* QR Code Section */}
          <Card variant="gradient" headerContent={
            <div>
               <h2 className="text-lg font-bold">Your Identity Card</h2>
               <p className="text-sm font-medium text-blue-100 mt-1">Show this QR to doctors & staff</p>
            </div>
          }>
            <div className="p-6 flex flex-col items-center">
              <PatientQRActions qrCodeUrl={data?.qr_code_url} patientId={data?.patient_id} />
              <div className="mt-4 py-2 px-6 bg-gray-50 rounded-lg border border-gray-200 w-full text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Patient ID</p>
                <p className="text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {data?.patient_id}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
