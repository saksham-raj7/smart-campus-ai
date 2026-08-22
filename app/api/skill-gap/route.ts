import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type SkillStatus = "strong" | "moderate" | "weak" | "missing";

function getStatus(
  score: number | null,
  targetScore: number
): SkillStatus {
  if (score === null) return "missing";

  const percentageOfTarget = (score / targetScore) * 100;

  if (percentageOfTarget >= 90) return "strong";
  if (percentageOfTarget >= 70) return "moderate";
  return "weak";
}

/*
 * Convert career-goal relevance into a deterministic target benchmark.
 *
 * Higher relevance means the student should reach a higher proficiency
 * level for that career goal.
 */
function getTargetScore(relevanceWeight: number): number {
  if (relevanceWeight >= 1) return 90;
  if (relevanceWeight >= 0.9) return 88;
  if (relevanceWeight >= 0.8) return 85;
  if (relevanceWeight >= 0.7) return 82;
  return 80;
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

    // Get skills required for this career.
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
          highest_impact_skill: null,
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
        const score = Number(assessment.score);

        if (Number.isFinite(score)) {
          latestScores.set(
            assessment.skill_id,
            Math.max(0, Math.min(100, score))
          );
        }
      }
    }

    const skills = requiredSkills.map((item) => {
      const skill = Array.isArray(item.skills)
        ? item.skills[0]
        : item.skills;

      const relevanceWeight = Number(item.relevance_weight);

      const targetScore = getTargetScore(relevanceWeight);

      const currentScore = latestScores.has(item.skill_id)
        ? latestScores.get(item.skill_id)!
        : null;

      const gap =
        currentScore === null
          ? targetScore
          : Math.max(0, targetScore - currentScore);

      const impactScore = gap * relevanceWeight;

      return {
        skill_id: item.skill_id,
        name: skill?.name ?? "Unknown skill",
        category: skill?.category ?? null,
        description: skill?.description ?? null,

        relevance_weight: relevanceWeight,

        current_score: currentScore,
        target_score: targetScore,
        gap: Math.round(gap * 100) / 100,

        impact_score: Math.round(impactScore * 100) / 100,

        status: getStatus(currentScore, targetScore),
      };
    });

    // Highest-impact skill = largest gap weighted by career relevance.
    const highestImpactSkill =
      skills.length > 0
        ? [...skills].sort(
            (a, b) => b.impact_score - a.impact_score
          )[0]
        : null;

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

        highest_impact_skill: highestImpactSkill,

        summary,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}