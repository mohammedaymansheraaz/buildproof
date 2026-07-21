# BuildProof — Unified Audit Film

This is a standalone landing-page reference. It is deliberately isolated inside the prototype lab and is not imported by the main BuildProof application.

## What changed

The first three concepts are no longer presented as separate destinations in this version. Their strongest ideas are one visual system:

- **Evidence Observatory** supplies the guided signal/evidence spine.
- **Command Center** supplies the embedded metrics and specialist detail.
- **Release Atlas** supplies the full-width transforming application topology.

The result is one continuous, desktop-first scroll narrative:

1. Product Intelligence — Product Understanding Agent.
2. Application Experience & Quality — UI/UX Testing and Functional QA Agents.
3. Engineering Performance & Infrastructure — Performance, Backend + Cloud, Database, and DevOps capability.
4. Security & Reliability — Security Agent, followed by the ordered DevOps release-operation verification.
5. AI & Launch Readiness — optional AI Evaluation and the Final CTO-Level Report.

The permanent right-side trace preserves the requested exact execution order: **01 Product Understanding → 02 UI/UX → 03 Functional QA → 04 Performance → 05 Backend + Cloud → 06 Database → 07 Security → 08 DevOps → 09 AI Evaluation (optional) → 10 Final CTO-Level Report.**

## Controls

- The overview cards jump to the relevant chapter.
- The right agent rail jumps to the chapter that contains an agent.
- Pointer movement adds subtle depth to the scene objects.
- Register / Sign in open a non-functional auth visual; no data is sent.
- `prefers-reduced-motion` removes dependent motion and keeps all content readable.

## Preview

From this directory’s parent, serve the lab on any static server. For example:

```sh
python3 -m http.server 4173 --directory /home/ayman/Desktop/codexxomp/prototypes/landing-concepts
```

Then open `/04-unified-audit-film/`.
