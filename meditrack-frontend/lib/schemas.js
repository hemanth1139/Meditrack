import * as z from "zod";

// Base schema shared by all categories
const baseRecordSchema = z.object({
  visit_type: z.enum([
    "CONSULTATION", "PRESCRIPTION", "LAB_TEST",
    "SCAN", "PROCEDURE", "EMERGENCY", "FOLLOWUP"
  ]),
  visit_date: z.string().min(1, "Date is required"),
  documents: z.array(
    z.object({
      doc_type: z.string(),
      label: z.string(),
      cloudinary_url: z.string(),
      cloudinary_public_id: z.string(),
      file_type: z.string()
    })
  ).optional().default([]),
});

export const prescriptionItemSchema = z.object({
  medicine_name: z.string().min(1, "Medicine name required"),
  medicine_type: z.enum([
    "TABLET", "CAPSULE", "SYRUP", "INJECTION",
    "DROPS", "INHALER", "CREAM", "PATCH", "OTHER"
  ]),
  dosage: z.string().min(1, "Dosage required"),
  frequency: z.enum([
    "OD", "BD", "TDS", "QID", "Q6H", "Q8H", "Q12H", "SOS", "AC", "PC", "HS"
  ]),
  duration_value: z.coerce.number().min(1, "Required"),
  duration_unit: z.enum(["Days", "Weeks", "Months"]),
  route: z.enum(["ORAL", "TOPICAL", "IV", "IM", "SC", "INH", "SL"]),
  special_instructions: z.string().optional(),
  refills_allowed: z.coerce.number().min(0).max(5).default(0),
});

const consultationSchema = baseRecordSchema.extend({
  visit_type: z.literal("CONSULTATION"),
  chief_complaint: z.string().min(5, "Chief complaint required"),
  history: z.string().optional(),
  symptoms: z.array(z.string()).default([]),
  symptom_duration: z.string().optional(),
  examination_findings: z.string().optional(),
  diagnosis: z.string().min(3, "Diagnosis required"),
  severity: z.enum(["MILD", "MODERATE", "SEVERE", "CRITICAL"]),
  treatment_given: z.string().optional(),
  doctor_notes: z.string().optional(),
  follow_up_required: z.boolean().default(false),
  follow_up_date: z.string().optional(),
  follow_up_instructions: z.string().optional(),
  prescriptions: z.array(prescriptionItemSchema).optional().default([]),
});

const prescriptionOnlySchema = baseRecordSchema.extend({
  visit_type: z.literal("PRESCRIPTION"),
  chief_complaint: z.string().min(5, "Reason for prescription required"),
  diagnosis: z.string().optional(),
  drug_allergies_check: z.string().min(5, "Must confirm patient has no allergy to prescribed drugs"),
  doctor_notes: z.string().optional(), // Used for Pharmacist Notes or additional
  follow_up_date: z.string().min(1, "Valid Until date required"), // Expiry
  prescriptions: z.array(prescriptionItemSchema).min(1, "At least one prescription is required"),
});

const labTestSchema = baseRecordSchema.extend({
  visit_type: z.literal("LAB_TEST"),
  clinical_indication: z.string().min(5, "Clinical Indication required"),
  diagnosis: z.string().optional(),
  tests_ordered: z.array(z.string()).min(1, "Select at least one test"),
  priority: z.enum(["ROUTINE", "URGENT", "STAT"]),
  fasting_required: z.boolean().default(false),
  fasting_hours: z.coerce.number().optional(),
  lab_instructions: z.string().optional(),
  lab_results: z.string().optional(),
});

const scanSchema = baseRecordSchema.extend({
  visit_type: z.literal("SCAN"),
  chief_complaint: z.string().min(5, "Reason for Scan required"), // reason for scan
  scan_types: z.array(z.string()).min(1, "Select at least one scan type"),
  body_part: z.string().min(3, "Body Part / Region required"),
  history: z.string().optional(), // clinical history for radiologist
  contrast_required: z.boolean().default(false),
  radiologist_report: z.string().optional(),
  priority: z.enum(["ROUTINE", "URGENT", "EMERGENCY"]).default("ROUTINE"),
});

const procedureSchema = baseRecordSchema.extend({
  visit_type: z.literal("PROCEDURE"),
  procedure_name: z.string().min(3, "Procedure Name required"),
  chief_complaint: z.string().min(5, "Indication required"), // indication
  procedure_type: z.string().min(1, "Procedure Type required"),
  anesthesia_type: z.string().min(1, "Anesthesia Type required"),
  pre_op_diagnosis: z.string().min(3, "Pre-operative Diagnosis required"),
  post_op_diagnosis: z.string().min(3, "Post-operative Diagnosis required"),
  procedure_details: z.string().min(10, "Procedure Details required"),
  treatment_given: z.string().min(3, "Surgeon/Doctor info required"), // surgeon
  symptom_duration: z.coerce.string().optional(), // duration of procedure in mins (string to fit existing field)
  complications: z.string().optional(), // None if empty
  lab_instructions: z.string().optional(), // specimens sent
  post_op_instructions: z.string().min(5, "Post-operative Instructions required"),
  follow_up_date: z.string().optional(),
  follow_up_instructions: z.string().optional(),
});

const emergencySchema = baseRecordSchema.extend({
  visit_type: z.literal("EMERGENCY"),
  visit_date: z.string(), // Time of arrival
  chief_complaint: z.string().min(5, "Chief Complaint required"),
  mode_of_arrival: z.string().min(1, "Mode of Arrival required"),
  triage_level: z.string().min(1, "Triage Level required"),
  history: z.string().min(5, "Brief History required"),
  examination_findings: z.string().min(5, "Physical Examination required"),
  treatment_given: z.string().min(5, "Immediate Treatment Given required"),
  diagnosis: z.string().min(3, "Working Diagnosis required"),
  disposition: z.string().min(1, "Disposition required"),
  doctor_notes: z.string().optional(), // Ward/bed and emergency notes
  tests_ordered: z.array(z.string()).optional().default([]),
});

const followupSchema = baseRecordSchema.extend({
  visit_type: z.literal("FOLLOWUP"),
  chief_complaint: z.string().min(5, "Reason for Follow-up required"),
  patient_progress: z.string().min(1, "Patient Reported Progress required"),
  symptoms: z.array(z.string()).optional().default([]), // Current symptoms
  examination_findings: z.string().min(3, "Examination Findings required"),
  assessment: z.string().min(5, "Assessment required"),
  treatment_given: z.string().optional(), // Changes to Treatment
  prescriptions: z.array(prescriptionItemSchema).optional().default([]),
  tests_ordered: z.array(z.string()).optional().default([]),
  follow_up_date: z.string().optional(),
  follow_up_instructions: z.string().optional(),
});

export const recordFormSchema = z.discriminatedUnion("visit_type", [
  consultationSchema,
  prescriptionOnlySchema,
  labTestSchema,
  scanSchema,
  procedureSchema,
  emergencySchema,
  followupSchema,
]);
