"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Check,
  CircleAlert,
  Cpu,
  Gauge,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  PlugZap,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { GlassPanel, MetricBar } from "@/components/ui";
import { aiModelPresets, type AiModelPreset, type AiModelProviderId } from "@/lib/ai-model-catalog";
import { cn } from "@/lib/utils";

type DeploymentStatus = {
  provider: string;
  configured: boolean;
  model: string | null;
  mode: "live" | "unavailable";
  source: "user" | "deployment" | "none";
  connectionId?: string;
  score?: number | null;
  rating?: string | null;
  hasOpenAiKey: boolean;
  hasOpenRouterKey: boolean;
  hasNebiusKey: boolean;
  hasCredentialEncryptionKey: boolean;
};

type StorageStatus = {
  mode: "encrypted-supabase" | "direct-supabase" | "schema-missing" | "unconfigured";
  canPersist: boolean;
  encryptionReady: boolean;
  message: string;
};

type SavedModelConnection = {
  id: string;
  provider: AiModelProviderId;
  providerLabel: string;
  model: string;
  baseUrl: string;
  maskedKey: string;
  status: "tested" | "failed" | "disabled";
  score: number | null;
  rating: string | null;
  isDefault: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ModelsPayload = {
  presets: AiModelPreset[];
  deployment: DeploymentStatus;
  connections: SavedModelConnection[];
  defaultConnection: SavedModelConnection | null;
  storage: StorageStatus;
};

type TestResult = {
  ok: boolean;
  provider: AiModelProviderId;
  providerLabel: string;
  model: string;
  requestedModel: string;
  baseUrl: string;
  latencyMs: number;
  score: number;
  rating: string;
  maskedKey: string;
  usedDeploymentKey: boolean;
  outputPreview: string;
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  strengths: string[];
  warnings: string[];
  error?: string;
};

function providerHasDeploymentKey(provider: AiModelProviderId, deployment?: DeploymentStatus) {
  if (!deployment) return false;
  if (provider === "openai") return deployment.hasOpenAiKey;
  if (provider === "openrouter") return deployment.hasOpenRouterKey;
  if (provider === "nebius") return deployment.hasNebiusKey;
  return false;
}

function formatProvider(provider: AiModelProviderId) {
  if (provider === "custom-openai") return "Custom OpenAI-compatible";
  if (provider === "openrouter") return "OpenRouter";
  if (provider === "nebius") return "Nebius";
  return "OpenAI";
}

function fallbackPayload(): ModelsPayload {
  return {
    presets: aiModelPresets,
    deployment: {
      provider: "none",
      configured: false,
      model: null,
      mode: "unavailable",
      source: "none",
      hasOpenAiKey: false,
      hasOpenRouterKey: false,
      hasNebiusKey: false,
      hasCredentialEncryptionKey: false,
    },
    connections: [],
    defaultConnection: null,
    storage: {
      mode: "unconfigured",
      canPersist: false,
      encryptionReady: false,
      message: "Model catalog loaded locally. Sign in and configure Supabase before saving BYOK keys.",
    },
  };
}

export function AiModels() {
  const [payload, setPayload] = useState<ModelsPayload | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState(aiModelPresets[0]?.id ?? "");
  const selectedPreset = useMemo(
    () => (payload?.presets ?? aiModelPresets).find((preset) => preset.id === selectedPresetId) ?? aiModelPresets[0],
    [payload, selectedPresetId],
  );
  const [provider, setProvider] = useState<AiModelProviderId>(selectedPreset.provider);
  const [model, setModel] = useState(selectedPreset.model);
  const [baseUrl, setBaseUrl] = useState(selectedPreset.baseUrl);
  const [apiKey, setApiKey] = useState("");
  const [useDeploymentKey, setUseDeploymentKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingConnectionId, setUpdatingConnectionId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  async function loadModels() {
    try {
      const response = await fetch("/api/ai-models", { cache: "no-store" });
      if (!response.ok) throw new Error("Model catalog could not be loaded.");
      const data = await response.json() as ModelsPayload;
      setPayload(data);
    } catch {
      setPayload(fallbackPayload());
    }
  }

  useEffect(() => {
    void loadModels();
  }, []);

  function selectPreset(preset: AiModelPreset) {
    setSelectedPresetId(preset.id);
    setProvider(preset.provider);
    setModel(preset.model);
    setBaseUrl(preset.baseUrl);
    setUseDeploymentKey(false);
    setTestResult(null);
    setTestError(null);
    setSaveError(null);
    setSaveMessage(null);
  }

  async function testModel() {
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/ai-models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: selectedPresetId,
          provider,
          model,
          baseUrl,
          apiKey,
          useDeploymentKey,
        }),
      });
      const result = await response.json() as TestResult | { error?: string };

      if (!response.ok) {
        throw new Error("error" in result && result.error ? result.error : "The model could not be tested.");
      }

      setTestResult(result as TestResult);
    } catch (error) {
      setTestError(error instanceof Error ? error.message : "The model could not be tested.");
    } finally {
      setTesting(false);
    }
  }

  async function saveModel() {
    if (!testResult?.ok) return;
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/ai-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          presetId: selectedPresetId,
          provider,
          model,
          baseUrl,
          apiKey,
        }),
      });
      const result = await response.json() as Partial<ModelsPayload> & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "The model could not be saved.");

      setPayload((current) => ({
        ...(current ?? fallbackPayload()),
        connections: result.connections ?? current?.connections ?? [],
        defaultConnection: result.defaultConnection ?? current?.defaultConnection ?? null,
        storage: result.storage ?? current?.storage ?? fallbackPayload().storage,
      }));
      setApiKey("");
      setUseDeploymentKey(false);
      setSaveMessage("Saved as the default BuildProof brain. Reports will use this model automatically.");
      void loadModels();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "The model could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(connectionId: string) {
    setUpdatingConnectionId(connectionId);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const response = await fetch("/api/ai-models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_default", connectionId }),
      });
      const result = await response.json() as Partial<ModelsPayload> & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Default model could not be updated.");
      await loadModels();
      setSaveMessage("Default AI model updated.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Default model could not be updated.");
    } finally {
      setUpdatingConnectionId(null);
    }
  }

  async function deleteConnection(connectionId: string) {
    setUpdatingConnectionId(connectionId);
    setSaveError(null);
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/ai-models?id=${encodeURIComponent(connectionId)}`, { method: "DELETE" });
      const result = await response.json() as Partial<ModelsPayload> & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Saved model could not be deleted.");
      await loadModels();
      setSaveMessage("Saved model removed.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Saved model could not be deleted.");
    } finally {
      setUpdatingConnectionId(null);
    }
  }

  const activeModel = payload?.defaultConnection ?? null;
  const deploymentKeyAvailable = providerHasDeploymentKey(provider, payload?.deployment);
  const canTest = Boolean(model.trim() && baseUrl.trim() && (apiKey.trim() || (useDeploymentKey && deploymentKeyAvailable)));
  const canSave = Boolean(testResult?.ok && apiKey.trim() && payload?.storage.canPersist && !useDeploymentKey && !saving);
  const score = testResult?.score ?? selectedPreset.defaultScore;

  return (
    <div className="page page--models">
      <div className="page-heading page-heading--split">
        <div>
          <div className="eyebrow"><span className="demo-chip">bring your own key</span>AI model control plane</div>
          <h1>Let every team run BuildProof with their own model budget.</h1>
          <p>Choose a top preset, paste an API key once, test the connection, then save it as the default brain for reports and agent synthesis.</p>
        </div>
        <div className={cn("model-deployment-pill", payload?.deployment.configured && "model-deployment-pill--live")}>
          <span>{payload?.deployment.configured ? <Check size={14} /> : <LockKeyhole size={14} />}</span>
          {payload?.deployment.configured
            ? `${payload.deployment.source === "user" ? "Saved default" : "Deployment"} · ${payload.deployment.model}`
            : "No AI default"}
        </div>
      </div>

      <div className="models-hero-grid">
        <GlassPanel className="model-active-card" tone="focus">
          <div className="panel-heading panel-heading--tight">
            <div><span className="panel-kicker">Active model</span><h2>{activeModel ? activeModel.model : "No saved BYOK model yet"}</h2></div>
            <Bot size={20} />
          </div>
          <p>{activeModel ? `${activeModel.providerLabel} · score ${activeModel.score ?? "—"}/10 · ${activeModel.rating ?? "tested"}` : "Test and save a model once. BuildProof stores the key server-side in Supabase and uses it automatically for AI briefs and CTO reports."}</p>
          <div className="model-active-card__facts">
            <span><KeyRound size={13} />{activeModel?.maskedKey ?? "key not stored"}</span>
            <span><ShieldCheck size={13} />raw keys never display</span>
            <span><Sparkles size={13} />{payload?.deployment.source === "deployment" ? "deployment fallback" : payload?.deployment.source === "user" ? "server saved default" : "waiting for model"}</span>
          </div>
        </GlassPanel>

        <GlassPanel className="model-token-card" tone="mist">
          <WandSparkles size={18} />
          <div>
            <span className="panel-kicker">Cost guidance</span>
            <strong>Free or low-cost models are enough for demos and most short summaries.</strong>
            <p>Use premium models mainly for CTO-level final reports, complex source reasoning, or high-confidence customer demos.</p>
          </div>
        </GlassPanel>

        <GlassPanel className="model-token-card" tone="mist">
          <LockKeyhole size={18} />
          <div>
            <span className="panel-kicker">Key handling</span>
            <strong>{payload?.storage.message ?? "Loading secure key storage status..."}</strong>
            <p>{payload?.storage.mode === "encrypted-supabase" ? "Keys are encrypted with the server credential secret before Supabase persistence." : payload?.storage.canPersist ? "For the submission build, saving works without an extra encryption secret; raw keys are never returned to the browser." : "You can still test a key, but persistent judge-ready storage needs the missing setup item above."}</p>
          </div>
        </GlassPanel>
      </div>

      <div className="models-workbench">
        <GlassPanel className="model-catalog-panel" tone="standard">
          <div className="panel-heading">
            <div><span className="panel-kicker">Top model presets</span><h2>Pick the brain for this workspace</h2></div>
            <Cpu size={18} />
          </div>
          <div className="model-catalog-grid">
            {(payload?.presets ?? aiModelPresets).map((preset) => (
              <button
                type="button"
                key={preset.id}
                className={cn("model-preset-card", selectedPresetId === preset.id && "model-preset-card--selected")}
                onClick={() => selectPreset(preset)}
              >
                <span className="model-preset-card__top"><strong>{preset.label}</strong><em>{preset.costTier}</em></span>
                <span>{preset.providerLabel}</span>
                <p>{preset.tagline}</p>
                <div>{preset.bestFor.slice(0, 3).map((item) => <i key={item}>{item}</i>)}</div>
              </button>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel className="model-test-panel" tone="focus">
          <div className="panel-heading">
            <div><span className="panel-kicker">Connection test</span><h2>{selectedPreset.label}</h2></div>
            <span className="model-score-orb"><strong>{score}</strong><small>/10</small></span>
          </div>

          <div className="model-form-grid">
            <label className="field-label">
              Provider
              <select className="model-select" value={provider} onChange={(event) => setProvider(event.target.value as AiModelProviderId)}>
                <option value="openai">OpenAI</option>
                <option value="openrouter">OpenRouter</option>
                <option value="nebius">Nebius Token Factory</option>
                <option value="custom-openai">Custom OpenAI-compatible</option>
              </select>
            </label>

            <label className="field-label">
              Model
              <div className="field-shell">
                <Bot size={16} />
                <input value={model} onChange={(event) => setModel(event.target.value)} placeholder="provider/model-name" />
              </div>
            </label>

            <label className="field-label model-form-grid__wide">
              Base URL
              <div className="field-shell">
                <PlugZap size={16} />
                <input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.provider.com/v1" />
              </div>
            </label>

            <label className="field-label model-form-grid__wide">
              API key
              <div className="field-shell">
                <KeyRound size={16} />
                <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={deploymentKeyAvailable ? "Paste key, or test with deployment key below" : "Paste provider API key"} type="password" autoComplete="off" />
              </div>
            </label>
          </div>

          <label className={cn("model-deployment-toggle", !deploymentKeyAvailable && "model-deployment-toggle--disabled")}>
            <input
              type="checkbox"
              checked={useDeploymentKey}
              disabled={!deploymentKeyAvailable}
              onChange={(event) => setUseDeploymentKey(event.target.checked)}
            />
            <span><Check size={13} /></span>
            Test with configured deployment key for {formatProvider(provider)}
            {!deploymentKeyAvailable ? <em>not configured</em> : null}
          </label>

          <div className="model-test-actions">
            <button type="button" className="button button--primary" onClick={testModel} disabled={!canTest || testing}>
              {testing ? <LoaderCircle size={16} className="repository-inspection__spinner" /> : <Activity size={16} />}
              {testing ? "Testing model..." : "Test key + model"}
            </button>
            <button type="button" className="button button--quiet" onClick={saveModel} disabled={!canSave}>
              {saving ? <LoaderCircle size={16} className="repository-inspection__spinner" /> : <Sparkles size={16} />}
              {saving ? "Saving model key..." : "Save as default brain"}
            </button>
          </div>

          {saveMessage ? <div className="model-test-result model-test-result--success"><Check size={17} /><div><strong>Model saved</strong><p>{saveMessage}</p></div></div> : null}

          {saveError ? (
            <div className="model-test-result model-test-result--error">
              <CircleAlert size={17} />
              <div><strong>Model save failed</strong><p>{saveError}</p></div>
            </div>
          ) : null}

          {testError ? (
            <div className="model-test-result model-test-result--error">
              <CircleAlert size={17} />
              <div><strong>Model test failed</strong><p>{testError}</p></div>
            </div>
          ) : null}

          {testResult?.ok ? (
            <div className="model-test-result">
              <div className="model-test-result__score"><strong>{testResult.score}</strong><span>{testResult.rating}</span></div>
              <div className="model-test-result__body">
                <p>{testResult.outputPreview}</p>
                <div className="model-test-result__metrics">
                  <span><Gauge size={13} />{testResult.latencyMs}ms</span>
                  <span><KeyRound size={13} />{testResult.maskedKey}</span>
                  <span><Bot size={13} />{testResult.model}</span>
                </div>
                <MetricBar value={testResult.score * 10} tone={testResult.score >= 8 ? "sage" : testResult.score >= 6.5 ? "copper" : "rose"} />
                <div className="model-test-result__lists">
                  <div>{testResult.strengths.map((item) => <span key={item}><Check size={12} />{item}</span>)}</div>
                  {testResult.warnings.length ? <div>{testResult.warnings.map((item) => <span key={item}><CircleAlert size={12} />{item}</span>)}</div> : null}
                  {useDeploymentKey ? <div><span><CircleAlert size={12} />Deployment-key tests are not saved as personal BYOK defaults. Paste a key above to save it once for this user.</span></div> : null}
                </div>
              </div>
            </div>
          ) : null}

          {payload?.connections.length ? (
            <div className="model-saved-list">
              <span className="panel-kicker">Saved BYOK models</span>
              {payload.connections.map((connection) => (
                <div className="model-saved-row" key={connection.id}>
                  <div>
                    <strong>{connection.model}</strong>
                    <span>{connection.providerLabel} · {connection.maskedKey} · score {connection.score ?? "—"}/10</span>
                  </div>
                  <button type="button" className="button button--quiet" disabled={connection.isDefault || updatingConnectionId === connection.id} onClick={() => void setDefault(connection.id)}>
                    <Star size={14} /> {connection.isDefault ? "Default" : "Use"}
                  </button>
                  <button type="button" className="button button--quiet" disabled={updatingConnectionId === connection.id} onClick={() => void deleteConnection(connection.id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </GlassPanel>
      </div>
    </div>
  );
}
