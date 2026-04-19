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

export default function usePatients() {
  const qc = useQueryClient();

  const patientsQuery = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await api.get("/patients/");
      const payload = res.data.data;
      return Array.isArray(payload) ? payload : (payload?.data || []);
    },
  });

  const searchPatients = async (search) => {
    const res = await api.get("/patients/", { params: { search } });
    const payload = res.data.data;
    return Array.isArray(payload) ? payload : (payload?.data || []);
  };

  const getPatient = async (patientId) => {
    const res = await api.get(`/patients/${patientId}/`);
    return res.data.data;
  };

  const getPatientProfile = async (patientId) => {
    const res = await api.get(`/patients/${patientId}/profile/`);
    return res.data.data;
  };

  const createPatientMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/patients/", payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Patient created");
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onError: handleError,
  });

  const addVitalsMutation = useMutation({
    mutationFn: async ({ patientId, ...payload }) => {
      const res = await api.post(`/patients/${patientId}/add-vitals/`, payload);
      return res.data.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Vitals added successfully");
      qc.invalidateQueries({ queryKey: ["patientProfile", variables.patientId] });
      qc.invalidateQueries({ queryKey: ["dashboard", "staff"] });
    },
    onError: handleError,
  });

  const assignStaffMutation = useMutation({
    mutationFn: async ({ patientId, staff_id }) => {
      const res = await api.post(`/patients/${patientId}/assign-staff/`, { staff_id });
      return res.data; // this might just return success message
    },
    onSuccess: (_, variables) => {
      toast.success("Staff assigned successfully");
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patientProfile", variables.patientId] });
      qc.invalidateQueries({ queryKey: ["dashboard", "doctor"] });
    },
    onError: handleError,
  });

  const completeProfileMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/patients/complete-profile/", payload);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Profile completed successfully");
      qc.invalidateQueries({ queryKey: ["profileStatus"] });
      qc.invalidateQueries({ queryKey: ["patientProfile"] });
    },
    onError: handleError,
  });

  const completeAssignmentMutation = useMutation({
    mutationFn: async ({ patientId }) => {
      const res = await api.post(`/patients/${patientId}/complete-assignment/`);
      return res.data;
    },
    onSuccess: (_, variables) => {
      toast.success("Assignment completed! Doctor will review the record.");
      qc.invalidateQueries({ queryKey: ["staffDashboard"] });
      qc.invalidateQueries({ queryKey: ["patientProfile", variables.patientId] });
      qc.invalidateQueries({ queryKey: ["dashboard", "staff"] });
    },
    onError: handleError,
  });

  return {
    patients: patientsQuery.data || [],
    isLoading: patientsQuery.isLoading,
    isError: patientsQuery.isError,
    searchPatients,
    getPatient,
    getPatientProfile,
    createPatient: createPatientMutation.mutateAsync,
    addVitals: addVitalsMutation.mutateAsync,
    assignStaff: assignStaffMutation.mutateAsync,
    isAssigningStaff: assignStaffMutation.isPending,
    completeAssignment: completeAssignmentMutation.mutateAsync,
    isCompletingAssignment: completeAssignmentMutation.isPending,
    completeProfile: completeProfileMutation.mutateAsync,
    isCompletingProfile: completeProfileMutation.isPending,
  };
}

