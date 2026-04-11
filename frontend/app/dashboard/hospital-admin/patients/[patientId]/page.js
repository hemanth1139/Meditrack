"use client";

import PatientProfile from "@/components/patient/PatientProfile";
import { use } from "react";

export default function HospitalAdminPatientProfilePage({ params }) {
  const { patientId } = use(params);
  return <PatientProfile patientId={patientId} role="HOSPITAL_ADMIN" initialData={null} />;
}
