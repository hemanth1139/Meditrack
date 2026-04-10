"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCheck } from "lucide-react";
import api from "@/lib/api";
import usePatients from "@/hooks/usePatients";

export default function AssignStaffModal({ isOpen, onClose, patientId }) {
  const { assignStaff, isAssigningStaff } = usePatients();
  const [selectedStaff, setSelectedStaff] = useState("");

  const { data: staffList = [], isLoading } = useQuery({
    queryKey: ["hospitalStaff"],
    queryFn: async () => {
      const res = await api.get("/users/?role=STAFF");
      const d = res.data.data;
      return Array.isArray(d) ? d : (d?.data || []);
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) setSelectedStaff("");
  }, [isOpen]);

  const handleAssign = async () => {
    if (!selectedStaff) return;
    try {
      await assignStaff({ patientId, staff_id: selectedStaff });
      onClose();
    } catch (err) {}
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Staff Access"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isAssigningStaff}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedStaff || isAssigningStaff} loading={isAssigningStaff}>
            Assign Access
          </Button>
        </>
      }
    >
      <div className="py-4 space-y-4">
        {isLoading ? (
          <div className="animate-pulse h-12 w-full rounded-xl bg-gray-100"></div>
        ) : staffList.length === 0 ? (
          <EmptyState icon={UserCheck} title="No Staff Found" description="There are no staff members registered in your hospital." />
        ) : (
          <div className="space-y-1.5 flex flex-col">
            <label className="text-sm font-semibold text-gray-900">Select Staff Member</label>
            <select
              className="flex h-12 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>
        )}
        <p className="text-sm text-gray-500">
          Assigning a staff member will grant them access to this patient&apos;s profile to record vitals.
        </p>
      </div>
    </Modal>
  );
}
