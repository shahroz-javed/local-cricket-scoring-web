"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { apiRequest } from "@/lib/api";

function EmailConfirmationContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status"); // "verified" | "invalid" | null
  const email = searchParams.get("email") || "";
  const pending = searchParams.get("pending");

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null); // "sent" | "error"
  const [resendMessage, setResendMessage] = useState("");

  const isVerified = status === "verified";
  const isInvalid = status === "invalid";
  const isPending = !status && pending;

  async function handleResend() {
    if (!email) {
      setResendStatus("error");
      setResendMessage("Missing email address. Go back to register and try again.");
      return;
    }

    setResending(true);
    setResendStatus(null);

    try {
      const data = await apiRequest("/api/auth/email/verification-notification", {
        method: "POST",
        body: { email },
      });
      setResendStatus("sent");
      setResendMessage(data.message || "Verification email sent. Check your inbox.");
    } catch (requestError) {
      setResendStatus("error");
      setResendMessage(requestError?.data?.message || "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell title="Email Confirmation" subtitle="Verify your email before your first login.">
      <div className="space-y-5">
        {/* Main status banner */}
        <div
          className={`rounded-2xl px-4 py-4 text-sm ${
            isVerified
              ? "border border-secondary/20 bg-green-50 text-secondary"
              : isInvalid
              ? "border border-red-200 bg-red-50 text-red-700"
              : "border border-outline-variant bg-surface-low text-foreground-muted"
          }`}
        >
          {isVerified
            ? "Your email has been verified successfully. You can now log in."
            : isInvalid
            ? "This verification link is invalid or has expired. Request a new one below."
            : isPending
            ? "Account created! Check your email and click the verification link before logging in."
            : "Check your inbox for the verification link."}
        </div>

        {/* Resend feedback */}
        {resendStatus ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              resendStatus === "sent"
                ? "border border-secondary/20 bg-green-50 text-secondary"
                : "border border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {resendMessage}
          </div>
        ) : null}

        {email ? (
          <p className="text-sm text-foreground-muted">
            Email: <span className="font-semibold text-foreground">{email}</span>
          </p>
        ) : null}

        {!isVerified ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full rounded-xl border border-outline-variant px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-70"
          >
            {resending ? "Sending verification email..." : "Resend verification email"}
          </button>
        ) : null}

        <Link
          href="/login"
          className="block w-full rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Go to Login
        </Link>
      </div>
    </AuthShell>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Email Confirmation" subtitle="Verify your email before your first login.">
          <div className="rounded-2xl border border-outline-variant bg-surface-low px-4 py-4 text-sm text-foreground-muted">
            Loading...
          </div>
        </AuthShell>
      }
    >
      <EmailConfirmationContent />
    </Suspense>
  );
}
