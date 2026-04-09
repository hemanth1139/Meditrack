"use client";

import { useEffect, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logout, getUser } from "@/lib/auth";

export default function Topbar({ title, breadcrumb, onToggleSidebar }) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (title) document.title = `${title} — MediTrack`;
  }, [title]);
  return (
    <div className="flex h-16 items-center justify-between border-b border-border bg-white px-4 md:px-6 gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-white text-slate-700 hover:bg-slate-50 md:hidden"
            aria-label="Open menu"
            onClick={onToggleSidebar}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="min-w-0">
            <div className="truncate text-[18px] font-semibold text-slate-900 md:text-[22px]">{title}</div>
            {breadcrumb ? <div className="hidden truncate text-[13px] font-medium text-slate-500 sm:block">{breadcrumb}</div> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-white px-2 py-1 shadow-card">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-[13px] font-semibold">
                  {mounted ? (user?.first_name?.[0] || "U").toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden max-w-[140px] truncate text-[13px] font-medium text-slate-900 sm:block">
                {mounted ? (
                  [user?.first_name, user?.last_name]
                    .filter(Boolean)
                    .join(" ") ||
                  user?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User"
                ) : (
                  "User"
                )}
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-lg">
            <DropdownMenuItem className="text-[14px]">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-[14px]" onClick={logout}>
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

