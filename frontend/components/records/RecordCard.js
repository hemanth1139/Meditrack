"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatDate } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, Image as ImageIcon, Download } from "lucide-react";

const VISIT_META = {
  CONSULTATION: { icon: "🩺", label: "Consultation & Prescription" },
  LAB_DIAGNOSTICS: { icon: "🔬", label: "Lab & Diagnostics" },
  PROCEDURE_EMERGENCY: { icon: "🏥", label: "Procedure / Emergency" },
};


function Section({ label, children }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="text-[13px] text-slate-700">
      <span className="font-semibold text-slate-800">{label}: </span>
      {Array.isArray(value) ? value.join(", ") : String(value)}
    </div>
  );
}

export default function RecordCard({ record, onFlag }) {
  const [expanded, setExpanded] = useState(false);
  const meta = VISIT_META[record.visit_type] || { icon: "📄", label: record.visit_type };

  return (
    <Card className="rounded-lg border-border bg-white shadow-card overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{meta.icon}</span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[15px] font-semibold text-slate-900">{meta.label}</span>
              <StatusBadge status={record.status} />
            </div>
            <div className="text-[12px] text-slate-500 mt-0.5">
              {formatDate(record.visit_date)}
              {record.diagnosis && (
                <span className="ml-2 text-slate-600">· {record.diagnosis.slice(0, 60)}{record.diagnosis.length > 60 ? "…" : ""}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onFlag && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500"
              onClick={(e) => { e.stopPropagation(); onFlag(record); }}
            >
              Flag
            </Button>
          )}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-1 text-sm">

          {/* CONSULTATION fields */}
          {record.visit_type === "CONSULTATION" && (
            <>
              <Field label="Chief Complaint" value={record.chief_complaint} />
              <Field label="Symptoms" value={record.symptoms} />
              <Field label="Symptom Duration" value={record.symptom_duration} />
              <Field label="Examination" value={record.examination_findings} />
              <Field label="Diagnosis" value={record.diagnosis} />
              <Field label="Severity" value={record.severity} />
              <Field label="Treatment Given" value={record.treatment_given} />
              <Field label="Follow-up" value={record.follow_up_required ? `Yes – ${record.follow_up_date || ""}` : "No"} />
              <Field label="Follow-up Instructions" value={record.follow_up_instructions} />

              {record.prescriptions?.length > 0 && (
                <Section label="Prescriptions">
                  <div className="space-y-2 mt-1">
                    {record.prescriptions.map((rx, i) => (
                      <div key={rx.id || i} className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[13px]">
                        <span className="font-semibold text-blue-900">{rx.medicine_name}</span>
                        <span className="text-slate-600 ml-1">({rx.medicine_type})</span>
                        {" · "}{rx.dosage} · {rx.frequency} · {rx.duration_value} {rx.duration_unit}
                        {rx.route && <span className="ml-1 text-slate-500">({rx.route})</span>}
                        {rx.special_instructions && <div className="text-slate-500 mt-0.5 text-[12px]">{rx.special_instructions}</div>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* LAB fields */}
          {record.visit_type === "LAB_DIAGNOSTICS" && (
            <>
              <Field label="Clinical Indication" value={record.clinical_indication} />
              <Field label="Suspected Diagnosis" value={record.suspected_diagnosis} />
              <Field label="Tests Ordered" value={record.tests_ordered} />
              <Field label="Priority" value={record.priority} />
              <Field label="Fasting Required" value={record.fasting_required ? `Yes – ${record.fasting_hours || ""}h` : "No"} />
              <Field label="Special Instructions" value={record.lab_instructions || record.special_instructions} />
              <Field label="Results / Interpretation" value={record.results_interpretation} />
            </>
          )}

          {/* PROCEDURE/EMERGENCY fields */}
          {record.visit_type === "PROCEDURE_EMERGENCY" && (
            <>
              <Field label="Sub-type" value={record.sub_type} />
              <Field label="Procedure Name" value={record.procedure_name} />
              <Field label="Procedure Type" value={record.procedure_type} />
              <Field label="Indication" value={record.indication} />
              <Field label="Anesthesia" value={record.anesthesia_type} />
              <Field label="Pre-op Diagnosis" value={record.pre_op_diagnosis} />
              <Field label="Post-op Diagnosis" value={record.post_op_diagnosis} />
              <Field label="Complications" value={record.complications} />
              <Field label="Post-op Instructions" value={record.post_op_instructions} />
              <Field label="Triage Level" value={record.triage_level} />
              <Field label="Mode of Arrival" value={record.mode_of_arrival} />
              <Field label="GCS Score" value={record.gcs_score} />
              <Field label="Presenting Problem" value={record.presenting_problem} />
              <Field label="Immediate Treatment" value={record.immediate_treatment} />
              <Field label="Disposition" value={record.disposition} />
            </>
          )}

          {/* Documents */}
          {record.documents?.length > 0 && (
            <Section label={`Uploaded Documents (${record.documents.length})`}>
              <div className="space-y-2 mt-1">
                {record.documents.map((doc, i) => {
                  // Force Cloudinary to serve as a download attachment to bypass Chrome's cross-origin PDF viewer blocks
                  const url = doc.cloudinary_url ? doc.cloudinary_url.replace('/upload/', '/upload/fl_attachment/') : null;
                  return (
                    <div
                      key={doc.id || i}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-[13px] text-slate-700">
                        {doc.file_type === "pdf"
                          ? <FileText size={14} className="text-red-500" />
                          : <ImageIcon size={14} className="text-blue-500" />}
                        <span className="font-medium">{doc.label || doc.doc_type}</span>
                        <span className="text-[11px] uppercase text-slate-400 ml-1">{doc.file_type}</span>
                      </div>
                      {url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:underline"
                        >
                          <Download size={12} /> View / Download
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}
        </div>
      )}
    </Card>
  );
}
