"use client";

import { useParams } from "next/navigation";
import { AuditRunScreen } from "@/components/audit-run";

export default function AuditDetailPage() {
  const params = useParams<{ auditId: string }>();
  return <AuditRunScreen auditId={params.auditId} />;
}
