"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "@/lib/api";

const handleError = (e) => {
  const status = e?.response?.status;
  if (!status) return toast.error("Connection error. Is the backend running?");
  if (status === 403) return toast.error("You don't have permission to do this");
  if (status === 404) return toast.error("Not found");
  toast.error("Something went wrong. Please try again.");
};

export default function useRecords(params = {}) {
  const qc = useQueryClient();

  const recordsQuery = useQuery({
    queryKey: ["records", params],
    queryFn: async () => {
      const res = await api.get("/records/", { params });
      return res.data.data || [];
    },
  });

  const createRecordMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/records/", payload);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Record created");
      qc.invalidateQueries({ queryKey: ["records"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      if (variables.patient_id) {
        qc.invalidateQueries({ queryKey: ["patientProfile", variables.patient_id] });
      }
    },
    onError: handleError,
  });

  const approveRecord = useMutation({
    mutationFn: async (id) => {
      const res = await api.post(`/records/${id}/approve/`);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Record approved");
      qc.invalidateQueries({ queryKey: ["records"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: handleError,
  });

  const rejectRecord = useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api.post(`/records/${id}/reject/`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Record rejected");
      qc.invalidateQueries({ queryKey: ["records"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: handleError,
  });

  const flagRecord = useMutation({
    mutationFn: async ({ id, reason }) => {
      const res = await api.post(`/records/${id}/flag/`, { reason });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Record flagged");
      qc.invalidateQueries({ queryKey: ["records"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: handleError,
  });

  return {
    records: recordsQuery.data || [],
    isLoading: recordsQuery.isLoading,
    createRecord: createRecordMutation.mutateAsync,
    approveRecord: approveRecord.mutateAsync,
    rejectRecord: rejectRecord.mutateAsync,
    flagRecord: flagRecord.mutateAsync,
  };
}

