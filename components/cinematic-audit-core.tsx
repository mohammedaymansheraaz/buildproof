"use client";

import { useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  CircleCheck,
  Code2,
  Database,
  FileCheck2,
  Gauge,
  Globe2,
  LockKeyhole,
  MousePointer2,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Telescope,
  type LucideIcon,
} from "lucide-react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export type AuditAssemblyStageId = "intelligence" | "experience" | "engineering" | "security" | "verdict";

export type AuditAssemblyStage = {
  id: AuditAssemblyStageId;
  index: string;
  rail: string;
  eyebrow: string;
  description: string;
  status: string;
  accent: string;
  score: string;
  scoreLabel: string;
  agents: string[];
  metrics: Array<{ label: string; value: string }>;
  evidence: string;
  capability: string;
  icon: LucideIcon;
};

/**
 * Content and visual primitives only. LandingPipeline owns every scroll,
 * pinning, and stage-transition decision so the story has one controller.
 */
export const auditAssemblyStages: AuditAssemblyStage[] = [
  {
    id: "intelligence",
    index: "01",
    rail: "Product intelligence",
    eyebrow: "Product understanding",
    description: "The product understanding agent maps the repository, staging target, routes, integrations, declared journeys, and approved boundaries into a shared audit plan.",
    status: "Application map sealed",
    accent: "#9FE8FF",
    score: "184",
    scoreLabel: "surfaces classified",
    agents: ["Product Understanding Agent", "Journey mapper", "Scope & target verifier"],
    metrics: [
      { label: "Routes", value: "42 mapped" },
      { label: "Journeys", value: "12 planned" },
      { label: "Boundaries", value: "03 approved" },
    ],
    evidence: "repo → routes → journeys → approved staging target",
    capability: "Target boundaries and coverage are explicit before specialists begin.",
    icon: Telescope,
  },
  {
    id: "experience",
    index: "02",
    rail: "Experience & QA",
    eyebrow: "Application experience & quality",
    description: "UI/UX, functional QA, accessibility, and frontend behavior agents trace the moments where a polished screen can still fail a real user.",
    status: "Journey evidence captured",
    accent: "#9FE8FF",
    score: "12",
    scoreLabel: "critical journeys traced",
    agents: ["Journey explorer", "Functional QA", "Accessibility reader", "Frontend observer"],
    metrics: [
      { label: "Critical journeys", value: "12 traced" },
      { label: "Interaction checks", value: "184 observed" },
      { label: "Accessibility", value: "2 reviews" },
    ],
    evidence: "Login → workspace invite → confirmation state",
    capability: "Browser traces, screenshots, and interaction evidence stay attached to every signal.",
    icon: MousePointer2,
  },
  {
    id: "engineering",
    index: "03",
    rail: "Engineering & scale",
    eyebrow: "Engineering performance & infrastructure",
    description: "Performance, backend/cloud, database, and DevOps specialists correlate the browser experience with APIs, data paths, runtime configuration, and delivery readiness.",
    status: "Systems path correlated",
    accent: "#D9A15B",
    score: "31",
    scoreLabel: "API paths correlated",
    agents: ["Performance engineer", "API cartographer", "Cloud reviewer", "Data path analyst"],
    metrics: [
      { label: "API paths", value: "31 correlated" },
      { label: "Runtime signals", value: "7 captured" },
      { label: "Delivery checks", value: "4 ready" },
    ],
    evidence: "POST /invites → queue → tenant database → mail provider",
    capability: "One systems reading replaces disconnected performance, cloud, and deployment reports.",
    icon: Network,
  },
  {
    id: "security",
    index: "04",
    rail: "Security & reliability",
    eyebrow: "Security & reliability intelligence",
    description: "Security engineering checks approved identity, authorization, dependencies, configuration, data protection, and passive exposure signals inside the boundary you authorize.",
    status: "Approved baseline complete",
    accent: "#F87171",
    score: "08",
    scoreLabel: "auth boundaries reviewed",
    agents: ["Auth boundary reviewer", "Exposure analyst", "Data protection reader", "Reliability sentinel"],
    metrics: [
      { label: "Auth boundaries", value: "8 verified" },
      { label: "Data surfaces", value: "14 reviewed" },
      { label: "Open signals", value: "1 caution" },
    ],
    evidence: "Session renewal → protected route → policy boundary",
    capability: "Safe, attributable checks make risk useful to a release team—not merely alarming.",
    icon: ShieldCheck,
  },
  {
    id: "verdict",
    index: "05",
    rail: "AI & launch verdict",
    eyebrow: "AI evaluation & launch intelligence",
    description: "A conditional AI evaluation agent assesses AI-powered application features; launch intelligence then connects evidence, cost context, and release policy into a human-approved verdict.",
    status: "Release passport assembled",
    accent: "#4ADE80",
    score: "82",
    scoreLabel: "evidence coverage",
    agents: ["AI Evaluation Agent · when applicable", "Cost & launch intelligence", "CTO Verdict Synthesizer"],
    metrics: [
      { label: "Evidence coverage", value: "82% sealed" },
      { label: "Release gates", value: "3 reviewed" },
      { label: "Decision", value: "Human required" },
    ],
    evidence: "all evidence → coverage → recommendation → human decision",
    capability: "The final report explains its limits and never manufactures a ship decision from missing evidence.",
    icon: BrainCircuit,
  },
];

