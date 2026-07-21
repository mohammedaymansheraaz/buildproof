"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Aperture, ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LoaderCircle, ShieldCheck, UserRound } from "lucide-react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useAuthProvider } from "@/components/app-providers";
import { demoAuthStorageKey, demoCredentials } from "@/lib/demo-auth";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useSupabaseConfig } from "@/components/supabase-config-provider";
import styles from "./auth-page.module.css";

export type AuthPageMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

type FormState = "idle" | "submitting" | "success" | "error";

function callbackUrl(nextPath: "/dashboard" | "/reset-password") {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

function getAuthErrorFromUrl() {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("auth_error");
}

export function AuthPage({ mode }: { mode: AuthPageMode }) {
  const authProvider = useAuthProvider();
  const title = mode === "sign-in"
    ? "Welcome back to the release desk."
    : mode === "sign-up"
      ? "Build a release practice your team can trust."
      : mode === "forgot-password"
        ? "Recover access without slowing the release."
        : "Set a new password for your release desk.";

  return (
    <main className="auth-page">
      <div className="auth-page__atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <header className="auth-page__header">
        <Link href="/" className="auth-brand"><span><Aperture size={18} /></span>BuildProof</Link>
        <Link href="/" className="auth-back"><ArrowLeft size={14} /> Back to overview</Link>
      </header>
      <section className="auth-page__content">
        <div className="auth-page__intro">
          <span className="marketing-eyebrow"><ShieldCheck size={13} />Authorized release assurance</span>
          <h1>{title}</h1>
          <p>Connect a repository, define the product promise, and turn release risk into evidence your team can act on.</p>
          <div className="auth-page__trust"><KeyRound size={15} /><span>Passwords are handled by your configured identity provider. Security tests remain scoped, reviewed, and non-destructive by default.</span></div>
        </div>
        <div className={`auth-card ${styles.authPanel}`}>
          {authProvider === "supabase" ? <SupabaseAuthPanel mode={mode} /> : null}
          {authProvider === "clerk" ? <ClerkAuthPanel mode={mode} /> : null}
          {authProvider === "demo" ? <DemoAuthPanel mode={mode} /> : null}
        </div>
      </section>
    </main>
  );
}

function ClerkAuthPanel({ mode }: { mode: AuthPageMode }) {
  if (mode === "sign-in") {
    return <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />;
  }

  if (mode === "sign-up") {
    return <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />;
  }

  return (
    <div className="auth-setup-state">
      <span className="auth-setup-state__icon"><KeyRound size={20} /></span>
      <span className="marketing-eyebrow">Identity provider active</span>
      <h2>Continue through the secure sign-in flow.</h2>
      <p>Use the recovery link in the configured provider’s sign-in screen. Supabase password recovery becomes available as soon as Supabase Auth is enabled.</p>
      <Link href="/sign-in" className="button button--primary">Open sign in <ArrowRight size={16} /></Link>
    </div>
  );
}

function SupabaseAuthPanel({ mode }: { mode: AuthPageMode }) {
  const router = useRouter();
  const config = useSupabaseConfig();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = getAuthErrorFromUrl();
    if (error) {
      setState("error");
      setMessage("We could not finish the secure sign-in link. Please request a new link and try again.");
    }
  }, []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const supabase = createBrowserSupabaseClient(config);
    if (!supabase) {
      setState("error");
      setMessage("Supabase authentication is not configured for this deployment.");
      return;
    }

    if (mode === "sign-up" || mode === "reset-password") {
      if (password.length < 10) {
        setState("error");
        setMessage("Use a password with at least 10 characters.");
        return;
      }
      if (password !== confirmation) {
        setState("error");
        setMessage("The password confirmation does not match.");
        return;
      }
    }

    setState("submitting");
    setMessage(null);

    try {
      if (mode === "sign-in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      if (mode === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: fullName ? { full_name: fullName } : undefined,
            emailRedirectTo: callbackUrl("/dashboard"),
          },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }
        setState("success");
        setMessage("Check your inbox to verify this email, then return to your release desk.");
        return;
      }

      if (mode === "forgot-password") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl("/reset-password"),
        });
        if (error) throw error;
        setState("success");
        setMessage("If an account exists for that address, a recovery link is on its way.");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setState("success");
      setMessage("Password updated. Taking you back to the release desk…");
      window.setTimeout(() => {
        router.replace("/dashboard");
        router.refresh();
      }, 650);
    } catch {
      setState("error");
      setMessage(mode === "forgot-password"
        ? "We could not send a recovery link. Check the address and try again."
        : mode === "reset-password"
          ? "We could not update the password. Open a fresh recovery link and try again."
          : "We could not complete that request. Check your details and try again.");
    }
  };

  const signInWithGoogle = async () => {
    const supabase = createBrowserSupabaseClient(config);
    if (!supabase) return;
    setState("submitting");
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl("/dashboard") },
    });
    if (error) {
      setState("error");
      setMessage("Google sign-in is not enabled for this Supabase project yet.");
    }
  };

  const continueAsGuest = async () => {
    const supabase = createBrowserSupabaseClient(config);
    if (!supabase) {
      setState("error");
      setMessage("Supabase authentication is not configured for this deployment.");
      return;
    }

    setState("submitting");
    setMessage(null);

    try {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null) as { email?: string; password?: string; error?: string } | null;
      if (!response.ok || !payload?.email || !payload.password) {
        throw new Error(payload?.error ?? "BuildProof could not prepare a guest session.");
      }
      const { error } = await supabase.auth.signInWithPassword({ email: payload.email, password: payload.password });
      if (error) throw error;
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Guest access could not be opened. Use email sign-in instead.");
    }
  };

  const isPasswordScreen = mode === "sign-in" || mode === "sign-up" || mode === "reset-password";
  const submitLabel = mode === "sign-in"
    ? "Sign in"
    : mode === "sign-up"
      ? "Create account"
      : mode === "forgot-password"
        ? "Send recovery link"
        : "Update password";

  return (
    <div className="buildproof-auth-form">
      <div className="buildproof-auth-form__heading">
        <span className="marketing-eyebrow">Supabase Auth</span>
        <h2>{mode === "sign-in" ? "Sign in to BuildProof" : mode === "sign-up" ? "Create your release desk" : mode === "forgot-password" ? "Reset your password" : "Choose a new password"}</h2>
        <p>{mode === "forgot-password" ? "We’ll send a secure recovery link if an account is available." : mode === "reset-password" ? "Use a unique password with at least 10 characters." : "Email/password is active. Google OAuth appears when it is enabled in Supabase."}</p>
      </div>

      {mode === "sign-in" || mode === "sign-up" ? (
        <div className="auth-fast-actions">
          <button className="auth-oauth-button" type="button" disabled={state === "submitting"} onClick={signInWithGoogle}>
            <GoogleMark /> Continue with Google
          </button>
          <button className="auth-oauth-button auth-guest-button" type="button" disabled={state === "submitting"} onClick={() => void continueAsGuest()}>
            <UserRound size={16} /> Continue as guest
          </button>
        </div>
      ) : null}

      {mode === "sign-in" || mode === "sign-up" ? <div className="auth-divider"><span>or continue with email</span></div> : null}

      <form className="auth-form-fields" onSubmit={submit}>
        {mode === "sign-up" ? (
          <label>
            <span>Name <small>optional</small></span>
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" placeholder="Release owner" />
          </label>
        ) : null}
        {mode !== "reset-password" ? (
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@company.com" required />
          </label>
        ) : null}
        {isPasswordScreen ? (
          <label>
            <span>{mode === "reset-password" ? "New password" : "Password"}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"} minLength={mode === "sign-in" ? 1 : 10} required />
          </label>
        ) : null}
        {mode === "sign-up" || mode === "reset-password" ? (
          <label>
            <span>Confirm password</span>
            <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" minLength={10} required />
          </label>
        ) : null}
        <button className="button button--primary auth-submit" type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? <LoaderCircle size={16} className="auth-spinner" /> : null}
          {submitLabel} {state !== "submitting" ? <ArrowRight size={16} /> : null}
        </button>
      </form>

      {message ? <p className={`auth-form-message auth-form-message--${state}`} role="status">{state === "success" ? <CheckCircle2 size={14} /> : null}{message}</p> : null}

      <div className="auth-form-links">
        {mode === "sign-in" ? <><Link href="/forgot-password">Forgot password?</Link><span>·</span><Link href="/sign-up">Create an account</Link></> : null}
        {mode === "sign-up" ? <span>Already have an account? <Link href="/sign-in">Sign in</Link></span> : null}
        {mode === "forgot-password" ? <Link href="/sign-in">Back to sign in</Link> : null}
        {mode === "reset-password" ? <Link href="/sign-in">Back to sign in</Link> : null}
      </div>
    </div>
  );
}

