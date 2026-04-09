import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MEDICINE_TYPES = ["TABLET", "CAPSULE", "SYRUP", "INJECTION", "DROPS", "INHALER", "CREAM", "PATCH", "OTHER"];
const FREQUENCIES = ["OD", "BD", "TDS", "QID", "Q6H", "Q8H", "Q12H", "SOS", "AC", "PC", "HS"];
const ROUTES = ["ORAL", "TOPICAL", "IV", "IM", "SC", "INH", "SL"];

export default function PrescriptionSubSection({ control, register, errors }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "prescriptions",
  });

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 mt-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900">Prescriptions</h3>
          <p className="text-xs text-blue-600">Add detailed medication instructions</p>
        </div>
        <Button
          type="button"
          onClick={() => append({
            medicine_name: "", medicine_type: "TABLET", dosage: "", frequency: "OD",
            duration_value: 1, duration_unit: "Days", route: "ORAL", special_instructions: "", refills_allowed: 0
          })}
          className="h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus size={16} /> Add Medicine
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-white py-8 text-center text-sm text-slate-500">
          No medicines prescribed yet. Click &quot;Add Medicine&quot; to start.
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
              <button
                type="button"
                onClick={() => remove(index)}
                className="absolute right-3 top-3 rounded-full bg-slate-50 p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                title="Remove Medicine"
              >
                <Trash2 size={16} />
              </button>

              <div className="grid gap-x-4 gap-y-3 pr-10 sm:grid-cols-2 lg:grid-cols-12">
                {/* Main Row */}
                <div className="lg:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Medicine Name *</label>
                  <Input className="h-9" placeholder="e.g. Paracetamol" {...register(`prescriptions.${index}.medicine_name`)} />
                  {errors?.prescriptions?.[index]?.medicine_name && (
                    <span className="text-[10px] text-red-500">{errors.prescriptions[index].medicine_name.message}</span>
                  )}
                </div>
                
                <div className="lg:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Type *</label>
                  <select className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" {...register(`prescriptions.${index}.medicine_type`)}>
                    {MEDICINE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Dosage *</label>
                  <Input className="h-9" placeholder="e.g. 500mg" {...register(`prescriptions.${index}.dosage`)} />
                  {errors?.prescriptions?.[index]?.dosage && (
                    <span className="text-[10px] text-red-500">{errors.prescriptions[index].dosage.message}</span>
                  )}
                </div>

                <div className="lg:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Frequency *</label>
                  <select className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" {...register(`prescriptions.${index}.frequency`)}>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Secondary Row */}
                <div className="lg:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Duration *</label>
                  <div className="flex gap-2">
                    <Input type="number" className="h-9 w-full" min="1" {...register(`prescriptions.${index}.duration_value`)} />
                    <select className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-2 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" {...register(`prescriptions.${index}.duration_unit`)}>
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                    </select>
                  </div>
                  {errors?.prescriptions?.[index]?.duration_value && (
                    <span className="text-[10px] text-red-500">{errors.prescriptions[index].duration_value.message}</span>
                  )}
                </div>

                <div className="lg:col-span-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Route</label>
                  <select className="h-9 w-full rounded-md border border-slate-300 bg-transparent px-3 py-1 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" {...register(`prescriptions.${index}.route`)}>
                    {ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Instructions (Optional)</label>
                  <Input className="h-9" placeholder="Take with water..." {...register(`prescriptions.${index}.special_instructions`)} />
                </div>

                <div className="lg:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Refills</label>
                  <Input type="number" className="h-9" min="0" max="5" {...register(`prescriptions.${index}.refills_allowed`)} />
                </div>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
