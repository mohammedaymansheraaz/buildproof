"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCode2,
  GitPullRequest,
  GitPullRequestDraft,
  Play,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { EmptyState, FindingStatusBadge, GlassPanel, SeverityBadge } from "@/components/ui";
import { getAuditProgress } from "@/lib/audit-engine";
import { cn } from "@/lib/utils";
import type { Finding } from "@/lib/types";

export function FixCenter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { runs, now, hydrated, updateFindingStatus, rerunAudit } = useAudit();
  const audit = runs[0];
  const findings = audit ? getAuditProgress(audit, now).visibleFindings.filter((finding) => finding.autoFixEligible) : [];
  const requestedId = searchParams.get("finding");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [generated, setGenerated] = useState(false);
  const [githubNotice, setGithubNotice] = useState(false);

  useEffect(() => {
    if (requestedId && findings.some((finding) => finding.id === requestedId)) {
      setSelectedId(requestedId);
      setGenerated(true);
    }
  }, [requestedId, findings]);

  const selected = findings.find((finding) => finding.id === selectedId) ?? findings[0];

  if (!hydrated) return <FixCenterLoading />;
  if (!audit) {
    return <EmptyState title="No release fixes are ready" detail="Run an audit first, then BuildProof will collect review-ready remediation briefs here." action={<Link href="/audits/new" className="button button--primary">Start audit <ArrowRight size={16} /></Link>} />;
  }

  async function verifyFix() {
    const id = await rerunAudit(audit.id);
    if (id) router.push(`/audits/${id}`);
  }

  return (
    <div className="page page--fix-center">
      <div className="page-heading page-heading--split">
        <div>
          <div className="eyebrow"><span className="demo-chip">proposal only</span>Fix Center</div>
          <h1>Turn release evidence into a safe, reviewable change.</h1>
          <p>BuildProof proposes a narrow patch brief. Your team remains in control of every code or GitHub action.</p>
        </div>
        <span className="fix-policy"><ShieldCheck size={16} />Never auto-merges or deploys</span>
      </div>

      <div className="fix-center-layout">
        <GlassPanel className="fix-queue" tone="standard">
          <div className="fix-queue__heading"><div><span className="panel-kicker">Eligible remediation</span><h2>Fix queue</h2></div><span>{findings.length}</span></div>
          <div className="fix-queue__list">
            {findings.map((finding) => (
              <button type="button" className={cn("fix-queue__item", selected?.id === finding.id && "fix-queue__item--selected")} key={finding.id} onClick={() => { setSelectedId(finding.id); setGenerated(false); setGithubNotice(false); }}>
                <SeverityBadge severity={finding.severity} />
                <div><strong>{finding.title}</strong><span>{finding.affectedArea}</span></div>
                <FindingStatusBadge status={finding.status} />
                <ChevronRight size={16} />
              </button>
            ))}
            {!findings.length ? <div className="filter-empty"><CheckCircle2 size={18} />Nothing eligible needs a patch brief.</div> : null}
          </div>
        </GlassPanel>

        <GlassPanel className="fix-workbench" tone="focus">
          {selected ? (
            <>
              <div className="fix-workbench__heading">
                <div><span className="panel-kicker">Selected evidence</span><h2>{selected.title}</h2><p>{selected.summary}</p></div>
                <SeverityBadge severity={selected.severity} />
              </div>
              {!generated ? (
                <div className="fix-generate-empty">
                  <div className="fix-generate-empty__orb"><WandSparkles size={25} /></div>
                  <h3>Generate a narrow fix brief</h3>
                  <p>BuildProof will explain the affected boundary, show an implementation direction, and add the verification test it expects to pass.</p>
                  <button type="button" className="button button--primary" onClick={() => setGenerated(true)}><Sparkles size={16} /> Generate fix brief</button>
                </div>
              ) : (
                <FixBrief finding={selected} />
              )}
              {generated ? (
                <div className="fix-workbench__actions">
                  <div className="fix-workbench__action-group">
                    {selected.status !== "resolved" ? <button type="button" className="button button--quiet" onClick={() => updateFindingStatus(audit.id, selected.id, "resolved")}><Check size={16} /> Mark proposed fix applied</button> : <span className="resolved-note"><Check size={14} />Finding marked resolved</span>}
                    <button type="button" className="button button--ghost" onClick={verifyFix}><Play size={16} /> Re-run verification</button>
                  </div>
                  <button type="button" className="button button--primary" onClick={() => setGithubNotice(true)}><GitPullRequest size={16} /> Create draft PR</button>
                </div>
              ) : null}
              {githubNotice ? <div className="integration-notice"><GitPullRequestDraft size={17} /><div><strong>Draft PR creation is not enabled yet.</strong><span>The MVP reads GitHub source evidence with a server token. A future GitHub App adapter can create a draft PR after your explicit approval.</span></div></div> : null}
            </>
          ) : <div className="detail-empty"><CircleAlert size={22} /><h2>Select a fix candidate</h2><p>Evidence-backed fixes will appear here when an audit completes.</p></div>}
        </GlassPanel>
      </div>
    </div>
  );
}

function FixBrief({ finding }: { finding: Finding }) {
  const patch = patchFor(finding);
  return (
    <div className="fix-brief">
      <div className="fix-brief__summary"><Sparkles size={17} /><div><span className="panel-kicker">Proposed remediation</span><h3>{finding.recommendation}</h3></div></div>
      <div className="fix-brief__steps"><span><b>01</b> Establish the server-side policy or validation boundary.</span><span><b>02</b> Add a regression test for the intended and disallowed scenarios.</span><span><b>03</b> Re-run only the affected evidence path before release approval.</span></div>
      <div className="patch-preview"><div className="patch-preview__heading"><FileCode2 size={15} /><span>{finding.affectedFiles[0] ?? "release-policy.ts"}</span><small>review proposal</small></div><pre>{patch}</pre></div>
      <div className="fix-brief__verification"><ShieldCheck size={17} /><div><strong>Expected verification</strong><span>{finding.reproductionSteps[0]}</span></div></div>
    </div>
  );
}

function patchFor(finding: Finding): string {
  if (finding.category === "security") {
    return `- return exportWorkspaceData(session.workspaceId);\n+\n+  const session = await getSession();\n+  if (!session || session.role !== "admin") {\n+    return Response.json({ error: "Forbidden" }, { status: 403 });\n+  }\n+\n+  return exportWorkspaceData(session.workspaceId);`;
  }
  if (finding.category === "api") {
    return `+ if (!process.env.RESEND_API_KEY) {\n+   throw new ReleaseConfigurationError("Mail delivery is not configured");\n+ }\n+\n+  await sendWorkspaceInvitation({ recipient, workspaceId });`;
  }
  if (finding.category === "cloud") {
    return `+ const allowedTypes = ["application/pdf", "image/png", "image/jpeg"];\n+  const file = await readValidatedUpload(request);\n+\n+  if (!allowedTypes.includes(file.type)) {\n+    return Response.json({ error: "Unsupported file type" }, { status: 415 });\n+  }`;
  }
  return `- SERVICE_API_KEY=replace_with_your_own_key\n+ SERVICE_API_KEY=\n+\n+  # Store values only in your deployment secret manager.`;
}

function FixCenterLoading() {
  return <div className="page fix-center-loading"><div className="skeleton skeleton--heading" /><div className="skeleton-grid"><div className="skeleton skeleton--stack" /><div className="skeleton skeleton--lens" /></div></div>;
}