const stageAccents = auditAssemblyStages.map((stage) => new THREE.Color(stage.accent));

/** One non-interactive canvas that lives inside the pinned pipeline. */
export function CinematicAuditCore({
  progressRef,
  reduceMotion,
  className,
}: {
  progressRef: MutableRefObject<number>;
  reduceMotion: boolean;
  className?: string;
}) {
  return (
    <div className={cn("pipeline-audit-engine", className)} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0.12, 6.9], fov: 34 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <AuditCoreScene progressRef={progressRef} reduceMotion={reduceMotion} />
      </Canvas>
    </div>
  );
}

/** The expert depth is rendered inside the matching pipeline chamber. */
export function CinematicStageDepth({ stageIndex, active }: { stageIndex: number; active: boolean }) {
  const stage = auditAssemblyStages[stageIndex] ?? auditAssemblyStages[0];
  const Icon = stage.icon;

  return (
    <div className={cn("pipeline-depth", `pipeline-depth--${stage.id}`, active && "pipeline-depth--active")} data-pipeline-depth>
      <div className="pipeline-depth__lead">
        <span><Icon size={13} /> {stage.eyebrow}</span>
        <strong>{stage.score}</strong>
        <small>{stage.scoreLabel}</small>
        <p>{stage.description}</p>
      </div>
      <div className="pipeline-depth__agents">
        <span>Specialists inside this chamber</span>
        <ul>{stage.agents.map((agent) => <li key={agent}><CircleCheck size={12} />{agent}</li>)}</ul>
      </div>
      <div className="pipeline-depth__metrics" aria-label={`${stage.rail} metrics`}>
        {stage.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong></div>)}
      </div>
      <AssemblyEvidence stage={stage} />
      <p className="pipeline-depth__capability"><Sparkles size={12} />{stage.capability}</p>
    </div>
  );
}

function AssemblyEvidence({ stage }: { stage: AuditAssemblyStage }) {
  if (stage.id === "intelligence") {
    return <div className="pipeline-evidence pipeline-evidence--map"><div><span>routes</span><strong>42</strong></div><i /><div><span>journeys</span><strong>12</strong></div><i /><div><span>boundaries</span><strong>03</strong></div><p><ScanSearch size={12} />{stage.evidence}</p></div>;
  }

  if (stage.id === "experience") {
    return <div className="pipeline-evidence pipeline-evidence--browser"><div className="pipeline-evidence__browser-bar"><i /><i /><i /><span>preview.buildproof.dev</span></div><div className="pipeline-evidence__browser-page"><aside><b /><b /><b /></aside><main><span /><span /><span /><strong><Check size={11} /> Invite flow complete</strong></main></div><p><MousePointer2 size={12} />{stage.evidence}</p></div>;
  }

  if (stage.id === "engineering") {
    return <div className="pipeline-evidence pipeline-evidence--system"><div className="pipeline-evidence__system-node"><Globe2 size={13} /><span>Browser</span></div><i /><div className="pipeline-evidence__system-node"><Code2 size={13} /><span>API</span></div><i /><div className="pipeline-evidence__system-node"><Database size={13} /><span>Data</span></div><p><Gauge size={12} />{stage.evidence}</p></div>;
  }

  if (stage.id === "security") {
    return <div className="pipeline-evidence pipeline-evidence--security"><div><LockKeyhole size={14} /><span>Identity path</span><strong>Observed</strong></div><div><ShieldCheck size={14} /><span>Policy boundary</span><strong>Verified</strong></div><div><ScanSearch size={14} /><span>Exposure baseline</span><strong>1 review</strong></div><p><ShieldCheck size={12} />{stage.evidence}</p></div>;
  }

  return <div className="pipeline-evidence pipeline-evidence--verdict"><div className="pipeline-evidence__passport-top"><span>RELEASE PASSPORT</span><FileCheck2 size={14} /></div><div className="pipeline-evidence__passport-score"><strong>82</strong><span>coverage<br /><b>REVIEW</b></span></div><div className="pipeline-evidence__passport-row"><i /><span>Runtime config mismatch</span><ArrowUpRight size={12} /></div><p><BrainCircuit size={12} />{stage.evidence}</p></div>;
}

