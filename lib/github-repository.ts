import { z } from "zod";

const githubRepositoryUrlSchema = z
  .string()
  .url()
  .transform((value) => value.trim())
  .refine((value) => {
    try {
      return new URL(value).hostname.toLowerCase() === "github.com";
    } catch {
      return false;
    }
  }, "Use a github.com repository URL.");

export type GitHubRepositoryReference = {
  owner: string;
  repository: string;
  canonicalUrl: string;
};

export type RepositoryInspection = {
  reference: GitHubRepositoryReference;
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

type GitHubRepositoryPayload = {
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  private: boolean;
  updated_at: string;
  language: string | null;
};

function githubHeaders() {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "BuildProof-audit-intelligence",
    "X-GitHub-Api-Version": "2022-11-28",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function parseGitHubRepositoryUrl(value: string): GitHubRepositoryReference {
  const parsed = githubRepositoryUrlSchema.parse(value);
  const url = new URL(parsed);
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments.length < 2) throw new Error("Use a repository URL such as https://github.com/owner/repository.");

  const owner = segments[0];
  const repository = segments[1].replace(/\.git$/, "");
  if (!owner || !repository) throw new Error("The GitHub repository URL is incomplete.");

  return { owner, repository, canonicalUrl: `https://github.com/${owner}/${repository}` };
}

async function githubJson<T>(path: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: githubHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return { ok: false, status: response.status, data: null };
  return { ok: true, status: response.status, data: (await response.json()) as T };
}

export async function inspectGitHubRepository(value: string): Promise<RepositoryInspection> {
  const reference = parseGitHubRepositoryUrl(value);
  const basePath = `/repos/${encodeURIComponent(reference.owner)}/${encodeURIComponent(reference.repository)}`;
  const repositoryResult = await githubJson<GitHubRepositoryPayload>(basePath);

  if (!repositoryResult.ok || !repositoryResult.data) {
    const needsConnection = repositoryResult.status === 401 || repositoryResult.status === 403 || repositoryResult.status === 404;
    return {
      reference,
      status: needsConnection ? "needs_connection" : "public_metadata",
      sourceCoverage: "unavailable",
      repository: null,
      signals: { packageManifest: false, workflows: 0, languages: [] },
      limitation: needsConnection
        ? "BuildProof cannot access this repository yet. Add a server-only GitHub token with repository read access, or use a public repository."
        : "Repository metadata could not be retrieved right now. Browser-only evidence can still run against a verified staging URL.",
    };
  }

  const [manifestResult, workflowsResult, languagesResult] = await Promise.all([
    githubJson<unknown>(`${basePath}/contents/package.json`),
    githubJson<{ total_count?: number }>(`${basePath}/actions/workflows`),
    githubJson<Record<string, number>>(`${basePath}/languages`),
  ]);

  const hasToken = Boolean(process.env.GITHUB_TOKEN);
  // This intake adapter currently reads repository metadata and high-level
  // signals only. Full source evidence is deliberately gated behind the
  // server-side, user-authorized connection path—even for public repos.
  const sourceCoverage = hasToken ? "repository" : "metadata_only";
  const status = hasToken ? "connected" : "public_metadata";

  return {
    reference,
    status,
    sourceCoverage,
    repository: {
      name: repositoryResult.data.name,
      fullName: repositoryResult.data.full_name,
      description: repositoryResult.data.description,
      defaultBranch: repositoryResult.data.default_branch,
      private: repositoryResult.data.private,
      updatedAt: repositoryResult.data.updated_at,
      primaryLanguage: repositoryResult.data.language,
    },
    signals: {
      packageManifest: manifestResult.ok,
      workflows: workflowsResult.data?.total_count ?? 0,
      languages: Object.keys(languagesResult.data ?? {}).slice(0, 6),
    },
    limitation: hasToken
      ? null
      : "Public metadata is connected. BuildProof cannot inspect private source, deployment settings, database schema, or CI secrets until a server-only GitHub token is configured.",
  };
}
