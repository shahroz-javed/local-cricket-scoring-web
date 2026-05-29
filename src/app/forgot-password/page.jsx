import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot Password?" subtitle="Enter your registered email and we will send reset instructions.">
      <form className="space-y-4">
        <input
          type="email"
          placeholder="name@example.com"
          className="w-full rounded-xl border border-outline-variant bg-surface-low px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <button className="cricket-gradient w-full rounded-xl py-3 text-sm font-semibold text-white">Send Reset Link</button>
      </form>
      <div className="text-center text-sm text-foreground-muted">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-primary">
          Back to Sign In
        </Link>
      </div>
    </AuthShell>
  );
}

