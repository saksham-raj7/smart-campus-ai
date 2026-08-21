"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter(); const pathname = usePathname(); const [ready, setReady] = useState(false);
  useEffect(() => { if (!getSession()) { router.replace(`/login?next=${encodeURIComponent(pathname)}`); return; } const timer = window.setTimeout(() => setReady(true), 0); return () => window.clearTimeout(timer); }, [pathname, router]);
  if (!ready) return <div className="grid min-h-dvh place-items-center bg-muted"><div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading your career workspace" /></div>;
  return <>{children}</>;
}
