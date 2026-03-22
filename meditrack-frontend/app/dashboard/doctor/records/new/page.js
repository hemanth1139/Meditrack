"use client";
import { Suspense } from "react";
import DoctorNewRecordClient from "./pageClient";

export const dynamic = "force-dynamic";

export default function DoctorNewRecordPage() {
  return (
    <Suspense>
      <DoctorNewRecordClient />
    </Suspense>
  );
}


