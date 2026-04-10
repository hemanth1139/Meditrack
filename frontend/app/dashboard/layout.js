"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import RoleGuard from "@/components/shared/RoleGuard";
import { getRole, isAuthenticated } from "@/lib/auth";

import api from "@/lib/api";
const ROLE_HOME = {
  PATIENT: "/dashboard/patient/dashboard",
  DOCTOR: "/dashboard/doctor/dashboard",
  STAFF: "/dashboard/staff/dashboard",
  HOSPITAL_ADMIN: "/dashboard/hospital-admin/dashboard",
  ADMIN: "/dashboard/admin/dashboard",
};

const TITLES = [
  { prefix: "/dashboard/patient/dashboard", title: "Patient Dashboard" },
  { prefix: "/dashboard/patient/records", title: "My Medical Records" },
  { prefix: "/dashboard/patient/qr-code", title: "My QR Code" },
  { prefix: "/dashboard/doctor/dashboard", title: "Doctor Dashboard" },
  { prefix: "/dashboard/doctor/patients", title: "My Patients" },
  { prefix: "/dashboard/doctor/approvals", title: "Pending Approvals" },
  { prefix: "/dashboard/doctor/records/new", title: "Add Medical Record" },
  { prefix: "/dashboard/staff/dashboard", title: "Staff Dashboard" },
  { prefix: "/dashboard/staff/patients/new", title: "Register Patient" },
  { prefix: "/dashboard/staff/records/new", title: "Add Record" },
  { prefix: "/dashboard/admin/dashboard", title: "Admin Dashboard" },
  { prefix: "/dashboard/admin/hospitals", title: "Hospitals" },
  { prefix: "/dashboard/admin/doctors", title: "Doctor Approvals" },
  { prefix: "/dashboard/admin/users", title: "Users" },
  { prefix: "/dashboard/admin/audit-logs", title: "Audit Logs" },
  { prefix: "/dashboard/admin/integrity", title: "Hash Chain Verifier" },
  { prefix: "/dashboard/hospital-admin/dashboard", title: "Hospital Admin Dashboard" },
  { prefix: "/dashboard/hospital-admin/doctors", title: "Hospital Admin Doctors" },
  { prefix: "/dashboard/hospital-admin/staff", title: "Hospital Admin Staff" },
  { prefix: "/dashboard/hospital-admin/patients", title: "Hospital Admin Patients" },
  { prefix: "/dashboard/hospital-admin/audit-logs", title: "Hospital Admin Audit Logs" },
];

function getTitle(pathname) {
  const match = TITLES.find((t) => pathname.startsWith(t.prefix));
  return match ? match.title : "Dashboard";
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    const role = getRole();
    setUserRole(role);
    const home = ROLE_HOME[role];
    if (pathname === "/dashboard" || pathname === "/dashboard/") {
      router.replace(home || "/login");
      return;
    }
  }, [router, pathname]);

  const title = useMemo(() => getTitle(pathname), [pathname]);

  return (
    <RoleGuard>
      <div className="min-h-screen bg-background overflow-x-hidden">
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <div className="min-h-screen md:ml-[240px] overflow-x-hidden">
          <Topbar
            title={title}
            breadcrumb="MediTrack"
            onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
          />
          <main className="p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
        </div>
      </div>
    </RoleGuard>
  );
}

