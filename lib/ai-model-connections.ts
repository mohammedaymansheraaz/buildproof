import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiModelProviderId } from "@/lib/ai-model-catalog";
import { getAiModelPreset, maskApiKey } from "@/lib/ai-model-catalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  defaultBaseUrl,
  getDeploymentProviderConfig,
  getDeploymentProviderStatus,
  type ModelConnectionTestResult,
  type RuntimeAiProviderConfig,
  type RuntimeAiProviderStatus,
} from "@/lib/ai-model-runtime";

type AiModelConnectionRow = {
  id: string;
  user_id: string;
  project_id: string | null;
  provider: AiModelProviderId;
  provider_label: string | null;
  model: string;
  base_url: string;
  encrypted_api_key: string;
  key_hint: string | null;
  status: "tested" | "failed" | "disabled";
  score: number | null;
  rating: string | null;
  is_default: boolean;
  last_tested_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type SavedAiModelConnection = {
  id: string;
  provider: AiModelProviderId;
  providerLabel: string;
  model: string;
  baseUrl: string;
  maskedKey: string;
  status: AiModelConnectionRow["status"];
  score: number | null;
  rating: string | null;
  isDefault: boolean;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiModelStorageStatus = {
  mode: "encrypted-supabase" | "direct-supabase" | "schema-missing" | "unconfigured";
  canPersist: boolean;
  encryptionReady: boolean;
  message: string;
};

type SaveAiModelConnectionInput = {
  presetId?: string;
  provider: AiModelProviderId;
  model: string;
  baseUrl?: string;
  apiKey: string;
  testResult: ModelConnectionTestResult;
};

function adminClient() {
  return createSupabaseAdminClient();
}

export function getCredentialEncryptionSecret() {
  return (process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.AI_KEY_ENCRYPTION_SECRET || "").trim();
}

export function isAiCredentialEncryptionConfigured() {
  return getCredentialEncryptionSecret().length >= 24;
}

function encryptionKey() {
  const secret = getCredentialEncryptionSecret();
  if (!isAiCredentialEncryptionConfigured()) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is missing or too short. Add a random 32+ character server-only secret before saving API keys.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(apiKey: string) {
  if (!isAiCredentialEncryptionConfigured()) {
    return `plain:v1:${Buffer.from(apiKey, "utf8").toString("base64url")}`;
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptApiKey(value: string) {
  if (value.startsWith("plain:v1:")) {
    return Buffer.from(value.replace("plain:v1:", ""), "base64url").toString("utf8");
  }

  const [version, ivRaw, tagRaw, ciphertextRaw] = value.split(":");
  if (version !== "v1" || !ivRaw || !tagRaw || !ciphertextRaw) {
    throw new Error("Saved AI credential has an unsupported encryption format.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

function missingTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  return maybe.code === "42P01" || maybe.code === "PGRST205" || /ai_model_connections/i.test(maybe.message ?? "");
}

function mapConnection(row: AiModelConnectionRow): SavedAiModelConnection {
  return {
    id: row.id,
    provider: row.provider,
    providerLabel: row.provider_label ?? getAiModelPreset(String(row.metadata?.presetId ?? ""))?.providerLabel ?? row.provider,
    model: row.model,
    baseUrl: row.base_url,
    maskedKey: row.key_hint ?? "saved key",
    status: row.status,
    score: row.score,
    rating: row.rating,
    isDefault: row.is_default,
    lastTestedAt: row.last_tested_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getAiModelStorageStatus(schemaReady = true): AiModelStorageStatus {
  if (!adminClient()) {
    return {
      mode: "unconfigured",
      canPersist: false,
      encryptionReady: isAiCredentialEncryptionConfigured(),
      message: "Supabase admin credentials are not configured, so BuildProof cannot persist BYOK model keys yet.",
    };
  }

  if (!schemaReady) {
    return {
      mode: "schema-missing",
      canPersist: false,
      encryptionReady: isAiCredentialEncryptionConfigured(),
      message: "Run the ai_model_connections Supabase migration before saving API keys.",
    };
  }

  if (!isAiCredentialEncryptionConfigured()) {
    return {
      mode: "direct-supabase",
      canPersist: true,
      encryptionReady: false,
      message: "Keys are saved server-side in Supabase and only returned to the browser as masked hints. Add CREDENTIAL_ENCRYPTION_KEY later to encrypt them at rest.",
    };
  }

  return {
    mode: "encrypted-supabase",
    canPersist: true,
    encryptionReady: true,
    message: "API keys are encrypted server-side in Supabase and never returned to the browser.",
  };
}

export async function listAiModelConnections(userId: string) {
  const admin = adminClient();
  if (!admin) {
    return {
      connections: [] as SavedAiModelConnection[],
      defaultConnection: null as SavedAiModelConnection | null,
      storage: getAiModelStorageStatus(),
    };
  }

  const { data, error } = await admin
    .from("ai_model_connections")
    .select("id,user_id,project_id,provider,provider_label,model,base_url,encrypted_api_key,key_hint,status,score,rating,is_default,last_tested_at,metadata,created_at,updated_at")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) {
    if (missingTable(error)) {
      return {
        connections: [] as SavedAiModelConnection[],
        defaultConnection: null as SavedAiModelConnection | null,
        storage: getAiModelStorageStatus(false),
      };
    }
    throw error;
  }

  const connections = ((data ?? []) as AiModelConnectionRow[]).map(mapConnection);
  return {
    connections,
    defaultConnection: connections.find((item) => item.isDefault) ?? connections[0] ?? null,
    storage: getAiModelStorageStatus(true),
  };
}

async function clearDefault(admin: SupabaseClient, userId: string) {
  const { error } = await admin
    .from("ai_model_connections")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);
  if (error) throw error;
}

export async function saveAiModelConnection(userId: string, input: SaveAiModelConnectionInput) {
  const admin = adminClient();
  if (!admin) throw new Error("Supabase admin credentials are required before saving AI model keys.");
  if (!input.apiKey.trim()) throw new Error("Paste the provider API key before saving this model.");
  if (input.testResult.usedDeploymentKey) throw new Error("Deployment keys are already available server-side; paste a BYOK key if you want to save a personal default.");

  const preset = input.presetId ? getAiModelPreset(input.presetId) : undefined;
  const baseUrl = (input.baseUrl || preset?.baseUrl || defaultBaseUrl(input.provider)).replace(/\/$/, "");

  const { data, error } = await admin
    .from("ai_model_connections")
    .insert({
      user_id: userId,
      project_id: null,
      provider: input.provider,
      provider_label: preset?.providerLabel ?? input.testResult.providerLabel ?? input.provider,
      model: input.testResult.requestedModel || input.model,
      base_url: baseUrl,
      encrypted_api_key: encryptApiKey(input.apiKey.trim()),
      key_hint: maskApiKey(input.apiKey),
      status: "tested",
      score: input.testResult.score,
      rating: input.testResult.rating,
      is_default: false,
      last_tested_at: new Date().toISOString(),
      metadata: {
        presetId: input.presetId ?? null,
        outputPreview: input.testResult.outputPreview,
        strengths: input.testResult.strengths,
        warnings: input.testResult.warnings,
        latencyMs: input.testResult.latencyMs,
        providerModel: input.testResult.model,
        usage: input.testResult.usage,
      },
    })
    .select("id,user_id,project_id,provider,provider_label,model,base_url,encrypted_api_key,key_hint,status,score,rating,is_default,last_tested_at,metadata,created_at,updated_at")
    .single();

  if (error) throw error;

  await clearDefault(admin, userId);
  const { data: defaultData, error: defaultError } = await admin
    .from("ai_model_connections")
    .update({ is_default: true })
    .eq("id", String(data.id))
    .eq("user_id", userId)
    .select("id,user_id,project_id,provider,provider_label,model,base_url,encrypted_api_key,key_hint,status,score,rating,is_default,last_tested_at,metadata,created_at,updated_at")
    .single();

  if (defaultError) throw defaultError;
  return mapConnection(defaultData as AiModelConnectionRow);
}

export async function setDefaultAiModelConnection(userId: string, connectionId: string) {
  const admin = adminClient();
  if (!admin) throw new Error("Supabase admin credentials are required before choosing an AI model default.");

  const { data: existing, error: existingError } = await admin
    .from("ai_model_connections")
    .select("id")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (!existing) throw new Error("Saved AI model connection was not found.");

  await clearDefault(admin, userId);
  const { data, error } = await admin
    .from("ai_model_connections")
    .update({ is_default: true })
    .eq("id", connectionId)
    .eq("user_id", userId)
    .select("id,user_id,project_id,provider,provider_label,model,base_url,encrypted_api_key,key_hint,status,score,rating,is_default,last_tested_at,metadata,created_at,updated_at")
    .single();

  if (error) throw error;
  return mapConnection(data as AiModelConnectionRow);
}

export async function deleteAiModelConnection(userId: string, connectionId: string) {
  const admin = adminClient();
  if (!admin) throw new Error("Supabase admin credentials are required before deleting an AI model.");

  const { error } = await admin
    .from("ai_model_connections")
    .delete()
    .eq("id", connectionId)
    .eq("user_id", userId);

  if (error) throw error;
}

async function getStoredDefaultConfig(userId: string): Promise<RuntimeAiProviderConfig | null> {
  const admin = adminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("ai_model_connections")
    .select("id,user_id,project_id,provider,provider_label,model,base_url,encrypted_api_key,key_hint,status,score,rating,is_default,last_tested_at,metadata,created_at,updated_at")
    .eq("user_id", userId)
    .eq("is_default", true)
    .eq("status", "tested")
    .maybeSingle();

  if (error) {
    if (missingTable(error)) return null;
    throw error;
  }
  if (!data) return null;

  const row = data as AiModelConnectionRow;
  return {
    id: row.provider,
    apiKey: decryptApiKey(row.encrypted_api_key),
    baseUrl: row.base_url,
    model: row.model,
    source: "user",
    connectionId: row.id,
    providerLabel: row.provider_label ?? row.provider,
    score: row.score,
    rating: row.rating,
    title: process.env.OPENROUTER_APP_NAME ?? "BuildProof",
    siteUrl: process.env.OPENROUTER_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL,
  };
}

export async function resolveAiProviderConfig(userId?: string | null): Promise<RuntimeAiProviderConfig | null> {
  if (userId) {
    const stored = await getStoredDefaultConfig(userId);
    if (stored?.apiKey && stored.model) return stored;
  }

  const deployment = getDeploymentProviderConfig();
  if (deployment?.apiKey && deployment.model) return deployment;
  return null;
}

export async function getResolvedAiProviderStatus(userId?: string | null): Promise<RuntimeAiProviderStatus> {
  if (userId) {
    const stored = await getStoredDefaultConfig(userId);
    if (stored?.apiKey && stored.model) {
      return {
        provider: stored.id,
        configured: true,
        model: stored.model,
        mode: "live",
        source: "user",
        connectionId: stored.connectionId,
        score: stored.score,
        rating: stored.rating,
      };
    }
  }

  return getDeploymentProviderStatus();
}
