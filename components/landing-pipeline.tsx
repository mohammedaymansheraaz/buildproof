"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import {
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
  type LucideIcon,
} from "lucide-react";
import {
  CinematicAuditCore,
  CinematicStageDepth,
  auditAssemblyStages,
  type AuditAssemblyStageId,
} from "@/components/cinematic-audit-core";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type PipelineStage = {
  id: AuditAssemblyStageId;
  number: string;
  label: string;
  chamberClass: string;
  state: string;
  icon: LucideIcon;
  title: string;
  description: string;
  chips: string[];
};

const pipelineStages: PipelineStage[] = [
  {
    id: "intelligence",
    number: "01",
    label: "Application intake",
    chamberClass: "repo",
    state: "Mapped",
    icon: GitBranch,
    title: "The application enters an intelligence layer.",
    description: "BuildProof maps the repository, product intent, known routes, test accounts, and approved target boundaries before any specialist begins.",
    chips: ["Application graph", "Owner approved", "Target verified"],
  },
  {
    id: "experience",
    number: "02",
    label: "Experience quality",
    chamberClass: "browser",
    state: "Observed",
    icon: Globe2,
    title: "Experience specialists walk the product like real users.",
    description: "Journey, UI behavior, functional QA, and accessibility agents preserve browser, visual, and interaction evidence behind each result.",
    chips: ["User journeys", "UI behavior", "Accessibility"],
  },
  {
    id: "engineering",
    number: "03",
    label: "Engineering systems",
    chamberClass: "cloud",
    state: "Correlated",
    icon: Network,
    title: "Engineering intelligence follows every interaction into the system.",
    description: "Performance, APIs, data flow, cloud posture, and deployment readiness are correlated in the same application context—not split into isolated reports.",
    chips: ["API contract", "Data path", "Scale readiness"],
  },
  {
    id: "security",
    number: "04",
    label: "Security intelligence",
    chamberClass: "security",
    state: "Reviewed",
    icon: ShieldCheck,
    title: "Security intelligence explains risk without turning production into a target.",
    description: "Authorized, non-destructive checks connect identity, data protection, vulnerability, and reliability signals to an accountable evidence trail.",
    chips: ["Identity", "Data protection", "Exposure review"],
  },
  {
    id: "verdict",
    number: "05",
    label: "Health report",
    chamberClass: "verdict",
    state: "Sealed",
    icon: FileCheck2,
    title: "End with one health report everyone can interrogate.",
    description: "Experience, engineering, and security intelligence combine into an application health reading with evidence, recommendation, and human decision context.",
    chips: ["Expert summaries", "Evidence replay", "Re-test ready"],
  },
];

/**
 * The one landing-page scroll owner. The semantic cards are always present;
 * GSAP/Lenis only pins and cross-fades them on capable desktop displays.
 */
