"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Aperture,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Braces,
  Check,
  FileCheck2,
  GitBranch,
  Globe2,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { MarketingAuthControls } from "@/components/auth-controls";
import { LandingPipeline } from "@/components/landing-pipeline";

export function LandingPage() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link href="/" className="marketing-brand" aria-label="BuildProof home">
          <span className="marketing-brand__mark"><Aperture size={19} strokeWidth={1.55} /></span>
          <span>BuildProof</span>
        </Link>
        <nav className="marketing-nav" aria-label="Product navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#proof">Evidence</a>
          <a href="#safety">Safety model</a>
        </nav>
        <MarketingAuthControls compact />
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero__copy">
          <span className="marketing-eyebrow"><span className="marketing-eyebrow__dot" />AI application intelligence for modern product teams</span>
          <h1 id="landing-title">Your application,<br /><em>seen by an expert team.</em></h1>
          <p>BuildProof turns a release surface into five clear expert readings—from product understanding to experience, engineering, security, and launch readiness.</p>
          <div className="landing-hero__actions">
            <Link href="/sign-up" className="marketing-button marketing-button--signal">Start an application audit <ArrowRight size={16} /></Link>
            <a href="#how-it-works" className="marketing-text-link">Enter the intelligence layer <ArrowDown size={14} /></a>
          </div>
          <div className="landing-hero__footnotes" aria-label="Product principles">
            <span><Check size={13} /> Five expert readings</span>
            <span><Check size={13} /> Evidence before scores</span>
            <span><Check size={13} /> Human approval for fixes</span>
          </div>
        </div>

        <div
          className="landing-hero__object"
          aria-hidden="true"
          onPointerMove={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
            const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -7;
            setTilt({ x, y });
          }}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div className="landing-orbit landing-orbit--outer" />
          <div className="landing-orbit landing-orbit--inner" />
          <div className="landing-release-object" style={{ transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}>
            <div className="landing-release-object__glint" />
            <span className="landing-release-object__eyebrow">Release reading</span>
            <strong>82</strong>
            <span className="landing-release-object__score">Evidence coverage</span>
            <div className="landing-release-object__bar"><span /></div>
            <span className="landing-release-object__status"><span />Review before ship</span>
          </div>
          <div className="landing-orbit-card landing-orbit-card--repo"><GitBranch size={15} /><span>Application mapped</span></div>
          <div className="landing-orbit-card landing-orbit-card--browser"><Globe2 size={15} /><span>Expert teams online</span></div>
          <div className="landing-orbit-card landing-orbit-card--evidence"><FileCheck2 size={15} /><span>Evidence assembling</span></div>
        </div>
      </section>

      <section className="landing-problem" aria-label="The release gap">
        <p>AI makes it easy to ship a convincing interface before anyone has proved the system behind it actually works.</p>
        <div>
          <span><Globe2 size={15} /> Experience says one thing</span>
          <ArrowRight size={15} />
          <span><Braces size={15} /> Systems say another</span>
          <ArrowRight size={15} />
          <span><ShieldCheck size={15} /> Risk needs proof</span>
        </div>
      </section>

      <LandingPipeline />

      <section id="proof" className="landing-proof" aria-labelledby="proof-title">
        <div>
          <span className="marketing-eyebrow">What the intelligence layer preserves</span>
          <h2 id="proof-title">A health score is useful<br />only when it can be replayed.</h2>
          <p>BuildProof gives every expert reading its scope, source, timestamp, artifact, and owner—not just a generated number.</p>
          <Link href="/sign-up" className="marketing-text-link">Set up your intelligence desk <ArrowRight size={14} /></Link>
        </div>
        <div className="evidence-stack" aria-label="Sample evidence stack">
          <div className="evidence-stack__card evidence-stack__card--one"><span>01</span><div><small>Experience reading</small><strong>Invite journey → browser trace</strong></div><Globe2 size={16} /></div>
          <div className="evidence-stack__card evidence-stack__card--two"><span>02</span><div><small>Engineering reading</small><strong>POST /invites → API contract</strong></div><TerminalSquare size={16} /></div>
          <div className="evidence-stack__card evidence-stack__card--three"><span>03</span><div><small>Security reading</small><strong>Policy boundary → reviewer decision</strong></div><BadgeCheck size={16} /></div>
          <div className="evidence-stack__connector" aria-hidden="true" />
        </div>
      </section>

      <section id="safety" className="landing-safety">
        <div className="landing-safety__seal"><ShieldCheck size={25} /><span>Scoped<br />by design</span></div>
        <div>
          <span className="marketing-eyebrow">A safer default for production teams</span>
          <h2>Audit authority is a product feature.</h2>
          <p>BuildProof begins with target approval, environment boundaries, test-account references, rate budgets, and an expiry. It is not an open-ended agent with a shell.</p>
        </div>
        <ul>
          <li><Check size={15} /> Verified targets only</li>
          <li><Check size={15} /> Redacted evidence</li>
          <li><Check size={15} /> Human-approved remediation</li>
        </ul>
      </section>

      <section className="landing-cta" aria-labelledby="cta-title">
        <span className="landing-cta__glow" aria-hidden="true" />
        <span className="marketing-eyebrow">Build the proof before the launch</span>
        <h2 id="cta-title">Your release deserves<br />more than a green button.</h2>
        <p>Open a workspace, define an authorized scope, and turn your next release into evidence.</p>
        <div className="landing-cta__actions">
          <Link href="/sign-up" className="marketing-button marketing-button--signal">Register for BuildProof <ArrowRight size={16} /></Link>
          <Link href="/dashboard" className="marketing-button marketing-button--quiet">Open workspace</Link>
        </div>
      </section>

      <footer className="marketing-footer">
        <Link href="/" className="marketing-brand"><span className="marketing-brand__mark"><Aperture size={16} /></span>BuildProof</Link>
        <span>Evidence-backed release assurance.</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
