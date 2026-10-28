"use client";

import { useState, type ReactNode } from "react";
import { passwordSignIn, passwordSignUp } from "./actions";

export default function AuthForm({
  next,
  google,
}: {
  next: string;
  google: ReactNode;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const isSignIn = mode === "signin";

  return (
    <div className="auth-panel">
      <div className="auth-tabs" role="tablist" aria-label="Account access">
        <button
          type="button"
          role="tab"
          aria-selected={isSignIn}
          className={isSignIn ? "is-active" : ""}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isSignIn}
          className={!isSignIn ? "is-active" : ""}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>

      <h2 className="auth-title">{isSignIn ? "Welcome back." : "Start your record."}</h2>
      <p className="auth-sub">
        {isSignIn
          ? "Use the email you signed up with, or step into a demo seat below."
          : "One account keeps your deals, checks, and decisions in one place."}
      </p>

      {google}

      {google && (
        <div className="auth-divider">
          <span>or continue with email</span>
        </div>
      )}

      <form action={isSignIn ? passwordSignIn : passwordSignUp} className="auth-email-form">
        <label htmlFor="auth-email">Email address</label>
        <input
          id="auth-email"
          name="email"
          type="email"
          placeholder="you@studio.com"
          autoComplete="email"
          required
        />
        <label htmlFor="auth-password">Password</label>
        <input
          id="auth-password"
          name="password"
          type="password"
          placeholder={isSignIn ? "Your password" : "At least 8 characters"}
          autoComplete={isSignIn ? "current-password" : "new-password"}
          minLength={8}
          required
        />
        <input type="hidden" name="next" value={next} />
        <p className="auth-forgot">
          {isSignIn
            ? "No password reset in this demo. Create a new account or use a demo portal."
            : "By creating an account you agree to the Terms and Privacy Policy."}
        </p>
        <button className="auth-submit" type="submit">
          {isSignIn ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
