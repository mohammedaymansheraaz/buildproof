"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { Float, PresentationControls, RoundedBox } from "@react-three/drei";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Cloud, MousePointer2, ShieldCheck } from "lucide-react";
import * as THREE from "three";
import type { ReleaseVerdict } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ReleaseLens } from "@/components/release-lens";

export type ReleaseStageSurface = "experience" | "engineering" | "security";

type Surface = {
  id: ReleaseStageSurface;
  label: string;
  value: number;
  accent: string;
  position: [number, number, number];
  rotation: [number, number, number];
  description: string;
};

type ReleaseStageProps = {
  score: number;
  verdict: ReleaseVerdict;
  experience: number;
  engineering: number;
  security: number;
  activeSurface?: ReleaseStageSurface;
  onSurfaceChange?: (surface: ReleaseStageSurface) => void;
  scoreLabel?: string;
  statusLabel?: string;
};

export function ReleaseStage({ score, verdict, experience, engineering, security, activeSurface: controlledSurface, onSurfaceChange, scoreLabel = "Application health", statusLabel }: ReleaseStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const [canRenderScene, setCanRenderScene] = useState(false);
  const [activeSurface, setActiveSurface] = useState<ReleaseStageSurface>("experience");

  const surfaces = useMemo<Surface[]>(
    () => [
      {
        id: "experience",
        label: "Experience",
        value: experience,
        accent: "#9FE8FF",
        position: [0.96, 0.76, 0.42],
        rotation: [0.08, -0.34, 0.16],
        description: "Real journeys, UI behavior, and inclusive product access.",
      },
      {
        id: "engineering",
        label: "Engineering",
        value: engineering,
        accent: "#D9A15B",
        position: [-1.02, -0.72, 0.35],
        rotation: [-0.08, 0.32, -0.13],
        description: "API, data, performance, cloud, and delivery intelligence.",
      },
      {
        id: "security",
        label: "Security",
        value: security,
        accent: "#F9A9A2",
        position: [0.9, -0.92, 0.26],
        rotation: [0.07, -0.29, 0.08],
        description: "Authorization, protection, and reliability risk signals.",
      },
    ],
    [engineering, experience, security],
  );

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 760px)");
    const update = () => {
      const canvas = document.createElement("canvas");
      const webgl = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      setCanRenderScene(webgl && !compact.matches && !prefersReducedMotion);
    };

    update();
    compact.addEventListener("change", update);
    return () => compact.removeEventListener("change", update);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (controlledSurface) setActiveSurface(controlledSurface);
  }, [controlledSurface]);

  if (!canRenderScene) {
    return <ReleaseLens score={score} verdict={verdict} functional={experience} security={security} cloud={engineering} functionalLabel="Experience" cloudLabel="Engineering" coreLabel={scoreLabel} verdictLabel={statusLabel} />;
  }

  const selectedSurface = controlledSurface ?? activeSurface;
  const active = surfaces.find((surface) => surface.id === selectedSurface) ?? surfaces[0];
  const verdictClass = verdict === "DO NOT SHIP" ? "hold" : verdict === "READY WITH REVIEW" ? "review" : "ship";
  const selectSurface = (surface: ReleaseStageSurface) => {
    setActiveSurface(surface);
    onSurfaceChange?.(surface);
  };

  return (
    <div className={cn("release-stage", `release-stage--${verdictClass}`)}>
      <div className="release-stage__canvas" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0, 6.3], fov: 36 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        >
          <StageScene
            score={score}
            verdict={verdict}
            surfaces={surfaces}
            activeSurface={selectedSurface}
            onSurfaceSelect={selectSurface}
            reduceMotion={Boolean(prefersReducedMotion)}
          />
        </Canvas>
      </div>

      <div className="release-stage__core-readout" aria-hidden="true">
        <span>{scoreLabel}</span>
        <strong>{score}</strong>
        <small>{statusLabel ?? verdict}</small>
      </div>

      <div className="release-stage__surface-controls" role="group" aria-label="Explore expert audit teams">
        {surfaces.map((surface) => (
          <motion.button
            type="button"
            className={cn(
              "release-stage__surface-button",
              `release-stage__surface-button--${surface.id}`,
              selectedSurface === surface.id && "release-stage__surface-button--active",
            )}
            key={surface.id}
            onClick={() => selectSurface(surface.id)}
            aria-pressed={selectedSurface === surface.id}
            whileHover={{ y: -3, scale: 1.025 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{surface.label}</span>
            <strong>{surface.value}%</strong>
          </motion.button>
        ))}
      </div>

      <div className="release-stage__instruction"><MousePointer2 size={12} /> Drag the model · select an expert team</div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="release-stage__inspector"
          key={active.id}
          initial={{ opacity: 0, y: 9 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -7 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="release-stage__inspector-icon">
            {active.id === "security" ? <ShieldCheck size={15} /> : active.id === "engineering" ? <Cloud size={15} /> : <MousePointer2 size={15} />}
          </div>
          <div>
            <span>{active.label} signal</span>
            <strong>{active.value}% evidence coverage</strong>
            <p>{active.description}</p>
          </div>
          <ArrowUpRight size={15} aria-hidden="true" />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StageScene({
  score,
  verdict,
  surfaces,
  activeSurface,
  onSurfaceSelect,
  reduceMotion,
}: {
  score: number;
  verdict: ReleaseVerdict;
  surfaces: Surface[];
  activeSurface: ReleaseStageSurface;
  onSurfaceSelect: (surface: ReleaseStageSurface) => void;
  reduceMotion: boolean;
}) {
  const tint = verdict === "DO NOT SHIP" ? "#F9A9A2" : verdict === "READY WITH REVIEW" ? "#FBBF24" : "#4ADE80";

  return (
    <>
      <ambientLight intensity={1.25} />
      <pointLight position={[3.8, 4.3, 5]} intensity={14} color="#DDF9FF" />
      <pointLight position={[-4.5, -2.2, 3]} intensity={6} color={tint} />
      <PresentationControls
        global={false}
        cursor
        snap={!reduceMotion}
        speed={1.1}
        zoom={0.7}
        polar={[-0.28, 0.28]}
        azimuth={[-0.42, 0.42]}
      >
        <Float speed={reduceMotion ? 0 : 1.15} rotationIntensity={reduceMotion ? 0 : 0.14} floatIntensity={reduceMotion ? 0 : 0.2}>
          <Assembly score={score} tint={tint} reduceMotion={reduceMotion} />
          {surfaces.map((surface) => (
            <SurfacePlate
              key={surface.id}
              surface={surface}
              active={surface.id === activeSurface}
              onSelect={onSurfaceSelect}
            />
          ))}
        </Float>
      </PresentationControls>
    </>
  );
}

function Assembly({ score, tint, reduceMotion }: { score: number; tint: string; reduceMotion: boolean }) {
  const orbitRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (!reduceMotion && orbitRef.current) {
      orbitRef.current.rotation.z += delta * 0.08;
      orbitRef.current.rotation.x = Math.sin(performance.now() / 2400) * 0.06;
    }
  });

  const pulseScale = Math.max(0.72, Math.min(score / 100, 1));

  return (
    <group>
      <group ref={orbitRef} rotation={[0.84, -0.3, -0.18]}>
        <mesh>
          <torusGeometry args={[1.66, 0.012, 12, 96]} />
          <meshBasicMaterial color="#9FE8FF" transparent opacity={0.34} />
        </mesh>
        <mesh rotation={[0.58, 0.2, 1.18]}>
          <torusGeometry args={[1.94, 0.009, 12, 96]} />
          <meshBasicMaterial color={tint} transparent opacity={0.25} />
        </mesh>
      </group>
      <RoundedBox args={[2.23, 2.38, 0.17]} radius={0.17} smoothness={5}>
        <meshPhysicalMaterial color="#1A2530" metalness={0.33} roughness={0.25} transparent opacity={0.9} />
      </RoundedBox>
      <RoundedBox args={[1.92, 2.06, 0.07]} radius={0.14} smoothness={5} position={[0, 0, 0.125]}>
        <meshPhysicalMaterial color="#2A3C49" metalness={0.18} roughness={0.19} transparent opacity={0.29} />
      </RoundedBox>
      <mesh position={[0, -0.95, 0.2]} scale={[pulseScale, 1, 1]}>
        <boxGeometry args={[1.35, 0.05, 0.035]} />
        <meshBasicMaterial color={tint} transparent opacity={0.84} />
      </mesh>
      <mesh position={[-0.89, -0.95, 0.2]}>
        <boxGeometry args={[0.12, 0.05, 0.035]} />
        <meshBasicMaterial color="#E7ECF2" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.04, 0.68, 0.2]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color={tint} />
      </mesh>
    </group>
  );
}

function SurfacePlate({ surface, active, onSelect }: { surface: Surface; active: boolean; onSelect: (surface: ReleaseStageSurface) => void }) {
  function select(event: ThreeEvent<MouseEvent>) {
    event.stopPropagation();
    onSelect(surface.id);
  }

  return (
    <group position={surface.position} rotation={surface.rotation} onClick={select}>
      <RoundedBox args={[1.35, 0.44, 0.12]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial
          color={surface.accent}
          metalness={0.22}
          roughness={0.28}
          transparent
          opacity={active ? 0.7 : 0.29}
          emissive={surface.accent}
          emissiveIntensity={active ? 0.24 : 0.05}
        />
      </RoundedBox>
      <mesh position={[-0.49, 0, 0.09]}>
        <sphereGeometry args={[active ? 0.064 : 0.045, 18, 18]} />
        <meshBasicMaterial color={surface.accent} />
      </mesh>
    </group>
  );
}
