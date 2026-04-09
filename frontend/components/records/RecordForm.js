"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from "@/components/records/FileUpload";
import { Scan } from "lucide-react";
import QRScannerModal from "@/components/shared/QRScannerModal";

export default function RecordForm({ initialPatientId, onSubmit, submitting, showPendingInfo }) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      patient_id: initialPatientId || "",
      visit_type: "",
      visit_date: "",
      diagnosis: "",
      notes: "",
      file: null,
    },
  });

  const file = watch("file");

  useEffect(() => {
    if (initialPatientId) setValue("patient_id", initialPatientId);
  }, [initialPatientId, setValue]);

  // Hook up visit_type secretly to react-hook-form so validation works
  useEffect(() => { register("visit_type", { required: true }); }, [register]);

  const submit = async (values) => {
    if (!values.patient_id) return toast.error("Patient ID is required");
    if (!values.visit_type) return toast.error("Record type is required");
    await onSubmit(values);
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit, () => toast.error("Please fill all required fields"))}>
      {showPendingInfo ? (
        <div className="rounded-lg border border-border bg-amber-50 p-3 text-[14px] text-amber-800">
          This record will be sent to the assigned doctor for approval.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-[13px] font-medium">Patient ID</label>
          <div className="flex gap-2">
            <Input className="flex-1" placeholder="Enter patient ID" {...register("patient_id", { required: "Patient ID is required" })} />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setScannerOpen(true)}
              title="Scan QR Code"
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
          {errors.patient_id && <span className="text-xs text-red-500">{errors.patient_id.message}</span>}
        </div>
        <div className="grid gap-2">
          <label className="text-[13px] font-medium">Record type</label>
          <input type="hidden" {...register("visit_type", { required: "Record type is required" })} />
          <Select 
            value={watch("visit_type")} 
            onValueChange={(v) => setValue("visit_type", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CONSULTATION">Consultation & Prescription</SelectItem>
              <SelectItem value="LAB_DIAGNOSTICS">Lab & Diagnostics</SelectItem>
              <SelectItem value="PROCEDURE_EMERGENCY">Procedure & Emergency</SelectItem>
            </SelectContent>
          </Select>
          {errors.visit_type && <span className="text-xs text-red-500">{errors.visit_type.message}</span>}
        </div>
        <div className="grid gap-2">
          <label className="text-[13px] font-medium">Visit date</label>
          <Input type="date" {...register("visit_date", { required: "Visit date is required" })} />
          {errors.visit_date && <span className="text-xs text-red-500">{errors.visit_date.message}</span>}
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-[13px] font-medium">Diagnosis</label>
        <Textarea {...register("diagnosis", { required: "Diagnosis is required" })} rows={4} />
        {errors.diagnosis && <span className="text-xs text-red-500">{errors.diagnosis.message}</span>}
      </div>
      <div className="grid gap-2">
        <label className="text-[13px] font-medium">Notes</label>
        <Textarea {...register("notes", { required: "Notes are required" })} rows={4} />
        {errors.notes && <span className="text-xs text-red-500">{errors.notes.message}</span>}
      </div>

      <FileUpload value={file} onChange={(f) => setValue("file", f, { shouldValidate: true })} />

      <div className="flex justify-end">
        <Button disabled={submitting} type="submit">{submitting ? "Submitting..." : "Submit"}</Button>
      </div>

      <QRScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(id) => {
          setValue("patient_id", id, { shouldValidate: true });
          toast.success("Patient scanned successfully");
        }}
      />
    </form>
  );
}

