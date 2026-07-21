export type AiModelProviderId = "openai" | "openrouter" | "nebius" | "custom-openai";

export type AiModelPreset = {
  id: string;
  provider: AiModelProviderId;
  providerLabel: string;
  model: string;
  label: string;
  tagline: string;
  bestFor: string[];
  baseUrl: string;
  qualityBand: "elite" | "strong" | "budget" | "experimental";
  defaultScore: number;
  costTier: "free" | "low" | "medium" | "high" | "bring-your-own";
  tokenNote: string;
};

export const aiModelPresets = [
  {
    id: "openai-gpt-5-6-terra",
    provider: "openai",
    providerLabel: "OpenAI",
    model: "gpt-5.6-terra",
    label: "GPT-5.6 Terra",
    tagline: "Balanced flagship reasoning for CTO reports and evidence synthesis.",
    bestFor: ["CTO reports", "finding explanations", "agent planning"],
    baseUrl: "https://api.openai.com/v1",
    qualityBand: "elite",
    defaultScore: 9.4,
    costTier: "high",
    tokenNote: "Use for final report generation or high-value review passes.",
  },
  {
    id: "openai-gpt-5-6-luna",
    provider: "openai",
    providerLabel: "OpenAI",
    model: "gpt-5.6-luna",
    label: "GPT-5.6 Luna",
    tagline: "Lower-cost OpenAI option for frequent evidence summarization.",
    bestFor: ["summaries", "triage", "developer notes"],
    baseUrl: "https://api.openai.com/v1",
    qualityBand: "strong",
    defaultScore: 8.6,
    costTier: "medium",
    tokenNote: "Good default when you want quality without spending heavily.",
  },
  {
    id: "openai-gpt-4-1-mini",
    provider: "openai",
    providerLabel: "OpenAI",
    model: "gpt-4.1-mini",
    label: "GPT-4.1 mini",
    tagline: "Fast, economical model for routine audit copy and classifications.",
    bestFor: ["quick briefs", "classification", "status copy"],
    baseUrl: "https://api.openai.com/v1",
    qualityBand: "budget",
    defaultScore: 7.8,
    costTier: "low",
    tokenNote: "Enough for most lightweight BuildProof UI explanations.",
  },
  {
    id: "openrouter-auto",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    model: "openrouter/auto-beta",
    label: "OpenRouter Auto",
    tagline: "Routes requests to a suitable available model through OpenRouter.",
    bestFor: ["experimentation", "fallbacks", "provider flexibility"],
    baseUrl: "https://openrouter.ai/api/v1",
    qualityBand: "strong",
    defaultScore: 8.1,
    costTier: "medium",
    tokenNote: "Useful when you want provider choice without changing code.",
  },
  {
    id: "openrouter-free",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    model: "cohere/north-mini-code:free",
    label: "North Mini Code Free",
    tagline: "Free coding-focused model for demos, testing, and light prototype work.",
    bestFor: ["demos", "low-volume testing", "student use"],
    baseUrl: "https://openrouter.ai/api/v1",
    qualityBand: "experimental",
    defaultScore: 6.9,
    costTier: "free",
    tokenNote: "Enough for demos; not ideal for final CTO-grade reports.",
  },
  {
    id: "openrouter-claude-sonnet",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    model: "anthropic/claude-sonnet-5",
    label: "Claude Sonnet via OpenRouter",
    tagline: "Strong long-form reasoning and careful report writing through one router.",
    bestFor: ["report prose", "risk explanation", "long-context review"],
    baseUrl: "https://openrouter.ai/api/v1",
    qualityBand: "elite",
    defaultScore: 9.0,
    costTier: "medium",
    tokenNote: "Good alternative report writer if your OpenRouter account has access.",
  },
  {
    id: "openrouter-gemini-pro",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    model: "~google/gemini-pro-latest",
    label: "Gemini Pro via OpenRouter",
    tagline: "Broad analysis model preset for source summaries and evidence grouping.",
    bestFor: ["source summaries", "large context", "mixed evidence"],
    baseUrl: "https://openrouter.ai/api/v1",
    qualityBand: "strong",
    defaultScore: 8.3,
    costTier: "medium",
    tokenNote: "Use when you need broad context and router-managed access.",
  },
  {
    id: "openrouter-deepseek",
    provider: "openrouter",
    providerLabel: "OpenRouter",
    model: "deepseek/deepseek-chat-v3.1",
    label: "DeepSeek via OpenRouter",
    tagline: "Cost-effective reasoning for engineering and code-review style explanations.",
    bestFor: ["engineering notes", "code reasoning", "budget runs"],
    baseUrl: "https://openrouter.ai/api/v1",
    qualityBand: "strong",
    defaultScore: 8.0,
    costTier: "low",
    tokenNote: "Good budget option; verify reliability for final reports.",
  },
  {
    id: "nebius-token-factory",
    provider: "nebius",
    providerLabel: "Nebius Token Factory",
    model: "Qwen/Qwen3-Coder-480B-A35B-Instruct",
    label: "Qwen Coder on Nebius",
    tagline: "Engineering-heavy model preset for repo/source interpretation.",
    bestFor: ["code review", "repo maps", "engineering agents"],
    baseUrl: "https://api.tokenfactory.nebius.com/v1",
    qualityBand: "strong",
    defaultScore: 8.2,
    costTier: "medium",
    tokenNote: "Strong candidate for developer-focused audit reasoning if your Nebius account exposes this model.",
  },
  {
    id: "custom-openai-compatible",
    provider: "custom-openai",
    providerLabel: "Custom",
    model: "",
    label: "Custom OpenAI-compatible",
    tagline: "Bring any OpenAI-compatible endpoint, model name, and key.",
    bestFor: ["custom providers", "self-hosted gateways", "enterprise accounts"],
    baseUrl: "",
    qualityBand: "experimental",
    defaultScore: 6.5,
    costTier: "bring-your-own",
    tokenNote: "Quality depends completely on the model and endpoint you provide.",
  },
] satisfies AiModelPreset[];

export function getAiModelPreset(id: string) {
  return aiModelPresets.find((preset) => preset.id === id);
}

export function maskApiKey(apiKey: string) {
  const trimmed = apiKey.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 10) return `${trimmed.slice(0, 2)}••••${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 6)}••••••${trimmed.slice(-4)}`;
}
