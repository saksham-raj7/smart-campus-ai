import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { searchParams } = new URL(request.url);

    const company = searchParams.get("company");
    const role = searchParams.get("role");
    const difficulty = searchParams.get("difficulty");
    const skillId = searchParams.get("skill_id");
    const limitParam = Number(searchParams.get("limit") ?? "50");

    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : 50, 1),
      100
    );

    let query = supabase
      .from("company_questions")
      .select(
        "id, company_name, role, question, question_type, difficulty, skill_id, source, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (company) {
      query = query.ilike("company_name", `%${company}%`);
    }

    if (role) {
      query = query.ilike("role", `%${role}%`);
    }

    if (difficulty) {
      query = query.eq("difficulty", difficulty);
    }

    if (skillId) {
      query = query.eq("skill_id", skillId);
    }

    const { data, error } = await query;

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

    const body = await request.json();

    if (!body.company_name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "company_name is required",
        },
        { status: 400 }
      );
    }

    if (!body.question?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "question is required",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_questions")
      .insert({
        company_name: body.company_name.trim(),
        role: body.role?.trim() ?? null,
        question: body.question.trim(),
        question_type: body.question_type?.trim() ?? null,
        difficulty: body.difficulty?.trim() ?? null,
        skill_id: body.skill_id ?? null,
        source: body.source?.trim() ?? null,
      })
      .select(
        "id, company_name, role, question, question_type, difficulty, skill_id, source, created_at"
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