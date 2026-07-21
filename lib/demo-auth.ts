/**
 * Presentation-only local credentials. These are never sent to a server and
 * are deliberately rendered only while no Supabase/Clerk provider is enabled.
 */
export const demoCredentials = {
  email: "demo@buildproof.local",
  password: "buildproof-demo",
} as const;

export const demoAuthStorageKey = "buildproof.demo-authenticated";
