import { Bot, BookOpen, Building2, ChartNoAxesCombined, LayoutDashboard, MessagesSquare, Settings, Target, UsersRound, type LucideIcon } from "lucide-react";

export type NavigationItem = { href: string; icon: LucideIcon; label: string };

export const primaryNavigation: NavigationItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/career-skill-gap", icon: Target, label: "Career & Skill Gap" },
  { href: "/learn-practice", icon: BookOpen, label: "Learn & Practice" },
  { href: "/ai-communication", icon: MessagesSquare, label: "AI Communication" },
  { href: "/progress-readiness", icon: ChartNoAxesCombined, label: "Progress & Readiness" },
  { href: "/ai-career-coach", icon: Bot, label: "AI Career Coach" },
];

export const secondaryNavigation: NavigationItem[] = [
  { href: "/company-question-bank", icon: Building2, label: "Company Question Bank" },
  { href: "/peer-insights", icon: UsersRound, label: "Peer Insights" },
  { href: "/settings", icon: Settings, label: "Settings" },
];
