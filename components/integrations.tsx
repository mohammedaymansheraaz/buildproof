"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Check,
  Cloud,
  Database,
  ExternalLink,
  FolderGit2,
  Gauge,
  KeyRound,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  X,
} from "lucide-react";
import { GlassPanel } from "@/components/ui";
import { cn } from "@/lib/utils";

type Health = {
  mode: "demo" | "connected";
  integrations: Record<string, boolean>;
};

const integrationCards = [
  { id: "github", icon: FolderGit2, title: "GitHub", detail: "Import private repositories and create owner-approved draft PRs.", env: ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY", "GITHUB_WEBHOOK_SECRET"] },
  { id: "openai", icon: Bot, title: "OpenAI", detail: "Generate test charters, explain evidence, and draft review briefs.", env: ["OPENAI_API_KEY", "OPENAI_MODEL"] },
  { id: "runner", icon: ServerCog, title: "Isolated audit runner", detail: "Run authorized Playwright and scanner jobs outside the web process.", env: ["AUDIT_RUNNER_URL", "AUDIT_RUNNER_TOKEN"] },
  { id: "database", icon: Database, title: "PostgreSQL", detail: "Persist organizations, audits, findings, and release passports.", env: ["DATABASE_URL"] },
  { id: "storage", icon: Cloud, title: "Evidence storage", detail: "Store screenshots, Playwright traces, and generated reports.", env: ["S3_BUCKET", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] },
  { id: "redis", icon: Gauge, title: "Queue & orchestration", detail: "Drive durable, long-running audit jobs and event delivery.", env: ["REDIS_URL"] },
];

export function Integrations() {
  const [health, setHealth] = useState<Health | undefined>();
  const [selected, setSelected] = useState<(typeof integrationCards)[number] | undefined>();

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: Health) => setHealth(data))
      .catch(() => setHealth({ mode: "demo", integrations: {} }));
  }, []);

  return (
    <div className="page page--integrations">
      <div className="page-heading page-heading--split">
        <div><div className="eyebrow"><span className="demo-chip">safe by default</span>Integration control plane</div><h1>Connect capability only when you are ready to own it.</h1><p>BuildProof keeps privileged services explicit, server-only, and independently observable.</p></div>
        <div className={cn("integration-mode", health?.mode === "connected" && "integration-mode--connected")}><span>{health?.mode === "connected" ? <Check size={15} /> : <LockKeyhole size={15} />}</span>{health?.mode === "connected" ? "Partially connected" : "Demo mode active"}</div>
      </div>

      <GlassPanel className="integration-safety" tone="focus"><ShieldCheck size={19} /><div><span className="panel-kicker">Audit safety contract</span><strong>Real runners should only operate on explicitly authorized targets, in disposable infrastructure, with production disabled by default.</strong></div></GlassPanel>

      <div className="integration-grid">
        {integrationCards.map((card) => {
          const Icon = card.icon;
          const connected = Boolean(health?.integrations[card.id]);
          return <button type="button" className={cn("integration-card", connected && "integration-card--connected")} onClick={() => setSelected(card)} key={card.id}><span className="integration-card__icon"><Icon size={20} /></span><div><div className="integration-card__title"><strong>{card.title}</strong><span>{connected ? "connected" : "not configured"}</span></div><p>{card.detail}</p></div><ExternalLink size={16} /></button>;
        })}
      </div>

      <GlassPanel className="integration-runbook" tone="mist"><KeyRound size={18} /><div><span className="panel-kicker">Configuration runbook</span><strong>Use the documented environment contract in <code>.env.example</code>. Supabase keys are required for real authenticated audit storage.</strong></div></GlassPanel>

      {selected ? <div className="integration-drawer-backdrop" role="presentation" onMouseDown={() => setSelected(undefined)}><div className="integration-drawer" role="dialog" aria-modal="true" aria-label={`${selected.title} setup`} onMouseDown={(event) => event.stopPropagation()}><button className="icon-button integration-drawer__close" type="button" onClick={() => setSelected(undefined)} aria-label="Close integration setup"><X size={17} /></button><span className="integration-drawer__icon"><selected.icon size={23} /></span><span className="panel-kicker">Configure {selected.title}</span><h2>Keep credentials off the client.</h2><p>{selected.detail}</p><div className="env-list">{selected.env.map((name) => <code key={name}>{name}=</code>)}</div><div className="integration-drawer__note"><LockKeyhole size={16} />Add these values to your private deployment environment, never to a public client variable.</div></div></div> : null}
    </div>
  );
}
