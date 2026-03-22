"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { Card } from "@/components/ui/card";
import RecordForm from "@/components/records/RecordForm";
import api from "@/lib/api";

export default function StaffNewRecordPage() {
  const [submitting, setSubmitting] = useState(false);

  const submit = async (values) => {
    try {
      setSubmitting(true);
      const payload = {
        patient_id: values.patient_id,
        record_type: values.record_type,
        visit_date: values.visit_date,
        diagnosis: values.diagnosis,
        notes: values.notes,
      };
      await api.post("/records/", payload);
      toast.success("Record submitted for approval");
    } catch (e) {
      const status = e?.response?.status;
      if (!status) toast.error("Connection error. Is the backend running?");
      else toast.error(e?.response?.data?.message || "Failed to submit record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[18px] font-semibold text-slate-900">Add Record</div>
        <div className="mt-2 text-[14px] text-slate-600">
          This record will be sent to the assigned doctor for approval.
        </div>
      </Card>

      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <RecordForm onSubmit={submit} submitting={submitting} showPendingInfo />
      </Card>
    </div>
  );
}

