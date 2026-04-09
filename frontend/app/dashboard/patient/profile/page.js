import PatientProfile from "@/components/patient/PatientProfile";
import { serverFetch } from "@/lib/server-fetch";

export default async function PatientOwnProfilePage() {
  let profileData = null;
  let patientId = null;

  try {
    // 1. Get user's patient ID
    const res = await serverFetch("/patients/");
    if (res.data?.length > 0) {
      patientId = res.data[0].patient_id;
    }

    // 2. Fetch the profile details
    if (patientId) {
      const profileRes = await serverFetch(`/patients/${patientId}/profile/`);
      profileData = profileRes.data;
    }
  } catch (err) {
    console.error("Failed to load patient profile:", err);
  }

  if (!patientId || !profileData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Profile Not Found</h2>
        <p className="mt-2 text-slate-500 text-sm">Please complete your registration or contact the hospital administration.</p>
      </div>
    );
  }

  return <PatientProfile patientId={patientId} role="PATIENT" initialData={profileData} />;
}
