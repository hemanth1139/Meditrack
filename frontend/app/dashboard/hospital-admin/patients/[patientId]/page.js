import PatientProfile from "@/components/patient/PatientProfile";
import { serverFetch } from "@/lib/server-fetch";

export default async function HospitalAdminPatientProfilePage({ params }) {
  const { patientId } = await params;
  let profileData = null;

  try {
    const res = await serverFetch(`/patients/${patientId}/profile/`);
    profileData = res.data;
  } catch (err) {
    console.error("Failed to fetch profile", err);
  }

  if (!profileData) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600 shadow-sm font-medium">
        <h3 className="text-lg font-bold">Error Loading Profile</h3>
        <p className="mt-2 text-sm">You may not have permission to view this patient or they do not exist.</p>
      </div>
    );
  }

  return <PatientProfile patientId={patientId} role="HOSPITAL_ADMIN" initialData={profileData} />;
}
