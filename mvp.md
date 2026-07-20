# BuildProof MVP

## MVP Positioning

BuildProof helps a founder or small engineering team answer one release question:

> Is this web application ready to ship, and what evidence proves it?

The MVP should feel like a compact expert audit team, not a scanner menu. The user should see three readings: Experience, Engineering, and Security. Specialist checks can run underneath, but the product surface stays simple.

## MVP Promise

BuildProof turns an approved app target and repo context into:

- An overall application health verdict: Ship, Review, or Hold.
- Category scores for Experience, Engineering, and Security.
- Findings with severity, confidence, evidence, and next action.
- A release report the team can share before deployment.

The MVP does not need to solve every advanced agent feature on day one. Those features stay on the roadmap, but the first shipped version must be truthful, useful, and safe.

## Core User Flow

1. User registers and signs in.
2. User creates a workspace/project.
3. User adds an application target and confirms they own or are authorized to test it.
4. User selects the audit teams to run:
   - Application Experience & Quality
   - Engineering Performance & Infrastructure
   - Security & Reliability Intelligence
5. BuildProof creates an audit run and shows live progress.
6. The user reviews findings grouped by expert team.
7. The user opens a recommendation/fix brief for each issue.
8. The user exports or shares a release report.

## MVP Feature Set

### Must Ship

- Supabase Auth with email/password.
- User-owned projects and audit runs in Supabase PostgreSQL.
- Protected dashboard, audit, findings, reports, settings, and integrations routes.
- Demo audit mode for presentation and onboarding.
- One real safe audit path:
  - target ownership confirmation
  - page availability check
  - metadata/header snapshot
  - non-destructive browser flow check
  - accessibility baseline
  - lightweight performance snapshot
- Findings table with severity, confidence, category, evidence, and recommendation.
- Report page with overall verdict and category-level evidence.
- Clear labels when evidence is demo, partial, or live.

### Should Ship Next

- GitHub App connection for repository metadata.
- OpenAI-assisted test-plan generation and report writing.
- Object storage for screenshots and Playwright traces.
- Queue-backed audit jobs instead of browser-local progress.
- Google OAuth through Supabase.
- Organization/team membership.

### Not In The MVP

- Autonomous penetration testing.
- Exploit execution.
- Secret scanning against private repos without a GitHub App install and explicit scope.
- Automatic code changes without human approval.
- Production target testing without a separate owner-approved policy.

## Product Screens

- Landing: cinematic explanation of the audit journey.
- Sign in / register: Supabase email/password first.
- Dashboard: overall health, three team scores, recent findings, active audit.
- New audit: project, target, authorization, selected teams, launch.
- Audit run: stage progress, event stream, evidence cards.
- Findings: filterable issue workspace.
- Fix Center: recommendation briefs and verification path.
- Reports: shareable release decision.
- Settings: workspace, safety, integration mode.

## Data Model For MVP

- `profiles`
- `projects`
- `audit_targets`
- `audit_runs`
- `audit_events`
- `findings`
- `finding_evidence`
- `release_reports`

Every tenant-owned row needs `user_id` or `org_id`, timestamps, and row-level security. Do not store secrets in client-visible tables.

## MVP Success Criteria

- A new user can sign up, create a project, run a scoped audit, review findings, and open a report.
- The app never claims live audit evidence when it is using demo fixtures.
- A finding always explains what was checked, what failed, why it matters, and what to do next.
- The dashboard gives a decision in under ten seconds of reading.
- The UI feels consistent with the dark glass BuildProof visual system.
