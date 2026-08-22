import { createSupabaseServerClient } from "@/lib/supabase-server";

export type UserRole = "student" | "placement_officer" | "admin";

export async function getCurrentUserWithRole() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      role: null,
      error: "Authentication required",
    };
  }

  const { data: roleRecord, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleError) {
    console.error("Role lookup error:", roleError);

    return {
      user,
      role: null,
      error: "Unable to verify user role",
    };
  }

  return {
    user,
    role: (roleRecord?.role as UserRole | null) ?? "student",
    error: null,
  };
}

export async function requireRole(
  allowedRoles: UserRole[]
) {
  const result = await getCurrentUserWithRole();

  if (!result.user) {
    return {
      authorized: false,
      status: 401,
      user: null,
      role: null,
      error: "Authentication required",
    };
  }

  if (result.error) {
    return {
      authorized: false,
      status: 500,
      user: result.user,
      role: null,
      error: result.error,
    };
  }

  if (!result.role || !allowedRoles.includes(result.role)) {
    return {
      authorized: false,
      status: 403,
      user: result.user,
      role: result.role,
      error: "Insufficient permissions",
    };
  }

  return {
    authorized: true,
    status: 200,
    user: result.user,
    role: result.role,
    error: null,
  };
}