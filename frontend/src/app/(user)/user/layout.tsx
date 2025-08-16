import type { Metadata } from "next";
import Link from "next/link";
import { AuthGate } from "../../../components/AuthGate";
import { LogoutButton } from "../../../components/LogoutButton";

export const metadata: Metadata = {
  title: "User | App",
  description: "User area",
};

export default function UserLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-black/10 dark:border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-fuchsia-600 text-white grid place-items-center">
            <span className="text-sm font-semibold">U</span>
          </div>
          <h1 className="text-lg font-semibold">User</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/user" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/user/profile" className="hover:underline">
            Profile
          </Link>
        </nav>
        <LogoutButton />
      </header>
      <main className="p-6">
        <div className="mx-auto max-w-6xl">
          <AuthGate>{children}</AuthGate>
        </div>
      </main>
    </div>
  );
}
