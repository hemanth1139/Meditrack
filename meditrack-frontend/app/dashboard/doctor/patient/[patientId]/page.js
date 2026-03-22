import PatientProfile from "@/components/patient/PatientProfile";

export default function DoctorPatientProfilePage({ params }) {
  const { patientId } = params;
  return <PatientProfile patientId={patientId} role="DOCTOR" />;
}
