import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile not found",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("learning_attempts")
      .select(
        "id, resource_id, status, progress_percent, started_at, completed_at, learning_resources(id, title, resource_type, url, difficulty, duration_minutes)"
      )
      .eq("student_id", profile.id)
      .order("started_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const resourceId = body.resource_id;

    if (!resourceId) {
      return NextResponse.json(
        {
          success: false,
          error: "resource_id is required",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile not found",
        },
        { status: 404 }
      );
    }

    const { data: resource, error: resourceError } = await supabase
      .from("learning_resources")
      .select("id")
      .eq("id", resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        {
          success: false,
          error: "Learning resource not found",
        },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("learning_attempts")
      .insert({
        student_id: profile.id,
        resource_id: resourceId,
        status: "started",
        progress_percent: 0,
      })
      .select(
        "id, resource_id, status, progress_percent, started_at, completed_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const attemptId = body.attempt_id;
    const progressPercent = body.progress_percent;
    const status = body.status;

    if (!attemptId) {
      return NextResponse.json(
        {
          success: false,
          error: "attempt_id is required",
        },
        { status: 400 }
      );
    }

    if (
      progressPercent !== undefined &&
      (typeof progressPercent !== "number" ||
        !Number.isFinite(progressPercent) ||
        progressPercent < 0 ||
        progressPercent > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "progress_percent must be a number between 0 and 100",
        },
        { status: 400 }
      );
    }

    const allowedStatuses = ["started", "in_progress", "completed"];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status",
        },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Student profile not found",
        },
        { status: 404 }
      );
    }

    const updates: {
      progress_percent?: number;
      status?: string;
      completed_at?: string | null;
    } = {};

    if (progressPercent !== undefined) {
      updates.progress_percent = progressPercent;
    }

    if (status !== undefined) {
      updates.status = status;
    }

    if (status === "completed" || progressPercent === 100) {
      updates.status = "completed";
      updates.progress_percent = 100;
      updates.completed_at = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No fields to update",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("learning_attempts")
      .update(updates)
      .eq("id", attemptId)
      .eq("student_id", profile.id)
      .select(
        "id, resource_id, status, progress_percent, started_at, completed_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Invalid request",
      },
      { status: 400 }
    );
  }
}