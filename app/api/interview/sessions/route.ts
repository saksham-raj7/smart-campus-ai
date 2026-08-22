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
        { success: false, error: "Authentication required" },
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
        { success: false, error: "Student profile not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("interview_sessions")
      .select(
        "id, career_goal_id, mode, transcript, overall_score, feedback, started_at, completed_at"
      )
      .eq("student_id", profile.id)
      .order("started_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
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
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const mode = body.mode ?? "text";

    if (!["text", "audio"].includes(mode)) {
      return NextResponse.json(
        {
          success: false,
          error: "mode must be either text or audio",
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
        { success: false, error: "Student profile not found" },
        { status: 404 }
      );
    }

    const careerGoalId = body.career_goal_id ?? null;

    if (careerGoalId) {
      const { data: careerGoal, error: careerGoalError } = await supabase
        .from("career_goals")
        .select("id")
        .eq("id", careerGoalId)
        .single();

      if (careerGoalError || !careerGoal) {
        return NextResponse.json(
          {
            success: false,
            error: "Career goal not found",
          },
          { status: 404 }
        );
      }
    }

    const { data, error } = await supabase
      .from("interview_sessions")
      .insert({
        student_id: profile.id,
        career_goal_id: careerGoalId,
        mode,
      })
      .select(
        "id, career_goal_id, mode, transcript, overall_score, feedback, started_at, completed_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
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
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.session_id) {
      return NextResponse.json(
        {
          success: false,
          error: "session_id is required",
        },
        { status: 400 }
      );
    }

    const updates: {
      transcript?: unknown;
      overall_score?: number | null;
      feedback?: unknown;
      completed_at?: string | null;
    } = {};

    if (body.transcript !== undefined) {
      updates.transcript = body.transcript;
    }

    if (body.feedback !== undefined) {
      updates.feedback = body.feedback;
    }

    if (body.overall_score !== undefined) {
      if (
        body.overall_score !== null &&
        (typeof body.overall_score !== "number" ||
          !Number.isFinite(body.overall_score) ||
          body.overall_score < 0 ||
          body.overall_score > 100)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "overall_score must be a number between 0 and 100",
          },
          { status: 400 }
        );
      }

      updates.overall_score = body.overall_score;
    }

    if (body.completed === true) {
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

    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: "Student profile not found" },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("interview_sessions")
      .update(updates)
      .eq("id", body.session_id)
      .eq("student_id", profile.id)
      .select(
        "id, career_goal_id, mode, transcript, overall_score, feedback, started_at, completed_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
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