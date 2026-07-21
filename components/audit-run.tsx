"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  FileCode2,
  FileSearch,
  Gauge,
  Network,
  Play,
  ScanSearch,
  ShieldCheck,
  SkipForward,
  TerminalSquare,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { CategoryIcon, EmptyState, GlassPanel, SeverityBadge } from "@/components/ui";
import { AUDIT_STAGES, calculateReleaseScore, getAuditProgress, getReleaseVerdict } from "@/lib/audit-engine";
import { browserRequiredCategories, repositoryRequiredCategories } from "@/lib/audit-domains";
import { cn, formatTimestamp } from "@/lib/utils";
import type { EvidenceKind, Finding } from "@/lib/types";

const stageVisuals: Array<{ kind: EvidenceKind; label: string; title: string; subline: string }> = [
  { kind: "config", label: "Product intelligence", title: "Approved application map", subline: "intent · roles · journeys · evidence boundary" },
  { kind: "browser", label: "Experience analysis", title: "Critical customer journey", subline: "browser behavior · accessible interaction" },
  { kind: "trace", label: "Engineering & scale", title: "System and data path", subline: "API · performance · data · cloud · delivery" },
  { kind: "network", label: "Security intelligence", title: "Authorization evidence", subline: "policy check · response boundary" },
  { kind: "config", label: "AI & launch readiness", title: "Conditional AI and launch brief", subline: "AI scope · cost context · owner decision" },
  { kind: "config", label: "CTO-level report", title: "Expert evidence correlation", subline: "five readings · severity · ownership · next decision" },
];

