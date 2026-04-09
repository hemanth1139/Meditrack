"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function shortHash(h) {
  if (!h) return "—";
  return h.slice(0, 16) + "...";
}

export default function AdminIntegrityPage() {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const verify = async () => {
    if (!patientId) return toast.error("Enter Patient ID");
    try {
      setLoading(true);
      const res = await api.get(`/integrity/verify/${patientId}/`);
      setResult(res.data.data);
    } catch (e) {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const records = result?.records || [];
  const brokenIndex = records.findIndex((r) => !r.hash_valid || !r.chain_valid);
  const intact = brokenIndex === -1;

  return (
    <div className="space-y-6">
      <div className="text-[24px] font-semibold text-slate-900">Hash Chain Integrity Verifier</div>

      <Card className="rounded-lg border-border bg-white p-6 shadow-card">
        <div className="text-[14px] text-slate-600">
          Hash chaining links approved records together so tampering can be detected. Each approved record stores a SHA-256
          hash of its data and the hash of the previous approved record.
        </div>
      </Card>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1">
            <div className="text-[13px] font-medium text-slate-900">Patient ID</div>
            <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="Enter patient ID" />
          </div>
          <Button onClick={verify} disabled={loading}>
            {loading ? "Verifying..." : "Verify Chain"}
          </Button>
        </div>
      </Card>

      {result ? (
        <>
          <Card
            className={[
              "rounded-lg border-border p-4 shadow-card",
              intact ? "bg-green-50" : "bg-red-50",
            ].join(" ")}
          >
            <div className="text-[18px] font-semibold text-slate-900">
              {intact
                ? `Chain Intact — all ${records.length} records verified`
                : `Chain Broken — tampering detected at record #${brokenIndex + 1}`}
            </div>
          </Card>

          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-[2px] bg-slate-200" />
            <div className="grid gap-4">
              {records.map((r, idx) => {
                const valid = r.hash_valid && r.chain_valid;
                return (
                  <div key={r.record_id} className="relative pl-10">
                    <div
                      className={[
                        "absolute left-[10px] top-6 h-3 w-3 rounded-full",
                        valid ? "bg-green-600" : "bg-red-600",
                      ].join(" ")}
                    />
                    <Card className="rounded-lg border-border bg-white p-4 shadow-card">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-[16px] font-medium text-slate-900">
                            Record #{idx + 1} • ID {r.record_id}
                          </div>
                          <div className="mt-2 text-[14px] text-slate-600">
                            Hash: <span className="font-medium text-slate-900">{shortHash(r.record_hash)}</span>
                          </div>
                          <div className="mt-1 text-[14px] text-slate-600">
                            Prev: <span className="font-medium text-slate-900">{shortHash(r.prev_hash)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div
                            className={[
                              "rounded-lg px-3 py-2 text-[14px] font-semibold",
                              valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                            ].join(" ")}
                          >
                            {valid ? "VALID ✓" : "TAMPERED ✗"}
                          </div>
                          <div className="text-[13px] font-medium text-slate-500">
                            hash {r.hash_valid ? "ok" : "bad"} • chain {r.chain_valid ? "ok" : "bad"}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

