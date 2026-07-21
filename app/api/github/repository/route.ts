import { NextResponse } from "next/server";
import { inspectGitHubRepository } from "@/lib/github-repository";
import { getAuthenticatedUserId } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // A server-only GitHub token may access private repositories. Never allow an
  // anonymous caller to spend that token's rate limit or infer private access.
  if (process.env.GITHUB_TOKEN) {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: "Authentication is required for connected repository inspection." }, { status: 401 });
    }
  }

  const repositoryUrl = new URL(request.url).searchParams.get("repositoryUrl");
  if (!repositoryUrl) {
    return NextResponse.json({ error: "repositoryUrl is required." }, { status: 400 });
  }

  try {
    const inspection = await inspectGitHubRepository(repositoryUrl);
    return NextResponse.json(inspection);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The repository URL could not be validated." },
      { status: 400 },
    );
  }
}
