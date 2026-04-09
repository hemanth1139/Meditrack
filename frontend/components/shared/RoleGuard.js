"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRole, isAuthenticated } from "@/lib/auth";

const ROLE_HOME = {
  PATIENT: "/dashboard/patient/dashboard",
  DOCTOR: "/dashboard/doctor/dashboard",
  STAFF: "/dashboard/staff/dashboard",
  HOSPITAL_ADMIN: "/dashboard/hospital-admin/dashboard",
  ADMIN: "/dashboard/admin/dashboard",
};

const ROLE_SEG = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  STAFF: "staff",
  HOSPITAL_ADMIN: "hospital-admin",
  ADMIN: "admin",
};

export default function RoleGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const role = getRole();
    const home = ROLE_HOME[role] || "/login";

    if (pathname.startsWith("/dashboard/")) {
      const seg = pathname.split("/")[2];
      const wantedSeg = ROLE_SEG[role] || "";
      if (seg && wantedSeg && seg !== wantedSeg) {
        router.replace(home);
      }
    }
  }, [router, pathname]);

  return children;
}

