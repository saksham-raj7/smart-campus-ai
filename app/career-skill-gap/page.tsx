"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SkillRadar } from "@/components/ui/skill-radar";

type SkillStatus = "strong" | "improving" | "attention";

type Skill = {
  name: string;
  current: number;
  required: number;
  status: SkillStatus;
};

type RoleAnalysis = {
  readiness: number;
  skills: Skill[];
  priorities: Array<{ skill: string; detail: string; impact: string }>;
};

const roleOptions = ["Software Engineer", "Data Analyst", "Product Manager", "UI/UX Designer"];

// Frontend demo data only. Replace this record with a role-analysis API response later.
const demoAnalyses: Record<string, RoleAnalysis> = {
  "Software Engineer": {
    readiness: 68,
    skills: [
      { name: "JavaScript & TypeScript", current: 78, required: 75, status: "strong" },
      { name: "Problem solving", current: 74, required: 80, status: "improving" },
      { name: "React fundamentals", current: 69, required: 75, status: "improving" },
      { name: "Data structures", current: 52, required: 78, status: "attention" },
      { name: "System design", current: 38, required: 70, status: "attention" },
      { name: "Interview communication", current: 46, required: 72, status: "attention" },
    ],
    priorities: [
      { skill: "System design", detail: "Learn the building blocks behind scalable applications.", impact: "32-point gap" },
      { skill: "Data structures", detail: "Build fluency with arrays, trees, graphs, and complexity.", impact: "26-point gap" },
      { skill: "Interview communication", detail: "Turn clear thinking into concise, structured answers.", impact: "26-point gap" },
    ],
  },
  "Data Analyst": {
    readiness: 64,
    skills: [
      { name: "Spreadsheet analysis", current: 82, required: 75, status: "strong" },
      { name: "SQL fundamentals", current: 66, required: 78, status: "improving" },
      { name: "Data storytelling", current: 62, required: 76, status: "improving" },
      { name: "Python for analysis", current: 45, required: 74, status: "attention" },
      { name: "Dashboard design", current: 42, required: 70, status: "attention" },
      { name: "Statistical reasoning", current: 48, required: 72, status: "attention" },
    ],
    priorities: [
      { skill: "Python for analysis", detail: "Use pandas to clean, explore, and summarize real datasets.", impact: "29-point gap" },
      { skill: "Dashboard design", detail: "Practice turning metrics into a clear decision-making view.", impact: "28-point gap" },
      { skill: "Statistical reasoning", detail: "Build confidence in trends, samples, and hypothesis testing.", impact: "24-point gap" },
    ],
  },
  "Product Manager": {
    readiness: 61,
    skills: [
      { name: "User empathy", current: 76, required: 72, status: "strong" },
      { name: "Written communication", current: 68, required: 78, status: "improving" },
      { name: "Prioritization", current: 60, required: 76, status: "improving" },
      { name: "Product metrics", current: 39, required: 72, status: "attention" },
      { name: "Market research", current: 45, required: 74, status: "attention" },
      { name: "Stakeholder management", current: 47, required: 70, status: "attention" },
    ],
    priorities: [
      { skill: "Product metrics", detail: "Learn to connect product choices with measurable outcomes.", impact: "33-point gap" },
      { skill: "Market research", detail: "Practice identifying customer needs and competitor patterns.", impact: "29-point gap" },
      { skill: "Stakeholder management", detail: "Build alignment through crisp updates and trade-offs.", impact: "23-point gap" },
    ],
  },
  "UI/UX Designer": {
    readiness: 66,
    skills: [
      { name: "Visual design", current: 80, required: 75, status: "strong" },
      { name: "Figma proficiency", current: 72, required: 78, status: "improving" },
      { name: "Interaction design", current: 64, required: 76, status: "improving" },
      { name: "User research", current: 43, required: 74, status: "attention" },
      { name: "Design systems", current: 44, required: 70, status: "attention" },
      { name: "Design rationale", current: 49, required: 72, status: "attention" },
    ],
    priorities: [
      { skill: "User research", detail: "Practice interviews and turn observations into useful insights.", impact: "31-point gap" },
      { skill: "Design systems", detail: "Learn to create consistent, reusable UI patterns.", impact: "26-point gap" },
      { skill: "Design rationale", detail: "Explain your decisions through user needs and outcomes.", impact: "23-point gap" },
    ],
  },
};

