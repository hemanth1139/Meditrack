"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FilePlus, ChevronLeft, ChevronRight } from "lucide-react";
import useRecords from "@/hooks/useRecords";
import { recordFormSchema } from "@/lib/schemas";
import PrescriptionSubSection from "@/components/records/PrescriptionSubSection";
import CloudinaryUpload from "@/components/shared/CloudinaryUpload";

const VISIT_TYPES = [
  { id: "CONSULTATION", title: "General Consultation", desc: "Standard checkup and diagnosis", icon: "🩺" },
  { id: "PRESCRIPTION", title: "Prescription Only", desc: "Medication refill or new prescription", icon: "💊" },
  { id: "LAB_TEST", title: "Lab Test Request", desc: "Blood/pathology orders or results", icon: "🔬" },
  { id: "SCAN", title: "Scan / Imaging", desc: "X-Ray, MRI, CT Scan, Ultrasound", icon: "🦴" },
  { id: "PROCEDURE", title: "Procedure / Surgery", desc: "In-clinic procedure or surgery", icon: "✂️" },
  { id: "EMERGENCY", title: "Emergency Visit", desc: "Trauma or acute care", icon: "🚑" },
  { id: "FOLLOWUP", title: "Follow-up Visit", desc: "Reviewing previous consultation", icon: "📅" },
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
    },
  });

  const visitType = watch("visit_type");

  useEffect(() => {
    if (isOpen) {
      reset();
      setDocuments([]);
      setStep(1);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    const processArr = (val) => typeof val === "string" ? val.split(",").map(s => s.trim()).filter(Boolean) : val;
    
    const payload = {
      ...data,
      patient_id: patientId,
      documents,
      symptoms: processArr(data.symptoms),
      tests_ordered: processArr(data.tests_ordered),
      scan_types: processArr(data.scan_types),
    };
    
    Object.keys(payload).forEach(key => {
      if (payload[key] === "" || payload[key] === undefined) {
        delete payload[key];
      }
    });

    try {
      await createRecord(payload);
      onClose();
    } catch (err) {
      console.error(err);
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
              <p className="text-xs text-slate-500">Step {step} of 2 - {step === 1 ? "Select Visit Type" : "Fill Clinical Details"}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="add-record-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {VISIT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setValue("visit_type", type.id, { shouldValidate: true });
                      setStep(2);
                    }}
                    className={`flex flex-col items-start rounded-xl border-2 p-5 text-left transition-all ${
                      visitType === type.id
                        ? "border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="mb-3 text-3xl">{type.icon}</span>
                    <h3 className="font-semibold text-slate-800">{type.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{type.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 p-5 border border-slate-200">
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">Date *</label>
                    <Input type={(visitType === "EMERGENCY") ? "datetime-local" : "date"} {...register("visit_date")} />
                  </div>
                  {["CONSULTATION", "PRESCRIPTION", "SCAN", "PROCEDURE", "EMERGENCY", "FOLLOWUP"].includes(visitType) && (
                    <div className="sm:col-span-2">
                       <label className="mb-1 block text-sm font-semibold text-slate-700">Reason / Chief Complaint *</label>
                       <Textarea {...register("chief_complaint")} className="h-16" placeholder="Patient's primary complaint..." />
                       {errors.chief_complaint && <span className="text-xs text-red-500">{errors.chief_complaint.message}</span>}
                    </div>
                  )}
                </div>

                {visitType === "CONSULTATION" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm">Diagnosis *</label><Input {...register("diagnosis")} /></div>
                    <div>
                      <label className="mb-1 block text-sm">Severity *</label>
                      <select {...register("severity")} className="w-full rounded-md border p-2">
                        <option value="MILD">Mild</option><option value="MODERATE">Moderate</option>
                        <option value="SEVERE">Severe</option><option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div><label className="mb-1 block text-sm">Symptoms</label><Input {...register("symptoms")} placeholder="Fever, Cough" /></div>
                    <div><label className="mb-1 block text-sm">Duration</label><Input {...register("symptom_duration")} placeholder="e.g. 3 days" /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Examination Findings</label><Textarea {...register("examination_findings")} /></div>
                  </div>
                )}

                {visitType === "PRESCRIPTION" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div><label className="mb-1 block text-sm">Diagnosis</label><Input {...register("diagnosis")} /></div>
                     <div><label className="mb-1 block text-sm">Confirm No Allergies *</label><Input {...register("drug_allergies_check")} placeholder="NKDA confirmed" /></div>
                     <div className="sm:col-span-2"><label className="mb-1 block text-sm">Valid Until (Expiry) *</label><Input type="date" {...register("follow_up_date")} /></div>
                  </div>
                )}

                {visitType === "LAB_TEST" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Clinical Indication *</label><Input {...register("clinical_indication")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Tests Ordered *</label><Input {...register("tests_ordered")} placeholder="CBC, LFT, KFT (comma separated)" /></div>
                    <div>
                      <label className="mb-1 block text-sm">Priority</label>
                      <select {...register("priority")} className="w-full rounded-md border p-2">
                        <option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option><option value="STAT">STAT</option>
                      </select>
                    </div>
                    <div><label className="mb-1 block text-sm">Fasting Hours</label><Input type="number" {...register("fasting_hours")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Lab Instructions</label><Textarea {...register("lab_instructions")} /></div>
                  </div>
                )}

                {visitType === "SCAN" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm">Scan Types *</label><Input {...register("scan_types")} placeholder="MRI, CT" /></div>
                    <div><label className="mb-1 block text-sm">Body Part *</label><Input {...register("body_part")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Clinical History</label><Textarea {...register("history")} /></div>
                  </div>
                )}

                {visitType === "PROCEDURE" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm">Procedure Name *</label><Input {...register("procedure_name")} /></div>
                    <div><label className="mb-1 block text-sm">Procedure Type *</label><Input {...register("procedure_type")} /></div>
                    <div><label className="mb-1 block text-sm">Anesthesia Type *</label><Input {...register("anesthesia_type")} /></div>
                    <div><label className="mb-1 block text-sm">Surgeon Info *</label><Input {...register("treatment_given")} /></div>
                    <div><label className="mb-1 block text-sm">Pre-Op Diagnosis *</label><Input {...register("pre_op_diagnosis")} /></div>
                    <div><label className="mb-1 block text-sm">Post-Op Diagnosis *</label><Input {...register("post_op_diagnosis")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Procedure Details *</label><Textarea {...register("procedure_details")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Post-Op Instructions *</label><Textarea {...register("post_op_instructions")} /></div>
                  </div>
                )}

                {visitType === "EMERGENCY" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div><label className="mb-1 block text-sm">Mode of Arrival *</label><Input {...register("mode_of_arrival")} /></div>
                    <div>
                      <label className="mb-1 block text-sm">Triage Level *</label>
                      <select {...register("triage_level")} className="w-full rounded-md border p-2">
                        <option value="RESUSCITATION">1-Resuscitation</option><option value="EMERGENT">2-Emergent</option>
                        <option value="URGENT">3-Urgent</option><option value="LESS_URGENT">4-Less Urgent</option><option value="NON_URGENT">5-Non Urgent</option>
                      </select>
                    </div>
                    <div><label className="mb-1 block text-sm">Working Diagnosis *</label><Input {...register("diagnosis")} /></div>
                    <div><label className="mb-1 block text-sm">Disposition *</label><Input {...register("disposition")} placeholder="Admitted, Discharged..." /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Brief History *</label><Textarea {...register("history")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Examination Findings *</label><Textarea {...register("examination_findings")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Immediate Treatment *</label><Textarea {...register("treatment_given")} /></div>
                  </div>
                )}

                {visitType === "FOLLOWUP" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm">Patient Progress *</label>
                      <select {...register("patient_progress")} className="w-full rounded-md border p-2">
                        <option value="IMPROVED">Improved</option><option value="UNCHANGED">Unchanged</option>
                        <option value="WORSENED">Worsened</option><option value="RESOLVED">Resolved</option>
                      </select>
                    </div>
                    <div><label className="mb-1 block text-sm">Current Symptoms</label><Input {...register("symptoms")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Examination Findings *</label><Textarea {...register("examination_findings")} /></div>
                    <div className="sm:col-span-2"><label className="mb-1 block text-sm">Assessment *</label><Textarea {...register("assessment")} /></div>
                  </div>
                )}

                {["CONSULTATION", "PRESCRIPTION", "PROCEDURE", "EMERGENCY", "FOLLOWUP"].includes(visitType) && (
                   <PrescriptionSubSection control={control} register={register} errors={errors} />
                )}

                {["CONSULTATION", "PROCEDURE", "FOLLOWUP"].includes(visitType) && (
                  <div className="grid gap-4 sm:grid-cols-2 mt-4">
                    <div><label className="mb-1 block text-sm">Next Follow-up Date</label><Input type="date" {...register("follow_up_date")} /></div>
                    <div><label className="mb-1 block text-sm">Instructions</label><Input {...register("follow_up_instructions")} /></div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <CloudinaryUpload 
                    docType={visitType === "LAB_TEST" ? "LAB_REPORT" : visitType === "SCAN" ? "SCAN_REPORT" : "OTHER"}
                    uploadedFiles={documents}
                    onUploadSuccess={(newDocs) => setDocuments([...documents, ...newDocs])}
                    onRemoveFile={(index) => {
                      const newDocs = [...documents];
                      newDocs.splice(index, 1);
                      setDocuments(newDocs);
                    }}
                  />
                  {errors && Object.keys(errors).length > 0 && (
                    <div className="mt-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
                      <strong>Please fix the errors above: </strong>
                      {Object.keys(errors).map(k => errors[k]?.message).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t bg-slate-50 px-6 py-4">
          <Button type="button" onClick={step === 2 ? () => setStep(1) : onClose} variant="outline" disabled={isSubmitting}>
             {step === 2 ? <><ChevronLeft className="mr-1" size={16} /> Back</> : "Cancel"}
          </Button>
          
          {step === 1 ? (
             <Button type="button" onClick={() => setStep(2)} disabled={!visitType}>
              Continue <ChevronRight className="ml-1" size={16} />
            </Button>
          ) : (
            <Button type="submit" form="add-record-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? "Saving..." : "Save Medical Record"}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
