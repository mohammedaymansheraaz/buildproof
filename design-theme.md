# BuildProof Design Theme

## Theme Name

**Evidence Glass**

The interface should feel like a serious engineering instrument: dark, quiet, precise, and readable. The goal is not generic AI neon. The product should look like an audit system that collects proof.

## Core Tokens

| Token | Value | Use |
| --- | --- | --- |
| Void | `#0A0D12` | Main background |
| Raised Void | `#101620` | Navigation, panels, elevated surfaces |
| Glass | `rgba(255, 255, 255, 0.055)` | Standard translucent surfaces |
| Glass Strong | `rgba(255, 255, 255, 0.09)` | Active or important surfaces |
| Glass Focus | `rgba(159, 232, 255, 0.12)` | Selected audit state |
| Line | `rgba(255, 255, 255, 0.12)` | Borders and separators |
| Ink | `#E7ECF2` | Primary text |
| Ink Soft | `#B9C4CF` | Secondary text |
| Muted | `#7D8792` | Helper text |
| Signal | `#9FE8FF` | Beam, active state, selected icons |
| Warm Proof | `#D9A15B` | Sparse hover/accent/proof detail |
| Pass | `#4ADE80` | Semantic pass only |
| Caution | `#FBBF24` | Semantic review/warning only |
| Hold | `#F87171` | Semantic blocker/critical only |

## Visual Rules

- Use Signal only for active states, focus, progress, and scan energy.
- Use Warm Proof only for sparse highlights, not whole sections.
- Use semantic colors only for verdict meaning.
- Keep panels translucent, not flat black.
- Use thin borders and small highlights; avoid heavy glow.
- Keep dashboard surfaces dense and scannable.
- Avoid decorative blobs, purple gradients, and cyberpunk neon.
- Avoid negative letter spacing; keep text stable and professional.

## Typography

- Product UI: Inter or system sans.
- Evidence, event streams, scores, IDs: JetBrains Mono, IBM Plex Mono, or system monospace.
- Wordmark direction: modern geometric sans, stable and serious.
- Dashboard headings should be compact. Hero-scale type belongs only on the landing page.

## Layout System

- Desktop-first for the MVP.
- Navigation rail: compact, icon-visible, expandable.
- Dashboard: command deck first, then category evidence.
- Cards: use only for repeated items, findings, reports, or small controls.
- Page sections: full-width layouts with constrained inner content.
- No card-inside-card composition.

## Component Direction

- Primary action: glass button with Signal or Ink contrast.
- Secondary action: transparent glass button.
- Icon buttons: lucide icons with tooltip/title.
- Scores: large numeric value plus confidence/evidence context.
- Findings: severity, affected area, evidence, next action, owner state.
- Reports: verdict first, evidence second, recommendations third.

## Motion Direction

- Motion should show audit progress or state transition.
- Landing can be cinematic and scroll-driven.
- Workspace should be restrained and fast.
- Always respect reduced motion.
- Do not hide critical information behind animation.

## Logo Direction

The logo should not rely on a stylized `B`. The stronger direction is an audit core, proof seal, release gate, or evidence aperture built from three connected validation layers:

- user journey layer
- engineering/data layer
- security/reliability boundary

The mark should work in a dark glass header and a small app sidebar icon.
