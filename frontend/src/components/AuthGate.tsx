"use client";

import { PropsWithChildren, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt, getAccessToken, routeForRoles } from "../lib/auth";

export function AuthGate({ children, requireAdmin = false }: PropsWithChildren<{ requireAdmin?: boolean }>) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const payload = decodeJwt<{ roles?: string[] }>(token);
    const roles = payload?.roles || [];

    if (requireAdmin && !roles.includes("admin")) {
      // Redirect to the appropriate area if not admin
      router.replace(routeForRoles(roles));
      return;
    }

    setReady(true);
  }, [router, requireAdmin]);

  if (!ready) {
    return (
      <div className="p-6 text-sm text-neutral-500">Checking authentication…</div>
    );
  }

  return <>{children}</>;
}
