"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Code2,
  FileCode2,
  Filter,
  FlaskConical,
  Network,
  PanelRightClose,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { CategoryIcon, EmptyState, FindingStatusBadge, GlassPanel, SeverityBadge, SeverityMark } from "@/components/ui";
import { getAuditProgress, severityLabel } from "@/lib/audit-engine";
import { auditDomainIds, auditDomains, getAuditDomain, getDomainForFinding, type AuditDomainId } from "@/lib/audit-domains";
import { cn } from "@/lib/utils";
import type { AuditCategory, Evidence, Finding, Severity } from "@/lib/types";

type FindingTab = "Replay" | "Network" | "Code" | "Config" | "Suggested fix";
const tabs: FindingTab[] = ["Replay", "Network", "Code", "Config", "Suggested fix"];

export function FindingsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { runs, now, hydrated, updateFindingStatus } = useAudit();
  const audit = runs[0];
  const findings = audit ? getAuditProgress(audit, now).visibleFindings : [];
  const [severity, setSeverity] = useState<"all" | Severity>("all");
  const [category, setCategory] = useState<"all" | AuditCategory>("all");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<FindingTab>("Replay");
  const requestedDomain = searchParams.get("domain");
  const domain = auditDomainIds.includes(requestedDomain as AuditDomainId) ? requestedDomain as AuditDomainId : undefined;
  const domainLabel = domain ? getAuditDomain(domain).shortLabel : undefined;

  const filtered = useMemo(
    () => findings.filter((finding) => (severity === "all" || finding.severity === severity) && (category === "all" || finding.category === category) && (!domain || getDomainForFinding(finding).id === domain)),
    [findings, severity, category, domain],
  );

  const selected = filtered.find((finding) => finding.id === selectedId) ?? filtered[0];

  useEffect(() => {
    if (!selectedId && findings[0]) setSelectedId(findings[0].id);
  }, [findings, selectedId]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(undefined);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  if (!hydrated) return <FindingsLoading />;
  if (!audit) {
    return <EmptyState title="No evidence to triage yet" detail="Start an audit to build a findings workspace." action={<Link href="/audits/new" className="button button--primary">New audit <ArrowRight size={16} /></Link>} />;
  }

  return (
    <div className="page page--findings">
      <div className="page-heading page-heading--split">
        <div>
          <div className="eyebrow"><span className="live-dot" />Evidence workspace</div>
          <h1>Every finding carries its own proof.</h1>
          <p>{audit.projectName} · {domainLabel ? `${domainLabel} team view · ` : ""}{findings.length} signals available · press Esc to return to the list</p>
        </div>
        <Link href={`/audits/${audit.id}`} className="button button--quiet"><RefreshCw size={16} /> Audit trace</Link>
      </div>

      <div className="findings-workspace">
        <GlassPanel className="findings-list-panel" tone="standard">
          <div className="findings-list-panel__header">
            <div><span className="panel-kicker">Triage queue</span><h2>Release signals</h2></div>
            <span>{filtered.length}</span>
          </div>
          <div className="finding-domain-filter" aria-label="Filter findings by expert team">
            <span>Expert team</span>
            <div>
              {auditDomains.map((team) => <Link href={`/findings?domain=${team.id}`} key={team.id} className={cn(domain === team.id && "finding-domain-filter__link--active")}>{team.shortLabel}</Link>)}
            </div>
          </div>
          {domain ? <div className="domain-filter-context"><span>Expert team · {domainLabel}</span><Link href="/findings">Clear filter</Link></div> : null}
          <div className="finding-filters">
            <div className="filter-row"><Filter size={14} />{(["all", "critical", "high", "medium", "low"] as const).map((item) => <button type="button" className={cn(severity === item && "filter-chip--active")} onClick={() => setSeverity(item)} key={item}>{item === "all" ? "All" : severityLabel(item)}</button>)}</div>
            <select value={category} onChange={(event) => setCategory(event.target.value as "all" | AuditCategory)} aria-label="Filter findings by category">
              <option value="all">All surfaces</option>
              <option value="product">Product intelligence</option>
              <option value="functional">Functional</option>
              <option value="security">Security</option>
              <option value="api">API & config</option>
              <option value="cloud">Cloud readiness</option>
              <option value="accessibility">Accessibility</option>
              <option value="performance">Performance</option>
              <option value="code">Code</option>
              <option value="database">Database</option>
              <option value="devops">DevOps</option>
              <option value="ai">AI evaluation</option>
              <option value="launch">Launch readiness</option>
            </select>
          </div>
          <div className="findings-list-panel__list">
            {filtered.map((finding) => (
              <button type="button" key={finding.id} onClick={() => { setSelectedId(finding.id); setActiveTab("Replay"); }} className={cn("finding-list-item", selected?.id === finding.id && "finding-list-item--selected")}>
                <SeverityMark severity={finding.severity} />
                <div><strong>{finding.title}</strong><span><CategoryIcon category={finding.category} size={13} />{finding.affectedArea}</span></div>
                <div className="finding-list-item__meta"><span>{finding.evidence.length} proof</span><FindingStatusBadge status={finding.status} /></div>
                <ChevronRight size={16} />
              </button>
            ))}
            {!filtered.length ? <div className="filter-empty"><CircleAlert size={18} />No findings match this view.</div> : null}
          </div>
        </GlassPanel>

        <GlassPanel className="finding-detail" tone="focus">
          {selected ? (
            <FindingDetail
              finding={selected}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onClose={() => setSelectedId(undefined)}
              onResolve={() => updateFindingStatus(audit.id, selected.id, "resolved")}
              onReview={() => updateFindingStatus(audit.id, selected.id, "needs_review")}
              onFix={() => router.push(`/fix-center?finding=${selected.id}`)}
            />
          ) : (
            <div className="detail-empty"><PanelRightClose size={22} /><h2>Select a finding</h2><p>Choose a release signal to view its evidence, context, and proposed next step.</p></div>
          )}
        </GlassPanel>
      </div>
    </div>
  );
}

