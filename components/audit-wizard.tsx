"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDashed,
  Cloud,
  CloudCog,
  FileText,
  FolderGit2,
  Link2,
  LockKeyhole,
  MousePointer2,
  Plus,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { sampleDraft } from "@/lib/demo-data";
import { auditDomains, type AuditDomain } from "@/lib/audit-domains";
import type { AuditDraft } from "@/lib/types";
import { CategoryIcon, GlassPanel } from "@/components/ui";
import { cn } from "@/lib/utils";

const emptyDraft: AuditDraft = {
  projectName: "",
  repositoryUrl: "",
  branch: "main",
  stagingUrl: "",
  environment: "staging",
  productIntent: "",
  testAccount: "",
  selectedModules: [...sampleDraft.selectedModules],
};

const planJourneys = [
  { title: "Create a workspace", detail: "Sign up, authenticate, and initialize a new team space.", category: "functional" as const },
  { title: "Invite a teammate", detail: "Trace UI response, API handoff, and mail configuration.", category: "api" as const },
  { title: "Upload a source file", detail: "Review client validation, storage handling, and safe file policy.", category: "cloud" as const },
  { title: "Export a shared report", detail: "Validate permissions, API boundaries, and data response behavior.", category: "security" as const },
  { title: "Navigate billing controls", detail: "Check keyboard access, readable contrast, and response timing.", category: "accessibility" as const },
];

const wizardSteps = [
  { number: 1, label: "Connect release" },
  { number: 2, label: "Define scope" },
  { number: 3, label: "Approve plan" },
];

const domainIcons = {
  experience: MousePointer2,
  engineering: CloudCog,
  security: ShieldCheck,
};

