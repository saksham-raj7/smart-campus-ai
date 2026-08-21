import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
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
      .select("id, name, career_goal")
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

    /*
     * 1. SKILL SCORE
     * Use the latest assessment for each skill, then average them.
     */
    const { data: skillAssessments, error: skillError } = await supabase
      .from("skill_assessments")
      .select("skill_id, score, assessed_at")
      .eq("student_id", profile.id)
      .order("assessed_at", { ascending: false });

    if (skillError) {
      return NextResponse.json(
        {
          success: false,
          error: skillError.message,
        },
        { status: 500 }
      );
    }

    const latestSkillScores = new Map<string, number>();

    for (const assessment of skillAssessments ?? []) {
      if (!latestSkillScores.has(assessment.skill_id)) {
        latestSkillScores.set(
          assessment.skill_id,
          clampScore(Number(assessment.score))
        );
      }
    }

    const skillValues = Array.from(latestSkillScores.values());

    const skillScore =
      skillValues.length > 0
        ? skillValues.reduce((sum, score) => sum + score, 0) /
          skillValues.length
        : null;

    /*
     * 2. COMMUNICATION SCORE
     * Use the latest communication assessment.
     */
    const { data: communicationAssessment, error: communicationError } =
      await supabase
        .from("communication_assessments")
        .select("score, assessed_at")
        .eq("student_id", profile.id)
        .not("score", "is", null)
        .order("assessed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (communicationError) {
      return NextResponse.json(
        {
          success: false,
          error: communicationError.message,
        },
        { status: 500 }
      );
    }

    const communicationScore =
      communicationAssessment?.score != null
        ? clampScore(Number(communicationAssessment.score))
        : null;

    /*
     * 3. PRACTICE SCORE
     * Average the student's recorded practice scores.
     */
    const { data: practiceAttempts, error: practiceError } = await supabase
      .from("practice_attempts")
      .select("score, attempted_at")
      .eq("student_id", profile.id)
      .not("score", "is", null);

    if (practiceError) {
      return NextResponse.json(
        {
          success: false,
          error: practiceError.message,
        },
        { status: 500 }
      );
    }

    const practiceValues = (practiceAttempts ?? []).map((attempt) =>
      clampScore(Number(attempt.score))
    );

    const practiceScore =
      practiceValues.length > 0
        ? practiceValues.reduce((sum, score) => sum + score, 0) /
          practiceValues.length
        : null;

    /*
     * 4. INTERVIEW SCORE
     * Use the latest completed interview with an overall score.
     */
    const { data: interviewSession, error: interviewError } = await supabase
      .from("interview_sessions")
      .select("overall_score, completed_at")
      .eq("student_id", profile.id)
      .not("overall_score", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (interviewError) {
      return NextResponse.json(
        {
          success: false,
          error: interviewError.message,
        },
        { status: 500 }
      );
    }

    const interviewScore =
      interviewSession?.overall_score != null
        ? clampScore(Number(interviewSession.overall_score))
        : null;

    /*
     * READINESS FORMULA
     *
     * Skill        = 50%
     * Communication = 20%
     * Practice      = 15%
     * Interview     = 15%
     *
     * If a component is not available yet, we exclude its weight
     * rather than treating missing data as zero.
     */
    const components = [
      {
        name: "skill",
        score: skillScore,
        weight: 0.5,
      },
      {
        name: "communication",
        score: communicationScore,
        weight: 0.2,
      },
      {
        name: "practice",
        score: practiceScore,
        weight: 0.15,
      },
      {
        name: "interview",
        score: interviewScore,
        weight: 0.15,
      },
    ];

    const availableComponents = components.filter(
      (component) => component.score !== null
    );

    const totalAvailableWeight = availableComponents.reduce(
      (sum, component) => sum + component.weight,
      0
    );

    const readinessScore =
      totalAvailableWeight > 0
        ? availableComponents.reduce(
            (sum, component) =>
              sum + (component.score ?? 0) * component.weight,
            0
          ) / totalAvailableWeight
        : null;

    let readinessLevel: "not_started" | "needs_work" | "developing" | "ready";

    if (readinessScore === null) {
      readinessLevel = "not_started";
    } else if (readinessScore < 50) {
      readinessLevel = "needs_work";
    } else if (readinessScore < 75) {
      readinessLevel = "developing";
    } else {
      readinessLevel = "ready";
    }

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: profile.id,
          name: profile.name,
          career_goal: profile.career_goal,
        },

        readiness: {
          score:
            readinessScore !== null
              ? Math.round(readinessScore * 100) / 100
              : null,
          level: readinessLevel,
        },

        breakdown: {
          skill_score:
            skillScore !== null
              ? Math.round(skillScore * 100) / 100
              : null,
          communication_score:
            communicationScore !== null
              ? Math.round(communicationScore * 100) / 100
              : null,
          practice_score:
            practiceScore !== null
              ? Math.round(practiceScore * 100) / 100
              : null,
          interview_score:
            interviewScore !== null
              ? Math.round(interviewScore * 100) / 100
              : null,
        },

        available_components: availableComponents.map(
          (component) => component.name
        ),
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