"use client";

import { type ReactNode, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Check,
  ChevronLeft,
  Clock3,
  Code2,
  Lightbulb,
  MessageSquareText,
  Network,
  Play,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";
import { CodePracticeLab } from "@/components/code-practice/code-practice-lab";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { recordReadiness } from "@/lib/readiness";
import { RecommendedResource } from "@/components/learning/recommended-resource";

type FocusSkill = {
  name: string;
  detail: string;
  current: number;
  target: number;
  duration: string;
  icon: typeof Network;
};

type Resource = {
  title: string;
  skill: string;
  level: string;
  duration: string;
  description: string;
  progress?: number;
  icon: typeof BookOpen;
};

type PracticeMode = {
  title: string;
  description: string;
  duration: string;
  icon: typeof BrainCircuit;
};

type Lesson = {
  title: string;
  content: string;
  points: string[];
};

type LearningCourse = {
  id: string;
  title: string;
  skill: string;
  subtitle: string;
  lessons: Lesson[];
};

type PracticeScenario = {
  title: string;
  question: string;
};

// Frontend demo data only. Replace this single object with API data when available.
const demoLearningPlan = {
  targetRole: "Software Engineer",
  focusSkills: [
    { name: "System Design", detail: "Build the architecture judgment expected in technical interviews.", current: 38, target: 70, duration: "3h 20m", icon: Network },
    { name: "Data Structures", detail: "Strengthen your approach to common coding interview patterns.", current: 52, target: 78, duration: "2h 40m", icon: Code2 },
    { name: "Interview Communication", detail: "Turn good reasoning into clear, confident interview answers.", current: 46, target: 72, duration: "1h 50m", icon: MessageSquareText },
  ] satisfies FocusSkill[],
  pathSteps: [
    { number: "01", title: "Learn", detail: "Understand the core concepts", current: true },
    { number: "02", title: "Practice", detail: "Apply what you learned", current: false },
    { number: "03", title: "Practice", detail: "Get adaptive questions and feedback", current: false },
    { number: "04", title: "Build confidence", detail: "Track your improvement", current: false },
  ],
  continuation: { title: "System Design Fundamentals", detail: "Architecture basics · Components · Scalability", progress: 42, remaining: "35 min remaining" },
  resources: [
    { title: "System Design Fundamentals", skill: "System Design", level: "Beginner → Intermediate", duration: "35 min", description: "Learn how thoughtful systems balance scale, reliability, and simple decisions.", progress: 42, icon: Network },
    { title: "Data Structures: Trees & Graphs", skill: "Data Structures", level: "Intermediate", duration: "45 min", description: "Build recognition for the traversal and search patterns interviewers expect.", icon: Code2 },
    { title: "SQL for Interviews", skill: "SQL", level: "Intermediate", duration: "30 min", description: "Practice the joins, aggregations, and reasoning behind clean SQL answers.", icon: BookOpen },
    { title: "Structured Interview Answers", skill: "Interview Communication", level: "Beginner → Intermediate", duration: "25 min", description: "Use a concise structure to make your experience and thinking memorable.", icon: MessageSquareText },
  ] satisfies Resource[],
  practiceModes: [
    { title: "Mock interview", description: "Practice a realistic Software Engineer interview.", duration: "15–20 min", icon: BrainCircuit },
    { title: "Explain a concept", description: "Explain a topic clearly and get feedback on your reasoning.", duration: "8–10 min", icon: Lightbulb },
    { title: "Solve a technical problem", description: "Work through an adaptive problem, step by step.", duration: "20–25 min", icon: Code2 },
  ] satisfies PracticeMode[],
  momentum: [
    { value: "4", label: "skills in progress" },
    { value: "2", label: "sessions this week" },
    { value: "78 min", label: "practiced" },
    { value: "+8", label: "readiness this month" },
  ],
};

// Frontend demo content only. A future API can replace these structures directly.
const demoCourses: LearningCourse[] = [
  {
    id: "system-design",
    title: "System Design Fundamentals",
    skill: "System Design",
    subtitle: "Architecture basics · Components · Scalability",
    lessons: [
      { title: "Understand the problem", content: "System design is the process of defining the architecture, components, and interactions of a system so it can meet functional and scale requirements.", points: ["01 — Understand the problem", "02 — Identify core components", "03 — Think about scale", "04 — Evaluate trade-offs"] },
      { title: "Identify core components", content: "Start with the smallest set of services and data stores that can support the main user journey before adding complexity.", points: ["Define the main request flow", "Choose the data model", "Map service responsibilities"] },
      { title: "Think about scale", content: "As usage grows, distribute work across stateless services, cache frequently used data, and plan for reliable storage.", points: ["Separate compute from storage", "Cache repeat reads", "Plan for growth and failure"] },
      { title: "Evaluate trade-offs", content: "Strong designs make their trade-offs explicit: consistency, latency, cost, and operational simplicity all need deliberate balance.", points: ["Prioritize the user requirement", "Name the trade-off", "Explain the chosen balance"] },
    ],
  },
  {
    id: "trees-graphs",
    title: "Data Structures: Trees & Graphs",
    skill: "Data Structures",
    subtitle: "Traversal patterns · Search · Connectivity",
    lessons: [
      { title: "Recognize the structure", content: "Trees model hierarchy, while graphs model relationships. Choosing the right structure makes the interview problem easier to reason about.", points: ["Identify nodes and edges", "Check whether cycles matter", "Choose a traversal"] },
      { title: "Traverse with intent", content: "Breadth-first and depth-first search each reveal different properties. Match the traversal to the question being asked.", points: ["Use BFS for nearest paths", "Use DFS for exploration", "Track visited nodes"] },
      { title: "Model the state", content: "A clean representation and a small amount of state often prevent duplicate work and make correctness easier to explain.", points: ["Pick an adjacency structure", "Keep a visited set", "State the complexity"] },
      { title: "Explain the trade-off", content: "Interview-ready solutions explain why the selected structure and traversal fit both the data and the constraints.", points: ["Compare alternatives", "Call out time complexity", "Call out space complexity"] },
    ],
  },
  {
    id: "sql-interviews",
    title: "SQL for Interviews",
    skill: "SQL",
    subtitle: "Joins · Aggregations · Query reasoning",
    lessons: [
      { title: "Read the data model", content: "Before writing a query, identify the entities, their keys, and the grain of the result you need to return.", points: ["Identify table relationships", "Choose the result grain", "Name the needed fields"] },
      { title: "Join deliberately", content: "The join type determines which rows survive. Start from the business question, then choose the join that preserves the right records.", points: ["Choose a base table", "Match on stable keys", "Check missing data"] },
      { title: "Aggregate clearly", content: "Group only at the level the question requires, and make each aggregate explainable in a sentence.", points: ["Set the grouping level", "Use meaningful measures", "Validate duplicate rows"] },
      { title: "Review the answer", content: "A strong interview answer checks edge cases and gives a concise explanation of the query's assumptions.", points: ["Test nulls", "Test ties", "Explain the result"] },
    ],
  },
  {
    id: "structured-answers",
    title: "Structured Interview Answers",
    skill: "Interview Communication",
    subtitle: "Clear stories · Reasoning · Confidence",
    lessons: [
      { title: "Set the context", content: "A concise opening gives the interviewer the context they need before you move into your actions and reasoning.", points: ["State the situation", "Name the goal", "Keep it concise"] },
      { title: "Explain your actions", content: "Focus on decisions you personally made and the reasoning behind them, rather than listing every activity.", points: ["Use first-person ownership", "Describe the decision", "Show collaboration"] },
      { title: "Share the outcome", content: "Close with the impact, what you learned, and how you would apply that insight to the next challenge.", points: ["Quantify impact", "Name the learning", "Connect to the role"] },
      { title: "Practice the delivery", content: "A structured answer feels natural when it is practiced aloud and adjusted to fit the question being asked.", points: ["Lead with the headline", "Use a clear sequence", "Invite follow-up"] },
    ],
  },
];

const demoPracticeScenarios: PracticeScenario[] = [
  { title: "Mock interview", question: "How would you design a URL shortening service?" },
  { title: "Explain a concept", question: "Explain horizontal scaling in your own words." },
  { title: "Solve a technical problem", question: "Given an array of integers, explain how you would find duplicate values efficiently." },
];

function FocusSkillCard({ skill, featured, onLearn, onPractice }: { skill: FocusSkill; featured?: boolean; onLearn: () => void; onPractice: () => void }) {
  const Icon = skill.icon;
  const gap = skill.target - skill.current;
  return <article className={cn("relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm", featured ? "border-primary/30 bg-primary/[0.025] sm:p-6" : "border-border")}>
    {featured ? <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" /> : null}
    <div className="flex items-start justify-between gap-3"><span className={cn("flex size-9 items-center justify-center rounded-lg", featured ? "bg-primary text-primary-foreground" : "bg-muted text-primary")}><Icon className="size-4" aria-hidden="true" /></span><span className="rounded-md bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">High priority</span></div>
    <h3 className="mt-4 text-lg font-semibold tracking-tight">{skill.name}</h3><p className="mt-1.5 min-h-10 text-sm leading-5 text-muted-foreground">{skill.detail}</p>
    <div className="mt-5"><div className="flex items-end justify-between gap-3"><span className="text-xs text-muted-foreground">Current confidence</span><span className="text-sm font-semibold">{skill.current}% <span className="font-normal text-muted-foreground">→ {skill.target}%</span></span></div><div className="relative mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${skill.name} confidence`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={skill.current}><div className="h-full rounded-full bg-primary" style={{ width: `${skill.current}%` }} /><span className="absolute inset-y-0 w-0.5 bg-foreground/45" style={{ left: `${skill.target}%` }} aria-hidden="true" /></div><p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-foreground">{gap} point gap</span> to your role target</p></div>
    <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" aria-hidden="true" />{skill.duration}</span><span>Focused path</span></div>
    <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" onClick={onLearn}><BookOpen data-icon="inline-start" aria-hidden="true" />Start learning</Button><Button size="sm" variant="ghost" onClick={onPractice} className="text-primary hover:text-primary"><BrainCircuit data-icon="inline-start" aria-hidden="true" />Practice with AI</Button></div>
  </article>;
}

function ExperienceFrame({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-3 backdrop-blur-[1px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
    <section className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card shadow-xl sm:max-h-[calc(100dvh-3rem)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-6"><p className="text-sm font-semibold">{title}</p><Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close"><X className="size-4" aria-hidden="true" /></Button></div>
      {children}
    </section>
  </div>;
}

function LearningDialog({ course, lessonIndex, progress, onClose, onPrevious, onContinue, onComplete }: { course: LearningCourse; lessonIndex: number; progress: number; onClose: () => void; onPrevious: () => void; onContinue: () => void; onComplete: () => void }) {
  const lesson = course.lessons[lessonIndex];
  const isFinalLesson = lessonIndex === course.lessons.length - 1;
  const isComplete = progress === 100;
  return <ExperienceFrame title="Learning experience" onClose={onClose}><div className="p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">{course.skill}</span><span className="text-xs text-muted-foreground">Lesson {lessonIndex + 1} of {course.lessons.length}</span></div>
    <h2 className="mt-4 text-2xl font-semibold tracking-tight">{course.title}</h2><p className="mt-1.5 text-sm text-muted-foreground">{course.subtitle}</p>
    <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
    <article className="mt-6 rounded-xl border border-border bg-muted/30 p-5"><p className="text-xs font-medium text-primary">LESSON {String(lessonIndex + 1).padStart(2, "0")}</p><h3 className="mt-2 text-lg font-semibold">{lesson.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{lesson.content}</p><div className="mt-5 grid gap-2">{lesson.points.map((point) => <div key={point} className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm">{point}</div>)}</div></article>
    {isComplete ? <div className="mt-5 rounded-lg border border-primary/20 bg-primary/[0.035] p-3 text-sm"><span className="font-semibold text-primary">Lesson complete.</span> Your local demo progress is now updated.</div> : null}
    <div className="mt-6 flex items-center justify-between gap-3"><Button variant="outline" onClick={onPrevious} disabled={lessonIndex === 0}><ChevronLeft data-icon="inline-start" aria-hidden="true" />Previous</Button>{isFinalLesson ? <Button onClick={onComplete} disabled={isComplete}>{isComplete ? "Completed" : "Complete lesson"}</Button> : <Button onClick={onContinue}>Continue <ArrowRight data-icon="inline-end" aria-hidden="true" /></Button>}</div>
  </div></ExperienceFrame>;
}

function PracticeDialog({ selectedPractice, selectedMode, submitted, onClose, onSelectMode, onSubmit }: { selectedPractice: PracticeScenario; selectedMode: string; submitted: boolean; onClose: () => void; onSelectMode: (mode: string) => void; onSubmit: () => void }) {
  return <ExperienceFrame title="Practice with AI" onClose={onClose}><div className="p-5 sm:p-6"><h2 className="text-2xl font-semibold tracking-tight">Practice with AI</h2><p className="mt-1.5 text-sm text-muted-foreground">Let&apos;s turn what you learned into interview-ready confidence.</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-3">{demoPracticeScenarios.map((scenario) => <button key={scenario.title} type="button" onClick={() => onSelectMode(scenario.title)} className={cn("rounded-lg border p-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", selectedMode === scenario.title ? "border-primary bg-primary/[0.035] text-primary" : "border-border bg-card hover:border-primary/30")}>{scenario.title}</button>)}</div>
    <article className="mt-5 rounded-xl border border-border bg-muted/30 p-5"><p className="text-xs font-medium text-primary">DEMO QUESTION</p><p className="mt-2 text-base font-semibold leading-6">{selectedPractice.question}</p><label className="mt-5 block text-sm font-medium" htmlFor="practice-answer">Your answer</label><textarea id="practice-answer" className="mt-2 min-h-28 w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Write a short response for this frontend-only demo..." /></article>
    {submitted ? <div className="mt-4 rounded-lg border border-primary/20 bg-primary/[0.035] p-4 text-sm leading-6"><p className="font-semibold text-primary">Demo AI feedback</p><p className="mt-1 text-muted-foreground">Good structure. Your explanation is clear. Next, strengthen your discussion of scalability and trade-offs.</p><p className="mt-2 text-xs text-muted-foreground">Frontend-only static feedback — no API response was requested.</p></div> : null}
    <div className="mt-6 flex items-center justify-between gap-3"><Button variant="outline" onClick={onClose}>Back to Learn &amp; Practice</Button><Button onClick={onSubmit}>Submit answer</Button></div>
  </div></ExperienceFrame>;
}

export default function LearnPracticePage() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lessonIndex, setLessonIndex] = useState(0);
  const [practiceMode, setPracticeMode] = useState<string | null>(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [isCodePracticeOpen, setIsCodePracticeOpen] = useState(false);
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({ "system-design": 42 });
  const plan = demoLearningPlan;
  const systemDesignProgress = courseProgress["system-design"] ?? plan.continuation.progress;
  const selectedCourse = demoCourses.find((course) => course.id === selectedCourseId) ?? null;
  const selectedPractice = demoPracticeScenarios.find((scenario) => scenario.title === practiceMode) ?? null;

  function startLearning(title: string) {
    const course = demoCourses.find((item) => item.title === title || item.skill === title) ?? demoCourses[0];
    setPracticeMode(null);
    setSelectedCourseId(course.id);
    setLessonIndex(0);
  }

  function startPractice(title: string) {
    const scenario = demoPracticeScenarios.find((item) => item.title === title) ?? demoPracticeScenarios[0];
    setSelectedCourseId(null);
    setPracticeMode(scenario.title);
    setPracticeSubmitted(false);
  }

  function closeExperience() {
    setSelectedCourseId(null);
    setPracticeMode(null);
    setPracticeSubmitted(false);
  }

  return <AppShell title="Learn & Practice"><div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-primary"><span className="flex size-5 items-center justify-center rounded-md bg-primary/10"><Sparkles className="size-3" aria-hidden="true" /></span>PERSONALIZED LEARNING</div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Learn &amp; Practice</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">Turn your biggest skill gaps into focused learning and deliberate practice.</p></div><span className="w-fit rounded-full border border-primary/15 bg-primary/[0.035] px-3 py-1.5 text-xs font-medium text-primary">Learning plan</span></section>
    <section className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm"><p className="text-sm">Your plan is personalized around your target role: <span className="font-semibold">{plan.targetRole}</span></p><p className="mt-1 text-xs text-muted-foreground">Use this week&apos;s focus to turn skill gaps into steady progress.</p></section>

    <section aria-labelledby="code-practice-heading" className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.035] shadow-sm"><div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Code2 className="size-4" aria-hidden="true" /></span><span className="text-xs font-medium text-primary">BUILD WITH WHAT YOU LEARN</span><span className="rounded-full border border-primary/20 bg-card px-2 py-0.5 text-[11px] font-medium text-primary">AI practice</span></div><h2 id="code-practice-heading" className="mt-4 text-xl font-semibold tracking-tight">Code Practice Lab</h2><p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">Turn your skill gaps into working solutions with focused coding practice.</p></div><article className="w-full rounded-xl border border-border bg-card p-4 sm:max-w-lg"><div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-semibold">Practice coding for your target role</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Solve role-relevant problems, run your solution, and understand how to improve.</p></div><span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">Recommended: Data Structures</span></div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>12 practice problems</span><span>3 skill areas</span><span>Adaptive difficulty</span></div><Button className="mt-4" onClick={() => setIsCodePracticeOpen(true)}><Code2 data-icon="inline-start" aria-hidden="true" />Open Code Practice Lab</Button></article></div></section>

    <section aria-labelledby="focus-heading"><div className="mb-3 flex items-end justify-between gap-4"><div><h2 id="focus-heading" className="text-lg font-semibold tracking-tight">Your focus this week</h2><p className="mt-1 text-sm text-muted-foreground">Prioritized from your highest-impact skill gaps.</p></div><span className="hidden text-xs text-muted-foreground sm:block">Target levels are marked on each path</span></div><div className="grid gap-4 xl:grid-cols-3">{plan.focusSkills.map((skill, index) => <FocusSkillCard key={skill.name} skill={skill} featured={index === 0} onLearn={() => startLearning(skill.name)} onPractice={() => startPractice("Mock interview")} />)}</div></section>

    <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"><article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold tracking-tight">Your AI learning path</h2><p className="mt-1.5 text-sm leading-6 text-muted-foreground">Follow the shortest path from skill gap to interview readiness.</p></div><span className="w-fit rounded-md bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">System Design</span></div><ol className="mt-6 grid gap-3 md:grid-cols-4">{plan.pathSteps.map((step, index) => <li key={step.number} className="relative min-w-0 md:before:absolute md:before:left-[calc(50%+1.65rem)] md:before:right-[calc(-50%+1.65rem)] md:before:top-4 md:before:h-px md:before:bg-border last:before:hidden"><div className={cn("relative z-10 flex size-8 items-center justify-center rounded-full border text-xs font-semibold", step.current ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-card text-muted-foreground")}>{step.current ? <Check className="size-3.5" aria-hidden="true" /> : step.number}</div><h3 className={cn("mt-3 text-sm font-semibold", step.current && "text-primary")}>{step.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{step.detail}</p>{index === 0 ? <span className="mt-2 inline-block text-[11px] font-medium text-primary">Current step</span> : null}</li>)}</ol><Button className="mt-6" onClick={() => startLearning(plan.continuation.title)}><Play data-icon="inline-start" aria-hidden="true" />Continue learning</Button></article>
      <article className="rounded-xl border border-primary/20 bg-primary/[0.035] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-medium text-primary"><TrendingUp className="size-4" aria-hidden="true" />Your learning momentum</div><div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">{plan.momentum.map((item) => <div key={item.label}><p className="text-2xl font-semibold tracking-tight">{item.value}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.label}</p></div>)}</div></article></section>

    <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]"><article className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6"><div className="flex items-start justify-between gap-4"><span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><BookOpen className="size-4" aria-hidden="true" /></span><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden="true" />{plan.continuation.remaining}</span></div><p className="mt-5 text-xs font-medium text-primary">CONTINUE WHERE YOU LEFT OFF</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight">{plan.continuation.title}</h2><p className="mt-1.5 text-sm text-muted-foreground">{plan.continuation.detail}</p><div className="mt-5 flex items-center gap-3"><div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="System Design Fundamentals progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={systemDesignProgress}><div className="h-full rounded-full bg-primary" style={{ width: `${systemDesignProgress}%` }} /></div><span className="text-xs font-medium">{systemDesignProgress}%</span></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">Last practiced today</span><Button size="sm" onClick={() => startLearning(plan.continuation.title)}>Continue learning <ArrowRight data-icon="inline-end" aria-hidden="true" /></Button></div></article>
      <article className="rounded-xl border border-primary/20 bg-primary/[0.035] p-5 sm:p-6"><div className="flex items-center gap-2 text-sm font-medium text-primary"><BrainCircuit className="size-4" aria-hidden="true" />Practice with AI</div><h2 className="mt-3 text-xl font-semibold tracking-tight">Make it interview-ready.</h2><p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">Turn what you learned into interview-ready confidence with adaptive practice.</p><div className="mt-5 grid gap-2 sm:grid-cols-3">{plan.practiceModes.map((mode) => { const Icon = mode.icon; return <button key={mode.title} type="button" onClick={() => startPractice(mode.title)} className="group rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/[0.025] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"><Icon className="size-4 text-primary" aria-hidden="true" /><h3 className="mt-3 text-sm font-semibold">{mode.title}</h3><p className="mt-1 min-h-10 text-xs leading-5 text-muted-foreground">{mode.description}</p><span className="mt-3 flex items-center justify-between text-xs text-muted-foreground"><span>{mode.duration}</span><ArrowRight className="size-3.5 text-primary transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span></button>; })}</div></article></section>

    <section aria-labelledby="recommended-heading"><div className="mb-3"><h2 id="recommended-heading" className="text-lg font-semibold tracking-tight">Recommended for you</h2><p className="mt-1 text-sm text-muted-foreground">AI-selected resources based on your current skill gaps.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{plan.resources.map((resource) => { const Icon = resource.icon; return <article key={resource.title} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-muted text-primary"><Icon className="size-4" aria-hidden="true" /></span><span className="text-[11px] font-medium text-primary">{resource.skill}</span></div><h3 className="mt-4 text-sm font-semibold">{resource.title}</h3><p className="mt-1.5 flex-1 text-xs leading-5 text-muted-foreground">{resource.description}</p><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><span>{resource.level}</span><span aria-hidden="true">·</span><span>{resource.duration}</span></div>{resource.progress ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${resource.progress}%` }} /></div> : null}<Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => startLearning(resource.title)}><BookOpen data-icon="inline-start" aria-hidden="true" />{resource.progress ? "Continue learning" : "Start learning"}</Button></article>; })}</div></section>

    {selectedCourse ? <LearningDialog course={selectedCourse} lessonIndex={lessonIndex} progress={courseProgress[selectedCourse.id] ?? 0} onClose={closeExperience} onPrevious={() => setLessonIndex((current) => Math.max(0, current - 1))} onContinue={() => setLessonIndex((current) => Math.min(selectedCourse.lessons.length - 1, current + 1))} onComplete={() => { setCourseProgress((current) => ({ ...current, [selectedCourse.id]: 100 })); recordReadiness("learning", `${selectedCourse.title} completed`, "System Design"); }} /> : null}
    {selectedPractice ? <PracticeDialog selectedPractice={selectedPractice} selectedMode={practiceMode ?? selectedPractice.title} submitted={practiceSubmitted} onClose={closeExperience} onSelectMode={startPractice} onSubmit={() => setPracticeSubmitted(true)} /> : null}
    {isCodePracticeOpen ? <CodePracticeLab onClose={() => setIsCodePracticeOpen(false)} /> : null}
    <section aria-label="Personalized video resource"><RecommendedResource /></section>
  </div></AppShell>;
}
