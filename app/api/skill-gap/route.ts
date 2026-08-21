import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type SkillStatus = "strong" | "moderate" | "weak" | "missing";

function getStatus(score: number | null): SkillStatus {
  if (score === null) return "missing";
  if (score >= 75) return "strong";
  if (score >= 50) return "moderate";
  return "weak";
}

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

    // Find the student's profile.
    const { data: profile, error: profileError } = await supabase
      .from("student_profiles")
      .select("id, career_goal")
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

    if (!profile.career_goal) {
      return NextResponse.json(
        {
          success: false,
          error: "Career goal not set",
        },
        { status: 400 }
      );
    }

    // Find the selected career goal.
    const { data: careerGoal, error: careerGoalError } = await supabase
      .from("career_goals")
      .select("id, name, description")
      .eq("name", profile.career_goal)
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

    // Get the skills required for this career.
    const { data: requiredSkills, error: requiredSkillsError } =
      await supabase
        .from("career_goal_skills")
        .select(
          "skill_id, relevance_weight, skills(id, name, category, description)"
        )
        .eq("career_goal_id", careerGoal.id);

    if (requiredSkillsError) {
      return NextResponse.json(
        {
          success: false,
          error: requiredSkillsError.message,
        },
        { status: 500 }
      );
    }

    if (!requiredSkills || requiredSkills.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          career_goal: careerGoal,
          skills: [],
          summary: {
            total_skills: 0,
            strong: 0,
            moderate: 0,
            weak: 0,
            missing: 0,
          },
        },
      });
    }

    // Get all assessments for this student.
    const { data: assessments, error: assessmentsError } = await supabase
      .from("skill_assessments")
      .select("skill_id, score, assessed_at")
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false });

    if (assessmentsError) {
      return NextResponse.json(
        {
          success: false,
          error: assessmentsError.message,
        },
        { status: 500 }
      );
    }

    // Keep only the latest assessment for each skill.
    const latestScores = new Map<string, number>();

    for (const assessment of assessments ?? []) {
      if (!latestScores.has(assessment.skill_id)) {
        latestScores.set(assessment.skill_id, Number(assessment.score));
      }
    }

    const skills = requiredSkills.map((item) => {
      const skill = Array.isArray(item.skills) ? item.skills[0] : item.skills;

      const score = latestScores.has(item.skill_id)
        ? latestScores.get(item.skill_id)!
        : null;

      const gap = score === null ? 100 : Math.max(0, 100 - score);

      return {
        skill_id: item.skill_id,
        name: skill?.name ?? "Unknown skill",
        category: skill?.category ?? null,
        description: skill?.description ?? null,
        relevance_weight: Number(item.relevance_weight),
        current_score: score,
        gap,
        status: getStatus(score),
      };
    });

    const summary = {
      total_skills: skills.length,
      strong: skills.filter((skill) => skill.status === "strong").length,
      moderate: skills.filter((skill) => skill.status === "moderate").length,
      weak: skills.filter((skill) => skill.status === "weak").length,
      missing: skills.filter((skill) => skill.status === "missing").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        career_goal: careerGoal,
        skills,
        summary,
      },
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