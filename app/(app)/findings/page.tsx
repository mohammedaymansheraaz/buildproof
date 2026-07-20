import { Suspense } from "react";
import { FindingsWorkspace } from "@/components/findings-workspace";

export default function FindingsPage() {
  return (
    <Suspense fallback={<div className="page findings-loading" aria-label="Loading evidence workspace"><div className="skeleton skeleton--heading" /><div className="skeleton-grid"><div className="skeleton skeleton--stack" /><div className="skeleton skeleton--lens" /></div></div>}>
      <FindingsWorkspace />
    </Suspense>
  );
}
