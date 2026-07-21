"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createDemoAudit, createSampleAudit, createVerificationAudit } from "@/lib/demo-data";
import type { AuditDraft, AuditRun, FindingStatus } from "@/lib/types";

// The user-facing taxonomy expanded from three teams to five. Use a new demo
// cache namespace so prior fixtures cannot masquerade as fully assessed runs.
const STORAGE_KEY = "buildproof.audit-runs.v2";

type AuditContextValue = {
  runs: AuditRun[];
  now: number;
  hydrated: boolean;
  createAudit: (draft: AuditDraft) => string;
  completeAudit: (auditId: string) => void;
  updateFindingStatus: (auditId: string, findingId: string, status: FindingStatus) => void;
  rerunAudit: (auditId: string) => string | undefined;
  resetDemo: () => void;
};

const AuditContext = createContext<AuditContextValue | null>(null);

function readStoredRuns(): AuditRun[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [createSampleAudit()];
    const parsed = JSON.parse(raw) as AuditRun[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [createSampleAudit()];
    return parsed;
  } catch {
    return [createSampleAudit()];
  }
}

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setRuns(readStoredRuns());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 800);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }, [hydrated, runs]);

  const createAudit = useCallback((draft: AuditDraft) => {
    const run = createDemoAudit(draft);
    setRuns((current) => [run, ...current]);
    return run.id;
  }, []);

  const completeAudit = useCallback((auditId: string) => {
    setRuns((current) =>
      current.map((run) =>
        run.id === auditId ? { ...run, finishedAt: new Date().toISOString(), status: "completed" } : run,
      ),
    );
  }, []);

  const updateFindingStatus = useCallback((auditId: string, findingId: string, status: FindingStatus) => {
    setRuns((current) =>
      current.map((run) =>
        run.id === auditId
          ? {
              ...run,
              findings: run.findings.map((finding) =>
                finding.id === findingId ? { ...finding, status } : finding,
              ),
            }
          : run,
      ),
    );
  }, []);

  const rerunAudit = useCallback((auditId: string) => {
    const source = runs.find((run) => run.id === auditId);
    if (!source) return undefined;
    const verification = createVerificationAudit(source);
    setRuns((current) => [verification, ...current]);
    return verification.id;
  }, [runs]);

  const resetDemo = useCallback(() => {
    const sample = createSampleAudit();
    setRuns([sample]);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      runs,
      now,
      hydrated,
      createAudit,
      completeAudit,
      updateFindingStatus,
      rerunAudit,
      resetDemo,
    }),
    [runs, now, hydrated, createAudit, completeAudit, updateFindingStatus, rerunAudit, resetDemo],
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAudit must be used inside AuditProvider");
  return context;
}
