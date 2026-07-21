"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { ReleaseVerdict } from "@/lib/types";
import { cn } from "@/lib/utils";

type ReleaseLensProps = {
  score: number;
  verdict: ReleaseVerdict;
  readings: Array<{
    id: string;
    label: string;
    value: number | null;
    assessed: boolean;
  }>;
  coreLabel?: string;
  verdictLabel?: string;
};

export function ReleaseLens({
  score,
  verdict,
  readings,
  coreLabel = "Release confidence",
  verdictLabel,
}: ReleaseLensProps) {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const reduceMotion = useReducedMotion();
  const verdictClass = verdict === "DO NOT SHIP" ? "hold" : verdict === "READY WITH REVIEW" ? "review" : "ship";

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * -7;
    setRotation({ x: y, y: x });
  }

  return (
    <div
      className="release-lens-wrap"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setRotation({ x: 0, y: 0 })}
      aria-label={`${verdict}, release confidence ${score}; ${readings.length} expert team readings`}
    >
      <motion.div
        className={cn("release-lens", `release-lens--${verdictClass}`)}
        animate={{ rotateX: rotation.x, rotateY: rotation.y }}
        transition={{ type: "spring", damping: 22, stiffness: 140, mass: 0.7 }}
      >
        <span className="lens-glint lens-glint--one" />
        <span className="lens-glint lens-glint--two" />
        {readings.map((reading) => (
          <div className={cn("lens-plate", `lens-plate--${reading.id}`)} key={reading.id}>
            <span>{reading.label}</span>
            <strong>{reading.assessed ? `${reading.value ?? 0}%` : "—"}</strong>
          </div>
        ))}
        <div className="lens-core">
          <span className="lens-core__eyebrow">{coreLabel}</span>
          <strong>{score}</strong>
          <span className="lens-core__verdict">{verdictLabel ?? verdict}</span>
        </div>
      </motion.div>
      <div className="release-lens-orbit release-lens-orbit--one" />
      <div className="release-lens-orbit release-lens-orbit--two" />
    </div>
  );
}
