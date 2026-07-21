# BuildProof — Figma / Lovable handoff

Use this document as a self-contained brief when the Figma and Lovable connections are available again. It intentionally contains no secrets, repository access, API keys, user credentials, or production integration instructions.

## Shared product brief

Design a desktop-first landing page for **BuildProof**, an AI-powered web-application audit and release-assurance platform. It helps founders, engineering leads, QA, cloud/DevOps teams, and security reviewers answer: **Can we release? What must be fixed first? What evidence supports that call?**

The experience must be premium, technically credible, and cinematic — more like a calm Apple-style product story or a carefully authored Awwwards experience than a generic neon “AI dashboard.” It should feel as if an expert engineering team is inspecting a real application in real time. Use a dark ink/graphite foundation, restrained glass panels, fine borders, readable contrast, a cool signal accent only for active flow, a rare warm accent, and semantic pass/caution/hold colors only for verdicts. Use a quiet sans display face and mono styling for telemetry/evidence. Do not use illustrated people, hacker clichés, random glowing blobs, chat UI, or decorative cyberpunk.

The page must tell one coherent narrative:

1. An authorized application/repository enters BuildProof.
2. The product is understood: roles, surfaces, critical journeys, dependencies, and scope.
3. Experience is inspected: UI/UX, functional QA, journeys, accessibility, and frontend behavior.
4. Engineering systems are inspected: performance, backend/cloud, database, DevOps/deployment readiness, data flow, scalability.
5. Security is inspected in an authorized and safe manner: vulnerabilities, authn/authz, data protection, security posture.
6. Optional AI evaluation and a Finance/CTO synthesis turn evidence into an accountable release decision.
7. User registers/signs in, then lands in a guided dashboard to connect a repository and staging target. Explain that a repository/browser target cannot expose every private runtime system without an approved connection.

Use these five visible pillars, exactly grouped:

1. **Product Intelligence** — Product Understanding Agent (01).
2. **Application Experience & Quality** — UI/UX Testing Agent (02), Functional QA Agent (03).
3. **Engineering Performance & Infrastructure** — Performance Engineer Agent (04), Backend + Cloud Engineer Agent (05), Database Engineer Agent (06), DevOps Engineer Agent (08).
4. **Security & Reliability Intelligence** — Security Engineer Agent (07).
5. **AI & Launch Readiness** — AI Evaluation Agent (09, conditional for apps with AI features), Finance / CTO Agent (10, synthesis/decision layer, not an extra scanner).

Use only mock readings in the prototype:

- Overall application health: **78 / 100**, conditional release.
- Pillar scores: Product 92; Experience 81; Engineering Performance & Infrastructure 73; Security & Reliability Intelligence 68; AI & Launch Readiness 76.
- 184 mapped surfaces; 12 priority journeys; 31 API paths; 8 trust boundaries; 82% evidence coverage; 3 release holds; 5 suggested owners.
- Example finding: **Invite acceptance does not retain a consistent state after retry.** Agent: Functional QA. Evidence: browser replay, request trace, affected route. Recommendation: make acceptance idempotent and add regression coverage for retry/reload.
- Example security hold: **Workspace invitation authorization needs review.** Agent: Security Engineer. State: high confidence / authorized staging scope / action required.
- Example decision: **Conditional release — ship after three holds are resolved:** invite retry state, authorization review, confirmed rollback evidence.

Trust requirements must be visible, concise, and non-negotiable:

- Authorized repositories, environments, and test targets only.
- Coverage and unknowns are explicit; findings are not proof that every defect/vulnerability is absent.
- High-risk security work defaults to safe, non-destructive methods.
- AI interpretations cite evidence and state uncertainty.
- Future auto-fix may propose a reviewable patch, never silently change production.

Create landing-page and auth visual language only. Do not add backend, API calls, credentials, real scanning, or a production database. Auth should be an elegant visual handoff with email/password and Google buttons, clearly not a fake working auth system. Respect `prefers-reduced-motion`; every message must remain available in a static no-motion version.

## Figma deliverable

Create one file named **BuildProof — Landing Concept Lab** with three desktop frames/pages (1440px wide) and a small cover/index. Include components/variants for: persistent glass header, primary/secondary CTA, mono evidence label, severity badge, pillar tab, agent chip, score card, evidence thread, and auth panel. Use auto layout and editable vector/CSS-like shapes rather than raster screenshots. Add a short annotation below each frame that names the governing interaction metaphor and the reduced-motion fallback.

## Lovable deliverable

