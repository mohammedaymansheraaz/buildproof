export const publicConfig = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  demoMode: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
};

export function isDemoAuditMode() {
  return process.env.AUDIT_MODE === undefined || process.env.AUDIT_MODE === "demo";
}

export function getIntegrationStatus() {
  return {
    demoMode: publicConfig.demoMode,
    openai: Boolean(process.env.OPENAI_API_KEY),
    github: Boolean(process.env.GITHUB_TOKEN || process.env.GITHUB_APP_ID),
    database: Boolean(process.env.DATABASE_URL),
    runner: Boolean(process.env.AUDIT_RUNNER_URL && process.env.AUDIT_RUNNER_TOKEN),
    storage: Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID),
  };
}
