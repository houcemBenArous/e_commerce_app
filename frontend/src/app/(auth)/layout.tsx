import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auth | App",
  description: "Authentication pages",
};

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <aside className="relative hidden lg:flex lg:sticky lg:top-0 lg:h-screen flex-col items-start justify-start overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700 text-white">
        {/* Decorative background */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -right-16 h-64 w-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_60%)]" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-lg p-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-white/15 grid place-items-center backdrop-blur-sm">
              <span className="text-xl" aria-hidden>🚀</span>
            </div>
            <span className="text-white/90 text-sm">Welcome</span>
          </div>
          <h2 className="text-4xl font-semibold leading-tight">Welcome to App</h2>
          <p className="mt-4 text-white/90">
            Build your next big thing with confidence. Sign in or create an account to get started.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">Modern UI</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-sm">Clean & Minimal</span>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
