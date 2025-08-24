"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../lib/config";
import { saveAccessToken, decodeJwt, routeForRoles } from "../../lib/auth";

export default function VerifyPage() {
  const params = useSearchParams();
  const router = useRouter();
  const verificationId = params.get("id") || "";
  const email = params.get("email") || "";
  const source = params.get("source") || "local";
  const expParam = params.get("exp");
  const EXPIRED_MSG = "The code has expired. Please request a new code.";

  const [expiresAt, setExpiresAt] = useState<Date | null>(expParam ? new Date(expParam) : null);
  const [remainingSec, setRemainingSec] = useState<number>(() => {
    if (!expParam) return 0;
    const dt = new Date(expParam);
    return Math.max(0, Math.floor((dt.getTime() - Date.now()) / 1000));
  });
  const [initialized, setInitialized] = useState<boolean>(Boolean(expParam));

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setError("");
    setMessage("");
  }, [code]);

  // Tick remaining seconds until expiry
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const s = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setRemainingSec(s);
    };
    update();
    const iv = setInterval(update, 1000);
    setInitialized(true);
    return () => clearInterval(iv);
  }, [expiresAt]);

  // Computed expiry flag used for UI and validation
  const isExpired = useMemo(() => Boolean(expiresAt) && initialized && remainingSec === 0, [expiresAt, remainingSec, initialized]);

  const title = useMemo(() => {
    return source === "google" ? "Verify your email to continue with Google" : "Verify your email";
  }, [source]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code sent to your email");
      return;
    }
    if (isExpired) {
      setError(EXPIRED_MSG);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verificationId, code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Verification failed");
      }
      const data = (await res.json()) as { accessToken: string };
      saveAccessToken(data.accessToken, false);
      const payload = decodeJwt<{ roles?: string[] }>(data.accessToken);
      const dest = routeForRoles(payload?.roles);
      router.replace(dest);
    } catch (e: any) {
      setError(e?.message || "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError("");
    setMessage("");
    setResending(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ verificationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Could not resend code");
      }
      const data = (await res.json()) as { ok?: boolean; expiresAt?: string; ttlSec?: number };
      if (data?.expiresAt) {
        const dt = new Date(data.expiresAt);
        setExpiresAt(dt);
        setRemainingSec(Math.max(0, Math.floor((dt.getTime() - Date.now()) / 1000)));
        setInitialized(true);
      }
      setMessage("We sent a new code to your email.");
    } catch (e: any) {
      setError(e?.message || "Could not resend code");
    } finally {
      setResending(false);
    }
  }

  if (!verificationId) {
    return (
      <div className="mx-auto w-full">
        <h1 className="text-2xl font-semibold">Verification session not found</h1>
        <p className="text-sm text-neutral-500 mt-2">Please restart signup or Google login.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {email && (
          <p className="text-sm text-neutral-500 mt-1">We sent a 6-digit code to {email}.</p>
        )}
        {expiresAt && (
          <p className="text-xs text-neutral-500 mt-1">
            Code expires in {String(Math.floor(remainingSec / 60)).padStart(1, "0")}:
            {String(remainingSec % 60).padStart(2, "0")}.
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            Verification code
          </label>
          <input
            id="code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest text-center text-lg"
            placeholder="123456"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || code.length !== 6 || isExpired}
          className="w-full rounded-xl bg-foreground text-background px-4 py-2 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        >
          {submitting ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="w-full rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>

        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : isExpired ? (
          <p className="text-sm text-red-600">{EXPIRED_MSG}</p>
        ) : null}
        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
}
