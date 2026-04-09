"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Activity } from "lucide-react";
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

  if (!isOpen) return null;

  const onSubmit = async (data) => {
    try {
      await addVitals({ 
        patientId,
        ...data,
      });
      onClose();
    } catch (err) {
      // errors handled by usePatients toast
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="flex items-center gap-2">
            <Activity className="text-rose-500" size={20} />
            <h2 className="text-lg font-semibold text-slate-800">Record Vitals</h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <form id="add-vitals-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Blood Pressure</label>
              <div className="relative">
                <Input
                  {...register("blood_pressure")}
                  placeholder="e.g., 120/80"
                />
                <span className="absolute right-3 top-2.5 text-sm text-slate-400">mmHg</span>
              </div>
              {errors.blood_pressure && <span className="text-xs text-red-500 mt-1 block">{errors.blood_pressure.message}</span>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Heart Rate (Pulse)</label>
                <div className="relative">
                  <Input
                    type="number"
                    {...register("pulse")}
                    placeholder="e.g., 75"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">bpm</span>
                </div>
                {errors.pulse && <span className="text-xs text-red-500 mt-1 block">{errors.pulse.message}</span>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">SpO2 (Oxygen)</label>
                <div className="relative">
                  <Input
                    type="number"
                    {...register("spo2")}
                    placeholder="e.g., 98"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">%</span>
                </div>
                {errors.spo2 && <span className="text-xs text-red-500 mt-1 block">{errors.spo2.message}</span>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Temperature</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    {...register("temperature")}
                    placeholder="e.g., 98.6"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">°F</span>
                </div>
                {errors.temperature && <span className="text-xs text-red-500 mt-1 block">{errors.temperature.message}</span>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Weight</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    {...register("weight")}
                    placeholder="e.g., 70.5"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-slate-400">kg</span>
                </div>
                {errors.weight && <span className="text-xs text-red-500 mt-1 block">{errors.weight.message}</span>}
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end gap-3 border-t bg-slate-50 px-5 py-4">
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="add-vitals-form" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Vitals"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
