"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
  Aperture,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Braces,
  Check,
  Cloud,
  FileCheck2,
  GitBranch,
  Globe2,
  LockKeyhole,
  Network,
  ShieldCheck,
  TerminalSquare,
  Waypoints,
} from "lucide-react";
import { MarketingAuthControls } from "@/components/auth-controls";
import { CinematicAuditCore } from "@/components/cinematic-audit-core";

const pipelineStages = [
  { number: "01", label: "Application intake" },
  { number: "02", label: "Experience quality" },
  { number: "03", label: "Engineering systems" },
  { number: "04", label: "Security intelligence" },
  { number: "05", label: "Health report" },
];

export function LandingPage() {
  const pipelineRef = useRef<HTMLElement>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setMotionEnabled(window.innerWidth >= 900 && !reducedMotion.matches);

    updateMotionPreference();
    window.addEventListener("resize", updateMotionPreference);
    reducedMotion.addEventListener("change", updateMotionPreference);

    return () => {
      window.removeEventListener("resize", updateMotionPreference);
      reducedMotion.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (!motionEnabled || !pipelineRef.current) return;

    const root = pipelineRef.current;
    const lenis = new Lenis({ lerp: 0.075, smoothWheel: true, syncTouch: false });
    const syncScroll = () => ScrollTrigger.update();
    const tick = (time: number) => lenis.raf(time * 1000);

    lenis.on("scroll", syncScroll);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    gsap.registerPlugin(ScrollTrigger);

    const context = gsap.context(() => {
      const chambers = gsap.utils.toArray<HTMLElement>(".landing-chamber");
      const markers = gsap.utils.toArray<HTMLElement>("[data-stage-marker]");
      const beam = root.querySelector<HTMLElement>(".landing-signal-beam");

      if (!beam || chambers.length !== pipelineStages.length || markers.length !== pipelineStages.length) return;

      const beamOffset = (index: number) => {
        const marker = markers[index];
        return marker.offsetTop + marker.offsetHeight / 2 - beam.offsetTop - beam.offsetHeight / 2;
      };

      gsap.set(chambers, { autoAlpha: 0, y: 44, rotateX: 7, transformOrigin: "50% 100%" });
      gsap.set(chambers[0], { autoAlpha: 1, y: 0, rotateX: 0 });
      gsap.set(markers, { autoAlpha: 0.38 });
      gsap.set(markers[0], { autoAlpha: 1 });
      gsap.set(beam, { y: () => beamOffset(0) });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: `+=${(pipelineStages.length - 1) * 860}`,
          pin: true,
          scrub: 0.72,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      chambers.slice(1).forEach((chamber, index) => {
        const previous = chambers[index];
        const markerIndex = index + 1;
        const at = index + 0.72;

        timeline
          .to(previous, { autoAlpha: 0, y: -38, rotateX: -5, duration: 0.8 }, at)
          .to(chamber, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.9 }, at)
          .to(beam, { y: () => beamOffset(markerIndex), duration: 0.9 }, at)
          .to(markers[index], { autoAlpha: 0.38, duration: 0.2 }, at)
          .to(markers[markerIndex], { autoAlpha: 1, duration: 0.3 }, at + 0.1);
      });
    }, root);

    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, [motionEnabled]);

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
          <p>BuildProof turns a release surface into one understandable health reading—through experience, engineering, and security intelligence your team can defend.</p>
          <div className="landing-hero__actions">
            <Link href="/sign-up" className="marketing-button marketing-button--signal">Start an application audit <ArrowRight size={16} /></Link>
            <a href="#how-it-works" className="marketing-text-link">Enter the intelligence layer <ArrowDown size={14} /></a>
          </div>
          <div className="landing-hero__footnotes" aria-label="Product principles">
            <span><Check size={13} /> Three expert readings</span>
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

      <section id="how-it-works" ref={pipelineRef} className={`landing-pipeline${motionEnabled ? " landing-pipeline--motion" : ""}`} aria-labelledby="pipeline-title">
        <div className="landing-pipeline__frame">
          <div className="landing-pipeline__intro">
            <span className="marketing-eyebrow">The intelligence path</span>
            <h2 id="pipeline-title">One application.<br />Five connected scenes.</h2>
            <p>The signal only moves when each expert team hands the next one evidence worth investigating.</p>
          </div>

          <div className="landing-pipeline__rail" aria-label="Audit phases">
            <span className="landing-signal-beam" aria-hidden="true"><i /></span>
            <ol>
              {pipelineStages.map((stage) => (
                <li key={stage.number} data-stage-marker>
                  <span>{stage.number}</span>
                  <strong>{stage.label}</strong>
                </li>
              ))}
            </ol>
          </div>

          <div className="landing-pipeline__chambers">
            <article className="landing-chamber landing-chamber--repo">
              <div className="landing-chamber__header">
                <span className="landing-chamber__index">01 / Application intake</span>
                <span className="landing-chamber__state"><span />Mapped</span>
              </div>
              <div className="landing-chamber__layout">
                <div className="landing-chamber__copy">
                  <span className="landing-chamber__icon"><GitBranch size={19} /></span>
                  <h3>The application enters an intelligence layer.</h3>
                  <p>BuildProof maps the repository, product intent, known routes, test accounts, and approved target boundaries before any specialist begins.</p>
                  <div className="landing-chamber__chips"><span>Application graph</span><span>Owner approved</span><span>Target verified</span></div>
                </div>
                <div className="repo-terminal" aria-label="Example repository intelligence output">
                  <div className="repo-terminal__chrome"><i /><i /><i /><span>scope.manifest</span></div>
                  <p><span>✓</span> 184 interfaces classified</p>
                  <p><span>✓</span> 12 critical journeys found</p>
                  <p><span>✓</span> application target verified</p>
                  <p className="repo-terminal__muted">↳ routing the app to three specialist teams</p>
                </div>
              </div>
            </article>

            <article className="landing-chamber landing-chamber--browser">
              <div className="landing-chamber__header">
                <span className="landing-chamber__index">02 / Experience & quality</span>
                <span className="landing-chamber__state"><span />Observed</span>
              </div>
              <div className="landing-chamber__layout">
                <div className="landing-chamber__copy">
                  <span className="landing-chamber__icon"><Globe2 size={19} /></span>
                  <h3>Experience specialists walk the product like real users.</h3>
                  <p>Journey, UI behavior, functional QA, and accessibility agents preserve browser, visual, and interaction evidence behind each result.</p>
                  <div className="landing-chamber__chips"><span>User journeys</span><span>UI behavior</span><span>Accessibility</span></div>
                </div>
                <div className="browser-surface" aria-label="Example browser test result">
                  <div className="browser-surface__toolbar"><span /><span /><span /><b>app.acme.dev/settings</b></div>
                  <div className="browser-surface__body">
                    <div className="browser-surface__nav"><i /><i /><i /></div>
                    <div className="browser-surface__content"><span /><span /><span /></div>
                    <div className="browser-surface__toast"><BadgeCheck size={13} /> Invite flow completed</div>
                  </div>
                  <div className="browser-surface__trace"><TerminalSquare size={13} /> browser.click → 201 ms → POST /invites 201</div>
                </div>
              </div>
            </article>

            <article className="landing-chamber landing-chamber--cloud">
              <div className="landing-chamber__header">
                <span className="landing-chamber__index">03 / Engineering & infrastructure</span>
                <span className="landing-chamber__state"><span />Correlated</span>
              </div>
              <div className="landing-chamber__layout">
                <div className="landing-chamber__copy">
                  <span className="landing-chamber__icon"><Network size={19} /></span>
                  <h3>Engineering intelligence follows every interaction into the system.</h3>
                  <p>Performance, APIs, data flow, cloud posture, and deployment readiness are correlated in the same application context—not split into isolated reports.</p>
                  <div className="landing-chamber__chips"><span>API contract</span><span>Data path</span><span>Scale readiness</span></div>
                </div>
                <div className="system-graph" aria-label="Example system evidence graph">
                  <div className="system-graph__node system-graph__node--browser"><Globe2 size={17} /><small>Browser</small></div>
                  <div className="system-graph__node system-graph__node--api"><Braces size={17} /><small>API</small></div>
                  <div className="system-graph__node system-graph__node--cloud"><Cloud size={17} /><small>Cloud</small></div>
                  <span className="system-graph__line system-graph__line--one" />
                  <span className="system-graph__line system-graph__line--two" />
                  <div className="system-graph__reading"><span>Config boundary</span><strong>1 caution</strong><small>source ↔ runtime mismatch</small></div>
                </div>
              </div>
            </article>

            <article className="landing-chamber landing-chamber--security">
              <div className="landing-chamber__header">
                <span className="landing-chamber__index">04 / Security & reliability</span>
                <span className="landing-chamber__state"><span />Reviewed</span>
              </div>
              <div className="landing-chamber__layout">
                <div className="landing-chamber__copy">
                  <span className="landing-chamber__icon"><ShieldCheck size={19} /></span>
                  <h3>Security intelligence explains risk without turning production into a target.</h3>
                  <p>Authorized, non-destructive checks connect identity, data protection, vulnerability, and reliability signals to an accountable evidence trail.</p>
                  <div className="landing-chamber__chips"><span>Identity</span><span>Data protection</span><span>Exposure review</span></div>
                </div>
                <div className="security-grid" aria-label="Example security baseline results">
                  <div><LockKeyhole size={16} /><span>Secret exposure</span><strong className="verdict-pass">No signal</strong></div>
                  <div><Waypoints size={16} /><span>External surface</span><strong className="verdict-caution">Review</strong></div>
                  <div><ShieldCheck size={16} /><span>Response headers</span><strong className="verdict-pass">Observed</strong></div>
                  <p><span /> Checks remain safe, scoped, and attributable to the approving team.</p>
                </div>
              </div>
            </article>

            <article className="landing-chamber landing-chamber--verdict">
              <div className="landing-chamber__header">
                <span className="landing-chamber__index">05 / Application health report</span>
                <span className="landing-chamber__state"><span />Sealed</span>
              </div>
              <div className="landing-chamber__layout">
                <div className="landing-chamber__copy">
                  <span className="landing-chamber__icon"><FileCheck2 size={19} /></span>
                  <h3>End with one health report everyone can interrogate.</h3>
                  <p>Experience, engineering, and security intelligence combine into an application health reading with evidence, recommendation, and human decision context.</p>
                  <div className="landing-chamber__chips"><span>Expert summaries</span><span>Evidence replay</span><span>Re-test ready</span></div>
                </div>
                <div className="release-passport-preview" aria-label="Example release passport">
                  <div className="release-passport-preview__top"><span>RELEASE PASSPORT</span><FileCheck2 size={16} /></div>
                  <div className="release-passport-preview__score"><strong>82</strong><div><span>Readiness signal</span><b>REVIEW</b></div></div>
                  <div className="release-passport-preview__finding"><span className="severity-dot severity-dot--caution" /><div><strong>Runtime config mismatch</strong><small>Evidence attached · retest after fix</small></div><ArrowRight size={14} /></div>
                  <div className="release-passport-preview__footer"><span><Check size={12} /> 27 checks observed</span><span>v0.1</span></div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <CinematicAuditCore />

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
