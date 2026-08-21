import { ArrowUpRight, BookOpen, Sparkles, Target } from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";

const nextSteps = [
  { icon: Target, title: "Map your target role", description: "Define where you are headed and the skills that matter most." },
  { icon: BookOpen, title: "Build a focused plan", description: "Turn career goals into deliberate practice and learning." },
  { icon: Sparkles, title: "Practice with AI", description: "Get thoughtful support as you prepare for opportunities." },
];

export default function Home() {
  return <AppShell title="Dashboard"><div className="mx-auto flex w-full max-w-6xl flex-col gap-8"><section className="overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="max-w-2xl"><p className="mb-3 text-sm font-medium text-muted-foreground">Welcome to AI Career OS</p><h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Your career command center starts here.</h2><p className="mt-4 max-w-xl text-pretty leading-7 text-muted-foreground">Build clarity around your next career move, strengthen the right skills, and prepare with confidence.</p></div><div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground"><span className="h-px w-8 bg-border" />Dashboard</div></section><section aria-labelledby="getting-started-title"><div className="mb-4"><h2 id="getting-started-title" className="text-lg font-semibold tracking-tight">Set your direction</h2><p className="mt-1 text-sm text-muted-foreground">The core tools for your career journey will live here.</p></div><div className="grid gap-4 md:grid-cols-3">{nextSteps.map((step) => { const Icon = step.icon; return <article key={step.title} className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/20"><span className="mb-5 flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span><h3 className="font-medium tracking-tight">{step.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">Coming soon <ArrowUpRight className="size-3.5" aria-hidden="true" /></span></article>; })}</div></section></div></AppShell>;
}
