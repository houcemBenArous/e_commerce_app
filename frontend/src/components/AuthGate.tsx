"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { attemptRefresh, decodeJwt, getAccessToken, routeForRoles, saveAccessToken } from "../lib/auth";

export function AuthGate({ children, requireAdmin = false }: PropsWithChildren<{ requireAdmin?: boolean }>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ensureAuth = async () => {
      let token = getAccessToken();
      let payload = token ? decodeJwt<{ roles?: string[]; exp?: number }>(token) : null;
      const now = Math.floor(Date.now() / 1000);

      if (!token || (payload?.exp && payload.exp <= now)) {
        const refreshed = await attemptRefresh();
        if (!refreshed) {
          router.replace("/login");
          return;
        }
        token = refreshed;
        payload = decodeJwt<{ roles?: string[] }>(token);
        // Persist in session for this tab
        saveAccessToken(token, false);
      }

      const roles = payload?.roles || [];

    if (requireAdmin && !roles.includes("admin")) {
      // Redirect to the appropriate area if not admin
      router.replace(routeForRoles(roles));
      return;
    }

    setReady(true);
    };
    void ensureAuth();
  }, [router, requireAdmin]);

  if (!ready) {
    return (
      <div className="p-6 text-sm text-neutral-500">Checking authentication…</div>
    );
  }

  return <>{children}</>;
}
