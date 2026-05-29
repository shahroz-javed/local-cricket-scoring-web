"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { apiRequest } from "@/lib/api";
import { setAuthSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const canResend = useMemo(() => verificationEmail || form.email, [verificationEmail, form.email]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: form,
      });

      setAuthSession(data);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(
        requestError?.data?.errors?.email?.[0] ||
          requestError?.data?.message ||
          "Unable to sign in right now."
      );

      if (requestError?.data?.code === "EMAIL_NOT_VERIFIED") {
        setVerificationEmail(requestError?.data?.email || form.email);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!canResend) {
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      const data = await apiRequest("/api/auth/email/verification-notification", {
        method: "POST",
        body: { email: canResend },
      });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError?.data?.message || "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Sign in after verifying your email address.">
      <div className="space-y-6">
        {message ? <div className="rounded-2xl border border-secondary/20 bg-green-50 px-4 py-3 text-sm text-secondary">{message}</div> : null}
        {error ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Email Address</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">mail</span>
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-12 pr-4 text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Password</label>
              <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
              <input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-12 pr-4 text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="cricket-gradient w-full rounded-xl py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Signing in..." : "Sign In to Dashboard"}
          </button>
        </form>

        {canResend ? (
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resending ? "Sending verification email..." : "Resend verification email"}
          </button>
        ) : null}
      </div>
      <p className="text-center text-sm text-foreground-muted">
        New to the league? <Link href="/register" className="font-semibold text-primary hover:underline">Create an Account</Link>
      </p>
    </AuthShell>
  );
}
