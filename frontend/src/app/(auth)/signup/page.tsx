"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../../lib/config";
import { saveAccessToken, decodeJwt, routeForRoles } from "../../../lib/auth";

function validateEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agree?: string;
  }>({});
  const [message, setMessage] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");

    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email";
    if (password.length < 8)
      nextErrors.password = "Password must be at least 8 characters";
    if (confirmPassword !== password)
      nextErrors.confirmPassword = "Passwords do not match";
    if (!agree) nextErrors.agree = "You must accept the terms";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Sign up failed");
      }
      const data = (await res.json()) as { accessToken: string };
      // Default to remember on signup
      saveAccessToken(data.accessToken, true);
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
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Already have an account? {" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby="name-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Jane Doe"
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            aria-describedby="password-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="At least 8 characters"
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby="confirm-password-error"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && (
            <p id="confirm-password-error" className="text-sm text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            id="agree"
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 size-4 accent-indigo-600"
          />
          <label htmlFor="agree" className="text-sm text-neutral-700 dark:text-neutral-300">
            I agree to the {" "}
            <a href="#" className="text-indigo-600 hover:underline">Terms</a> and {" "}
            <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
          </label>
        </div>
        {errors.agree && (
          <p className="text-sm text-red-600">{errors.agree}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-foreground text-background px-4 py-2 font-medium transition disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>

        {message && (
          <p className="text-sm text-green-600" role="status">
            {message}
          </p>
        )}
      </form>

      <p className="text-xs text-neutral-500 mt-6">
        We will never share your email. You can delete your account at any time.
      </p>
    </div>
  );
}