export function AuditRunScreen({ auditId }: { auditId: string }) {
  const router = useRouter();
  const { runs, now, hydrated, completeAudit } = useAudit();
  const run = runs.find((audit) => audit.id === auditId);
  const progress = run ? getAuditProgress(run, now) : undefined;
  const [selectedStageIndex, setSelectedStageIndex] = useState(0);

  useEffect(() => {
    if (progress) setSelectedStageIndex(progress.stageIndex);
  }, [progress?.stageIndex]);

  if (!hydrated) return <AuditRunLoading />;

  if (!run || !progress) {
    return (
      <EmptyState
        title="That audit is not in this workspace"
        detail="It may belong to another workspace or have been removed. Create a new audit to continue."
        action={<Link className="button button--primary" href="/audits/new">New audit <ArrowRight size={16} /></Link>}
      />
    );
  }

  const findings = progress.visibleFindings;
  const score = calculateReleaseScore(findings);
  const verdict = getReleaseVerdict(findings);
  const selectedStage = AUDIT_STAGES[selectedStageIndex] ?? progress.stage;
  const selectedVisual = stageVisuals[selectedStageIndex] ?? stageVisuals[0];
  const hasRepositorySource = Boolean(run.repositoryUrl.trim());
  const hasStagingTarget = Boolean(run.stagingUrl.trim());
  const targetLabel = hasStagingTarget && hasRepositorySource
    ? `${run.stagingUrl} · ${run.repositoryUrl}`
    : hasStagingTarget
      ? run.stagingUrl
      : hasRepositorySource
        ? run.repositoryUrl
        : "No target connected";
  const targetModeLabel = hasStagingTarget && hasRepositorySource
    ? "URL + GitHub review"
    : hasStagingTarget
      ? "URL-only review"
      : hasRepositorySource
        ? "GitHub repo review"
        : "Target missing";
  const hasSourceCoverageGap = !hasRepositorySource && run.selectedModules.some((category) => repositoryRequiredCategories.includes(category));
  const hasBrowserCoverageGap = !hasStagingTarget && run.selectedModules.some((category) => browserRequiredCategories.includes(category));
  const hasCoverageGap = hasSourceCoverageGap || hasBrowserCoverageGap;
  const liveStatus = !progress.isComplete ? "EVIDENCE GATHERING" : hasCoverageGap ? "COVERAGE LIMITED" : verdict;
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
      ? "A staging URL supports browser, journey, accessibility, performance, and passive HTTP evidence. Add GitHub later for source, CI/CD, dependency, and architecture coverage."
      : hasRepositorySource
        ? "Repository evidence supports source mapping, dependencies, CI/CD, configuration, architecture, and security baseline checks. Add a running app URL later for browser journeys, accessibility, performance, and passive HTTP evidence."
        : "Add a GitHub repository, a running app URL, or both before relying on this audit.";

  return (
    <div className="page page--audit-run">
      <div className="audit-run__topline">
        <Link className="breadcrumb" href="/dashboard">Overview</Link><span>/</span><Link className="breadcrumb" href="/audits/new">Audits</Link><span>/</span><strong>{run.projectName}</strong>
      </div>
      <div className="page-heading page-heading--split audit-run__heading">
        <div>
          <div className="eyebrow"><span className="demo-chip">safe MVP runner</span>{targetModeLabel}</div>
          <h1>{progress.isComplete ? hasCoverageGap ? "Evidence is sealed, but coverage is limited." : "Evidence has been correlated." : progress.stage.activity}</h1>
          <p>{targetLabel} · {run.branch} · started {formatTimestamp(run.startedAt)}</p>
        </div>
        <div className="audit-run__actions">
          {progress.isComplete ? (
            <button type="button" className="button button--primary" onClick={() => router.push("/reports")}>
              Open release passport <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="button button--quiet" onClick={() => completeAudit(run.id)}>
              <SkipForward size={16} /> Seal audit now
            </button>
          )}
        </div>
      </div>

      <GlassPanel className="audit-command-bar" tone="focus">
        <div className="audit-command-bar__activity">
          <span className="activity-pulse"><span /></span>
          <div><span className="panel-kicker">Current operation</span><strong>{progress.isComplete ? "Release passport sealed" : progress.stage.label}</strong></div>
        </div>
        <div className="audit-command-bar__stats">
          <span><strong>{progress.progress}%</strong> complete</span>
          <span><strong>{findings.length}</strong> evidence signals</span>
          <span className={cn("mini-verdict", progress.isComplete && !hasCoverageGap ? verdict === "DO NOT SHIP" ? "mini-verdict--hold" : verdict === "READY WITH REVIEW" ? "mini-verdict--review" : "mini-verdict--ship" : "mini-verdict--review")}>{liveStatus}</span>
        </div>
      </GlassPanel>

      <GlassPanel className="audit-coverage-limit" tone="mist">
        <FileSearch size={17} />
        <div><span className="panel-kicker">Evidence coverage boundary</span><strong>{coverageTitle}</strong><p>{coverageDetail}</p></div>
      </GlassPanel>

      <div className="audit-run-grid">
        <GlassPanel className="evidence-spine" tone="standard">
          <div className="panel-heading panel-heading--tight">
            <div><span className="panel-kicker">Evidence spine</span><h2>Audit movement</h2></div>
            <span className="evidence-spine__counter"><ScanSearch size={15} /> {progress.isComplete ? "sealed" : "live"}</span>
          </div>
          <div className="evidence-spine__track">
            {AUDIT_STAGES.map((stage, index) => {
              const complete = progress.isComplete || index < progress.stageIndex;
              const current = !progress.isComplete && index === progress.stageIndex;
              const available = complete || current;
              return (
                <button
                  type="button"
                  key={stage.id}
                  className={cn("spine-stage", complete && "spine-stage--complete", current && "spine-stage--current", selectedStageIndex === index && "spine-stage--selected")}
                  onClick={() => available && setSelectedStageIndex(index)}
                  disabled={!available}
                >
                  <span className="spine-stage__node">{complete ? <Check size={14} /> : current ? <CircleDot size={15} /> : <span />}</span>
                  <span className="spine-stage__copy"><strong>{stage.shortLabel}</strong><small>{complete ? "Evidence captured" : current ? "In progress" : "Waiting"}</small></span>
                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>
          <div className="evidence-spine__footer"><ShieldCheck size={15} />Scoped safe runner · no destructive checks included</div>
        </GlassPanel>

        <GlassPanel className="evidence-theater" tone="focus">
          <div className="evidence-theater__header">
            <div><span className="panel-kicker">{selectedVisual.label}</span><h2>{selectedVisual.title}</h2><p>{selectedVisual.subline}</p></div>
            <span className="theater-state"><Play size={13} /> {selectedStageIndex <= progress.stageIndex || progress.isComplete ? "captured" : "pending"}</span>
          </div>
          <EvidenceTheater kind={selectedVisual.kind} stageLabel={selectedVisual.label} finding={findings.find((item) => item.discoveredAtStage === selectedStageIndex) ?? findings[0]} />
          <div className="evidence-theater__footer">
            <span>{selectedStage.description}</span>
            <span>{selectedStageIndex <= progress.stageIndex || progress.isComplete ? "Evidence available" : "Stage not reached"}</span>
          </div>
        </GlassPanel>
      </div>

      <div className="audit-run-bottom-grid">
        <GlassPanel className="live-events" tone="standard">
          <div className="panel-heading">
            <div><span className="panel-kicker">Runner trace</span><h2>What just happened</h2></div>
            <TerminalSquare size={18} />
          </div>
          <div className="runner-events">
            {AUDIT_STAGES.slice(0, progress.isComplete ? AUDIT_STAGES.length : progress.stageIndex + 1).map((stage, index) => (
              <div className="runner-event" key={stage.id}>
                <span className={index === progress.stageIndex && !progress.isComplete ? "runner-event__dot runner-event__dot--live" : "runner-event__dot"} />
                <div><strong>{stage.label}</strong><p>{index === progress.stageIndex && !progress.isComplete ? stage.activity : stage.description}</p></div>
                <small>{index === progress.stageIndex && !progress.isComplete ? "now" : "complete"}</small>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="live-findings" tone="standard">
          <div className="panel-heading">
            <div><span className="panel-kicker">Signals found</span><h2>{findings.length ? `${findings.length} evidence-backed findings` : "Watching release signals"}</h2></div>
            {findings.length ? <Link className="text-link" href="/findings">Investigate <ArrowRight size={14} /></Link> : null}
          </div>
          <div className="live-findings__list">
            {findings.length ? findings.slice(0, 4).map((finding) => <LiveFinding finding={finding} key={finding.id} />) : <div className="finding-row__empty"><FileSearch size={17} />No findings are visible at this stage yet.</div>}
          </div>
          {progress.isComplete ? <div className="live-findings__score"><span>{hasCoverageGap ? "Evidence confidence" : "Release confidence"}</span><strong>{score}</strong><span>{liveStatus}</span></div> : null}
        </GlassPanel>
      </div>
    </div>
  );
}

function LiveFinding({ finding }: { finding: Finding }) {
  return (
    <Link href="/findings" className="live-finding">
      <SeverityBadge severity={finding.severity} />
      <div><strong>{finding.title}</strong><span><CategoryIcon category={finding.category} size={13} />{finding.affectedArea}</span></div>
      <ChevronRight size={16} />
    </Link>
  );
}

function EvidenceTheater({ kind, stageLabel, finding }: { kind: EvidenceKind; stageLabel: string; finding?: Finding }) {
  if (kind === "browser") {
    return (
      <div className="theater-preview theater-preview--browser">
        <div className="browser-bar"><span /><span /><span /><div>northstar-staging.example/settings/team</div></div>
        <div className="browser-window">
          <aside><span className="browser-logo" /><span /><span /><span /><span /></aside>
          <main><div className="browser-heading"><span /><span /></div><div className="browser-content"><div className="browser-card"><span /><strong>Invite teammate</strong><div className="browser-input" /><button>Send invite</button></div><div className="browser-side-card"><small>Activity</small><span /><span /><span /></div></div><div className="theater-target"><span>1</span>Invite response needs review</div></main>
        </div>
      </div>
    );
  }
  if (kind === "network") {
    return (
      <div className="theater-preview theater-preview--network">
        <div className="network-topline"><Network size={16} /><span>Request / policy trace</span><span className="network-status">review signal</span></div>
        <div className="network-grid"><span>Method</span><strong>GET</strong><span>Route</span><strong>/api/admin/export</strong><span>Expected policy</span><strong>administrator role</strong><span>Observed</span><strong className="network-risk">response returned</strong></div>
        <div className="network-waterfall"><i /><i /><i /><i /><i /><i /><i /></div>
      </div>
    );
  }
  if (kind === "config") {
    return (
      <div className="theater-preview theater-preview--config">
        <div className="passport-mini"><span className="panel-kicker">BuildProof {stageLabel}</span><h3>{stageLabel === "Product intelligence" ? "Product intent and evidence boundary" : stageLabel === "AI & launch readiness" ? "Conditional AI scope and launch ownership" : "Five readings, one release decision"}</h3><div className="passport-mini__rows">{stageLabel === "Product intelligence" ? <><span>Critical journeys <b>mapped</b></span><span>Roles &amp; boundaries <b>mapped</b></span><span>Approved sources <b>scoped</b></span><span>Coverage limitations <b>declared</b></span></> : <><span>Product intelligence <b>mapped</b></span><span>Experience &amp; quality <b>captured</b></span><span>Engineering &amp; scale <b>review</b></span><span>Security &amp; reliability <b>review</b></span><span>AI &amp; launch readiness <b>pending</b></span></>}</div><div className="passport-mini__seal"><ShieldCheck size={20} />Human review required</div></div>
      </div>
    );
  }
  if (kind === "trace") {
    return (
      <div className="theater-preview theater-preview--trace">
        <div className="trace-header"><Gauge size={16} />Upload journey · storage handoff</div>
        <div className="trace-lane"><span className="trace-node">Browser</span><i /><span className="trace-node">API</span><i /><span className="trace-node trace-node--alert">Policy</span><i /><span className="trace-node">Storage</span></div>
        <div className="trace-note"><span />No declared server allowlist observed before the storage handoff.</div>
      </div>
    );
  }
  return (
    <div className="theater-preview theater-preview--code">
      <div className="code-topline"><FileCode2 size={16} /><span>{finding?.affectedFiles[0] ?? "app/api/release/route.ts"}</span></div>
      <pre><code><span className="code-muted">01</span> <span className="code-keyword">const</span> session = <span className="code-call">await</span> getSession();{`\n`}<span className="code-muted">02</span> <span className="code-comment">{"// release policy guard required here"}</span>{`\n`}<span className="code-muted">03</span> <span className="code-keyword">return</span> buildReleaseResponse(session);</code></pre>
      <div className="code-insight"><Code2 size={15} />Evidence is linked to the affected release surface, not an unverified AI claim.</div>
    </div>
  );
}

function AuditRunLoading() {
  return <div className="page audit-run-loading"><div className="skeleton skeleton--heading" /><div className="skeleton skeleton--wide" /><div className="skeleton-grid"><div className="skeleton skeleton--stack" /><div className="skeleton skeleton--lens" /></div></div>;
}
