"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { canAccessAdmin, getSessionUser } from "@/lib/auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;

    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const sessionUser = getSessionUser(user);

      if (!sessionUser) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      if (pathname.startsWith("/admin") && !canAccessAdmin(sessionUser)) {
        router.replace("/dashboard");
        return;
      }

      if (mounted) {
        setReady(true);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="grid min-h-dvh place-items-center bg-muted">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-label="Loading your career workspace"
        />
      </div>
    );
  }

  return <>{children}</>;
}