import "server-only";

import { getResolvedAiProviderStatus, resolveAiProviderConfig } from "@/lib/ai-model-connections";
import { callOpenAiCompatibleChat, type RuntimeAiProviderId, type RuntimeAiProviderStatus } from "@/lib/ai-model-runtime";

export type AiProviderId = RuntimeAiProviderId | "none";

export type AiProviderStatus = RuntimeAiProviderStatus;

export type AiBriefRequest = {
  purpose: "product-intelligence" | "finding-explanation" | "launch-brief";
  instructions: string;
  evidence: string[];
};

export type AiBriefResponse = {
  provider: RuntimeAiProviderId;
  model: string;
  source: "user" | "deployment";
  connectionId?: string;
  text: string;
};

type AiGenerationContext = {
  userId?: string | null;
};

export async function getAiProviderStatus(userId?: string | null): Promise<AiProviderStatus> {
  return getResolvedAiProviderStatus(userId);
}

function buildMessages(request: AiBriefRequest) {
  const evidence = request.evidence
    .filter(Boolean)
    .slice(0, 20)
    .map((item, index) => `${index + 1}. ${item.slice(0, 2_000)}`)
    .join("\n");

  return [
    {
      role: "system" as const,
      content: "You are BuildProof's evidence explainer. Do not invent test results, severity, access, or approval. State limitations when evidence is incomplete. Return concise, structured prose for a human release owner.",
    },
    {
      role: "user" as const,
      content: `Purpose: ${request.purpose}\nInstructions: ${request.instructions.slice(0, 4_000)}\n\nRedacted evidence:\n${evidence || "No evidence was supplied."}`,
    },
  ];
}

export async function generateAiBrief(request: AiBriefRequest, context: AiGenerationContext = {}): Promise<AiBriefResponse> {
  const config = await resolveAiProviderConfig(context.userId);
  if (!config?.apiKey || !config.model) {
    throw new Error("AI is not configured. Add and save a model in AI Models, or configure a server-side provider key and model.");
  }

  const response = await callOpenAiCompatibleChat(config, buildMessages(request), {
    temperature: 0.2,
    maxTokens: 900,
    timeoutMs: 25_000,
  });

  return {
    provider: config.id,
    model: response.model,
    source: config.source,
    connectionId: config.connectionId,
    text: response.text,
  };
}
