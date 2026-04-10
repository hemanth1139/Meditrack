"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, FilePlus, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import useRecords from "@/hooks/useRecords";
import { recordFormSchema } from "@/lib/schemas";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";

const VISIT_TYPES = [
  {
    id: "CONSULTATION",
    icon: "🩺",
    title: "Consultation & Prescription",
    description: "General visit, diagnosis, medicines",
    color: "blue",
  },
  {
    id: "LAB_DIAGNOSTICS",
    icon: "🔬",
    title: "Lab & Diagnostics",
    description: "Blood tests, scans, imaging",
    color: "green",
  },
  {
    id: "PROCEDURE_EMERGENCY",
    icon: "🏥",
    title: "Procedure & Emergency",
    description: "Surgery, procedures, emergency",
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
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === undefined || (Array.isArray(payload[key]) && payload[key].length === 0)) {
        if (key !== "prescriptions") delete payload[key];
      }
    });

    try {
      await createRecord(payload);
      onClose();
    } catch (err) {}
  };

  const handleCheckboxToggle = (field, value) => {
    const current = watch(field) || [];
    if (current.includes(value)) {
      setValue(field, current.filter(item => item !== value), { shouldValidate: true });
    } else {
      setValue(field, [...current, value], { shouldValidate: true });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 2 ? () => setStep(1) : onClose}
      maxWidth="max-w-[70rem]" // Larger width for 2-column layout
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FilePlus size={20} />
          </div>
          <div>
            <span className="block text-lg font-bold text-gray-900">New Medical Record</span>
            <span className="block text-xs font-semibold text-gray-400">Step {step} of 2 - {step === 1 ? "Select Category" : "Fill Clinical Details"}</span>
          </div>
        </div>
      }
      footer={
        <div className="w-full flex justify-between items-center">
          <Button type="button" onClick={step === 2 ? () => setStep(1) : onClose} variant="secondary" disabled={isSubmitting}>
            {step === 2 ? <><ChevronLeft className="mr-1" size={16} /> Back</> : "Cancel"}
          </Button>
          
          {step === 1 ? (
             <Button type="button" onClick={() => setStep(2)} disabled={!visitType}>
              Continue <ChevronRight className="ml-1" size={16} />
            </Button>
          ) : (
            <Button type="submit" form="new-record-form" disabled={isSubmitting} loading={isSubmitting}>
              Save Medical Record
            </Button>
          )}
        </div>
      }
    >
      <form id="new-record-form" onSubmit={handleSubmit(onSubmit)} className="py-2 h-[65vh] overflow-hidden flex flex-col">
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-3 h-full pb-4">
            {VISIT_TYPES.map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setValue("visit_type", type.id, { shouldValidate: true });
                  setStep(2);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-6 text-center transition-all h-full ${
                  visitType === type.id
                    ? `border-${type.color}-600 bg-${type.color}-50 shadow-sm`
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-3xl mb-4`}>
                  {type.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{type.title}</h3>
                <p className="text-sm font-medium text-gray-500">{type.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="flex gap-6 h-full">
            {/* Left Column - Form Fields */}
            <div className="flex-1 overflow-y-auto pr-4 hide-scrollbar space-y-6 pb-20">
              
              {/* CATEGORY 1: CONSULTATION */}
              {visitType === "CONSULTATION" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-gray-50 p-5 border border-gray-100">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Is this a Follow-up Visit?</label>
                      <select className="w-full rounded-xl border border-gray-200 p-2 text-sm focus:ring-blue-500 focus:border-blue-500" onChange={(e) => setValue("is_followup", e.target.value === "true")}>
                        <option value="false">No</option><option value="true">Yes</option>
                      </select>
                    </div>
                    {isFollowup && (
                      <div>
                        <label className="mb-1 block text-sm font-semibold text-gray-700">Patient Progress</label>
                        <select {...register("patient_progress")} className="w-full rounded-xl border border-gray-200 p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
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
                       <label className="mb-1 block text-sm font-semibold text-gray-700">Chief Complaint *</label>
                       <textarea {...register("chief_complaint")} className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-blue-500 focus:border-blue-500 min-h-[80px]" placeholder="What brings the patient in today?" />
                       {errors.chief_complaint && <p className="text-red-500 text-xs mt-1">{errors.chief_complaint.message}</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Symptoms</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                         {["Fever", "Headache", "Cough", "Fatigue", "Nausea", "Vomiting", "Chest pain", "Shortness of breath", "Dizziness", "Body pain", "Loss of appetite", "Other"].map(sym => (
                           <label key={sym} className="flex items-center gap-2 text-sm text-gray-600 font-medium cursor-pointer">
                             <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" checked={(watch("symptoms") || []).includes(sym)} onChange={() => handleCheckboxToggle("symptoms", sym)} />
                             {sym}
                           </label>
                         ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Symptom Duration</label>
                      <select {...register("symptom_duration")} className="w-full rounded-xl border border-gray-200 p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Select duration...</option>
                        <option value="1 day">1 day</option><option value="2-3 days">2-3 days</option>
                        <option value="1 week">1 week</option><option value="2 weeks">2 weeks</option>
                        <option value="1 month">1 month</option><option value="More than 1 month">More than 1 month</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Examination Findings</label>
                      <textarea {...register("examination_findings")} className="w-full rounded-xl border border-gray-200 p-3 text-sm min-h-[80px]" placeholder="Physical examination notes" />
                    </div>
                    <Input label="Diagnosis *" placeholder="Confirmed diagnosis" error={errors.diagnosis?.message} {...register("diagnosis")} />
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Severity</label>
                      <select {...register("severity")} className="w-full rounded-xl border border-gray-200 p-2 text-sm">
                        <option value="MILD">Mild</option><option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option><option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-semibold text-gray-700">Treatment Given</label>
                      <textarea {...register("treatment_given")} className="w-full rounded-xl border border-gray-200 p-3 text-sm min-h-[80px]" placeholder="What was done during visit" />
                    </div>
                  </div>

                  {/* Prescriptions */}
                  <div className="rounded-xl border border-blue-200 bg-white overflow-hidden shadow-sm">
                    <div className="bg-blue-50 px-5 py-3 flex items-center justify-between border-b border-blue-100">
                      <h3 className="font-bold text-blue-900">Prescriptions</h3>
                      <Button type="button" size="sm" onClick={() => appendPrescription({ medicine_name: "", medicine_type: "TABLET", dosage: "", frequency: "OD", duration_value: 1, duration_unit: "Days", route: "ORAL" })} className="bg-blue-600 hover:bg-blue-700 text-white gap-1 h-8 px-3">
                        <Plus size={14} /> Add Medicine
                      </Button>
                    </div>
                    <div className="p-5 space-y-4">
                      {prescriptionFields.length === 0 && (
                        <div className="text-center py-4 text-gray-400 text-sm font-medium">No prescriptions added.</div>
                      )}
                      {prescriptionFields.map((field, index) => (
                        <div key={field.id} className="relative rounded-xl border border-gray-200 p-4 bg-gray-50/50">
                          <button type="button" onClick={() => removePrescription(index)} className="absolute right-3 top-3 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"><Trash2 size={16} /></button>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pr-8">
                            <div className="lg:col-span-2"><Input label="Medicine Name *" {...register(`prescriptions.${index}.medicine_name`)} /></div>
                            <div>
                               <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Type</label>
                               <select {...register(`prescriptions.${index}.medicine_type`)} className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"><option value="TABLET">Tablet</option><option value="SYRUP">Syrup</option><option value="INJECTION">Injection</option><option value="OTHER">Other</option></select>
                            </div>
                            <Input label="Dosage *" {...register(`prescriptions.${index}.dosage`)} placeholder="500mg" />
                            <div>
                               <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Frequency</label>
                               <select {...register(`prescriptions.${index}.frequency`)} className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"><option value="OD">Once daily</option><option value="BD">Twice daily</option><option value="TDS">Three times daily</option></select>
                            </div>
                            <div className="flex gap-2">
                               <div className="flex-1"><Input label="Duration" type="number" {...register(`prescriptions.${index}.duration_value`)} /></div>
                               <div className="flex-1">
                                 <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Unit</label>
                                 <select {...register(`prescriptions.${index}.duration_unit`)} className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"><option value="Days">Days</option><option value="Weeks">Weeks</option></select>
                               </div>
                            </div>
                            <div>
                               <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Route</label>
                               <select {...register(`prescriptions.${index}.route`)} className="w-full rounded-lg border border-gray-200 p-2 text-sm bg-white"><option value="ORAL">Oral</option><option value="IV">IV</option><option value="IM">IM</option></select>
                            </div>
                            <div className="lg:col-span-4"><Input label="Special Instructions" {...register(`prescriptions.${index}.special_instructions`)} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 2: LAB (Abridged for modal length) */}
              {visitType === "LAB_DIAGNOSTICS" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-gray-50 p-5 border border-gray-200">
                     <div className="sm:col-span-2">
                        <label className="mb-1 block text-sm font-semibold">Clinical Indication *</label>
                        <textarea {...register("clinical_indication")} className="w-full rounded-xl border border-gray-200 p-3 text-sm min-h-[80px]" placeholder="Why are these tests ordered?" />
                        {errors.clinical_indication && <p className="text-red-500 text-xs mt-1">{errors.clinical_indication.message}</p>}
                     </div>
                     <Input label="Suspected Diagnosis" {...register("suspected_diagnosis")} />
                     <Input label="Body Part / Region" {...register("body_part")} />
                  </div>
                  <div>
                      <h4 className="font-bold text-gray-900 mb-2">Tests Ordered</h4>
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                         {["CBC", "Blood Glucose", "Lipid Profile", "LFT", "KFT", "X-Ray", "CT Scan", "MRI"].map(test => (
                           <label key={test} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                             <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300" checked={(watch("tests_ordered") || []).includes(test)} onChange={() => handleCheckboxToggle("tests_ordered", test)} />
                             {test}
                           </label>
                         ))}
                      </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div>
                       <label className="mb-1 block text-sm font-semibold">Priority</label>
                       <select {...register("priority")} className="w-full rounded-xl border border-gray-200 p-2 text-sm"><option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option></select>
                     </div>
                     <div className="sm:col-span-2">
                       <label className="mb-1 block text-sm font-semibold">Interpretation</label>
                       <textarea {...register("results_interpretation")} className="w-full rounded-xl border border-gray-200 p-3 text-sm min-h-[80px]" />
                     </div>
                  </div>
                </div>
              )}

              {/* CATEGORY 3: PROCEDURE (Abridged for modal length) */}
              {visitType === "PROCEDURE_EMERGENCY" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-gray-50 p-4 border border-gray-200 mb-6">
                     <label className="flex items-center gap-2 font-semibold"><input type="radio" {...register("sub_type")} value="PROCEDURE" className="w-4 h-4 text-blue-600" /> Planned Procedure</label>
                     <label className="flex items-center gap-2 font-semibold"><input type="radio" {...register("sub_type")} value="EMERGENCY" className="w-4 h-4 text-red-600" /> Emergency Visit</label>
                  </div>
                  {subType === "PROCEDURE" ? (
                     <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Procedure Name *" {...register("procedure_name")} />
                        <div><label className="mb-1 block text-sm font-semibold">Procedure Type</label><select {...register("procedure_type")} className="w-full rounded-xl border p-2 text-sm"><option value="Minor Surgery">Minor Surgery</option><option value="Diagnostic">Diagnostic</option></select></div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Details</label><textarea {...register("procedure_details")} className="w-full rounded-xl border border-gray-200 p-3 text-sm min-h-[80px]" /></div>
                     </div>
                  ) : (
                     <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold text-red-600">Presenting Problem *</label><textarea {...register("presenting_problem")} className="w-full rounded-xl border border-red-200 bg-red-50 p-3 text-sm min-h-[80px]" /></div>
                        <div><label className="mb-1 block text-sm font-semibold">Triage Level</label><select {...register("triage_level")} className="w-full rounded-xl border p-2 text-sm"><option value="P1 Immediate (Red)">P1 Immediate (Red)</option><option value="P2 Urgent (Yellow)">P2 Urgent (Yellow)</option></select></div>
                        <div className="sm:col-span-2"><label className="mb-1 block text-sm font-semibold">Immediate Treatment</label><textarea {...register("immediate_treatment")} className="w-full rounded-xl border border-gray-200 p-3 text-sm min-h-[80px]" /></div>
                     </div>
                  )}
                </div>
              )}

              {/* COMMON DOCTOR NOTES */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                 <label className="mb-2 block text-sm font-bold text-amber-700 flex items-center gap-2">
                    Doctor Notes <Badge variant="amber">Private</Badge>
                 </label>
                 <textarea {...register("doctor_notes")} className="w-full rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium focus:ring-amber-500 focus:border-amber-500 min-h-[100px]" placeholder="These notes are hidden from the patient..." />
                 
                 <div className="grid sm:grid-cols-2 gap-4 mt-4">
                   <div>
                     <label className="mb-1 block text-sm font-semibold text-gray-700">Follow-up Required?</label>
                     <select className="w-full rounded-xl border border-gray-200 p-2 text-sm" onChange={(e) => setValue("follow_up_required", e.target.value === "true")}>
                       <option value="false">No</option><option value="true">Yes</option>
                     </select>
                   </div>
                   {followUpRequired && (
                     <div>
                       <label className="mb-1 block text-sm font-semibold text-gray-700">Follow-up Date</label>
                       <Input type="date" {...register("follow_up_date")} />
                     </div>
                   )}
                 </div>
              </div>
            </div>

            {/* Right Column - Document Upload Area */}
            <div className="w-80 shrink-0 border-l border-gray-100 pl-6 flex flex-col pt-2 h-full">
               <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Attach Documents</h3>
               <p className="text-xs text-gray-500 mb-4">Upload lab results, X-rays, or reference documents here.</p>
               
               <div className="flex-1 overflow-y-auto">
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
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
