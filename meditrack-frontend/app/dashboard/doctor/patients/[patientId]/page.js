"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RecordTimeline from "@/components/patient/RecordTimeline";
import OTPConsentModal from "@/components/doctor/OTPConsentModal";

export default function DoctorPatientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.patientId;
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [otpOpen, setOtpOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const pRes = await api.get(`/patients/${patientId}/`);
      setPatient(pRes.data.data);
      const rRes = await api.get("/records/");
      setRecords((rRes.data.data || []).filter((r) => r.patient_id === patientId || r.patient?.patient_id === patientId));
    } catch (e) {
      const status = e?.response?.status;
      if (status === 403) {
        setUnlocked(false);
      } else {
        toast.error("Unable to load patient");
      }
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    load();
  }, [load]);

  const flagRecord = async (record) => {
    const reason = window.prompt("Reason for flagging this record?");
    if (!reason) return;
    try {
      await api.post(`/records/${record.id}/flag/`, { reason });
      toast.success("Record flagged");
      load();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[14px] text-slate-600">Patient not found.</div>
      </Card>
    );
  }

  const crossHospital = false; // backend doesn't expose home hospital name in patient detail consistently

  return (
    <div className="space-y-6">
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[24px] font-semibold text-slate-900">{patient.user || patient.patient_id}</div>
            <div className="mt-2 text-[14px] text-slate-600">
              Patient ID: <span className="font-medium text-slate-900">{patient.patient_id}</span>
            </div>
            <div className="mt-1 text-[14px] text-slate-600">
              Blood group: <span className="font-medium text-slate-900">{patient.blood_group}</span>
            </div>
            <div className="mt-1 text-[14px] text-slate-600">
              Emergency contact: <span className="font-medium text-slate-900">{patient.emergency_contact_phone}</span>
            </div>
          </div>
          <Button onClick={() => router.push(`/dashboard/doctor/records/new?patientId=${patient.patient_id}`)}>
            Add New Record
          </Button>
        </div>
      </Card>

      {crossHospital && !unlocked ? (
        <Card className="rounded-lg border-border bg-white p-4 shadow-card">
          <div className="rounded-lg border border-border bg-primary/5 p-3 text-[14px] text-slate-700">
            This patient is from a different hospital. OTP consent required to view clinical records.
          </div>
          <div className="mt-3">
            <Button onClick={() => setOtpOpen(true)}>Request Access</Button>
          </div>
        </Card>
      ) : null}

      <div className="space-y-3">
        <div className="text-[18px] font-semibold text-slate-900">Approved Records</div>
        {records.length ? (
          <RecordTimeline records={records.filter((r) => r.status === "APPROVED")} onFlag={flagRecord} />
        ) : (
          <Card className="rounded-lg border-border bg-white p-6 shadow-card">
            <div className="text-[14px] text-slate-600">No records available.</div>
          </Card>
        )}
      </div>

      <OTPConsentModal
        open={otpOpen}
        onOpenChange={setOtpOpen}
        patientId={patient.patient_id}
        patientName={patient.user || patient.patient_id}
        homeHospital={patient.hospital}
      />
    </div>
  );
}