Create three **separate, isolated prototype projects**. Do not import, remix, edit, or deploy the existing BuildProof repository. Each project should be a responsive static front-end prototype with mock data and no secrets. Include a local visual auth dialog, keyboard-focusable controls, and `prefers-reduced-motion` fallback. The exact three prompts follow.

---

## Prompt 01 — Evidence Observatory

Build a standalone desktop landing prototype named **BuildProof — Evidence Observatory**.

Use the shared BuildProof product brief above. The governing interaction is one continuous vertical inspection beam passing through five glass evidence chambers. This is an editorial, calm, precise product story — the visitor watches a single audit signal reveal one layer of truth at a time.

Required composition:

- Persistent translucent header with BuildProof mark, System / Evidence / Trust links, Sign in, and Register.
- Hero: headline about knowing what an application can survive before customers find out; a CSS/SVG 3D circular “health lens” with 78 health, 82% evidence coverage, 3 holds, 12 journeys.
- One continuous five-stage scroll story: Product Intelligence, Application Experience & Quality, Engineering Performance & Infrastructure, Security & Reliability Intelligence, AI & Launch Readiness. Use a fixed left scan rail and one active-state signal. Do not create a second, competing 3D story or user-drag metaphor.
- Put the specialist agent chips inside their matching pillar chamber, and show realistic instrumentation: product map, browser journey replay, request topology, authorization evidence, release brief.
- Include the exact 10 agent names and mapping from the shared brief. DevOps must appear in Engineering Performance & Infrastructure, not Security.
- Evidence thread for the invite-retry finding, a trust/limits section, and a final register CTA with a glass auth dialog preview.

Visual direction: near-black ink, translucent panels, pale cyan active signal, rare warm release accent, semantic green/amber/red only where warranted. No neon gradients, no fake terminal spam, no characters. Reduced motion: stacked panels and visible rail labels.

---

## Prompt 02 — Command Center

Build a standalone desktop landing prototype named **BuildProof — Command Center**.

Use the shared BuildProof product brief above. The governing interaction is a product-forward release board that demonstrates the dashboard a buyer will enter. It should feel like a refined engineering control room, not a sales dashboard or generic AI copilot.

Required composition:

- Persistent header, hero, Register / Sign in visual auth handoff.
- Hero headline: stop asking whether a build merely looks good. Explain shared evidence for founder, engineering, and security reviewers.
- The primary visual is a mock BuildProof console: project `acme / customer-portal`, 78 health, CONDITIONAL verdict, 82% coverage. It has tabs for overview + all five visible pillars. Clicking tabs changes mock content but preserves release context.
- Overview must show the five pillar scores, evidence queue, 3 holds, and 12 priority journeys.
- Each pillar tab shows its exact specialist agents, metrics, and a clear explanation of what it contributes. Keep all 10 agents, with DevOps in Engineering Performance & Infrastructure.
- Below the console: four-step governed audit method; an expandable five-pillar/ten-agent ledger; a detailed example finding; trust constraints; final CTA/auth dialog.

Visual direction: precise dark desktop UI, refined glass/surface layers, thin dividers, compact mono evidence, restrained cyan signal. Use interaction to demonstrate usefulness; avoid gratuitous scroll effects. Reduced motion: all sections static and tabs still usable.

---

## Prompt 03 — Release Atlas

Build a standalone desktop landing prototype named **BuildProof — Release Atlas**.

Use the shared BuildProof product brief above. The governing interaction is a spatial application topology. The visitor moves from a map of product surfaces, roles, requests, data, and trust boundaries toward the final release decision. This is the most architectural and exploratory option, but it must remain calm and readable.

Required composition:

- Persistent header and centered hero. Hero has a large inline SVG/CSS application atlas with labeled zones: Product Surface / 184 mapped components; User Journeys / 12 critical paths; Engineering Systems / 31 API paths; Trust Boundaries / 8 reviewed edges.
- “One map, five readings” interactive atlas. A horizontal set of the five visible pillars changes a stage readout. The map remains one connected system while the selected agent group, score, coverage, and metrics come forward.
- Full agent system must be shown below as a five-row atlas ledger, with the ten named agents and short responsibilities. DevOps belongs under Engineering Performance & Infrastructure.
- A four-step path from authorized scope → product map → corroborated evidence → release call.
- A release brief card: 78/100, Conditional release, the three stated holds, coverage and unknowns. Pair it with the Security Engineer authorization finding.
- Explicit safety/limits section and a final Register/Sign in auth handoff.

Visual direction: dark graphite with pale silver/cyan paths, rare warm nodes for items needing review, elegant grid/map geometry, minimal glass. No animated 3D object that competes with the spatial map. Reduced motion: map stays static, tabs still work, no important state depends on animation.
