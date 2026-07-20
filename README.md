# BuildProof

BuildProof is a premium release-assurance workspace that turns repository context, product intent, staging evidence, cloud-readiness signals, accessibility, and safe security reviews into an evidence-backed ship decision.

This build now has a public product site, a guarded workspace foundation, and a complete local **Demo Audit Engine** for a reliable end-to-end competition story. Real integrations stay behind deliberate server-side boundaries; BuildProof does not claim to scan a live target until those boundaries are in place.

The current MVP definition lives in [`mvp.md`](mvp.md), and the visual direction lives in [`design-theme.md`](design-theme.md).

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The public landing page is at `/`; the workspace is at `/dashboard`.

Useful checks:

```bash
npm run typecheck
npm run lint
npm run build
```

## What works now

- A public landing experience that walks through the real BuildProof pipeline, with a pinned desktop signal sequence and a static reduced-motion/mobile fallback.
- Temporary Clerk-ready Register/Login routes at `/sign-up` and `/sign-in`; this is the current placeholder boundary while the MVP moves to Supabase Auth and PostgreSQL.
- A glass-and-metal Release Lens dashboard with release posture and prioritized evidence.
- An audit dock that captures repository, staging target, product intent, module scope, and explicit authorization.
- A deterministic, time-based demo audit that persists in browser local storage and can be fast-forwarded for demos.
- Evidence spine, live runner trace, finding filters, reproduction context, and suggested-fix workspace.
- Fix briefs, safe verification reruns, printable release passports, JSON export, settings, and integration visibility.
- Responsive mobile layout and reduced-motion support.

Use **Use sample SaaS** in the New Audit screen for the presentation-ready scenario.

## Configure authentication

The current codebase still has temporary Clerk wiring. The MVP target is Supabase Auth with Supabase PostgreSQL, because the product needs auth, tenant data, audit runs, findings, and reports in one production-shaped backend.

Temporary Clerk mode:

1. Create a Clerk application and enable **Email + password** and **Google** in its dashboard.
2. Copy the publishable and secret keys into the ignored `.env` file:

   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   ```

3. Keep the route values already included in `.env` (`/sign-in`, `/sign-up`, and `/dashboard`) and restart `npm run dev`.

With both keys present, `/dashboard`, `/audit`, `/audits/*`, `/findings`, `/fix-center`, `/report`, `/reports`, `/integrations`, and `/settings` require an authenticated Clerk session. The corresponding server layout checks the session as a second boundary.

MVP Supabase mode:

1. Create a Supabase project.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and server-only `SUPABASE_SECRET_KEY` to `.env`.
3. Implement Supabase Auth, row-level security, and the MVP tables listed in [`mvp.md`](mvp.md).
4. Remove Clerk wiring after Supabase route protection is live.

## Demo safety boundary

Demo mode does not connect to GitHub, OpenAI, a cloud provider, or any target URL. It does not make browser requests, run a scanner, accept credentials, or perform a security test against an external system. Evidence is deterministic and labeled as demo evidence.

Real deployments should enforce authorization, an allowlisted owned/staging target, isolated disposable runners, redaction of sensitive data, rate limits, and a non-destructive security policy. Fixes should remain proposals or owner-approved draft PRs only.

`AUDIT_MODE=demo` is now enforced by the audit route. If that value changes before a real authenticated control plane and runner are connected, audit creation returns `503` rather than implying a live audit exists.

## Environment variables

`.env` is created for local use and is git-ignored. `.env.example` is the committed template. No public/free keys are included because they are unsafe and unreliable.

No key is needed to run the app today. Add only the integrations you are ready to configure:

| Capability | Variables |
| --- | --- |
| OpenAI planning/reporting | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| GitHub import / draft PRs | `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_WEBHOOK_SECRET` (prefer a GitHub App over a shared token) |
| Persistent data | `DATABASE_URL` |
| Background jobs | `REDIS_URL`, `AUDIT_RUNNER_URL`, `AUDIT_RUNNER_TOKEN` |
| Evidence artifacts | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` |
| Team authentication | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, later `CLERK_WEBHOOK_SIGNING_SECRET` |

Keep all private values server-side. Never use a `NEXT_PUBLIC_` prefix for OpenAI, GitHub, database, runner, storage, or encryption credentials.

## Production architecture next

The UI already separates the user experience from the audit engine. The next implementation layer can swap Demo Audit Engine for a queued runner architecture:

```text
Next.js control plane + Supabase sessions
  -> PostgreSQL + Redis/outbox
  -> isolated worker container
      -> GitHub/repository intelligence
      -> Playwright + axe-core + Lighthouse
      -> API/config/cloud adapters
      -> Semgrep, Gitleaks, Trivy, osv-scanner
      -> authorized non-destructive OWASP baseline checks
  -> object storage for screenshots, traces, and reports
```

Never run long-lived browser or security work inside a Next.js request handler. Queue it and execute it in disposable infrastructure that validates the owned/staging scope before doing any work.

## What is left before a real launch

1. PostgreSQL + Drizzle migrations, organization/role data, and authenticated server mutations.
2. Server-side scope approval and target verification (including SSRF/private-network protections) before any runner fetches a URL.
3. Redis/outbox jobs and disposable, no-root browser/security runners.
4. Object storage for redacted evidence, plus retention, signed artifact access, and audit logs.
5. GitHub App installation flow, then OpenAI/reporting integrations behind policy checks.
6. End-to-end tests for tenant isolation, authorization, target blocking, state transitions, and evidence/verdict truthfulness.

The detailed founder roadmap and production gates live in [`workflow.md`](workflow.md). The narrower first release is defined in [`mvp.md`](mvp.md).

## Key product files

- [`workflow.md`](workflow.md) — build checklist, product boundaries, and integration contract.
- [`mvp.md`](mvp.md) — first shippable product scope and success criteria.
- [`design-theme.md`](design-theme.md) — BuildProof visual system and theme rules.
- [`lib/audit-engine.ts`](lib/audit-engine.ts) — audit state machine, scoring, and verdict policy.
- [`lib/demo-data.ts`](lib/demo-data.ts) — deterministic competition scenario and evidence fixtures.
- [`components`](components) — product workflow and visual system.
