"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { AuthGuard } from "./auth-guard";

export function AppShell({ children, title }: { children: ReactNode; title: string }) {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  return <AuthGuard><Dialog.Root open={isNavigationOpen} onOpenChange={setIsNavigationOpen}><div className="flex min-h-dvh bg-muted/70"><Sidebar className="fixed inset-y-0 left-0 z-20 hidden lg:flex" /><Dialog.Portal><Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-[1px] lg:hidden" /><Dialog.Popup className="fixed inset-y-0 left-0 z-50 lg:hidden" aria-label="Navigation menu"><Sidebar className="shadow-xl" onClose={() => setIsNavigationOpen(false)} onNavigate={() => setIsNavigationOpen(false)} /></Dialog.Popup></Dialog.Portal><div className="flex min-w-0 flex-1 flex-col lg:pl-64"><Header title={title} onOpenNavigation={() => setIsNavigationOpen(true)} /><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7">{children}</main></div></div></Dialog.Root></AuthGuard>;
}
