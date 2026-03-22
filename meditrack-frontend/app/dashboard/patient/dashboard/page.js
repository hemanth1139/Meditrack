"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

import StatsCard from "@/components/analytics/StatsCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCardSkeleton, ListSkeleton } from "@/components/shared/SkeletonDashboard";
import useRecords from "@/hooks/useRecords";
import { getUser } from "@/lib/auth";
import { formatDate, getGreeting } from "@/lib/utils";
import RecordCard from "@/components/records/RecordCard";

export default function PatientDashboardPage() {
  const user = getUser();
  const { records, isLoading } = useRecords();
  const [mounted, setMounted] = useState(false);
  const [todayText, setTodayText] = useState("—");
  const [greetingText, setGreetingText] = useState("Hello");

  useEffect(() => {
    setMounted(true);
    setTodayText(formatDate(new Date().toISOString()));
    setGreetingText(getGreeting());
  }, []);

  const approved = (records || []).filter((r) => r.status === "APPROVED");
  const recent = approved.slice(0, 5);
  const lastVisit = approved[0]?.visit_date;

  const exportPdf = async () => {
    try {
      // Backend expects patient_id in URL; patient_id is not stored in cookie by default in this frontend.
      toast.error("PDF export needs patient ID from profile. Use My QR Code page for now.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[24px] font-semibold text-slate-900">
          {mounted ? `${greetingText}, ${user?.first_name || "Patient"}` : `Hello, ${user?.first_name || "Patient"}`}
        </div>
        <div className="mt-2 text-[14px] text-slate-600">
          Today is {mounted ? todayText : "—"}
        </div>
      </Card>

      {isLoading ? (
        <>
          <StatsCardSkeleton count={4} />
          <ListSkeleton rows={3} />
        </>
      ) : (<>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Records"
          value={isLoading ? "—" : String(approved.length)}
          color="blue"
          icon={<span className="text-[14px] font-medium">R</span>}
        />
        <StatsCard
          title="Last Visit"
          value={isLoading ? "—" : lastVisit ? formatDate(lastVisit) : "—"}
          color="slate"
          icon={<span className="text-[14px] font-medium">D</span>}
        />
        <StatsCard
          title="Blood Group"
          value={"—"}
          color="slate"
          icon={<span className="text-[14px] font-medium">B</span>}
        />
        <StatsCard
          title="Home Hospital"
          value={"—"}
          color="slate"
          icon={<span className="text-[14px] font-medium">H</span>}
        />
      </div>

      <div className="space-y-3">
        <div className="text-[18px] font-semibold text-slate-900">Recent Records</div>
        {isLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : recent.length ? (
          <div className="grid gap-3">
            {recent.map((r) => (
              <RecordCard key={r.id} record={r} />
            ))}
          </div>
        ) : (
          <Card className="rounded-lg border-border bg-white p-6 shadow-card">
            <div className="text-[14px] text-slate-600">No approved records yet.</div>
          </Card>
        )}
      </div>
      </>)}

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/dashboard/patient/records">View All Records</Link>
        </Button>
        <Button variant="secondary" onClick={exportPdf}>
          Download Full Report
        </Button>
        <Button asChild>
          <Link href="/dashboard/patient/qr-code">View QR Code</Link>
        </Button>
      </div>
    </div>
  );
}

