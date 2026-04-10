"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
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

export default function PatientProfile({ patientId, role, initialData }) {
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [expandedRecord, setExpandedRecord] = useState(null);

  const [assignStaffOpen, setAssignStaffOpen] = useState(false);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [addVitalsOpen, setAddVitalsOpen] = useState(false);

  if (!initialData) return <ProfileError />;

  const { patient, vitals, records, documents, stats } = initialData;

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
      <Card className="p-6 bg-white flex flex-col md:flex-row gap-6 md:items-center justify-between border-gray-200 shadow-sm">
        <div className="flex items-center gap-5">
          <Avatar name={patient.user || "Patient Name"} size="lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{patient.user || "Patient Name"}</h1>
              <Badge variant="blue">{patient.blood_group || "Unknown Blood"}</Badge>
              <Badge variant="gray">{patient.gender || "Unknown Gender"}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600 font-medium">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" /> {calculateAge(patient.date_of_birth)} years old</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-gray-400" /> +{patient.phone || "N/A"}</span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1.5 text-gray-500 font-mono tracking-wider"><Info className="w-4 h-4 text-gray-400" /> {patient.patient_id}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {role === "DOCTOR" && (
            <>
              <Button variant="secondary" onClick={() => setAssignStaffOpen(true)} className="flex-1 md:flex-none">
                <UserPlus className="w-4 h-4 mr-2" /> Assign Staff
              </Button>
              <Button onClick={() => setAddRecordOpen(true)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" /> Add Record
              </Button>
            </>
          )}
          {role === "STAFF" && (
            <>
              <Button variant="secondary" onClick={() => setAddVitalsOpen(true)} className="flex-1 md:flex-none text-green-700 bg-green-50 border-green-200 hover:bg-green-100 border">
                <Activity className="w-4 h-4 mr-2" /> Add Vitals
              </Button>
              <Button onClick={() => setAddRecordOpen(true)} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" /> Add Record
              </Button>
            </>
          )}
        </div>
      </Card>

      {renderTabNavigation()}

      {activeTab === "OVERVIEW" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {/* Allergies Card */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" /> Allergies
              </h3>
            </div>
            {patient.known_allergies ? (
              <div className="flex flex-wrap gap-2">
                {patient.known_allergies.split(",").map((a, i) => (
                  <Badge key={i} variant="red" className="px-2.5 py-1 text-xs">
                    {a.trim()}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">No known allergies reported.</p>
            )}
          </Card>

          {/* Emergency Contact */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" /> Emergency Contact
              </h3>
            </div>
            {patient.emergency_contact_name ? (
              <div className="space-y-1">
                <div className="font-semibold text-gray-900">{patient.emergency_contact_name}</div>
                <div className="text-sm font-medium text-gray-600 font-mono tracking-wide">{patient.emergency_contact_phone}</div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 font-medium">No emergency contact provided.</p>
            )}
          </Card>

          {/* Current Status */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" /> Current Status
              </h3>
            </div>
            <div className="space-y-3 font-medium">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Visit</span>
                <span className="text-gray-900">{stats?.last_visit ? formatDate(stats.last_visit) : "—"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Active Prescriptions</span>
                <Badge variant="amber">{stats?.active_prescriptions || 0}</Badge>
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
                  <div key={record.id} className="group">
                    <div 
                      className={`flex cursor-pointer items-center justify-between p-5 transition-colors ${expandedRecord === record.id ? "bg-blue-50/50" : "hover:bg-gray-50"}`}
                      onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
                        <div className="text-sm font-semibold text-gray-900 w-32 shrink-0">
                          {formatDate(record.visit_date).split(',')[0]}
                        </div>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                            {VISIT_ICONS[record.visit_type] || "📄"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{record.visit_type.replace("_", " ")}</h3>
                            <p className="text-xs font-medium text-gray-500 truncate">{record.diagnosis || record.chief_complaint || "Routine check"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 pl-4 sm:pl-0 shrink-0">
                          <StatusBadge status={record.status} />
                          <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:border-blue-200 transition-colors">
                            {expandedRecord === record.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {expandedRecord === record.id && (
                      <div className="border-t border-gray-100 bg-gray-50/50 p-6 text-sm animate-fadeIn">
                        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                          {record.chief_complaint && (
                            <div><strong className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Chief Complaint</strong> <p className="text-gray-900">{record.chief_complaint}</p></div>
                          )}
                          {record.diagnosis && (
                            <div><strong className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Diagnosis</strong> <p className="text-gray-900 font-semibold">{record.diagnosis}</p></div>
                          )}
                          {record.doctor_notes && (
                            <div className="sm:col-span-2 lg:col-span-1"><strong className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Doctor Notes</strong> <p className="text-gray-900">{record.doctor_notes}</p></div>
                          )}
                          {record.tests_ordered?.length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-3"><strong className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Tests Ordered</strong> <div className="flex flex-wrap gap-2">{record.tests_ordered.map(t=><Badge variant="gray" key={t}>{t}</Badge>)}</div></div>
                          )}
                        </div>

                        {record.prescriptions?.length > 0 && (
                          <div className="mt-8">
                            <strong className="text-xs font-bold text-gray-900 tracking-wider block mb-3 uppercase flex items-center gap-2"><Pill size={14} className="text-blue-500"/> Prescriptions</strong>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              {record.prescriptions.map(p => (
                                <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500">
                                  <div className="font-bold text-gray-900">{p.medicine_name}</div>
                                  <div className="text-xs font-semibold text-gray-600 mt-1">{p.dosage} • {p.frequency} • {p.duration_value} {p.duration_unit}</div>
                                  {p.special_instructions && <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded block border border-gray-100">&quot;{p.special_instructions}&quot;</div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {record.documents?.length > 0 && (
                          <div className="mt-8">
                            <strong className="text-xs font-bold text-gray-900 tracking-wider block mb-3 uppercase flex items-center gap-2"><FileText size={14} className="text-blue-500"/> Attached Documents</strong>
                            <div className="flex flex-wrap gap-3">
                              {record.documents.map(d => (
                                 <a key={d.id} href={d.cloudinary_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2.5 text-xs font-bold text-blue-600 hover:border-blue-300 hover:shadow-sm transition-all">
                                   <ExternalLink size={14} /> {d.label}
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
              <div className="p-10">
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
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date recorded</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Blood Pressure</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Heart Rate</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Temperature</th>
                      <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">SpO2</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {vitals.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-gray-900">{formatDate(v.recorded_at)}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{v.blood_pressure || "—"}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{v.pulse ? <>{v.pulse} <span className="text-xs text-gray-400">bpm</span></> : "—"}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{v.temperature ? `${v.temperature}°F` : "—"}</td>
                        <td className="px-6 py-4 font-medium text-gray-600">{v.spo2 ? `${v.spo2}%` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-10">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map(doc => (
                 <Card key={doc.id} variant="hoverable" className="p-5 flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                       <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                         <FileText size={24} strokeWidth={1.5} />
                       </div>
                       <div>
                         <h4 className="font-bold text-gray-900 line-clamp-2 leading-tight" title={doc.label}>{doc.label}</h4>
                         <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{doc.doc_type.replace("_", " ")}</p>
                       </div>
                    </div>
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                       <span className="text-[11px] font-semibold text-gray-500">{formatDate(doc.uploaded_at).split(',')[0]}</span>
                       <a href={doc.cloudinary_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition-colors">
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
