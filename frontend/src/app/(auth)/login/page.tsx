"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../../lib/config";
import { saveAccessToken, decodeJwt, routeForRoles } from "../../../lib/auth";

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const nextErrors: typeof errors = {};
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email";
    if (!password) nextErrors.password = "Password is required";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Sign in failed");
      }
      const data = (await res.json()) as { accessToken: string };
      saveAccessToken(data.accessToken, false);
      const payload = decodeJwt<{ roles?: string[] }>(data.accessToken);
      const dest = routeForRoles(payload?.roles);
      router.push(dest);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-neutral-500 mt-1">
          New here? {" "}
          <Link href="/signup" className="text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby="email-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="text-xs text-indigo-600 hover:underline"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <a href="#" className="text-sm text-neutral-500 hover:underline">
            Forgot password?
          </a>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-foreground text-background px-4 py-2 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        {message && (
          <p className="text-sm text-green-600" role="status">
            {message}
          </p>
        )}
      </form>

      <div className="mt-6">
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-black/10 dark:border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-transparent px-2 text-neutral-500">or continue with</span>
          </div>
        </div>
        <a
          href={`${API_BASE}/auth/google`}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10"
        >
          Continue with Google
        </a>
      </div>

      <p className="text-xs text-neutral-500 mt-6">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
