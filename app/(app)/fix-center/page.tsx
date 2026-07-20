import { Suspense } from "react";
import { FixCenter } from "@/components/fix-center";

export default function FixCenterPage() {
  return <Suspense fallback={null}><FixCenter /></Suspense>;
}
