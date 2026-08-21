"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { endSession } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { primaryNavigation, secondaryNavigation, type NavigationItem } from "./navigation";

type SidebarProps = { className?: string; onNavigate?: () => void; onClose?: () => void };

function NavigationLink({ item, onNavigate }: { item: NavigationItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = item.icon;
  return <Link href={item.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined} className={cn("flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50", isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="truncate">{item.label}</span></Link>;
}

export function Sidebar({ className, onNavigate, onClose }: SidebarProps) {
  const router = useRouter();
  function logout() { endSession(); router.replace("/login"); }
  return <aside className={cn("flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar p-3", className)}><div className="flex items-center justify-between px-2"><Brand />{onClose ? <button type="button" onClick={onClose} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden" aria-label="Close navigation menu"><X className="size-4" aria-hidden="true" /></button> : null}</div><div className="mt-7 space-y-6 overflow-y-auto"><nav className="space-y-1" aria-label="Primary navigation">{primaryNavigation.map((item) => <NavigationLink key={item.href} item={item} onNavigate={onNavigate} />)}</nav><div><p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">Explore</p><nav className="space-y-1" aria-label="Secondary navigation">{secondaryNavigation.map((item) => <NavigationLink key={item.href} item={item} onNavigate={onNavigate} />)}</nav></div></div><div className="mt-auto border-t border-sidebar-border pt-3"><button type="button" onClick={() => router.push("/settings")} className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Open profile settings"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">SK</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">Student</span><span className="block truncate text-xs text-muted-foreground">Career learner</span></span><ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" /></button><div className="mt-1 grid grid-cols-2 gap-1 px-1"><button onClick={() => router.push("/settings")} className="flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] text-muted-foreground hover:bg-sidebar-accent"><Settings className="size-3" />Settings</button><button onClick={logout} className="flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] text-muted-foreground hover:bg-sidebar-accent"><LogOut className="size-3" />Log out</button></div></div></aside>;
}
