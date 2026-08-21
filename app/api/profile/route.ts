import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type ProfileBody = {
  name?: string;
  college?: string | null;
  degree?: string | null;
  branch?: string | null;
  year?: number | null;
  preferred_language?: string | null;
  career_goal?: string | null;
  resume_url?: string | null;
};

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

    const { data, error } = await supabase
      .from("student_profiles")
      .select(
        "id, user_id, name, college, degree, branch, year, preferred_language, career_goal, resume_url, created_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

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

    const body = (await request.json()) as ProfileBody;

    if (!body.name?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("student_profiles")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        college: body.college ?? null,
        degree: body.degree ?? null,
        branch: body.branch ?? null,
        year: body.year ?? null,
        preferred_language: body.preferred_language ?? "English",
        career_goal: body.career_goal ?? null,
        resume_url: body.resume_url ?? null,
      })
      .select()
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

    const body = (await request.json()) as ProfileBody;

    const updates: ProfileBody = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Name cannot be empty",
          },
          { status: 400 }
        );
      }

      updates.name = body.name.trim();
    }

    if (body.college !== undefined) updates.college = body.college;
    if (body.degree !== undefined) updates.degree = body.degree;
    if (body.branch !== undefined) updates.branch = body.branch;
    if (body.year !== undefined) updates.year = body.year;
    if (body.preferred_language !== undefined) {
      updates.preferred_language = body.preferred_language;
    }
    if (body.career_goal !== undefined) {
      updates.career_goal = body.career_goal;
    }
    if (body.resume_url !== undefined) {
      updates.resume_url = body.resume_url;
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
      .from("student_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
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