"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import AdminApprovalTable from "@/components/interactable/AdminApprovalTable";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Building2, Users, Clock, Building } from "lucide-react";
import { getGreeting, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/dashboard/admin/stats/");
        setData(res.data?.data || res.data);
      } catch (err) {
        setError("Failed to load dashboard. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date().toISOString();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm font-medium">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, Site Admin 👋</h1>
        <p className="text-sm text-gray-400 font-medium mt-1.5">{formatDate(today)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={Building2} label="Total Hospitals" value={data?.total_hospitals} color="blue" />
        <StatCard icon={Users} label="Total Users" value={data?.total_users} color="green" />
        <StatCard icon={Clock} label="Pending Doctor Approvals" value={data?.pending_approvals} color="amber" />
      </div>

      {/* Recent Hospitals */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
          <h2 className="text-base font-semibold text-gray-800">Recent Hospitals</h2>
          <Link href="/dashboard/admin/hospitals" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          {!data?.recent_hospitals?.length ? (
            <EmptyState icon={Building} title="No hospitals registered" description="When new hospitals are added, they will appear here." />
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hospital Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.recent_hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{h.name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{h.city}</td>
                    <td className="px-6 py-4">
                      <Badge variant={h.active ? "green" : "red"}>{h.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-500 text-right">{h.created_at || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Pending Doctor Approvals */}
      <div className="mt-6">
        <AdminApprovalTable pendingDoctors={data?.pending_doctors} />
      </div>
    </div>
  );
}
