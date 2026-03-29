"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PatientProfile from "@/components/patient/PatientProfile";
import api from "@/lib/api";
import useAuth from "@/hooks/useAuth";

export default function PatientOwnProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  // Use React Query to fetch the patient profile listing and get the patient ID
  const { data: patientId, isLoading: idLoading } = useQuery({
    queryKey: ["myPatientId"],
    queryFn: async () => {
      const res = await api.get("/patients/");
      if (res.data?.data?.length > 0) {
        return res.data.data[0].patient_id;
      }
      return null;
    },
    enabled: !!user && user.role === "PATIENT",
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "PATIENT")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || idLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (!patientId) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Profile Not Found</h2>
        <p className="mt-2 text-slate-500 text-sm">Please complete your registration or contact the hospital administration.</p>
      </div>
    );
  }

  return <PatientProfile patientId={patientId} role="PATIENT" />;
}
