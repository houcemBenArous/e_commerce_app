"use client";

import { useRouter } from "next/navigation";
import { attemptRefresh, clearTokens, getAccessToken } from "../lib/auth";
import { API_BASE } from "../lib/config";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        let at = getAccessToken();
        if (!at) {
          at = await attemptRefresh();
        }
        if (at) {
          try {
            await fetch(`${API_BASE}/auth/logout`, {
              method: "POST",
              headers: { Authorization: `Bearer ${at}` },
              credentials: "include",
            });
          } catch {}
        }
        clearTokens();
        router.replace("/login");
      }}
      className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
    >
      Logout
    </button>
  );
}
