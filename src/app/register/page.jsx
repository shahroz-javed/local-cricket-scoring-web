"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { apiRequest } from "@/lib/api";
import { Icon } from "@/components/ui/icon";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const passwordStrength = useMemo(() => {
    const length = form.password.length;
    if (length >= 12) return { label: "Strong", color: "bg-green-500", active: 4 };
    if (length >= 8) return { label: "Good", color: "bg-yellow-400", active: 3 };
    if (length > 0) return { label: "Weak", color: "bg-red-500", active: 2 };
    return { label: "Empty", color: "bg-surface-container-high", active: 0 };
  }, [form.password]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!termsAccepted) {
      setError("You must accept the terms before registering.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          phone: form.phone,
          password: form.password,
          password_confirmation: form.password_confirmation,
        },
      });

      router.replace(`/email-confirmation?email=${encodeURIComponent(form.email)}&pending=1`);
    } catch (requestError) {
      const fieldErrors = requestError?.data?.errors;
      setError(
        fieldErrors?.name?.[0] ||
          fieldErrors?.email?.[0] ||
          fieldErrors?.password?.[0] ||
          requestError?.data?.message ||
          "Unable to create your account right now."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <AuthShell title="Create Your Account" subtitle="Register first, verify your email, then log in.">
      <div className="w-full max-w-lg">
        {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">First Name</label>
              <div className="relative">
                <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input type="text" placeholder="Rohit" value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-3 text-sm text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Last Name</label>
              <div className="relative">
                <Icon name="person" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input type="text" placeholder="Sharma" value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-3 text-sm text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Email Address</label>
            <div className="relative">
              <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input type="email" placeholder="name@example.com" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-3 text-sm text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Phone Number</label>
            <div className="relative">
              <Icon name="phone" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
              <input type="tel" placeholder="+92 300 1234567" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-3 text-sm text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Password</label>
              <div className="relative">
                <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input type="password" placeholder="Minimum 8 characters" value={form.password} onChange={(event) => updateField("password", event.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-3 text-sm text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-foreground">Confirm</label>
              <div className="relative">
                <Icon name="lock_reset" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                <input type="password" placeholder="Repeat password" value={form.password_confirmation} onChange={(event) => updateField("password_confirmation", event.target.value)} className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-3 text-sm text-foreground placeholder-outline transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary" required />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className={`h-1 flex-1 rounded-full ${index < passwordStrength.active ? passwordStrength.color : "bg-surface-container-high"}`} />
              ))}
            </div>
            <span className="text-xs font-semibold text-foreground-muted">{passwordStrength.label}</span>
          </div>

          <div className="flex items-start gap-3">
            <input className="mt-0.5 h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary" id="terms" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} />
            <label className="text-xs leading-relaxed text-foreground-muted" htmlFor="terms">
              I agree to CricketApp&apos;s <Link href="#" className="font-semibold text-primary hover:underline">Terms of Service</Link> and <Link href="#" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <button type="submit" disabled={submitting} className="cricket-gradient w-full rounded-xl py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70">
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground-muted">Already have an account? <Link href="/login" className="font-semibold text-primary hover:underline">Sign In</Link></p>
      </div>
    </AuthShell>
  );
}