function DemoAuthPanel({ mode }: { mode: AuthPageMode }) {
  const router = useRouter();
  const [email, setEmail] = useState<string>(demoCredentials.email);
  const [password, setPassword] = useState<string>(demoCredentials.password);
  const [message, setMessage] = useState<string | null>(null);

  const submitDemo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email !== demoCredentials.email || password !== demoCredentials.password) {
      setMessage("Use the local demo credentials shown below.");
      return;
    }
    window.localStorage.setItem(demoAuthStorageKey, "true");
    router.push("/dashboard");
  };

  if (mode === "forgot-password" || mode === "reset-password") {
    return (
      <div className="auth-setup-state">
        <span className="auth-setup-state__icon"><KeyRound size={20} /></span>
        <span className="marketing-eyebrow">Local demo mode</span>
        <h2>Demo passwords are not real accounts.</h2>
        <p>This local presentation mode sends no email and stores no credentials. Configure Supabase Auth to enable secure password recovery.</p>
        <Link href="/sign-in" className="button button--primary">Use demo workspace <ArrowRight size={16} /></Link>
      </div>
    );
  }

  return (
    <div className="buildproof-auth-form">
      <div className="buildproof-auth-form__heading">
        <span className="marketing-eyebrow">Local presentation mode</span>
        <h2>{mode === "sign-up" ? "Try the demo release desk" : "Enter the demo release desk"}</h2>
        <p>This is not production authentication. It only opens the local demo so you can explore the product before connecting Supabase.</p>
      </div>
      <form className="auth-form-fields" onSubmit={submitDemo}>
        <label>
          <span>Demo email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required />
        </label>
        <label>
          <span>Demo password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
        </label>
        <button className="button button--primary auth-submit" type="submit">Open demo workspace <ArrowRight size={16} /></button>
      </form>
      {message ? <p className="auth-form-message auth-form-message--error" role="status">{message}</p> : null}
      <p className="auth-demo-note"><strong>Local credentials</strong><code>{demoCredentials.email}</code><code>{demoCredentials.password}</code></p>
    </div>
  );
}

function GoogleMark() {
  return <span className="google-mark" aria-hidden="true">G</span>;
}
