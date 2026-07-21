"use client";

import Link from "next/link";
import {
  Activity,
  Aperture,
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Braces,
  Check,
  Cloud,
  Database,
  FileCheck2,
  GitBranch,
  Globe2,
  LockKeyhole,
  Network,
  Play,
  ShieldCheck,
  TerminalSquare,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { MarketingAuthControls } from "@/components/auth-controls";
import {
  allAgents,
  cinematicChapters,
  type AgentId,
  type CinematicBeat,
  type CinematicChapter,
  type FilmChapterId,
} from "@/components/unified-audit-film-data";
import styles from "@/components/unified-audit-film.module.css";

const chapterIcons: Record<FilmChapterId, LucideIcon> = {
  "product-intelligence": GitBranch,
  "experience-quality": Globe2,
  "engineering-infrastructure": Network,
  "security-reliability": ShieldCheck,
  "ai-launch-readiness": FileCheck2,
};

const chapterAccents: Record<FilmChapterId, string> = {
  "product-intelligence": "#9fe8ff",
  "experience-quality": "#bca8ff",
  "engineering-infrastructure": "#d9a15b",
  "security-reliability": "#f87171",
  "ai-launch-readiness": "#78d9aa",
};

const initialBeats = cinematicChapters.reduce<Record<FilmChapterId, number>>(
  (result, chapter) => ({ ...result, [chapter.id]: 0 }),
  {} as Record<FilmChapterId, number>,
);

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function UnifiedAuditFilm() {
  const chapterRefs = useRef<Partial<Record<FilmChapterId, HTMLElement | null>>>({});
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [headerElevated, setHeaderElevated] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<FilmChapterId>("product-intelligence");
  const [activeBeats, setActiveBeats] = useState<Record<FilmChapterId, number>>(initialBeats);

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
    if (!motionEnabled) return;

    let animationFrame = 0;
    const refreshStory = () => {
      animationFrame = 0;
      const focusLine = window.innerHeight * 0.46;
      let focusedChapter: FilmChapterId | null = null;
      let fallbackId: FilmChapterId = "product-intelligence";
      let fallbackDistance = Number.POSITIVE_INFINITY;
      const nextBeats: Partial<Record<FilmChapterId, number>> = {};

      cinematicChapters.forEach((chapter) => {
        const section = chapterRefs.current[chapter.id];
        if (!section) return;

        const rect = section.getBoundingClientRect();
        const scrollLength = Math.max(1, rect.height - window.innerHeight * 0.58);
        const progress = clamp((window.innerHeight * 0.18 - rect.top) / scrollLength);
        nextBeats[chapter.id] = Math.min(chapter.beats.length - 1, Math.floor(progress * chapter.beats.length));

        if (rect.top <= focusLine && rect.bottom >= focusLine) focusedChapter = chapter.id;
        const distance = Math.abs(rect.top - focusLine);
        if (distance < fallbackDistance) {
          fallbackId = chapter.id;
          fallbackDistance = distance;
        }
      });

      const chapterId = focusedChapter ?? fallbackId;
      setActiveChapterId((current) => (current === chapterId ? current : chapterId));
      setActiveBeats((current) => {
        let changed = false;
        const next = { ...current };
        cinematicChapters.forEach((chapter) => {
          const beat = nextBeats[chapter.id] ?? 0;
          if (next[chapter.id] !== beat) {
            next[chapter.id] = beat;
            changed = true;
          }
        });
        return changed ? next : current;
      });
      setHeaderElevated(window.scrollY > 16);
    };

    const requestRefresh = () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(refreshStory);
    };

    refreshStory();
    window.addEventListener("scroll", requestRefresh, { passive: true });
    window.addEventListener("resize", requestRefresh);
    return () => {
      window.removeEventListener("scroll", requestRefresh);
      window.removeEventListener("resize", requestRefresh);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [motionEnabled]);

  useEffect(() => {
    if (motionEnabled) return;
    const updateHeader = () => setHeaderElevated(window.scrollY > 16);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, [motionEnabled]);

  // The server intentionally renders the accessible stacked fallback first.
  // Re-apply a chapter hash after the desktop film replaces that fallback so
  // direct links do not retain the fallback's much larger scroll position.
  useEffect(() => {
    if (!motionEnabled || !window.location.hash) return;
    const targetId = decodeURIComponent(window.location.hash.slice(1));
    const target = document.getElementById(targetId);
    if (!target) return;
    const frame = window.requestAnimationFrame(() => target.scrollIntoView({ behavior: "auto", block: "start" }));
    return () => window.cancelAnimationFrame(frame);
  }, [motionEnabled]);

  const activeChapter = cinematicChapters.find((chapter) => chapter.id === activeChapterId) ?? cinematicChapters[0];
  const activeBeat = activeChapter.beats[activeBeats[activeChapter.id] ?? 0] ?? activeChapter.beats[0];
  const activeAgentId = executionAgentFor(activeChapter.id, activeBeat.agentIds);
  const preparedDevOps = activeChapter.id === "engineering-infrastructure" && activeBeat.agentIds.includes("08");
  const rootStyle = { "--film-accent": chapterAccents[activeChapter.id] } as CSSProperties;

  const scrollToChapter = (chapterId: FilmChapterId, beat = 0) => {
    const section = chapterRefs.current[chapterId];
    const chapter = cinematicChapters.find((item) => item.id === chapterId);
    if (!section || !chapter) return;

    if (!motionEnabled) {
      section.scrollIntoView({ behavior: "auto", block: "start" });
      return;
    }

    const usableDistance = Math.max(0, section.offsetHeight - window.innerHeight);
    // `story` is positioned for its visual spine, so offsetTop is relative to
    // that parent—not the document. Use the viewport rect for true navigation.
    const documentTop = section.getBoundingClientRect().top + window.scrollY;
    const target = documentTop + usableDistance * (beat / Math.max(1, chapter.beats.length)) + 4;
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <main className={styles.auditFilm} style={rootStyle}>
      <a className={styles.skipLink} href="#overview">Skip to the audit story</a>
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.ambientField} aria-hidden="true"><i /><i /><i /></div>

      <FilmHeader elevated={headerElevated} />
      {motionEnabled ? (
        <AgentRail
          activeAgentId={activeAgentId}
          preparedDevOps={preparedDevOps}
          onAgentClick={(agentId) => {
            const destination = findAgentDestination(agentId);
            scrollToChapter(destination.chapterId, destination.beatIndex);
          }}
        />
      ) : null}

      <section className={styles.hero} aria-labelledby="film-hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><i /> Release assurance for teams that ship</p>
          <h1 id="film-hero-title">Know what your application can <em>survive</em> before your customers find out.</h1>
          <p className={styles.heroLede}>BuildProof coordinates a specialist engineering team around an authorized application, then turns product behavior, infrastructure signals, and security evidence into one accountable release decision.</p>
          <div className={styles.heroActions}>
            <Link href="/sign-up" className={styles.signalButton}>Start an audit <ArrowRight size={16} /></Link>
            <a className={styles.textAction} href="#overview">Enter the system <ArrowDown size={15} /></a>
          </div>
          <p className={styles.scopeNote}>For repositories, staging targets, and test accounts you own or are explicitly authorized to assess.</p>
        </div>

        <HeroInstrument />

        <aside className={styles.heroAside} aria-label="Illustrative sample audit reading">
          <p className={styles.eyebrow}><i /> Sample reading</p>
          <strong>payscope-web</strong>
          <p>Authorized staging scope<br />12 priority journeys · 8 trust boundaries</p>
          <div className={styles.miniVerdict}><span>Conditional</span><b>3 holds</b></div>
        </aside>
      </section>

      <section className={styles.overview} id="overview" aria-labelledby="overview-title">
        <div className={styles.overviewCopy}>
          <p className={styles.eyebrow}><i /> One system, not ten disconnected tools</p>
          <h2 id="overview-title">The audit stays simple for people. The depth stays inside the evidence.</h2>
          <p>Five connected chapters keep the experience legible. The ten specialist agents still run in a clear order, and every handoff becomes part of the same release record.</p>
        </div>
        <div className={styles.chapterJumpGrid} aria-label="Audit film chapters">
          {cinematicChapters.map((chapter) => {
            const Icon = chapterIcons[chapter.id];
            return (
              <button
                key={chapter.id}
                className={styles.chapterJump}
                style={{ "--chapter-accent": chapterAccents[chapter.id] } as CSSProperties}
                type="button"
                onClick={() => scrollToChapter(chapter.id)}
              >
                <span>{chapter.number} / Chapter</span>
                <Icon size={18} strokeWidth={1.45} />
                <b>{chapter.title}</b>
                <small>{chapter.agentIds.map((id) => `Agent ${id}`).join(" · ")}</small>
              </button>
            );
          })}
        </div>
        <div className={styles.scopeStrip}>
          <span><b>01</b> connect an authorized repository or target</span>
          <span><b>02</b> understand the product before judging it</span>
          <span><b>03</b> inspect safely, corroborate, decide</span>
        </div>
      </section>

      <section className={styles.scopeGate} aria-labelledby="scope-title">
        <div className={styles.scopeGlow} aria-hidden="true" />
        <div className={styles.scopeCopy}>
          <p className={styles.eyebrow}><i /> A scope gate, before the signal starts</p>
          <h2 id="scope-title">Good assurance says what it can see—and what it cannot.</h2>
          <p>BuildProof begins with explicit permission, a chosen target, and visible coverage boundaries. A repository or browser URL never becomes an excuse to imply hidden access.</p>
        </div>
        <div className={styles.scopeConsole}>
          <header><span /> Audit input / illustrative</header>
          <div>
            <article><small>Repository</small><b>github.com/acme/payscope-web</b><span>approved connection</span></article>
            <article><small>Test target</small><b>staging.payscope.app</b><span>safe browser scope</span></article>
            <article><small>Authorization</small><b>confirmed by owner</b><span>non-destructive checks</span></article>
          </div>
          <footer><span>coverage plan ready</span><b>Read-only by default</b></footer>
        </div>
        <aside className={styles.scopeLimit}><b>Visible limit</b><p>Private cloud settings, hidden services, and production data require an approved connection. Unknown is a valid audit result.</p></aside>
      </section>

      <div id="audit-film" className={styles.story} aria-label="Cinematic BuildProof audit story">
        {cinematicChapters.map((chapter) => (
          <FilmChapter
            chapter={chapter}
            key={chapter.id}
            motionEnabled={motionEnabled}
            activeBeatIndex={activeBeats[chapter.id] ?? 0}
            registerRef={(node) => { chapterRefs.current[chapter.id] = node; }}
            onBeatSelect={(beat) => scrollToChapter(chapter.id, beat)}
          />
        ))}
      </div>

      <section className={styles.trustFooter} aria-labelledby="trust-title">
        <div>
          <p className={styles.eyebrow}><i /> What the audit protects</p>
          <h2 id="trust-title">A score is useful only when the team can replay the proof.</h2>
        </div>
        <div className={styles.trustPrinciples}>
          <article><BadgeCheck size={18} /><b>Evidence before score</b><p>Every result points to a scope, source, moment, and owner instead of a generated claim.</p></article>
          <article><LockKeyhole size={18} /><b>Scoped by design</b><p>Authorization, environment boundaries, and safe defaults are part of the product—not an afterthought.</p></article>
          <article><Waypoints size={18} /><b>Human-approved action</b><p>BuildProof can explain a fix, but release teams keep the authority to make it.</p></article>
        </div>
      </section>

      <section className={styles.closing} id="release" aria-labelledby="closing-title">
        <div className={styles.closingMap} aria-hidden="true"><i /><i /><i /><i /><i /></div>
        <p className={styles.eyebrow}><i /> Build the proof before the launch</p>
        <h2 id="closing-title">Your release deserves more than a green button.</h2>
        <p>Open a workspace, define an authorized scope, and turn your next release into evidence the whole team can use.</p>
        <div className={styles.heroActions}>
          <Link href="/sign-up" className={styles.signalButton}>Register for BuildProof <ArrowRight size={16} /></Link>
          <Link href="/dashboard" className={styles.quietButton}>Open workspace</Link>
        </div>
      </section>

      <footer className={styles.siteFooter}>
        <Link href="/" className={styles.footerBrand}><Aperture size={16} /> BuildProof</Link>
        <span>Evidence-led release assurance.</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}

function FilmHeader({ elevated }: { elevated: boolean }) {
  return (
    <header className={`${styles.filmHeader} ${elevated ? styles.filmHeaderElevated : ""}`}>
      <Link href="/" className={styles.brand} aria-label="BuildProof home">
        <span className={styles.brandMark}><i /><i /><i /></span>
        <span className={styles.brandType}><b>BuildProof</b><small>The audit film · evidence-led release assurance</small></span>
      </Link>
      <nav className={styles.headerNav} aria-label="Landing page navigation">
        <a href="#overview">System</a>
        <a href="#audit-film">Inspection</a>
        <a href="#release">Verdict</a>
      </nav>
      <div className={styles.headerAuth}><MarketingAuthControls compact /></div>
    </header>
  );
}

function HeroInstrument() {
  return (
    <div className={styles.heroStage} role="img" aria-label="Illustrative application health instrument">
      <div className={`${styles.heroOrbit} ${styles.heroOrbitOne}`} />
      <div className={`${styles.heroOrbit} ${styles.heroOrbitTwo}`} />
      <div className={`${styles.heroOrbit} ${styles.heroOrbitThree}`} />
      <div className={styles.coreShell}>
        <div className={styles.coreGrid} />
        <div className={styles.coreAura} />
        <div className={styles.coreReading}><b>78</b><span>application<br />health</span></div>
      </div>
      <article className={`${styles.floatingReadout} ${styles.readoutOne}`}><span>evidence coverage</span><b>82%</b><i>corroborated scope</i></article>
      <article className={`${styles.floatingReadout} ${styles.readoutTwo}`}><span>critical journeys</span><b>12</b><i>priority paths</i></article>
      <article className={`${styles.floatingReadout} ${styles.readoutThree} ${styles.holdReadout}`}><span>release holds</span><b>03</b><i>need action</i></article>
      <div className={styles.heroTrace}><span /><i /><i /><i /><b>application → evidence → decision</b></div>
    </div>
  );
}

type FilmChapterProps = {
  chapter: CinematicChapter;
  activeBeatIndex: number;
  motionEnabled: boolean;
  registerRef: (node: HTMLElement | null) => void;
  onBeatSelect: (beatIndex: number) => void;
};

function FilmChapter({ chapter, activeBeatIndex, motionEnabled, registerRef, onBeatSelect }: FilmChapterProps) {
  const Icon = chapterIcons[chapter.id];
  const accentStyle = { "--chapter-accent": chapterAccents[chapter.id] } as CSSProperties;
  const activeBeat = chapter.beats[activeBeatIndex] ?? chapter.beats[0];

  return (
    <section
      id={chapter.id}
      className={`${styles.chapter} ${styles[`chapter${chapter.number}`]}`}
      ref={registerRef}
      style={accentStyle}
      aria-labelledby={`${chapter.id}-title`}
    >
      {motionEnabled ? (
        <div className={styles.chapterSticky}>
          <div className={styles.chapterTopline}>
            <span>Chapter {chapter.number}</span><i /><b>{chapter.title}</b><small>{chapter.agentIds.map((id) => `agent ${id}`).join(" · ")}</small>
          </div>
          <div className={styles.chapterGrid}>
            <div className={styles.narrativeColumn}>
              <div className={styles.chapterSeal}><Icon size={17} strokeWidth={1.45} /><span>Specialist sequence</span></div>
              <div className={styles.beatNarrative} key={activeBeat.id}>
                <p className={styles.eyebrow}><i /> {activeBeat.eyebrow}</p>
                <h2 id={`${chapter.id}-title`}>{activeBeat.title}</h2>
                <p>{activeBeat.body}</p>
                {activeBeat.transition ? <div className={styles.handoff}><span>{activeBeat.transition}</span><ArrowRight size={14} /></div> : null}
              </div>
              <BeatControls chapter={chapter} activeBeatIndex={activeBeatIndex} onBeatSelect={onBeatSelect} />
            </div>

            <CinematicVisual chapter={chapter} beat={activeBeat} beatIndex={activeBeatIndex} />

            <aside className={styles.evidencePanel}>
              <div className={styles.evidencePanelHead}>
                <span><TerminalSquare size={13} /> Evidence thread</span>
                <b>{String(activeBeatIndex + 1).padStart(2, "0")} / {String(chapter.beats.length).padStart(2, "0")}</b>
              </div>
              <p className={styles.evidenceMetric}>{activeBeat.metric}</p>
              <ul>
                {activeBeat.evidence.map((item) => <li key={item}><Check size={12} />{item}</li>)}
              </ul>
              <div className={styles.activeAgentCard}>
                <span>{activeBeat.agentIds.map((id) => `Agent ${id}`).join(" + ")}</span>
                <b>{agentNames(activeBeat.agentIds)}</b>
                <small>{chapter.id === "engineering-infrastructure" && activeBeat.agentIds.includes("08") ? "Prepared here; formally verified after Security Agent 07." : "This reading remains linked to the same authorized scope."}</small>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <StaticChapter chapter={chapter} icon={Icon} />
      )}
    </section>
  );
}

function BeatControls({ chapter, activeBeatIndex, onBeatSelect }: Pick<FilmChapterProps, "chapter" | "activeBeatIndex" | "onBeatSelect">) {
  return (
    <div className={styles.beatControls} aria-label={`${chapter.title} story moments`}>
      <span>Story {String(activeBeatIndex + 1).padStart(2, "0")}</span>
      <div>
        {chapter.beats.map((beat, index) => (
          <button
            key={beat.id}
            type="button"
            onClick={() => onBeatSelect(index)}
            aria-label={`Go to story moment ${index + 1}: ${beat.title}`}
            aria-current={index === activeBeatIndex ? "step" : undefined}
            className={index === activeBeatIndex ? styles.beatControlActive : ""}
          />
        ))}
      </div>
      <button className={styles.replayButton} type="button" onClick={() => onBeatSelect(0)}><Play size={10} fill="currentColor" /> Replay</button>
    </div>
  );
}

function StaticChapter({ chapter, icon: Icon }: { chapter: CinematicChapter; icon: LucideIcon }) {
  return (
    <div className={styles.staticChapter}>
      <div className={styles.staticChapterHeading}>
        <div className={styles.chapterSeal}><Icon size={17} strokeWidth={1.45} /><span>Chapter {chapter.number}</span></div>
        <p className={styles.eyebrow}><i /> {chapter.title}</p>
        <h2 id={`${chapter.id}-title`}>{chapter.shortTitle}</h2>
        <p>{chapter.summary}</p>
      </div>
      <CinematicVisual chapter={chapter} beat={chapter.beats[0]} beatIndex={0} />
      <div className={styles.staticBeatStack}>
        {chapter.beats.map((beat, index) => (
          <article key={beat.id}>
            <span>{String(index + 1).padStart(2, "0")} / {beat.eyebrow}</span>
            <h3>{beat.title}</h3>
            <p>{beat.body}</p>
            <b>{beat.metric}</b>
            <ul>{beat.evidence.map((item) => <li key={item}><Check size={12} />{item}</li>)}</ul>
          </article>
        ))}
      </div>
    </div>
  );
}

function CinematicVisual({ chapter, beat, beatIndex }: { chapter: CinematicChapter; beat: CinematicBeat; beatIndex: number }) {
  const visualStyle = { "--beat-index": beatIndex } as CSSProperties;

  return (
    <div className={styles.visualColumn} style={visualStyle} data-scene={chapter.id} data-beat={beatIndex}>
      <div className={styles.visualCaption}><span>{chapter.number} / Live reading</span><b>{beat.metric}</b></div>
      {chapter.id === "product-intelligence" ? <ProductVisual beatIndex={beatIndex} /> : null}
      {chapter.id === "experience-quality" ? <ExperienceVisual beatIndex={beatIndex} /> : null}
      {chapter.id === "engineering-infrastructure" ? <EngineeringVisual beatIndex={beatIndex} /> : null}
      {chapter.id === "security-reliability" ? <SecurityVisual beatIndex={beatIndex} /> : null}
      {chapter.id === "ai-launch-readiness" ? <LaunchVisual beatIndex={beatIndex} /> : null}
      <div className={styles.visualStatus}><span /><b>{beat.agentIds.map((id) => `agent ${id}`).join(" + ")}</b><i>{beatIndex === 0 ? "signal acquired" : "evidence correlating"}</i></div>
    </div>
  );
}

function ProductVisual({ beatIndex }: { beatIndex: number }) {
  return (
    <div className={`${styles.sceneVisual} ${styles.productVisual}`} data-beat={beatIndex} aria-label="Illustrative product topology">
      <div className={`${styles.mapHalo} ${styles.mapHaloOne}`} /><div className={`${styles.mapHalo} ${styles.mapHaloTwo}`} />
      <svg className={styles.mapLinks} viewBox="0 0 800 470" aria-hidden="true"><path d="M125 137C225 89 274 142 371 207S523 156 669 128M125 137C192 252 289 296 398 261S555 283 669 340M238 362C329 339 367 307 433 235S588 214 669 128M238 362C356 419 498 397 584 349S630 344 669 340" /><circle cx="259" cy="124" r="4" /><circle cx="495" cy="184" r="4" /><circle cx="345" cy="282" r="4" /></svg>
      <article className={`${styles.mapNode} ${styles.nodeSignin}`}><span>01</span><b>Sign in</b><small>role boundary</small></article>
      <article className={`${styles.mapNode} ${styles.nodeWorkspace}`}><span>02</span><b>Workspace</b><small>core surface</small></article>
      <article className={`${styles.mapNode} ${styles.nodeInvite}`}><span>03</span><b>Invite</b><small>critical flow</small></article>
      <article className={`${styles.mapNode} ${styles.nodeApi}`}><span>04</span><b>API</b><small>service edge</small></article>
      <article className={`${styles.mapNode} ${styles.nodeData}`}><span>05</span><b>Data</b><small>trust boundary</small></article>
      <div className={styles.mapReading}><span>184</span><b>mapped surfaces</b><small>{beatIndex === 0 ? "scope entering" : beatIndex === 1 ? "journeys prioritised" : "brief handed off"}</small></div>
    </div>
  );
}

function ExperienceVisual({ beatIndex }: { beatIndex: number }) {
  return (
    <div className={`${styles.sceneVisual} ${styles.experienceVisual}`} data-beat={beatIndex} aria-label="Illustrative browser journey evidence">
      <article className={`${styles.paperCard} ${styles.paperOne}`}><span>UX REVIEW</span><b>{beatIndex === 0 ? "Does the task explain itself?" : "Can a person recover?"}</b><i>labels · focus · hierarchy</i></article>
      <article className={styles.browserCard}>
        <header><i /><i /><i /><span>staging.payscope.app/workspace/invite</span></header>
        <div className={styles.browserBody}><div className={styles.browserNav}><i /><i /><i /></div><div className={styles.browserPanel}><small>Invite a teammate</small><b>maria@acme.com</b><span>Role: member</span><button type="button">Send invitation</button></div><div className={styles.browserCursor} /><em>{beatIndex === 0 ? "focus state observed" : beatIndex === 1 ? "retry state replayed" : "request linked to outcome"}</em></div>
      </article>
      <article className={`${styles.paperCard} ${styles.paperTwo}`}><span>FUNCTIONAL QA</span><b>{beatIndex === 2 ? "Where did the request land?" : "Can the flow recover after retry?"}</b><i>state · request · outcome</i></article>
      <div className={styles.journeyRibbon}><i /><span>sign in</span><b>→</b><span>invite</span><b>→</b><span>accept</span><b>→</b><span>workspace</span></div>
    </div>
  );
}

function EngineeringVisual({ beatIndex }: { beatIndex: number }) {
  const activeLabel = ["browser trace", "service topology", "data path", "release operation"][beatIndex] ?? "runtime trace";
  return (
    <div className={`${styles.sceneVisual} ${styles.engineeringVisual}`} data-beat={beatIndex} aria-label="Illustrative runtime and service topology">
      <div className={`${styles.systemLevel} ${styles.levelBrowser}`}><Globe2 size={16} /><span>Browser</span><i>interaction</i></div>
      <div className={`${styles.systemLevel} ${styles.levelApi}`}><Braces size={16} /><span>API</span><i>request</i></div>
      <div className={`${styles.systemLevel} ${styles.levelWorker}`}><Cloud size={16} /><span>Worker</span><i>queue</i></div>
      <div className={`${styles.systemLevel} ${styles.levelDatabase}`}><Database size={16} /><span>Database</span><i>persist</i></div>
      <svg className={styles.systemLinks} viewBox="0 0 450 580" aria-hidden="true"><path d="M225 74 C315 126 136 154 225 226 S316 315 225 372 S135 447 225 511" /><circle cx="225" cy="74" r="4" /><circle cx="225" cy="226" r="4" /><circle cx="225" cy="372" r="4" /><circle cx="225" cy="511" r="4" /></svg>
      <span className={`${styles.requestParticle} ${styles.particleOne}`} /><span className={`${styles.requestParticle} ${styles.particleTwo}`} /><span className={`${styles.requestParticle} ${styles.particleThree}`} />
      <div className={styles.systemReading}><Activity size={16} /><span>{activeLabel}</span><b>{beatIndex === 0 ? "p75 2.8s" : beatIndex === 1 ? "31 API paths" : beatIndex === 2 ? "8 / 9 paths" : "rollback mapped"}</b><small>{beatIndex === 0 ? "browser → service" : beatIndex === 1 ? "source ↔ runtime" : beatIndex === 2 ? "query → retention" : "build → observe"}</small></div>
    </div>
  );
}

function SecurityVisual({ beatIndex }: { beatIndex: number }) {
  return (
    <div className={`${styles.sceneVisual} ${styles.securityVisual}`} data-beat={beatIndex} aria-label="Illustrative security and reliability assessment">
      <div className={`${styles.trustRing} ${styles.ringOne}`} /><div className={`${styles.trustRing} ${styles.ringTwo}`} /><div className={`${styles.trustRing} ${styles.ringThree}`} />
      <div className={styles.accessCore}><LockKeyhole size={20} /><span>{beatIndex === 2 ? "delivery proof" : "access boundary"}</span><b>{beatIndex === 1 ? "01" : "07"}</b><small>{beatIndex === 1 ? "hold needs owner" : "checks linked"}</small></div>
      <div className={styles.accessSheet}><header><span>ROLE</span><span>CAPABILITY</span><span>RESULT</span></header><div><b>Member</b><span>Invite team</span><i>observed</i></div><div><b>Viewer</b><span>Export data</span><i className={styles.holdText}>review</i></div><div><b>Operator</b><span>Deploy approval</span><i>{beatIndex === 2 ? "verified" : "gated"}</i></div></div>
      <p className={styles.trustCaption}>{beatIndex === 2 ? "CI → ENVIRONMENT → ROLLBACK" : "IDENTITY → ACTION → DATA"}</p>
    </div>
  );
}

function LaunchVisual({ beatIndex }: { beatIndex: number }) {
  return (
    <div className={`${styles.sceneVisual} ${styles.launchVisual}`} data-beat={beatIndex} aria-label="Illustrative final release report">
      <article className={`${styles.verdictSheet} ${styles.sheetBack}`}><span>{beatIndex === 0 ? "AI EVALUATION" : "EXPERIENCE EVIDENCE"}</span><b>{beatIndex === 0 ? "Conditional layer" : "Journey replay"}</b><i>coverage stated</i></article>
      <article className={`${styles.verdictSheet} ${styles.sheetMiddle}`}><span>ENGINEERING EVIDENCE</span><b>{beatIndex === 2 ? "Release condition" : "Runtime + data path"}</b><i>owner assigned</i></article>
      <article className={`${styles.verdictSheet} ${styles.sheetFront}`}><header><span>Release passport</span><b>{beatIndex === 2 ? "conditional" : "assembling"}</b></header><div className={styles.verdictScore}><strong>{beatIndex === 2 ? "78" : "82"}</strong><small>application<br />health</small></div><div className={styles.verdictSummary}><span>{beatIndex === 2 ? "3 HOLDS / 5 OWNERS" : "EVIDENCE CONVERGING"}</span><h3>{beatIndex === 2 ? "Conditional release" : "One release view"}</h3><p>{beatIndex === 2 ? "Resolve, re-check, then decide." : "Signals grouped by consequence."}</p></div><footer><span>Evidence retained</span><span>CTO report</span></footer></article>
      <div className={styles.verdictConvergence}><span>product</span><i /><span>engineering</span><i /><span>security</span></div>
    </div>
  );
}

function AgentRail({ activeAgentId, preparedDevOps, onAgentClick }: { activeAgentId: AgentId; preparedDevOps: boolean; onAgentClick: (agentId: AgentId) => void }) {
  const activeIndex = allAgents.findIndex((agent) => agent.id === activeAgentId);
  return (
    <aside className={styles.agentRail} aria-label="Specialist agent execution order">
      <div className={styles.railHead}><span>Live trace</span><b>{activeAgentId}</b></div>
      <div className={styles.railLine}><i style={{ height: `${Math.max(8, ((activeIndex + 1) / allAgents.length) * 100)}%` }} /></div>
      <ol>
        {allAgents.map((agent, index) => {
          const isActive = agent.id === activeAgentId;
          const isDone = index < activeIndex;
          const isPrepared = preparedDevOps && agent.id === "08";
          return <li key={agent.id}><button className={`${isDone ? styles.railDone : ""} ${isActive ? styles.railActive : ""} ${isPrepared ? styles.railPrepared : ""}`} type="button" onClick={() => onAgentClick(agent.id)} aria-label={`${agent.id} ${agent.displayLabel}`} title={`${agent.id} ${agent.displayLabel}`} aria-current={isActive ? "step" : undefined}><span>{agent.id}</span><i /></button></li>;
        })}
      </ol>
      <p>01 → 10<br /><span>execution order</span></p>
    </aside>
  );
}

function executionAgentFor(chapterId: FilmChapterId, agentIds: readonly AgentId[]): AgentId {
  const candidate = agentIds[agentIds.length - 1] ?? "01";
  // DevOps prepares the operation in Engineering; its numbered execution remains after the security gate.
  return chapterId === "engineering-infrastructure" && candidate === "08" ? "06" : candidate;
}

function agentNames(ids: readonly AgentId[]) {
  return ids
    .map((id) => allAgents.find((agent) => agent.id === id)?.displayLabel ?? `Agent ${id}`)
    .join(" · ");
}

function findAgentDestination(agentId: AgentId) {
  for (const chapter of cinematicChapters) {
    const beatIndex = chapter.beats.findIndex((beat) => beat.agentIds.includes(agentId));
    if (beatIndex >= 0) return { chapterId: chapter.id, beatIndex };
  }
  return { chapterId: "product-intelligence" as FilmChapterId, beatIndex: 0 };
}