function AuditCoreScene({ progressRef, reduceMotion }: { progressRef: MutableRefObject<number>; reduceMotion: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  const targetColor = useRef(new THREE.Color("#9FE8FF"));

  useFrame((_state, delta) => {
    if (!light.current) return;
    const stagePosition = THREE.MathUtils.clamp(progressRef.current, 0, 1) * (auditAssemblyStages.length - 1);
    const from = Math.floor(stagePosition);
    const to = Math.min(auditAssemblyStages.length - 1, from + 1);
    const mix = stagePosition - from;
    targetColor.current.copy(stageAccents[from]).lerp(stageAccents[to], mix);
    light.current.color.lerp(targetColor.current, 1 - Math.exp(-delta * 5));
  });

  return (
    <>
      <ambientLight intensity={0.8} />
      <pointLight position={[-3.8, 3.5, 4.5]} intensity={13} color="#d8f7ff" />
      <pointLight ref={light} position={[3.3, -2.8, 3.5]} intensity={8} color="#9FE8FF" />
      <AuditEngine progressRef={progressRef} reduceMotion={reduceMotion} />
    </>
  );
}

function AuditEngine({ progressRef, reduceMotion }: { progressRef: MutableRefObject<number>; reduceMotion: boolean }) {
  const root = useRef<THREE.Group>(null);
  const app = useRef<THREE.Group>(null);
  const accentMaterial = useRef<THREE.MeshBasicMaterial>(null);
  const targetAccent = useRef(new THREE.Color("#9FE8FF"));
  const rootY = [-0.16, -0.02, 0.11, -0.05, 0.02];
  const rootX = [0.02, 0.06, -0.03, 0.05, -0.02];
  const targets: Array<[number, number, number]> = [[0, -0.28, 0], [0.02, -0.08, 0.1], [-0.04, 0.1, 0.05], [0.02, 0.1, 0.1], [0, -0.04, 0.12]];

  useFrame((state, delta) => {
    const stagePosition = THREE.MathUtils.clamp(progressRef.current, 0, 1) * (auditAssemblyStages.length - 1);
    const from = Math.floor(stagePosition);
    const to = Math.min(auditAssemblyStages.length - 1, from + 1);
    const mix = stagePosition - from;
    targetAccent.current.copy(stageAccents[from]).lerp(stageAccents[to], mix);

    if (root.current) {
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, THREE.MathUtils.lerp(rootY[from], rootY[to], mix), 1.7, delta);
      root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, THREE.MathUtils.lerp(rootX[from], rootX[to], mix), 1.7, delta);
    }

    if (app.current) {
      const target = targets[from].map((value, index) => THREE.MathUtils.lerp(value, targets[to][index], mix)) as [number, number, number];
      app.current.position.x = THREE.MathUtils.damp(app.current.position.x, target[0], 1.5, delta);
      app.current.position.y = THREE.MathUtils.damp(app.current.position.y, target[1], 1.5, delta);
      app.current.position.z = THREE.MathUtils.damp(app.current.position.z, target[2], 1.5, delta);
      if (!reduceMotion) app.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.65) * 0.018;
    }

    accentMaterial.current?.color.lerp(targetAccent.current, 1 - Math.exp(-delta * 6));
  });

  return (
    <group ref={root}>
      <group ref={app}>
        <RoundedBox args={[2.16, 1.52, 0.16]} radius={0.16} smoothness={5}><meshPhysicalMaterial color="#1c2a35" metalness={0.42} roughness={0.22} transparent opacity={0.95} /></RoundedBox>
        <RoundedBox args={[1.86, 1.21, 0.05]} radius={0.1} smoothness={4} position={[0, -0.02, 0.11]}><meshPhysicalMaterial color="#537085" metalness={0.17} roughness={0.18} transparent opacity={0.42} /></RoundedBox>
        <mesh position={[-0.67, 0.36, 0.15]}><planeGeometry args={[0.42, 0.08]} /><meshBasicMaterial color="#e9fbff" transparent opacity={0.7} /></mesh>
        <mesh position={[0.05, 0.36, 0.15]}><planeGeometry args={[0.65, 0.08]} /><meshBasicMaterial color="#e9fbff" transparent opacity={0.24} /></mesh>
        <mesh position={[-0.46, -0.04, 0.15]}><planeGeometry args={[0.64, 0.37]} /><meshBasicMaterial color="#9fe8ff" transparent opacity={0.16} /></mesh>
        <mesh position={[0.39, -0.04, 0.15]}><planeGeometry args={[0.38, 0.37]} /><meshBasicMaterial color="#e9fbff" transparent opacity={0.09} /></mesh>
        <mesh position={[0, -0.5, 0.15]}><boxGeometry args={[1.53, 0.05, 0.02]} /><meshBasicMaterial ref={accentMaterial} color="#9FE8FF" transparent opacity={0.8} /></mesh>
      </group>
      <ProductLayer stageIndex={0} progressRef={progressRef} accent="#9FE8FF" reduceMotion={reduceMotion} />
      <ExperienceLayer stageIndex={1} progressRef={progressRef} accent="#9FE8FF" reduceMotion={reduceMotion} />
      <EngineeringLayer stageIndex={2} progressRef={progressRef} accent="#D9A15B" reduceMotion={reduceMotion} />
      <SecurityLayer stageIndex={3} progressRef={progressRef} accent="#F87171" reduceMotion={reduceMotion} />
      <VerdictLayer stageIndex={4} progressRef={progressRef} accent="#4ADE80" reduceMotion={reduceMotion} />
    </group>
  );
}

