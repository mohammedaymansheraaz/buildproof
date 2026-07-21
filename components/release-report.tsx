"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Download,
  Bot,
  CloudCog,
  FileCheck2,
  FileSearch,
  LoaderCircle,
  LockKeyhole,
  MousePointer2,
  Printer,
  Rocket,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { EmptyState, MetricBar, SeverityBadge } from "@/components/ui";
import { calculateReleaseScore, countBySeverity, domainReadiness, getAuditProgress, getReleaseVerdict } from "@/lib/audit-engine";
import { auditDomains, auditDomainStageIndex, browserRequiredCategories, domainRequiresRepository, type AuditDomainId } from "@/lib/audit-domains";
import { formatTimestamp } from "@/lib/utils";

const domainIcons = {
  product: FileSearch,
  experience: MousePointer2,
  engineering: CloudCog,
  security: ShieldAlert,
  "ai-launch": Rocket,
} satisfies Record<AuditDomainId, typeof MousePointer2>;

export function ReleaseReport() {
  const { runs, now, hydrated, generateAiReport } = useAudit();
  const [runId, setRunId] = useState<string | undefined>();
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const audit = useMemo(() => runs.find((run) => run.id === runId) ?? runs[0], [runs, runId]);

  if (!hydrated) return <ReportLoading />;
  if (!audit) return <EmptyState title="No release passport yet" detail="Complete an audit to prepare a stakeholder-ready release report." />;

  const progress = getAuditProgress(audit, now);
  const findings = progress.visibleFindings;
  const score = calculateReleaseScore(findings);
  const verdict = getReleaseVerdict(findings);
  const counts = countBySeverity(findings);
  const blockers = findings.filter((finding) => (finding.severity === "critical" || finding.severity === "high") && finding.status !== "resolved" && finding.status !== "accepted");
  const hasRepositorySource = Boolean(audit.repositoryUrl.trim());
  const hasStagingTarget = Boolean(audit.stagingUrl.trim());
  const targetLabel = hasStagingTarget && hasRepositorySource
    ? `${audit.stagingUrl} · ${audit.repositoryUrl}`
    : hasStagingTarget
      ? audit.stagingUrl
      : hasRepositorySource
        ? audit.repositoryUrl
        : "No target connected";
  const hasSourceCoverageGap = !hasRepositorySource && auditDomains.some(
    (domain) => domain.categories.some((category) => audit.selectedModules.includes(category)) && domainRequiresRepository(domain.id),
  );
  const hasBrowserCoverageGap = !hasStagingTarget && audit.selectedModules.some((category) => browserRequiredCategories.includes(category));
  const hasCoverageGap = hasSourceCoverageGap || hasBrowserCoverageGap;
  const isDecisionReady = progress.isComplete && !hasCoverageGap;
  const reportStatus = !progress.isComplete ? "EVIDENCE GATHERING" : hasCoverageGap ? "COVERAGE LIMITED" : verdict;
  const coverageTitle = hasStagingTarget && hasRepositorySource
    ? "URL + GitHub evidence is connected."
    : hasStagingTarget
      ? "URL-only evidence is connected."
      : hasRepositorySource
        ? "GitHub repo-only evidence is connected."
        : "No audit target is connected.";
  const coverageDetail = hasStagingTarget && hasRepositorySource
    ? "BuildProof can compare running-app behavior with source, CI/CD, dependency, architecture, and configuration evidence."
    : hasStagingTarget
      ? "Staging access supports browser journeys, accessibility, performance, and passive HTTP observations. GitHub can be added later for source, CI/CD, dependency, and architecture coverage."
      : hasRepositorySource
        ? "Repository evidence supports source mapping, dependencies, CI/CD, configuration, architecture, and security baseline checks. Add a running app URL later for browser journeys, accessibility, performance, and passive HTTP observations."
      : "Add a GitHub repository, a running app URL, or both before relying on this report.";
  const aiSynthesis = audit.report?.report.aiSynthesis;
  const aiGenerated = aiSynthesis?.status === "generated";

  async function handleGenerateAiReport() {
    setGeneratingAi(true);
    setAiError(null);
    try {
      await generateAiReport(audit.id);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI CTO synthesis could not be generated.");
    } finally {
      setGeneratingAi(false);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ audit, score, verdict, generatedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${audit.projectName.toLowerCase().replace(/\s+/g, "-")}-release-passport.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page page--report">
      <div className="page-heading page-heading--split report-header-actions">
        <div><div className="eyebrow"><span className="demo-chip">{isDecisionReady ? "evidence sealed" : hasCoverageGap ? "coverage limited" : "evidence gathering"}</span>BuildProof application health report</div><h1>{isDecisionReady ? "A decision object for your next deployment." : hasCoverageGap ? "A coverage-limited view—not a release decision." : "A provisional view while the expert teams gather evidence."}</h1><p>Designed to be read by engineering, product, and security together.</p></div>
        <div className="report-header-actions__buttons"><select value={audit.id} onChange={(event) => setRunId(event.target.value)} aria-label="Choose audit report">{runs.map((run) => <option value={run.id} key={run.id}>{run.projectName}{run.isVerification ? " · verification" : ""}</option>)}</select><button type="button" className="button button--quiet" onClick={() => void handleGenerateAiReport()} disabled={generatingAi}>{generatingAi ? <LoaderCircle size={16} className="repository-inspection__spinner" /> : <Sparkles size={16} />} {aiGenerated ? "Regenerate AI synthesis" : "Generate AI synthesis"}</button><button type="button" className="button button--quiet" onClick={exportJson}><Download size={16} /> Export JSON</button><button type="button" className="button button--primary" onClick={() => window.print()}><Printer size={16} /> Print / save PDF</button></div>
      </div>

      <article className="release-passport">
        <header className="release-passport__masthead">
          <div className="passport-brand"><FileCheck2 size={20} /><span>BUILDPROOF</span></div>
          <span className="passport-id">RP-{audit.id.slice(-6).toUpperCase()}</span>
          <div className="passport-project"><span>Project</span><strong>{audit.projectName}</strong><small>{audit.branch} · {audit.environment} · {targetLabel}</small></div>
          <div className="passport-date"><span>Generated</span><strong>{formatTimestamp(audit.finishedAt ?? audit.createdAt)}</strong><small>{audit.isVerification ? "Verification audit" : "Release assessment"}</small></div>
        </header>

        <section className="passport-verdict-row">
          <div className="passport-verdict-copy"><span className="panel-kicker">{isDecisionReady ? "Release decision" : "Application health status"}</span><h2 className={isDecisionReady ? verdict === "DO NOT SHIP" ? "verdict verdict--hold" : verdict === "READY WITH REVIEW" ? "verdict verdict--review" : "verdict verdict--ship" : "verdict verdict--progress"}>{reportStatus}</h2><p>{isDecisionReady ? verdict === "DO NOT SHIP" ? "Do not deploy until the listed release blockers receive an owner-approved resolution and verification." : verdict === "READY WITH REVIEW" ? "Deployment is possible with explicit owner review of the remaining high-impact signals." : "Evidence supports release approval within the reviewed scope." : hasSourceCoverageGap ? "A deployment decision is withheld because repository or integration evidence is required for the selected source-dependent teams." : hasBrowserCoverageGap ? "A deployment decision is withheld because browser journey, accessibility, performance, and passive HTTP evidence need a staging or preview URL." : "The report remains provisional until each expert team has completed the reading it was authorized to perform."}</p></div>
          <div className="passport-score"><span>{isDecisionReady ? "Application health" : "Evidence gathered"}</span><strong>{isDecisionReady ? score : progress.progress}</strong><small>{isDecisionReady ? "out of 100" : "percent mapped"}</small></div>
          <div className="passport-severity"><span><b>{counts.critical}</b>critical</span><span><b>{counts.high}</b>high</span><span><b>{counts.medium}</b>medium</span><span><b>{findings.filter((finding) => finding.status === "resolved").length}</b>resolved</span></div>
        </section>

        <section className="passport-materials"><span className="panel-kicker">Five expert team readings</span><div className="passport-materials__bars">{auditDomains.map((domain) => { const Icon = domainIcons[domain.id]; const inScope = domain.categories.some((category) => audit.selectedModules.includes(category)); const sourceLimited = !hasRepositorySource && domainRequiresRepository(domain.id); const assessed = inScope && !sourceLimited && (progress.isComplete || progress.stageIndex >= auditDomainStageIndex[domain.id]); const value = assessed ? domainReadiness(findings, domain.id) : 0; return <div className="passport-material" key={domain.id}><div><Icon size={15} /><span>{domain.shortLabel}</span><strong>{assessed ? value : "—"}</strong></div><MetricBar value={value} tone={domain.tone} /></div>; })}</div></section>

        <section className="passport-coverage-limit">
          <FileSearch size={18} />
          <div><span className="panel-kicker">Evidence coverage boundary</span><h3>{coverageTitle}</h3><p>{coverageDetail}</p></div>
        </section>

        <section className="passport-ai-synthesis">
          <div className="passport-section-heading">
            <div><span className="panel-kicker">Agentic AI synthesis</span><h3>{aiGenerated ? "Specialist agents interpreted the evidence" : "Bring your own model key to unlock AI synthesis"}</h3></div>
            <Bot size={19} />
          </div>

          {aiError ? (
            <div className="passport-ai-error"><ShieldAlert size={16} />{aiError}</div>
          ) : null}

          {aiGenerated && aiSynthesis ? (
            <div className="passport-ai-grid">
              <div className="passport-ai-summary">
                <span>{aiSynthesis.provider} · {aiSynthesis.model} · {aiSynthesis.source}</span>
                <p>{aiSynthesis.ctoSummary}</p>
                <strong>{aiSynthesis.verdictNarrative}</strong>
              </div>
              <div className="passport-ai-actions">
                <span className="panel-kicker">Next actions</span>
                {aiSynthesis.nextActions.slice(0, 5).map((item) => <p key={item}><Check size={12} />{item}</p>)}
              </div>
              <div className="passport-ai-sections">
                {aiSynthesis.specialistSections.map((section) => (
                  <article key={section.domain}>
                    <header><span>{section.title}</span><strong>{section.score}</strong></header>
                    <p>{section.summary}</p>
                    <footer>{section.agents.slice(0, 3).map((agent) => <i key={agent}>{agent}</i>)}</footer>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="passport-ai-empty">
              <Sparkles size={18} />
              <div>
                <strong>{aiSynthesis?.status === "skipped" ? "No shared BuildProof key is used here by design." : "Each workspace connects its own model once."}</strong>
                <p>{aiSynthesis?.error ?? "BuildProof is bring-your-own-key: connect OpenAI, OpenRouter, Nebius, or a compatible provider in AI Models. Reports then call your saved model and record provider/model metadata without exposing the key."}</p>
                <a className="button button--quiet" href="/models">Open AI Models</a>
                <button type="button" className="button button--quiet" onClick={() => void handleGenerateAiReport()} disabled={generatingAi}>
                  {generatingAi ? <LoaderCircle size={16} className="repository-inspection__spinner" /> : <Sparkles size={16} />}
                  {generatingAi ? "Generating..." : "Retry synthesis"}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="passport-blockers"><div className="passport-section-heading"><div><span className="panel-kicker">Blockers before release</span><h3>Evidence that changes the decision</h3></div><ShieldAlert size={19} /></div>{blockers.length ? <div className="passport-blocker-list">{blockers.map((finding) => <div className="passport-blocker" key={finding.id}><SeverityBadge severity={finding.severity} /><div><strong>{finding.title}</strong><p>{finding.impact}</p></div><span>{finding.evidence.length} proof artifacts</span></div>)}</div> : <div className="passport-clear"><Check size={16} />No open critical or high findings in this report.</div>}</section>

        <section className="passport-checklist"><div><span className="panel-kicker">Approval checklist</span><h3>Before a human signs this release</h3></div><div className="passport-checklist__items"><span><i><Check size={13} /></i>Confirm scoped evidence matches the target environment.</span><span><i><Check size={13} /></i>Assign owners to every remaining release signal.</span><span><i><Check size={13} /></i>Verify remediations before changing deployment status.</span></div></section>

        <footer className="passport-footer"><div><LockKeyhole size={16} /><span>Safe, authorized audit boundary · no destructive scans included</span></div><div className="passport-signatures"><span>Engineering owner <i /></span><span>Product owner <i /></span><span>Security review <i /></span></div></footer>
      </article>
    </div>
  );
}

function ReportLoading() {
  return <div className="page report-loading"><div className="skeleton skeleton--heading" /><div className="skeleton skeleton--wide" /></div>;
}
