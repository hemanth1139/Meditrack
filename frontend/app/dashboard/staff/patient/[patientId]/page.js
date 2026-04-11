"use client";

import PatientProfile from "@/components/patient/PatientProfile";
import { use } from "react";

export default function StaffPatientProfilePage({ params }) {
  const { patientId } = use(params);
  return <PatientProfile patientId={patientId} role="STAFF" initialData={null} />;
}
