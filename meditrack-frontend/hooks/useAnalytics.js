"use client";

import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";

const handleError = (e) => {
  const status = e?.response?.status;
  if (!status) return toast.error("Connection error. Is the backend running?");
  if (status === 403) return toast.error("You don't have permission to do this");
  toast.error("Something went wrong. Please try again.");
};

export default function useAnalytics() {
  const hospitalQuery = useQuery({
    queryKey: ["analytics", "hospital"],
    queryFn: async () => {
      const res = await api.get("/analytics/hospital/");
      return res.data.data;
    },
  });

  const doctorQuery = useQuery({
    queryKey: ["analytics", "doctor"],
    queryFn: async () => {
      const res = await api.get("/analytics/doctor/");
      return res.data.data;
    },
  });

  return {
    hospitalStats: hospitalQuery.data,
    doctorStats: doctorQuery.data,
    isLoading: hospitalQuery.isLoading || doctorQuery.isLoading,
  };
}

