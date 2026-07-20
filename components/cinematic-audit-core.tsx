"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, PresentationControls, RoundedBox } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CircleCheck,
  CloudCog,
  GitBranch,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

type AuditCategoryId = "experience" | "engineering" | "security";

type AuditCategory = {
  id: AuditCategoryId;
  index: string;
  title: string;
  shortTitle: string;
  summary: string;
  stageLine: string;
  score: number;
  scoreLabel: string;
  agents: string[];
  metrics: Array<{ label: string; value: string }>;
  evidence: string;
  icon: LucideIcon;
};

const categories: AuditCategory[] = [
  {
    id: "experience",
    index: "01",
    title: "Application Experience & Quality",
    shortTitle: "Experience",
    summary:
      "Observe the product as a customer does: journeys, interactions, accessibility, and the small failures that make a polished interface feel unreliable.",
    stageLine: "Mapping the promise to real browser behavior",
    score: 86,
    scoreLabel: "journey confidence",
    agents: ["Journey explorer", "Functional QA", "Accessibility reader", "Frontend observer"],
    metrics: [
      { label: "Critical journeys", value: "12 traced" },
      { label: "Interaction checks", value: "184 observed" },
      { label: "Accessibility", value: "2 reviews" },
    ],
    evidence: "Login → workspace invite → confirmation state",
    icon: MousePointer2,
  },
  {
    id: "engineering",
    index: "02",
    title: "Engineering Performance & Infrastructure",
    shortTitle: "Engineering",
    summary:
      "Follow every visible interaction through APIs, data, infrastructure, and delivery systems to expose bottlenecks before they become production incidents.",
    stageLine: "Correlating browser signals with systems context",
    score: 78,
    scoreLabel: "systems readiness",
    agents: ["Performance engineer", "API cartographer", "Cloud reviewer", "Data path analyst"],
    metrics: [
      { label: "API paths", value: "31 correlated" },
      { label: "Runtime signals", value: "7 captured" },
      { label: "Delivery checks", value: "4 ready" },
    ],
    evidence: "POST /invites → queue → tenant database → mail provider",
    icon: CloudCog,
  },
  {
    id: "security",
    index: "03",
    title: "Security & Reliability Intelligence",
    shortTitle: "Security",
    summary:
      "Run authorized baseline checks for exposure, identity, and data-protection risk—then explain every signal in language a release team can act on.",
    stageLine: "Measuring exposure inside an approved boundary",
    score: 91,
    scoreLabel: "baseline confidence",
    agents: ["Auth boundary reviewer", "Exposure analyst", "Data protection reader", "Reliability sentinel"],
    metrics: [
      { label: "Auth boundaries", value: "8 verified" },
      { label: "Data surfaces", value: "14 reviewed" },
      { label: "Open signals", value: "1 caution" },
    ],
    evidence: "Session renewal → protected route → policy boundary",
    icon: ShieldCheck,
  },
];

type CinematicAuditCoreProps = {
  className?: string;
};

/**
 * A self-contained, progressively enhanced audit story for the landing page.
 *
 * The text chapters always exist in the document. WebGL only replaces the
 * decorative core on capable desktop devices; reduced-motion, small-screen,
 * and WebGL-unavailable visitors receive a CSS model with the same controls.
 */
