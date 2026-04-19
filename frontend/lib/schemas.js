import * as z from "zod";

export const prescriptionItemSchema = z.object({
  medicine_name: z.string().min(1, "Required"),
  medicine_type: z.enum([
    "TABLET", "CAPSULE", "SYRUP", "INJECTION",
    "DROPS", "INHALER", "CREAM", "OTHER"
  ]),
  dosage: z.string().min(1, "Required"),
  frequency: z.enum([
    "OD", "BD", "TDS", "QID", "Q8H", "AC", "PC", "HS", "SOS"
  ]),
  duration_value: z.coerce.number().min(1),
  duration_unit: z.enum(["Days", "Weeks", "Months"]),
  route: z.enum(["ORAL", "TOPICAL", "IV", "IM", "INH", "INHALATION"]),
  special_instructions: z.string().optional(),
});

export const consultationSchema = z.object({
  visit_type: z.literal("CONSULTATION"),
  chief_complaint: z.string().min(3, "Required"),
  diagnosis: z.string().min(3, "Required"),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "CRITICAL"]),
  symptoms: z.array(z.string()).optional(),
  symptom_duration: z.string().optional(),
  examination_findings: z.string().optional(),
  treatment_given: z.string().optional(),
  prescriptions: z.array(prescriptionItemSchema).optional(),
  doctor_notes: z.string().optional(),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional(),
  follow_up_instructions: z.string().optional(),
  is_followup: z.boolean().default(false),
  patient_progress: z.string().optional(),
});

export const labSchema = z.object({
  visit_type: z.literal("LAB_DIAGNOSTICS"),
  clinical_indication: z.string().min(3, "Required"),
  suspected_diagnosis: z.string().optional(),
  tests_ordered: z.array(z.string()).min(1, "Select at least one test"),
  body_part: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]).default("ROUTINE"),
  fasting_required: z.boolean().default(false),
  fasting_hours: z.coerce.number().optional(),
  special_instructions: z.string().optional(),
  results_interpretation: z.string().optional(),
  doctor_notes: z.string().optional(),
  documents: z.array(z.any()).optional(),
});

export const procedureEmergencySchema = z.object({
  visit_type: z.literal("PROCEDURE_EMERGENCY"),
  sub_type: z.enum(["PROCEDURE", "EMERGENCY"]).optional(),
  
  // Procedure fields
  procedure_name: z.string().optional(),
  procedure_type: z.string().optional(),
  indication: z.string().optional(),
  anesthesia_type: z.string().optional(),
  pre_op_diagnosis: z.string().optional(),
  post_op_diagnosis: z.string().optional(),
  procedure_details: z.string().optional(),
  complications: z.string().optional(),
  post_op_instructions: z.string().optional(),
  documents: z.array(z.any()).optional(),

  // Emergency fields
  arrival_time: z.string().optional(),
  presenting_problem: z.string().optional(),
  mode_of_arrival: z.string().optional(),
  triage_level: z.string().optional(),
  gcs_score: z.coerce.number().optional(),
  immediate_treatment: z.string().optional(),
  working_diagnosis: z.string().optional(),
  disposition: z.string().optional(),
  vitals: z.any().optional(),

  // Emergency form aliases (remapped to chief_complaint / treatment_given before submission)
  presenting_problem: z.string().optional(),
  immediate_treatment: z.string().optional(),

  // Common
  doctor_notes: z.string().optional(),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional(),
});

export const recordFormSchema = z.discriminatedUnion("visit_type", [
  consultationSchema,
  labSchema,
  procedureEmergencySchema,
]);
