"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  CloudCog,
  Clock3,
  FolderGit2,
  Gauge,
  MousePointer2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { CategoryIcon, EmptyState, GlassPanel, MetricBar, SeverityBadge } from "@/components/ui";
import { calculateReleaseScore, countBySeverity, domainReadiness, getAuditProgress, getReleaseVerdict } from "@/lib/audit-engine";
import { auditDomains, auditDomainStageIndex, getDomainFindings, type AuditDomainId } from "@/lib/audit-domains";
import { formatRelativeTime } from "@/lib/utils";
import { ReleaseStage } from "@/components/release-stage";
import { cn } from "@/lib/utils";

const domainIcons = {
  experience: MousePointer2,
  engineering: CloudCog,
  security: ShieldCheck,
} satisfies Record<AuditDomainId, typeof MousePointer2>;

const journeySteps = [
  { label: "Understand app", stageIndex: 0, icon: FolderGit2 },
  { label: "Experience", stageIndex: 1, icon: MousePointer2 },
  { label: "Engineering", stageIndex: 2, icon: CloudCog },
  { label: "Security", stageIndex: 3, icon: ShieldCheck },
  { label: "Health report", stageIndex: 4, icon: Clock3 },
];

export function Dashboard() {
  const { runs, now, hydrated } = useAudit();
  const [activeDomain, setActiveDomain] = useState<AuditDomainId>("experience");
  const audit = runs[0];

  if (!hydrated) return <DashboardLoading />;

  if (!audit) {
    return (
      <EmptyState
        title="Your application intelligence desk is ready"
        detail="Start a scoped audit and BuildProof will organize the evidence through three expert teams: experience, engineering, and security."
        action={<Link className="button button--primary" href="/audits/new">Start the first audit <ArrowRight size={16} /></Link>}
      />
    );
  }

  const progress = getAuditProgress(audit, now);
  const findings = progress.visibleFindings;
  const score = calculateReleaseScore(findings);
  const verdict = getReleaseVerdict(findings);
  const counts = countBySeverity(findings);
  const blockerCount = counts.critical + counts.high;
  const isDecisionReady = progress.isComplete;
  const modelScore = isDecisionReady ? score : progress.progress;
  const activityCopy = progress.isComplete
    ? audit.isVerification
      ? "Verification audit complete"
      : "Application intelligence report sealed"
    : progress.stage.activity;
  const primaryAction = blockerCount
    ? { href: "/findings", label: `Review ${blockerCount} blocker${blockerCount === 1 ? "" : "s"}` }
    : progress.isComplete
      ? { href: "/reports", label: "Open intelligence report" }
      : { href: `/audits/${audit.id}`, label: "View live audit" };
  const domainData = auditDomains.map((domain) => {
    const domainFindings = getDomainFindings(findings, domain.id);
    const unresolved = domainFindings.filter((finding) => finding.status !== "resolved" && finding.status !== "accepted");
    const domainCounts = countBySeverity(domainFindings);
    const inScope = domain.categories.some((category) => audit.selectedModules.includes(category));
    const assessed = inScope && (progress.isComplete || progress.stageIndex >= auditDomainStageIndex[domain.id]);

    return {
      domain,
      findings: domainFindings,
      unresolved,
      counts: domainCounts,
      inScope,
      assessed,
      score: assessed ? domainReadiness(findings, domain.id) : null,
      recommendation: unresolved[0]?.recommendation,
    };
  });
  const domainScore = (domainId: AuditDomainId) => domainData.find((item) => item.domain.id === domainId)?.score ?? 0;
  const evidenceCount = findings.reduce((total, finding) => total + finding.evidence.length, 0);

  return (
    <div className="page page--overview">
      <div className="page-heading page-heading--split dashboard-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" />Application audit</div>
          <h1>See what your application needs—through the expert team behind it.</h1>
          <p>{audit.projectName} · {audit.branch} · {audit.environment} target · {progress.isComplete ? "evidence sealed" : `${progress.progress}% evidence gathered`}</p>
        </div>
        <Link className="button button--primary dashboard-primary-action" href={primaryAction.href}>{primaryAction.label} <ArrowRight size={16} /></Link>
      </div>

      <section className="health-command-deck" aria-label="Application health command center">
        <GlassPanel className="release-lens-panel health-command-deck__model" tone="focus">
          <div className="panel-heading panel-heading--tight">
            <div><span className="panel-kicker">Application model</span><h2>Three expert teams, one release reading</h2></div>
            <span className={progress.isComplete ? "audit-state audit-state--complete" : "audit-state audit-state--running"}><span />{progress.isComplete ? "Evidence sealed" : "Audit in motion"}</span>
          </div>
          <ReleaseStage
            score={modelScore}
            verdict={verdict}
            experience={domainScore("experience")}
            engineering={domainScore("engineering")}
            security={domainScore("security")}
            activeSurface={activeDomain}
            onSurfaceChange={setActiveDomain}
            scoreLabel={isDecisionReady ? "Application health" : "Evidence gathered"}
            statusLabel={isDecisionReady ? verdict : "Evidence gathering"}
          />
          <div className="lens-caption"><span>{activityCopy}</span><span>{findings.length} signals · {evidenceCount} artifacts</span></div>
        </GlassPanel>

        <div className="health-command-deck__decision">
          <GlassPanel className="health-verdict-card" tone="standard">
            <div className="panel-kicker">Overall application health</div>
            <div className="health-verdict-card__score"><strong>{isDecisionReady ? score : progress.progress}</strong><span>{isDecisionReady ? "/100" : "% mapped"}</span></div>
            <h2 className={isDecisionReady ? verdict === "DO NOT SHIP" ? "verdict verdict--hold" : verdict === "READY WITH REVIEW" ? "verdict verdict--review" : "verdict verdict--ship" : "verdict verdict--progress"}>{isDecisionReady ? verdict : "EVIDENCE GATHERING"}</h2>
            <p>{isDecisionReady ? blockerCount ? `${blockerCount} release blocker${blockerCount === 1 ? "" : "s"} needs a human decision.` : "No release blockers are currently open." : "The decision stays provisional until the expert teams finish gathering evidence."}</p>
            <div className="health-verdict-card__metrics"><span><strong>{counts.critical}</strong> critical</span><span><strong>{counts.high}</strong> high</span><span><strong>{findings.filter((finding) => finding.status === "resolved").length}</strong> resolved</span></div>
            <Link className="button button--primary health-verdict-card__action" href={primaryAction.href}>{primaryAction.label} <ArrowRight size={15} /></Link>
          </GlassPanel>

          <Link href={`/audits/${audit.id}`} className="glass-panel glass-panel--mist source-card source-card--link health-source-card">
            <div className="source-card__icon"><FolderGit2 size={18} /></div>
            <div><span className="panel-kicker">Audited application</span><strong>{audit.repositoryUrl.replace("github.com/", "")}</strong><small>last updated {formatRelativeTime(audit.createdAt)}</small></div>
            <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      <section className="audit-domain-section" aria-labelledby="audit-domain-heading">
        <div className="section-heading">
          <div><span className="panel-kicker">Expert audit teams</span><h2 id="audit-domain-heading">The intelligence behind your health score</h2></div>
          <span>{audit.selectedModules.length} capabilities in scope</span>
        </div>
        <div className="audit-domain-grid">
          {domainData.map(({ domain, findings: domainFindings, unresolved, counts: domainCounts, inScope, assessed, score: domainScoreValue, recommendation }) => {
            const Icon = domainIcons[domain.id];
            const active = activeDomain === domain.id;
            const releaseLevelSignals = domainCounts.critical + domainCounts.high;
            const issueCopy = !inScope
              ? "Not included in this audit scope"
              : !assessed
                ? "Evidence gathering — this expert team has not completed its reading"
              : !unresolved.length
                ? "No open risk signals in the current evidence"
                : releaseLevelSignals
                  ? `${releaseLevelSignals} release-level signal${releaseLevelSignals === 1 ? "" : "s"} needs attention`
                  : `${unresolved.length} lower-severity signal${unresolved.length === 1 ? "" : "s"} is ready for review`;

            return (
              <GlassPanel className={cn("audit-domain-card", active && "audit-domain-card--active")} tone={active ? "focus" : "standard"} key={domain.id} data-domain={domain.id}>
                <div className="audit-domain-card__topline"><span>{domain.number}</span><button type="button" onClick={() => setActiveDomain(domain.id)} aria-pressed={active} aria-label={`Focus ${domain.label} in the application model`}><Icon size={17} /></button></div>
                <div className="audit-domain-card__title"><div><span className="panel-kicker">{domain.shortLabel}</span><h3>{domain.label}</h3></div><strong>{domainScoreValue === null ? "—" : domainScoreValue}</strong></div>
                <p>{issueCopy}</p>
                <MetricBar value={domainScoreValue ?? 0} tone={domain.id === "experience" ? "blue" : domain.id === "engineering" ? "copper" : "rose"} />
                <div className="domain-agent-constellation"><span>{domain.agents.length} specialist perspectives</span><div>{domain.agents.map((agent) => <i key={agent}>{agent}</i>)}</div></div>
                <div className="audit-domain-card__footer"><span>{domainFindings.length} signals · {domainFindings.reduce((total, finding) => total + finding.evidence.length, 0)} proof</span><Link href={`/findings?domain=${domain.id}`}>Open evidence <ArrowRight size={14} /></Link></div>
                {recommendation ? <div className="audit-domain-card__recommendation"><Sparkles size={13} /><span>{recommendation}</span></div> : null}
              </GlassPanel>
            );
          })}
        </div>
      </section>

      <GlassPanel className="activity-spine intelligence-timeline" tone="standard">
        <div className="panel-heading"><div><span className="panel-kicker">Audit intelligence path</span><h2>{activityCopy}</h2></div><Link href={`/audits/${audit.id}`} className="text-link">Open live evidence <ArrowRight size={14} /></Link></div>
        <div className="activity-spine__steps">
          {journeySteps.map(({ label, icon: Icon, stageIndex }, index) => {
            const reached = progress.isComplete || progress.stageIndex >= stageIndex;
            const current = !progress.isComplete && progress.stageIndex === stageIndex;
            return <div className="activity-step" key={label}><div className={reached ? current ? "activity-step__node activity-step__node--current" : "activity-step__node activity-step__node--complete" : "activity-step__node"}><Icon size={15} /></div><span>{label}</span>{index < journeySteps.length - 1 ? <i className={reached ? "activity-step__line activity-step__line--complete" : "activity-step__line"} /> : null}</div>;
          })}
        </div>
      </GlassPanel>

      <div className="overview-bottom-grid overview-bottom-grid--intelligence">
        <GlassPanel className="priority-findings" tone="standard">
          <div className="panel-heading"><div><span className="panel-kicker">Priority evidence</span><h2>What the expert team wants you to address first</h2></div><Link href="/findings" className="text-link">All evidence <ArrowRight size={14} /></Link></div>
          <div className="finding-list finding-list--compact">
            {findings.slice(0, 4).map((finding) => <Link href={`/findings?domain=${finding.primaryDomain ?? "engineering"}`} className="finding-row" key={finding.id}><SeverityBadge severity={finding.severity} /><div className="finding-row__body"><strong>{finding.title}</strong><span><CategoryIcon category={finding.category} size={13} />{finding.affectedArea}</span></div><span className="finding-row__evidence">{finding.evidence.length} proof</span><ChevronRight size={16} /></Link>)}
            {!findings.length ? <div className="finding-row__empty"><CircleAlert size={17} />Evidence will appear as each expert team reaches its audit stage.</div> : null}
          </div>
        </GlassPanel>

        <GlassPanel className="evidence-coverage-card" tone="standard">
          <div className="panel-heading"><div><span className="panel-kicker">Evidence coverage</span><h2>How much the system knows</h2></div><Gauge size={18} /></div>
          <div className="evidence-coverage-card__grid">
            <div><strong>{evidenceCount}</strong><span>artifacts captured</span></div>
            <div><strong>{audit.selectedModules.length}</strong><span>capabilities in scope</span></div>
            <div><strong>{progress.isComplete ? "100%" : `${progress.progress}%`}</strong><span>evidence gathered</span></div>
            <div><strong>{audit.environment}</strong><span>authorized target</span></div>
          </div>
          <div className="evidence-coverage-card__note"><Check size={14} />Evidence is grouped by the expert team that can explain and verify it.</div>
        </GlassPanel>
      </div>
    </div>
  );
}

function DashboardLoading() {
  return <div className="page dashboard-loading" aria-label="Loading dashboard"><div className="skeleton skeleton--heading" /><div className="skeleton-grid"><div className="skeleton skeleton--lens" /><div className="skeleton skeleton--stack" /></div><div className="skeleton skeleton--wide" /></div>;
}
