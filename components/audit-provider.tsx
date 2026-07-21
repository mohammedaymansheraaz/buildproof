"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuditDraft, AuditRun, FindingStatus } from "@/lib/types";

type AuditContextValue = {
  runs: AuditRun[];
  now: number;
  hydrated: boolean;
  error: string | null;
  createAudit: (draft: AuditDraft) => Promise<string>;
  completeAudit: (auditId: string) => Promise<void>;
  updateFindingStatus: (auditId: string, findingId: string, status: FindingStatus) => Promise<void>;
  rerunAudit: (auditId: string) => Promise<string | undefined>;
  generateAiReport: (auditId: string) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const AuditContext = createContext<AuditContextValue | null>(null);

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    throw new Error(payload && typeof payload === "object" && "error" in payload && payload.error ? payload.error : "BuildProof request failed.");
  }
  return payload as T;
}

async function wait(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sortRuns(runs: AuditRun[]) {
  return [...runs].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(async () => {
    try {
      setError(null);
      let response = await fetch("/api/audits", {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.status === 401) {
        await wait(900);
        response = await fetch("/api/audits", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
      }

      const payload = await readJson<{ audits: AuditRun[] }>(response);
      setRuns(sortRuns(payload.audits));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "BuildProof could not load persisted audits.");
      setRuns([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 800);
    return () => window.clearInterval(interval);
  }, []);

  const createAudit = useCallback(async (draft: AuditDraft) => {
    const payload = await readJson<{ audit: AuditRun }>(await fetch("/api/audits", {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    }));
    setRuns((current) => sortRuns([payload.audit, ...current.filter((run) => run.id !== payload.audit.id)]));
    return payload.audit.id;
  }, []);

  const completeAudit = useCallback(async (auditId: string) => {
    const payload = await readJson<{ audit: AuditRun }>(await fetch(`/api/audits/${auditId}`, {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
    }));
    setRuns((current) => sortRuns(current.map((run) => run.id === payload.audit.id ? payload.audit : run)));
  }, []);

  const updateFindingStatus = useCallback(async (auditId: string, findingId: string, status: FindingStatus) => {
    const payload = await readJson<{ audit: AuditRun }>(await fetch(`/api/audits/${auditId}/findings/${findingId}`, {
      method: "PATCH",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }));
    setRuns((current) => sortRuns(current.map((run) => run.id === payload.audit.id ? payload.audit : run)));
  }, []);

  const rerunAudit = useCallback(async (auditId: string) => {
    const payload = await readJson<{ audit: AuditRun }>(await fetch(`/api/audits/${auditId}/rerun`, {
      method: "POST",
      headers: { Accept: "application/json" },
    }));
    setRuns((current) => sortRuns([payload.audit, ...current]));
    return payload.audit.id;
  }, []);

  const generateAiReport = useCallback(async (auditId: string) => {
    const payload = await readJson<{ audit: AuditRun }>(await fetch(`/api/audits/${auditId}/ai-report`, {
      method: "POST",
      headers: { Accept: "application/json" },
    }));
    setRuns((current) => sortRuns(current.map((run) => run.id === payload.audit.id ? payload.audit : run)));
  }, []);

  const resetDemo = useCallback(async () => {
    await refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      runs,
      now,
      hydrated,
      error,
      createAudit,
      completeAudit,
      updateFindingStatus,
      rerunAudit,
      generateAiReport,
      resetDemo,
    }),
    [runs, now, hydrated, error, createAudit, completeAudit, updateFindingStatus, rerunAudit, generateAiReport, resetDemo],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAudit must be used inside AuditProvider");
  return context;
}
