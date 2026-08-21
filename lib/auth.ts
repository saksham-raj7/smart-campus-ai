import type { User } from "@/lib/career-data";
import { demoUser } from "@/lib/career-data";
import type { WorkspaceRole } from "@/lib/career-data";

const KEY = "ai-career-os-session";
export function getSession(): User | null { if (typeof window === "undefined") return null; try { return JSON.parse(localStorage.getItem(KEY) ?? "null") as User | null; } catch { return null; } }
export function startDemoSession(values?: Partial<User>) { const user = { ...demoUser, ...values }; localStorage.setItem(KEY, JSON.stringify(user)); return user; }
export function endSession() { localStorage.removeItem(KEY); }
export function setDemoWorkspace(role: WorkspaceRole) { const session = getSession(); if (!session) return null; const updated = { ...session, role }; localStorage.setItem(KEY, JSON.stringify(updated)); return updated; }
