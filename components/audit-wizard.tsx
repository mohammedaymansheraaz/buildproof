"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  Check,
  CheckCircle2,
  CircleDashed,
  Cloud,
  CloudCog,
  FileSearch,
  FileText,
  FolderGit2,
  Link2,
  LockKeyhole,
  LoaderCircle,
  MousePointer2,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { sampleDraft } from "@/lib/demo-data";
import { auditDomains, type AuditDomain, type AuditDomainId } from "@/lib/audit-domains";
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
  { domainId: "product", title: "Understand the product", detail: "Map the stated intent, critical journeys, roles, and approved evidence surface.", category: "product" as const },
  { domainId: "experience", title: "Prove the customer experience", detail: "Replay journeys, UI behavior, functional QA, and accessible interaction.", category: "functional" as const },
  { domainId: "engineering", title: "Trace engineering and scale", detail: "Inspect performance, APIs, cloud, database, delivery, and code evidence when access is available.", category: "performance" as const },
  { domainId: "security", title: "Review security and reliability", detail: "Explain authorized authorization, data protection, and reliability signals with proof.", category: "security" as const },
  { domainId: "ai-launch", title: "Prepare the launch decision", detail: "Evaluate AI only when present, then combine risk, cost, and ownership into a CTO-ready brief.", category: "launch" as const },
] satisfies Array<{ domainId: AuditDomainId; title: string; detail: string; category: "product" | "functional" | "performance" | "security" | "launch" }>;

const wizardSteps = [
  { number: 1, label: "Connect release" },
  { number: 2, label: "Define scope" },
  { number: 3, label: "Approve plan" },
];

type TargetMode = "url" | "repo" | "both";

const targetModeOptions = [
  {
    mode: "url",
    label: "URL only",
    title: "Inspect the running app",
    detail: "Best when you have a deployed preview or staging link but no repository access.",
    proof: "browser · accessibility · performance · passive HTTP",
  },
  {
    mode: "repo",
    label: "GitHub repo only",
    title: "Inspect the source",
    detail: "Best when the app is not deployed yet, but you want code, dependency, CI/CD, and architecture review.",
    proof: "source map · dependencies · CI/CD · config",
  },
  {
    mode: "both",
    label: "URL + GitHub",
    title: "Fullest MVP coverage",
    detail: "Best evidence: compare the live app behavior with the source, workflow, and security surface.",
    proof: "running app + source intelligence",
  },
] satisfies Array<{ mode: TargetMode; label: string; title: string; detail: string; proof: string }>;

const domainIcons = {
  product: FileSearch,
  experience: MousePointer2,
  engineering: CloudCog,
  security: ShieldCheck,
  "ai-launch": Rocket,
} satisfies Record<AuditDomainId, typeof MousePointer2>;

type RepositoryInspection = {
  reference: {
    owner: string;
    repository: string;
    canonicalUrl: string;
  };
  status: "connected" | "public_metadata" | "needs_connection";
  sourceCoverage: "repository" | "metadata_only" | "unavailable";
  repository: {
    name: string;
    fullName: string;
    description: string | null;
    defaultBranch: string;
    private: boolean;
    updatedAt: string;
    primaryLanguage: string | null;
  } | null;
  signals: {
    packageManifest: boolean;
    workflows: number;
    languages: string[];
  };
  limitation: string | null;
};

type RepositoryInspectionState = "idle" | "loading" | "success" | "error";

function isRepositoryInspection(value: unknown): value is RepositoryInspection {
  if (!value || typeof value !== "object") return false;

  const result = value as Partial<RepositoryInspection>;
  return (
    (result.status === "connected" || result.status === "public_metadata" || result.status === "needs_connection") &&
    (result.sourceCoverage === "repository" || result.sourceCoverage === "metadata_only" || result.sourceCoverage === "unavailable") &&
    Boolean(result.reference) &&
    Boolean(result.signals)
  );
}

function hasRepositorySourceEvidence(inspection: RepositoryInspection | null) {
  return inspection?.status === "connected" && inspection.sourceCoverage === "repository";
}

function getRepositoryStatusLabel(inspection: RepositoryInspection | null, state: RepositoryInspectionState, hasRepositorySource: boolean) {
  if (state === "loading") return "Inspecting repository metadata";
  if (state === "error") return "Repository inspection unavailable";
  if (hasRepositorySourceEvidence(inspection)) return "Repository evidence connected";
  if (inspection?.status === "public_metadata" || inspection?.sourceCoverage === "metadata_only") return "Public metadata connected";
  if (inspection?.status === "needs_connection") return "Connection required for source evidence";
  return hasRepositorySource ? "Ready to inspect optional source" : "Optional source evidence";
}

