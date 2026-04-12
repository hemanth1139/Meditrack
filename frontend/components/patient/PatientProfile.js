"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Activity, FileText, Pill, AlertTriangle, Phone, Calendar, UserPlus, Info, ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import AssignStaffModal from "./AssignStaffModal";

const AddRecordModal = dynamic(() => import("./AddRecordModal"), { ssr: false });
const AddVitalsModal = dynamic(() => import("./AddVitalsModal"), { ssr: false });

const VISIT_ICONS = {
  CONSULTATION: "🩺",
  LAB_DIAGNOSTICS: "🔬",
  PROCEDURE_EMERGENCY: "🏥",
};

export default function PatientProfile({ patientId: initialPatientId, role, initialData }) {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [profileData, setProfileData] = useState(initialData);
  const [loadingProfile, setLoadingProfile] = useState(!initialData);
  const [profileError, setProfileError] = useState(false);

  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);

  useEffect(() => {
    if (initialData) return; // Already have data, skip fetching

    const fetchProfile = async () => {
      try {
        let pid = initialPatientId;

        // If no patientId given (patient's own profile page), resolve it first
        if (!pid) {
          const listRes = await api.get("/patients/");
          const list = listRes.data?.data || listRes.data || [];
          pid = list[0]?.patient_id;
        }

        if (!pid) {
          setProfileError(true);
          return;
        }

        const res = await api.get(`/patients/${pid}/profile/`);
        setProfileData(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to fetch patient profile", err);
        setProfileError(true);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [initialPatientId, initialData]);

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading patient profile...</p>
        </div>
      </div>
    );
  }

  if (profileError || !profileData) return <ProfileError />;

  const { patient, vitals, records, documents, stats } = profileData;
  const patientId = patient?.patient_id || initialPatientId;

  const calculateAge = (dob) => {
    if (!dob) return "N/A";
    const diff = new Date() - new Date(dob);
    return Math.floor(diff / 31557600000);
  };

  const renderTabNavigation = () => (
    <div className="flex border-b border-gray-200 mb-6 bg-white overflow-x-auto hide-scrollbar sticky top-0 z-10">
      {["OVERVIEW", "RECORDS", "VITALS", "DOCUMENTS"].map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-5 py-3.5 text-sm font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === tab
              ? "text-blue-600"
              : "text-gray-500 hover:text-gray-900 bg-transparent"
          }`}
        >
          {tab === "RECORDS" ? "Medical Records" : tab.charAt(0) + tab.slice(1).toLowerCase()}
          {activeTab === tab && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar name={patient.user || "Patient Name"} size="xl" className="ring-4 ring-blue-50" />
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{patient.user || "Patient Name"}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="px-3 py-1 font-bold">{patient.blood_group || "Unknown Blood"}</Badge>
                <Badge variant="gray" className="px-3 py-1 font-medium">{patient.gender || "Unknown Gender"}</Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 mt-4 text-sm font-medium text-gray-600">
              <span className="flex items-center justify-center sm:justify-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <Calendar className="w-4.5 h-4.5" />
                </div>
                {calculateAge(patient.date_of_birth)} years old
              </span>
              <span className="flex items-center justify-center sm:justify-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                +{patient.phone || "N/A"}
              </span>
              <span className="flex items-center justify-center sm:justify-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                   <Info className="w-4.5 h-4.5" />
                </div>
                <code className="text-blue-700 font-bold bg-blue-50/50 px-2 py-0.5 rounded tracking-widest">{patient.patient_id}</code>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 self-center sm:self-start mt-2 sm:mt-0">
          {role === "DOCTOR" && (
            <>
              <Button variant="secondary" onClick={() => setAssignStaffOpen(true)} className="flex-1 md:flex-none h-11 px-6 font-semibold border-gray-200">
                <UserPlus className="w-4 h-4 mr-2" /> Assign Staff
              </Button>
              <Button onClick={() => setAddRecordOpen(true)} className="flex-1 md:flex-none h-11 px-6 font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                <FileText className="w-4 h-4 mr-2" /> Add Record
              </Button>
            </>
          )}
          {role === "STAFF" && (
            <>
              <Button variant="secondary" onClick={() => setAddVitalsOpen(true)} className="flex-1 md:flex-none h-11 px-6 font-semibold text-green-700 bg-green-50 border-green-200 hover:bg-green-100 border transition-all">
                <Activity className="w-4 h-4 mr-2" /> Add Vitals
              </Button>
              <Button onClick={() => setAddRecordOpen(true)} className="flex-1 md:flex-none h-11 px-6 font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
                <FileText className="w-4 h-4 mr-2" /> Add Record
              </Button>
            </>
          )}
        </div>
      </div>

      {renderTabNavigation()}

      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fadeIn">
          {/* Allergies Card */}
          <Card className="p-8 hover:shadow-md transition-all border-none bg-white min-h-[160px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Allergies
                </h3>
              </div>
              {patient.known_allergies ? (
                <div className="flex flex-wrap gap-2.5">
                  {patient.known_allergies.split(",").map((a, i) => (
                    <Badge key={i} variant="red" className="px-3 py-1.5 text-[11px] font-bold">
                      {a.trim()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 font-medium italic">No known allergies reported.</p>
              )}
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="p-8 hover:shadow-md transition-all border-none bg-white min-h-[160px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" /> Emergency Contact
                </h3>
              </div>
              {patient.emergency_contact_name ? (
                <div className="space-y-2">
                  <div className="font-extrabold text-gray-900 text-lg leading-tight">{patient.emergency_contact_name}</div>
                  <div className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full w-fit flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" />
                    {patient.emergency_contact_phone}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 font-medium italic">No emergency contact provided.</p>
              )}
            </div>
          </Card>

          {/* Current Status */}
          <Card className="p-8 hover:shadow-md transition-all border-none bg-white min-h-[160px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Current Status
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Last Visit</span>
                  <span className="text-sm font-extrabold text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">
                    {stats?.last_visit ? formatDate(stats.last_visit).split(',')[0] : "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-500">Active Prescriptions</span>
                  <Badge variant="amber" className="px-3 py-1 font-black text-xs ring-4 ring-amber-50">{stats?.active_prescriptions || 0}</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === "RECORDS" && (
        <div className="animate-fadeIn">
          <Card className="overflow-hidden">
            {records?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {records.map((record) => (
                  <div key={record.id} className="group border-b border-gray-50 last:border-0">
                    <div 
                      className={`flex cursor-pointer items-center justify-between p-6 transition-all ${expandedRecord === record.id ? "bg-blue-50/30" : "hover:bg-gray-50/80"}`}
                      onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-10 w-full">
                        <div className="flex flex-col w-32 shrink-0">
                          <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Visit Date</span>
                          <span className="text-sm font-extrabold text-gray-900 leading-none">
                            {formatDate(record.visit_date).split(',')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl shadow-sm ring-1 ring-blue-100/50 shrink-0">
                            {VISIT_ICONS[record.visit_type] || "📄"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-gray-900 text-base truncate tracking-tight">{record.visit_type.replace("_", " ")}</h3>
                            <p className="text-xs font-bold text-gray-500 truncate mt-0.5">{record.diagnosis || record.chief_complaint || "Routine check"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 pl-4 sm:pl-0 shrink-0">
                          <StatusBadge status={record.status} />
                          <div className={`w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 transition-all ${expandedRecord === record.id ? "bg-white border-blue-200 text-blue-500 shadow-sm" : "group-hover:bg-white group-hover:border-gray-200"}`}>
                            {expandedRecord === record.id ? <ChevronDown size={18} strokeWidth={2.5}/> : <ChevronRight size={18} strokeWidth={2.5}/>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedRecord === record.id && (
                      <div className="border-t border-gray-50 bg-gray-50/20 p-8 text-sm animate-fadeIn">
                        <div className="grid gap-x-12 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                          {record.chief_complaint && (
                            <div className="space-y-2">
                              <strong className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Chief Complaint</strong> 
                              <p className="text-gray-900 font-medium leading-relaxed">{record.chief_complaint}</p>
                            </div>
                          )}
                          {record.diagnosis && (
                            <div className="space-y-2">
                              <strong className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Diagnosis</strong> 
                              <p className="text-gray-900 font-extrabold text-base">{record.diagnosis}</p>
                            </div>
                          )}
                          {record.doctor_notes && (
                            <div className="sm:col-span-2 lg:col-span-1 space-y-2">
                              <strong className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Doctor Notes</strong> 
                              <p className="text-gray-900 font-medium leading-relaxed italic border-l-2 border-gray-200 pl-4">{record.doctor_notes}</p>
                            </div>
                          )}
                          {record.tests_ordered?.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-3 space-y-3">
                              <strong className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Tests Ordered</strong> 
                              <div className="flex flex-wrap gap-2">{record.tests_ordered.map(t=><Badge variant="gray" key={t} className="px-3 py-1 font-bold">{t}</Badge>)}</div>
                            </div>
                          )}
                        </div>

                        {record.prescriptions?.length > 0 && (
                          <div className="mt-10 pt-10 border-t border-gray-100">
                            <strong className="text-xs font-black text-gray-900 tracking-widest block mb-4 uppercase flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center"><Pill size={12} className="text-blue-600"/></div>
                              Prescriptions
                            </strong>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                              {record.prescriptions.map(p => (
                                <div key={p.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-all">
                                  <div className="font-extrabold text-gray-900 text-base">{p.medicine_name}</div>
                                  <div className="text-xs font-bold text-gray-500 mt-1.5 flex items-center gap-1.5">
                                    <span className="bg-gray-50 px-2 py-0.5 rounded">{p.dosage}</span>
                                    <span>•</span>
                                    <span className="bg-gray-50 px-2 py-0.5 rounded">{p.frequency}</span>
                                  </div>
                                  <div className="text-[11px] font-black text-blue-600 mt-3 uppercase tracking-tighter bg-blue-50 w-fit px-2 py-0.5 rounded-md">
                                    Duration: {p.duration_value} {p.duration_unit}
                                  </div>
                                  {p.special_instructions && (
                                    <div className="text-xs text-gray-500 mt-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100 italic leading-relaxed">
                                      &quot;{p.special_instructions}&quot;
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {record.documents?.length > 0 && (
                          <div className="mt-10 pt-10 border-t border-gray-100">
                            <strong className="text-xs font-black text-gray-900 tracking-widest block mb-4 uppercase flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-gray-50 flex items-center justify-center"><FileText size={12} className="text-gray-600"/></div>
                              Attached Documents
                            </strong>
                            <div className="flex flex-wrap gap-4">
                              {record.documents.map(d => (
                                 <a key={d.id} href={d.cloudinary_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-extrabold text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                   <ExternalLink size={14} className="text-blue-500" /> {d.label}
                                 </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 flex items-center justify-center min-h-[400px]">
                <EmptyState icon={FileText} title="No Records Found" description="This patient has no medical records yet." />
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === "VITALS" && (
        <div className="animate-fadeIn">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {vitals?.length > 0 ? (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50/50 text-gray-400 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Date recorded</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Blood Pressure</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Heart Rate</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">Temperature</th>
                      <th className="px-8 py-5 font-black text-[10px] uppercase tracking-widest">SpO2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {vitals.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-8 py-5 font-extrabold text-gray-900">{formatDate(v.recorded_at)}</td>
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg w-fit group-hover:bg-white transition-colors">{v.blood_pressure || "—"}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-700">{v.pulse ? <><span className="text-base">{v.pulse}</span> <span className="text-[10px] uppercase font-black text-gray-400 ml-1">bpm</span></> : "—"}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-700">{v.temperature ? <><span className="text-base">{v.temperature}</span><span className="text-xs ml-0.5 text-gray-400">°F</span></> : "—"}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit group-hover:bg-blue-100/50 transition-colors">{v.spo2 ? `${v.spo2}%` : "—"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-20 flex items-center justify-center min-h-[400px]">
                   <EmptyState icon={Activity} title="No Vitals Recorded" description="There are no vitals history for this patient." />
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "DOCUMENTS" && (
        <div className="animate-fadeIn">
          {documents?.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map(doc => (
                 <Card key={doc.id} variant="hoverable" className="p-6 flex flex-col justify-between border-none bg-white hover:shadow-lg transition-all min-h-[180px]">
                    <div className="flex items-start gap-4">
                       <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm ring-1 ring-blue-100/50">
                         <FileText size={28} strokeWidth={1.5} />
                       </div>
                       <div className="min-w-0">
                         <h4 className="font-extrabold text-gray-900 line-clamp-2 leading-tight text-base mb-1" title={doc.label}>{doc.label}</h4>
                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 w-fit px-2 py-0.5 rounded-md">{doc.doc_type.replace("_", " ")}</p>
                       </div>
                    </div>
                    <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Uploaded on</span>
                         <span className="text-xs font-bold text-gray-900">{formatDate(doc.uploaded_at).split(',')[0]}</span>
                       </div>
                       <a href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-gray-50 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl text-xs font-black text-gray-700 transition-all shadow-sm">
                         Open <ExternalLink size={14} />
                       </a>
                    </div>
                 </Card>
              ))}
            </div>
          ) : (
            <Card className="p-10">
               <EmptyState icon={FileText} title="No Documents" description="This patient has no attached documents." />
            </Card>
          )}
        </div>
      )}

      <AssignStaffModal isOpen={assignStaffOpen} onClose={() => setAssignStaffOpen(false)} patientId={patientId} />
      <AddRecordModal isOpen={addRecordOpen} onClose={() => setAddRecordOpen(false)} patientId={patientId} />
      <AddVitalsModal isOpen={addVitalsOpen} onClose={() => setAddVitalsOpen(false)} patientId={patientId} />
    </div>
  );
}

function ProfileError() {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-red-600 font-medium">
      <h3 className="text-lg font-bold">Error Loading Profile</h3>
      <p className="mt-2 text-sm">You may not have permission to view this patient or they do not exist.</p>
    </div>
  );
}
