"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import usePatients from "@/hooks/usePatients";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity, Beaker, FileText, Pill, Calendar as CalendarIcon, UserPlus, FilePlus, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import AssignStaffModal from "./AssignStaffModal";
import dynamic from "next/dynamic";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AddRecordModal = dynamic(() => import("./AddRecordModal"), { ssr: false });
const AddVitalsModal = dynamic(() => import("./AddVitalsModal"), { ssr: false });

const VISIT_ICONS = {
  CONSULTATION: "🩺",
  PRESCRIPTION: "💊",
  LAB_TEST: "🔬",
  SCAN: "🦴",
  PROCEDURE: "✂️",
  EMERGENCY: "🚑",
  FOLLOWUP: "📅",
};

export default function PatientProfile({ patientId, role }) {
  const { getPatientProfile } = usePatients();
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [expandedRecord, setExpandedRecord] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["patientProfile", patientId],
    queryFn: () => getPatientProfile(patientId),
    retry: 1,
  });

  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !data) return <ProfileError />;

  const { patient, vitals, records, documents, stats } = data;

  const renderTabNavigation = () => (
    <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 mb-6 max-w-2xl overflow-x-auto">
      {["OVERVIEW", "RECORDS", "VITALS", "DOCUMENTS"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
            activeTab === tab
              ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
          }`}
        >
          {tab.charAt(0) + tab.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header / Basic Info */}
      <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-card">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-white">
              <h1 className="text-2xl font-bold tracking-tight">{patient.user || "Patient Name"}</h1>
              <p className="mt-1 text-blue-100 opacity-90">ID: {patient.patient_id} • Hospital: {patient.hospital}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {role === "DOCTOR" && (
                <>
                  <Button onClick={() => setAssignStaffOpen(true)} className="bg-white/10 text-white hover:bg-white/20 border-0">
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
          <div><div className="text-[13px] font-medium text-slate-500">Gender</div><div className="mt-1 font-medium text-slate-900">{patient.gender || "—"}</div></div>
          <div><div className="text-[13px] font-medium text-slate-500">Blood Group</div><div className="mt-1 font-medium text-slate-900">{patient.blood_group || "—"}</div></div>
          <div><div className="text-[13px] font-medium text-slate-500">Date of Birth</div><div className="mt-1 font-medium text-slate-900">{patient.date_of_birth || "—"}</div></div>
          <div><div className="text-[13px] font-medium text-slate-500">Allergies</div><div className="mt-1 font-medium text-red-600">{patient.known_allergies || "None reported"}</div></div>
        </div>
      </Card>

      {renderTabNavigation()}

      {activeTab === "OVERVIEW" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card className="p-5 text-center bg-blue-50/50 border-blue-100">
              <div className="text-3xl font-bold text-blue-700">{stats?.total_visits || 0}</div>
              <div className="mt-1 text-xs font-semibold text-blue-600 uppercase tracking-wide">Total Visits</div>
            </Card>
            <Card className="p-5 text-center bg-emerald-50/50 border-emerald-100">
              <div className="text-3xl font-bold text-emerald-700">{stats?.active_prescriptions || 0}</div>
              <div className="mt-1 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Active Prescriptions</div>
            </Card>
            <Card className="p-5 text-center bg-amber-50/50 border-amber-100">
              <div className="text-3xl font-bold text-amber-700">{stats?.pending_labs || 0}</div>
              <div className="mt-1 text-xs font-semibold text-amber-600 uppercase tracking-wide">Pending Labs</div>
            </Card>
            <Card className="p-5 text-center bg-slate-50 border-slate-200">
              <div className="text-lg font-bold text-slate-700 mt-1">{stats?.last_visit ? formatDate(stats.last_visit) : "—"}</div>
              <div className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Visit</div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="text-blue-500" size={20}/> Recent Records</h3>
              <div className="space-y-3">
                {records?.slice(0, 3).map(r => (
                  <div key={r.id} className="flex justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 transition">
                    <div className="flex gap-3">
                      <div className="text-2xl">{VISIT_ICONS[r.visit_type] || "📄"}</div>
                      <div>
                        <div className="font-semibold text-slate-800">{r.visit_type.replace("_", " ")}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{r.diagnosis || r.chief_complaint?.substring(0,30) || "Routine check"}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-500 shrink-0">
                      <div className="font-medium text-slate-700 mb-1">{formatDate(r.visit_date)}</div>
                      <StatusBadge status={r.status} />
                    </div>
                  </div>
                ))}
                {!records?.length && <div className="text-center text-slate-500 py-4 text-sm font-medium">No records found.</div>}
              </div>
              {records?.length > 3 && (
                <button onClick={() => setActiveTab("RECORDS")} className="w-full mt-4 text-sm font-semibold text-blue-600 py-2 hover:bg-blue-50 rounded-lg transition">
                  View All {records.length} Records
                </button>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="text-rose-500" size={20}/> Latest Vitals</h3>
              {vitals?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1">Blood Pressure</div>
                    <div className="text-2xl font-bold text-slate-800">{vitals[0].blood_pressure}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1">Heart Rate</div>
                    <div className="text-2xl font-bold text-slate-800">{vitals[0].pulse} <span className="text-sm font-medium text-slate-500">bpm</span></div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1">Temperature</div>
                    <div className="text-2xl font-bold text-slate-800">{vitals[0].temperature}°F</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 mt-1">SpO2</div>
                    <div className="text-2xl font-bold text-slate-800">{vitals[0].spo2}%</div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8 text-sm font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50">No vitals recorded yet.</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "RECORDS" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {records?.length > 0 ? records.map((record) => (
            <Card key={record.id} className="overflow-hidden border border-slate-200">
              <div 
                className={`flex cursor-pointer items-center justify-between p-5 transition ${expandedRecord === record.id ? "bg-slate-50" : "hover:bg-slate-50/50"}`}
                onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100/80 text-2xl border border-slate-200/60 shadow-sm">
                    {VISIT_ICONS[record.visit_type] || "📄"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{record.visit_type.replace("_", " ")}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{record.diagnosis || record.chief_complaint || "No primary complaint specified"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-700 mb-1">{formatDate(record.visit_date)}</div>
                    <StatusBadge status={record.status} />
                  </div>
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    {expandedRecord === record.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                  </div>
                </div>
              </div>
              
              {expandedRecord === record.id && (
                <div className="border-t border-slate-200 bg-white p-6 text-sm">
                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    {record.chief_complaint && (
                      <div><strong className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Chief Complaint</strong> <p className="text-slate-800 font-medium">{record.chief_complaint}</p></div>
                    )}
                    {record.doctor_notes && (
                      <div><strong className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Doctor Notes</strong> <p className="text-slate-800 font-medium">{record.doctor_notes}</p></div>
                    )}
                    {record.tests_ordered?.length > 0 && (
                      <div><strong className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Tests Ordered</strong> <div className="flex flex-wrap gap-1.5">{record.tests_ordered.map(t=><span key={t} className="bg-slate-100 border border-slate-200 rounded-md px-2 py-1 text-[11px] font-bold text-slate-600">{t}</span>)}</div></div>
                    )}
                    {record.procedure_details && (
                      <div className="sm:col-span-2"><strong className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Procedure Details</strong> <p className="text-slate-800 font-medium">{record.procedure_details}</p></div>
                    )}
                  </div>

                  {record.prescriptions?.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <strong className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Pill size={18} className="text-emerald-500"/> Prescriptions</strong>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {record.prescriptions.map(p => (
                          <div key={p.id} className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 shadow-sm">
                            <div className="font-bold text-slate-800">{p.medicine_name}</div>
                            <div className="text-xs font-semibold text-slate-600 mt-1.5">{p.dosage} • <span className="text-emerald-600">{p.frequency}</span> • {p.duration_value} {p.duration_unit}</div>
                            {p.special_instructions && <div className="text-xs font-medium text-slate-500 mt-2 bg-white/60 p-2 rounded-md">&quot;{p.special_instructions}&quot;</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {record.documents?.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <strong className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-500"/> Attached Documents</strong>
                      <div className="flex flex-wrap gap-3">
                        {record.documents.map(d => (
                           <a key={d.id} href={d.cloudinary_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-sm">
                             <ExternalLink size={14} /> {d.label}
                           </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )) : (
            <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">No medical records found.</div>
          )}
        </div>
      )}

      {activeTab === "VITALS" && (
        <div className="space-y-6 animate-in fade-in duration-300">
           {vitals?.length > 0 ? (
             <>
              <Card className="p-6 border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="text-rose-500" size={20}/> Blood Pressure & Heart Rate Trends</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...vitals].reverse().map(v => ({ date: formatDate(v.recorded_at).split(',')[0], systolic: parseInt(v.blood_pressure.split('/')[0]), diastolic: parseInt(v.blood_pressure.split('/')[1]||0), hr: v.pulse }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{fontSize: 11, fill: "#94a3b8", fontWeight: 600}} axisLine={{stroke: "#e2e8f0"}} tickLine={false} dy={10} />
                      <YAxis tick={{fontSize: 11, fill: "#94a3b8", fontWeight: 600}} axisLine={{stroke: "#e2e8f0"}} tickLine={false} dx={-10} />
                      <Tooltip contentStyle={{borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", fontWeight: 600, fontSize: "12px"}} />
                      <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#fb923c" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                      <Line type="monotone" dataKey="hr" name="Heart Rate" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Date recorded</th>
                        <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Blood Pressure</th>
                        <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Heart Rate</th>
                        <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">Temperature</th>
                        <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider">SpO2</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {vitals.map(v => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4 font-bold text-slate-800">{formatDate(v.recorded_at)}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{v.blood_pressure}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{v.pulse} <span className="text-xs text-slate-400">bpm</span></td>
                          <td className="px-6 py-4 font-medium text-slate-600">{v.temperature}°F</td>
                          <td className="px-6 py-4 font-medium text-slate-600">{v.spo2}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
             </>
           ) : (
             <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">No vitals history found.</div>
           )}
        </div>
      )}

      {activeTab === "DOCUMENTS" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {documents?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map(doc => (
                 <Card key={doc.id} className="p-5 flex flex-col justify-between hover:shadow-lg transition outline outline-1 outline-transparent hover:outline-blue-200">
                    <div className="flex items-start gap-3">
                       <div className={`p-3.5 rounded-xl ${doc.file_type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                         <FileText size={28} strokeWidth={1.5} />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 line-clamp-2 leading-tight" title={doc.label}>{doc.label}</h4>
                         <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wide">{doc.doc_type.replace("_", " ")}</p>
                       </div>
                    </div>
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                       <span className="text-[11px] font-semibold text-slate-400">{formatDate(doc.uploaded_at).split(',')[0]}</span>
                       <a href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition">
                         Open <ExternalLink size={14} />
                       </a>
                    </div>
                 </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">No documents uploaded.</div>
          )}
        </div>
      )}

      <AssignStaffModal isOpen={assignStaffOpen} onClose={() => setAssignStaffOpen(false)} patientId={patientId} />
      <AddRecordModal isOpen={addRecordOpen} onClose={() => setAddRecordOpen(false)} patientId={patientId} />
      <AddVitalsModal isOpen={addVitalsOpen} onClose={() => setAddVitalsOpen(false)} patientId={patientId} />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-3xl" />
      <div className="flex gap-2 mb-6"><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-24" /></div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function ProfileError() {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-600 shadow-sm font-medium">
      <h3 className="text-lg font-bold">Error Loading Profile</h3>
      <p className="mt-2 text-sm">You may not have permission to view this patient or they do not exist.</p>
    </div>
  );
}
