import type { User, WorkspaceRole } from "@/lib/career-data";
import { demoUser } from "@/lib/career-data";

const KEY = "skillora-session";

export type SessionUser = User & {
  role: WorkspaceRole;
  fullName?: string;
  authorizedRoles?: WorkspaceRole[];
};

export function getSession(): SessionUser | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem(KEY) ?? "null"
    ) as SessionUser | null;
  } catch {
    return null;
  }
}

export function initials(
  user?: Pick<
    SessionUser,
    "name" | "fullName" | "email"
  > | null
) {
  const source =
    user?.fullName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function startDemoSession(
  values?: Partial<SessionUser>
) {
  const user: SessionUser = {
    ...demoUser,
    role: "student",
    authorizedRoles: ["student"],
    ...values,
  };

  localStorage.setItem(
    KEY,
    JSON.stringify(user)
  );

  return user;
}

export function endSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY);
  }
}

export function canAccessAdmin(
  user = getSession()
) {
  return !!user?.authorizedRoles?.includes(
    "placement_officer"
  );
}

export function setDemoWorkspace(
  role: WorkspaceRole
) {
  const user = getSession();

  if (
    !user ||
    (role === "placement_officer" &&
      !canAccessAdmin(user))
  ) {
    return null;
  }

  const updated = {
    ...user,
    role,
  };

  localStorage.setItem(
    KEY,
    JSON.stringify(updated)
  );

  return updated;
}