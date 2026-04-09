"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FilePlus, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import useRecords from "@/hooks/useRecords";
import { recordFormSchema } from "@/lib/schemas";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";

const VISIT_TYPES = [
  {
    id: "CONSULTATION",
    icon: "🩺",
    title: "Consultation & Prescription",
    description: "General visit, diagnosis, medicines, follow-up",
    color: "blue",
  },
  {
    id: "LAB_DIAGNOSTICS",
    icon: "🔬",
    title: "Lab & Diagnostics",
    description: "Blood tests, scans, imaging, upload reports",
    color: "green",
  },
  {
    id: "PROCEDURE_EMERGENCY",
    icon: "🏥",
    title: "Procedure & Emergency",
    description: "Surgery, procedures, emergency visits",
    color: "red",
  },
];

export default function AddRecordModal({ isOpen, onClose, patientId }) {
  const [step, setStep] = useState(1);
  const { createRecord } = useRecords();
  const [documents, setDocuments] = useState([]);

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(recordFormSchema),
    defaultValues: {
      visit_date: new Date().toISOString().split("T")[0],
      prescriptions: [],
      documents: [],
      symptoms: [],
      tests_ordered: [],
      vitals: {},
    },
  });

  const { fields: prescriptionFields, append: appendPrescription, remove: removePrescription } = useFieldArray({
    control,
    name: "prescriptions",
  });

  const visitType = watch("visit_type");
  const subType = watch("sub_type");
  const isFollowup = watch("is_followup");
  const followUpRequired = watch("follow_up_required");

  useEffect(() => {
    if (isOpen) {
      reset();
      setDocuments([]);
      setStep(1);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    const payload = { ...data, patient_id: patientId, documents };
    
    // Clean up empty fields
    Object.keys(payload).forEach(key => {
      if (payload[key] === "" || payload[key] === undefined || (Array.isArray(payload[key]) && payload[key].length === 0)) {
        if (key !== "prescriptions") delete payload[key];
      }
    });

    try {
      await createRecord(payload);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckboxToggle = (field, value) => {
    const current = watch(field) || [];
    if (current.includes(value)) {
      setValue(field, current.filter(item => item !== value), { shouldValidate: true });
    } else {
      setValue(field, [...current, value], { shouldValidate: true });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <FilePlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">New Medical Record</h2>
              <p className="text-xs text-slate-500">Step {step} of 2 - {step === 1 ? "Select Category" : "Fill Clinical Details"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 border border-slate-200">
          <form id="new-record-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-3">
                {VISIT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setValue("visit_type", type.id, { shouldValidate: true });
                      setStep(2);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-6 text-center transition-all ${
                      visitType === type.id
                        ? `border-${type.color}-500 bg-${type.color}-50 shadow-md ring-2 ring-${type.color}-500/20`
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="mb-3 text-4xl">{type.icon}</span>
                    <h3 className="font-bold text-slate-800">{type.title}</h3>
                    <p className="mt-2 text-xs text-slate-500">{type.description}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                
                {/* CATEGORY 1: CONSULTATION & PRESCRIPTION */}
                {visitType === "CONSULTATION" && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 p-5 border border-slate-200">
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Is this a Follow-up Visit?</label>
                        <select className="w-full rounded-md border p-2 text-sm" onChange={(e) => setValue("is_followup", e.target.value === "true")}>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      {isFollowup && (
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Patient Progress</label>
                          <select {...register("patient_progress")} className="w-full rounded-md border p-2 text-sm">
                            <option value="">Select progress...</option>
                            <option value="Much Better">Much Better</option>
                            <option value="Slightly Better">Slightly Better</option>
                            <option value="No Change">No Change</option>
                            <option value="Worse">Worse</option>
                            <option value="Much Worse">Much Worse</option>
                          </select>
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold">Chief Complaint *</label>
                        <Textarea {...register("chief_complaint")} className="h-20" placeholder="What brings the patient in today?" />
                        {errors.chief_complaint && <p className="text-red-500 text-xs mt-1">{errors.chief_complaint.message}</p>}
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-2 block text-sm font-semibold">Symptoms</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                           {["Fever", "Headache", "Cough", "Fatigue", "Nausea", "Vomiting", "Chest pain", "Shortness of breath", "Dizziness", "Body pain", "Loss of appetite", "Other"].map(sym => (
                             <label key={sym} className="flex items-center gap-2 text-sm text-slate-700">
                               <input type="checkbox" checked={(watch("symptoms") || []).includes(sym)} onChange={() => handleCheckboxToggle("symptoms", sym)} />
                               {sym}
                             </label>
                           ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Symptom Duration</label>
                        <select {...register("symptom_duration")} className="w-full rounded-md border p-2 text-sm">
                          <option value="">Select duration...</option>
                          <option value="1 day">1 day</option>
                          <option value="2-3 days">2-3 days</option>
                          <option value="1 week">1 week</option>
                          <option value="2 weeks">2 weeks</option>
                          <option value="1 month">1 month</option>
                          <option value="More than 1 month">More than 1 month</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold">Examination Findings</label>
                        <Textarea {...register("examination_findings")} placeholder="Doctor's physical examination notes" />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Diagnosis *</label>
                        <Input {...register("diagnosis")} placeholder="Confirmed diagnosis" />
                        {errors.diagnosis && <p className="text-red-500 text-xs mt-1">{errors.diagnosis.message}</p>}
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Severity</label>
                        <select {...register("severity")} className="w-full rounded-md border p-2 text-sm">
                          <option value="MILD">Mild</option>
                          <option value="MODERATE">Moderate</option>
                          <option value="SEVERE">Severe</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                         <label className="mb-1 block text-sm font-semibold">Treatment Given</label>
                         <Textarea {...register("treatment_given")} placeholder="What was done during the visit" />
                      </div>
                    </div>

                    {/* Prescriptions Section */}
                    <div className="rounded-xl border border-blue-200 bg-white shadow-sm overflow-hidden">
                      <div className="bg-blue-50 px-4 py-3 flex items-center justify-between border-b border-blue-200">
                        <h3 className="font-bold text-blue-900">Prescriptions</h3>
                        <Button type="button" size="sm" onClick={() => appendPrescription({ medicine_name: "", medicine_type: "TABLET", dosage: "", frequency: "OD", duration_value: 1, duration_unit: "Days", route: "ORAL" })} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
                          <Plus size={16} /> Add Medicine
                        </Button>
                      </div>
                      <div className="p-4 space-y-4">
                        {prescriptionFields.length === 0 && (
                          <div className="text-center py-6 text-slate-400 text-sm">No prescriptions added. Click the button above to add one.</div>
                        )}
                        {prescriptionFields.map((field, index) => (
                          <div key={field.id} className="relative rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                            <button type="button" onClick={() => removePrescription(index)} className="absolute right-3 top-3 text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"><Trash2 size={16} /></button>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pr-6">
                              <div className="lg:col-span-2">
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Medicine Name *</label>
                                <Input {...register(`prescriptions.${index}.medicine_name`)} placeholder="e.g. Paracetamol" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Type</label>
                                <select {...register(`prescriptions.${index}.medicine_type`)} className="w-full rounded-md border p-2 text-sm bg-white">
                                  <option value="TABLET">Tablet</option><option value="CAPSULE">Capsule</option><option value="SYRUP">Syrup</option>
                                  <option value="INJECTION">Injection</option><option value="DROPS">Drops</option><option value="INHALER">Inhaler</option>
                                  <option value="CREAM">Cream</option><option value="OTHER">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Dosage *</label>
                                <Input {...register(`prescriptions.${index}.dosage`)} placeholder="e.g. 500mg, 10ml" />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Frequency</label>
                                <select {...register(`prescriptions.${index}.frequency`)} className="w-full rounded-md border p-2 text-sm bg-white">
                                  <option value="OD">Once daily (OD)</option><option value="BD">Twice daily (BD)</option><option value="TDS">Three times daily (TDS)</option>
                                  <option value="QID">Four times daily (QID)</option><option value="Q8H">Every 8 hours (Q8H)</option><option value="AC">Before food (AC)</option>
                                  <option value="PC">After food (PC)</option><option value="HS">At bedtime (HS)</option><option value="SOS">As needed (SOS)</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Duration</label>
                                  <Input type="number" {...register(`prescriptions.${index}.duration_value`)} />
                                </div>
                                <div className="flex-1">
                                  <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Unit</label>
                                  <select {...register(`prescriptions.${index}.duration_unit`)} className="w-full rounded-md border p-2 text-sm bg-white">
                                    <option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Route</label>
                                <select {...register(`prescriptions.${index}.route`)} className="w-full rounded-md border p-2 text-sm bg-white">
                                  <option value="ORAL">Oral</option><option value="TOPICAL">Topical</option><option value="IV">IV</option>
                                  <option value="IM">IM</option><option value="INHALATION">Inhalation</option>
                                </select>
                              </div>
                              <div className="lg:col-span-4">
                                 <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase">Special Instructions</label>
                                 <Input {...register(`prescriptions.${index}.special_instructions`)} placeholder="Optional instructions for patient..." />
                              </div>
                            </div>
                          </div>
                        ))}
                        {errors.prescriptions && <p className="text-red-500 text-xs mt-1">{errors.prescriptions.root?.message || "Check prescription items for errors."}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* CATEGORY 2: LAB & DIAGNOSTICS */}
                {visitType === "LAB_DIAGNOSTICS" && (
                  <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 p-5 border border-slate-200">
                      <div className="sm:col-span-2">
                         <label className="mb-1 block text-sm font-semibold">Clinical Indication *</label>
                         <Textarea {...register("clinical_indication")} className="h-20" placeholder="Why are these tests/scans being ordered?" />
                         {errors.clinical_indication && <p className="text-red-500 text-xs mt-1">{errors.clinical_indication.message}</p>}
                      </div>
                      <div>
                         <label className="mb-1 block text-sm font-semibold">Suspected Diagnosis</label>
                         <Input {...register("suspected_diagnosis")} placeholder="Suspected condition" />
                      </div>
                      <div>
                         <label className="mb-1 block text-sm font-semibold">Body Part / Region</label>
                         <Input {...register("body_part")} placeholder="e.g. Right knee, Upper abdomen" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-md font-bold text-slate-800">Tests Ordered *</label>
                      <div className="grid sm:grid-cols-4 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">🩸 Blood Tests</h4>
                          <div className="space-y-2">
                             {["Complete Blood Count (CBC)", "Blood Glucose Fasting", "Blood Glucose Random", "HbA1c", "Lipid Profile", "Liver Function Test (LFT)", "Kidney Function Test (KFT)", "Thyroid Function Test (TFT)", "ESR / CRP", "Electrolytes", "Blood Culture", "Uric Acid"].map(test => (
                               <label key={test} className="flex items-start gap-2 text-sm text-slate-700">
                                 <input type="checkbox" className="mt-1" checked={(watch("tests_ordered") || []).includes(test)} onChange={() => handleCheckboxToggle("tests_ordered", test)} />
                                 <span className="leading-tight">{test}</span>
                               </label>
                             ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">🧪 Urine & Stool</h4>
                          <div className="space-y-2">
                             {["Urine Routine & Microscopy", "Urine Culture", "Stool Routine", "Stool Culture"].map(test => (
                               <label key={test} className="flex items-start gap-2 text-sm text-slate-700">
                                 <input type="checkbox" className="mt-1" checked={(watch("tests_ordered") || []).includes(test)} onChange={() => handleCheckboxToggle("tests_ordered", test)} />
                                 <span className="leading-tight">{test}</span>
                               </label>
                             ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">📷 Imaging & Scans</h4>
                          <div className="space-y-2">
                             {["X-Ray", "CT Scan", "MRI", "Ultrasound", "Echocardiography", "ECG / EKG", "Mammography", "DEXA Scan"].map(test => (
                               <label key={test} className="flex items-start gap-2 text-sm text-slate-700">
                                 <input type="checkbox" className="mt-1" checked={(watch("tests_ordered") || []).includes(test)} onChange={() => handleCheckboxToggle("tests_ordered", test)} />
                                 <span className="leading-tight">{test}</span>
                               </label>
                             ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 border-b pb-2">🦠 Specialized & Other</h4>
                          <div className="space-y-2">
                             {["HIV Test", "Hepatitis B", "Hepatitis C", "Dengue NS1/IgM/IgG", "COVID-19 RT-PCR", "Other"].map(test => (
                               <label key={test} className="flex items-start gap-2 text-sm text-slate-700">
                                 <input type="checkbox" className="mt-1" checked={(watch("tests_ordered") || []).includes(test)} onChange={() => handleCheckboxToggle("tests_ordered", test)} />
                                 <span className="leading-tight">{test}</span>
                               </label>
                             ))}
                          </div>
                        </div>
                      </div>
                      {errors.tests_ordered && <p className="text-red-500 text-xs mt-1">{errors.tests_ordered.message}</p>}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Priority</label>
                        <select {...register("priority")} className="w-full rounded-md border p-2 text-sm">
                          <option value="ROUTINE">Routine</option>
                          <option value="URGENT">Urgent</option>
                          <option value="STAT">STAT (immediate)</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-semibold">Fasting Required</label>
                        <select className="w-full rounded-md border p-2 text-sm" onChange={(e) => setValue("fasting_required", e.target.value === "true")}>
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                      {watch("fasting_required") && (
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Hours of Fasting</label>
                          <Input type="number" {...register("fasting_hours")} placeholder="e.g. 8" />
                        </div>
                      )}
                      <div className="sm:col-span-3">
                         <label className="mb-1 block text-sm font-semibold">Special Instructions</label>
                         <Textarea {...register("special_instructions")} placeholder="Instructions for lab or radiologist" />
                      </div>
                      <div className="sm:col-span-3">
                         <label className="mb-1 block text-sm font-semibold">Results / Interpretation</label>
                         <Textarea className="bg-amber-50" {...register("results_interpretation")} placeholder="Doctor's interpretation of results (Fill when results are available)" />
                      </div>
                    </div>
                  </div>
                )}

                {/* CATEGORY 3: PROCEDURE & EMERGENCY */}
                {visitType === "PROCEDURE_EMERGENCY" && (
                  <div className="space-y-6">
                    <div className="flex gap-6 rounded-xl bg-slate-50 p-5 border border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" {...register("sub_type")} value="PROCEDURE" className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-slate-800">Planned Procedure / Surgery</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" {...register("sub_type")} value="EMERGENCY" className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-slate-800">Emergency Visit</span>
                      </label>
                    </div>

                    {subType === "PROCEDURE" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div><label className="mb-1 block text-sm font-semibold">Procedure Name *</label><Input {...register("procedure_name")} /></div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Procedure Type</label>
                          <select {...register("procedure_type")} className="w-full rounded-md border p-2 text-sm">
                            <option value="">Select type...</option>
                            <option value="Minor Surgery">Minor Surgery</option><option value="Major Surgery">Major Surgery</option>
                            <option value="Diagnostic Procedure">Diagnostic Procedure</option><option value="Therapeutic Procedure">Therapeutic Procedure</option>
                            <option value="Laparoscopic">Laparoscopic</option><option value="Endoscopic">Endoscopic</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Indication</label><Textarea {...register("indication")} placeholder="Why is this procedure needed?" /></div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Anesthesia Type</label>
                          <select {...register("anesthesia_type")} className="w-full rounded-md border p-2 text-sm">
                            <option value="">Select type...</option>
                            <option value="Local">Local</option><option value="Regional">Regional</option>
                            <option value="General">General</option><option value="Sedation">Sedation</option><option value="None">None</option>
                          </select>
                        </div>
                        <div><label className="mb-1 block text-sm font-semibold">Pre-operative Diagnosis</label><Input {...register("pre_op_diagnosis")} /></div>
                        <div><label className="mb-1 block text-sm font-semibold">Post-operative Diagnosis</label><Input {...register("post_op_diagnosis")} /></div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Procedure Details</label><Textarea {...register("procedure_details")} className="h-24" /></div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Complications (if any)</label><Textarea {...register("complications")} /></div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Post-operative Instructions</label><Textarea {...register("post_op_instructions")} /></div>
                      </div>
                    )}

                    {subType === "EMERGENCY" && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                           <label className="mb-1 block text-sm font-semibold">Time of Arrival</label>
                           <Input type="datetime-local" {...register("arrival_time")} />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Mode of Arrival</label>
                          <select {...register("mode_of_arrival")} className="w-full rounded-md border p-2 text-sm">
                            <option value="">Select mode...</option>
                            <option value="Walk-in">Walk-in</option><option value="Ambulance">Ambulance</option>
                            <option value="Referred">Referred</option><option value="Family brought">Family brought</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold text-red-600">Presenting Problem *</label><Textarea {...register("presenting_problem")} /></div>
                        
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Triage Level</label>
                          <select {...register("triage_level")} className="w-full rounded-md border p-2 text-sm">
                            <option value="">Select level...</option>
                            <option value="P1 Immediate (Red)">P1 Immediate (Red)</option><option value="P2 Urgent (Yellow)">P2 Urgent (Yellow)</option>
                            <option value="P3 Delayed (Green)">P3 Delayed (Green)</option>
                          </select>
                        </div>
                        <div><label className="mb-1 block text-sm font-semibold">GCS Score (3-15)</label><Input type="number" {...register("gcs_score")} min="3" max="15" /></div>

                        <div className="sm:col-span-2 p-4 bg-red-50 border border-red-100 rounded-xl">
                          <label className="mb-2 block text-sm font-bold text-red-800">Vitals on Arrival</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div><label className="text-xs font-semibold text-slate-500">BP</label><Input {...register("vitals.bp")} placeholder="120/80" className="bg-white" /></div>
                            <div><label className="text-xs font-semibold text-slate-500">HR</label><Input {...register("vitals.hr")} placeholder="72 bpm" className="bg-white" /></div>
                            <div><label className="text-xs font-semibold text-slate-500">Temp</label><Input {...register("vitals.temp")} placeholder="98.6 F" className="bg-white" /></div>
                            <div><label className="text-xs font-semibold text-slate-500">SpO2</label><Input {...register("vitals.spo2")} placeholder="98%" className="bg-white" /></div>
                          </div>
                        </div>

                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Immediate Treatment Given</label><Textarea {...register("immediate_treatment")} /></div>
                        <div><label className="mb-1 block text-sm font-semibold">Working Diagnosis</label><Input {...register("working_diagnosis")} /></div>
                        <div>
                          <label className="mb-1 block text-sm font-semibold">Disposition</label>
                          <select {...register("disposition")} className="w-full rounded-md border p-2 text-sm">
                            <option value="">Select disposition...</option>
                            <option value="Discharged">Discharged</option><option value="Admitted">Admitted</option>
                            <option value="Transferred">Transferred</option><option value="LAMA">LAMA</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* COMMON FIELDS TO ALL CATEGORIES */}
                <div className="border-t border-slate-200 pt-6 mt-6 grid gap-4 sm:grid-cols-2">
                   <div className="sm:col-span-2">
                     <label className="mb-1 block text-sm font-semibold text-amber-700 flex items-center gap-2">
                        Doctor Notes <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">Private</span>
                     </label>
                     <Textarea {...register("doctor_notes")} className="bg-amber-50 border-amber-200" placeholder="These notes are hidden from the patient..." />
                   </div>
                   
                   <div>
                     <label className="mb-1 block text-sm font-semibold">Follow-up Required?</label>
                     <select className="w-full rounded-md border p-2 text-sm" onChange={(e) => setValue("follow_up_required", e.target.value === "true")}>
                       <option value="false">No</option>
                       <option value="true">Yes</option>
                     </select>
                   </div>
                   {followUpRequired && (
                     <>
                       <div>
                         <label className="mb-1 block text-sm font-semibold">Follow-up Date</label>
                         <Input type="date" {...register("follow_up_date")} />
                       </div>
                       <div className="sm:col-span-2">
                         <label className="mb-1 block text-sm font-semibold">Follow-up Instructions</label>
                         <Textarea {...register("follow_up_instructions")} />
                       </div>
                     </>
                   )}
                </div>

                {/* UPLOADS (Conditionally visible for Category 2 and 3) */}
                {["LAB_DIAGNOSTICS", "PROCEDURE_EMERGENCY"].includes(visitType) && (
                   <div className="pt-4 border-t">
                     <CloudinaryUpload 
                       docType={visitType === "LAB_DIAGNOSTICS" ? "LAB_REPORT" : "OTHER"}
                       uploadedFiles={documents}
                       onUploadSuccess={(newDocs) => setDocuments([...documents, ...newDocs])}
                       onRemoveFile={(index) => {
                         const newDocs = [...documents];
                         newDocs.splice(index, 1);
                         setDocuments(newDocs);
                       }}
                     />
                   </div>
                )}

                {errors && Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-600 text-sm border border-red-200">
                    <strong className="block mb-1">Please fix the errors above: </strong>
                    <ul className="list-disc pl-5">
                      {Object.keys(errors).map(k => (
                        <li key={k}>{k}: {errors[k]?.message || errors[k]?.root?.message || "Invalid field"}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t bg-slate-50 px-6 py-4">
          <Button type="button" onClick={step === 2 ? () => setStep(1) : onClose} variant="outline" disabled={isSubmitting} className="rounded-xl">
             {step === 2 ? <><ChevronLeft className="mr-1" size={16} /> Back</> : "Cancel"}
          </Button>
          
          {step === 1 ? (
             <Button type="button" onClick={() => setStep(2)} disabled={!visitType} className="rounded-xl bg-slate-900 text-white hover:bg-slate-800">
              Continue <ChevronRight className="ml-1" size={16} />
            </Button>
          ) : (
            <Button type="submit" form="new-record-form" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-8">
              {isSubmitting ? "Saving..." : "Save Medical Record"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
