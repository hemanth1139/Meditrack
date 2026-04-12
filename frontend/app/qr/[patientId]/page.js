"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getRole } from "@/lib/auth";

export default function QRRedirectPage({ params }) {
  const { patientId } = use(params);
  const router = useRouter();

  useEffect(() => {
    // If user is not logged in, save intent and redirect to login
    if (!isAuthenticated()) {
      sessionStorage.setItem("redirectAfterLogin", `/qr/${patientId}`);
      router.replace("/login");
      return;
    }

    // Role-based routing
    const role = getRole();
    if (role === "PATIENT") {
      router.replace("/dashboard/patient/dashboard");
    } else if (role === "DOCTOR") {
      router.replace(`/dashboard/doctor/patient/${patientId}`);
    } else if (role === "STAFF") {
      router.replace(`/dashboard/staff/patient/${patientId}`);
    } else if (role === "HOSPITAL_ADMIN") {
      router.replace(`/dashboard/hospital-admin/patients/${patientId}`);
    } else if (role === "ADMIN") {
      router.replace(`/dashboard/admin/users`);
    } else {
      router.replace("/dashboard");
    }
  }, [patientId, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="font-medium animate-pulse">Routing scanner protocol...</p>
      </div>
    </div>
  );
}
