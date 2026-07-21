import "server-only";

import type { AiModelProviderId } from "@/lib/ai-model-catalog";
import { getAiModelPreset, maskApiKey } from "@/lib/ai-model-catalog";

export type RuntimeAiProviderId = AiModelProviderId;

export type RuntimeAiProviderConfig = {
  id: RuntimeAiProviderId;
  apiKey: string;
  baseUrl: string;
  model: string;
  source: "user" | "deployment";
  connectionId?: string;
  providerLabel?: string;
  score?: number | null;
  rating?: string | null;
  title?: string;
  siteUrl?: string;
};

export type RuntimeAiProviderStatus = {
  provider: RuntimeAiProviderId | "none";
  configured: boolean;
  model: string | null;
  mode: "live" | "unavailable";
  source: "user" | "deployment" | "none";
  connectionId?: string;
  score?: number | null;
  rating?: string | null;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionPayload = {
  choices?: Array<{ message?: { content?: string | null }; text?: string | null }>;
  model?: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export type ModelConnectionTestInput = {
  presetId?: string;
  provider: RuntimeAiProviderId;
  model: string;
  baseUrl?: string;
  apiKey?: string;
  useDeploymentKey?: boolean;
};

export type ModelConnectionTestResult = {
  ok: true;
  provider: RuntimeAiProviderId;
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
  usage: ChatCompletionPayload["usage"] | null;
  strengths: string[];
  warnings: string[];
};

export const providerEnvKeys = {
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  nebius: "NEBIUS_API_KEY",
  "custom-openai": "",
} satisfies Record<RuntimeAiProviderId, string>;

export function defaultBaseUrl(provider: RuntimeAiProviderId) {
  if (provider === "openai") return "https://api.openai.com/v1";
  if (provider === "openrouter") return "https://openrouter.ai/api/v1";
  if (provider === "nebius") return process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1";
  return "";
}

function selectedDeploymentProvider(): RuntimeAiProviderId | "none" {
  const requested = process.env.AI_PROVIDER?.toLowerCase();
  if (requested === "openrouter" || requested === "nebius" || requested === "openai") return requested;
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.NEBIUS_API_KEY) return "nebius";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

export function getDeploymentProviderConfig(): RuntimeAiProviderConfig | null {
  const provider = selectedDeploymentProvider();

  if (provider === "openrouter") {
    return {
      id: provider,
      apiKey: process.env.OPENROUTER_API_KEY ?? "",
      baseUrl: process.env.OPENROUTER_BASE_URL ?? defaultBaseUrl(provider),
      model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
      source: "deployment",
      providerLabel: "OpenRouter",
      title: process.env.OPENROUTER_APP_NAME ?? "BuildProof",
      siteUrl: process.env.OPENROUTER_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    };
  }

  if (provider === "nebius") {
    return {
      id: provider,
      apiKey: process.env.NEBIUS_API_KEY ?? "",
      baseUrl: process.env.NEBIUS_BASE_URL ?? defaultBaseUrl(provider),
      model: process.env.NEBIUS_MODEL ?? "",
      source: "deployment",
      providerLabel: "Nebius Token Factory",
    };
  }

  if (provider === "openai") {
    return {
      id: provider,
      apiKey: process.env.OPENAI_API_KEY ?? "",
      baseUrl: process.env.OPENAI_BASE_URL ?? defaultBaseUrl(provider),
      model: process.env.OPENAI_MODEL ?? "",
      source: "deployment",
      providerLabel: "OpenAI",
    };
  }

  return null;
}

export function getDeploymentProviderStatus(): RuntimeAiProviderStatus {
  const config = getDeploymentProviderConfig();
  return {
    provider: config?.id ?? "none",
    configured: Boolean(config?.apiKey && config.model),
    model: config?.model || null,
    mode: config?.apiKey && config.model ? "live" : "unavailable",
    source: config ? "deployment" : "none",
  };
}

function getProviderKey(provider: RuntimeAiProviderId, apiKey: string, useDeploymentKey: boolean) {
  if (apiKey) return apiKey;
  const envName = providerEnvKeys[provider];
  if (useDeploymentKey && envName) return process.env[envName] ?? "";
  return "";
}

function scoreModel(input: {
  presetScore: number;
  provider: RuntimeAiProviderId;
  latencyMs: number;
  text: string;
  model: string;
}) {
  let score = input.presetScore;

  if (input.provider === "custom-openai") score -= 0.3;
  if (input.latencyMs < 2_500) score += 0.4;
  else if (input.latencyMs > 12_000) score -= 1.1;
  else if (input.latencyMs > 7_000) score -= 0.5;

  if (input.text.length >= 12) score += 0.2;
  if (/free|tiny|mini|nano/i.test(input.model)) score -= 0.2;
  if (/gpt-5|opus|sonnet|reason|qwen|deepseek/i.test(input.model)) score += 0.2;

  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

function ratingLabel(score: number) {
  if (score >= 9) return "Excellent for BuildProof";
  if (score >= 8) return "Strong for most audits";
  if (score >= 7) return "Good for MVP usage";
  if (score >= 6) return "Usable with review";
  return "Weak for production reports";
}

function modelWarnings(score: number, latencyMs: number, provider: RuntimeAiProviderId) {
  const warnings: string[] = [];
  if (score < 7) warnings.push("Use this for demos or lightweight summaries, not final CTO-level reports.");
  if (latencyMs > 7_000) warnings.push("Latency is high; reports may feel slow unless this model is reserved for final synthesis only.");
  if (provider === "custom-openai") warnings.push("Custom endpoint quality depends on the provider; verify output consistency before using it as the default.");
  return warnings;
}

function modelStrengths(score: number, provider: RuntimeAiProviderId) {
  const strengths = ["API key and model responded successfully."];
  if (score >= 8.5) strengths.push("Suitable for evidence explanation and launch-decision drafting.");
  if (provider === "openrouter") strengths.push("Router setup gives you provider flexibility without changing BuildProof code.");
  if (provider === "nebius") strengths.push("Good fit for engineering-heavy source and repo reasoning when your Nebius model is available.");
  if (provider === "openai") strengths.push("Good fit for structured reports, evidence summaries, and agent orchestration.");
  return strengths;
}

export async function callOpenAiCompatibleChat(
  config: RuntimeAiProviderConfig,
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {},
) {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(config.id === "openrouter" && config.siteUrl ? { "HTTP-Referer": config.siteUrl } : {}),
      ...(config.id === "openrouter" && config.title ? { "X-OpenRouter-Title": config.title } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 900,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(options.timeoutMs ?? 25_000),
  });

  const payload = await response.json().catch(() => null) as ChatCompletionPayload | { error?: { message?: string } } | null;
  if (!response.ok) {
    const message = payload && "error" in payload && payload.error?.message
      ? payload.error.message
      : `AI provider request failed (${response.status}).`;
    throw new Error(message);
  }

  const text = payload && "choices" in payload
    ? payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text ?? ""
    : "";
  if (!text.trim()) throw new Error("AI provider returned no readable response.");

  return {
    text: text.trim(),
    model: payload && "model" in payload && payload.model ? payload.model : config.model,
    usage: payload && "usage" in payload ? payload.usage ?? null : null,
  };
}

export async function testAiModelConnection(input: ModelConnectionTestInput): Promise<ModelConnectionTestResult> {
  const preset = input.presetId ? getAiModelPreset(input.presetId) : undefined;
  const provider = input.provider;
  const apiKey = getProviderKey(provider, input.apiKey?.trim() ?? "", input.useDeploymentKey === true);
  const baseUrl = (input.baseUrl || preset?.baseUrl || defaultBaseUrl(provider)).replace(/\/$/, "");
  const model = input.model || preset?.model || "";

  if (!apiKey) {
    throw new Error("Add an API key or choose a configured deployment key before testing this model.");
  }

  if (!baseUrl) {
    throw new Error("Custom providers need an OpenAI-compatible base URL, for example https://provider.example/v1.");
  }

  const startedAt = Date.now();
  const result = await callOpenAiCompatibleChat({
    id: provider,
    apiKey,
    baseUrl,
    model,
    source: input.useDeploymentKey ? "deployment" : "user",
    providerLabel: preset?.providerLabel,
    title: process.env.OPENROUTER_APP_NAME ?? "BuildProof",
    siteUrl: process.env.OPENROUTER_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  }, [
    {
      role: "system",
      content: "You are a BuildProof model readiness probe. Reply in one concise sentence.",
    },
    {
      role: "user",
      content: "Say that BuildProof model testing is ready, and mention one audit task you can help with.",
    },
  ], { temperature: 0, maxTokens: 80, timeoutMs: 20_000 });

  const latencyMs = Date.now() - startedAt;
  const score = scoreModel({
    presetScore: preset?.defaultScore ?? 6.8,
    provider,
    latencyMs,
    text: result.text,
    model,
  });

  return {
    ok: true,
    provider,
    providerLabel: preset?.providerLabel ?? provider,
    model: result.model,
    requestedModel: model,
    baseUrl,
    latencyMs,
    score,
    rating: ratingLabel(score),
    maskedKey: maskApiKey(apiKey),
    usedDeploymentKey: !input.apiKey && input.useDeploymentKey === true,
    outputPreview: result.text.slice(0, 240),
    usage: result.usage,
    strengths: modelStrengths(score, provider),
    warnings: modelWarnings(score, latencyMs, provider),
  };
}