export function CinematicAuditCore({ className }: CinematicAuditCoreProps) {
  const prefersReducedMotion = useReducedMotion();
  const [webglEnabled, setWebglEnabled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const chapterVisibility = useRef(new Map<number, number>());

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 980px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateCapability = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setWebglEnabled(Boolean(context) && desktop.matches && !reducedMotion.matches);
    };

    updateCapability();
    desktop.addEventListener("change", updateCapability);
    reducedMotion.addEventListener("change", updateCapability);

    return () => {
      desktop.removeEventListener("change", updateCapability);
      reducedMotion.removeEventListener("change", updateCapability);
    };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.auditIndex);
          if (Number.isFinite(index)) chapterVisibility.current.set(index, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let mostVisibleIndex: number | undefined;
        let largestRatio = 0;
        chapterVisibility.current.forEach((ratio, index) => {
          if (ratio > largestRatio) {
            largestRatio = ratio;
            mostVisibleIndex = index;
          }
        });

        if (mostVisibleIndex !== undefined) setActiveIndex(mostVisibleIndex);
      },
      { rootMargin: "-24% 0px -31% 0px", threshold: [0.18, 0.4, 0.66] },
    );

    chapterRefs.current.forEach((chapter) => {
      if (chapter) observer.observe(chapter);
    });

    return () => observer.disconnect();
  }, []);

  const active = categories[activeIndex] ?? categories[0];
  const animationDuration = prefersReducedMotion ? 0 : 0.42;

  const selectCategory = (index: number) => {
    setActiveIndex(index);
    chapterRefs.current[index]?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <section
      id="expert-team"
      className={cn("cinematic-audit-core", `cinematic-audit-core--${active.id}`, className)}
      data-reduced-motion={prefersReducedMotion ? "true" : "false"}
      aria-labelledby="cinematic-audit-core-title"
    >
      <style>{cinematicAuditCoreStyles}</style>

      <header className="cac__intro">
        <span className="cac__eyebrow"><span /> One application · one intelligible audit</span>
        <div>
          <h2 id="cinematic-audit-core-title">An expert team, assembled around the product your users actually touch.</h2>
          <p>
            BuildProof turns a complicated release surface into three clear readings. Each one contains specialist agents, but the decision stays human-readable.
          </p>
        </div>
      </header>

      <div className="cac__journey">
        <div className="cac__stage-column">
          <div className="cac__stage" aria-label="Interactive audit core">
            <div className="cac__stage-grid" aria-hidden="true" />
            <div className="cac__stage-aura" aria-hidden="true" />

            {webglEnabled ? (
              <div className="cac__canvas" aria-hidden="true">
                <Canvas
                  camera={{ position: [0, 0.1, 6.8], fov: 35 }}
                  dpr={[1, 1.5]}
                  gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
                >
                  <AuditCoreScene activeIndex={activeIndex} onCategorySelect={selectCategory} reduceMotion={Boolean(prefersReducedMotion)} />
                </Canvas>
              </div>
            ) : (
              <CssAuditCore active={active} />
            )}

            <div className="cac__source-readout" aria-hidden="true">
              <span><GitBranch size={12} /> Application intake</span>
              <strong>app.acme.dev</strong>
              <small>Repository + preview mapped</small>
            </div>

            <div className="cac__stage-status" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 14, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={prefersReducedMotion ? {} : { opacity: 0, y: -8, filter: "blur(4px)" }}
                  transition={{ duration: animationDuration, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="cac__stage-status-label">Now reading · {active.index}</span>
                  <strong>{active.shortTitle}</strong>
                  <p>{active.stageLine}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="cac__core-readout" aria-hidden="true">
              <span>Audit core</span>
              <strong>{active.score}</strong>
              <small>{active.scoreLabel}</small>
            </div>

            <div className="cac__stage-hint" aria-hidden="true">
              <MoveCursorIcon /> Drag the model · select a discipline
            </div>
          </div>

          <div className="cac__controls" role="group" aria-label="Explore audit disciplines">
            {categories.map((category, index) => {
              const Icon = category.icon;
              const isActive = activeIndex === index;

              return (
                <motion.button
                  key={category.id}
                  type="button"
                  className={cn("cac__control", `cac__control--${category.id}`, isActive && "cac__control--active")}
                  aria-pressed={isActive}
                  onClick={() => selectCategory(index)}
                  whileHover={prefersReducedMotion ? undefined : { y: -3 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                >
                  <span className="cac__control-icon"><Icon size={15} /></span>
                  <span className="cac__control-copy"><small>{category.index}</small><strong>{category.shortTitle}</strong></span>
                  <span className="cac__control-score">{category.score}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="cac__chapters" aria-label="The three audit disciplines">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const isActive = activeIndex === index;

            return (
              <article
                className={cn("cac__chapter", `cac__chapter--${category.id}`, isActive && "cac__chapter--active")}
                data-audit-index={index}
                id={`audit-discipline-${category.id}`}
                key={category.id}
                ref={(node) => {
                  chapterRefs.current[index] = node;
                }}
                aria-labelledby={`audit-discipline-${category.id}-title`}
              >
                <div className="cac__chapter-heading">
                  <span className="cac__chapter-index">{category.index}</span>
                  <span className="cac__chapter-icon"><Icon size={18} /></span>
                  <span className="cac__chapter-state"><span /> {isActive ? "In focus" : "Ready"}</span>
                </div>
                <h3 id={`audit-discipline-${category.id}-title`}>{category.title}</h3>
                <p className="cac__chapter-summary">{category.summary}</p>

                <div className="cac__agent-list" aria-label={`${category.title} specialist agents`}>
                  <span>Specialist agents</span>
                  <ul>
                    {category.agents.map((agent) => <li key={agent}><CircleCheck size={13} /> {agent}</li>)}
                  </ul>
                </div>

                <div className="cac__metrics" aria-label={`${category.title} sample audit data`}>
                  {category.metrics.map((metric) => (
                    <div key={metric.label}>
                      <span>{metric.label}</span>
                      <strong>{metric.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="cac__evidence">
                  <span><Sparkles size={13} /> Evidence thread</span>
                  <strong>{category.evidence}</strong>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <noscript>
        <p className="cac__noscript">BuildProof organizes audit evidence into Experience, Engineering, and Security readings.</p>
      </noscript>
    </section>
  );
}

function CssAuditCore({ active }: { active: AuditCategory }) {
  return (
    <div className={cn("cac__fallback", `cac__fallback--${active.id}`)} aria-hidden="true">
      <div className="cac__fallback-app">
        <span /><span /><span />
        <i /><i /><i />
      </div>
      <div className="cac__fallback-gate cac__fallback-gate--one" />
      <div className="cac__fallback-gate cac__fallback-gate--two" />
      <div className="cac__fallback-core"><span /><span /><span /></div>
      <div className="cac__fallback-layer cac__fallback-layer--one" />
      <div className="cac__fallback-layer cac__fallback-layer--two" />
      <div className="cac__fallback-layer cac__fallback-layer--three" />
    </div>
  );
}

function AuditCoreScene({
  activeIndex,
  onCategorySelect,
  reduceMotion,
}: {
  activeIndex: number;
  onCategorySelect: (index: number) => void;
  reduceMotion: boolean;
}) {
  const active = categories[activeIndex] ?? categories[0];

  return (
    <>
      <ambientLight intensity={0.82} />
      <pointLight position={[-4.1, 3.8, 4.7]} intensity={16} color="#c8f5ff" />
      <pointLight position={[3.4, -3.1, 3.6]} intensity={8} color={accentFor(active.id)} />
      <PresentationControls
        global={false}
        cursor
        snap={!reduceMotion}
        speed={0.95}
        zoom={0.7}
        polar={[-0.23, 0.25]}
        azimuth={[-0.36, 0.36]}
      >
        <Float speed={reduceMotion ? 0 : 1.02} rotationIntensity={reduceMotion ? 0 : 0.1} floatIntensity={reduceMotion ? 0 : 0.15}>
          <AuditEngine active={active} reduceMotion={reduceMotion} />
          <CategorySelectors activeIndex={activeIndex} onCategorySelect={onCategorySelect} />
        </Float>
      </PresentationControls>
    </>
  );
}

function AuditEngine({ active, reduceMotion }: { active: AuditCategory; reduceMotion: boolean }) {
  const appRef = useRef<THREE.Group>(null);
  const orbitRef = useRef<THREE.Group>(null);
  const targetAccent = accentFor(active.id);

  useFrame((state, delta) => {
    if (appRef.current) {
      appRef.current.position.x = THREE.MathUtils.damp(appRef.current.position.x, -0.78, 1.28, delta);
      appRef.current.rotation.y = THREE.MathUtils.damp(appRef.current.rotation.y, -0.23, 1.35, delta);
    }

    if (!reduceMotion && orbitRef.current) {
      orbitRef.current.rotation.z += delta * 0.11;
      orbitRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.55) * 0.09;
    }
  });

  return (
    <group>
      <group ref={orbitRef} position={[0.32, 0, -0.12]} rotation={[0.82, -0.22, -0.2]}>
        <mesh>
          <torusGeometry args={[1.56, 0.014, 10, 96]} />
          <meshBasicMaterial color="#9FE8FF" transparent opacity={0.34} />
        </mesh>
        <mesh rotation={[0.62, -0.11, 1.28]}>
          <torusGeometry args={[1.86, 0.008, 10, 96]} />
          <meshBasicMaterial color={targetAccent} transparent opacity={0.31} />
        </mesh>
      </group>

      <group ref={appRef} position={[-3.18, 0.1, 0.34]} rotation={[0.02, -0.56, 0.02]}>
        <RoundedBox args={[1.55, 1.12, 0.15]} radius={0.11} smoothness={5}>
          <meshPhysicalMaterial color="#20313D" metalness={0.36} roughness={0.23} transparent opacity={0.94} />
        </RoundedBox>
        <RoundedBox args={[1.34, 0.86, 0.045]} radius={0.07} smoothness={4} position={[0, -0.04, 0.1]}>
          <meshPhysicalMaterial color="#587184" metalness={0.12} roughness={0.25} transparent opacity={0.42} />
        </RoundedBox>
        <mesh position={[-0.49, 0.23, 0.14]}><planeGeometry args={[0.3, 0.07]} /><meshBasicMaterial color="#DDF9FF" transparent opacity={0.7} /></mesh>
        <mesh position={[0.12, 0.23, 0.14]}><planeGeometry args={[0.51, 0.07]} /><meshBasicMaterial color="#DDF9FF" transparent opacity={0.27} /></mesh>
        <mesh position={[-0.38, -0.04, 0.14]}><planeGeometry args={[0.52, 0.25]} /><meshBasicMaterial color="#9FE8FF" transparent opacity={0.16} /></mesh>
        <mesh position={[0.31, -0.04, 0.14]}><planeGeometry args={[0.3, 0.25]} /><meshBasicMaterial color="#DDF9FF" transparent opacity={0.1} /></mesh>
        <mesh position={[0, -0.42, 0.14]}><planeGeometry args={[0.95, 0.06]} /><meshBasicMaterial color="#DDF9FF" transparent opacity={0.23} /></mesh>
      </group>

      <group position={[-0.06, 0.05, 0.06]}>
        <RoundedBox args={[1.74, 1.54, 0.12]} radius={0.16} smoothness={5}>
          <meshPhysicalMaterial color="#17232C" metalness={0.34} roughness={0.2} transparent opacity={0.84} />
        </RoundedBox>
        <RoundedBox args={[1.43, 1.23, 0.045]} radius={0.12} smoothness={5} position={[0, 0, 0.09]}>
          <meshPhysicalMaterial color="#36515F" metalness={0.12} roughness={0.18} transparent opacity={0.22} />
        </RoundedBox>
        <mesh position={[0, -0.48, 0.12]} scale={[0.96, 1, 1]}>
          <boxGeometry args={[1.08, 0.04, 0.03]} />
          <meshBasicMaterial color={targetAccent} transparent opacity={0.83} />
        </mesh>
        <mesh position={[-0.55, -0.48, 0.14]}><sphereGeometry args={[0.045, 18, 18]} /><meshBasicMaterial color="#E7ECF2" /></mesh>
      </group>

      <CategoryGlyph category={active} reduceMotion={reduceMotion} />
    </group>
  );
}

function CategorySelectors({ activeIndex, onCategorySelect }: { activeIndex: number; onCategorySelect: (index: number) => void }) {
  const positions: Array<[number, number, number]> = [[1.68, 0.86, 0.33], [1.87, 0, 0.12], [1.63, -0.9, 0.29]];

  return (
    <group>
      {categories.map((category, index) => {
        const active = activeIndex === index;
        const accent = accentFor(category.id);

        return (
          <group
            key={category.id}
            position={positions[index]}
            rotation={[0.03, -0.32, 0.07]}
            onClick={(event) => {
              event.stopPropagation();
              onCategorySelect(index);
            }}
          >
            <RoundedBox args={[0.92, 0.28, 0.11]} radius={0.07} smoothness={4}>
              <meshPhysicalMaterial
                color={accent}
                metalness={0.2}
                roughness={0.29}
                transparent
                opacity={active ? 0.76 : 0.26}
                emissive={accent}
                emissiveIntensity={active ? 0.2 : 0.035}
              />
            </RoundedBox>
            <mesh position={[-0.32, 0, 0.085]}>
              <sphereGeometry args={[active ? 0.052 : 0.035, 16, 16]} />
              <meshBasicMaterial color={accent} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CategoryGlyph({ category, reduceMotion }: { category: AuditCategory; reduceMotion: boolean }) {
  const glyphRef = useRef<THREE.Group>(null);
  const accent = accentFor(category.id);

  useFrame((_state, delta) => {
    if (!reduceMotion && glyphRef.current) glyphRef.current.rotation.z += delta * 0.24;
  });

  if (category.id === "experience") {
    return (
      <group ref={glyphRef} position={[0.28, 0.08, 0.33]} rotation={[0.06, 0.04, 0]}>
        {[[0.46, 0.42], [-0.46, 0.42], [0.46, -0.42], [-0.46, -0.42]].map(([x, y]) => (
          <RoundedBox key={`${x}-${y}`} args={[0.32, 0.22, 0.035]} radius={0.04} smoothness={3} position={[x, y, 0]}>
            <meshBasicMaterial color={accent} transparent opacity={0.43} />
          </RoundedBox>
        ))}
        <mesh position={[0, 0, 0.02]}><ringGeometry args={[0.42, 0.445, 48]} /><meshBasicMaterial color="#EAFBFF" transparent opacity={0.58} side={THREE.DoubleSide} /></mesh>
      </group>
    );
  }

  if (category.id === "engineering") {
    const points: Array<[number, number, number]> = [[-0.55, 0.38, 0], [0.02, 0, 0], [0.62, 0.34, 0], [0.45, -0.5, 0], [-0.48, -0.36, 0], [0.02, 0, 0]];

    return (
      <group ref={glyphRef} position={[0.28, 0.05, 0.35]} rotation={[0.06, 0.04, 0]}>
        <Line points={points} color={accent} transparent opacity={0.66} lineWidth={1.1} />
        {points.slice(0, -1).map(([x, y], index) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.04]}>
            <sphereGeometry args={[index === 1 ? 0.105 : 0.065, 18, 18]} />
            <meshBasicMaterial color={index === 1 ? "#EAFBFF" : accent} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group ref={glyphRef} position={[0.28, 0.05, 0.35]} rotation={[0.07, 0.03, 0]}>
      <mesh>
        <octahedronGeometry args={[0.57, 0]} />
        <meshPhysicalMaterial color={accent} metalness={0.12} roughness={0.23} transparent opacity={0.2} emissive={accent} emissiveIntensity={0.08} />
      </mesh>
      <mesh rotation={[0.57, 0.2, 0]}><torusGeometry args={[0.66, 0.016, 10, 64]} /><meshBasicMaterial color={accent} transparent opacity={0.72} /></mesh>
      <mesh rotation={[-0.62, 0.35, 0.5]}><torusGeometry args={[0.78, 0.009, 10, 64]} /><meshBasicMaterial color="#EAFBFF" transparent opacity={0.35} /></mesh>
      <mesh><sphereGeometry args={[0.1, 18, 18]} /><meshBasicMaterial color="#F5FCFF" /></mesh>
    </group>
  );
}

function MoveCursorIcon() {
  return <MousePointer2 size={12} strokeWidth={1.55} />;
}

function accentFor(id: AuditCategoryId) {
  if (id === "engineering") return "#D9A15B";
  if (id === "security") return "#F87171";
  return "#9FE8FF";
}

const cinematicAuditCoreStyles = `
.cinematic-audit-core {
  --cac-accent: #9fe8ff;
  --cac-accent-rgb: 159, 232, 255;
  position: relative;
  width: min(1350px, calc(100% - 48px));
  margin: 154px auto 0;
  color: #e7ecf2;
}
.cinematic-audit-core--engineering { --cac-accent: #d9a15b; --cac-accent-rgb: 217, 161, 91; }
.cinematic-audit-core--security { --cac-accent: #f87171; --cac-accent-rgb: 248, 113, 113; }
.cac__intro { display: grid; grid-template-columns: minmax(180px, .36fr) minmax(0, 1fr); gap: 44px; align-items: start; max-width: 1090px; margin: 0 0 76px; }
.cac__eyebrow { display: inline-flex; align-items: center; gap: 9px; padding-top: 10px; color: #97a3b0; font-size: 10px; font-weight: 680; letter-spacing: .115em; line-height: 1.35; text-transform: uppercase; }
.cac__eyebrow > span { width: 7px; height: 7px; border-radius: 50%; background: #9fe8ff; box-shadow: 0 0 0 4px rgba(159,232,255,.11), 0 0 17px rgba(159,232,255,.56); }
.cac__intro h2 { max-width: 740px; margin: 0; color: #e7ecf2; font-size: clamp(35px, 4vw, 61px); font-weight: 530; letter-spacing: -.068em; line-height: .99; }
.cac__intro p { max-width: 640px; margin: 20px 0 0; color: #9da8b5; font-size: 14px; line-height: 1.62; }
.cac__journey { display: grid; grid-template-columns: minmax(480px, 1.08fr) minmax(340px, .68fr); gap: clamp(50px, 8vw, 126px); align-items: start; }
.cac__stage-column { position: sticky; top: 88px; height: min(698px, calc(100vh - 112px)); min-height: 570px; }
.cac__stage { position: relative; height: calc(100% - 77px); min-height: 490px; overflow: hidden; isolation: isolate; border: 1px solid rgba(255,255,255,.16); border-radius: 27px; background: radial-gradient(circle at 47% 45%, rgba(var(--cac-accent-rgb),.16), transparent 23%), radial-gradient(circle at 79% 12%, rgba(255,255,255,.09), transparent 29%), linear-gradient(140deg, rgba(27,36,44,.78), rgba(9,13,18,.75) 67%, rgba(12,14,19,.93)); box-shadow: inset 0 1px 0 rgba(255,255,255,.2), inset 0 -34px 70px rgba(0,0,0,.25), 0 42px 100px rgba(0,0,0,.26); }
.cac__stage::before { position: absolute; z-index: 0; inset: 0; pointer-events: none; content: ""; opacity: .55; background: linear-gradient(114deg, transparent 34%, rgba(255,255,255,.12) 48%, transparent 56%); transform: translateX(-55%) skewX(-13deg); animation: cac-sheen 10s ease-in-out infinite; }
.cac__stage::after { position: absolute; z-index: 0; right: -13%; bottom: -34%; width: 62%; height: 63%; pointer-events: none; border: 1px solid rgba(var(--cac-accent-rgb),.24); border-radius: 50%; content: ""; filter: blur(.1px); transform: rotate(-15deg); }
.cac__stage-grid { position: absolute; z-index: 0; inset: 0; pointer-events: none; opacity: .34; background-image: linear-gradient(rgba(255,255,255,.036) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.026) 1px, transparent 1px); background-size: 31px 31px; mask-image: radial-gradient(circle at 52% 48%, black, transparent 76%); }
.cac__stage-aura { position: absolute; z-index: 0; top: 15%; left: 26%; width: 52%; height: 67%; pointer-events: none; border-radius: 50%; opacity: .78; background: radial-gradient(ellipse, rgba(var(--cac-accent-rgb),.17), rgba(159,232,255,.06) 35%, transparent 71%); filter: blur(18px); transition: background 420ms ease; }
.cac__canvas { position: absolute; z-index: 1; inset: 0; cursor: grab; }
.cac__canvas:active { cursor: grabbing; }
.cac__canvas canvas { display: block; width: 100% !important; height: 100% !important; }
.cac__source-readout { position: absolute; z-index: 3; top: 18px; left: 18px; display: grid; gap: 3px; min-width: 152px; padding: 10px 11px; border: 1px solid rgba(255,255,255,.12); border-radius: 11px; background: rgba(6,10,14,.47); box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 10px 24px rgba(0,0,0,.14); backdrop-filter: blur(13px); }
.cac__source-readout > span { display: inline-flex; align-items: center; gap: 5px; color: #8c98a6; font-size: 8px; font-weight: 690; letter-spacing: .09em; text-transform: uppercase; }
.cac__source-readout > span svg { color: #9fe8ff; }
.cac__source-readout strong { color: #e5edf4; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; font-weight: 560; }
.cac__source-readout small { color: #707d8b; font-size: 8px; }
.cac__stage-status { position: absolute; z-index: 3; right: 18px; bottom: 21px; width: min(220px, 42%); text-align: right; }
.cac__stage-status > div { display: grid; justify-items: end; gap: 5px; }
.cac__stage-status-label { color: var(--cac-accent); font-size: 8px; font-weight: 720; letter-spacing: .12em; text-transform: uppercase; }
.cac__stage-status strong { color: #f0f5fa; font-size: 17px; font-weight: 570; letter-spacing: -.045em; }
.cac__stage-status p { margin: 0; color: #99a5b2; font-size: 9px; line-height: 1.42; }
.cac__core-readout { position: absolute; z-index: 2; top: 49%; left: 50%; display: grid; justify-items: center; pointer-events: none; text-align: center; transform: translate(-50%, -50%); }
.cac__core-readout span { color: rgba(231,236,242,.58); font-size: 8px; font-weight: 690; letter-spacing: .13em; text-transform: uppercase; }
.cac__core-readout strong { margin: 4px 0 3px; color: #f5f9fd; font-size: clamp(50px, 6.2vw, 73px); font-weight: 520; letter-spacing: -.1em; line-height: .84; font-variant-numeric: tabular-nums; text-shadow: 0 10px 25px rgba(0,0,0,.36); }
.cac__core-readout small { max-width: 115px; color: var(--cac-accent); font-size: 8px; font-weight: 720; letter-spacing: .1em; line-height: 1.3; text-transform: uppercase; }
.cac__stage-hint { position: absolute; z-index: 3; bottom: 19px; left: 18px; display: inline-flex; align-items: center; gap: 5px; color: rgba(231,236,242,.47); font-size: 8px; letter-spacing: .025em; }
.cac__controls { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; height: 65px; margin-top: 12px; }
.cac__control { display: grid; grid-template-columns: auto minmax(0,1fr) auto; align-items: center; min-width: 0; gap: 7px; padding: 0 9px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; color: #9ba7b4; background: rgba(255,255,255,.035); box-shadow: inset 0 1px 0 rgba(255,255,255,.07); cursor: pointer; text-align: left; transition: border-color 210ms ease, color 210ms ease, background 210ms ease, box-shadow 210ms ease; }
.cac__control:hover { border-color: rgba(255,255,255,.22); color: #e7ecf2; background: rgba(255,255,255,.07); }
.cac__control--active { border-color: rgba(var(--cac-accent-rgb),.55); color: #effbff; background: linear-gradient(135deg, rgba(var(--cac-accent-rgb),.18), rgba(255,255,255,.055)); box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 0 0 3px rgba(var(--cac-accent-rgb),.06); }
.cac__control-icon { display: grid; width: 27px; height: 27px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(255,255,255,.12); border-radius: 8px; color: var(--cac-accent); background: rgba(var(--cac-accent-rgb),.09); }
.cac__control-copy { display: grid; min-width: 0; gap: 1px; }
.cac__control-copy small { color: #818d9b; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 8px; }
.cac__control-copy strong { overflow: hidden; color: inherit; font-size: 10px; font-weight: 620; text-overflow: ellipsis; white-space: nowrap; }
.cac__control-score { color: #d8e0e8; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; font-variant-numeric: tabular-nums; }
.cac__chapters { display: grid; gap: 0; padding-bottom: 14vh; }
.cac__chapter { position: relative; display: grid; align-content: center; min-height: min(660px, 82vh); padding: 40px 0 38px; opacity: .42; scroll-margin-top: 13vh; transition: opacity 360ms ease, transform 360ms ease; transform: translateY(18px); }
.cac__chapter--active { opacity: 1; transform: translateY(0); }
.cac__chapter::before { position: absolute; top: 20%; bottom: 20%; left: -30px; width: 1px; content: ""; background: linear-gradient(to bottom, transparent, rgba(var(--cac-accent-rgb),.55), transparent); opacity: 0; transition: opacity 300ms ease; }
.cac__chapter--active::before { opacity: 1; }
.cac__chapter-heading { display: flex; align-items: center; gap: 9px; }
.cac__chapter-index { color: var(--cac-accent); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 10px; font-weight: 650; }
.cac__chapter-icon { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid rgba(var(--cac-accent-rgb),.34); border-radius: 10px; color: var(--cac-accent); background: rgba(var(--cac-accent-rgb),.08); }
.cac__chapter-state { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; color: #7d8997; font-size: 8px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
.cac__chapter-state > span { width: 6px; height: 6px; border-radius: 50%; background: var(--cac-accent); box-shadow: 0 0 0 4px rgba(var(--cac-accent-rgb),.09), 0 0 14px rgba(var(--cac-accent-rgb),.44); }
.cac__chapter h3 { max-width: 505px; margin: 21px 0 12px; color: #e7ecf2; font-size: clamp(27px, 3vw, 42px); font-weight: 540; letter-spacing: -.062em; line-height: 1.01; }
.cac__chapter-summary { max-width: 510px; margin: 0; color: #9ca7b4; font-size: 12px; line-height: 1.62; }
.cac__agent-list { margin-top: 26px; padding: 15px 0; border-top: 1px solid rgba(255,255,255,.1); border-bottom: 1px solid rgba(255,255,255,.1); }
.cac__agent-list > span { color: #7b8794; font-size: 8px; font-weight: 710; letter-spacing: .12em; text-transform: uppercase; }
.cac__agent-list ul { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 12px; margin: 13px 0 0; padding: 0; list-style: none; }
.cac__agent-list li { display: flex; align-items: center; gap: 6px; color: #c9d1d9; font-size: 10px; }
.cac__agent-list li svg { flex: 0 0 auto; color: var(--cac-accent); }
.cac__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-top: 16px; }
.cac__metrics > div { display: grid; align-content: start; min-height: 61px; gap: 5px; padding: 9px; border: 1px solid rgba(255,255,255,.1); border-radius: 10px; background: rgba(255,255,255,.027); }
.cac__metrics span { color: #7f8b98; font-size: 8px; line-height: 1.18; }
.cac__metrics strong { color: #dce4eb; font-size: 9px; font-weight: 600; line-height: 1.22; }
.cac__evidence { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 10px; margin-top: 12px; padding: 12px; border: 1px solid rgba(var(--cac-accent-rgb),.18); border-radius: 11px; color: #cbd4dd; background: linear-gradient(135deg, rgba(var(--cac-accent-rgb),.085), rgba(255,255,255,.025)); }
.cac__evidence span { display: flex; align-items: center; gap: 5px; color: var(--cac-accent); font-size: 8px; font-weight: 690; letter-spacing: .07em; text-transform: uppercase; }
.cac__evidence strong { overflow: hidden; grid-row: 2; color: #dce5ed; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 9px; font-weight: 500; text-overflow: ellipsis; white-space: nowrap; }
.cac__evidence > svg { grid-row: span 2; align-self: center; color: #9daab7; }
.cac__fallback { position: absolute; z-index: 1; inset: 0; overflow: hidden; perspective: 900px; }
.cac__fallback-app { position: absolute; top: 31%; left: 16%; width: 29%; height: 26%; padding: 9px; border: 1px solid rgba(197,239,255,.44); border-radius: 10px; background: linear-gradient(140deg, rgba(150,222,247,.32), rgba(56,85,101,.34)); box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 23px 40px rgba(0,0,0,.25); transform: rotateY(-22deg) rotateX(8deg); animation: cac-app-entry 2.4s cubic-bezier(.22,1,.36,1) both; }
.cac__fallback-app > span { display: inline-block; width: 5px; height: 5px; margin-right: 3px; border-radius: 50%; background: rgba(232,250,255,.76); }
.cac__fallback-app > i { display: block; height: 8px; margin-top: 8px; border-radius: 3px; background: rgba(226,249,255,.2); }
.cac__fallback-app > i:nth-of-type(2) { width: 74%; }
.cac__fallback-app > i:nth-of-type(3) { width: 51%; }
.cac__fallback-gate { position: absolute; top: 28%; left: 36%; width: 27%; height: 42%; border: 1px solid rgba(var(--cac-accent-rgb),.46); border-radius: 50%; transform: rotateY(57deg); box-shadow: 0 0 25px rgba(var(--cac-accent-rgb),.13); }
.cac__fallback-gate--two { left: 46%; width: 23%; height: 50%; border-color: rgba(231,236,242,.17); transform: rotateY(57deg) rotateZ(39deg); }
.cac__fallback-core { position: absolute; top: 36%; left: 51%; display: grid; width: 21%; aspect-ratio: 1; place-items: center; border: 1px solid rgba(255,255,255,.24); border-radius: 50%; background: radial-gradient(circle, rgba(var(--cac-accent-rgb),.47), rgba(20,36,45,.5) 39%, rgba(9,14,18,.12) 70%); box-shadow: inset 0 0 30px rgba(255,255,255,.17), 0 0 44px rgba(var(--cac-accent-rgb),.24); transform: translateZ(35px); }
.cac__fallback-core > span { position: absolute; width: 72%; height: 1px; background: rgba(235,250,255,.53); transform: rotate(var(--r)); }
.cac__fallback-core > span:nth-child(1) { --r: 0deg; }.cac__fallback-core > span:nth-child(2) { --r: 60deg; }.cac__fallback-core > span:nth-child(3) { --r: 120deg; }
.cac__fallback-layer { position: absolute; right: 15%; width: 20%; height: 9%; border: 1px solid rgba(var(--cac-accent-rgb),.36); border-radius: 8px; background: rgba(var(--cac-accent-rgb),.16); box-shadow: 0 0 18px rgba(var(--cac-accent-rgb),.15); transform: rotateY(-20deg); }
.cac__fallback-layer--one { top: 28%; }.cac__fallback-layer--two { top: 45%; opacity: .74; }.cac__fallback-layer--three { top: 62%; opacity: .5; }
.cac__noscript { margin: 28px 0 0; color: #a2adb9; font-size: 12px; }
@keyframes cac-sheen { 0%, 35% { transform: translateX(-70%) skewX(-13deg); opacity: 0; } 48% { opacity: .55; } 66%, 100% { transform: translateX(160%) skewX(-13deg); opacity: 0; } }
@keyframes cac-app-entry { from { opacity: 0; transform: translate3d(-75px, 10px, -90px) rotateY(-42deg) rotateX(10deg); } to { opacity: 1; transform: rotateY(-22deg) rotateX(8deg); } }
@media (max-width: 1190px) { .cac__journey { grid-template-columns: minmax(430px, 1fr) minmax(320px, .68fr); gap: 48px; }.cac__stage-column { min-height: 536px; }.cac__stage { min-height: 454px; }.cac__source-readout { transform: scale(.93); transform-origin: top left; }.cac__stage-status { transform: scale(.93); transform-origin: bottom right; }.cac__control-copy strong { font-size: 9px; }.cac__chapter::before { left: -20px; } }
@media (max-width: 979px) { .cinematic-audit-core { width: min(760px, calc(100% - 40px)); margin-top: 105px; }.cac__intro { grid-template-columns: 1fr; gap: 13px; margin-bottom: 45px; }.cac__eyebrow { padding-top: 0; }.cac__journey { grid-template-columns: 1fr; gap: 26px; }.cac__stage-column { position: relative; top: auto; height: 570px; }.cac__stage { height: calc(100% - 77px); }.cac__chapters { padding-bottom: 0; }.cac__chapter { min-height: 0; padding: 45px 0; opacity: 1; transform: none; }.cac__chapter::before { display: none; } }
@media (max-width: 620px) { .cinematic-audit-core { width: calc(100% - 32px); }.cac__intro h2 { font-size: 34px; }.cac__intro p { font-size: 13px; }.cac__stage-column { height: 460px; min-height: 0; }.cac__stage { min-height: 390px; border-radius: 20px; }.cac__source-readout { top: 12px; left: 12px; transform: scale(.84); }.cac__stage-status { right: 12px; bottom: 13px; }.cac__core-readout { top: 50%; }.cac__stage-hint { display: none; }.cac__controls { gap: 5px; height: 59px; margin-top: 9px; }.cac__control { padding: 0 6px; gap: 4px; }.cac__control-icon { width: 23px; height: 23px; }.cac__control-copy small { display: none; }.cac__control-score { font-size: 9px; }.cac__chapter { padding: 35px 0; }.cac__chapter h3 { font-size: 31px; }.cac__agent-list ul { grid-template-columns: 1fr; }.cac__metrics { grid-template-columns: 1fr 1fr; }.cac__metrics > div:last-child { grid-column: span 2; }.cac__fallback-app { left: 11%; width: 34%; }.cac__fallback-core { left: 48%; width: 24%; }.cac__fallback-layer { right: 8%; width: 24%; } }
@media (prefers-reduced-motion: reduce) { .cac__stage::before, .cac__fallback-app { animation: none; }.cac__chapter, .cac__control, .cac__stage-aura { transition-duration: .01ms; } }
`;