function Layer({ stageIndex, progressRef, children }: { stageIndex: number; progressRef: MutableRefObject<number>; children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_state, delta) => {
    if (!group.current) return;
    const weight = THREE.MathUtils.clamp(1 - Math.abs(THREE.MathUtils.clamp(progressRef.current, 0, 1) * 4 - stageIndex), 0, 1);
    const targetScale = 0.03 + weight * 0.97;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, targetScale, 4.2, delta));
    group.current.position.z = THREE.MathUtils.damp(group.current.position.z, weight > 0.03 ? 0 : -0.44, 4.2, delta);
  });
  return <group ref={group} scale={0.03}>{children}</group>;
}

function ProductLayer({ stageIndex, progressRef, accent, reduceMotion }: { stageIndex: number; progressRef: MutableRefObject<number>; accent: string; reduceMotion: boolean }) {
  const orbit = useRef<THREE.Group>(null);
  useFrame((_state, delta) => { if (!reduceMotion && orbit.current) orbit.current.rotation.z += delta * 0.16; });
  return <Layer stageIndex={stageIndex} progressRef={progressRef}><group ref={orbit} position={[0, 0.05, 0.34]} rotation={[0.66, -0.12, 0]}><mesh><torusGeometry args={[1.71, 0.015, 10, 96]} /><meshBasicMaterial color={accent} transparent opacity={0.63} /></mesh><mesh rotation={[0.62, 0.18, 0.42]}><torusGeometry args={[2.15, 0.009, 10, 96]} /><meshBasicMaterial color="#e9fbff" transparent opacity={0.3} /></mesh><Line points={[[-1.15, 0.72, 0], [0, 0, 0], [1.22, 0.66, 0], [1.02, -0.82, 0], [-1.12, -0.67, 0], [0, 0, 0]]} color={accent} transparent opacity={0.65} lineWidth={1.1} /></group></Layer>;
}

