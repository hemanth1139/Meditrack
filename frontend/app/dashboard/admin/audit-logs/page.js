"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const ACTIONS = [
  "LOGIN",
  "RECORD_CREATED",
  "RECORD_APPROVED",
  "OTP_SENT",
  "CROSS_HOSPITAL_ACCESS_GRANTED",
  "DOCTOR_APPROVED",
  "RECORD_FLAGGED",
];

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [user, setUser] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/audit/logs/", {
        params: {
          action: action && action !== "ALL" ? action : undefined,
          user: user || undefined,
        },
      });
      setItems(Array.isArray(res.data.data) ? res.data.data : res.data.data?.data || []);
    } catch {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [action, user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="text-[24px] font-semibold text-slate-900">Audit Logs</div>

      <Card className="rounded-lg border-border bg-white p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <div className="text-[13px] font-medium text-slate-900">User ID</div>
            <Input placeholder="Filter by user id" value={user} onChange={(e) => setUser(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <div className="text-[13px] font-medium text-slate-900">Action</div>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="text-[13px] font-medium text-slate-900">Date range</div>
            <div className="text-[14px] text-slate-600">Date range picker UI can be added here.</div>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <Card className="rounded-lg border-border bg-white p-0 shadow-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDate(l.timestamp)}</TableCell>
                  <TableCell>{l.user}</TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell>
                    {l.target_model} #{l.target_id}
                  </TableCell>
                  <TableCell className="max-w-[360px] truncate">{l.description}</TableCell>
                  <TableCell>{l.ip_address || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

