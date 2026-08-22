import type { User } from "@supabase/supabase-js";
import type { WorkspaceRole } from "@/lib/career-data";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  fullName?: string;
  authorizedRoles: WorkspaceRole[];
};

export function getSessionUser(user: User | null): SessionUser | null {
  if (!user?.email) return null;
  const metadata = user.app_metadata as { role?: WorkspaceRole; roles?: WorkspaceRole[] } | undefined;
  const authorizedRoles = Array.from(new Set<WorkspaceRole>(["student", ...(metadata?.roles ?? []), ...(metadata?.role ? [metadata.role] : [])]));
  const fullName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined;
  const role = metadata?.role === "placement_officer" ? "placement_officer" : "student";
  return { id: user.id, name: fullName || user.email.split("@")[0], fullName, email: user.email, role, authorizedRoles };
}

export function initials(user?: Pick<SessionUser, "name" | "fullName" | "email"> | null) {
  const source = user?.fullName || user?.name || user?.email?.split("@")[0] || "User";
  return source.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function canAccessAdmin(user: SessionUser | null | undefined) {
  return user?.authorizedRoles.includes("placement_officer") ?? false;
}