function ExperienceLayer({ stageIndex, progressRef, accent, reduceMotion }: { stageIndex: number; progressRef: MutableRefObject<number>; accent: string; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_state, delta) => { if (!reduceMotion && group.current) group.current.rotation.z += delta * 0.11; });
  return <Layer stageIndex={stageIndex} progressRef={progressRef}><group ref={group} position={[0.04, 0.05, 0.36]}>{[[-0.68, 0.45], [0.68, 0.45], [-0.68, -0.45], [0.68, -0.45]].map(([x, y], index) => <RoundedBox key={`${x}-${y}`} args={[0.48, 0.31, 0.05]} radius={0.06} smoothness={3} position={[x, y, 0]}><meshBasicMaterial color={accent} transparent opacity={index === 1 ? 0.58 : 0.3} /></RoundedBox>)}<mesh position={[0, 0, 0.05]}><ringGeometry args={[0.54, 0.57, 48]} /><meshBasicMaterial color="#effdff" transparent opacity={0.64} side={THREE.DoubleSide} /></mesh></group></Layer>;
}

function EngineeringLayer({ stageIndex, progressRef, accent, reduceMotion }: { stageIndex: number; progressRef: MutableRefObject<number>; accent: string; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const points: Array<[number, number, number]> = [[-1.18, 0.55, 0], [-0.17, 0.08, 0], [1.1, 0.47, 0], [0.82, -0.75, 0], [-1.08, -0.55, 0], [-0.17, 0.08, 0]];
  useFrame((_state, delta) => { if (!reduceMotion && group.current) group.current.rotation.z -= delta * 0.1; });
  return <Layer stageIndex={stageIndex} progressRef={progressRef}><group ref={group} position={[0.03, 0.08, 0.36]}><Line points={points} color={accent} transparent opacity={0.82} lineWidth={1.35} />{points.slice(0, -1).map(([x, y], index) => <mesh key={`${x}-${y}`} position={[x, y, 0.06]}><sphereGeometry args={[index === 1 ? 0.14 : 0.085, 18, 18]} /><meshBasicMaterial color={index === 1 ? "#fff4df" : accent} /></mesh>)}<mesh rotation={[0.65, 0.1, 0]}><torusGeometry args={[1.38, 0.012, 10, 96]} /><meshBasicMaterial color="#f3d6ac" transparent opacity={0.37} /></mesh></group></Layer>;
}

function SecurityLayer({ stageIndex, progressRef, accent, reduceMotion }: { stageIndex: number; progressRef: MutableRefObject<number>; accent: string; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_state, delta) => { if (!reduceMotion && group.current) group.current.rotation.y += delta * 0.23; });
  return <Layer stageIndex={stageIndex} progressRef={progressRef}><group ref={group} position={[0.02, 0.04, 0.37]} rotation={[0.12, 0, 0]}><mesh><octahedronGeometry args={[0.88, 0]} /><meshPhysicalMaterial color={accent} metalness={0.12} roughness={0.23} transparent opacity={0.19} emissive={accent} emissiveIntensity={0.12} /></mesh><mesh rotation={[0.58, 0.18, 0]}><torusGeometry args={[1.04, 0.018, 10, 64]} /><meshBasicMaterial color={accent} transparent opacity={0.76} /></mesh><mesh><sphereGeometry args={[0.13, 18, 18]} /><meshBasicMaterial color="#fff5f5" /></mesh></group></Layer>;
}

function VerdictLayer({ stageIndex, progressRef, accent, reduceMotion }: { stageIndex: number; progressRef: MutableRefObject<number>; accent: string; reduceMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => { if (!reduceMotion && group.current) group.current.rotation.z = Math.sin(Date.now() * 0.00055) * 0.06; });
  return <Layer stageIndex={stageIndex} progressRef={progressRef}><group ref={group} position={[0.02, 0.05, 0.36]} rotation={[0.05, 0.03, 0]}><RoundedBox args={[1.43, 1.5, 0.11]} radius={0.15} smoothness={5}><meshPhysicalMaterial color="#173225" metalness={0.3} roughness={0.22} transparent opacity={0.88} /></RoundedBox><RoundedBox args={[1.18, 1.24, 0.035]} radius={0.09} smoothness={4} position={[0, 0, 0.09]}><meshBasicMaterial color={accent} transparent opacity={0.16} /></RoundedBox><mesh position={[-0.25, -0.08, 0.13]}><circleGeometry args={[0.24, 32]} /><meshBasicMaterial color={accent} transparent opacity={0.62} /></mesh></group></Layer>;
}
