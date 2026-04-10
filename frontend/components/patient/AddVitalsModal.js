"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import usePatients from "@/hooks/usePatients";

const vitalsSchema = z.object({
  blood_pressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/, "Format: 120/80"),
  temperature: z.coerce.number().min(90, "Min 90°").max(110, "Max 110°"),
  weight: z.coerce.number().min(1, "Weight required").max(500),
  pulse: z.coerce.number().min(30, "Min 30").max(250, "Max 250"),
  spo2: z.coerce.number().min(50, "Min 50%").max(100, "Max 100%"),
});

export default function AddVitalsModal({ isOpen, onClose, patientId }) {
  const { addVitals } = usePatients();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(vitalsSchema),
    defaultValues: {
      blood_pressure: "",
      temperature: "",
      weight: "",
      pulse: "",
      spo2: "",
    },
  });

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const onSubmit = async (data) => {
    try {
      await addVitals({ patientId, ...data });
      onClose();
    } catch (err) {
      // errors handled by usePatients toast
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Vitals"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" form="add-vitals-form" disabled={isSubmitting} loading={isSubmitting}>
            Save Vitals
          </Button>
        </>
      }
    >
      <form id="add-vitals-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        <div className="space-y-4">
          <Input 
            label="Blood Pressure (mmHg)" 
            placeholder="e.g., 120/80" 
            error={errors.blood_pressure?.message} 
            {...register("blood_pressure")} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Heart Rate (bpm)" 
              type="number" 
              placeholder="e.g., 75" 
              error={errors.pulse?.message} 
              {...register("pulse")} 
            />
            <Input 
              label="SpO2 (%)" 
              type="number" 
              placeholder="e.g., 98" 
              error={errors.spo2?.message} 
              {...register("spo2")} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Temperature (°F)" 
              type="number" 
              step="0.1" 
              placeholder="e.g., 98.6" 
              error={errors.temperature?.message} 
              {...register("temperature")} 
            />
            <Input 
              label="Weight (kg)" 
              type="number" 
              step="0.1" 
              placeholder="e.g., 70.5" 
              error={errors.weight?.message} 
              {...register("weight")} 
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