function FindingDetail({
  finding,
  activeTab,
  setActiveTab,
  onClose,
  onResolve,
  onReview,
  onFix,
}: {
  finding: Finding;
  activeTab: FindingTab;
  setActiveTab: (tab: FindingTab) => void;
  onClose: () => void;
  onResolve: () => void;
  onReview: () => void;
  onFix: () => void;
}) {
  return (
    <div className="finding-detail__inside">
      <div className="finding-detail__heading">
        <div className="finding-detail__title"><SeverityBadge severity={finding.severity} /><div><span className="panel-kicker">{finding.affectedArea}</span><h2>{finding.title}</h2></div></div>
        <button type="button" className="icon-button" onClick={onClose} aria-label="Close finding detail"><X size={17} /></button>
      </div>
      <p className="finding-detail__summary">{finding.summary}</p>
      <div className="finding-detail__facts"><span><strong>Confidence</strong>{finding.confidence}</span><span><strong>Status</strong><FindingStatusBadge status={finding.status} /></span><span><strong>Proof</strong>{finding.evidence.length} artifacts</span></div>
      <div className="evidence-tabs" role="tablist" aria-label="Finding evidence">
        {tabs.map((tab) => <button type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={cn(activeTab === tab && "evidence-tabs__tab--active")} key={tab}>{tab}</button>)}
      </div>
      <EvidenceTab finding={finding} tab={activeTab} />
      <div className="finding-detail__bottom">
        <div className="finding-detail__action-group">
          {finding.status !== "resolved" ? <button type="button" className="button button--quiet" onClick={onResolve}><CheckCircle2 size={16} /> Mark resolved</button> : <span className="resolved-note"><Check size={14} />Marked resolved</span>}
          <button type="button" className="button button--ghost" onClick={onReview}><FlaskConical size={16} /> Human review</button>
        </div>
        <button type="button" className="button button--primary" onClick={onFix}><Sparkles size={16} /> Generate fix brief</button>
      </div>
    </div>
  );
}

function EvidenceTab({ finding, tab }: { finding: Finding; tab: FindingTab }) {
  if (tab === "Suggested fix") {
    return (
      <div className="suggested-fix-box"><Sparkles size={18} /><div><span className="panel-kicker">Review-ready recommendation</span><h3>Fix the release boundary, then verify the journey.</h3><p>{finding.recommendation}</p><div className="affected-file-pills">{finding.affectedFiles.map((file) => <span key={file}><FileCode2 size={13} />{file}</span>)}</div></div></div>
    );
  }

  const kindForTab: Record<Exclude<FindingTab, "Suggested fix">, Evidence["kind"]> = { Replay: "browser", Network: "network", Code: "code", Config: "config" };
  const requiredKind = kindForTab[tab];
  const artifact = finding.evidence.find((item) => item.kind === requiredKind) ?? finding.evidence[0];

  return (
    <div className="finding-evidence">
      <div className={cn("finding-evidence__visual", `finding-evidence__visual--${artifact.kind}`)}>
        <EvidenceVisual artifact={artifact} />
      </div>
      <div className="finding-evidence__caption"><div><span className="panel-kicker">{artifact.kind} artifact</span><h3>{artifact.title}</h3><p>{artifact.description}</p></div><span>{artifact.source}</span></div>
      <div className="reproduction-card"><span className="panel-kicker">Reproduction in the scoped demo</span><ol>{finding.reproductionSteps.map((step) => <li key={step}>{step}</li>)}</ol></div>
    </div>
  );
}

function EvidenceVisual({ artifact }: { artifact: Evidence }) {
  if (artifact.kind === "browser") {
    return <div className="artifact-browser"><div className="artifact-browser__bar"><span /><span /><span /><i>northstar-staging.example</i></div><div className="artifact-browser__page"><aside><span /><span /><span /></aside><main><div className="artifact-browser__heading"><i /><i /></div><div className="artifact-browser__card"><small>Invite teammate</small><div /><button>Send invite</button><span className="artifact-browser__target">1</span></div></main></div></div>;
  }
  if (artifact.kind === "network") {
    return <div className="artifact-network"><div><Network size={16} /><span>{artifact.source}</span><b>policy signal</b></div><dl><dt>Method</dt><dd>GET</dd><dt>Expected</dt><dd>administrator role</dd><dt>Observed</dt><dd>response returned</dd></dl><span className="artifact-network__waterfall"><i /><i /><i /><i /><i /><i /></span></div>;
  }
  if (artifact.kind === "code") {
    return <div className="artifact-code"><div><Code2 size={16} />{artifact.source}</div><pre>{artifact.payload ?? "// Source evidence will appear here."}</pre></div>;
  }
  if (artifact.kind === "config") {
    return <div className="artifact-config"><ShieldCheck size={24} /><span className="panel-kicker">Release configuration</span><h3>{artifact.title}</h3><pre>{artifact.payload ?? "Required configuration needs review."}</pre><span className="artifact-config__seal">needs owner action</span></div>;
  }
  return <div className="artifact-trace"><div><span>Browser</span><i /><span>API</span><i /><span className="artifact-trace__alert">Policy</span><i /><span>Storage</span></div><p>{artifact.description}</p></div>;
}

function FindingsLoading() {
  return <div className="page findings-loading"><div className="skeleton skeleton--heading" /><div className="skeleton-grid"><div className="skeleton skeleton--stack" /><div className="skeleton skeleton--lens" /></div></div>;
}
