"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { getUser } from "@/lib/auth";
import QRCodeDisplay from "@/components/patient/QRCodeDisplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientQrCodePage() {
  const user = getUser();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        let patientId = user?.patient_id || user?.patient?.patient_id;
        let loadedPatient = null;

        // If user is a PATIENT and patient_id is missing, fetch their own profile from /patients/.
        if (!patientId && user?.role === "PATIENT") {
          const listRes = await api.get("/patients/");
          const rawData = listRes?.data?.data;
          const listPatients = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          if (Array.isArray(listPatients) && listPatients.length > 0) {
            const ownPatient = listPatients[0];
            patientId = ownPatient.patient_id;
            loadedPatient = ownPatient;
          }
        }

        if (!patientId) {
          toast.error("Patient ID is not available in your account.");
          setPatient(null);
          return;
        }

        if (!loadedPatient) {
          const res = await api.get(`/patients/${patientId}/`);
          loadedPatient = res.data.data || null;
        }

        setPatient(loadedPatient);
      } catch (e) {
        toast.error("Unable to load patient profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.patient_id, user?.patient?.patient_id, user?.role]);

  const downloadPdf = async () => {
    if (!patient?.patient_id) return toast.error("Patient ID not available");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // We use the base API url but strip `/api` from the end to access the main site endpoints if necessary
    // But since the url requires `/api/patients/...` we can just use NEXT_PUBLIC_API_URL.
    window.open(`${apiBaseUrl}/patients/${patient.patient_id}/export-pdf/`, "_blank");
  };

  if (loading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[14px] text-slate-600">Patient profile not found.</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[24px] font-semibold text-slate-900">My QR Code</div>
        <div className="mt-1 text-[14px] text-slate-600">
          This QR encodes your unique patient ID.
        </div>
      </div>

      <QRCodeDisplay
        value={patient.patient_id}
        patient={{
          name: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
          patient_id: patient.patient_id,
          blood_group: patient.blood_group,
          hospital_name: patient.hospital || "—",
        }}
      />

      <div className="flex justify-center">
        <Button variant="secondary" onClick={downloadPdf}>
          Download Full Report
        </Button>
      </div>
    </div>
  );
}

