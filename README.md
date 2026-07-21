# BuildProof

BuildProof is an AI-assisted release-audit workspace that turns a GitHub repository, a running app URL, and scoped evidence into a CTO-level ship / review / hold report.

## How to review this

Running the project locally is optional and is not required to evaluate the submission.

Primary review path:

- Demo video: add the final OpenAI Build Week video link here before submission.
- Live landing page: https://mohammedaymansheraaz.github.io/buildproof/
- Local proof path tested in Codex: sign in or continue as guest → create audit with repo + URL → inspect repository → launch audit → open `/reports`.

If you only have two minutes, watch the demo video, open the live landing page, and read the “What it does” section below. The local setup section is only for judges who want to run the control-plane app themselves.

## How Codex was used

Codex was used as the main build partner across the project, not just for small completions.

Specific work done through Codex in this repo:

- Built and iterated the cinematic landing sequence: the unified audit-film page, full-screen chapter story, glass UI, scroll timing, and final promotion of the production landing page.
- Built the audit product structure around five visible pillars while preserving the internal specialist-agent system.
- Wired Supabase authentication and protected app routes, then browser-tested login, dashboard entry, audit creation, and report navigation.
- Built the URL / GitHub / URL + GitHub audit intake flow so users can choose the evidence they actually have.
- Added Supabase-backed audit persistence for projects, audit runs, findings, evidence, events, and reports.
- Added the AI Models / BYOK direction and the CTO-level AI synthesis path, then debugged the real report flow.
- Verified the real browser path against `https://github.com/mohammedaymansheraaz/buildproof` and `https://mohammedaymansheraaz.github.io/buildproof/`, producing a persisted `READY WITH REVIEW` report.

Relevant commits include `37d2c5b Build BuildProof audit foundation`, `8f4065f Promote cinematic audit film landing`, `54233c1 Expand audit film into full-screen story`, and `bee2f66 Slow audit film pacing`.

## How GPT-5.6 is used in the running product

GPT-5.6 is used for the CTO-level report synthesis after an audit has already produced deterministic evidence.

The visible entry point is the `Generate AI synthesis` button on `/reports` in [`components/release-report.tsx`](components/release-report.tsx). That calls [`app/api/audits/[auditId]/ai-report/route.ts`](app/api/audits/[auditId]/ai-report/route.ts), which calls [`generatePersistedAiReport`](lib/persisted-audits.ts), which uses the OpenAI Agents SDK orchestration in [`lib/ai-agent-orchestrator.ts`](lib/ai-agent-orchestrator.ts).

The synthesis creates five specialist summaries plus a final CTO-level agent. The model is configured by `OPENAI_MODEL`; for this submission environment it is set to `gpt-5.6-sol`, with `AI_PROVIDER=openai`. The agent instructions require every recommendation to trace back to supplied evidence and to report limitations instead of inventing findings.

In the latest local proof run, the deterministic report path worked end-to-end. The AI synthesis UI correctly waited for a configured model because the local `OPENAI_API_KEY` was not present yet.

## Bring your own model key

BuildProof is designed so each user connects their own model key instead of the app relying on one shared key. That keeps cost, rate limits, provider choice, and audit data ownership with the person or team running the audit.

The flow is: register or continue as guest → open **AI Models** → add your key once → start an audit → the report references that saved model. GPT-5.6 via `gpt-5.6-sol` is the default OpenAI submission target, but the UI also supports OpenRouter, Nebius, and OpenAI-compatible providers.

## What it does

BuildProof starts with an authorized target: a GitHub repository, a running app URL, or both. It maps the product, inspects repository and staging evidence, and groups the result into five readable audit pillars: Product Intelligence, Experience & Quality, Engineering & Scale, Security & Reliability, and AI & Launch Readiness.

Internally, those pillars contain specialist perspectives such as product understanding, UI/UX QA, functional QA, performance, backend/cloud, database, DevOps, security, auth/data-protection review, AI evaluation, cost review, and final CTO synthesis. The report separates severity from confidence, includes evidence boundaries, and produces a release verdict instead of a generic chatbot summary.

## Full local setup

Required environment variables:

| Variable | What it is for | Where to get it |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Local app origin for redirects and provider metadata. | Use `http://localhost:3000` locally. |
| `NEXT_PUBLIC_DEMO_MODE` | Controls client demo labeling. | Set `false` for the live Supabase-backed path. |
| `AUDIT_MODE` | Selects live vs demo audit behavior. | Set `live` for real persisted audits. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe Supabase project URL. | Supabase Dashboard → Project Settings → API → Project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable/anon key. | Supabase Dashboard → Project Settings → API → publishable/anon key. |
| `SUPABASE_SECRET_KEY` | Server-only Supabase service role key for persistence. | Supabase Dashboard → Project Settings → API → service role/secret key. |
| `CREDENTIAL_ENCRYPTION_KEY` | Optional hardening secret to encrypt saved AI model keys at rest. The submission build can save BYOK keys without it. | Optional: generate locally with `openssl rand -base64 32`. |
| `GITHUB_TOKEN` | Server-only read access for repository inspection. | GitHub → Settings → Developer settings → fine-grained personal access token with read-only repository access. |
| `AI_PROVIDER` | Selects the deployment AI provider. | Set `openai` for GPT-5.6 synthesis. |
| `OPENAI_API_KEY` | Server-only key for CTO-level AI synthesis. | OpenAI Platform → API keys. |
| `OPENAI_MODEL` | Exact model used for synthesis. | Set `gpt-5.6-sol`. |

Supported Supabase aliases in the current code:

- `SUPABASE_URL` may be used instead of `NEXT_PUBLIC_SUPABASE_URL`.
- `SUPABASE_PUBLISHABLE_KEY` or `SUPABASE_ANON_KEY` may be used instead of `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` may be used instead of `SUPABASE_SECRET_KEY`.

Apply migrations:

```bash
supabase db push
```

If using the Supabase SQL Editor instead of the CLI, apply these files in order:

```text
supabase/migrations/20260721000000_buildproof_foundation.sql
supabase/migrations/20260722000000_ai_model_connections.sql
```

Start the app:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Known limitations

- Only audit systems the user owns or has explicit written authorization to test.
- First live audits target verified staging/preview environments, not production by default.
- No active penetration testing, exploit execution, credential attacks, destructive actions, arbitrary shell access, arbitrary network discovery, or automatic code changes.
- Database and cloud findings are source/configuration-based until a separately approved, read-only integration exists.
- Authenticated journey checks require dedicated test credentials supplied through a secure server-side mechanism; otherwise they are reported as unavailable, not passed.
- AI evaluation is optional, bounded, redacted, and cannot certify model safety or legal compliance.
- Scores are evidence/coverage-aware. Missing evidence lowers coverage and blocks a positive release verdict; a high-looking demo fixture never represents a live audit.
- Recommendations are drafts for human review. Fixes become code only through an approved human workflow and a linked verification run.

## Tech stack

- Next.js 16, React 19, TypeScript
- Supabase Auth and Supabase PostgreSQL
- OpenAI Agents SDK and OpenAI-compatible model adapter
- GitHub repository inspection through server-only token access
- GSAP, Lenis, React Three Fiber, and glass/film-style UI components
- ESLint and TypeScript checks
