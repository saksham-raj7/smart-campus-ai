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

    const { data: resume, error } = await supabase
      .from("resumes")
      .select("*")
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
      data: resume,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch resume",
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

    const resumeData = {
      user_id: user.id,
      name: body.name ?? null,
      email: body.email ?? user.email ?? null,
      phone: body.phone ?? null,
      location: body.location ?? null,
      education: body.education ?? [],
      skills: body.skills ?? [],
      projects: body.projects ?? [],
      experience: body.experience ?? [],
      internships: body.internships ?? [],
      certifications: body.certifications ?? [],
      achievements: body.achievements ?? [],
      linkedin: body.linkedin ?? null,
      github: body.github ?? null,
      portfolio: body.portfolio ?? null,
      career_objective: body.career_objective ?? null,
    };

    const { data: existingResume } = await supabase
      .from("resumes")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    let resume;
    let error;

    if (existingResume) {
      const result = await supabase
        .from("resumes")
        .update({
          ...resumeData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingResume.id)
        .eq("user_id", user.id)
        .select("*")
        .single();

      resume = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from("resumes")
        .insert(resumeData)
        .select("*")
        .single();

      resume = result.data;
      error = result.error;
    }

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
      data: resume,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save resume",
      },
      { status: 500 }
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

    const allowedFields = [
      "name",
      "email",
      "phone",
      "location",
      "education",
      "skills",
      "projects",
      "experience",
      "internships",
      "certifications",
      "achievements",
      "linkedin",
      "github",
      "portfolio",
      "career_objective",
    ];

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid fields provided",
        },
        { status: 400 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: resume, error } = await supabase
      .from("resumes")
      .update(updates)
      .eq("user_id", user.id)
      .select("*")
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
      data: resume,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update resume",
      },
      { status: 500 }
    );
  }
}