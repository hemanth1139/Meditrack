"use client";

import PatientProfile from "@/components/patient/PatientProfile";
import { use } from "react";

export default function DoctorPatientProfilePage({ params }) {
  const { patientId } = use(params);
  return <PatientProfile patientId={patientId} role="DOCTOR" initialData={null} />;
}
