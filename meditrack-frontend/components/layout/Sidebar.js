"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import StatusBadge from "@/components/shared/StatusBadge";
import { getRole, getUser, logout } from "@/lib/auth";

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z"
            fill="#2563EB"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-[16px] font-medium text-slate-900">MediTrack</div>
        <div className="text-[13px] font-medium text-slate-500">Dashboard</div>
      </div>
    </div>
  );
}

const ICONS = {
  Dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 4h7v9H4V4zm9 0h7v5h-7V4zM13 11h7v9h-7v-9zM4 15h7v5H4v-5z" fill="#64748B" />
    </svg>
  ),
  Records: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="#64748B" strokeWidth="2" />
      <path d="M9 8h8M9 12h8M9 16h6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z" stroke="#64748B" strokeWidth="2" />
      <path d="M4 20a8 8 0 0 1 16 0" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Building: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 22V2h12v20" stroke="#64748B" strokeWidth="2" />
      <path d="M9 6h2M9 10h2M9 14h2M13 6h2M13 10h2M13 14h2" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  Shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 20 6v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z" stroke="#64748B" strokeWidth="2" />
    </svg>
  ),
};

const NAV = {
  PATIENT: [
    { label: "Dashboard", href: "/dashboard/patient/dashboard", icon: ICONS.Dashboard },
    { label: "My Records", href: "/dashboard/patient/records", icon: ICONS.Records },
    { label: "My QR Code", href: "/dashboard/patient/qr-code", icon: ICONS.Shield },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/dashboard/doctor/dashboard", icon: ICONS.Dashboard },
    { label: "My Patients", href: "/dashboard/doctor/patients", icon: ICONS.Users },
    { label: "Pending Approvals", href: "/dashboard/doctor/approvals", badge: "PENDING", icon: ICONS.Records },
    { label: "Add Record", href: "/dashboard/doctor/records/new", icon: ICONS.Records },
  ],
  STAFF: [
    { label: "Dashboard", href: "/dashboard/staff", icon: ICONS.Dashboard },
    { label: "Register Patient", href: "/dashboard/staff/patients/new", icon: ICONS.Users },
    { label: "Add Record", href: "/dashboard/staff/records/new", icon: ICONS.Records },
  ],
  HOSPITAL_ADMIN: [
    { label: "Dashboard", href: "/dashboard/hospital-admin/dashboard", icon: ICONS.Dashboard },
    { label: "Doctors", href: "/dashboard/hospital-admin/doctors", icon: ICONS.Users },
    { label: "Staff", href: "/dashboard/hospital-admin/staff", icon: ICONS.Users },
    { label: "Patients", href: "/dashboard/hospital-admin/patients", icon: ICONS.Users },
    { label: "Audit Logs", href: "/dashboard/hospital-admin/audit-logs", icon: ICONS.Records },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin/dashboard", icon: ICONS.Dashboard },
    { label: "Hospitals", href: "/dashboard/admin/hospitals", icon: ICONS.Building },
    { label: "Doctor Approvals", href: "/dashboard/admin/doctors", badge: "PENDING", icon: ICONS.Users },
    { label: "Users", href: "/dashboard/admin/users", icon: ICONS.Users },
    { label: "Audit Logs", href: "/dashboard/admin/audit-logs", icon: ICONS.Records },
    { label: "Hash Chain Verifier", href: "/dashboard/admin/integrity", icon: ICONS.Shield },
  ],
};

export default function Sidebar({
  pendingApprovalsCount,
  pendingDoctorCount,
  mobileOpen,
  onCloseMobile,
}) {
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

  const getCount = (href) => {
    if (href.includes("/doctor/approvals")) return pendingApprovalsCount || 0;
    if (href.includes("/admin/doctors")) return pendingDoctorCount || 0;
    return 0;
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          aria-label="Close menu"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen w-[240px] flex-col border-r border-border bg-white shadow-lg",
          "md:translate-x-0 md:shadow-none md:transition-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-300 ease-in-out",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="flex-shrink-0 px-6 py-5 border-b border-border">
          <Logo />
        </div>

        {/* Nav — scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
          <nav suppressHydrationWarning className="flex flex-col gap-1">
            {mounted ? (
              items.map((item) => {
                const active = pathname === item.href;
                const count = getCount(item.href);
                const activeCls = active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900";
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={[
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-[14px] transition-colors",
                      activeCls,
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className={`flex h-[18px] w-[18px] items-center justify-center flex-shrink-0 ${active ? "[&_path]:fill-blue-600 [&_path]:stroke-blue-600" : ""}`}>
                        {item.icon || null}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge ? (
                      <span className="flex items-center gap-1.5 ml-1 flex-shrink-0">
                        {count ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[12px] font-semibold text-blue-700">
                            {count}
                          </span>
                        ) : null}
                        {!count && <StatusBadge status={item.badge} />}
                      </span>
                    ) : null}
                  </Link>
                );
              })
            ) : null}
          </nav>
        </div>

        {/* User card + Logout */}
        <div className="flex-shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 mb-3">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-[13px] font-semibold">
                {(user?.first_name?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-slate-900">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "User"}
              </div>
              <div className="mt-0.5">
                <span className="rounded-full bg-blue-100 px-2 py-px text-[11px] font-semibold text-blue-700">
                  {role || "—"}
                </span>
              </div>
            </div>
          </div>
          <Button className="w-full" variant="secondary" onClick={logout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mr-2 flex-shrink-0">
              <path d="M10 17l-1.5 1.5L3 13l5.5-5.5L10 9" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13h11" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
              <path d="M14 21h6V3h-6" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}

