"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import StaffDashboardActions from "@/components/interactable/StaffDashboardActions";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getGreeting, formatDate } from "@/lib/utils";
import { Users, Activity, Building2 } from "lucide-react";

export default function StaffDashboardPage() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [res, meRes] = await Promise.all([
          api.get("/dashboard/staff/stats/"),
          api.get("/auth/me/"),
        ]);
        setData(res.data?.data || res.data);
        setUser(meRes.data?.data || meRes.data);
      } catch (err) {
        setError("Failed to load dashboard. Please refresh.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const firstName = user?.first_name || user?.username || "Staff";
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
        <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {firstName} 👋</h1>
        <div className="flex items-center gap-2 mt-1.5">
          <p className="text-sm text-gray-400 font-medium">{formatDate(today)}</p>
          <span className="text-gray-300">•</span>
          <p className="text-sm text-blue-500 font-semibold">{data?.hospital_name}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard icon={Users} label="Assigned Patients" value={data?.assigned_patients_count} color="blue" />
        <StatCard icon={Activity} label="Vitals Recorded Today" value={data?.vitals_today} color="green" />
        <StatCard icon={Building2} label="My Hospital" value={data?.hospital_name} color="amber" />
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <StaffDashboardActions />
      </Card>

      {/* Assigned Patients */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">My Assigned Patients</h2>
        </div>

        {!data?.patients?.length ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-medium">No patients assigned yet</p>
            <p className="text-xs mt-1">Ask a doctor to assign you to a patient</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-gray-50">
            {data.patients.map((p) => (
              <Card key={p.patient_id} variant="hoverable" className="p-5 flex flex-col gap-4">
                <div className="flex gap-4">
                  <Avatar name={p.name || "Patient"} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 text-sm truncate">{p.name || "Unknown Patient"}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400 font-mono tracking-wider">{p.patient_id}</span>
                      <Badge variant="red">{p.blood_group}</Badge>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Last Vitals</p>
                  <p className="text-sm font-semibold text-gray-800">{p.last_vitals_date || "Not recorded yet"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Link
                    href={`/dashboard/staff/patients/${p.patient_id}`}
                    className="flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/staff/patients/${p.patient_id}?tab=vitals`}
                    className="flex items-center justify-center rounded-xl bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    Add Vitals
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
