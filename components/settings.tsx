"use client";

import { useState } from "react";
import { AlertTriangle, Check, RotateCcw, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useAudit } from "@/components/audit-provider";
import { GlassPanel } from "@/components/ui";
import { cn } from "@/lib/utils";

const safetyDefaults = [
  { id: "staging", label: "Require staging or preview target", detail: "Future real runners block production targets unless an owner changes policy.", enabled: true },
  { id: "authorization", label: "Require target authorization", detail: "Every audit launch must carry an explicit authorization confirmation.", enabled: true },
  { id: "destructive", label: "Block destructive checks", detail: "Prevent brute-force, data mutation, and exploit-oriented testing from this control plane.", enabled: true },
  { id: "redact", label: "Redact sensitive evidence", detail: "Remove keys, cookies, headers, and secrets before evidence storage or model use.", enabled: true },
];

export function Settings() {
  const { resetDemo } = useAudit();
  const [policies, setPolicies] = useState(safetyDefaults);
  const [resetMessage, setResetMessage] = useState(false);

  function toggle(id: string) {
    setPolicies((current) => current.map((policy) => policy.id === id ? { ...policy, enabled: !policy.enabled } : policy));
  }

  function reset() {
    if (!window.confirm("Reset local demo audits and restore the sample workspace?")) return;
    resetDemo();
    setResetMessage(true);
  }

  return (
    <div className="page page--settings">
      <div className="page-heading"><div className="eyebrow"><span className="demo-chip">local workspace</span>Release guardrails</div><h1>Safety is part of the product surface.</h1><p>These local controls model the policy layer a production BuildProof deployment should enforce.</p></div>
      <div className="settings-layout">
        <GlassPanel className="policy-panel" tone="focus"><div className="panel-heading"><div><span className="panel-kicker">Runner policies</span><h2>Guardrails</h2></div><ShieldCheck size={19} /></div><div className="policy-list">{policies.map((policy) => <div className="policy-row" key={policy.id}><div><strong>{policy.label}</strong><p>{policy.detail}</p></div><button type="button" className={cn("switch", policy.enabled && "switch--on")} onClick={() => toggle(policy.id)} role="switch" aria-checked={policy.enabled} aria-label={policy.label}><span>{policy.enabled ? <Check size={12} /> : null}</span></button></div>)}</div></GlassPanel>
        <div className="settings-side"><GlassPanel className="settings-principle" tone="standard"><SlidersHorizontal size={18} /><span className="panel-kicker">Policy layer</span><h2>Rules decide. Models explain.</h2><p>Severity, authorization scope, and release gates need deterministic ownership rather than model-only judgment.</p></GlassPanel><GlassPanel className="demo-reset" tone="mist"><AlertTriangle size={18} /><div><span className="panel-kicker">Local demo data</span><strong>Restore the original sample audit.</strong><p>This clears only browser-local demo state. It does not touch a repository or external service.</p><button type="button" className="button button--quiet" onClick={reset}><RotateCcw size={16} /> Reset demo data</button>{resetMessage ? <span className="reset-message"><Check size={13} />Sample workspace restored</span> : null}</div></GlassPanel></div>
      </div>
    </div>
  );
}
