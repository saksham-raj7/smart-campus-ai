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
      .from("practice_attempts")
      .select(
        "id, skill_id, question, answer, is_correct, score, attempted_at, skills(id, name, category)"
      )
      .eq("student_id", profile.id)
      .order("attempted_at", { ascending: false });

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

    const skillId = body.skill_id;
    const question = body.question;
    const answer = body.answer ?? null;
    const isCorrect =
      typeof body.is_correct === "boolean" ? body.is_correct : null;
    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? body.score
        : null;

    if (!skillId) {
      return NextResponse.json(
        {
          success: false,
          error: "skill_id is required",
        },
        { status: 400 }
      );
    }

    if (!question?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "question is required",
        },
        { status: 400 }
      );
    }

    if (score !== null && (score < 0 || score > 100)) {
      return NextResponse.json(
        {
          success: false,
          error: "score must be between 0 and 100",
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

    const { data, error } = await supabase
      .from("practice_attempts")
      .insert({
        student_id: profile.id,
        skill_id: skillId,
        question: question.trim(),
        answer,
        is_correct: isCorrect,
        score,
      })
      .select(
        "id, skill_id, question, answer, is_correct, score, attempted_at, skills(id, name, category)"
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