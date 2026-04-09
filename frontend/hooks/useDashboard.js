"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const ROLE_PATHS = {
  admin: "/dashboard/admin/stats/",
  "hospital-admin": "/dashboard/hospital-admin/stats/",
  doctor: "/dashboard/doctor/stats/",
  staff: "/dashboard/staff/stats/",
  patient: "/dashboard/patient/stats/",
};

export default function useDashboard(role) {
  const path = ROLE_PATHS[role];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", role],
    queryFn: async () => {
      const res = await api.get(path);
      return res.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — matches backend cache TTL
    enabled: !!path,
    retry: 1,
  });

  return { data: data || null, isLoading, error, refetch };
}
