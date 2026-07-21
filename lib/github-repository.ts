import { z } from "zod";

const githubRepositoryUrlSchema = z.string().min(1).transform((value) => value.trim());

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

export type RepositorySourceMap = {
  filesScanned: number;
  framework: string | null;
  packageManager: string | null;
  manifest: {
    hasPackageJson: boolean;
    scripts: string[];
    dependencies: string[];
  };
  surfaces: {
    routes: string[];
    apiHandlers: string[];
    authFiles: string[];
    envExamples: string[];
    databaseFiles: string[];
    ciWorkflows: string[];
    deploymentFiles: string[];
    testFiles: string[];
    aiFiles: string[];
  };
  riskSignals: {
    possibleSecretFiles: string[];
    missingLockfile: boolean;
    missingCi: boolean;
    missingEnvExample: boolean;
    missingTests: boolean;
    missingSecurityAutomation: boolean;
  };
};

export type RepositorySourceInspection = RepositoryInspection & {
  sourceMap: RepositorySourceMap | null;
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

type GitHubTreePayload = {
  tree?: Array<{
    path?: string;
    type?: "blob" | "tree" | string;
  }>;
  truncated?: boolean;
};

type GitHubContentsPayload = {
  content?: string;
  encoding?: string;
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

function normalizeRepositoryInput(value: string) {
  const trimmed = githubRepositoryUrlSchema.parse(value).replace(/\.git$/, "");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("github.com/")) return `https://${trimmed}`;
  if (/^[\w.-]+\/[\w.-]+$/.test(trimmed)) return `https://github.com/${trimmed}`;
  return trimmed;
}

export function parseGitHubRepositoryUrl(value: string): GitHubRepositoryReference {
  const parsed = normalizeRepositoryInput(value);
  const url = new URL(parsed);
  if (url.hostname.toLowerCase() !== "github.com") throw new Error("Use a github.com repository URL.");
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

function uniqueMatches(files: string[], predicate: (path: string) => boolean, limit = 14) {
  return files.filter(predicate).slice(0, limit);
}

function detectPackageManager(files: string[]) {
  if (files.includes("pnpm-lock.yaml")) return "pnpm";
  if (files.includes("yarn.lock")) return "yarn";
  if (files.includes("package-lock.json")) return "npm";
  if (files.includes("bun.lockb") || files.includes("bun.lock")) return "bun";
  if (files.includes("poetry.lock")) return "poetry";
  if (files.includes("requirements.txt")) return "pip";
  return null;
}

function detectFramework(files: string[], dependencies: string[]) {
  const deps = new Set(dependencies.map((item) => item.toLowerCase()));
  if (deps.has("next") || files.includes("next.config.js") || files.includes("next.config.ts")) return "Next.js";
  if (deps.has("@vitejs/plugin-react") || deps.has("vite") || files.includes("vite.config.ts") || files.includes("vite.config.js")) return "Vite";
  if (deps.has("@remix-run/react") || files.some((path) => path.startsWith("app/routes/"))) return "Remix";
  if (deps.has("astro") || files.includes("astro.config.mjs")) return "Astro";
  if (deps.has("@sveltejs/kit") || files.includes("svelte.config.js")) return "SvelteKit";
  if (deps.has("nuxt") || files.includes("nuxt.config.ts")) return "Nuxt";
  if (files.includes("manage.py") || files.some((path) => path.endsWith("settings.py"))) return "Django";
  if (files.includes("Gemfile") && files.some((path) => path.startsWith("app/controllers/"))) return "Rails";
  return null;
}

function parsePackageManifest(text: string | null) {
  if (!text) return { scripts: [] as string[], dependencies: [] as string[] };
  try {
    const parsed = JSON.parse(text) as {
      scripts?: Record<string, unknown>;
      dependencies?: Record<string, unknown>;
      devDependencies?: Record<string, unknown>;
      peerDependencies?: Record<string, unknown>;
    };
    return {
      scripts: Object.keys(parsed.scripts ?? {}).slice(0, 20),
      dependencies: [
        ...Object.keys(parsed.dependencies ?? {}),
        ...Object.keys(parsed.devDependencies ?? {}),
        ...Object.keys(parsed.peerDependencies ?? {}),
      ].slice(0, 80),
    };
  } catch {
    return { scripts: [] as string[], dependencies: [] as string[] };
  }
}

async function readRepositoryTextFile(basePath: string, path: string) {
  const result = await githubJson<GitHubContentsPayload>(`${basePath}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`);
  if (!result.ok || !result.data?.content) return null;
  const encoding = result.data.encoding === "base64" ? "base64" : "utf8";
  try {
    return Buffer.from(result.data.content, encoding).toString("utf8");
  } catch {
    return null;
  }
}

function buildSourceMap(files: string[], packageText: string | null): RepositorySourceMap {
  const manifest = parsePackageManifest(packageText);
  const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb", "bun.lock"];
  const ciWorkflows = uniqueMatches(files, (path) => path.startsWith(".github/workflows/") && /\.(ya?ml)$/i.test(path), 20);
  const testFiles = uniqueMatches(files, (path) => /(^|\/)(__tests__|tests?|specs?)\//i.test(path) || /\.(test|spec)\.[cm]?[jt]sx?$/i.test(path), 20);
  const deploymentFiles = uniqueMatches(files, (path) => [
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "vercel.json",
    "netlify.toml",
    "render.yaml",
    "fly.toml",
    "railway.json",
  ].includes(path) || path.startsWith("k8s/") || path.startsWith(".github/workflows/"), 20);
  const envExamples = uniqueMatches(files, (path) => /^\.env(\.(example|sample|local\.example|template))?$|(^|\/)(env\.example|example\.env)$/i.test(path), 12);
  const possibleSecretFiles = uniqueMatches(files, (path) => {
    const normalized = path.toLowerCase();
    if (normalized.includes("example") || normalized.includes("sample") || normalized.includes("template")) return false;
    return /(^|\/)\.env($|\.)/.test(normalized) || normalized.includes("secret") || normalized.endsWith(".pem") || normalized.endsWith(".key");
  }, 12);
  const authFiles = uniqueMatches(files, (path) => /(^|\/)(auth|session|middleware|roles?|permissions?|supabase|clerk|nextauth|jwt)[^/]*\.[cm]?[jt]sx?$/i.test(path), 20);
  const apiHandlers = uniqueMatches(files, (path) => /(^|\/)(api|routes?)\//i.test(path) || /route\.[cm]?[jt]s$/i.test(path), 30);
  const routes = uniqueMatches(files, (path) => {
    if (apiHandlers.includes(path)) return false;
    return /(^|\/)(app|pages|src\/app|src\/pages)\//i.test(path) && /\.(tsx?|jsx?|mdx)$/i.test(path);
  }, 30);
  const databaseFiles = uniqueMatches(files, (path) => /(^|\/)(supabase\/migrations|prisma|drizzle|migrations|schema\.prisma|db|database)\//i.test(path) || /schema\.prisma$/i.test(path), 20);
  const aiFiles = uniqueMatches(files, (path) => /(openai|anthropic|langchain|llama|vector|embedding|prompt|rag|agent)/i.test(path), 20);
  const securityAutomation = files.some((path) => path.includes("codeql") || path.includes("semgrep") || path.includes("dependabot") || path.includes("trivy") || path.includes("gitleaks"));

  return {
    filesScanned: files.length,
    framework: detectFramework(files, manifest.dependencies),
    packageManager: detectPackageManager(files),
    manifest: {
      hasPackageJson: Boolean(packageText),
      scripts: manifest.scripts,
      dependencies: manifest.dependencies,
    },
    surfaces: {
      routes,
      apiHandlers,
      authFiles,
      envExamples,
      databaseFiles,
      ciWorkflows,
      deploymentFiles,
      testFiles,
      aiFiles,
    },
    riskSignals: {
      possibleSecretFiles,
      missingLockfile: Boolean(packageText) && !lockfiles.some((file) => files.includes(file)),
      missingCi: ciWorkflows.length === 0,
      missingEnvExample: envExamples.length === 0,
      missingTests: testFiles.length === 0,
      missingSecurityAutomation: !securityAutomation,
    },
  };
}

export async function inspectGitHubRepositorySource(value: string, branch?: string): Promise<RepositorySourceInspection> {
  const inspection = await inspectGitHubRepository(value);
  if (!inspection.repository || inspection.sourceCoverage === "unavailable") return { ...inspection, sourceMap: null };

  const ref = branch?.trim() || inspection.repository.defaultBranch;
  const basePath = `/repos/${encodeURIComponent(inspection.reference.owner)}/${encodeURIComponent(inspection.reference.repository)}`;
  const treeResult = await githubJson<GitHubTreePayload>(`${basePath}/git/trees/${encodeURIComponent(ref)}?recursive=1`);

  if (!treeResult.ok || !treeResult.data?.tree) {
    return {
      ...inspection,
      sourceMap: null,
      limitation: "Repository metadata connected, but the source tree could not be read for the selected branch.",
    };
  }

  const files = treeResult.data.tree
    .filter((entry) => entry.type === "blob" && entry.path)
    .map((entry) => entry.path as string)
    .sort();
  const packageText = files.includes("package.json") ? await readRepositoryTextFile(basePath, "package.json") : null;

  return {
    ...inspection,
    sourceMap: buildSourceMap(files, packageText),
    limitation: treeResult.data.truncated
      ? "GitHub truncated this repository tree, so BuildProof analyzed the visible source map only."
      : inspection.limitation,
  };
}
