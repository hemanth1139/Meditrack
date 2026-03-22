"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, FilePlus, Plus, Trash2 } from "lucide-react";
import useRecords from "@/hooks/useRecords";

const recordSchema = z.object({
  record_type: z.enum(["OTHER", "PRESCRIPTION", "LAB", "SCAN"]),
  visit_date: z.string().min(1, "Date is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().min(1, "Notes are required"),
  lab_tests_requested: z.string().optional(),
  follow_up_date: z.string().optional(),
  prescriptions: z.array(
    z.object({
      medicine_name: z.string().min(1, "Required"),
      dosage: z.string().min(1, "Required"),
      frequency: z.string().min(1, "Required"),
      duration: z.string().min(1, "Required"),
    })
  ).default([]),
});

export default function AddRecordModal({ isOpen, onClose, patientId }) {
  const { createRecord } = useRecords();
  
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      record_type: "OTHER",
      visit_date: new Date().toISOString().split("T")[0],
      diagnosis: "",
      notes: "",
      follow_up_date: "",
      lab_tests_requested: "",
      prescriptions: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prescriptions",
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      patient_id: patientId,
      lab_tests_requested: data.lab_tests_requested
        ? data.lab_tests_requested.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };
    
    if (!payload.follow_up_date) delete payload.follow_up_date;

    try {
      await createRecord(payload);
      onClose();
    } catch (err) {
      // toast is handled by useRecords
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <FilePlus className="text-blue-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Add Medical Record</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form id="add-record-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Record Type</label>
                <select
                  {...register("record_type")}
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="OTHER">General Consultation (Other)</option>
                  <option value="PRESCRIPTION">Prescription</option>
                  <option value="LAB">Lab Report</option>
                  <option value="SCAN">Scan</option>
                </select>
                {errors.record_type && <span className="text-xs text-red-500 mt-1 block">{errors.record_type.message}</span>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Visit Date</label>
                <Input type="date" {...register("visit_date")} />
                {errors.visit_date && <span className="text-xs text-red-500 mt-1 block">{errors.visit_date.message}</span>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Diagnosis</label>
              <Input {...register("diagnosis")} placeholder="e.g., Viral Fever, Hypertension" />
              {errors.diagnosis && <span className="text-xs text-red-500 mt-1 block">{errors.diagnosis.message}</span>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Clinical Notes</label>
              <Textarea {...register("notes")} placeholder="Detailed observation notes..." className="h-24" />
              {errors.notes && <span className="text-xs text-red-500 mt-1 block">{errors.notes.message}</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Lab Tests Requested</label>
                <Input {...register("lab_tests_requested")} placeholder="e.g., CBC, Lipid Profile (comma separated)" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Follow-up Date</label>
                <Input type="date" {...register("follow_up_date")} />
              </div>
            </div>

            {/* Prescriptions Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Prescriptions</h3>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ medicine_name: "", dosage: "", frequency: "", duration: "" })} className="h-8 gap-1 text-xs">
                  <Plus size={14} /> Add Medicine
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center text-sm text-slate-500">No prescriptions added.</div>
              ) : (
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute right-2 top-2 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="grid gap-3 pr-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2 lg:col-span-1">
                          <label className="mb-1 block text-xs font-medium text-slate-600">Medicine</label>
                          <Input
                            className="h-8 text-sm"
                            {...register(`prescriptions.${index}.medicine_name`)}
                            placeholder="Medicine Name"
                          />
                          {errors?.prescriptions?.[index]?.medicine_name && <span className="text-red-500 text-[10px]">{errors.prescriptions[index].medicine_name.message}</span>}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Dosage</label>
                          <Input
                            className="h-8 text-sm"
                            {...register(`prescriptions.${index}.dosage`)}
                            placeholder="e.g., 500mg"
                          />
                          {errors?.prescriptions?.[index]?.dosage && <span className="text-red-500 text-[10px]">{errors.prescriptions[index].dosage.message}</span>}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Frequency</label>
                          <Input
                            className="h-8 text-sm"
                            {...register(`prescriptions.${index}.frequency`)}
                            placeholder="e.g., 1-0-1"
                          />
                          {errors?.prescriptions?.[index]?.frequency && <span className="text-red-500 text-[10px]">{errors.prescriptions[index].frequency.message}</span>}
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Duration</label>
                          <Input
                            className="h-8 text-sm"
                            {...register(`prescriptions.${index}.duration`)}
                            placeholder="e.g., 5 days"
                          />
                          {errors?.prescriptions?.[index]?.duration && <span className="text-red-500 text-[10px]">{errors.prescriptions[index].duration.message}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-5 py-4">
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-record-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Record"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