const statusStyles: Record<SkillStatus, { label: string; chip: string; bar: string }> = {
  strong: { label: "Strong", chip: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-500" },
  improving: { label: "Improving", chip: "bg-amber-50 text-amber-700", bar: "bg-amber-500" },
  attention: { label: "Needs attention", chip: "bg-rose-50 text-rose-700", bar: "bg-rose-500" },
};

function SkillRow({ skill }: { skill: Skill }) {
  const gap = Math.max(skill.required - skill.current, 0);
  const style = statusStyles[skill.status];

  return (
    <li className="rounded-lg border border-border p-3.5 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="text-sm font-medium">{skill.name}</p><p className="mt-0.5 text-xs text-muted-foreground">Current confidence: {skill.current}% · Required: {skill.required}%</p></div>
        <span className={cn("rounded-md px-2 py-1 text-[11px] font-medium", style.chip)}>{style.label}</span>
      </div>
      <div className="mt-3 flex items-center gap-3"><div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${skill.name} current proficiency`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.current}><div className={cn("h-full rounded-full", style.bar)} style={{ width: `${skill.current}%` }} /><span className="absolute inset-y-0 w-0.5 bg-foreground/45" style={{ left: `${skill.required}%` }} aria-hidden="true" /></div><span className="w-18 text-right text-xs font-medium text-muted-foreground">{gap === 0 ? "On target" : `${gap}% gap`}</span></div>
    </li>
  );
}

function SkillsGroup({ title, description, status, skills }: { title: string; description: string; status: SkillStatus; skills: Skill[] }) {
  const Icon = status === "strong" ? CheckCircle2 : status === "improving" ? TrendingUp : CircleAlert;
  const style = statusStyles[status];

  return <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="flex items-start gap-3"><span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", style.chip)}><Icon className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{description}</p></div></div><ul className="mt-4 space-y-3">{skills.map((skill) => <SkillRow key={skill.name} skill={skill} />)}</ul></section>;
}

function AnalysisSkeleton() {
  return <div className="grid gap-4 lg:grid-cols-3" aria-label="Analyzing skill gap" aria-live="polite">{[0, 1, 2].map((item) => <div key={item} className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="h-8 w-8 rounded-lg bg-muted" /><div className="mt-4 h-4 w-24 rounded bg-muted" /><div className="mt-2 h-3 w-44 rounded bg-muted" /><div className="mt-5 space-y-3">{[0, 1].map((row) => <div key={row} className="h-25 rounded-lg bg-muted/70" />)}</div></div>)}</div>;
}

export default function CareerSkillGapPage() {
  const router = useRouter();
  const [targetRole, setTargetRole] = useState(roleOptions[0]);
  const [analysis, setAnalysis] = useState<RoleAnalysis | null>(demoAnalyses[roleOptions[0]]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoActionMessage, setDemoActionMessage] = useState("");
  const [focusedSkill, setFocusedSkill] = useState("");
  const resultsRef = useRef<HTMLElement>(null);
  const shouldFocusResultsRef = useRef(false);

  useEffect(() => {
    if (!analysis || !shouldFocusResultsRef.current) return;

    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    shouldFocusResultsRef.current = false;
  }, [analysis]);

  useEffect(() => {
    const timer = window.setTimeout(() => setFocusedSkill(new URLSearchParams(window.location.search).get("skill") ?? ""), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function handleAnalyze() {
    setIsAnalyzing(true);
    setAnalysis(null);
    setDemoActionMessage("");
    shouldFocusResultsRef.current = true;
    window.setTimeout(() => {
      setAnalysis(demoAnalyses[targetRole]);
      setIsAnalyzing(false);
    }, 650);
  }

  function handleRoleChange(role: string) {
    setTargetRole(role);
    setAnalysis(null);
    setDemoActionMessage("");
  }

  function handleDemoAction(action: "learning" | "practice", skill: string) {
    setDemoActionMessage(`Opening a focused ${skill} ${action === "learning" ? "learning path" : "AI coaching session"}…`);
    router.push(action === "learning" ? "/learn-practice" : "/ai-career-coach");
  }

  const skillsByStatus = (status: SkillStatus) => analysis?.skills.filter((skill) => skill.status === status) ?? [];

  return <AppShell title="Career & Skill Gap"><div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><span className="flex size-5 items-center justify-center rounded-md bg-primary/10"><Sparkles className="size-3" aria-hidden="true" /></span>AI-POWERED ROLE MATCH</div><h2 className="text-2xl font-bold tracking-[-.03em] sm:text-3xl">Career &amp; Skill Gap</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">Compare your current capabilities with the signals most important for your target role.</p></div><span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Analysis ready</span></section>

    <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div className="w-full md:max-w-sm"><label htmlFor="target-role" className="text-sm font-medium">Target role</label><div className="relative mt-2"><select id="target-role" value={targetRole} onChange={(event) => handleRoleChange(event.target.value)} disabled={isAnalyzing} className="h-10 w-full appearance-none rounded-lg border border-input bg-background px-3 pr-9 text-sm outline-none transition-colors hover:border-primary/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"><option value="" disabled>Select a target role</option>{roleOptions.map((role) => <option key={role}>{role}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /></div></div><Button size="lg" onClick={handleAnalyze} disabled={!targetRole || isAnalyzing} aria-busy={isAnalyzing} aria-describedby={isAnalyzing ? "analysis-feedback" : undefined} className="w-full sm:w-auto">{isAnalyzing ? <LoaderCircle className="size-4 animate-spin" data-icon="inline-start" aria-hidden="true" /> : <BrainCircuit data-icon="inline-start" aria-hidden="true" />}{isAnalyzing ? "Analyzing..." : "Analyze my career gap"}</Button></div>{isAnalyzing ? <p id="analysis-feedback" role="status" className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin text-primary" aria-hidden="true" />AI is comparing your capabilities with {targetRole} requirements.</p> : null}</section>

    {isAnalyzing ? <AnalysisSkeleton /> : analysis ? <section ref={resultsRef} tabIndex={-1} aria-labelledby="results-heading" className="scroll-mt-6 outline-none"><h2 id="results-heading" className="sr-only">Career gap results</h2><section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]"><article className="rounded-xl border border-primary/20 bg-primary/[0.035] p-5 sm:p-6"><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Target className="size-4" aria-hidden="true" /></span><span className="rounded-md bg-card px-2 py-1 text-[11px] font-medium text-muted-foreground">{targetRole}</span></div><p className="mt-5 text-4xl font-semibold tracking-tight">{analysis.readiness}%</p><h2 className="mt-1 text-sm font-medium">Role readiness</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">You have a solid foundation. Closing your top three gaps will have the clearest impact on your fit.</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-primary/10" role="progressbar" aria-label="Role readiness" aria-valuemin={0} aria-valuemax={100} aria-valuenow={analysis.readiness}><div className="h-full rounded-full bg-primary" style={{ width: `${analysis.readiness}%` }} /></div></article><article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-4" aria-hidden="true" /></span><div><h2 className="text-sm font-semibold">Your skill-gap snapshot</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The marker on each bar is the level typically expected for this role. Your fill shows your current confidence.</p></div></div><div className="mt-5 grid grid-cols-3 divide-x divide-border"><div className="pr-3"><p className="text-xl font-semibold">{skillsByStatus("strong").length}</p><p className="mt-0.5 text-xs text-muted-foreground">Strong skills</p></div><div className="px-3"><p className="text-xl font-semibold">{skillsByStatus("improving").length}</p><p className="mt-0.5 text-xs text-muted-foreground">Improving</p></div><div className="pl-3"><p className="text-xl font-semibold">{skillsByStatus("attention").length}</p><p className="mt-0.5 text-xs text-muted-foreground">Focus areas</p></div></div></article></section>

      <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]"><article className="rounded-xl border border-border bg-card p-5 shadow-sm"><h3 className="text-sm font-semibold">Role-fit radar</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Your current profile compared with the {targetRole} benchmark.</p><SkillRadar className="mt-2" points={analysis.skills.map(skill => ({ label: skill.name.replace("JavaScript & TypeScript", "JS/TS").replace("Interview communication", "Comms").replace("Problem solving", "Problem"), current: skill.current, target: skill.required }))} /></article><article className="rounded-xl border border-border bg-card p-5 shadow-sm"><h3 className="text-sm font-semibold">Highest-impact gaps</h3><p className="mt-1 text-xs text-muted-foreground">Close these first to move your readiness signal fastest.</p><div className="mt-5 space-y-3">{analysis.priorities.map((priority, index) => <div key={priority.skill} className={cn("flex items-center gap-3 rounded-lg border p-3", focusedSkill?.toLowerCase() === priority.skill.toLowerCase() ? "border-primary bg-primary/[.04] ring-2 ring-primary/15" : "border-border")}><span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{priority.skill}</p><p className="text-xs text-muted-foreground">{priority.detail}</p></div><span className="text-xs font-semibold text-rose-600">{priority.impact}</span></div>)}</div></article></section>
      <section aria-label="Skill gap results" className="grid gap-4 lg:grid-cols-3"><SkillsGroup title="Strong" description="Skills already meeting the role benchmark." status="strong" skills={skillsByStatus("strong")} /><SkillsGroup title="Improving" description="Keep practicing to reach the expected level." status="improving" skills={skillsByStatus("improving")} /><SkillsGroup title="Needs attention" description="These are your highest-value growth areas." status="attention" skills={skillsByStatus("attention")} /></section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold"><span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="size-4" aria-hidden="true" /></span>Top priorities</div><p className="mt-1.5 text-sm text-muted-foreground">Start here to make the most meaningful progress toward {targetRole}.</p></div><span className="w-fit rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">AI recommended</span></div>{demoActionMessage ? <p role="status" className="mt-4 rounded-lg border border-primary/15 bg-primary/[0.035] px-3 py-2 text-xs text-primary">{demoActionMessage}</p> : null}<ol className="mt-5 grid gap-3 lg:grid-cols-3">{analysis.priorities.map((priority, index) => <li key={priority.skill} className="group rounded-lg border border-border p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"><div className="flex items-start justify-between gap-3"><span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{index + 1}</span><span className="text-xs font-medium text-rose-600">{priority.impact}</span></div><h3 className="mt-4 text-sm font-semibold">{priority.skill}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{priority.detail}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => handleDemoAction("learning", priority.skill)}><BookOpen data-icon="inline-start" aria-hidden="true" />Start learning</Button><Button variant="ghost" size="sm" onClick={() => handleDemoAction("practice", priority.skill)} className="text-primary hover:text-primary"><BrainCircuit data-icon="inline-start" aria-hidden="true" />Practice with AI</Button></div></li>)}</ol></section>
    </section> : <section className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center shadow-sm"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target className="size-5" aria-hidden="true" /></span><h2 className="mt-4 text-base font-semibold">Choose a role to see your skill gap</h2><p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Select your target role, then run an analysis to see a focused readiness plan.</p></section>}
  </div></AppShell>;
}
