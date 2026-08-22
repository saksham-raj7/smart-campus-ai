import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
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
    const jobId = body.job_id;

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: "job_id is required",
        },
        { status: 400 }
      );
    }

    // Get the selected job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 }
      );
    }

    // Get student's profile
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get student's skills
    const { data: skills } = await supabase
      .from("skills")
      .select("*")
      .eq("user_id", user.id);

    // Get saved resume as an additional source of skills
    const { data: resume } = await supabase
      .from("resumes")
      .select("skills")
      .eq("user_id", user.id)
      .maybeSingle();

    const studentSkills = new Set<string>();

    if (Array.isArray(skills)) {
      for (const skill of skills) {
        if (typeof skill.name === "string") {
          studentSkills.add(normalizeSkill(skill.name));
        }

        if (typeof skill.skill_name === "string") {
          studentSkills.add(normalizeSkill(skill.skill_name));
        }
      }
    }

    if (Array.isArray(resume?.skills)) {
      for (const skill of resume.skills) {
        if (typeof skill === "string") {
          studentSkills.add(normalizeSkill(skill));
        } else if (
          skill &&
          typeof skill === "object" &&
          "name" in skill &&
          typeof skill.name === "string"
        ) {
          studentSkills.add(normalizeSkill(skill.name));
        }
      }
    }

    const requiredSkills = Array.isArray(job.required_skills)
      ? job.required_skills
          .filter((skill: unknown) => typeof skill === "string")
          .map((skill: string) => normalizeSkill(skill))
      : [];

    if (requiredSkills.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          job_id: job.id,
          match_score: 0,
          matching_skills: [],
          missing_skills: [],
          message: "This job does not have any required skills listed.",
          profile_found: !!profile,
        },
      });
    }

    const matchingSkills = requiredSkills.filter((skill: string) =>
      studentSkills.has(skill)
    );

    const missingSkills = requiredSkills.filter(
      (skill: string) => !studentSkills.has(skill)
    );

    const matchScore = Math.round(
      (matchingSkills.length / requiredSkills.length) * 100
    );

    return NextResponse.json({
      success: true,
      data: {
        job_id: job.id,
        match_score: matchScore,
        matching_skills: matchingSkills,
        missing_skills: missingSkills,
        total_required_skills: requiredSkills.length,
        matched_skill_count: matchingSkills.length,
        profile_found: !!profile,
      },
    });
  } catch (error) {
    console.error("Job Matching Error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to calculate job match",
      },
      { status: 500 }
    );
  }
}