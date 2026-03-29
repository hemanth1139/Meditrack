"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { X, UserCheck } from "lucide-react";
import api from "@/lib/api";
import usePatients from "@/hooks/usePatients";

export default function AssignStaffModal({ isOpen, onClose, patientId }) {
  const { assignStaff, isAssigningStaff } = usePatients();
  const [selectedStaff, setSelectedStaff] = useState("");

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["hospitalStaff"],
    queryFn: async () => {
      const res = await api.get("/users/?role=STAFF");
      return res.data.data || [];
    },
    enabled: isOpen,
  });

  // Reset selection when opened
  useEffect(() => {
    if (isOpen) setSelectedStaff("");
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAssign = async () => {
    if (!selectedStaff) return;
    try {
      await assignStaff({ patientId, staff_id: selectedStaff });
      onClose();
    } catch (err) {
      // Error handled by hook toast
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <UserCheck className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Assign Staff Access</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <label className="block text-sm font-medium text-slate-700">Select Staff Member</label>
          <div className="mt-2">
            {isLoading ? (
              <div className="animate-pulse h-10 w-full rounded-lg bg-slate-100"></div>
            ) : staffList.length === 0 ? (
              <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3 text-sm text-yellow-800">
                No staff members found in your hospital.
              </div>
            ) : (
              <select
                className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
              >
                <option value="" disabled>Select a staff member...</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.first_name} {staff.last_name} ({staff.email})
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Assigning a staff member will grant them access to this patient&apos;s profile to record vitals.
          </p>
        </div>
        
        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-5 py-4">
          <Button onClick={onClose} variant="secondary" disabled={isAssigningStaff}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedStaff || isAssigningStaff}>
            {isAssigningStaff ? "Assigning..." : "Assign Access"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
