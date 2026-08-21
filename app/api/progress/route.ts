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
      .from("progress_snapshots")
      .select(
        "id, skill_id, readiness_score, skill_score, communication_score, interview_score, snapshot_date, created_at"
      )
      .eq("student_id", profile.id)
      .order("snapshot_date", { ascending: false });

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

    const body = await request.json();

    const numericFields = [
      "readiness_score",
      "skill_score",
      "communication_score",
      "interview_score",
    ] as const;

    for (const field of numericFields) {
      if (body[field] !== undefined && body[field] !== null) {
        if (
          typeof body[field] !== "number" ||
          !Number.isFinite(body[field]) ||
          body[field] < 0 ||
          body[field] > 100
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `${field} must be a number between 0 and 100`,
            },
            { status: 400 }
          );
        }
      }
    }

    const snapshotDate =
      body.snapshot_date ?? new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("progress_snapshots")
      .insert({
        student_id: profile.id,
        skill_id: body.skill_id ?? null,
        readiness_score: body.readiness_score ?? null,
        skill_score: body.skill_score ?? null,
        communication_score: body.communication_score ?? null,
        interview_score: body.interview_score ?? null,
        snapshot_date: snapshotDate,
      })
      .select(
        "id, skill_id, readiness_score, skill_score, communication_score, interview_score, snapshot_date, created_at"
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