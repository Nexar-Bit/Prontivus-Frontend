"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Job = {
  id: number;
  type: "patients" | "appointments" | "clinical" | "financial";
  status: "pending" | "running" | "completed" | "failed" | "rolled_back";
  input_format: "csv" | "json";
  source_name?: string;
  created_at: string;
  stats?: any;
  errors?: any;
};

export default function MigrationPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<Job["type"]>("patients");
  const [format, setFormat] = useState<Job["input_format"]>("csv");
  const [file, setFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) loadJobs();
  }, [isAuthenticated, isLoading]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/migration/jobs", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load jobs");
      setJobs(await res.json());
    } catch (e: any) {
      toast.error(e?.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const createJob = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/migration/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, input_format: format, source_name: sourceName || undefined }),
      });
      if (!res.ok) throw new Error("Failed to create job");
      const job = await res.json();
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`/api/migration/jobs/${job.id}/upload`, { method: "POST", body: fd, credentials: "include" });
        if (!up.ok) throw new Error("Upload failed");
      }
      await loadJobs();
      setFile(null);
      setSourceName("");
      toast.success("Migration job created");
    } catch (e: any) {
      toast.error(e?.message || "Error creating job");
    } finally {
      setLoading(false);
    }
  };

  const rollback = async (id: number) => {
    if (!confirm("Rollback this migration?")) return;
    try {
      await fetch(`/api/migration/jobs/${id}/rollback`, { method: "POST", credentials: "include" });
      await loadJobs();
      toast.success("Rollback requested");
    } catch (e: any) {
      toast.error(e?.message || "Failed to rollback");
    }
  };

  const summary = useMemo(() => {
    const total = jobs.length;
    const counts = {
      completed: jobs.filter(j => j.status === "completed").length,
      running: jobs.filter(j => j.status === "running").length,
      pending: jobs.filter(j => j.status === "pending").length,
      failed: jobs.filter(j => j.status === "failed").length,
    };
    const progress = total ? Math.round((counts.completed / total) * 100) : 0;
    return { total, ...counts, progress };
  }, [jobs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0F4C75]">Data Migration</h1>
        <p className="text-gray-600 mt-2">Create, monitor and rollback migration jobs</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Progress</CardDescription>
            <CardTitle className="text-2xl">{summary.progress}%</CardTitle>
          </CardHeader>
        </Card>
        <Card><CardHeader className="pb-2"><CardDescription>Completed</CardDescription><CardTitle className="text-2xl text-green-600">{summary.completed}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Running</CardDescription><CardTitle className="text-2xl text-blue-600">{summary.running}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Pending</CardDescription><CardTitle className="text-2xl text-gray-600">{summary.pending}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Failed</CardDescription><CardTitle className="text-2xl text-red-600">{summary.failed}</CardTitle></CardHeader></Card>
      </div>

      {/* Create Job */}
      <Card>
        <CardHeader>
          <CardTitle>Create Migration Job</CardTitle>
          <CardDescription>Upload data and start migration</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <div className="w-48">
            <Select value={type} onValueChange={v => setType(v as Job["type"])}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="patients">Patients</SelectItem>
                <SelectItem value="appointments">Appointments</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-40">
            <Select value={format} onValueChange={v => setFormat(v as Job["input_format"])}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1"><Input placeholder="Source name (optional)" value={sourceName} onChange={e => setSourceName(e.target.value)} /></div>
          <input type="file" aria-label="Upload data file" onChange={e => setFile(e.target.files?.[0] || null)} />
          <Button onClick={createJob} disabled={loading}>{loading ? "Processing..." : "Start Migration"}</Button>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({jobs.length})</CardTitle>
          <CardDescription>Recent migration jobs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {jobs.map(j => (
            <div key={j.id} className="border rounded p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">#{j.id} • {j.type} • {j.status}</div>
                  <div className="text-sm text-gray-600">Created {new Date(j.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={j.status === 'completed' ? 'default' : j.status === 'failed' ? 'destructive' : 'secondary'}>{j.status}</Badge>
                  <Button variant="outline" size="sm" onClick={() => rollback(j.id)} disabled={j.status === 'running'}>Rollback</Button>
                </div>
              </div>
              {j.stats ? <pre className="text-xs mt-2 bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(j.stats, null, 2)}</pre> : null}
              {j.errors ? <pre className="text-xs mt-2 bg-red-50 p-2 rounded overflow-x-auto">{JSON.stringify(j.errors, null, 2)}</pre> : null}
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="text-sm text-muted-foreground">No jobs yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

