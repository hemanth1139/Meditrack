"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import usePatients from "@/hooks/usePatients";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, Beaker, FileText, Pill, Calendar as CalendarIcon, UserPlus, FilePlus } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import AssignStaffModal from "./AssignStaffModal";
import dynamic from "next/dynamic";
const AddRecordModal = dynamic(() => import("./AddRecordModal"), { ssr: false });
const AddVitalsModal = dynamic(() => import("./AddVitalsModal"), { ssr: false });

export default function PatientProfile({ patientId, role }) {
  const { getPatientProfile } = usePatients();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patientProfile", patientId],
    queryFn: () => getPatientProfile(patientId),
    retry: 1,
  });

  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600 shadow-sm">
        <h3 className="text-lg font-semibold">Error Loading Profile</h3>
        <p className="mt-2 text-sm">You may not have permission to view this patient or they do not exist.</p>
      </div>
    );
  }

  const { patient, vitals, records } = data;
  
  // Categorize records for display
  const labReports = records.filter(r => r.record_type === "LAB");
  const prescriptions = records.flatMap(r => r.prescriptions || []);

  return (
    <div className="space-y-6">
      {/* Header / Basic Info */}
      <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-card">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h1 className="text-2xl font-bold tracking-tight">{patient.user || "Unknown Patient"}</h1>
              <p className="mt-1 text-blue-100 opacity-90">ID: {patient.patient_id} • Hospital: {patient.hospital}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {role === "DOCTOR" && (
                <>
                  <Button onClick={() => setAssignStaffOpen(true)} className="bg-white/10 text-white hover:bg-white/20 hover:text-white border-0">
                    <UserPlus size={16} className="mr-2" /> Assign Staff
                  </Button>
                  <Button onClick={() => setAddRecordOpen(true)} className="bg-white text-blue-600 hover:bg-slate-50">
                    <FilePlus size={16} className="mr-2" /> Add Record
                  </Button>
                </>
              )}
              {role === "STAFF" && (
                <Button onClick={() => setAddVitalsOpen(true)} className="bg-white text-blue-600 hover:bg-slate-50">
                  <Activity size={16} className="mr-2" /> Add Vitals
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
          <div>
            <div className="text-[13px] font-medium text-slate-500">Gender</div>
            <div className="mt-1 font-medium text-slate-900">{patient.gender || "—"}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-slate-500">Blood Group</div>
            <div className="mt-1 font-medium text-slate-900">{patient.blood_group || "—"}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-slate-500">Date of Birth</div>
            <div className="mt-1 font-medium text-slate-900">{patient.date_of_birth || "—"}</div>
          </div>
          <div>
            <div className="text-[13px] font-medium text-slate-500">Allergies</div>
            <div className="mt-1 font-medium text-red-600">{patient.known_allergies || "None reported"}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-8">
          
          {/* Medical History */}
          <Card className="rounded-2xl border-border bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="text-blue-500" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Medical History</h2>
            </div>
            
            <div className="space-y-4">
              {records.length ? records.map(record => (
                <div key={record.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flexItems-center gap-2">
                        <span className="font-semibold text-slate-900">{record.diagnosis || "No Diagnosis Provided"}</span>
                        <StatusBadge status={record.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{record.notes}</p>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <div>{formatDate(record.visit_date)}</div>
                      <div className="mt-1 text-xs">{record.record_type}</div>
                    </div>
                  </div>
                  
                  {record.follow_up_date && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                      <CalendarIcon size={14} />
                      <span className="font-medium">Follow-up:</span> {formatDate(record.follow_up_date)}
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-center py-8 text-slate-500">No medical records found.</div>
              )}
            </div>
          </Card>

          {/* Prescriptions */}
          {prescriptions.length > 0 && (
            <Card className="rounded-2xl border-border bg-white p-6 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="text-emerald-500" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Current Prescriptions</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {prescriptions.map((p, idx) => (
                  <div key={idx} className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                    <div className="font-semibold text-slate-900">{p.medicine_name}</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-600">
                      <div><span className="text-slate-400">Dosage:</span> <br/>{p.dosage}</div>
                      <div><span className="text-slate-400">Freq:</span> <br/>{p.frequency}</div>
                      <div className="col-span-2"><span className="text-slate-400">Duration:</span> {p.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-4">
          
          {/* Current Vitals */}
          <Card className="rounded-2xl border-border bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-rose-500" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Current Vitals</h2>
            </div>
            
            {vitals.length ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-500">Last recorded: {formatDate(vitals[0].recorded_at)}</div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="rounded-xl bg-slate-50 p-3">
                     <div className="text-xs text-slate-500">Blood Pressure</div>
                     <div className="mt-1 text-lg font-semibold text-slate-900">{vitals[0].blood_pressure}</div>
                   </div>
                   <div className="rounded-xl bg-slate-50 p-3">
                     <div className="text-xs text-slate-500">Heart Rate</div>
                     <div className="mt-1 text-lg font-semibold text-slate-900">{vitals[0].pulse} <span className="text-sm font-normal text-slate-500">bpm</span></div>
                   </div>
                   <div className="rounded-xl bg-slate-50 p-3">
                     <div className="text-xs text-slate-500">Temperature</div>
                     <div className="mt-1 text-lg font-semibold text-slate-900">{vitals[0].temperature}°F</div>
                   </div>
                   <div className="rounded-xl bg-slate-50 p-3">
                     <div className="text-xs text-slate-500">SpO2</div>
                     <div className="mt-1 text-lg font-semibold text-slate-900">{vitals[0].spo2}%</div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">No vitals recorded yet.</div>
            )}
          </Card>

          {/* Lab Tests */}
          <Card className="rounded-2xl border-border bg-white p-6 shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Beaker className="text-indigo-500" size={20} />
              <h2 className="text-lg font-semibold text-slate-900">Lab Reports</h2>
            </div>
            <div className="space-y-3">
              {labReports.length ? labReports.map(lab => (
                <div key={lab.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                   <div className="font-medium text-slate-800">{lab.diagnosis || "General Panel"}</div>
                   <div className="text-xs text-slate-500">{formatDate(lab.visit_date)}</div>
                </div>
              )) : (
                <div className="text-center py-4 text-slate-500">No lab reports.</div>
              )}
            </div>
          </Card>
          
        </div>
      </div>
      
      {/* Modals for Assign Staff, Add Record, Add Vitals */}
      <AssignStaffModal 
        isOpen={assignStaffOpen} 
        onClose={() => setAssignStaffOpen(false)} 
        patientId={patientId} 
      />
      <AddRecordModal 
        isOpen={addRecordOpen} 
        onClose={() => setAddRecordOpen(false)} 
        patientId={patientId} 
      />
      <AddVitalsModal 
        isOpen={addVitalsOpen} 
        onClose={() => setAddVitalsOpen(false)} 
        patientId={patientId} 
      />
    </div>
  );
}
