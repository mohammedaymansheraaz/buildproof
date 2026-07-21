export type AiProviderId = "openrouter" | "nebius" | "openai" | "none";

type ProviderConfig = {
  id: Exclude<AiProviderId, "none">;
  apiKey?: string;
  baseUrl: string;
  model: string;
  title?: string;
  siteUrl?: string;
};

export type AiProviderStatus = {
  provider: AiProviderId;
  configured: boolean;
  model: string | null;
  mode: "live" | "unavailable";
};

export type AiBriefRequest = {
  purpose: "product-intelligence" | "finding-explanation" | "launch-brief";
  instructions: string;
  evidence: string[];
};

export type AiBriefResponse = {
  provider: Exclude<AiProviderId, "none">;
  model: string;
  text: string;
};

function selectedProvider(): AiProviderId {
  const requested = process.env.AI_PROVIDER?.toLowerCase();
  if (requested === "openrouter" || requested === "nebius" || requested === "openai") return requested;
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.NEBIUS_API_KEY) return "nebius";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

function getProviderConfig(): ProviderConfig | null {
  const provider = selectedProvider();

  if (provider === "openrouter") {
    return {
      id: provider,
      apiKey: process.env.OPENROUTER_API_KEY,
      baseUrl: process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
      model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
      title: process.env.OPENROUTER_APP_NAME ?? "BuildProof",
      siteUrl: process.env.OPENROUTER_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    };
  }

  if (provider === "nebius") {
    return {
      id: provider,
      apiKey: process.env.NEBIUS_API_KEY,
      baseUrl: process.env.NEBIUS_BASE_URL ?? "https://api.tokenfactory.nebius.com/v1",
      model: process.env.NEBIUS_MODEL ?? "",
    };
  }

  if (provider === "openai") {
    return {
      id: provider,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      // Keep the optional fallback explicit. A deployment must choose a model
      // it is entitled to use instead of inheriting an unverified default.
      model: process.env.OPENAI_MODEL ?? "",
    };
  }

  return null;
}

export function getAiProviderStatus(): AiProviderStatus {
  const config = getProviderConfig();
  return {
    provider: config?.id ?? "none",
    configured: Boolean(config?.apiKey && config.model),
    model: config?.model || null,
    mode: config?.apiKey && config.model ? "live" : "unavailable",
  };
}

function buildMessages(request: AiBriefRequest) {
  const evidence = request.evidence
    .filter(Boolean)
    .slice(0, 20)
    .map((item, index) => `${index + 1}. ${item.slice(0, 2_000)}`)
    .join("\n");

  return [
    {
      role: "system",
      content: "You are BuildProof's evidence explainer. Do not invent test results, severity, access, or approval. State limitations when evidence is incomplete. Return concise, structured prose for a human release owner.",
    },
    {
      role: "user",
      content: `Purpose: ${request.purpose}\nInstructions: ${request.instructions.slice(0, 4_000)}\n\nRedacted evidence:\n${evidence || "No evidence was supplied."}`,
    },
  ];
}

export async function generateAiBrief(request: AiBriefRequest): Promise<AiBriefResponse> {
  const config = getProviderConfig();
  if (!config?.apiKey || !config.model) {
    throw new Error("AI is not configured. Add a server-only provider key and model to the deployment environment.");
  }

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(config.id === "openrouter" && config.siteUrl ? { "HTTP-Referer": config.siteUrl } : {}),
      ...(config.id === "openrouter" && config.title ? { "X-OpenRouter-Title": config.title } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: buildMessages(request),
      temperature: 0.2,
      max_tokens: 900,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(`AI provider request failed (${response.status}).`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string | null }; text?: string }>; model?: string };
  const text = payload.choices?.[0]?.message?.content ?? payload.choices?.[0]?.text;
  if (!text) throw new Error("AI provider returned no readable response.");

  return { provider: config.id, model: payload.model ?? config.model, text };
}
