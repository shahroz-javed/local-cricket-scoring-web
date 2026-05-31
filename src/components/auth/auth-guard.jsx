"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getStoredToken } from "@/lib/auth";
import { Icon } from "@/components/ui/icon";

export function AuthGuard({ children }) {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, user: null, token: null });

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    apiRequest("/api/me", { token })
      .then((user) => setState({ loading: false, user, token }))
      .catch(() => {
        clearAuthSession();
        router.replace("/login");
      });
  }, [router]);

  if (state.loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          {/* Animated cricket ball */}
          <div className="relative flex h-20 w-20 items-center justify-center">
            {/* Outer ring pulse */}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-10" />
            {/* Spinning gradient ring */}
            <span className="absolute h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-primary border-r-primary/40" style={{ animationDuration: "1s" }} />
            {/* Inner icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full cricket-gradient shadow-lg">
              <Icon name="sports_cricket" className="text-2xl text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-display text-base font-bold text-foreground">CricketApp</p>
            <p className="mt-1 text-xs text-foreground-muted">Loading your session…</p>
          </div>
        </div>
      </main>
    );
  }

  return children(state.user, state.token);
}