export function AuditWizard() {
  const router = useRouter();
  const { createAudit } = useAudit();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AuditDraft>(emptyDraft);
  const [authorized, setAuthorized] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const readyToConnect = Boolean(draft.projectName.trim() && draft.repositoryUrl.trim() && draft.stagingUrl.trim());
  const selectedDomains = auditDomains.filter((domain) => domain.categories.some((category) => draft.selectedModules.includes(category)));
  const selectedCount = selectedDomains.length;
  const selectedJourneys = useMemo(
    () => planJourneys.filter((journey) => draft.selectedModules.includes(journey.category)),
    [draft.selectedModules],
  );

  function patchDraft<K extends keyof AuditDraft>(key: K, value: AuditDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleDomain(domain: AuditDomain) {
    setDraft((current) => ({
      ...current,
      selectedModules: domain.categories.every((category) => current.selectedModules.includes(category))
        ? current.selectedModules.filter((item) => !domain.categories.includes(item))
        : [...new Set([...current.selectedModules, ...domain.categories])],
    }));
  }

  function useSample() {
    setDraft({ ...sampleDraft, selectedModules: [...sampleDraft.selectedModules] });
    setAuthorized(false);
    setShowIssues(false);
  }

  function advance() {
    if (step === 1 && !readyToConnect) {
      setShowIssues(true);
      return;
    }
    if (step === 2 && !selectedCount) {
      setShowIssues(true);
      return;
    }
    setShowIssues(false);
    setStep((current) => Math.min(3, current + 1));
  }

  function launch() {
    if (!authorized || !readyToConnect || !selectedCount) {
      setShowIssues(true);
      return;
    }
    const id = createAudit(draft);
    router.push(`/audits/${id}`);
  }

  return (
    <div className="page page--wizard">
      <div className="page-heading page-heading--split">
        <div>
          <div className="eyebrow"><span className="demo-chip">demo mode</span>Authorized release review</div>
          <h1>Build an audit around what your product must prove.</h1>
          <p>Connect the release surface, define the intent, and approve a scoped evidence plan.</p>
        </div>
        <button type="button" className="button button--quiet" onClick={useSample}>
          <WandSparkles size={16} /> Use sample SaaS
        </button>
      </div>

      <div className="wizard-progress" aria-label={`Step ${step} of 3`}>
        {wizardSteps.map(({ number, label }) => (
          <div className={cn("wizard-progress__step", step === number && "wizard-progress__step--active", step > number && "wizard-progress__step--complete")} key={number}>
            <span>{step > number ? <Check size={14} /> : number}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="wizard-screen wizard-screen--connect">
          <GlassPanel className="audit-dock" tone="focus">
            <div className="audit-dock__rail" aria-hidden="true"><span /><span /></div>
            <DockStation
              number="01"
              icon={<FolderGit2 size={21} />}
              title="Repository"
              status={draft.repositoryUrl ? "Connected" : "Awaiting source"}
              complete={Boolean(draft.repositoryUrl)}
            >
              <label className="field-label">
                Repository URL or path
                <div className={cn("field-shell", showIssues && !draft.repositoryUrl && "field-shell--error")}>
                  <FolderGit2 size={16} />
                  <input
                    value={draft.repositoryUrl}
                    onChange={(event) => patchDraft("repositoryUrl", event.target.value)}
                    placeholder="github.com/your-org/your-app"
                    autoComplete="off"
                  />
                </div>
              </label>
              <label className="field-label field-label--inline">
                Branch
                <div className="field-shell field-shell--compact"><input value={draft.branch} onChange={(event) => patchDraft("branch", event.target.value)} placeholder="main" /></div>
              </label>
            </DockStation>

            <DockStation
              number="02"
              icon={<Link2 size={21} />}
              title="Running app"
              status={draft.stagingUrl ? `${draft.environment} target` : "Awaiting target"}
              complete={Boolean(draft.stagingUrl)}
            >
              <label className="field-label">
                Authorized staging URL
                <div className={cn("field-shell", showIssues && !draft.stagingUrl && "field-shell--error")}>
                  <Link2 size={16} />
                  <input value={draft.stagingUrl} onChange={(event) => patchDraft("stagingUrl", event.target.value)} placeholder="https://staging.your-app.com" inputMode="url" />
                </div>
              </label>
              <div className="environment-options" role="radiogroup" aria-label="Target environment">
                {(["staging", "preview", "production"] as const).map((environment) => (
                  <button
                    type="button"
                    key={environment}
                    className={cn("environment-option", draft.environment === environment && "environment-option--selected")}
                    onClick={() => patchDraft("environment", environment)}
                    role="radio"
                    aria-checked={draft.environment === environment}
                  >
                    {environment}
                  </button>
                ))}
              </div>
            </DockStation>

            <DockStation
              number="03"
              icon={<FileText size={21} />}
              title="Release intent"
              status={draft.productIntent ? "Intent captured" : "Tell us what must work"}
              complete={Boolean(draft.productIntent)}
            >
              <label className="field-label">
                What should users reliably be able to do?
                <div className={cn("textarea-shell", showIssues && !draft.productIntent && "field-shell--error")}>
                  <textarea
                    value={draft.productIntent}
                    onChange={(event) => patchDraft("productIntent", event.target.value)}
                    placeholder="For example: teams can create projects, invite teammates, upload files, and export reports."
                    rows={4}
                  />
                </div>
              </label>
              <label className="field-label">
                Project name
                <div className={cn("field-shell", showIssues && !draft.projectName && "field-shell--error")}>
                  <input value={draft.projectName} onChange={(event) => patchDraft("projectName", event.target.value)} placeholder="Acme workspace" />
                </div>
              </label>
            </DockStation>
          </GlassPanel>
          <div className="wizard-note"><LockKeyhole size={15} />Credentials are never requested in this local demo. Real test credentials remain server-side in a future isolated runner.</div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-screen wizard-screen--scope">
          <div className="scope-copy">
            <span className="panel-kicker">Expert audit teams</span>
            <h2>Choose the team your release needs.</h2>
            <p>Specialists work inside three clear readings, so your team can understand the decision without choosing from a wall of technical tools.</p>
          </div>
          <div className="domain-scope-grid">
            {auditDomains.map((domain) => {
              const selected = domain.categories.every((category) => draft.selectedModules.includes(category));
              const Icon = domainIcons[domain.id];
              return (
                <button
                  type="button"
                  key={domain.id}
                  className={cn("domain-scope-card", selected && "domain-scope-card--selected")}
                  onClick={() => toggleDomain(domain)}
                  aria-pressed={selected}
                >
                  <span className="domain-scope-card__check">{selected ? <Check size={14} /> : null}</span>
                  <span className="domain-scope-card__number">{domain.number}</span>
                  <span className="domain-scope-card__icon"><Icon size={19} /></span>
                  <span className="domain-scope-card__copy"><strong>{domain.label}</strong><small>{domain.description}</small></span>
                  <span className="domain-scope-card__agents">{domain.agents.length} specialist agents</span>
                </button>
              );
            })}
          </div>
          <GlassPanel className="scope-mini-plan" tone="mist">
            <div><span className="panel-kicker">Selected audit team</span><strong>{selectedCount} readings · {selectedJourneys.length} product journeys</strong></div>
            <div className="journey-chips">
              {selectedJourneys.slice(0, 3).map((journey) => <span key={journey.title}>{journey.title}</span>)}
              {selectedJourneys.length > 3 ? <span>+{selectedJourneys.length - 3} more</span> : null}
            </div>
          </GlassPanel>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="wizard-screen wizard-screen--plan">
          <div className="plan-layout">
            <GlassPanel className="test-charter" tone="focus">
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">Generated test charter</span>
                  <h2>{draft.projectName || "Your release"}</h2>
                </div>
                <span className="plan-count">{selectedJourneys.length} journeys</span>
              </div>
              <div className="test-charter__intent">
                <Sparkles size={16} />
                <p>{draft.productIntent || "No intent entered yet."}</p>
              </div>
              <div className="test-charter__items">
                {selectedJourneys.map((journey, index) => (
                  <div className="test-plan-item" key={journey.title}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <CategoryIcon category={journey.category} size={16} />
                    <div><strong>{journey.title}</strong><p>{journey.detail}</p></div>
                    <CheckCircle2 size={17} />
                  </div>
                ))}
              </div>
            </GlassPanel>

            <div className="approval-stack">
              <GlassPanel className="authorization-card" tone="standard">
                <div className="authorization-card__icon"><ShieldCheck size={19} /></div>
                <h3>Confirm audit authorization</h3>
                <p>Only launch reviews against systems your team owns or has explicit written permission to assess. Active or destructive scanning is not part of demo mode.</p>
                <label className={cn("authorization-check", showIssues && !authorized && "authorization-check--error")}>
                  <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} />
                  <span><Check size={14} /></span>
                  I am authorized to assess this target.
                </label>
              </GlassPanel>
              <GlassPanel className="demo-safety-card" tone="mist">
                <CircleDashed size={18} />
                <div><span className="panel-kicker">Demo safety boundary</span><strong>No external test, request, or credential is sent from this build.</strong></div>
              </GlassPanel>
              {showIssues && !authorized ? <p className="inline-error">Confirm authorization to launch the release review.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {showIssues && step !== 3 ? <p className="inline-error">Complete the highlighted fields before continuing.</p> : null}
      <div className="wizard-footer">
        <button type="button" className="button button--quiet" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
          <ArrowLeft size={16} /> Back
        </button>
        {step < 3 ? (
          <button type="button" className="button button--primary" onClick={advance}>
            {step === 1 ? "Define audit scope" : "Generate audit plan"} <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="button button--primary button--launch" onClick={launch}>
            <Cloud size={16} /> Launch authorized audit
          </button>
        )}
      </div>
    </div>
  );
}

function DockStation({
  number,
  icon,
  title,
  status,
  complete,
  children,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  status: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("dock-station", complete && "dock-station--complete")}>
      <div className="dock-station__heading">
        <span className="dock-station__number">{number}</span>
        <span className="dock-station__icon">{icon}</span>
        <div><h2>{title}</h2><p>{status}</p></div>
        <span className="dock-station__status">{complete ? <Check size={14} /> : <Plus size={14} />}</span>
      </div>
      <div className="dock-station__body">{children}</div>
    </div>
  );
}
