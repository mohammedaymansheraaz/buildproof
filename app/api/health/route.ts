import { NextResponse } from "next/server";
import { getIntegrationStatus, publicConfig } from "@/lib/config";

export function GET() {
  const integrations = getIntegrationStatus();
  const connected = Object.entries(integrations)
    .filter(([key]) => key !== "demoMode")
    .some(([, value]) => value);

  return NextResponse.json({
    ok: true,
    mode: publicConfig.demoMode ? "demo" : connected ? "connected" : "demo",
    integrations,
    timestamp: new Date().toISOString(),
  });
}
