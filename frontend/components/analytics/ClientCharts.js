"use client";

import dynamic from "next/dynamic";

export const MonthlyActivityChart = dynamic(
  () => import("./MonthlyActivityChart"),
  { ssr: false }
);

export const DiagnosisChart = dynamic(
  () => import("./DiagnosisChart"),
  { ssr: false }
);

export const DoctorPatientChart = dynamic(
  () => import("./DoctorPatientChart"),
  { ssr: false }
);