function getCoverageTitle(inspection: RepositoryInspection | null, hasRepositorySource: boolean) {
  if (hasRepositorySourceEvidence(inspection)) return "Repository evidence is ready for the scoped audit.";
  if (inspection?.status === "public_metadata" || inspection?.sourceCoverage === "metadata_only") return "Only public repository metadata is available.";
  if (inspection?.status === "needs_connection") return "Repository source needs an approved server-side connection.";
  return hasRepositorySource ? "Inspect the repository to establish its evidence boundary." : "Repository evidence is optional and not connected.";
}

function getCoverageDescription(inspection: RepositoryInspection | null) {
  if (inspection?.limitation) return inspection.limitation;
  if (hasRepositorySourceEvidence(inspection)) {
    return "Repository evidence can inform code, workflow, and dependency checks. Cloud, database, and deployment credentials remain outside the repository evidence boundary.";
  }
  return "A staging URL can provide browser, journey, accessibility, performance, and passive HTTP evidence. Private code, cloud configuration, database schema, and CI/CD evidence require a repository or approved integration.";
}

export function AuditWizard() {
  const router = useRouter();
  const { createAudit } = useAudit();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<AuditDraft>(emptyDraft);
  const [targetMode, setTargetMode] = useState<TargetMode>("both");
  const [authorized, setAuthorized] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [repositoryInspection, setRepositoryInspection] = useState<RepositoryInspection | null>(null);
  const [repositoryInspectionState, setRepositoryInspectionState] = useState<RepositoryInspectionState>("idle");
  const [repositoryInspectionError, setRepositoryInspectionError] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const inspectionRequestId = useRef(0);
  const inspectionAbortController = useRef<AbortController | null>(null);

  const hasRepositorySource = Boolean(draft.repositoryUrl.trim());
  const hasStagingTarget = Boolean(draft.stagingUrl.trim());
  const requiresStagingTarget = targetMode !== "repo";
  const requiresRepositorySource = targetMode !== "url";
  const readyToConnect = Boolean(
    draft.projectName.trim() &&
    draft.productIntent.trim() &&
    (!requiresStagingTarget || hasStagingTarget) &&
    (!requiresRepositorySource || hasRepositorySource),
  );
  const selectedDomains = auditDomains.filter((domain) => domain.categories.some((category) => draft.selectedModules.includes(category)));
  const selectedCount = selectedDomains.length;
  const selectedJourneys = planJourneys.filter((journey) => selectedDomains.some((domain) => domain.id === journey.domainId));
  const repositoryStatus = getRepositoryStatusLabel(repositoryInspection, repositoryInspectionState, hasRepositorySource);
  const repositoryCoverageDescription = repositoryInspection
    ? getCoverageDescription(repositoryInspection)
    : "Repository evidence can inform source structure, dependencies, CI/CD, configuration, architecture, and security signals. A running app URL is still needed for browser journeys.";
  const targetCoverageTitle = targetMode === "url"
    ? "URL-only audit selected: live application evidence will drive this run."
    : targetMode === "repo"
      ? hasRepositorySource
        ? getCoverageTitle(repositoryInspection, hasRepositorySource)
        : "GitHub repo-only audit selected: source evidence is required."
      : hasRepositorySource
        ? getCoverageTitle(repositoryInspection, hasRepositorySource)
        : "URL + GitHub selected: connect both targets for the strongest evidence.";
  const targetCoverageDescription = targetMode === "url"
    ? "BuildProof will inspect the reachable app surface first. Source, CI/CD, dependency, and architecture checks remain limited until a repository is added."
    : targetMode === "repo"
      ? hasRepositorySource
        ? repositoryCoverageDescription
        : "BuildProof can inspect source structure, dependencies, CI/CD, configuration, and security signals without a live app URL."
      : hasRepositorySource
        ? repositoryCoverageDescription
        : "Both mode compares running-app behavior with repository evidence. Add the GitHub repo to unlock source, dependency, CI/CD, and architecture coverage.";
  const missingTargetMessage = targetMode === "url"
    ? "Add a project name, product intent, and an authorized staging or preview URL."
    : targetMode === "repo"
      ? "Add a project name, product intent, and a GitHub repository URL or owner/repository path."
      : "Add a project name, product intent, authorized staging or preview URL, and GitHub repository.";

  function patchDraft<K extends keyof AuditDraft>(key: K, value: AuditDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function resetRepositoryInspection() {
    inspectionRequestId.current += 1;
    inspectionAbortController.current?.abort();
    inspectionAbortController.current = null;
    setRepositoryInspection(null);
    setRepositoryInspectionState("idle");
    setRepositoryInspectionError(null);
  }

  function handleRepositoryUrlChange(value: string) {
    patchDraft("repositoryUrl", value);
    resetRepositoryInspection();
  }

  async function inspectRepository() {
    const repositoryUrl = draft.repositoryUrl.trim();

    if (!repositoryUrl) {
      setRepositoryInspection(null);
      setRepositoryInspectionState("error");
      setRepositoryInspectionError("Enter a GitHub repository URL or owner/repository path before inspecting optional source evidence.");
      return;
    }

    const requestId = inspectionRequestId.current + 1;
    inspectionRequestId.current = requestId;
    inspectionAbortController.current?.abort();
    const controller = new AbortController();
    inspectionAbortController.current = controller;
    setRepositoryInspection(null);
    setRepositoryInspectionState("loading");
    setRepositoryInspectionError(null);

    try {
      const response = await fetch(`/api/github/repository?${new URLSearchParams({ repositoryUrl })}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (requestId !== inspectionRequestId.current) return;

      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "Repository inspection could not be completed. Check the URL and try again.";
        throw new Error(message);
      }

      if (!isRepositoryInspection(payload)) {
        throw new Error("Repository inspection returned an unexpected response. Please try again.");
      }

      setRepositoryInspection(payload);
      setRepositoryInspectionState("success");
    } catch (error) {
      if (requestId !== inspectionRequestId.current || (error instanceof DOMException && error.name === "AbortError")) return;
      setRepositoryInspection(null);
      setRepositoryInspectionState("error");
      setRepositoryInspectionError(error instanceof Error ? error.message : "Repository inspection could not be completed.");
    } finally {
      if (requestId === inspectionRequestId.current) inspectionAbortController.current = null;
    }
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
    setTargetMode("both");
    resetRepositoryInspection();
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

  async function launch() {
    if (!authorized || !readyToConnect || !selectedCount) {
      setShowIssues(true);
      return;
    }

    setLaunching(true);
    setLaunchError(null);
    const scopedDraft: AuditDraft = {
      ...draft,
      repositoryUrl: requiresRepositorySource ? draft.repositoryUrl.trim() : "",
      stagingUrl: requiresStagingTarget ? draft.stagingUrl.trim() : "",
    };

    try {
      const id = await createAudit(scopedDraft);
      router.push(`/audits/${id}`);
    } catch (error) {
      setLaunchError(error instanceof Error ? error.message : "BuildProof could not launch this audit.");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="page page--wizard">
      <div className="page-heading page-heading--split">
        <div>
          <div className="eyebrow"><span className="demo-chip">safe MVP runner</span>Authorized release review</div>
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
          <GlassPanel className="target-mode-panel" tone="mist">
            <div className="target-mode-panel__heading">
              <span className="panel-kicker">Audit target</span>
              <h2>Choose what BuildProof can inspect.</h2>
              <p>Different products are at different stages. Pick URL, GitHub repo, or both, and the evidence plan will match the access you actually have.</p>
            </div>
            <div className="target-mode-grid" role="radiogroup" aria-label="Choose audit target type">
              {targetModeOptions.map((option) => {
                const Icon = option.mode === "url" ? Link2 : option.mode === "repo" ? FolderGit2 : Sparkles;
                const selected = targetMode === option.mode;

                return (
                  <button
                    type="button"
                    key={option.mode}
                    className={cn("target-mode-card", selected && "target-mode-card--selected")}
                    onClick={() => {
                      setTargetMode(option.mode);
                      setShowIssues(false);
                      setLaunchError(null);
                    }}
                    role="radio"
                    aria-checked={selected}
                  >
                    <span className="target-mode-card__check">{selected ? <Check size={13} /> : null}</span>
                    <span className="target-mode-card__icon"><Icon size={18} /></span>
                    <span className="target-mode-card__label">{option.label}</span>
                    <strong>{option.title}</strong>
                    <small>{option.detail}</small>
                    <em>{option.proof}</em>
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          <GlassPanel className={cn("audit-dock", targetMode !== "both" && "audit-dock--two")} tone="focus">
            <div className="audit-dock__rail" aria-hidden="true"><span /><span /></div>
            {requiresStagingTarget ? (
              <DockStation
                number="01"
                icon={<Link2 size={21} />}
                title="Running app"
                status={draft.stagingUrl ? `${draft.environment} target` : "Required target"}
                complete={Boolean(draft.stagingUrl)}
              >
                <label className="field-label">
                  Authorized staging URL <small>{targetMode === "both" ? "required for URL + GitHub mode" : "required for URL-only mode"}</small>
                  <div className={cn("field-shell", showIssues && requiresStagingTarget && !hasStagingTarget && "field-shell--error")}>
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
            ) : null}

            <DockStation
              className={targetMode === "repo" ? "dock-station--last" : undefined}
              number="02"
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

            {requiresRepositorySource ? (
              <DockStation
                className={targetMode === "repo" ? "dock-station--source-first" : undefined}
                number={targetMode === "repo" ? "01" : "03"}
                icon={<FolderGit2 size={21} />}
                title={targetMode === "repo" ? "GitHub repository" : "GitHub source"}
                status={hasRepositorySource ? repositoryStatus : "Required source"}
                complete={hasRepositorySource}
              >
                <label className="field-label">
                  Repository URL or path <small>{targetMode === "repo" ? "required for repo-only mode" : "required for URL + GitHub mode"}</small>
                  <div className={cn("field-shell", showIssues && requiresRepositorySource && !hasRepositorySource && "field-shell--error")}>
                    <FolderGit2 size={16} />
                    <input
                      value={draft.repositoryUrl}
                      onChange={(event) => handleRepositoryUrlChange(event.target.value)}
                      placeholder="https://github.com/your-org/your-app or owner/repo"
                      autoComplete="off"
                      inputMode="url"
                      aria-describedby="repository-inspection-help"
                    />
                  </div>
                </label>
                <div className="repository-inspection__actions">
                  <button
                    type="button"
                    className="button button--quiet repository-inspection__button"
                    onClick={inspectRepository}
                    disabled={repositoryInspectionState === "loading" || !hasRepositorySource}
                    aria-describedby="repository-inspection-help"
                  >
                    {repositoryInspectionState === "loading" ? <LoaderCircle size={15} className="repository-inspection__spinner" /> : repositoryInspection ? <RefreshCw size={15} /> : <FileSearch size={15} />}
                    {repositoryInspectionState === "loading" ? "Inspecting…" : repositoryInspection ? "Refresh inspection" : "Inspect repository"}
                  </button>
                  <span id="repository-inspection-help">Preview source coverage through the server. The audit itself will inspect the repository again when launched.</span>
                </div>
                {repositoryInspectionState === "error" && repositoryInspectionError ? (
                  <div className="repository-inspection repository-inspection--error" role="alert">
                    <CircleAlert size={16} />
                    <p>{repositoryInspectionError}</p>
                  </div>
                ) : null}
                {repositoryInspection ? (
                  <div className="repository-inspection" aria-live="polite">
                    <div className="repository-inspection__header">
                      {hasRepositorySourceEvidence(repositoryInspection) ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}
                      <div>
                        <strong>{repositoryInspection.repository?.fullName ?? repositoryInspection.reference.canonicalUrl}</strong>
                        <span>{hasRepositorySourceEvidence(repositoryInspection) ? "Repository evidence connected" : repositoryInspection.status === "public_metadata" || repositoryInspection.sourceCoverage === "metadata_only" ? "Public metadata only" : "Source connection required"}</span>
                      </div>
                    </div>
                    {repositoryInspection.repository ? (
                      <dl className="repository-inspection__summary">
                        <div><dt>Branch</dt><dd>{repositoryInspection.repository.defaultBranch}</dd></div>
                        <div><dt>Language</dt><dd>{repositoryInspection.signals.languages[0] ?? repositoryInspection.repository.primaryLanguage ?? "Not detected"}</dd></div>
                        <div><dt>Package</dt><dd>{repositoryInspection.signals.packageManifest ? "package.json found" : "Not detected"}</dd></div>
                        <div><dt>Workflows</dt><dd>{repositoryInspection.signals.workflows} {repositoryInspection.signals.workflows === 1 ? "workflow" : "workflows"}</dd></div>
                      </dl>
                    ) : null}
                    {repositoryInspection.signals.languages.length > 1 ? (
                      <div className="repository-inspection__languages" aria-label="Detected repository languages">
                        {repositoryInspection.signals.languages.slice(0, 6).map((language) => <span key={language}>{language}</span>)}
                      </div>
                    ) : null}
                    {repositoryInspection.limitation ? <p className="repository-inspection__limitation">{repositoryInspection.limitation}</p> : null}
                  </div>
                ) : null}
                <label className="field-label field-label--inline">
                  Branch
                  <div className="field-shell field-shell--compact"><input value={draft.branch} onChange={(event) => patchDraft("branch", event.target.value)} placeholder="main" /></div>
                </label>
              </DockStation>
            ) : null}
          </GlassPanel>
          <GlassPanel className="source-coverage-note" tone="mist">
            {targetMode === "url" ? <Link2 size={17} /> : targetMode === "repo" ? <FolderGit2 size={17} /> : <Sparkles size={17} />}
            <div>
              <span className="panel-kicker">Evidence coverage boundary</span>
              <strong>{targetCoverageTitle}</strong>
              <p>{targetCoverageDescription}</p>
            </div>
          </GlassPanel>
          <div className="wizard-note"><LockKeyhole size={15} />Credentials are not requested in this pass. Real test credentials should live server-side in the isolated runner.</div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-screen wizard-screen--scope">
          <div className="scope-copy">
            <span className="panel-kicker">Expert audit teams</span>
            <h2>Choose the team your release needs.</h2>
            <p>Specialists work inside five clear readings, so your team can understand the decision without choosing from a wall of technical tools.</p>
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
                  data-domain={domain.id}
                >
                  <span className="domain-scope-card__check">{selected ? <Check size={14} /> : null}</span>
                  <span className="domain-scope-card__number">{domain.number}</span>
                  <span className="domain-scope-card__icon"><Icon size={19} /></span>
                  <span className="domain-scope-card__copy"><strong>{domain.label}</strong><small>{domain.description}</small></span>
                  <span className="domain-scope-card__agents">{domain.conditional ? "AI evaluation is conditional · " : ""}{domain.agents.length} specialist agents</span>
                </button>
              );
            })}
          </div>
          <GlassPanel className="scope-mini-plan" tone="mist">
            <div><span className="panel-kicker">Selected audit team</span><strong>{selectedCount} readings · {selectedJourneys.length} decision paths</strong></div>
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
                <span className="plan-count">{selectedJourneys.length} readings</span>
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
                <p>Only launch reviews against systems your team owns or has explicit written permission to assess. Active or destructive scanning is not part of the safe MVP runner.</p>
                <label className={cn("authorization-check", showIssues && !authorized && "authorization-check--error")}>
                  <input type="checkbox" checked={authorized} onChange={(event) => setAuthorized(event.target.checked)} />
                  <span><Check size={14} /></span>
                  I am authorized to assess this target.
                </label>
              </GlassPanel>
              <GlassPanel className="demo-safety-card" tone="mist">
                <CircleDashed size={18} />
                <div><span className="panel-kicker">MVP safety boundary</span><strong>No active exploit traffic or credentials are sent by this control-plane runner.</strong><p>Repository evidence is fetched only for the approved GitHub URL and staging checks remain passive.</p></div>
              </GlassPanel>
              <GlassPanel className="source-coverage-card" tone="mist">
                {targetMode === "url" ? <Link2 size={18} /> : targetMode === "repo" ? <FolderGit2 size={18} /> : <Sparkles size={18} />}
                <div><span className="panel-kicker">Selected target coverage</span><strong>{targetCoverageTitle}</strong><p>{targetCoverageDescription}</p></div>
              </GlassPanel>
              {showIssues && !authorized ? <p className="inline-error">Confirm authorization to launch the release review.</p> : null}
              {launchError ? <p className="inline-error">{launchError}</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {showIssues && step !== 3 ? <p className="inline-error">{missingTargetMessage}</p> : null}
      <div className="wizard-footer">
        <button type="button" className="button button--quiet" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>
          <ArrowLeft size={16} /> Back
        </button>
        {step < 3 ? (
          <button type="button" className="button button--primary" onClick={advance}>
            {step === 1 ? "Define audit scope" : "Generate audit plan"} <ArrowRight size={16} />
          </button>
        ) : (
          <button type="button" className="button button--primary button--launch" onClick={launch} disabled={launching}>
            {launching ? <LoaderCircle size={16} className="repository-inspection__spinner" /> : <Cloud size={16} />} {launching ? "Launching audit..." : "Launch authorized audit"}
          </button>
        )}
      </div>
    </div>
  );
}

function DockStation({
  className,
  number,
  icon,
  title,
  status,
  complete,
  children,
}: {
  className?: string;
  number: string;
  icon: React.ReactNode;
  title: string;
  status: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("dock-station", complete && "dock-station--complete", className)}>
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
