"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChartNoAxesCombined,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Target,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { canAccessAdmin, getSessionUser, initials, type SessionUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import {
  primaryNavigation,
  secondaryNavigation,
  type NavigationItem,
} from "./navigation";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
  onClose?: () => void;
};

function NavigationLink({
  item,
  onNavigate,
}: {
  item: NavigationItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

const adminNavigation: NavigationItem[] = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    label: "Overview",
  },
  {
    href: "/admin/cohort-analytics",
    icon: ChartNoAxesCombined,
    label: "Cohort Analytics",
  },
  {
    href: "/admin/skill-benchmarks",
    icon: Target,
    label: "Skill Benchmarks",
  },
  {
    href: "/admin/ai-assessment-studio",
    icon: Sparkles,
    label: "AI Assessment Studio",
  },
  {
    href: "/admin/student-insights",
    icon: UsersRound,
    label: "Student Insights",
  },
];

export function Sidebar({
  className,
  onNavigate,
  onClose,
}: SidebarProps) {
  const router = useRouter();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(getSessionUser(user));
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(getSessionUser(session?.user ?? null));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const role = user?.role ?? "student";
  const admin = role === "placement_officer";
  const allowed = canAccessAdmin(user);
  const userName = user?.fullName || user?.name || "Student";

  async function logout() {
    const supabase = createSupabaseBrowserClient();

    await supabase.auth.signOut();

    setUser(null);
    setOpen(false);
    router.replace("/login");
  }

  function goToStudentWorkspace() {
    if (!allowed) {
      setNotice("Placement access requires an authorized role.");
      return;
    }

    setOpen(false);
    router.push("/dashboard");
  }

  function goToPlacementWorkspace() {
    if (!allowed) {
      setNotice("Placement access requires an authorized role.");
      return;
    }

    setOpen(false);
    router.push("/admin");
  }

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar p-3",
        className
      )}
    >
      <div className="flex items-center justify-between px-2">
        <Brand />

        {onClose && (
          <button
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="mt-7 space-y-6 overflow-y-auto">
        {admin ? (
          <>
            <p className="px-3 text-[10px] font-bold tracking-[.14em] text-muted-foreground">
              PLACEMENT INTELLIGENCE
            </p>

            <nav
              className="space-y-1"
              aria-label="Placement navigation"
            >
              {adminNavigation.map((item) => (
                <NavigationLink
                  key={item.label}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </nav>

            <div className="border-t border-sidebar-border pt-4">
              <button
                onClick={goToStudentWorkspace}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <Target className="size-4" />
                Student Workspace
              </button>
            </div>
          </>
        ) : (
          <>
            <nav
              className="space-y-1"
              aria-label="Primary navigation"
            >
              {primaryNavigation.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  onNavigate={onNavigate}
                />
              ))}
            </nav>

            <div>
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[.12em] text-muted-foreground uppercase">
                Explore
              </p>

              <nav
                className="space-y-1"
                aria-label="Secondary navigation"
              >
                {secondaryNavigation.map((item) => (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </div>
          </>
        )}
      </div>

      {notice && (
        <p
          role="status"
          className="mx-1 mb-2 rounded-lg bg-primary/10 px-2 py-1.5 text-[11px] font-medium text-primary"
        >
          {notice}
        </p>
      )}

      <div className="relative mt-auto border-t border-sidebar-border pt-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-sidebar-accent"
          aria-expanded={open}
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {initials(user)}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">
              {userName}
            </span>

            <span className="block truncate text-xs text-muted-foreground">
              {admin ? "Placement Officer" : "Career learner"}
            </span>
          </span>

          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>

        {open && (
          <div className="absolute bottom-[calc(100%+8px)] left-0 z-30 w-full rounded-xl border border-border bg-popover p-2 shadow-xl">
            {allowed && (
              <>
                <button
                  onClick={goToStudentWorkspace}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  <Target className="size-4 text-primary" />
                  Student Workspace
                </button>

                <button
                  onClick={goToPlacementWorkspace}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
                >
                  <Building2 className="size-4 text-primary" />
                  Placement Officer
                </button>
              </>
            )}

            <button
              onClick={() => {
                setOpen(false);
                router.push("/settings");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <Settings className="size-4" />
              Settings
            </button>

            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}