"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { UserContext } from "@/lib/user-context";
import { apiRequest } from "@/lib/api";
import { clearAuthSession, getStoredToken } from "@/lib/auth";

export default function AppLayout({ children }) {
  const router = useRouter();

  async function handleSignOut(token) {
    try {
      if (token) {
        await apiRequest("/api/auth/logout", { method: "POST", token });
      }
    } catch {
      // clear local session even if API call fails
    } finally {
      clearAuthSession();
      router.replace("/login");
    }
  }

  return (
    <AuthGuard>
      {(user, token) => (
        <UserContext.Provider value={{ user, token, signOut: () => handleSignOut(token) }}>
          {children}
        </UserContext.Provider>
      )}
    </AuthGuard>
  );
}
