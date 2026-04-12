"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRole, isAuthenticated } from "@/lib/auth";

export default function DashboardIndexPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }

    const role = getRole();
    switch (role) {
      case "ADMIN":
        router.replace("/dashboard/admin/dashboard");
        break;
      case "HOSPITAL_ADMIN":
        router.replace("/dashboard/hospital-admin/dashboard");
        break;
      case "DOCTOR":
        router.replace("/dashboard/doctor/dashboard");
        break;
      case "STAFF":
        router.replace("/dashboard/staff/dashboard");
        break;
      case "PATIENT":
        router.replace("/dashboard/patient/dashboard");
        break;
      default:
        router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
        <p className="font-medium animate-pulse">Initializing dashboard...</p>
      </div>
    </div>
  );
}
