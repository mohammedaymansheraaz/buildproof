"use client";

import Link from "next/link";
import { Aperture, ArrowLeft, ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { SignIn, SignUp } from "@clerk/nextjs";
import { useAuthAvailability } from "@/components/app-providers";

export function AuthPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const clerkEnabled = useAuthAvailability();
  const title = mode === "sign-in" ? "Welcome back to the release desk." : "Build a release practice your team can trust.";

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
          <div className="auth-page__trust"><KeyRound size={15} /><span>Security tests remain scoped, reviewed, and non-destructive by default.</span></div>
        </div>
        <div className="auth-card">
          {clerkEnabled ? (
            mode === "sign-in" ? (
              <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
            ) : (
              <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
            )
          ) : (
            <div className="auth-setup-state">
              <span className="auth-setup-state__icon"><KeyRound size={20} /></span>
              <span className="marketing-eyebrow">Clerk keys needed</span>
              <h2>Authentication is ready to connect.</h2>
              <p>Add your Clerk publishable and secret keys to <code>.env</code>, then this screen will render Clerk’s hosted email/password and Google OAuth flows.</p>
              <Link href="/" className="button button--primary">Explore the product <ArrowRight size={16} /></Link>
              <small>Nothing is hand-built here: Clerk owns the credential and OAuth flows.</small>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
