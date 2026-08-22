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
      .from("communication_assessments")
      .select(
        "id, assessment_type, transcript, score, feedback, assessed_at"
      )
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false });

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

    if (!body.assessment_type?.trim()) {
      return NextResponse.json(
        { success: false, error: "assessment_type is required" },
        { status: 400 }
      );
    }

    if (
      body.score !== undefined &&
      (typeof body.score !== "number" ||
        !Number.isFinite(body.score) ||
        body.score < 0 ||
        body.score > 100)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "score must be a number between 0 and 100",
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
      .from("communication_assessments")
      .insert({
        student_id: profile.id,
        assessment_type: body.assessment_type.trim(),
        transcript: body.transcript ?? null,
        score: body.score ?? null,
        feedback: body.feedback ?? null,
      })
      .select(
        "id, assessment_type, transcript, score, feedback, assessed_at"
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