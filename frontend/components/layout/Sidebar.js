"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getRole, getUser, logout } from "@/lib/auth";
import { LayoutDashboard, FileText, Users, Building2, Shield, LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-md">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-white">
          <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" fill="currentColor" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-lg font-bold text-gray-900">MediTrack</div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Dashboard</div>
      </div>
    </div>
  );
}

const NAV = {
  PATIENT: [
    { label: "Dashboard", href: "/dashboard/patient/dashboard", icon: LayoutDashboard },
    { label: "My Records", href: "/dashboard/patient/records", icon: FileText },
    { label: "My QR Code", href: "/dashboard/patient/qr-code", icon: Shield },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/dashboard/doctor/dashboard", icon: LayoutDashboard },
    { label: "My Patients", href: "/dashboard/doctor/patients", icon: Users },
    { label: "Pending Approvals", href: "/dashboard/doctor/approvals", icon: FileText },
    { label: "Add Record", href: "/dashboard/doctor/records/new", icon: FileText },
  ],
  STAFF: [
    { label: "Dashboard", href: "/dashboard/staff/dashboard", icon: LayoutDashboard },
    { label: "Register Patient", href: "/dashboard/staff/patients/new", icon: Users },
    { label: "Add Record", href: "/dashboard/staff/records/new", icon: FileText },
  ],
  HOSPITAL_ADMIN: [
    { label: "Dashboard", href: "/dashboard/hospital-admin/dashboard", icon: LayoutDashboard },
    { label: "Doctors", href: "/dashboard/hospital-admin/doctors", icon: Users },
    { label: "Staff", href: "/dashboard/hospital-admin/staff", icon: Users },
    { label: "Patients", href: "/dashboard/hospital-admin/patients", icon: Users },
    { label: "Audit Logs", href: "/dashboard/hospital-admin/audit-logs", icon: FileText },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin/dashboard", icon: LayoutDashboard },
    { label: "Hospitals", href: "/dashboard/admin/hospitals", icon: Building2 },
    { label: "Doctor Approvals", href: "/dashboard/admin/doctors", icon: Users },
    { label: "Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: FileText },
    { label: "Hash Chain", href: "/dashboard/admin/integrity", icon: Shield },
  ],
};

export default function Sidebar({ mobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    setRole(getRole());
    setUser(getUser());
  }, []);

  const items = NAV[role] || [];
  const displayName = mounted && user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.full_name || "User" : "User";

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-100 bg-white",
          "md:translate-x-0 md:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-300 ease-in-out font-sans"
        )}
      >
        <div className="flex-shrink-0 px-6 py-6 flex justify-between items-center h-20">
          <Logo />
          {mobileOpen && (
             <button onClick={onCloseMobile} className="md:hidden text-gray-500 hover:text-gray-900 bg-gray-50 p-2 rounded-full">
               <X className="w-5 h-5"/>
             </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <nav className="flex flex-col gap-1.5">
            {mounted && items.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                    active
                      ? "bg-blue-50 text-blue-600 border-l-4 border-l-blue-600 pl-2"
                      : "text-gray-500 hover:bg-blue-50 hover:text-blue-600 mx-2 px-3"
                  )}
                >
                  <Icon className={cn("w-5 h-5", active ? "text-blue-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 p-4 pb-6">
          <div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 mb-4">
            <Avatar size="md" name={displayName} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-gray-900">{displayName}</div>
              <div className="truncate text-xs font-semibold text-gray-500">{role || "Loading..."}</div>
            </div>
          </div>
          <Button className="w-full justify-start rounded-xl text-gray-600 hover:text-red-700 hover:bg-red-50 bg-white border border-gray-200" variant="ghost" onClick={logout}>
            <LogOut className="mr-3 w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
