/** Shared frontend contract. Replace these demo records with API responses when available. */
export type WorkspaceRole = "student" | "placement_officer";
export type User = { name: string; email: string; targetRole: string; studentStatus: string; education: string; role?: WorkspaceRole };
export type Skill = { name: string; current: number; target: number; state: "mastered" | "improving" | "attention" };
export type CareerProfile = { readiness: number; targetRole: string; topGap: string; skills: Skill[] };
export type ProgressData = { learning: number; coding: number; communication: number; interview: number; readinessTrend: number[] };
export type CoachMessage = { id: string; role: "assistant" | "user"; content: string; time: string };
export type CompanyQuestion = { id: string; company: string; role: string; topic: string; difficulty: "Easy" | "Medium" | "Hard"; question: string; expectedSkill: string; estimatedTime: string };
export type PeerInsight = { title: string; detail: string; metric: string; category: string };

export const demoUser: User = { name: "Student", email: "student@aicareeros.demo", targetRole: "Software Engineer", studentStatus: "Final-year student", education: "B.Tech · Computer Science" };
export const careerProfile: CareerProfile = { readiness: 68, targetRole: "Software Engineer", topGap: "System Design", skills: [
  { name: "JavaScript & TypeScript", current: 78, target: 75, state: "mastered" },
  { name: "Problem Solving", current: 74, target: 80, state: "improving" },
  { name: "Data Structures", current: 52, target: 78, state: "attention" },
  { name: "System Design", current: 38, target: 70, state: "attention" },
  { name: "Interview Communication", current: 46, target: 72, state: "attention" },
] };
export const progressData: ProgressData = { learning: 74, coding: 61, communication: 68, interview: 64, readinessTrend: [52, 55, 58, 60, 63, 65, 68] };
export const recentActivity = ["Completed System Design Fundamentals · 18 min ago", "Solved Two Sum in Code Practice Lab · Yesterday", "Received AI feedback on your interview delivery · Tue"];

export const companyQuestions: CompanyQuestion[] = [
  { id: "google-1", company: "Google", role: "Software Engineer", topic: "DSA", difficulty: "Medium", question: "Design an efficient approach to find the shortest transformation sequence between two words.", expectedSkill: "Graph traversal", estimatedTime: "35 min" },
  { id: "microsoft-1", company: "Microsoft", role: "Software Engineer", topic: "System Design", difficulty: "Medium", question: "How would you design a collaborative document editing experience?", expectedSkill: "Architecture trade-offs", estimatedTime: "30 min" },
  { id: "amazon-1", company: "Amazon", role: "Software Engineer", topic: "Behavioral", difficulty: "Medium", question: "Tell me about a time you simplified a complex problem for your team.", expectedSkill: "Structured communication", estimatedTime: "12 min" },
  { id: "tcs-1", company: "TCS", role: "Software Engineer", topic: "SQL", difficulty: "Easy", question: "Write a query to identify customers with more than one order this month.", expectedSkill: "Joins & aggregation", estimatedTime: "20 min" },
  { id: "accenture-1", company: "Accenture", role: "Software Engineer", topic: "React", difficulty: "Medium", question: "How would you diagnose and improve a slow React list view?", expectedSkill: "Performance reasoning", estimatedTime: "20 min" },
  { id: "deloitte-1", company: "Deloitte", role: "Software Engineer", topic: "Communication", difficulty: "Easy", question: "Explain a technical project to a non-technical stakeholder.", expectedSkill: "Audience awareness", estimatedTime: "10 min" },
];

export const peerInsights: PeerInsight[] = [
  { title: "System Design is trending this week", detail: "Students preparing for Software Engineering are increasingly practicing architecture fundamentals.", metric: "+24% practice", category: "Trending skill" },
  { title: "DSA is the most practiced topic", detail: "68% of peers targeting Software Engineering practiced data structures this week.", metric: "68% of peers", category: "Preparation trend" },
  { title: "Communication remains a common challenge", detail: "Clear explanation of trade-offs is one of the most frequent AI feedback themes.", metric: "#1 improvement area", category: "Interview insight" },
];