export function LandingPipeline() {
  const pipelineRef = useRef<HTMLElement>(null);
  const scrubProgressRef = useRef(0);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [webglEnabled, setWebglEnabled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      const enabled = window.innerWidth >= 900 && !reducedMotion.matches;
      setMotionEnabled(enabled);

      if (!enabled) {
        setWebglEnabled(false);
        return;
      }

      const canvas = document.createElement("canvas");
      setWebglEnabled(Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl")));
    };

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

    const context = gsap.context(() => {
      const chambers = gsap.utils.toArray<HTMLElement>("[data-pipeline-chamber]");
      const depths = gsap.utils.toArray<HTMLElement>("[data-pipeline-depth]");
      const markers = gsap.utils.toArray<HTMLElement>("[data-stage-marker]");
      const beam = root.querySelector<HTMLElement>(".landing-signal-beam");

      if (!beam || chambers.length !== pipelineStages.length || markers.length !== pipelineStages.length || depths.length !== pipelineStages.length) return;

      const beamOffset = (index: number) => {
        const marker = markers[index];
        return marker.offsetTop + marker.offsetHeight / 2 - beam.offsetTop - beam.offsetHeight / 2;
      };

      gsap.set(chambers, { autoAlpha: 0, y: 44, rotateX: 7, transformOrigin: "50% 100%" });
      gsap.set(chambers[0], { autoAlpha: 1, y: 0, rotateX: 0 });
      gsap.set(depths, { autoAlpha: 0, y: 20 });
      gsap.set(depths[0], { autoAlpha: 1, y: 0 });
      gsap.set(markers, { autoAlpha: 0.38 });
      gsap.set(markers[0], { autoAlpha: 1 });
      gsap.set(beam, { y: () => beamOffset(0) });

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "buildproof-landing-pipeline",
          trigger: root,
          start: "top top",
          end: `+=${(pipelineStages.length - 1) * 860}`,
          pin: true,
          scrub: 0.72,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(depths[0], { autoAlpha: 1, y: 0, duration: 0.42 }, 0.12);

      chambers.slice(1).forEach((chamber, index) => {
        const previous = chambers[index];
        const markerIndex = index + 1;
        const at = index + 0.72;

        timeline
          .to(depths[index], { autoAlpha: 0, y: -12, duration: 0.25 }, at)
          .to(previous, { autoAlpha: 0, y: -38, rotateX: -5, duration: 0.8 }, at)
          .to(chamber, { autoAlpha: 1, y: 0, rotateX: 0, duration: 0.9 }, at)
          .to(depths[markerIndex], { autoAlpha: 1, y: 0, duration: 0.56 }, at + 0.2)
          .to(beam, { y: () => beamOffset(markerIndex), duration: 0.9 }, at)
          .to(markers[index], { autoAlpha: 0.38, duration: 0.2 }, at)
          .to(markers[markerIndex], { autoAlpha: 1, duration: 0.3 }, at + 0.1);
      });

      timeline.eventCallback("onUpdate", () => {
        const progress = timeline.progress();
        scrubProgressRef.current = progress;
        const nextIndex = Math.min(pipelineStages.length - 1, Math.round(progress * (pipelineStages.length - 1)));
        setActiveIndex((current) => current === nextIndex ? current : nextIndex);
      });
    }, root);

    return () => {
      context.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
      scrubProgressRef.current = 0;
      setActiveIndex(0);
    };
  }, [motionEnabled]);

  return (
    <section
      id="how-it-works"
      ref={pipelineRef}
      className={cn("landing-pipeline", motionEnabled && "landing-pipeline--motion")}
      data-reduced-motion={motionEnabled ? "false" : "true"}
      aria-labelledby="pipeline-title"
    >
      <a className="landing-pipeline__skip" href="#proof">Skip cinematic story</a>
      <div className="landing-pipeline__frame">
        <div className="landing-pipeline__intro">
          <span className="marketing-eyebrow">The intelligence path</span>
          <h2 id="pipeline-title">One application.<br />Five connected scenes.</h2>
          <p>The signal only moves when each expert team hands the next one evidence worth investigating.</p>
        </div>

        <div className="landing-pipeline__rail" aria-label="Audit phases">
          <span className="landing-signal-beam" aria-hidden="true"><i /></span>
          <ol>
            {pipelineStages.map((stage, index) => (
              <li key={stage.number} data-stage-marker aria-current={activeIndex === index ? "step" : undefined}>
                <span>{stage.number}</span>
                <strong>{stage.label}</strong>
              </li>
            ))}
          </ol>
        </div>

        <div className="landing-pipeline__chambers">
          {motionEnabled && webglEnabled ? <CinematicAuditCore progressRef={scrubProgressRef} reduceMotion={false} /> : null}
          {pipelineStages.map((stage, index) => {
            const Icon = stage.icon;
            const assembly = auditAssemblyStages[index];

            return (
              <article
                className={cn("landing-chamber", `landing-chamber--${stage.chamberClass}`, activeIndex === index && "landing-chamber--active")}
                data-pipeline-chamber
                data-stage={stage.id}
                key={stage.id}
                aria-labelledby={`pipeline-stage-${stage.id}`}
              >
                <div className="landing-chamber__header">
                  <span className="landing-chamber__index">{stage.number} / {stage.label}</span>
                  <span className="landing-chamber__state"><span />{activeIndex === index && motionEnabled ? assembly.status : stage.state}</span>
                </div>
                <div className="landing-chamber__layout">
                  <div className="landing-chamber__copy">
                    <span className="landing-chamber__icon"><Icon size={19} /></span>
                    <h3 id={`pipeline-stage-${stage.id}`}>{stage.title}</h3>
                    <p>{stage.description}</p>
                    <div className="landing-chamber__chips">{stage.chips.map((chip) => <span key={chip}>{chip}</span>)}</div>
                  </div>
                  <div className="landing-chamber__instrument">{renderInstrument(stage.id)}</div>
                </div>
                <CinematicStageDepth stageIndex={index} active={activeIndex === index} />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function renderInstrument(stageId: AuditAssemblyStageId) {
  if (stageId === "intelligence") {
    return <div className="repo-terminal" aria-label="Example repository intelligence output"><div className="repo-terminal__chrome"><i /><i /><i /><span>scope.manifest</span></div><p><span>✓</span> 184 interfaces classified</p><p><span>✓</span> 12 critical journeys found</p><p><span>✓</span> application target verified</p><p className="repo-terminal__muted">↳ routing the app to specialist teams</p></div>;
  }

  if (stageId === "experience") {
    return <div className="browser-surface" aria-label="Example browser test result"><div className="browser-surface__toolbar"><span /><span /><span /><b>app.acme.dev/settings</b></div><div className="browser-surface__body"><div className="browser-surface__nav"><i /><i /><i /></div><div className="browser-surface__content"><span /><span /><span /></div><div className="browser-surface__toast"><BadgeCheck size={13} /> Invite flow completed</div></div><div className="browser-surface__trace"><TerminalSquare size={13} /> browser.click → 201 ms → POST /invites 201</div></div>;
  }

  if (stageId === "engineering") {
    return <div className="system-graph" aria-label="Example system evidence graph"><div className="system-graph__node system-graph__node--browser"><Globe2 size={17} /><small>Browser</small></div><div className="system-graph__node system-graph__node--api"><Braces size={17} /><small>API</small></div><div className="system-graph__node system-graph__node--cloud"><Cloud size={17} /><small>Cloud</small></div><span className="system-graph__line system-graph__line--one" /><span className="system-graph__line system-graph__line--two" /><div className="system-graph__reading"><span>Config boundary</span><strong>1 caution</strong><small>source ↔ runtime mismatch</small></div></div>;
  }

  if (stageId === "security") {
    return <div className="security-grid" aria-label="Example security baseline results"><div><LockKeyhole size={16} /><span>Secret exposure</span><strong className="verdict-pass">No signal</strong></div><div><Waypoints size={16} /><span>External surface</span><strong className="verdict-caution">Review</strong></div><div><ShieldCheck size={16} /><span>Response headers</span><strong className="verdict-pass">Observed</strong></div><p><span /> Checks remain safe, scoped, and attributable to the approving team.</p></div>;
  }

  return <div className="release-passport-preview" aria-label="Example release passport"><div className="release-passport-preview__top"><span>RELEASE PASSPORT</span><FileCheck2 size={16} /></div><div className="release-passport-preview__score"><strong>82</strong><div><span>Readiness signal</span><b>REVIEW</b></div></div><div className="release-passport-preview__finding"><span className="severity-dot severity-dot--caution" /><div><strong>Runtime config mismatch</strong><small>Evidence attached · retest after fix</small></div><ArrowRight size={14} /></div><div className="release-passport-preview__footer"><span><Check size={12} /> 27 checks observed</span><span>v0.1</span></div></div>;
}
